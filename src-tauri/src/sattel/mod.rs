use crate::AppState;
use std::process::Stdio;
use tauri::Emitter;
use tauri::{async_runtime, Listener};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

pub mod config;

#[derive(Debug, serde::Deserialize)]
#[serde(tag = "kind")]
#[serde(rename_all = "camelCase")]
enum Message {
    Error(Error),
    LoginFailed,
    Crawl { name: String },
    ProgressBar(ProgressBarMessagePayload),
    Request { subject: RequestSubject },
    Log { info: String },
}

#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
#[error("{exception}: {message}")]
pub struct Error {
    exception: String,
    message: String,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
enum RequestSubject {
    ConfigFilePath,
    Password,
    Username,
    JsonArgs,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressBarMessagePayload {
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

#[tauri::command]
pub async fn run_sattel(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    progress_bar_msgs: tauri::ipc::Channel<ProgressBarMessagePayload>,
) -> Result<(), Error> {
    let sattel_cmd = state.sattel_exe.read().unwrap().clone().unwrap();

    let mut child = Command::new(&*sattel_cmd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdin = child.stdin.take().unwrap();
    let stdout = child.stdout.take().unwrap();

    let (child_stdin_tx, mut child_stdin_rx) = async_runtime::channel(100);
    let response_unlisten = {
        let child_stdin_tx = child_stdin_tx.clone();
        app.listen("response", move |event| {
            let response: String =
                serde_json::from_str(event.payload()).expect("invalid json message from frontend");
            let child_stdin_tx = child_stdin_tx.clone();
            async_runtime::block_on(async move {
                child_stdin_tx.send(response).await.unwrap();
            });
        })
    };

    let (cancel_tx, mut cancel_rx) = async_runtime::channel(1);
    let cancel_unlisten = app.listen("cancel", move |_event| {
        let cancel_tx = cancel_tx.clone();
        async_runtime::block_on(async move {
            let _ = cancel_tx.send(()).await;
        });
    });

    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    let mut advance_count = 0u8;

    loop {
        tokio::select! {
            Some(()) = cancel_rx.recv() => break,
            Some(response) = child_stdin_rx.recv() => {
                stdin.write_all(response.as_bytes()).await.unwrap();
                let _ = stdin.write(b"\n").await.unwrap();
                stdin.flush().await.unwrap();
            }
            Ok(Some(line)) = lines.next_line() => {
                let message: Message =
                    serde_json::from_str(&line).expect("invalid json message from sattel");
                match message {
                    Message::Error(error) => return Err(error),
                    Message::LoginFailed => app.emit("loginFailed", ()).unwrap(),
                    Message::Crawl { name } => app.emit("crawl", name).unwrap(),
                    Message::ProgressBar(ref payload @ ProgressBarMessagePayload { ref event, .. }) => {
                        if let ProgressBarEvent::Advance { .. } = event {
                            advance_count += 1;
                            if advance_count == 100 {
                                advance_count = 0;
                                progress_bar_msgs.send(payload.clone()).unwrap();
                            }
                        } else {
                            progress_bar_msgs.send(payload.clone()).unwrap();
                        }
                    }
                    Message::Request { subject: RequestSubject::ConfigFilePath } => {
                        let config_file_path = state.config_file.read().unwrap().clone().unwrap();
                        let config_file_path = config_file_path.to_str().unwrap().to_owned();
                        child_stdin_tx.send(config_file_path).await.unwrap();
                    },
                    Message::Request { subject } => app.emit("request", subject).unwrap(),
                    Message::Log { info } => log::info!(target: "sattel", "{}", info),
                }
            }
        }
    }

    app.unlisten(response_unlisten);
    app.unlisten(cancel_unlisten);
    child.kill().await.unwrap();
    child.wait().await.unwrap();
    log::info!(target: "reiter", "canceled sattel");

    Ok(())
}
