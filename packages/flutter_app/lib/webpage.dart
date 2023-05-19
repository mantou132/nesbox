import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_app/utils.dart';
import 'package:flutter_app/eventbus.dart';

class WebPage extends StatefulWidget {
  final String url;
  const WebPage(this.url, {Key? key}) : super(key: key);

  @override
  WebPageState createState() => WebPageState();
}

class WebPageState extends State<WebPage> {
  final WebViewController _controller = WebViewController();
  WebPageState();

  String title = '';
  bool _ready = false;

  void _close() {
    eventBus.fire(HomeActivationEvent());
    Navigator.pop(context);
  }

  Future<bool> _onWillPop() async {
    eventBus.fire(HomeActivationEvent());
    return true;
  }

  void _updateTitle() async {
    String? t = await _controller.getTitle();
    setState(() {
      title = t!;
    });
  }

  NavigationDecision _navigationDelegate(NavigationRequest request) {
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

  void _onMessageReceived(JavaScriptMessage message) async {
    try {
      var msg = json.decode(message.message);
      var type = msg['type'];
      switch (type) {
        case 'close':
          _close();
          break;
      }
    } finally {
      if (kDebugMode) {
        print(message.message);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (kDebugMode) {
      print('=========> WebPageBuild');
    }

    if (!_ready) {
      _ready = true;
      _controller
        ..loadRequest(Uri.parse(widget.url))
        ..addJavaScriptChannel(
          '__MT__APP__BRIDGE',
          onMessageReceived: _onMessageReceived,
        )
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(NavigationDelegate(
            onNavigationRequest: _navigationDelegate, onPageFinished: (String url) => _updateTitle()));
    }

    return Theme(
      data: ThemeData(
        primaryColor: Colors.white,
      ),
      child: WillPopScope(
        onWillPop: _onWillPop,
        child: Scaffold(
          appBar: AppBar(title: Text(title)),
          body: Builder(builder: (BuildContext context) {
            return WebViewWidget(
              controller: _controller,
            );
          }),
        ),
      ),
    );
  }
}
