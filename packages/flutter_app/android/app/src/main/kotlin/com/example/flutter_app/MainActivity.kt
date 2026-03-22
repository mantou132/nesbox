package com.example.flutter_app

import io.flutter.embedding.android.FlutterActivity

import android.view.KeyEvent
import android.view.MotionEvent
import android.webkit.WebView

class MainActivity: FlutterActivity() {
    // 寻找布局中的 WebView
    private fun getBlurWebView(view: android.view.View): WebView? {
        if (window.currentFocus is android.webkit.WebView) {
            return null
        }

        if (view is WebView) return view
        if (view is android.view.ViewGroup) {
            for (i in 0 until view.childCount) {
                val v = getBlurWebView(view.getChildAt(view.childCount - i - 1))
                if (v != null) return v
            }
        }
        return null
    }

    // 核心：将手柄的摇杆/按键动作直接派发给 WebView 视图
    override fun dispatchGenericMotionEvent(event: MotionEvent): Boolean {
        val webView = getBlurWebView(window.decorView)
        if (webView != null) {
            webView.requestFocus()
            webView.dispatchGenericMotionEvent(event)
        }
        return super.dispatchGenericMotionEvent(event)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val webView = getBlurWebView(window.decorView)
        if (webView != null) {
            // 这会让 WebView 内部的 Gamepad API 捕捉到交互
            webView.requestFocus()
            webView.dispatchKeyEvent(event)
        }
        return super.dispatchKeyEvent(event)
    }
}
