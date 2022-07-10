import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart';
import './webpage.dart';
import './eventbus.dart';
import './utils.dart';
import './config.dart';

class Home extends StatefulWidget {
  const Home({Key? key}) : super(key: key);

  @override
  HomeState createState() => HomeState();
}

class HomeState extends State<Home> {
  String statusBarStyle = statusbarStyle;
  final Completer<WebViewController> _controller =
      Completer<WebViewController>();

  HomeState() {
    eventBus
        .on<HomePageChangeEvent>()
        .listen((HomePageChangeEvent event) async {
      if (kDebugMode) {
        print('HomePageChangeEvent==========>$event');
      }
      var controller = await _controller.future;
      controller.loadUrl(event.url);
    });
    eventBus
        .on<HomeActivationEvent>()
        .listen((HomeActivationEvent event) async {
      Timer(const Duration(milliseconds: 500), () => setState(() {}));
    });
  }

  _setStatusbarStyle(String style) {
    setState(() {
      statusBarStyle = style;
    });
  }

  Future<bool> _onWillPop() async {
    var controller = await _controller.future;
    if (await controller.canGoBack()) {
      controller.goBack();
      return false;
    } else {
      // will exit app
      return true;
    }
  }

  void _openWebPage(BuildContext context, String url) {
    Navigator.push(
        context, MaterialPageRoute(builder: (context) => WebPage(url)));
  }

  JavascriptChannel _getJavascriptChannel(BuildContext context) {
    var padding = MediaQuery.of(context).padding;
    var data = {
      'notch': {
        // ios webview env support notch
        'left': isIOS ? 0 : padding.left,
        'top': isIOS ? 0 : padding.top,
        'right': isIOS ? 0 : padding.right,
        'bottom': isIOS ? 0 : padding.bottom,
      }
    };

    return JavascriptChannel(
        name: '__MT__APP__BRIDGE____${encodeMapToBase64(data)}',
        onMessageReceived: (JavascriptMessage message) {
          try {
            var msg = json.decode(message.message);
            switch (msg['type']) {
              case 'open':
                _openWebPage(context, msg['data']);
                break;
              case 'statusbarstyle':
                _setStatusbarStyle(msg['data']);
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
      print('home============>$request');
    }
    if (isExternalRequest(request)) {
      _openWebPage(context, request.url);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  @override
  Widget build(BuildContext context) {
    if (kDebugMode) {
      print('=========>Homebuild');
    }
    SystemUiOverlayStyle baseStatusBarStyle = statusBarStyle == 'light'
        ? SystemUiOverlayStyle.light
        : SystemUiOverlayStyle.dark;
    // MediaQuery must use MaterialApp context
    SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle);
    if (MediaQuery.of(context).padding.top > 28) {
      SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle.copyWith(
        statusBarColor: Colors.transparent,
      ));
    }
    return WillPopScope(
        onWillPop: _onWillPop,
        child: WebView(
          initialUrl: startUrl,
          javascriptChannels: <JavascriptChannel>{
            _getJavascriptChannel(context),
          },
          debuggingEnabled: debug,
          javascriptMode: JavascriptMode.unrestricted,
          onWebViewCreated: (WebViewController webViewController) {
            _controller.complete(webViewController);
          },
          navigationDelegate: (NavigationRequest request) {
            return _navigationDelegate(context, request);
          },
        ));
  }
}
