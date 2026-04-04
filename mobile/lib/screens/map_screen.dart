import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:battery_plus/battery_plus.dart';
import '../providers/incident_provider.dart';
import '../providers/auth_provider.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import '../services/safety_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> with TickerProviderStateMixin {
  late final MapController _mapController;
  late final AnimationController _pulseController;
  late final AnimationController _glowController;
  final SafetyService _safetyService = SafetyService();
  final ApiService _apiService = ApiService();
  final Battery _battery = Battery();
  
  Position? _currentPosition;
  double? _minDistance;
  Timer? _locationTimer;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    
    // Heartbeat pulse pulse
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    // Glow effect pulse
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initFeatures();
    });
  }

  Future<void> _initFeatures() async {
    final token = context.read<AuthProvider>().token;
    await context.read<IncidentProvider>().fetchIncidents(token);
    _startLocationTracking();
  }

  void _startLocationTracking() {
    _locationTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      try {
        final pos = await Geolocator.getCurrentPosition();
        if (!mounted) return;
        
        setState(() {
          _currentPosition = pos;
        });

        final incidents = context.read<IncidentProvider>().incidents;
        if (incidents.isNotEmpty) {
          _calculateSafetyStatus(pos, incidents);
          _safetyService.checkProximity(pos, incidents);
        }
      } catch (e) {
        debugPrint('Location tracking error: $e');
      }
    });
  }

  void _calculateSafetyStatus(Position pos, List<Incident> incidents) {
    double minFixedDistance = double.infinity;
    for (var incident in incidents) {
      double dist = Geolocator.distanceBetween(
        pos.latitude, pos.longitude, incident.latitude, incident.longitude
      );
      if (dist < minFixedDistance) minFixedDistance = dist;
    }
    setState(() {
      _minDistance = minFixedDistance;
    });
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _pulseController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'fire': return const Color(0xFFFF3B30);
      case 'flood': return const Color(0xFF007AFF);
      case 'medical': return const Color(0xFF34C759);
      case 'accident': return const Color(0xFFFF9500);
      default: return const Color(0xFFAF52DE);
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'fire': return Icons.local_fire_department;
      case 'flood': return Icons.water_drop;
      case 'medical': return Icons.medical_services;
      case 'accident': return Icons.car_crash;
      default: return Icons.warning;
    }
  }

  Future<void> _triggerSOS() async {
    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Wait for GPS location to trigger SOS')),
      );
      return;
    }

    HapticFeedback.heavyImpact();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    String userEmail = authProvider.userEmail ?? "Demo User";
    
    final battery = Battery();
    int batteryLevel = await battery.batteryLevel;
    
    final lat = _currentPosition!.latitude;
    final lng = _currentPosition!.longitude;

    try {
      await _apiService.sendSOS(lat, lng, authProvider.token);
    } catch (e) {
      debugPrint('Cloud SOS Failed: $e');
    }

    final Uri smsUri = Uri(
      scheme: 'sms',
      path: '8452800546',
      queryParameters: <String, String>{
        'body': '🚨 CrisisLens SOS 🚨\n'
                'User: $userEmail\n'
                'Loc: https://www.google.com/maps/search/?api=1&query=$lat,$lng\n'
                'Battery: $batteryLevel%\n'
                'Status: CRITICAL HELP NEEDED!',
      },
    );

    try {
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('🆘 SOS SIGNAL TRIGGERED'), backgroundColor: Color(0xFFFF3B30)),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('SOS Error: $e'), backgroundColor: const Color(0xFFFF3B30)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Consumer<IncidentProvider>(
            builder: (context, provider, child) {
              return FlutterMap(
                mapController: _mapController,
                options: const MapOptions(
                  initialCenter: LatLng(19.0760, 72.8777),
                  initialZoom: 12.0,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.crisislens.app',
                    tileBuilder: (context, tileWidget, tile) {
                      return ColorFiltered(
                        colorFilter: const ColorFilter.matrix([
                          -1, 0, 0, 0, 255,
                          0, -1, 0, 0, 255,
                          0, 0, -1, 0, 255,
                          0, 0, 0, 1, 0,
                        ]),
                        child: tileWidget,
                      );
                    },
                  ),
                  CircleLayer(
                    circles: provider.incidents.map((incident) {
                      return CircleMarker(
                        point: LatLng(incident.latitude, incident.longitude),
                        radius: 200,
                        useRadiusInMeter: true,
                        color: const Color(0xFFFF3B30).withOpacity(0.15),
                        borderColor: const Color(0xFFFF3B30).withOpacity(0.3),
                        borderStrokeWidth: 1,
                      );
                    }).toList(),
                  ),
                  MarkerLayer(
                    markers: provider.incidents.map((incident) {
                      return Marker(
                        point: LatLng(incident.latitude, incident.longitude),
                        width: 45,
                        height: 45,
                        child: _buildCustomMarker(incident),
                      );
                    }).toList(),
                  ),
                ],
              );
            },
          ),
          
          // SAFETY STATUS BAR (Glassmorphic)
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: _buildSafetyStatusBar(),
          ),
        ],
      ),
      floatingActionButton: _buildSOSButton(),
    );
  }

  Widget _buildCustomMarker(Incident incident) {
    final color = _getCategoryColor(incident.category);
    return GestureDetector(
      onTap: () => _showIncidentDetails(context, incident),
      child: Container(
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.4), blurRadius: 8, spreadRadius: 2),
          ],
        ),
        child: Center(
          child: Icon(_getCategoryIcon(incident.category), color: Colors.white, size: 20),
        ),
      ),
    );
  }

  Widget _buildSafetyStatusBar() {
    bool isDanger = _minDistance != null && _minDistance! < 1000;
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
          decoration: BoxDecoration(
            color: (isDanger ? const Color(0xFFFF3B30) : const Color(0xFF34C759)).withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.1), width: 1),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(isDanger ? Icons.warning_rounded : Icons.shield_rounded, 
                   color: isDanger ? const Color(0xFFFF3B30) : const Color(0xFF34C759), size: 20),
              const SizedBox(width: 12),
              Text(
                isDanger ? 'HIGH RISK AREA' : 'AREA STATUS: SECURE',
                style: GoogleFonts.plusJakartaSans(
                  color: Colors.white, 
                  fontWeight: FontWeight.bold, 
                  fontSize: 13,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSOSButton() {
    return AnimatedBuilder(
      animation: _glowController,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF3B30).withOpacity(0.3 * (1 - _glowController.value)),
                blurRadius: 15 + (20 * _glowController.value),
                spreadRadius: 5 + (10 * _glowController.value),
              ),
            ],
          ),
          child: ScaleTransition(
            scale: Tween(begin: 1.0, end: 1.08).animate(_pulseController),
            child: FloatingActionButton.extended(
              onPressed: _triggerSOS,
              backgroundColor: const Color(0xFFFF3B30),
              elevation: 4,
              icon: const Icon(Icons.sos, size: 28, color: Colors.white),
              label: Text('SOS', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, letterSpacing: 1.5)),
            ),
          ),
        );
      },
    );
  }

  void _showIncidentDetails(BuildContext context, Incident incident) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.45,
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(28.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        incident.title,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    _buildSeverityBadge(incident),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  incident.description,
                  style: GoogleFonts.plusJakartaSans(color: Colors.white70, fontSize: 15, height: 1.5),
                ),
                const Spacer(),
                Row(
                  children: [
                    _buildInfoChip(Icons.people, '${incident.reportCount} reports'),
                    const SizedBox(width: 12),
                    _buildInfoChip(incident.isVerified ? Icons.verified : Icons.info, incident.isVerified ? 'Verified' : 'Unverified'),
                  ],
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('DISMISS'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSeverityBadge(Incident incident) {
    Color color = (incident.severity ?? 0) >= 4 ? const Color(0xFFFF3B30) : ((incident.severity ?? 0) >= 3 ? Colors.orange : Colors.green);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        incident.category.toUpperCase(),
        style: GoogleFonts.plusJakartaSans(color: color, fontWeight: FontWeight.w700, fontSize: 11),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white38),
        const SizedBox(width: 6),
        Text(text, style: GoogleFonts.plusJakartaSans(color: Colors.white38, fontSize: 13)),
      ],
    );
  }
}
