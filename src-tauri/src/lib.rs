use std::path::Path;
use std::sync::RwLock;

use tauri::path::BaseDirectory;
use tauri::Manager;

mod sattel;

struct AppState {
    sattel_exe: RwLock<Option<Box<Path>>>,
    config_file: RwLock<Option<Box<Path>>>,
    config_dir: RwLock<Option<Box<Path>>>,
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sattel_exe: None.into(),
            config_file: None.into(),
            config_dir: None.into(),
        })
        .setup(|app| {
            let sattel = app
                .path()
                .resolve("../sattel/dist/sattel", BaseDirectory::Resource)?
                .into_boxed_path();
            *app.state::<AppState>().sattel_exe.write().unwrap() = Some(sattel);

            let config_dir = app.path().app_config_dir().unwrap().into_boxed_path();

            let config_file = config_dir.join("sattel.cfg").into_boxed_path();
            *app.state::<AppState>().config_dir.write().unwrap() = Some(config_dir);
            *app.state::<AppState>().config_file.write().unwrap() = Some(config_file);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_window,
            sattel::run_sattel,
            sattel::config::ensure_default_config,
            sattel::config::parse_config,
            sattel::config::watch_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
