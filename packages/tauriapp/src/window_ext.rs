use tauri::Window;
#[cfg(target_os = "windows")]
use webview2_com::Microsoft::Web::WebView2::Win32::{ICoreWebView2Controller2, COREWEBVIEW2_COLOR};
#[cfg(target_os = "windows")]
use window_shadows::set_shadow;
#[cfg(target_os = "windows")]
use windows::core::Interface;

#[cfg(target_os = "macos")]
#[allow(dead_code)]
pub enum ToolbarThickness {
    Thick,
    Medium,
    Thin,
}

pub trait WindowExt {
    #[deprecated]
    #[cfg(target_os = "macos")]
    fn remove_buttons(&self);
    #[cfg(target_os = "macos")]
    fn set_toolbar_visible(&self, visible: bool);

    fn set_background(&self);
    fn set_transparent_titlebar(&self);
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

    fn set_background(&self) {
        use cocoa::{appkit::NSColor, base::nil, foundation::NSString};
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
        }
    }

    fn set_transparent_titlebar(&self) {
        use cocoa::appkit::{NSWindow, NSWindowTitleVisibility};

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            id.setTitlebarAppearsTransparent_(cocoa::base::YES);

            let thickness = ToolbarThickness::Medium;
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
}

#[cfg(target_os = "windows")]
impl WindowExt for Window {
    fn set_background(&self) {
        self.with_webview(|w| unsafe {
            w.controller()
                .cast::<ICoreWebView2Controller2>()
                .map(|controller2| {
                    controller2
                        .SetDefaultBackgroundColor(COREWEBVIEW2_COLOR {
                            R: 0,
                            G: 0,
                            B: 0,
                            A: 255,
                        })
                        .ok();
                })
                .ok();
        })
        .ok();
    }
    fn set_transparent_titlebar(&self) {
        self.set_decorations(false).ok();
        set_shadow(&self, true).ok();
    }
}
