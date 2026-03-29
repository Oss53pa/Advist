import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  Target,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Calendar,
  Users,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for dashboard
const dashboardStats = {
  controlsTotal: 93,
  controlsImplemented: 67,
  controlsPartial: 18,
  controlsNotImplemented: 8,
  risksTotal: 24,
  risksHigh: 3,
  risksMedium: 8,
  risksLow: 13,
  auditsPlanned: 4,
  auditsCompleted: 2,
  findingsOpen: 7,
  objectivesOnTrack: 5,
  objectivesAtRisk: 2,
  nextAuditDate: '2025-02-15',
  lastReviewDate: '2024-12-15',
  certificationStatus: 'En cours',
};

const recentActivities = [
  { id: 1, type: 'control', action: 'Contrôle A.5.1 mis à jour', user: 'Marie Dupont', date: '2024-12-30' },
  { id: 2, type: 'risk', action: 'Nouveau risque identifié: Accès non autorisé', user: 'Jean Martin', date: '2024-12-29' },
  { id: 3, type: 'audit', action: 'Audit interne Q4 terminé', user: 'Sophie Bernard', date: '2024-12-28' },
  { id: 4, type: 'finding', action: 'Non-conformité NC-2024-12 résolue', user: 'Pierre Leroy', date: '2024-12-27' },
];

const upcomingTasks = [
  { id: 1, title: 'Revue de direction Q1 2025', dueDate: '2025-01-15', priority: 'high' },
  { id: 2, title: 'Mise à jour politique de sécurité', dueDate: '2025-01-20', priority: 'medium' },
  { id: 3, title: 'Audit interne - Contrôles A.8', dueDate: '2025-02-01', priority: 'medium' },
  { id: 4, title: 'Formation sensibilisation équipe', dueDate: '2025-02-10', priority: 'low' },
];

const ISO27001DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const implementationRate = Math.round((dashboardStats.controlsImplemented / dashboardStats.controlsTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {t('iso27001.dashboard.title')}
          </h1>
          <p className="text-advist-text-secondary mt-1">
            {t('iso27001.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('iso27001.dashboard.certification')}: {dashboardStats.certificationStatus}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/iso27001/soa" className="group">
          <div className="p-5 bg-white rounded-2xl border border-advist-border hover:border-green-300 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-green-600">{implementationRate}%</span>
            </div>
            <h3 className="font-semibold text-advist-gray900">{t('iso27001.dashboard.controlsImplemented')}</h3>
            <p className="text-sm text-advist-text-secondary mt-1">
              {dashboardStats.controlsImplemented}/{dashboardStats.controlsTotal} {t('iso27001.dashboard.controls')}
            </p>
            <div className="mt-3 h-2 bg-advist-surface-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${implementationRate}%` }}
              />
            </div>
          </div>
        </Link>

        <Link to="/admin/iso27001/risks" className="group">
          <div className="p-5 bg-white rounded-2xl border border-advist-border hover:border-orange-300 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-orange-600">{dashboardStats.risksTotal}</span>
            </div>
            <h3 className="font-semibold text-advist-gray900">{t('iso27001.dashboard.risksIdentified')}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {dashboardStats.risksHigh} {t('iso27001.dashboard.high')}
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                {dashboardStats.risksMedium} {t('iso27001.dashboard.medium')}
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/iso27001/audits" className="group">
          <div className="p-5 bg-white rounded-2xl border border-advist-border hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-blue-600">{dashboardStats.auditsCompleted}/{dashboardStats.auditsPlanned}</span>
            </div>
            <h3 className="font-semibold text-advist-gray900">{t('iso27001.dashboard.auditsCompleted')}</h3>
            <p className="text-sm text-advist-text-secondary mt-1">
              {dashboardStats.findingsOpen} {t('iso27001.dashboard.openFindings')}
            </p>
          </div>
        </Link>

        <Link to="/admin/iso27001/objectives" className="group">
          <div className="p-5 bg-white rounded-2xl border border-advist-border hover:border-purple-300 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-purple-600">{dashboardStats.objectivesOnTrack + dashboardStats.objectivesAtRisk}</span>
            </div>
            <h3 className="font-semibold text-advist-gray900">{t('iso27001.dashboard.smsiObjectives')}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                {dashboardStats.objectivesOnTrack} {t('iso27001.dashboard.onTrack')}
              </span>
              <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                {dashboardStats.objectivesAtRisk} {t('iso27001.dashboard.atRisk')}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls by Category */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-advist-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">{t('iso27001.dashboard.controlsByCategory')}</h2>
            <Link to="/admin/iso27001/soa" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              {t('iso27001.dashboard.viewSoA')}
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'A.5 - Contrôles organisationnels', total: 37, implemented: 28, color: 'bg-blue-500' },
              { name: 'A.6 - Contrôles liés aux personnes', total: 8, implemented: 7, color: 'bg-green-500' },
              { name: 'A.7 - Contrôles physiques', total: 14, implemented: 10, color: 'bg-purple-500' },
              { name: 'A.8 - Contrôles technologiques', total: 34, implemented: 22, color: 'bg-orange-500' },
            ].map((category, i) => {
              const rate = Math.round((category.implemented / category.total) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-advist-gray900">{category.name}</span>
                    <span className="text-advist-text-secondary">
                      {category.implemented}/{category.total} ({rate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-advist-surface-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full ${category.color} rounded-full transition-all`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-2xl border border-advist-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">{t('iso27001.dashboard.upcomingTasks')}</h2>
            <Calendar className="w-5 h-5 text-advist-text-secondary" />
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="p-3 bg-advist-surface rounded-xl hover:bg-advist-surface-dark transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    task.priority === 'high' ? 'bg-red-500' :
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-advist-gray900 truncate">{task.title}</p>
                    <p className="text-xs text-advist-text-secondary mt-1">
                      {t('iso27001.dashboard.deadline')}: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-advist-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">{t('iso27001.dashboard.recentActivity')}</h2>
            <Clock className="w-5 h-5 text-advist-text-secondary" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'control' ? 'bg-green-100' :
                  activity.type === 'risk' ? 'bg-orange-100' :
                  activity.type === 'audit' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'control' && <FileCheck className="w-5 h-5 text-green-600" />}
                  {activity.type === 'risk' && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                  {activity.type === 'audit' && <ClipboardCheck className="w-5 h-5 text-blue-600" />}
                  {activity.type === 'finding' && <CheckCircle className="w-5 h-5 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-advist-gray900">{activity.action}</p>
                  <p className="text-xs text-advist-text-secondary mt-1">
                    {t('iso27001.dashboard.by')} {activity.user} - {new Date(activity.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-advist-border p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">{t('iso27001.dashboard.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/iso27001/soa"
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <FileCheck className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-advist-gray900 text-sm">{t('iso27001.dashboard.soaTitle')}</p>
              <p className="text-xs text-advist-text-secondary mt-1">{t('iso27001.dashboard.soaDescription')}</p>
            </Link>
            <Link
              to="/admin/iso27001/risks"
              className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <AlertTriangle className="w-6 h-6 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-advist-gray900 text-sm">{t('iso27001.dashboard.riskRegister')}</p>
              <p className="text-xs text-advist-text-secondary mt-1">{t('iso27001.dashboard.riskDescription')}</p>
            </Link>
            <Link
              to="/admin/iso27001/audits"
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <ClipboardCheck className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-advist-gray900 text-sm">{t('iso27001.dashboard.auditProgram')}</p>
              <p className="text-xs text-advist-text-secondary mt-1">{t('iso27001.dashboard.auditDescription')}</p>
            </Link>
            <Link
              to="/admin/iso27001/policies"
              className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <FileText className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-advist-gray900 text-sm">{t('iso27001.dashboard.securityPolicies')}</p>
              <p className="text-xs text-advist-text-secondary mt-1">{t('iso27001.dashboard.policiesDescription')}</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-6 bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('iso27001.dashboard.certificationTitle')}</h3>
              <p className="text-primary-200 text-sm">
                {t('iso27001.dashboard.nextReview')}: {new Date(dashboardStats.nextAuditDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{implementationRate}%</p>
              <p className="text-sm text-primary-200">{t('iso27001.dashboard.compliance')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">93</p>
              <p className="text-sm text-primary-200">{t('iso27001.dashboard.controls')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ISO27001DashboardPage;
