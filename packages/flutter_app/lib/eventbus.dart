import 'package:event_bus/event_bus.dart';

EventBus eventBus = EventBus();

class HomePageChangeEvent {
  String url;
  HomePageChangeEvent(this.url);
}

class HomeActivationEvent {}
