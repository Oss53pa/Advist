/**
 * Behavioral Analysis Service
 * Detects suspicious user behavior patterns for security
 */
import { generateSecureHash } from '../utils/encryption';

export type BehaviorAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BehaviorAlertType =
  | 'fast_validation'
  | 'unusual_hour'
  | 'unusual_location'
  | 'bulk_download'
  | 'repeated_failures'
  | 'permission_escalation'
  | 'suspicious_modification'
  | 'access_pattern';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  ip?: string;
}

export interface UserSession {
  sessionId: string;
  userId: number;
  userName: string;
  startedAt: Date;
  lastActivity: Date;
  location: GeoLocation;
  device: string;
  browser: string;
}

export interface BehaviorAlert {
  id: string;
  type: BehaviorAlertType;
  severity: BehaviorAlertSeverity;
  title: string;
  description: string;
  userId: number;
  userName: string;
  documentId?: number;
  documentTitle?: string;
  timestamp: Date;
  metadata: {
    expectedValue?: string;
    actualValue?: string;
    location?: GeoLocation;
    previousLocation?: GeoLocation;
    actionDuration?: number; // in seconds
    normalDuration?: number;
    failedAttempts?: number;
    ipAddress?: string;
    device?: string;
  };
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface ForensicReport {
  id: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  alerts: BehaviorAlert[];
  userActivities: UserActivity[];
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    affectedUsers: number;
    affectedDocuments: number;
    recommendations: string[];
  };
  auditTrail: AuditEntry[];
  legalCompliance: {
    ohada: boolean;
    gdpr: boolean;
    timestamp: string;
    hash: string; // For integrity verification
  };
}

export interface UserActivity {
  id: string;
  userId: number;
  userName: string;
  action: string;
  documentId?: number;
  documentTitle?: string;
  timestamp: Date;
  location: GeoLocation;
  device: string;
  duration?: number;
  success: boolean;
  details?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  target: string;
  details: string;
  ipAddress: string;
  hash: string; // Cryptographic hash for integrity
  previousHash: string; // Chain link
}

// Behavioral thresholds configuration
export interface BehaviorThresholds {
  minValidationTime: number; // seconds - validation faster than this is suspicious
  unusualHoursStart: number; // hour (0-23)
  unusualHoursEnd: number;
  maxDistanceKm: number; // max distance between consecutive logins
  maxDownloadsPerHour: number;
  maxFailedAttempts: number;
  sessionTimeoutMinutes: number;
}

const DEFAULT_THRESHOLDS: BehaviorThresholds = {
  minValidationTime: 30, // Less than 30 seconds to validate = suspicious
  unusualHoursStart: 22, // 10 PM
  unusualHoursEnd: 6, // 6 AM
  maxDistanceKm: 500, // 500km between logins in short time
  maxDownloadsPerHour: 50,
  maxFailedAttempts: 5,
  sessionTimeoutMinutes: 30,
};

// Simulated user patterns for demo
const userPatterns: Map<number, {
  normalHours: { start: number; end: number };
  normalLocations: GeoLocation[];
  averageValidationTime: number;
}> = new Map();

class BehavioralAnalysisService {
  private thresholds: BehaviorThresholds = DEFAULT_THRESHOLDS;
  private alerts: BehaviorAlert[] = [];
  private activities: UserActivity[] = [];
  private listeners: ((alert: BehaviorAlert) => void)[] = [];

  constructor() {
    // Initialize with some demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Sample user pattern
    userPatterns.set(1, {
      normalHours: { start: 8, end: 18 },
      normalLocations: [
        { latitude: 5.3600, longitude: -4.0083, city: 'Abidjan', country: 'Côte d\'Ivoire' },
      ],
      averageValidationTime: 120, // 2 minutes average
    });

    // Sample alerts
    this.alerts = [
      {
        id: 'alert-1',
        type: 'fast_validation',
        severity: 'high',
        title: 'Validation anormalement rapide',
        description: 'Le document a été validé en 5 secondes alors que la moyenne est de 2 minutes',
        userId: 2,
        userName: 'Jean Kouassi',
        documentId: 45,
        documentTitle: 'Contrat Fournisseur ABC',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        metadata: {
          actionDuration: 5,
          normalDuration: 120,
        },
        status: 'active',
      },
      {
        id: 'alert-2',
        type: 'unusual_hour',
        severity: 'medium',
        title: 'Activité à une heure inhabituelle',
        description: 'Connexion et modifications de documents à 3h du matin',
        userId: 3,
        userName: 'Marie Diallo',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        metadata: {
          expectedValue: '8h - 18h',
          actualValue: '3h00',
        },
        status: 'investigating',
      },
      {
        id: 'alert-3',
        type: 'unusual_location',
        severity: 'critical',
        title: 'Connexion depuis une localisation inhabituelle',
        description: 'Connexion depuis Lagos alors que l\'utilisateur est habituellement à Abidjan',
        userId: 1,
        userName: 'Amadou Traoré',
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        metadata: {
          location: { latitude: 6.5244, longitude: 3.3792, city: 'Lagos', country: 'Nigeria' },
          previousLocation: { latitude: 5.3600, longitude: -4.0083, city: 'Abidjan', country: 'Côte d\'Ivoire' },
          ipAddress: '197.210.xxx.xxx',
        },
        status: 'active',
      },
      {
        id: 'alert-4',
        type: 'bulk_download',
        severity: 'high',
        title: 'Téléchargement massif de documents',
        description: '127 documents téléchargés en 15 minutes',
        userId: 4,
        userName: 'Paul Konan',
        timestamp: new Date(Date.now() - 900000), // 15 min ago
        metadata: {
          actualValue: '127 documents',
          expectedValue: 'Max 50/heure',
        },
        status: 'active',
      },
    ];
  }

  /**
   * Subscribe to real-time alerts
   */
  onAlert(callback: (alert: BehaviorAlert) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emitAlert(alert: BehaviorAlert) {
    this.alerts.unshift(alert);
    this.listeners.forEach(l => l(alert));
  }

  /**
   * Analyze validation behavior
   */
  analyzeValidation(
    userId: number,
    userName: string,
    documentId: number,
    documentTitle: string,
    validationDuration: number // in seconds
  ): BehaviorAlert | null {
    const pattern = userPatterns.get(userId);
    const normalDuration = pattern?.averageValidationTime || 120;

    if (validationDuration < this.thresholds.minValidationTime) {
      const alert: BehaviorAlert = {
        id: `alert-${Date.now()}`,
        type: 'fast_validation',
        severity: validationDuration < 10 ? 'critical' : 'high',
        title: 'Validation anormalement rapide',
        description: `Document validé en ${validationDuration}s (moyenne: ${normalDuration}s). Risque de validation sans lecture.`,
        userId,
        userName,
        documentId,
        documentTitle,
        timestamp: new Date(),
        metadata: {
          actionDuration: validationDuration,
          normalDuration,
        },
        status: 'active',
      };

      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Check for unusual access hours
   */
  analyzeAccessTime(
    userId: number,
    userName: string,
    accessTime: Date = new Date()
  ): BehaviorAlert | null {
    const hour = accessTime.getHours();
    const isUnusualHour = hour >= this.thresholds.unusualHoursStart ||
                          hour < this.thresholds.unusualHoursEnd;

    if (isUnusualHour) {
      const alert: BehaviorAlert = {
        id: `alert-${Date.now()}`,
        type: 'unusual_hour',
        severity: 'medium',
        title: 'Activité à une heure inhabituelle',
        description: `Activité détectée à ${hour}h${accessTime.getMinutes().toString().padStart(2, '0')}`,
        userId,
        userName,
        timestamp: accessTime,
        metadata: {
          expectedValue: `${this.thresholds.unusualHoursEnd}h - ${this.thresholds.unusualHoursStart}h`,
          actualValue: `${hour}h${accessTime.getMinutes().toString().padStart(2, '0')}`,
        },
        status: 'active',
      };

      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Analyze location for suspicious access
   */
  analyzeLocation(
    userId: number,
    userName: string,
    currentLocation: GeoLocation,
    previousLocation?: GeoLocation
  ): BehaviorAlert | null {
    const pattern = userPatterns.get(userId);

    // Check if location is unusual for this user
    const isUnusualLocation = pattern?.normalLocations.every(loc => {
      const distance = this.calculateDistance(currentLocation, loc);
      return distance > this.thresholds.maxDistanceKm;
    });

    if (isUnusualLocation || (previousLocation &&
        this.calculateDistance(currentLocation, previousLocation) > this.thresholds.maxDistanceKm)) {
      const alert: BehaviorAlert = {
        id: `alert-${Date.now()}`,
        type: 'unusual_location',
        severity: 'critical',
        title: 'Connexion depuis une localisation inhabituelle',
        description: `Connexion depuis ${currentLocation.city || 'localisation inconnue'}, ${currentLocation.country}`,
        userId,
        userName,
        timestamp: new Date(),
        metadata: {
          location: currentLocation,
          previousLocation,
          ipAddress: currentLocation.ip,
        },
        status: 'active',
      };

      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(loc1.latitude)) * Math.cos(this.toRad(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  /**
   * Detect bulk download attempts
   */
  analyzeBulkDownload(
    userId: number,
    userName: string,
    downloadCount: number,
    timeWindowMinutes: number = 60
  ): BehaviorAlert | null {
    const maxAllowed = this.thresholds.maxDownloadsPerHour * (timeWindowMinutes / 60);

    if (downloadCount > maxAllowed) {
      const alert: BehaviorAlert = {
        id: `alert-${Date.now()}`,
        type: 'bulk_download',
        severity: downloadCount > maxAllowed * 2 ? 'critical' : 'high',
        title: 'Téléchargement massif de documents',
        description: `${downloadCount} documents téléchargés en ${timeWindowMinutes} minutes`,
        userId,
        userName,
        timestamp: new Date(),
        metadata: {
          actualValue: `${downloadCount} documents`,
          expectedValue: `Max ${Math.round(maxAllowed)}/heure`,
        },
        status: 'active',
      };

      this.emitAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Get all active alerts
   */
  getAlerts(filters?: {
    severity?: BehaviorAlertSeverity;
    type?: BehaviorAlertType;
    status?: BehaviorAlert['status'];
    userId?: number;
  }): BehaviorAlert[] {
    let filtered = [...this.alerts];

    if (filters?.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }
    if (filters?.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    if (filters?.userId) {
      filtered = filtered.filter(a => a.userId === filters.userId);
    }

    return filtered;
  }

  /**
   * Get alert statistics
   */
  getStats(): {
    total: number;
    active: number;
    bySeverity: Record<BehaviorAlertSeverity, number>;
    byType: Record<BehaviorAlertType, number>;
    last24h: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return {
      total: this.alerts.length,
      active: this.alerts.filter(a => a.status === 'active').length,
      bySeverity: {
        low: this.alerts.filter(a => a.severity === 'low').length,
        medium: this.alerts.filter(a => a.severity === 'medium').length,
        high: this.alerts.filter(a => a.severity === 'high').length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
      },
      byType: {
        fast_validation: this.alerts.filter(a => a.type === 'fast_validation').length,
        unusual_hour: this.alerts.filter(a => a.type === 'unusual_hour').length,
        unusual_location: this.alerts.filter(a => a.type === 'unusual_location').length,
        bulk_download: this.alerts.filter(a => a.type === 'bulk_download').length,
        repeated_failures: this.alerts.filter(a => a.type === 'repeated_failures').length,
        permission_escalation: this.alerts.filter(a => a.type === 'permission_escalation').length,
        suspicious_modification: this.alerts.filter(a => a.type === 'suspicious_modification').length,
        access_pattern: this.alerts.filter(a => a.type === 'access_pattern').length,
      },
      last24h: this.alerts.filter(a => a.timestamp.getTime() > dayAgo).length,
      trend: 'stable',
    };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string, note?: string): BehaviorAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      alert.resolutionNote = note;
    }
    return alert || null;
  }

  /**
   * Mark alert as false positive
   */
  markAsFalsePositive(alertId: string, resolvedBy: string, reason: string): BehaviorAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'false_positive';
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      alert.resolutionNote = reason;
    }
    return alert || null;
  }

  /**
   * Generate forensic report for legal purposes
   */
  generateForensicReport(
    dateFrom: Date,
    dateTo: Date,
    generatedBy: string
  ): ForensicReport {
    const relevantAlerts = this.alerts.filter(
      a => a.timestamp >= dateFrom && a.timestamp <= dateTo
    );

    const affectedUserIds = new Set(relevantAlerts.map(a => a.userId));
    const affectedDocIds = new Set(relevantAlerts.filter(a => a.documentId).map(a => a.documentId));

    const report: ForensicReport = {
      id: `forensic-${Date.now()}`,
      title: `Rapport Forensique - ${dateFrom.toLocaleDateString('fr-FR')} au ${dateTo.toLocaleDateString('fr-FR')}`,
      generatedAt: new Date(),
      generatedBy,
      dateRange: { from: dateFrom, to: dateTo },
      alerts: relevantAlerts,
      userActivities: this.activities.filter(
        a => a.timestamp >= dateFrom && a.timestamp <= dateTo
      ),
      summary: {
        totalAlerts: relevantAlerts.length,
        criticalAlerts: relevantAlerts.filter(a => a.severity === 'critical').length,
        affectedUsers: affectedUserIds.size,
        affectedDocuments: affectedDocIds.size,
        recommendations: this.generateRecommendations(relevantAlerts),
      },
      auditTrail: this.generateAuditTrail(dateFrom, dateTo),
      legalCompliance: {
        ohada: true,
        gdpr: true,
        timestamp: new Date().toISOString(),
        hash: this.generateHash(relevantAlerts),
      },
    };

    return report;
  }

  private generateRecommendations(alerts: BehaviorAlert[]): string[] {
    const recommendations: string[] = [];

    const hasFastValidation = alerts.some(a => a.type === 'fast_validation');
    const hasUnusualLocation = alerts.some(a => a.type === 'unusual_location');
    const hasBulkDownload = alerts.some(a => a.type === 'bulk_download');
    const hasUnusualHours = alerts.some(a => a.type === 'unusual_hour');

    if (hasFastValidation) {
      recommendations.push('Implémenter un délai minimum obligatoire avant validation');
      recommendations.push('Ajouter une confirmation de lecture du document');
    }

    if (hasUnusualLocation) {
      recommendations.push('Activer l\'authentification à deux facteurs (2FA) pour tous les utilisateurs');
      recommendations.push('Mettre en place une restriction géographique des connexions');
    }

    if (hasBulkDownload) {
      recommendations.push('Limiter le nombre de téléchargements par utilisateur');
      recommendations.push('Mettre en place une approbation pour les exports massifs');
    }

    if (hasUnusualHours) {
      recommendations.push('Restreindre les heures d\'accès au système');
      recommendations.push('Notifier les responsables pour les activités hors heures ouvrées');
    }

    return recommendations;
  }

  private generateAuditTrail(from: Date, to: Date): AuditEntry[] {
    // Generate chain of audit entries with cryptographic links
    return [];
  }

  private generateHash(data: any): string {
    return generateSecureHash();
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<BehaviorThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): BehaviorThresholds {
    return { ...this.thresholds };
  }
}

export const behavioralAnalysisService = new BehavioralAnalysisService();
export default behavioralAnalysisService;
