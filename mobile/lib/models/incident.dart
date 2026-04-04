class Incident {
  final int id;
  final String title;
  final String description;
  final String category;
  final int? severity;
  final double latitude;
  final double longitude;
  final String? address;
  final String? image;
  final String status;
  final String trustStatus;
  final int reportCount;
  final int upvotes;
  final bool isVerified;
  final DateTime createdAt;

  Incident({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.severity,
    this.image,
    required this.latitude,
    required this.longitude,
    this.address,
    required this.status,
    required this.trustStatus,
    required this.reportCount,
    required this.upvotes,
    required this.isVerified,
    required this.createdAt,
  });

  factory Incident.fromJson(Map<String, dynamic> json) {
    return Incident(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'Other',
      severity: json['severity'],
      image: json['image'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'],
      status: json['status'] ?? 'active',
      trustStatus: json['trust_status'] ?? 'Unknown',
      reportCount: json['report_count'] ?? 1,
      upvotes: json['upvotes'] ?? 0,
      isVerified: json['is_verified'] ?? false,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}
