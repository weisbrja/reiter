use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::time::Duration;
use std::time::Instant;

use configparser::ini::Ini;
use configparser::ini::IniDefault;
use notify::Watcher;
use tauri::Emitter;
use tauri::{async_runtime, Manager};

use crate::AppState;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Crawler {
    name: String,
    target: String,
    videos: bool,
    // TODO: support all documented useful fields
    // TODO: consider defaults
    // auth: String,
    // videos: bool,
    // r#type: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    working_dir: Box<Path>,
    crawlers: Vec<Crawler>,
}

// TODO
#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum Error {
    #[error("failed parsing config: {0}")]
    FailedParsing(String),
    #[error("config missing attribute: {0}")]
    MissingAttr(&'static str),
}

#[tauri::command]
pub fn parse_config(state: tauri::State<AppState>) -> Result<Config, Error> {
    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    let mut defaults = IniDefault::default();
    defaults.case_sensitive = true;
    defaults.default_section = "DEFAULT".to_owned();
    let mut config = Ini::new_from_defaults(defaults);
    let map = config.load(config_file).map_err(Error::FailedParsing)?;

    const CRAWL_PREFIX: &str = "crawl:";
    let crawlers: Result<Vec<Crawler>, _> = map
        .iter()
        .filter(|(name, _)| name.starts_with(CRAWL_PREFIX))
        .map(|(name, section)| {
            let target = section
                .get("target")
                .cloned()
                .flatten()
                .ok_or(Error::MissingAttr("target"))?;
            let videos = config
                .getboolcoerce(name, "videos")
                .map_err(Error::FailedParsing)?
                .unwrap_or(false);
            let name = name[CRAWL_PREFIX.len()..].to_owned();
            Ok(Crawler {
                name,
                target,
                videos,
            })
        })
        .collect();

    let working_dir = config
        .get("default", "working_dir")
        .unwrap_or(".".to_owned());
    let working_dir = shellexpand::tilde(&working_dir).to_string();
    let working_dir = PathBuf::from(working_dir).into_boxed_path();
    Ok(Config {
        crawlers: crawlers?,
        working_dir,
    })
}

#[tauri::command]
pub fn ensure_default_config(state: tauri::State<AppState>, app: tauri::AppHandle) {
    println!("reiter: ensuring default config");
    let default_config_file = app
        .path()
        .resolve("../sattel/sattel.cfg", tauri::path::BaseDirectory::Resource)
        .unwrap();

    let config_dir = state.config_dir.read().unwrap();
    let config_dir = config_dir.as_ref().unwrap();

    let _ = std::fs::create_dir_all(config_dir);

    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    if !config_file.exists() {
        std::fs::copy(default_config_file, config_file).unwrap();
        println!("reiter: create default config");
    }
}

#[tauri::command]
pub async fn watch_config(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), ()> {
    if state.watching_config.load(Ordering::SeqCst) {
        return Err(());
    }

    state.watching_config.store(true, Ordering::SeqCst);

    let (tx, mut rx) = async_runtime::channel(1);

    let mut watcher = notify::RecommendedWatcher::new(
        move |result| {
            async_runtime::block_on(async {
                tx.send(result).await.unwrap();
            });
        },
        notify::Config::default(),
    )
    .unwrap();

    let config_dir = state.config_dir.read().unwrap().clone().unwrap();

    watcher
        .watch(&config_dir, notify::RecursiveMode::Recursive)
        .unwrap();

    let config_file = state.config_file.read().unwrap().clone().unwrap();

    let cooldown = Duration::from_millis(100);
    let mut last_config_change = Instant::now() - cooldown;

    while let Some(result) = rx.recv().await {
        let event = result.unwrap();
        let config_file_changed = event.paths.into_iter().any(|path| path == *config_file);
        if config_file_changed {
            let now = Instant::now();
            if now.duration_since(last_config_change) >= cooldown {
                last_config_change = now;
                println!("reiter: config file changed");
                tokio::time::sleep(Duration::from_millis(50)).await;
                app.emit("configFileChanged", ()).unwrap();
                println!("reiter: emitted file changed event");
            }
        }
    }

    Ok(())
}
