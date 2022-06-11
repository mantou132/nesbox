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

    #[cfg(target_os = "macos")]
    fn initialization_script(&self) -> Option<String> {
        Some(String::from(
            "Object.defineProperty(navigator, 'appName', {value: 'tauriapp', configurable: true});",
        ))
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
