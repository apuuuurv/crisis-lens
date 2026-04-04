import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/incident.dart';

class ApiService {
  // Use the IP address provided by the user
  static const String baseUrl = 'http://172.16.105.123:8000';

  Future<List<Incident>> fetchIncidents(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/incidents/'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        List<dynamic> body = jsonDecode(response.body);
        return body.map((dynamic item) => Incident.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load incidents: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching incidents: $e');
      rethrow;
    }
  }

  Future<Incident> submitReport({
    required String title,
    required String category,
    required String description,
    required double latitude,
    required double longitude,
    required File image,
    required String? token,
  }) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/incidents/upload'));
      
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      
      request.fields['title'] = title;
      request.fields['category'] = category;
      request.fields['description'] = description;
      request.fields['latitude'] = latitude.toString();
      request.fields['longitude'] = longitude.toString();
      request.fields['severity'] = '5'; // Default severity

      request.files.add(await http.MultipartFile.fromPath(
        'file',
        image.path,
      ));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        return Incident.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to submit report: ${response.body}');
      }
    } catch (e) {
      print('Error submitting report: $e');
      rethrow;
    }
  }

  Future<void> sendSOS(double lat, double lng, String? token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/incidents/'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': 'URGENT SOS',
          'description': 'User triggered emergency SOS signal.',
          'category': 'CRITICAL',
          'latitude': lat,
          'longitude': lng,
          'severity': 5,
        }),
      );

      if (response.statusCode != 201) {
        throw Exception('Failed to send SOS: ${response.body}');
      }
    } catch (e) {
      print('Error sending SOS: $e');
      rethrow;
    }
  }
}
