import 'package:flutter/material.dart';
import 'package:flutter_app/home.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: Home(),
    );
  }
}

void main() => runApp(const App());
