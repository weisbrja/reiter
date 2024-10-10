use std::path::Path;
use std::path::PathBuf;
use std::time::Duration;
use std::time::Instant;

use configparser::ini::Ini;
use notify::Watcher;
use tauri::Emitter;
use tauri::{async_runtime, Manager};

use crate::AppState;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Crawler {
    name: String,
    target: String,
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
// #[derive(Debug, thiserror::Error)]
// enum Error {
//     ConfigParseFailed(String),
//     Missing(String)
// }

#[tauri::command]
pub fn parse_config(state: tauri::State<AppState>) -> Result<Config, String> {
    let mut config = Ini::new();
    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();
    let map = config.load(config_file)?;

    let crawlers = map
        .iter()
        .filter(|(name, _)| name.starts_with("crawl:"))
        .map(|(name, section)| Crawler {
            name: name.clone(),
            // TODO: handle error
            target: section
                .get("target")
                .expect("field not found")
                .clone()
                .unwrap(),
        })
        .collect();

    let working_dir = config
        .get("default", "working_dir")
        .unwrap_or(".".to_owned());
    let working_dir = shellexpand::tilde(&working_dir).to_string();
    let working_dir = PathBuf::from(working_dir).into_boxed_path();
    Ok(Config {
        crawlers,
        working_dir,
    })
}

#[tauri::command]
pub fn ensure_default_config(state: tauri::State<AppState>, app: tauri::AppHandle) {
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
    }
}

#[tauri::command]
pub async fn watch_config(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), ()> {
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
                app.emit("configFileChanged", ()).unwrap();
                println!("config file changed");
            }
        }
    }

    Ok(())
}
