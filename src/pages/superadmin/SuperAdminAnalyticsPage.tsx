import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  FileText,
  HardDrive,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  PieChart,
  Map,
  Filter,
} from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui';

// Types
interface TenantMetric {
  name: string;
  country: string;
  plan: string;
  users: number;
  documents: number;
  signatures: number;
  storage: number;
  revenue: number;
  growth: number;
}

// Mock data
const platformMetrics = [
  { label: 'Revenus mensuels', value: '45,678,000 FCFA', change: 12.5, icon: DollarSign, color: 'green' },
  { label: 'Organisations actives', value: '47', change: 8.3, icon: Building2, color: 'blue' },
  { label: 'Utilisateurs totaux', value: '1,234', change: 15.2, icon: Users, color: 'purple' },
  { label: 'Documents traites', value: '156,789', change: 22.1, icon: FileText, color: 'orange' },
];

const revenueByPlan = [
  { plan: 'Enterprise', revenue: 28500000, percentage: 62, color: '#8B5CF6' },
  { plan: 'Business', revenue: 12300000, percentage: 27, color: '#3B82F6' },
  { plan: 'Starter', revenue: 4878000, percentage: 11, color: '#6B7280' },
];

const tenantsByCountry = [
  { country: 'Cote d\'Ivoire', code: 'CI', tenants: 18, users: 456, revenue: 18500000 },
  { country: 'Senegal', code: 'SN', tenants: 12, users: 312, revenue: 12300000 },
  { country: 'Cameroun', code: 'CM', tenants: 8, users: 198, revenue: 8200000 },
  { country: 'Mali', code: 'ML', tenants: 5, users: 145, revenue: 4100000 },
  { country: 'Burkina Faso', code: 'BF', tenants: 4, users: 123, revenue: 2578000 },
];

const monthlyGrowth = [
  { month: 'Jan', tenants: 32, users: 890, revenue: 32000000 },
  { month: 'Fev', tenants: 34, users: 945, revenue: 34500000 },
  { month: 'Mar', tenants: 36, users: 1012, revenue: 36800000 },
  { month: 'Avr', tenants: 38, users: 1078, revenue: 38200000 },
  { month: 'Mai', tenants: 40, users: 1098, revenue: 40100000 },
  { month: 'Juin', tenants: 42, users: 1145, revenue: 42300000 },
  { month: 'Juil', tenants: 43, users: 1167, revenue: 43100000 },
  { month: 'Aout', tenants: 44, users: 1189, revenue: 43800000 },
  { month: 'Sept', tenants: 45, users: 1201, revenue: 44200000 },
  { month: 'Oct', tenants: 46, users: 1218, revenue: 44900000 },
  { month: 'Nov', tenants: 47, users: 1234, revenue: 45678000 },
];

const topTenants: TenantMetric[] = [
  { name: 'Societe Generale CI', country: 'CI', plan: 'Enterprise', users: 156, documents: 12500, signatures: 45000, storage: 234, revenue: 8500000, growth: 15 },
  { name: 'Orange Cote d\'Ivoire', country: 'CI', plan: 'Enterprise', users: 89, documents: 8900, signatures: 32000, storage: 156, revenue: 6200000, growth: 12 },
  { name: 'BCEAO', country: 'SN', plan: 'Enterprise', users: 78, documents: 7800, signatures: 28000, storage: 145, revenue: 5800000, growth: 18 },
  { name: 'Ecobank Mali', country: 'ML', plan: 'Business', users: 45, documents: 4500, signatures: 16000, storage: 89, revenue: 2400000, growth: 22 },
  { name: 'NSIA Assurances', country: 'CI', plan: 'Business', users: 34, documents: 3400, signatures: 12000, storage: 67, revenue: 1800000, growth: 8 },
];

const usageMetrics = [
  { label: 'Signatures/jour', value: '12,456', trend: '+8.3%' },
  { label: 'Documents/jour', value: '3,892', trend: '+12.1%' },
  { label: 'Connexions/jour', value: '8,234', trend: '+5.7%' },
  { label: 'API calls/jour', value: '156,789', trend: '+22.4%' },
];

export const SuperAdminAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat('fr-FR').format(value)  } FCFA`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            Analytics Plateforme
          </h1>
          <p className="text-advist-gray900 mt-1">
            Vue d'ensemble des performances globales de la plateforme ADVIST
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-advist-bg p-1">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-240 ${
                  dateRange === range
                    ? 'bg-[#1a1a2e] text-white'
                    : 'text-advist-gray900 hover:bg-advist-bg'
                }`}
              >
                {range === 'week' && 'Semaine'}
                {range === 'month' && 'Mois'}
                {range === 'quarter' && 'Trimestre'}
                {range === 'year' && 'Annee'}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformMetrics.map((metric, index) => (
          <Card key={index} className="p-5 bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {metric.change >= 0 ? (
                    <ArrowUpRight size={14} className="text-advist-success" />
                  ) : (
                    <ArrowDownRight size={14} className="text-advist-error" />
                  )}
                  <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-advist-success' : 'text-advist-error'}`}>
                    {Math.abs(metric.change)}%
                  </span>
                  <span className="text-xs text-white/50">vs mois dernier</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-white/10`}>
                <metric.icon size={24} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-advist-gray900">Croissance mensuelle</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-advist-dark" />
                <span className="text-advist-gray900">Revenus (M FCFA)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-advist-dark" />
                <span className="text-advist-gray900">Utilisateurs</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyGrowth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-advist-dark rounded-t transition-all hover:bg-advist-dark"
                    style={{ height: `${(data.revenue / 50000000) * 100}%` }}
                    title={`Revenus: ${formatCurrency(data.revenue)}`}
                  />
                  <div
                    className="w-full bg-advist-dark rounded-b transition-all hover:bg-advist-dark"
                    style={{ height: `${(data.users / 1500) * 100}%` }}
                    title={`Utilisateurs: ${data.users}`}
                  />
                </div>
                <span className="text-xs text-advist-gray900">{data.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-advist-gray900 mb-6">Revenus par plan</h2>

          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {revenueByPlan.reduce((acc, item, index) => {
                  const prevTotal = revenueByPlan.slice(0, index).reduce((sum, i) => sum + i.percentage, 0);
                  const circumference = 2 * Math.PI * 35;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((prevTotal / 100) * circumference);

                  acc.push(
                    <circle
                      key={item.plan}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-advist-gray900">45.6M</p>
                  <p className="text-xs text-advist-gray900">FCFA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {revenueByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-advist-gray900">{item.plan}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-advist-gray900">{item.percentage}%</span>
                  <p className="text-xs text-advist-gray900">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Geographic Distribution & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Country */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">Distribution geographique</h2>
            </div>
          </div>

          <div className="space-y-4">
            {tenantsByCountry.map((country) => (
              <div key={country.code} className="flex items-center gap-4 p-3 bg-advist-bg rounded-xl">
                <div className="w-10 h-10 bg-[#1a1a2e] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {country.code}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-advist-gray900">{country.country}</span>
                    <span className="text-sm text-advist-gray900">{country.tenants} orgs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-advist-gray900">
                    <span>{country.users} utilisateurs</span>
                    <span className="font-medium text-advist-success">{formatCurrency(country.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Usage Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-advist-gray900" />
              <h2 className="text-lg font-semibold text-advist-gray900">Metriques d'utilisation</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {usageMetrics.map((metric) => (
              <div key={metric.label} className="p-4 bg-advist-bg rounded-xl">
                <p className="text-xs text-advist-gray900 mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-advist-gray900">{metric.value}</p>
                <p className="text-xs text-advist-success mt-1">{metric.trend}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-primary-50 rounded-xl border border-advist-success">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-advist-success" />
              <span className="font-medium text-advist-gray900">Performance globale</span>
            </div>
            <p className="text-sm text-advist-gray900">
              La plateforme affiche une croissance de <span className="font-bold text-advist-success">+18.5%</span> ce mois-ci
              avec un taux d'adoption en hausse dans la region UEMOA.
            </p>
          </div>
        </Card>
      </div>

      {/* Top Tenants Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-advist-gray900">Top organisations</h2>
          <Button variant="outline" size="sm">
            <Filter size={14} className="mr-2" />
            Filtrer
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-advist-bg">
                <th className="text-left py-3 px-4 text-sm font-medium text-advist-gray900">Organisation</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-advist-gray900">Plan</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Utilisateurs</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Documents</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Signatures</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Revenus</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-advist-gray900">Croissance</th>
              </tr>
            </thead>
            <tbody>
              {topTenants.map((tenant, index) => (
                <tr key={tenant.name} className="border-b border-advist-bg hover:bg-advist-bg">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1a1a2e] rounded-xl flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-advist-gray900">{tenant.name}</p>
                        <p className="text-xs text-advist-gray900">{tenant.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant={tenant.plan === 'Enterprise' ? 'primary' : 'default'}>
                      {tenant.plan}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-advist-gray900">
                    {tenant.users}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-advist-gray900">
                    {tenant.documents.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-advist-gray900">
                    {tenant.signatures.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-advist-gray900">
                    {formatCurrency(tenant.revenue)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp size={14} className="text-advist-success" />
                      <span className="text-sm font-medium text-advist-success">+{tenant.growth}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminAnalyticsPage;
