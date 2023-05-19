import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/services.dart';
import 'package:flutter_app/webpage.dart';
import 'package:flutter_app/eventbus.dart';
import 'package:flutter_app/utils.dart';
import 'package:flutter_app/config.dart';

var battery = Battery();

class BatteryInfo {
  double level = 0;
  bool charging = false;

  query() async {
    level = await battery.batteryLevel / 100;
    charging = await battery.batteryState == BatteryState.charging;
    return this;
  }

  Map<String, dynamic> toJson() => {
        'level': level,
        'charging': charging,
      };
}

class Home extends StatefulWidget {
  const Home({Key? key}) : super(key: key);

  @override
  HomeState createState() => HomeState();
}

class HomeState extends State<Home> {
  final WebViewController _controller = WebViewController();
  HomeState() {
    eventBus.on<HomePageChangeEvent>().listen((HomePageChangeEvent event) async {
      if (kDebugMode) {
        print('HomePageChangeEvent==========> $event');
      }
      _controller.loadRequest(Uri.parse(event.url));
    });
    eventBus.on<HomeActivationEvent>().listen((HomeActivationEvent event) async {
      if (kDebugMode) {
        print('HomeActivationEvent==========> $event');
      }
      Timer(const Duration(milliseconds: 500), () => setState(() {}));
    });
  }

  bool _ready = false;

  void _setOrientation(String orientation) async {
    switch (orientation) {
      case 'landscape':
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.landscapeRight,
          DeviceOrientation.landscapeLeft,
        ]);
        break;
      case 'portrait':
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
          DeviceOrientation.portraitDown,
        ]);
        break;
      default:
        await SystemChrome.setPreferredOrientations([]);
    }
  }

  void _setStatusbarStyle(String statusBarStyle) async {
    if (statusBarStyle == 'none') {
      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
    } else {
      var top = MediaQuery.of(context).padding.top;

      await SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: SystemUiOverlay.values);

      SystemUiOverlayStyle baseStatusBarStyle =
          statusBarStyle == 'light' ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark;

      if (top > 28) {
        // ios
        SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle.copyWith(
          statusBarColor: Colors.transparent,
        ));
      } else {
        SystemChrome.setSystemUIOverlayStyle(baseStatusBarStyle);
      }
    }
  }

  void _openWebPage(String url) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => WebPage(url)));
  }

  void _sendMessage(int msgId, data) async {
    // resolve promise when detail is truly
    var string = json.encode(data);
    if (kDebugMode) {
      print(string);
    }
    _controller.runJavaScript('dispatchEvent(new CustomEvent("mtappmessage$msgId", {detail: $string}));');
  }

  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
      return false;
    } else {
      // will exit app
      return true;
    }
  }

  NavigationDecision _navigationDelegate(NavigationRequest request) {
    if (kDebugMode) {
      print('Home============> $request');
    }
    if (isExternalRequest(request)) {
      _openWebPage(request.url);
      return NavigationDecision.prevent;
    }
    return NavigationDecision.navigate;
  }

  String _getChannelName() {
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
    return '__MT__APP__BRIDGE____${encodeMapToBase64(data)}';
  }

  void _onMessageReceived(JavaScriptMessage message) async {
    try {
      var msg = json.decode(message.message);
      switch (msg['type']) {
        case 'open':
          _openWebPage(msg['data']);
          _sendMessage(msg['id'], true);
          break;
        case 'statusbarstyle':
          _setStatusbarStyle(msg['data']);
          _sendMessage(msg['id'], true);
          break;
        case 'orientation':
          _setOrientation(msg['data']);
          _sendMessage(msg['id'], true);
          break;
        case 'battery':
          _sendMessage(msg['id'], await BatteryInfo().query());
          break;
        case 'playsound':
          switch (msg['data']) {
            case 'click':
              SystemSound.play(SystemSoundType.click);
              break;
            case 'alert':
              SystemSound.play(SystemSoundType.alert);
              break;
          }
          break;
        case 'close':
          exit(0);
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
      print('=========> HomeBuild');
    }

    // allowsInlineMediaPlayback: true,
    // initialMediaPlaybackPolicy: AutoMediaPlaybackPolicy.always_allow,
    // zoomEnabled: false,
    // debuggingEnabled: debug,
    if (!_ready) {
      _ready = true;
      _controller
        ..loadRequest(Uri.parse(startUrl))
        ..addJavaScriptChannel(_getChannelName(), onMessageReceived: _onMessageReceived)
        ..setBackgroundColor(const Color.fromARGB(255, 0, 0, 0))
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(NavigationDelegate(onNavigationRequest: _navigationDelegate));
    }

    return WillPopScope(
        onWillPop: _onWillPop,
        child: WebViewWidget(
          controller: _controller,
        ));
  }

  @override
  void initState() {
    // https://api.flutter.dev/flutter/services/SystemChrome/setEnabledSystemUIMode.html
    Timer.periodic(const Duration(seconds: 2), (timer) {
      SystemChrome.restoreSystemUIOverlays();
    });
    super.initState();
  }
}
