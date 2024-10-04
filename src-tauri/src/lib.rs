// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::Mutex;

use tauri::{Emitter, Manager};

#[derive(Debug, serde::Deserialize)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum SattelMessage {
    Error(SattelError),
    LoginFailed,
    Crawl { crawler: String },
    DownloadBar(ProgressBarMessage),
    CrawlBar(ProgressBarMessage),
    Request { subject: RequestSubject },
}

#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
#[error("{exception}: {message}")]
struct SattelError {
    exception: String,
    message: String,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
enum RequestSubject {
    Password,
    Username,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProgressBarMessage {
    id: u32,
    event: ProgressBarEvent,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum ProgressBarEvent {
    Begin { path: String },
    Advance { progress: u32 },
    SetTotal { total: u32 },
    Done,
}

struct AppState {
    sattel_path: Mutex<Option<Box<Path>>>,
}

#[tauri::command]
async fn run_sattel(
    json_args: String,
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), SattelError> {
    // let config_dir = app_handle.path().config_dir();

    let sattel_guard = state.sattel_path.lock().unwrap();
    let sattel_path = sattel_guard.as_ref().unwrap();
    let child = Command::new(&**sattel_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdin = child.stdin.unwrap();
    writeln!(stdin, "{}", json_args).unwrap();

    let stdout = child.stdout.unwrap();
    let reader = BufReader::new(stdout);

    for line in reader.lines() {
        let line = line.unwrap();
        let message: SattelMessage =
            serde_json::from_str(&line).expect("invalid json message from sattel");
        match message {
            SattelMessage::Error(error) => return Err(error),
            SattelMessage::LoginFailed => app_handle.emit("loginFailed", ()),
            SattelMessage::Crawl { crawler } => app_handle.emit("crawl", crawler),
            SattelMessage::DownloadBar(msg) => app_handle.emit("downloadBar", msg),
            SattelMessage::CrawlBar(msg) => app_handle.emit("crawlBar", msg),
            SattelMessage::Request { subject } => app_handle.emit("request", subject),
        }
        .unwrap();
        println!("{}", line);
    }

    Ok(())
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sattel_path: None.into(),
        })
        .setup(|app| {
            let sattel = app
                .path()
                .resolve(
                    "../../sattel/dist/sattel",
                    tauri::path::BaseDirectory::Resource,
                )?
                .into_boxed_path();
            *app.state::<AppState>().sattel_path.lock().unwrap() = Some(sattel);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_window, run_sattel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
