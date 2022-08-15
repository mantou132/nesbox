use std::env::consts::OS;

use tauri::{plugin::Plugin, Invoke, Runtime};

pub struct PreloadPlugin<R: Runtime> {
    invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
}

impl<R: Runtime> PreloadPlugin<R> {
    pub fn new() -> Self {
        Self {
            invoke_handler: Box::new(tauri::generate_handler![]),
        }
    }
}

impl<R: Runtime> Plugin<R> for PreloadPlugin<R> {
    fn name(&self) -> &'static str {
        "preload"
    }

    fn initialization_script(&self) -> Option<String> {
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
            "#,
            os = OS,
        ))
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
