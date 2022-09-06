import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import './utils.dart';
import './eventbus.dart';
import './config.dart';

class WebPage extends StatefulWidget {
  final String url;
  const WebPage(this.url, {Key? key}) : super(key: key);

  @override
  WebPageState createState() => WebPageState();
}

class WebPageState extends State<WebPage> {
  String title = '';

  final Completer<WebViewController> _controller =
      Completer<WebViewController>();
  WebPageState();

  _close(BuildContext context) {
    eventBus.fire(HomeActivationEvent());
    Navigator.pop(context);
  }

  Future<bool> _onWillPop() async {
    eventBus.fire(HomeActivationEvent());
    return true;
  }

  _updateTitle() async {
    WebViewController controller = await _controller.future;
    String? t = await controller.getTitle();
    setState(() {
      title = t!;
    });
  }

  JavascriptChannel _getJavascriptChannel(BuildContext context) {
    return JavascriptChannel(
        name: '__MT__APP__BRIDGE',
        onMessageReceived: (JavascriptMessage message) {
          try {
            var msg = json.decode(message.message);
            var type = msg['type'];
            switch (type) {
              case 'close':
                _close(context);
                break;
            }
          } finally {
            if (kDebugMode) {
              print(message.message);
            }
          }
        });
  }

  NavigationDecision _navigationDelegate(
      BuildContext context, NavigationRequest request) {
    if (kDebugMode) {
      print('webpage============> $request');
    }
    if (isExternalUrl(request.url)) {
      return NavigationDecision.navigate;
    } else {
      Navigator.pop(context);
      eventBus.fire(HomePageChangeEvent(request.url));
      return NavigationDecision.prevent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData(
        primaryColor: Colors.white,
      ),
      child: WillPopScope(
        onWillPop: _onWillPop,
        child: Scaffold(
          appBar: AppBar(title: Text(title)),
          body: Builder(builder: (BuildContext context) {
            return WebView(
              onPageFinished: (String url) => _updateTitle(),
              initialUrl: widget.url,
              javascriptMode: JavascriptMode.unrestricted,
              onWebViewCreated: (WebViewController webViewController) {
                _controller.complete(webViewController);
              },
              debuggingEnabled: debug,
              javascriptChannels: <JavascriptChannel>{
                _getJavascriptChannel(context),
              },
              navigationDelegate: (NavigationRequest request) {
                return _navigationDelegate(context, request);
              },
            );
          }),
        ),
      ),
    );
  }
}
