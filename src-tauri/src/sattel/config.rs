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
    // TODO: support all documented useful fields
    name: String,
    target: String,
    r#type: String,
    videos: bool,
    // TODO: add proper support for auth
    auth: String,
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

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("failed parsing config: {0}")]
    FailedConfigParse(String),
    #[error("failed writing config: {0}")]
    FailedConfigWrite(String),
    #[error("config attribute can't be empty: {0}")]
    ConfigEmptyAttr(&'static str),
    #[error("config missing attribute: {0}")]
    ConfigMissingAttr(&'static str),
    #[error("crawler does not exist: {0}")]
    CrawlerDoesNotExist(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[tauri::command]
pub fn parse_config(state: tauri::State<AppState>) -> Result<Config, Error> {
    let config_file = state.config_file.read().unwrap();
    let config_file = config_file.as_ref().unwrap();

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();
    let map = ini.load(config_file).map_err(Error::FailedConfigParse)?;

    let default_section = map
        .get(Settings::SECTION_NAME)
        .ok_or(Error::FailedConfigParse("no default section".to_owned()))?;

    let working_dir = default_section
        .get("working_dir")
        .cloned()
        .ok_or(Error::ConfigEmptyAttr("working_dir"))?
        .unwrap_or(".".to_owned());
    // let working_dir = shellexpand::tilde(&working_dir).to_string();
    let working_dir = PathBuf::from(working_dir).into_boxed_path();

    let settings = Settings { working_dir };

    const CRAWL_PREFIX: &str = "crawl:";

    let crawlers = map
        .iter()
        .filter(|(name, _)| name.starts_with(CRAWL_PREFIX))
        .map(|(name, section)| {
            let target = section
                .get("target")
                .cloned()
                .flatten()
                .ok_or(Error::ConfigMissingAttr("target"))?;

            let videos = match ini
                .getboolcoerce(name, "videos")
                .map_err(Error::FailedConfigParse)?
            {
                Some(videos) => videos,
                None => ini
                    .getboolcoerce(Settings::SECTION_NAME, "videos")
                    .map_err(Error::FailedConfigParse)?
                    .unwrap_or(false),
            };

            let r#type = section
                .get("type")
                .or_else(|| default_section.get("type"))
                .cloned()
                .ok_or(Error::ConfigEmptyAttr("type"))?
                .ok_or(Error::ConfigMissingAttr("type"))?;
            if !matches!(
                r#type.as_str(),
                "kit-ilias-web" | "kit-ipd" | "ilias-web" | "local"
            ) {
                return Err(Error::FailedConfigParse(format!(
                    "crawler type '{type}' does not exist"
                )));
            }

            let auth = section
                .get("auth")
                .or_else(|| default_section.get("auth"))
                .cloned()
                .ok_or(Error::ConfigEmptyAttr("auth"))?
                .ok_or(Error::ConfigMissingAttr("auth"))?;
            if !map.contains_key(&auth) {
                return Err(Error::FailedConfigParse(format!(
                    "auth section '{auth}' does not exist"
                )));
            }

            let name = name[CRAWL_PREFIX.len()..].to_owned();

            Ok(Crawler {
                name,
                target,
                auth,
                videos,
                r#type,
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

    log::info!(target: "reiter", "saving settings");

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
    .map_err(|e| Error::FailedConfigWrite(e.to_string()))
}

#[tauri::command]
pub fn save_crawler(
    state: tauri::State<AppState>,
    old_crawler_name: Option<String>,
    new_crawler: Crawler,
) -> Result<(), Error> {
    parse_config(state.clone())?;

    log::info!(target: "reiter", "saving crawler");

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();

    let section = format!("crawl:{}", new_crawler.name);
    if let Some(old_crawler_name) = old_crawler_name {
        if old_crawler_name != new_crawler.name {
            let old_section = format!("crawl:{old_crawler_name}");
            let map = ini
                .remove_section(&old_section)
                .ok_or(Error::CrawlerDoesNotExist(old_crawler_name))?;
            for (key, val) in map {
                ini.set(&section, &key, val);
            }
        }
    }
    ini.set(&section, "target", Some(new_crawler.target));
    ini.set(&section, "videos", Some(new_crawler.videos.to_string()));
    ini.set(&section, "type", Some(new_crawler.r#type));

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
    .map_err(|e| Error::FailedConfigWrite(e.to_string()))
}

#[tauri::command]
pub fn crawler_exists(state: tauri::State<AppState>, crawler_name: &str) -> Result<bool, Error> {
    parse_config(state.clone())?;

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();

    let section = format!("crawl:{crawler_name}");
    Ok(ini.get_map_ref().get(&section).is_some())
}

#[tauri::command]
pub fn delete_crawler(state: tauri::State<AppState>, crawler_name: String) -> Result<(), Error> {
    parse_config(state.clone())?;

    let mut ini = state.ini.write().unwrap();
    let ini = ini.as_mut().unwrap();

    let section = format!("crawl:{crawler_name}");
    ini.remove_section(&section)
        .ok_or(Error::CrawlerDoesNotExist(crawler_name))?;

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
    .map_err(|e| Error::FailedConfigWrite(format!("{e:?}")))
}

#[tauri::command]
pub async fn watch_config(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if state.watching_config.load(Ordering::SeqCst) {
        return Ok(());
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
    let config_file = state.config_file.read().unwrap().clone().unwrap();

    let _ = std::fs::create_dir_all(config_dir.as_ref());

    // TODO: improve the behavior on config dir delete
    watcher
        .watch(&config_dir, notify::RecursiveMode::Recursive)
        .map_err(|e| format!("{e:?}"))
        .inspect_err(|e| log::error!(target: "reiter", "watch config: {e}"))?;
    log::info!(target: "reiter", "watching config");

    if !config_file.exists() {
        // create default config file
        let default_config_file = app
            .path()
            .resolve("../sattel/sattel.cfg", tauri::path::BaseDirectory::Resource)
            .unwrap();
        std::fs::copy(default_config_file, &config_file).unwrap();
        log::info!(target: "reiter", "created default config");
    }

    let cooldown = Duration::from_millis(300);
    let mut last_config_change = Instant::now() - cooldown;

    while let Some(result) = rx.recv().await {
        let event = result
            .map_err(|e| format!("{e:?}"))
            .inspect_err(|e| log::error!(target: "reiter", "watch config: {e}"))?;
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

    log::info!(target: "reiter", "watching config stopped");

    state.watching_config.store(false, Ordering::SeqCst);

    Err("watching config stopped".to_owned())
}
