use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::time::Duration;
use std::time::Instant;

use configparser::ini::WriteOptions;
use notify::Watcher;
use tauri::Emitter;
use tauri::{async_runtime, Manager};

use crate::AppState;

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Crawler {
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
    settings: Settings,
    crawlers: Vec<Crawler>,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    working_dir: Box<Path>,
}

impl Settings {
    pub const SECTION_NAME: &str = "DEFAULT";
}

// TODO
#[derive(Debug, thiserror::Error, serde::Serialize)]
pub enum Error {
    #[error("failed parsing config: {0}")]
    FailedParsing(String),
    #[error("config missing attribute: {0}")]
    MissingAttr(&'static str),
    #[error("failed writing config: {0}")]
    WriteError(String),
}

#[tauri::command]
pub fn parse_config(state: tauri::State<AppState>) -> Result<Config, Error> {
    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();
    ini.load(config_file).map_err(Error::FailedParsing)?;

    let working_dir = ini
        .get(Settings::SECTION_NAME, "working_dir")
        .unwrap_or(".".to_owned());
    // let working_dir = shellexpand::tilde(&working_dir).to_string();
    let working_dir = PathBuf::from(working_dir).into_boxed_path();

    let settings = Settings { working_dir };

    const CRAWL_PREFIX: &str = "crawl:";
    let crawlers = ini
        .get_map_ref()
        .iter()
        .filter(|(name, _)| name.starts_with(CRAWL_PREFIX))
        .map(|(name, section)| {
            let target = section
                .get("target")
                .cloned()
                .flatten()
                .ok_or(Error::MissingAttr("target"))?;
            let videos = ini
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
        .collect::<Result<_, _>>()?;

    Ok(Config { settings, crawlers })
}

#[cfg(windows)]
const LINE_ENDING: &str = "\r\n";
#[cfg(not(windows))]
const LINE_ENDING: &str = "\n";

#[tauri::command]
pub fn save_settings(state: tauri::State<AppState>, settings: Settings) -> Result<(), Error> {
    parse_config(state.clone())?;

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();

    let working_dir = settings.working_dir.to_str().unwrap();
    if working_dir != "." {
        ini.set(
            Settings::SECTION_NAME,
            "working_dir",
            Some(working_dir.to_string()),
        );
    }

    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    std::fs::write(
        config_file,
        format!(
            "[{}]{LINE_ENDING}{}",
            Settings::SECTION_NAME,
            ini.pretty_writes(&WriteOptions::new_with_params(true, 4, 1))
        ),
    )
    .map_err(|e| Error::WriteError(e.to_string()))
}

#[tauri::command]
pub fn save_crawler(state: tauri::State<AppState>, crawler: Crawler) -> Result<(), Error> {
    parse_config(state.clone())?;

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();

    let section = format!("crawl:{}", crawler.name);
    ini.set(&section, "target", Some(crawler.target));
    ini.set(&section, "videos", Some(crawler.videos.to_string()));

    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    std::fs::write(
        config_file,
        format!(
            "[{}]{LINE_ENDING}{}",
            Settings::SECTION_NAME,
            ini.pretty_writes(&WriteOptions::new_with_params(true, 4, 1))
        ),
    )
    .map_err(|e| Error::WriteError(e.to_string()))
}

#[tauri::command]
pub fn ensure_default_config(state: tauri::State<AppState>, app: tauri::AppHandle) {
    log::debug!(target: "reiter", "ensuring default config");
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
        log::info!(target: "reiter", "creating default config");
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

    let cooldown = Duration::from_millis(300);
    let mut last_config_change = Instant::now() - cooldown;

    while let Some(result) = rx.recv().await {
        let event = result.unwrap();
        let config_file_changed = event.paths.into_iter().any(|path| path == *config_file);
        if config_file_changed {
            let now = Instant::now();
            if now.duration_since(last_config_change) >= cooldown {
                last_config_change = now;
                log::info!(target: "reiter", "config file changed");
                let app = app.clone();
                async_runtime::spawn(async move {
                    tokio::time::sleep(cooldown / 3).await;
                    app.emit("configFileChanged", ()).unwrap();
                    log::debug!(target: "reiter", "emitting file changed event");
                });
            }
        }
    }

    Ok(())
}
