use tauri::Window;

pub trait WindowExt {
    #[cfg(target_os = "macos")]
    fn set_window_style(&self, title_transparent: bool, remove_toolbar: bool);
    #[cfg(target_os = "macos")]
    fn set_toolbar_visible(&self, visible: bool);
}

impl WindowExt for Window {
    #[cfg(target_os = "macos")]
    fn set_window_style(&self, title_transparent: bool, remove_tool_bar: bool) {
        use cocoa::{
            appkit::{NSColor, NSWindow, NSWindowStyleMask, NSWindowTitleVisibility},
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

            let mut style_mask = id.styleMask();
            style_mask.set(
                NSWindowStyleMask::NSFullSizeContentViewWindowMask,
                title_transparent,
            );

            if remove_tool_bar {
                style_mask.remove(
                    NSWindowStyleMask::NSClosableWindowMask
                        | NSWindowStyleMask::NSMiniaturizableWindowMask
                        | NSWindowStyleMask::NSResizableWindowMask,
                );
            }

            id.setStyleMask_(style_mask);

            id.setTitleVisibility_(if title_transparent {
                NSWindowTitleVisibility::NSWindowTitleHidden
            } else {
                NSWindowTitleVisibility::NSWindowTitleVisible
            });

            id.setTitlebarAppearsTransparent_(if title_transparent {
                cocoa::base::YES
            } else {
                cocoa::base::NO
            });

            // https://github.com/tauri-apps/tauri/issues/2663#issuecomment-1151240533
            id.setToolbar_(msg_send![class!(NSToolbar), new]);
        }
    }

    #[cfg(target_os = "macos")]
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
