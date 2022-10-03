use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};

const SETTINGS_FILENAME: &str = "settings.json";

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Settings {
    #[serde(default, skip_serializing)]
    path: PathBuf,

    #[serde(default)]
    pub branch: String,
}

impl Settings {
    pub fn load(&mut self, dir: PathBuf) {
        let path = dir.join(SETTINGS_FILENAME);
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
                *self = settings;
            }
        }
        self.path = path;
    }

    pub fn save(&mut self) {
        if self.path.is_file() {
            fs::write(&self.path, serde_json::to_string(self).unwrap()).unwrap();
        }
    }
}

lazy_static! {
    pub static ref SETTINGS: Mutex<Settings> = Mutex::new(Settings::default());
}
