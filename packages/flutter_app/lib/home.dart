import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart';
import './webpage.dart';
import './eventbus.dart';
import './utils.dart';
import './config.dart';

var battery = Battery();

class BatteryInfo {
  double level = 0;
  bool charging = false;

  query() async {
    level = await battery.batteryLevel / 100;
    charging = await battery.batteryState == BatteryState.charging;
  }
}

class Home extends StatefulWidget {
  const Home({Key? key}) : super(key: key);

  @override
  HomeState createState() => HomeState();
}

class HomeState extends State<Home> {
  final Completer<WebViewController> _controller = Completer<WebViewController>();

  HomeState() {
    eventBus.on<HomePageChangeEvent>().listen((HomePageChangeEvent event) async {
      if (kDebugMode) {
        print('HomePageChangeEvent==========> $event');
      }
      var controller = await _controller.future;
      controller.loadUrl(event.url);
    });
    eventBus.on<HomeActivationEvent>().listen((HomeActivationEvent event) async {
      Timer(const Duration(milliseconds: 500), () => setState(() {}));
    });
  }

  _setStatusbarStyle(String statusBarStyle) {
    if (statusBarStyle == 'none') {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.leanBack);
    } else {
      SystemUiOverlayStyle baseStatusBarStyle =
          statusBarStyle == 'light' ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark;

      if (MediaQuery.of(context).padding.top > 28) {
        // ios
        SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle.copyWith(
          statusBarColor: Colors.transparent,
        ));
      } else {
        SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle);
      }
    }
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
    Navigator.push(context, MaterialPageRoute(builder: (context) => WebPage(url)));
  }

  void _sendMessage(String msgId, data) async {
    var controller = await _controller.future;
    // resolve promise when detail is truly
    var string = json.encode(data);
    controller.runJavascript('dispatchEvent(new CustomEvent("mtappmessage$msgId", {detail: $string}));');
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

    // https://github.com/mantou132/mt-music-player/blob/feat/mt-app/fe/jsbridge.js
    return JavascriptChannel(
        name: '__MT__APP__BRIDGE____${encodeMapToBase64(data)}',
        onMessageReceived: (JavascriptMessage message) async {
          try {
            var msg = json.decode(message.message);
            switch (msg['type']) {
              case 'open':
                _openWebPage(context, msg['data']);
                _sendMessage(msg['id'], true);
                break;
              case 'statusbarstyle':
                _setStatusbarStyle(msg['data']);
                _sendMessage(msg['id'], true);
                break;
              case 'battery':
                _sendMessage(msg['id'], await BatteryInfo().query());
                break;
              case 'close':
                exit(0);
            }
          } finally {
            if (kDebugMode) {
              print(message.message);
            }
          }
        });
  }

  NavigationDecision _navigationDelegate(BuildContext context, NavigationRequest request) {
    if (kDebugMode) {
      print('Home============> $request');
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
      print('=========> Homebuild');
    }

    // init state
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.leanBack);

    return WillPopScope(
        onWillPop: _onWillPop,
        child: WebView(
          initialUrl: startUrl,
          javascriptChannels: <JavascriptChannel>{
            _getJavascriptChannel(context),
          },
          allowsInlineMediaPlayback: true,
          initialMediaPlaybackPolicy: AutoMediaPlaybackPolicy.always_allow,
          zoomEnabled: false,
          backgroundColor: const Color.fromARGB(255, 0, 0, 0),
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
