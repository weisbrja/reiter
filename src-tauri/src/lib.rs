use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::RwLock;

use configparser::ini::{Ini, IniDefault};
use tauri::path::BaseDirectory;
use tauri::Manager;

use self::sattel::config::Settings;

mod sattel;

struct AppState {
    sattel_exe: RwLock<Option<Box<Path>>>,
    config_file: RwLock<Option<Box<Path>>>,
    config_dir: RwLock<Option<Box<Path>>>,
    watching_config: AtomicBool,
    ini: RwLock<Option<Ini>>,
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    log::debug!(target: "reiter", "showing window");
    window.show().unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::builder()
        .format_timestamp_secs()
        .filter_level(log::LevelFilter::Debug)
        .init();

    tauri::Builder::default()
        .manage(AppState {
            sattel_exe: None.into(),
            config_file: None.into(),
            config_dir: None.into(),
            watching_config: false.into(),
            ini: None.into(),
        })
        .setup(|app| {
            let sattel = app
                .path()
                .resolve("../sattel/dist/sattel", BaseDirectory::Resource)?
                .into_boxed_path();
            let state = app.state::<AppState>();
            *state.sattel_exe.write().unwrap() = Some(sattel);

            let config_dir = app.path().app_config_dir().unwrap().into_boxed_path();

            let config_file = config_dir.join("sattel.cfg").into_boxed_path();
            *state.config_dir.write().unwrap() = Some(config_dir);
            *state.config_file.write().unwrap() = Some(config_file);

            let mut defaults = IniDefault::default();
            defaults.case_sensitive = true;
            Settings::SECTION_NAME.clone_into(&mut defaults.default_section);
            let ini = Ini::new_from_defaults(defaults);
            *state.ini.write().unwrap() = Some(ini);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_window,
            sattel::run_sattel,
            sattel::config::parse_config,
            sattel::config::save_crawler,
            sattel::config::delete_crawler,
            sattel::config::crawler_exists,
            sattel::config::save_settings,
            sattel::config::watch_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
