use tauri::{plugin::Plugin, Invoke, Manager, PageLoadPayload, Runtime, Window};

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
            r#"Object.defineProperty(navigator, 'appName', {{value: 'nesbox-{}', configurable: true}});"#,
            std::env::consts::OS
        ))
    }

    // https://github.com/tauri-apps/tauri/issues/1564
    fn on_page_load(&mut self, window: Window<R>, _: PageLoadPayload) {
        window.get_window("main").unwrap().show().unwrap();
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
