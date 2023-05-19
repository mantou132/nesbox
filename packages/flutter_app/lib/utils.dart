import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_app/config.dart';

var isIOS = defaultTargetPlatform == TargetPlatform.iOS;

bool isExternalUrl(String url) {
  return !url.startsWith(startUrl);
}

bool isExternalRequest(NavigationRequest request) {
  return request.isMainFrame && isExternalUrl(request.url);
}

String encodeMapToBase64(Object data) {
  return base64.encode(utf8.encode(jsonEncode(data))).replaceAll(RegExp(r'=+$'), '');
}
