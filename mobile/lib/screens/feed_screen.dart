import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../providers/incident_provider.dart';
import '../providers/auth_provider.dart';
import '../models/incident.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final token = context.read<AuthProvider>().token;
      context.read<IncidentProvider>().fetchIncidents(token);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Emergency Feed', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800)),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              final token = context.read<AuthProvider>().token;
              context.read<IncidentProvider>().fetchIncidents(token);
            },
          ),
        ],
      ),
      body: Consumer<IncidentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.incidents.isEmpty) {
            return _buildShimmerLoading();
          }

          if (provider.incidents.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox_outlined, size: 64, color: Colors.white24),
                  const SizedBox(height: 16),
                  Text('No recent incidents', style: GoogleFonts.plusJakartaSans(color: Colors.white38)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: const Color(0xFFFF3B30),
            backgroundColor: const Color(0xFF1E1E1E),
            onRefresh: () async {
              final token = context.read<AuthProvider>().token;
              await context.read<IncidentProvider>().fetchIncidents(token);
            },
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: provider.incidents.length,
              itemBuilder: (context, index) {
                final incident = provider.incidents[index];
                return _IncidentCard(incident: incident);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.white10,
          highlightColor: Colors.white24,
          child: Container(
            height: 140,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        );
      },
    );
  }
}

class _IncidentCard extends StatelessWidget {
  final Incident incident;

  const _IncidentCard({required this.incident});

  Color _getSeverityColor() {
    if ((incident.severity ?? 0) >= 4) return const Color(0xFFFF3B30);
    if ((incident.severity ?? 0) >= 3) return const Color(0xFFFF9500);
    return const Color(0xFF34C759);
  }

  @override
  Widget build(BuildContext context) {
    final severityColor = _getSeverityColor();
    final timeStr = DateFormat('hh:mm a').format(incident.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          children: [
            if (incident.image != null)
              Hero(
                tag: 'incident-${incident.id}',
                child: Image.network(
                  incident.image!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: severityColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          incident.category.toUpperCase(),
                          style: GoogleFonts.plusJakartaSans(color: severityColor, fontWeight: FontWeight.w800, fontSize: 10),
                        ),
                      ),
                      Text(timeStr, style: GoogleFonts.plusJakartaSans(color: Colors.white38, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    incident.title,
                    style: GoogleFonts.plusJakartaSans(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    incident.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(color: Colors.white70, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _InfoStat(icon: Icons.people_outline, label: '${incident.reportCount} reports'),
                      const SizedBox(width: 16),
                      if (incident.isVerified)
                        const _InfoStat(icon: Icons.verified_user_outlined, label: 'Verified', color: Color(0xFF34C759)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;

  const _InfoStat({required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color ?? Colors.white24),
        const SizedBox(width: 6),
        Text(label, style: GoogleFonts.plusJakartaSans(color: color ?? Colors.white38, fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
