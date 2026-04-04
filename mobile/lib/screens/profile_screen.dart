import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthProvider>(context);
    final String userEmail = authState.userEmail ?? "Demo User";
    final String initial = userEmail.isNotEmpty ? userEmail[0].toUpperCase() : "U";

    return Scaffold(
      appBar: AppBar(
        title: Text('Account Profile', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800)),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            
            // AVATAR SECTION
            Center(
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF3B30), Color(0xFFFF9500)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: const Color(0xFFFF3B30).withOpacity(0.3), blurRadius: 20, spreadRadius: 5),
                  ],
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: GoogleFonts.plusJakartaSans(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // IDENTITY SECTION
            Text(
              userEmail,
              style: GoogleFonts.plusJakartaSans(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF34C759).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF34C759).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.verified, color: Color(0xFF34C759), size: 14),
                  const SizedBox(width: 6),
                  Text(
                    'VERIFIED CITIZEN',
                    style: GoogleFonts.plusJakartaSans(color: const Color(0xFF34C759), fontWeight: FontWeight.w800, fontSize: 10, letterSpacing: 0.5),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 48),
            
            // SETTINGS CARDS
            _buildProfileItem(Icons.security_outlined, 'Privacy & Encryption'),
            _buildProfileItem(Icons.notifications_none_rounded, 'Disaster Alerts'),
            _buildProfileItem(Icons.history_rounded, 'My Recent Reports'),
            _buildProfileItem(Icons.help_outline_rounded, 'Crisis Center Help'),
            
            const SizedBox(height: 40),
            
            // SIGN OUT BUTTON
            OutlinedButton.icon(
              onPressed: () => authState.logout(),
              style: OutlinedButton.styleFrom(
                backgroundColor: const Color(0xFFFF3B30).withOpacity(0.05),
                side: const BorderSide(color: Color(0xFFFF3B30), width: 1.5),
                minimumSize: const Size.fromHeight(56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                foregroundColor: const Color(0xFFFF3B30),
              ),
              icon: const Icon(Icons.logout_rounded),
              label: Text('SIGN OUT', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, letterSpacing: 1.2)),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileItem(IconData icon, String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 22),
          const SizedBox(width: 16),
          Text(
            title,
            style: GoogleFonts.plusJakartaSans(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 15),
          ),
          const Spacer(),
          const Icon(Icons.chevron_right_rounded, color: Colors.white24, size: 20),
        ],
      ),
    );
  }
}
