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
    // The plugin name
    fn name(&self) -> &'static str {
        "preload"
    }

    // The JS script to evaluate on initialization
    fn initialization_script(&self) -> Option<String> {
        #[cfg(target_os = "macos")]
        Some(String::from(
            "Object.defineProperty(navigator, 'appName', {value: 'tauriapp', configurable: true});",
        ))
    }

    // Extend the invoke handler
    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
