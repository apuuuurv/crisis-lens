import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/incident_provider.dart';
import '../providers/auth_provider.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final MapController _mapController = MapController();
  
  String _selectedCategory = 'Fire';
  File? _selectedImage;
  LatLng _pickedLocation = const LatLng(19.0760, 72.8777); // Mumbai default
  bool _isLocating = false;

  final List<String> _categories = ['Fire', 'Flood', 'Medical', 'Earthquake', 'Accident', 'Other'];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      setState(() {
        _pickedLocation = LatLng(position.latitude, position.longitude);
        _mapController.move(_pickedLocation, 15.0);
      });
    } catch (e) {
      debugPrint('Error fetching location: $e');
    } finally {
      setState(() => _isLocating = false);
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      imageQuality: 80,
    );
    
    if (image != null) {
      setState(() => _selectedImage = File(image.path));
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 32.0, horizontal: 24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Incident Evidence',
                style: GoogleFonts.plusJakartaSans(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  _SourceButton(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    color: const Color(0xFFFF3B30),
                    onTap: () {
                      Navigator.pop(context);
                      _pickImage(ImageSource.camera);
                    },
                  ),
                  const SizedBox(width: 16),
                  _SourceButton(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    color: const Color(0xFF007AFF),
                    onTap: () {
                      Navigator.pop(context);
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add incident evidence'), backgroundColor: Color(0xFFFF3B30)),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();

    try {
      await context.read<IncidentProvider>().submitReport(
        title: _titleController.text,
        category: _selectedCategory,
        description: _descriptionController.text,
        latitude: _pickedLocation.latitude,
        longitude: _pickedLocation.longitude,
        image: _selectedImage!,
        token: authProvider.token,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Crisis Reported Successfully'), backgroundColor: Color(0xFF34C759)),
      );

      _titleController.clear();
      _descriptionController.clear();
      setState(() {
        _selectedImage = null;
        _selectedCategory = 'Fire';
      });
      _getCurrentLocation();
      
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: const Color(0xFFFF3B30)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<IncidentProvider>().isLoading;

    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(title: Text('Report Incident', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800))),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionHeader(title: 'EVIDENCE'),
                  const SizedBox(height: 12),
                  _buildImagePickerHeader(),
                  const SizedBox(height: 32),
                  
                  _SectionHeader(title: 'LOCATION DETAILS'),
                  const SizedBox(height: 12),
                  _buildMapPicker(),
                  const SizedBox(height: 32),

                  _SectionHeader(title: 'INCIDENT DATA'),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Incident Title', prefixIcon: Icon(Icons.title, size: 20)),
                    validator: (val) => val!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category, size: 20)),
                    items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (v) => setState(() => _selectedCategory = v!),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Detailed Description', alignLabelWithHint: true),
                  ),
                  const SizedBox(height: 40),
                  
                  ElevatedButton(
                    onPressed: isLoading ? null : _submitReport,
                    child: const Text('SUBMIT REPORT'),
                  ),
                  const SizedBox(height: 60),
                ],
              ),
            ),
          ),
        ),
        if (isLoading) _buildLoadingOverlay(),
      ],
    );
  }

  Widget _buildImagePickerHeader() {
    return GestureDetector(
      onTap: _showImageSourceSheet,
      child: Container(
        height: 220,
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
          image: _selectedImage != null 
              ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover) 
              : null,
        ),
        child: _selectedImage == null 
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_a_photo_outlined, size: 40, color: Colors.white24),
                  const SizedBox(height: 12),
                  Text('Tap to add photo evidence', style: GoogleFonts.plusJakartaSans(color: Colors.white24, fontWeight: FontWeight.w600)),
                ],
              )
            : Stack(
                children: [
                  Positioned(
                    top: 12,
                    right: 12,
                    child: IconButton.filled(
                      style: IconButton.styleFrom(backgroundColor: Colors.black54),
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => setState(() => _selectedImage = null),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildMapPicker() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _pickedLocation,
              initialZoom: 15.0,
              onPositionChanged: (pos, gesture) {
                if (gesture) setState(() => _pickedLocation = pos.center!);
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.crisislens.app',
                tileBuilder: (context, tileWidget, tile) => ColorFiltered(
                  colorFilter: const ColorFilter.matrix([-1, 0, 0, 0, 255, 0, -1, 0, 0, 255, 0, 0, -1, 0, 255, 0, 0, 0, 1, 0]),
                  child: tileWidget,
                ),
              ),
            ],
          ),
          const IgnorePointer(child: Center(child: Icon(Icons.location_on, color: Color(0xFFFF3B30), size: 36))),
          Positioned(
            bottom: 12,
            right: 12,
            child: FloatingActionButton.small(
              onPressed: _getCurrentLocation,
              backgroundColor: const Color(0xFF1E1E1E),
              child: _isLocating 
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) 
                  : const Icon(Icons.my_location, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black87,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Color(0xFFFF3B30)),
            const SizedBox(height: 24),
            Text('Processing Crisis Data', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, color: Colors.white)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.plusJakartaSans(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white38, letterSpacing: 1.2),
    );
  }
}

class _SourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SourceButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(label, style: GoogleFonts.plusJakartaSans(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
