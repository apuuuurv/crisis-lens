import 'dart:io';
import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../services/api_service.dart';

class IncidentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Incident> _incidents = [];
  bool _isLoading = false;
  String? _error;

  List<Incident> get incidents => _incidents;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchIncidents(String? token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _incidents = await _apiService.fetchIncidents(token);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> submitReport({
    required String title,
    required String category,
    required String description,
    required double latitude,
    required double longitude,
    required File image,
    required String? token,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.submitReport(
        title: title,
        category: category,
        description: description,
        latitude: latitude,
        longitude: longitude,
        image: image,
        token: token,
      );
      await fetchIncidents(token); // Refresh the list
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
