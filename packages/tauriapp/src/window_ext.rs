use tauri::Window;

#[cfg(target_os = "macos")]
#[allow(dead_code)]
pub enum ToolbarThickness {
    Thick,
    Medium,
    Thin,
}

#[cfg(target_os = "macos")]
pub trait WindowExt {
    #[deprecated]
    fn remove_buttons(&self);
    fn set_transparent_titlebar(&self, thickness: ToolbarThickness);
    fn set_toolbar_visible(&self, visible: bool);
}

#[cfg(target_os = "macos")]
impl WindowExt for Window {
    fn remove_buttons(&self) {
        use cocoa::appkit::{NSWindow, NSWindowStyleMask};

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let mut style_mask = id.styleMask();

            style_mask.remove(
                NSWindowStyleMask::NSClosableWindowMask
                    | NSWindowStyleMask::NSMiniaturizableWindowMask
                    | NSWindowStyleMask::NSResizableWindowMask,
            );

            id.setStyleMask_(style_mask);
        }
    }

    fn set_transparent_titlebar(&self, thickness: ToolbarThickness) {
        use cocoa::{
            appkit::{NSColor, NSWindow, NSWindowTitleVisibility},
            base::nil,
            foundation::NSString,
        };

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let color = NSColor::colorWithSRGBRed_green_blue_alpha_(nil, 0.0, 0.0, 0.0, 1.0);
            let _: cocoa::base::id = msg_send![id, setBackgroundColor: color];

            // https://github.com/tauri-apps/tauri/issues/1564
            // https://github.com/tauri-apps/wry/blob/765fe5ae413a1c13ad99802b49f3af859a2445d5/src/webview/macos/mod.rs#L180
            self.with_webview(|webview| {
                // !!! has delay
                let id = webview.inner();
                let no: cocoa::base::id = msg_send![class!(NSNumber), numberWithBool:0];
                let _: cocoa::base::id =
                    msg_send![id, setValue:no forKey: NSString::alloc(nil).init_str("drawsBackground")];
            })
            .ok();

            id.setTitlebarAppearsTransparent_(cocoa::base::YES);

            match thickness {
                ToolbarThickness::Thick => {
                    self.set_title("").ok();
                    // https://github.com/tauri-apps/tauri/issues/2663#issuecomment-1151240533
                    id.setToolbar_(msg_send![class!(NSToolbar), new]);
                }
                ToolbarThickness::Medium => {
                    id.setTitleVisibility_(NSWindowTitleVisibility::NSWindowTitleHidden);
                    id.setToolbar_(msg_send![class!(NSToolbar), new]);
                }
                ToolbarThickness::Thin => {
                    id.setTitleVisibility_(NSWindowTitleVisibility::NSWindowTitleHidden);
                }
            }
        }
    }

    fn set_toolbar_visible(&self, visible: bool) {
        use cocoa::appkit::NSWindow;

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let v = if visible {
                cocoa::base::YES
            } else {
                cocoa::base::NO
            };
            let _: cocoa::base::id = msg_send![id.toolbar(), setVisible: v];
        }
    }
}
