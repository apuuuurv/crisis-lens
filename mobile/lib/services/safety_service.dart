import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import '../models/incident.dart';

class SafetyService {
  static final SafetyService _instance = SafetyService._internal();
  factory SafetyService() => _instance;
  SafetyService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  final Set<int> _notifiedIncidents = {};

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _notificationsPlugin.initialize(initializationSettings);
  }

  Future<void> checkProximity(Position userPos, List<Incident> incidents) async {
    for (var incident in incidents) {
      if (_notifiedIncidents.contains(incident.id)) continue;

      double distanceInMeters = Geolocator.distanceBetween(
        userPos.latitude,
        userPos.longitude,
        incident.latitude,
        incident.longitude,
      );

      if (distanceInMeters < 500) {
        await _showNotification(incident);
        _notifiedIncidents.add(incident.id);
      }
    }
  }

  Future<void> _showNotification(Incident incident) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'safety_alerts',
      'Safety Alerts',
      channelDescription: 'Notifications for nearby disasters',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
      color: Color(0xFFFF5252),
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );

    await _notificationsPlugin.show(
      incident.id,
      '⚠️ SAFETY WARNING',
      'You are entering an unsafe area (${incident.category} reported nearby).',
      platformChannelSpecifics,
    );
  }
}
