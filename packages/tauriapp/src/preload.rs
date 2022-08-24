use std::env::consts::OS;
use std::fs;
use std::path::PathBuf;

use tauri::{
    plugin::{Plugin, Result},
    Invoke, Runtime,
};

pub struct PreloadPlugin<R: Runtime> {
    invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
    app_dir: PathBuf,
}

impl<R: Runtime> PreloadPlugin<R> {
    pub fn new() -> Self {
        Self {
            invoke_handler: Box::new(tauri::generate_handler![]),
            app_dir: PathBuf::new(),
        }
    }
}

impl<R: Runtime> Plugin<R> for PreloadPlugin<R> {
    fn name(&self) -> &'static str {
        "preload"
    }

    fn initialize(&mut self, app: &tauri::AppHandle<R>, _: serde_json::Value) -> Result<()> {
        self.app_dir = app.path_resolver().app_dir().unwrap();
        Ok(())
    }

    fn initialization_script(&self) -> Option<String> {
        let local_storage = match OS {
            "macos" => {
                format!(
                    r#"
                        // Avoid white screens, the document script should use `async` attribute
                        window.addEventListener('DOMContentLoaded', () => {{
                            Object.assign(localStorage, {});
                        }})
                        window.addEventListener('unload', () => {{
                            const {{ writeTextFile, BaseDirectory }} = window.__TAURI__.fs;
                            writeTextFile(
                                'local_storage.json',
                                JSON.stringify(
                                    Object.fromEntries(
                                        Object.entries(localStorage)
                                            .filter(([_,value]) => value.length < 2000)
                                    )
                                ),
                                {{ dir: BaseDirectory.App }}
                            );
                        }});
                    "#,
                    fs::read_to_string(self.app_dir.join("local_storage.json"))
                        .unwrap_or("{}".into())
                )
            }
            _ => "".into(),
        };
        Some(format!(
            r#"
                Object.defineProperty(window, 'open', {{
                    value: (uri) => window.__TAURI__.shell.open(uri),
                    configurable: true,
                }});
                Object.defineProperty(navigator, 'appName', {{
                    value: 'nesbox-{os}',
                    configurable: true,
                }});
                Object.defineProperty(navigator, 'setAppBadge', {{
                    value: (count) => {{
                        window.__TAURI__.tauri.invoke('set_badge', {{ count }}).catch((err) => {{
                            console.warn(err);
                            count && window.__TAURI__.window.getCurrent().requestUserAttention(2);
                        }});
                    }},
                    configurable: true,
                }});
                {local_storage}
            "#,
            os = OS,
            local_storage = local_storage,
        ))
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
