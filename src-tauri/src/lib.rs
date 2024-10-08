// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::path::Path;
use std::process::Stdio;
use std::sync::RwLock;
use tauri::ipc::Channel;
use tauri::Listener;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use tauri::{Emitter, Manager};

#[derive(Debug, serde::Deserialize)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum SattelMsg {
    Error(SattelError),
    LoginFailed,
    Crawler { crawler: String },
    ProgressBar(ProgressBarMsgPayload),
    Request { subject: RequestSubject },
    Info { info: String },
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
    JsonArgs,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressBarMsgPayload {
    id: u32,
    event: ProgressBarEvent,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum ProgressBarEvent {
    Begin { bar: ProgressBarKind, path: String },
    Advance { progress: u32 },
    SetTotal { total: u32 },
    Done,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
enum ProgressBarKind {
    Download,
    Crawl,
}

struct AppState {
    sattel_path: RwLock<Option<Box<Path>>>,
}

#[tauri::command]
async fn run_sattel(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    progress_bar_event: Channel<ProgressBarMsgPayload>,
) -> Result<(), SattelError> {
    // let config_dir = app_handle.path().config_dir();

    let sattel_path = state.sattel_path.read().unwrap().clone().unwrap();

    let mut child = Command::new(&*sattel_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdin = child.stdin.take().unwrap();
    let stdout = child.stdout.take().unwrap();

    let (child_stdin_tx, mut child_stdin_rx) = mpsc::channel(100);
    let response_unlisten = app.listen("response", move |event| {
        let response: String =
            serde_json::from_str(event.payload()).expect("invalid json message from frontend");
        let child_stdin_tx_clone = child_stdin_tx.clone();
        tauri::async_runtime::spawn(async move {
            child_stdin_tx_clone.send(response).await.unwrap();
        });
    });

    let (cancel_tx, mut cancel_rx) = mpsc::channel(1);
    let cancel_unlisten = app.listen("cancel", move |_event| {
        let cancel_tx_clone = cancel_tx.clone();
        tauri::async_runtime::spawn(async move {
            cancel_tx_clone.send(()).await.unwrap();
        });
    });

    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    let mut advance_count = 0u8;

    loop {
        tokio::select! {
            Some(()) = cancel_rx.recv() => {
                child.kill().await.unwrap();
                break;
            }
            Some(response) = child_stdin_rx.recv() => {
                stdin.write_all(response.as_bytes()).await.unwrap();
                stdin.write(b"\n").await.unwrap();
                stdin.flush().await.unwrap();
            }
            Ok(Some(line)) = lines.next_line() => {
                let message: SattelMsg =
                    serde_json::from_str(&line).expect("invalid json message from sattel");
                match message {
                    SattelMsg::Error(error) => return Err(error),
                    SattelMsg::LoginFailed => app.emit("loginFailed", ()).unwrap(),
                    SattelMsg::Crawler { crawler } => app.emit("crawl", crawler).unwrap(),
                    SattelMsg::ProgressBar(ref payload @ ProgressBarMsgPayload { ref event, .. }) => {
                        if let ProgressBarEvent::Advance { .. } = event {
                            advance_count += 1;
                            if advance_count == 100 {
                                advance_count = 0;
                                progress_bar_event.send(payload.clone()).unwrap();
                            }
                        } else {
                            progress_bar_event.send(payload.clone()).unwrap();
                        }
                    }
                    SattelMsg::Request { subject } => app.emit("request", subject).unwrap(),
                    SattelMsg::Info { info } => println!("sattel: {}", info),
                }
            }
        }
    }

    app.unlisten(response_unlisten);
    app.unlisten(cancel_unlisten);
    println!("killed child");

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
            *app.state::<AppState>().sattel_path.write().unwrap() = Some(sattel);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_window, run_sattel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
