import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Users,
  FileText,
  HardDrive,
  CheckCircle,
  XCircle,
  Pause,
  Clock,
  Eye,
  Settings,
  Trash2,
  Download,
  Globe,
  Mail,
  Calendar,
  TrendingUp,
  Edit,
  CreditCard,
  DollarSign,
  Zap,
  Shield,
  Database,
  Activity,
  Save,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button, Badge, Modal, Input, Card } from '../../components/ui';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  description?: string;
  logo?: string;
  sector?: string;
  companySize?: string;
  plan: 'business' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  users: number;
  maxUsers: number;
  documents: number;
  maxDocuments: number;
  storage: number;
  maxStorage: number;
  maxWorkflows: number;
  maxSignatures: number;
  country: string;
  currency: string;
  timezone?: string;
  language?: string;
  ohada: boolean;
  twoFactorRequired: boolean;
  ssoEnabled: boolean;
  ssoProvider?: string;
  ipWhitelist?: string[];
  createdAt: string;
  lastActivity: string;
  billingCycle: 'monthly' | 'yearly';
  nextBilling: string;
  lastPayment?: string;
  paymentMethod?: string;
  monthlyPrice: number;
  discount: number;
  features: string[];
  enabledModules: string[];
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  notes?: string;
  trialEndsAt?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxUsers: number;
  maxStorage: number;
  maxDocuments: number;
  features: string[];
  popular?: boolean;
}

// Pricing Plans (FCFA)
const pricingPlans: PricingPlan[] = [
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 149000,
    yearlyPrice: 1430000,
    currency: 'FCFA',
    maxUsers: 50,
    maxStorage: 100,
    maxDocuments: 5000,
    features: [
      '50 utilisateurs max',
      '100 GB stockage',
      '5000 documents/mois',
      'Signatures electroniques avancees',
      'Conformite OHADA',
      'Support prioritaire',
      'API complete',
      'Workflows personnalises',
      'Rapports avances',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 399000,
    yearlyPrice: 3830000,
    currency: 'FCFA',
    maxUsers: 500,
    maxStorage: 500,
    maxDocuments: -1, // Unlimited
    features: [
      'Utilisateurs illimites',
      '500 GB stockage',
      'Documents illimites',
      'Toutes fonctionnalites Business',
      'SSO / SAML',
      'Support dedie 24/7',
      'SLA garanti 99.9%',
      'Formation personnalisee',
      'Integration sur mesure',
      'Audit de securite',
    ],
  },
];

// Secteurs d'activité
const SECTORS = [
  { id: 'finance', label: 'Finance & Banque' },
  { id: 'legal', label: 'Juridique & Cabinet' },
  { id: 'insurance', label: 'Assurance' },
  { id: 'telecom', label: 'Telecom & IT' },
  { id: 'manufacturing', label: 'Industrie & Manufacturing' },
  { id: 'retail', label: 'Commerce & Distribution' },
  { id: 'healthcare', label: 'Sante' },
  { id: 'education', label: 'Education' },
  { id: 'government', label: 'Secteur Public' },
  { id: 'ngo', label: 'ONG & Association' },
  { id: 'other', label: 'Autre' },
];

// Tailles d'entreprise
const COMPANY_SIZES = [
  { id: '1-10', label: '1-10 employes' },
  { id: '11-50', label: '11-50 employes' },
  { id: '51-200', label: '51-200 employes' },
  { id: '201-500', label: '201-500 employes' },
  { id: '500+', label: 'Plus de 500 employes' },
];

// Pays
const COUNTRIES = [
  { code: 'CI', name: 'Cote d\'Ivoire', currency: 'XOF', timezone: 'Africa/Abidjan' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', timezone: 'Africa/Dakar' },
  { code: 'ML', name: 'Mali', currency: 'XOF', timezone: 'Africa/Bamako' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', timezone: 'Africa/Ouagadougou' },
  { code: 'NE', name: 'Niger', currency: 'XOF', timezone: 'Africa/Niamey' },
  { code: 'TG', name: 'Togo', currency: 'XOF', timezone: 'Africa/Lome' },
  { code: 'BJ', name: 'Benin', currency: 'XOF', timezone: 'Africa/Porto-Novo' },
  { code: 'GW', name: 'Guinee-Bissau', currency: 'XOF', timezone: 'Africa/Bissau' },
  { code: 'CM', name: 'Cameroun', currency: 'XAF', timezone: 'Africa/Douala' },
  { code: 'GA', name: 'Gabon', currency: 'XAF', timezone: 'Africa/Libreville' },
  { code: 'CG', name: 'Congo', currency: 'XAF', timezone: 'Africa/Brazzaville' },
  { code: 'TD', name: 'Tchad', currency: 'XAF', timezone: 'Africa/Ndjamena' },
  { code: 'CF', name: 'Centrafrique', currency: 'XAF', timezone: 'Africa/Bangui' },
  { code: 'GQ', name: 'Guinee Equatoriale', currency: 'XAF', timezone: 'Africa/Malabo' },
  { code: 'MA', name: 'Maroc', currency: 'MAD', timezone: 'Africa/Casablanca' },
  { code: 'TN', name: 'Tunisie', currency: 'TND', timezone: 'Africa/Tunis' },
  { code: 'FR', name: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
];

// Modules disponibles
const AVAILABLE_MODULES = [
  { id: 'documents', label: 'Gestion documentaire', description: 'Upload, classement, versioning' },
  { id: 'workflows', label: 'Workflows de validation', description: 'Circuits d\'approbation' },
  { id: 'signatures', label: 'Signatures electroniques', description: 'Signature qualifiee OHADA' },
  { id: 'ocr', label: 'OCR & Extraction', description: 'Reconnaissance de texte' },
  { id: 'ai_analysis', label: 'Analyse IA', description: 'Detection d\'anomalies, classification' },
  { id: 'api', label: 'API & Integrations', description: 'REST API, webhooks' },
  { id: 'audit', label: 'Piste d\'audit', description: 'Tracabilite complete' },
  { id: 'reports', label: 'Rapports avances', description: 'Tableaux de bord, exports' },
  { id: 'templates', label: 'Modeles de documents', description: 'Templates personnalises' },
  { id: 'mobile', label: 'Application mobile', description: 'iOS & Android' },
  { id: 'sso', label: 'SSO / SAML', description: 'Authentification unique' },
  { id: 'advanced_security', label: 'Securite avancee', description: '2FA, IP whitelist' },
];

// Mock tenants data
const mockTenants: Tenant[] = [
  {
    id: 1,
    name: 'ADVIST Demo',
    slug: 'advist-demo',
    email: 'admin@advist-demo.com',
    phone: '+225 07 00 00 00 00',
    address: 'Rue des Jardins, Lot 45',
    city: 'Abidjan - Cocody',
    postalCode: '01 BP 1234',
    website: 'https://advist-demo.com',
    description: 'Organisation de demonstration pour les tests et presentations commerciales.',
    sector: 'telecom',
    companySize: '11-50',
    plan: 'business',
    status: 'active',
    users: 12,
    maxUsers: 50,
    documents: 2456,
    maxDocuments: 5000,
    storage: 45,
    maxStorage: 100,
    maxWorkflows: 100,
    maxSignatures: 500,
    country: 'CI',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    ohada: true,
    twoFactorRequired: false,
    ssoEnabled: false,
    createdAt: '2024-01-15',
    lastActivity: '2024-11-28T10:30:00',
    billingCycle: 'yearly',
    nextBilling: '2025-01-15',
    lastPayment: '2024-01-15',
    paymentMethod: 'Carte bancaire (**** 4242)',
    monthlyPrice: 149000,
    discount: 20,
    features: ['Signatures electroniques', 'OHADA', 'API complete'],
    enabledModules: ['documents', 'workflows', 'signatures', 'ocr', 'audit', 'reports'],
    adminName: 'Jean Kouame',
    adminEmail: 'jean.kouame@advist-demo.com',
    adminPhone: '+225 07 00 00 00 01',
    notes: 'Client demo - Acces complet pour presentations.',
  },
  {
    id: 2,
    name: 'Societe Generale CI',
    slug: 'sgci',
    email: 'tech@sgci.ci',
    phone: '+225 27 20 20 20 20',
    address: '5-7 Avenue Joseph Anoma',
    city: 'Abidjan - Plateau',
    postalCode: '01 BP 1355',
    website: 'https://www.societegenerale.ci',
    description: 'Filiale ivoirienne du groupe Societe Generale. Leader bancaire en Afrique de l\'Ouest.',
    sector: 'finance',
    companySize: '500+',
    plan: 'enterprise',
    status: 'active',
    users: 156,
    maxUsers: 500,
    documents: 12500,
    maxDocuments: -1,
    storage: 234,
    maxStorage: 500,
    maxWorkflows: -1,
    maxSignatures: -1,
    country: 'CI',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    ohada: true,
    twoFactorRequired: true,
    ssoEnabled: true,
    ssoProvider: 'Azure AD',
    ipWhitelist: ['41.207.xxx.xxx', '196.170.xxx.xxx'],
    createdAt: '2023-06-01',
    lastActivity: '2024-11-28T10:25:00',
    billingCycle: 'yearly',
    nextBilling: '2024-06-01',
    lastPayment: '2023-06-01',
    paymentMethod: 'Virement bancaire',
    monthlyPrice: 399000,
    discount: 20,
    features: ['SSO/SAML', 'Support dedie', 'SLA 99.9%'],
    enabledModules: ['documents', 'workflows', 'signatures', 'ocr', 'ai_analysis', 'api', 'audit', 'reports', 'templates', 'mobile', 'sso', 'advanced_security'],
    adminName: 'Amadou Diallo',
    adminEmail: 'amadou.diallo@sgci.ci',
    adminPhone: '+225 27 20 20 20 21',
    notes: 'Client strategique - Support VIP. Contact commercial: Marie Dupont.',
  },
  {
    id: 3,
    name: 'Cabinet Juridique Kouassi',
    slug: 'cjk',
    email: 'contact@cjk.ci',
    phone: '+225 07 07 07 07 07',
    address: 'Immeuble CCIA, 8eme etage',
    city: 'Abidjan - Marcory',
    postalCode: '18 BP 2345',
    website: 'https://cabinet-kouassi.ci',
    description: 'Cabinet d\'avocats specialise en droit des affaires OHADA.',
    sector: 'legal',
    companySize: '1-10',
    plan: 'business',
    status: 'suspended',
    users: 8,
    maxUsers: 10,
    documents: 450,
    maxDocuments: 1000,
    storage: 12,
    maxStorage: 20,
    maxWorkflows: 10,
    maxSignatures: 100,
    country: 'CI',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    ohada: true,
    twoFactorRequired: false,
    ssoEnabled: false,
    createdAt: '2024-03-20',
    lastActivity: '2024-11-23T14:00:00',
    billingCycle: 'monthly',
    nextBilling: '2024-12-20',
    lastPayment: '2024-10-20',
    paymentMethod: 'Mobile Money (Orange)',
    monthlyPrice: 49000,
    discount: 0,
    features: ['Signatures electroniques', 'Support email'],
    enabledModules: ['documents', 'workflows', 'signatures', 'audit'],
    adminName: 'Me Yao Kouassi',
    adminEmail: 'yao.kouassi@cjk.ci',
    adminPhone: '+225 07 07 07 07 08',
    notes: 'Suspendu pour impaye - 2 mois de retard. Relance envoyee le 25/11.',
  },
  {
    id: 4,
    name: 'Orange Cote d\'Ivoire',
    slug: 'orange-ci',
    email: 'ged@orange.ci',
    phone: '+225 21 23 90 00',
    address: 'Immeuble Orange, Boulevard VGE',
    city: 'Abidjan - Plateau',
    postalCode: '01 BP 2000',
    website: 'https://www.orange.ci',
    description: 'Premier operateur de telecommunications en Cote d\'Ivoire.',
    sector: 'telecom',
    companySize: '500+',
    plan: 'enterprise',
    status: 'active',
    users: 89,
    maxUsers: 200,
    documents: 8900,
    maxDocuments: -1,
    storage: 156,
    maxStorage: 300,
    maxWorkflows: -1,
    maxSignatures: -1,
    country: 'CI',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    ohada: true,
    twoFactorRequired: true,
    ssoEnabled: true,
    ssoProvider: 'Okta',
    createdAt: '2023-09-15',
    lastActivity: '2024-11-28T10:15:00',
    billingCycle: 'yearly',
    nextBilling: '2024-09-15',
    lastPayment: '2023-09-15',
    paymentMethod: 'Virement bancaire',
    monthlyPrice: 350000,
    discount: 25,
    features: ['SSO/SAML', 'Support dedie', 'Integration personnalisee'],
    enabledModules: ['documents', 'workflows', 'signatures', 'ocr', 'ai_analysis', 'api', 'audit', 'reports', 'templates', 'sso', 'advanced_security'],
    adminName: 'Fatou Sow',
    adminEmail: 'fatou.sow@orange.ci',
    adminPhone: '+225 21 23 90 01',
    notes: 'Integration API avec leur ERP SAP en cours. Chef de projet: Paul Martin.',
  },
  {
    id: 5,
    name: 'Test Organisation',
    slug: 'test-org',
    email: 'test@example.com',
    description: 'Organisation de test pour la periode d\'essai.',
    sector: 'other',
    companySize: '1-10',
    plan: 'business',
    status: 'trial',
    users: 3,
    maxUsers: 5,
    documents: 25,
    maxDocuments: 100,
    storage: 1,
    maxStorage: 5,
    maxWorkflows: 3,
    maxSignatures: 20,
    country: 'SN',
    currency: 'XOF',
    timezone: 'Africa/Dakar',
    language: 'fr',
    ohada: true,
    twoFactorRequired: false,
    ssoEnabled: false,
    createdAt: '2024-11-01',
    lastActivity: '2024-11-28T09:00:00',
    billingCycle: 'monthly',
    nextBilling: '2024-12-01',
    monthlyPrice: 0,
    discount: 100,
    features: ['Essai gratuit 14 jours'],
    enabledModules: ['documents', 'workflows', 'signatures'],
    trialEndsAt: '2024-11-15',
    adminName: 'Moussa Ndiaye',
    adminEmail: 'moussa@example.com',
    notes: 'En periode d\'essai. Fin du trial: 15/11/2024. Relance commerciale prevue.',
  },
  {
    id: 6,
    name: 'Banque Atlantique',
    slug: 'ba-group',
    email: 'dsi@banque-atlantique.net',
    phone: '+225 27 20 31 15 15',
    address: 'Avenue Noguès',
    city: 'Abidjan - Plateau',
    postalCode: '04 BP 1036',
    website: 'https://www.banqueatlantique.net',
    description: 'Groupe bancaire panafricain present dans 7 pays de l\'UEMOA.',
    sector: 'finance',
    companySize: '500+',
    plan: 'custom',
    status: 'active',
    users: 234,
    maxUsers: 300,
    documents: 18900,
    maxDocuments: -1,
    storage: 345,
    maxStorage: 500,
    maxWorkflows: -1,
    maxSignatures: -1,
    country: 'CI',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    language: 'fr',
    ohada: true,
    twoFactorRequired: true,
    ssoEnabled: true,
    ssoProvider: 'Microsoft ADFS',
    ipWhitelist: ['41.202.xxx.xxx'],
    createdAt: '2023-03-10',
    lastActivity: '2024-11-28T10:28:00',
    billingCycle: 'yearly',
    nextBilling: '2025-03-10',
    lastPayment: '2024-03-10',
    paymentMethod: 'Virement bancaire',
    monthlyPrice: 500000,
    discount: 15,
    features: ['Plan sur mesure', 'Support VIP', 'Formation incluse'],
    enabledModules: ['documents', 'workflows', 'signatures', 'ocr', 'ai_analysis', 'api', 'audit', 'reports', 'templates', 'mobile', 'sso', 'advanced_security'],
    adminName: 'Ibrahim Toure',
    adminEmail: 'ibrahim.toure@banque-atlantique.net',
    adminPhone: '+225 27 20 31 15 16',
    notes: 'Contrat sur mesure negocie. Inclut 5 jours de formation/an et support telephonique 24/7.',
  },
];

// Onglets du modal d'édition
type EditTab = 'general' | 'contact' | 'billing' | 'quotas' | 'modules' | 'security' | 'notes';

export const TenantsPage: React.FC = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Tenant>>({});
  const [editTab, setEditTab] = useState<EditTab>('general');

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || tenant.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanBadge = (plan: string) => {
    const styles = {
      starter: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900', label: 'Starter' },
      business: { bg: 'bg-advist-gold-light', text: 'text-advist-gray900', label: 'Business' },
      enterprise: { bg: 'bg-advist-surface-dark', text: 'text-advist-gray900', label: 'Enterprise' },
      custom: { bg: 'bg-advist-gold-light', text: 'text-advist-gold-dark', label: 'Sur mesure' },
    };
    return styles[plan as keyof typeof styles] || styles.starter;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-advist-success', bg: 'bg-green-50', label: 'Actif' };
      case 'suspended':
        return { icon: Pause, color: 'text-advist-gold-dark', bg: 'bg-advist-gold-light', label: 'Suspendu' };
      case 'trial':
        return { icon: Clock, color: 'text-advist-gray900', bg: 'bg-advist-gold-light', label: 'Essai' };
      default:
        return { icon: XCircle, color: 'text-advist-error', bg: 'bg-advist-gold-light', label: 'Inactif' };
    }
  };

  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return `${new Intl.NumberFormat('fr-FR').format(amount)  } ${  currency === 'XOF' ? 'FCFA' : currency}`;
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditFormData({ ...tenant });
    setEditTab('general');
    setShowEditModal(true);
  };

  const toggleModule = (moduleId: string) => {
    const currentModules = editFormData.enabledModules || [];
    if (currentModules.includes(moduleId)) {
      setEditFormData({
        ...editFormData,
        enabledModules: currentModules.filter(m => m !== moduleId)
      });
    } else {
      setEditFormData({
        ...editFormData,
        enabledModules: [...currentModules, moduleId]
      });
    }
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.name || code;
  };

  const getSectorLabel = (id: string) => {
    return SECTORS.find(s => s.id === id)?.label || id;
  };

  const getCompanySizeLabel = (id: string) => {
    return COMPANY_SIZES.find(s => s.id === id)?.label || id;
  };

  const handleSaveEdit = () => {
    if (selectedTenant && editFormData) {
      setTenants(tenants.map(t =>
        t.id === selectedTenant.id ? { ...t, ...editFormData } : t
      ));
      setShowEditModal(false);
      setSelectedTenant(null);
    }
  };

  // Stats
  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    trial: tenants.filter((t) => t.status === 'trial').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
    totalUsers: tenants.reduce((sum, t) => sum + t.users, 0),
    totalDocuments: tenants.reduce((sum, t) => sum + t.documents, 0),
    totalStorage: tenants.reduce((sum, t) => sum + t.storage, 0),
    totalRevenue: tenants.reduce((sum, t) => sum + (t.monthlyPrice * (100 - t.discount) / 100), 0),
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-advist-gray900">
            {t('superadmin.tenants.title', 'Gestion des organisations')}
          </h1>
          <p className="text-advist-blue-light mt-1">
            {t('superadmin.tenants.subtitle', 'Gerez toutes les organisations de la plateforme')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowPricingModal(true)}>
            <CreditCard size={18} className="mr-2" />
            Grille tarifaire
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            {t('superadmin.tenants.create', 'Nouvelle organisation')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light rounded-xl">
              <Building2 size={20} className="text-advist-gray900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.total}</p>
              <p className="text-sm text-advist-blue-light">Organisations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <Users size={20} className="text-advist-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-advist-blue-light">Utilisateurs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-surface-dark rounded-xl">
              <FileText size={20} className="text-advist-gray900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.totalDocuments.toLocaleString()}</p>
              <p className="text-sm text-advist-blue-light">Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-advist-gold-light rounded-xl">
              <HardDrive size={20} className="text-advist-gold-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold text-advist-gray900">{stats.totalStorage} GB</p>
              <p className="text-sm text-advist-blue-light">Stockage</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-advist-bg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <DollarSign size={20} className="text-advist-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-advist-gray900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-advist-blue-light">Revenus/mois</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-advist-bg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-advist-blue-light" />
            <input
              type="text"
              placeholder={t('superadmin.tenants.search', 'Rechercher une organisation...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">Tous les plans</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Sur mesure</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="trial">Essai</option>
              <option value="suspended">Suspendu</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-advist-bg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-advist-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Organisation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Plan / Tarif
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Utilisateurs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Stockage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-advist-blue-light uppercase">
                  Facturation
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-advist-blue-light uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-advist-bg">
              {filteredTenants.map((tenant) => {
                const plan = getPlanBadge(tenant.plan);
                const status = getStatusInfo(tenant.status);
                const storagePercent = (tenant.storage / tenant.maxStorage) * 100;
                const userPercent = (tenant.users / tenant.maxUsers) * 100;
                const effectivePrice = tenant.monthlyPrice * (100 - tenant.discount) / 100;

                return (
                  <tr key={tenant.id} className="hover:bg-advist-bg/50 transition-all duration-240">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-advist-dark rounded-xl flex items-center justify-center text-white font-semibold">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-advist-gray900">{tenant.name}</p>
                          <div className="flex items-center gap-2 text-xs text-advist-blue-light">
                            <span>{tenant.slug}</span>
                            {tenant.ohada && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-advist-success rounded text-[10px]">
                                OHADA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-xl ${plan.bg} ${plan.text}`}>
                          {plan.label}
                        </span>
                        <p className="text-xs text-advist-gray900 mt-1 font-medium">
                          {formatCurrency(effectivePrice)}
                          {tenant.discount > 0 && (
                            <span className="text-advist-success ml-1">(-{tenant.discount}%)</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium text-advist-gray900">{tenant.users}</span>
                          <span className="text-advist-blue-light">/ {tenant.maxUsers}</span>
                        </div>
                        <div className="w-20 h-1.5 bg-advist-bg rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              userPercent > 90 ? 'bg-advist-error' : userPercent > 70 ? 'bg-advist-gold' : 'bg-advist-success'
                            }`}
                            style={{ width: `${Math.min(userPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium text-advist-gray900">{tenant.storage} GB</span>
                          <span className="text-advist-blue-light">/ {tenant.maxStorage}</span>
                        </div>
                        <div className="w-20 h-1.5 bg-advist-bg rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              storagePercent > 90 ? 'bg-advist-error' : storagePercent > 70 ? 'bg-advist-gold' : 'bg-advist-success'
                            }`}
                            style={{ width: `${Math.min(storagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl ${status.bg}`}>
                        <status.icon size={14} className={status.color} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm text-advist-gray900 capitalize">{tenant.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}</p>
                        <p className="text-xs text-advist-blue-light">
                          Prochain: {new Date(tenant.nextBilling).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDetailModal(true);
                          }}
                          title={t('common.viewDetails')}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTenant(tenant)}
                          title={t('common.edit')}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" title={t('common.moreOptions')}>
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-advist-bg">
          <p className="text-sm text-advist-blue-light">
            Affichage de {filteredTenants.length} sur {tenants.length} organisations
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled>
              Precedent
            </Button>
            <Button variant="ghost" size="sm" disabled>
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title={t('superadmin.pricingGrid')}
        size="xl"
      >
        <div className="space-y-6">
          <p className="text-sm text-advist-gray900">
            Plans et tarifs standards pour les organisations. Les tarifs sont en FCFA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-xl border-2 ${
                  plan.popular ? 'border-advist-gold bg-advist-gold-light/50' : 'border-advist-bg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-advist-dark text-white text-xs font-medium rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-advist-gray900">{plan.name}</h3>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-advist-gray900">
                      {formatCurrency(plan.monthlyPrice)}
                    </p>
                    <p className="text-sm text-advist-gray900">/mois</p>
                  </div>
                  <div className="mt-2 p-2 bg-green-50 rounded-xl">
                    <p className="text-sm text-advist-success">
                      {formatCurrency(plan.yearlyPrice)}/an
                    </p>
                    <p className="text-xs text-advist-success">Economisez 20%</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-advist-gray900">Utilisateurs</span>
                    <span className="font-medium text-advist-gray900">
                      {plan.maxUsers === -1 ? 'Illimite' : `${plan.maxUsers} max`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-advist-gray900">Stockage</span>
                    <span className="font-medium text-advist-gray900">{plan.maxStorage} GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-advist-gray900">Documents/mois</span>
                    <span className="font-medium text-advist-gray900">
                      {plan.maxDocuments === -1 ? 'Illimite' : plan.maxDocuments.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-advist-success flex-shrink-0" />
                      <span className="text-advist-gray900">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-advist-gold-dark flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-advist-gray900">Plan sur mesure</h4>
                <p className="text-sm text-advist-gray900 mt-1">
                  Pour les grandes entreprises avec des besoins specifiques, contactez notre equipe commerciale
                  pour un devis personnalise incluant des fonctionnalites sur mesure, un support VIP et des conditions
                  particulieres.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Tenant Modal - Version Complete */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Modifier: ${selectedTenant?.name || ''}`}
        size="xl"
      >
        <div className="flex flex-col h-[75vh]">
          {/* Onglets */}
          <div className="flex border-b border-advist-bg mb-4 overflow-x-auto">
            {[
              { id: 'general' as EditTab, label: 'General', icon: Building2 },
              { id: 'contact' as EditTab, label: 'Contact', icon: Users },
              { id: 'billing' as EditTab, label: 'Facturation', icon: CreditCard },
              { id: 'quotas' as EditTab, label: 'Quotas', icon: Database },
              { id: 'modules' as EditTab, label: 'Modules', icon: Zap },
              { id: 'security' as EditTab, label: 'Securite', icon: Shield },
              { id: 'notes' as EditTab, label: 'Notes', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEditTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  editTab === tab.id
                    ? 'border-advist-gray900 text-advist-gray900'
                    : 'border-transparent text-advist-gray500 hover:text-advist-gray900'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          <div className="flex-1 overflow-y-auto pr-2">
            {/* Onglet General */}
            {editTab === 'general' && (
              <div className="space-y-6">
                {/* Informations de base */}
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Building2 size={18} />
                    Informations de l'organisation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nom de l'organisation *"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    <Input
                      label="Identifiant (slug)"
                      value={editFormData.slug || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                      disabled
                      className="bg-advist-bg"
                    />
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Description</label>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
                        placeholder="Description de l'organisation..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Secteur d'activite</label>
                      <select
                        value={editFormData.sector || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, sector: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="">Selectionner...</option>
                        {SECTORS.map((sector) => (
                          <option key={sector.id} value={sector.id}>{sector.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Taille de l'entreprise</label>
                      <select
                        value={editFormData.companySize || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, companySize: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="">Selectionner...</option>
                        {COMPANY_SIZES.map((size) => (
                          <option key={size.id} value={size.id}>{size.label}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Site web"
                      value={editFormData.website || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                      placeholder="https://..."
                    />
                    <Input
                      label="Email de l'organisation"
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                    <Input
                      label="Telephone"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                </div>

                {/* Localisation */}
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Globe size={18} />
                    Localisation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input
                        label="Adresse"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="Numero, rue..."
                      />
                    </div>
                    <Input
                      label="Ville / Quartier"
                      value={editFormData.city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      placeholder="Abidjan - Plateau"
                    />
                    <Input
                      label="Code postal / BP"
                      value={editFormData.postalCode || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, postalCode: e.target.value })}
                      placeholder="01 BP 1234"
                    />
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Pays</label>
                      <select
                        value={editFormData.country || ''}
                        onChange={(e) => {
                          const country = COUNTRIES.find(c => c.code === e.target.value);
                          setEditFormData({
                            ...editFormData,
                            country: e.target.value,
                            currency: country?.currency || 'XOF',
                            timezone: country?.timezone || 'Africa/Abidjan'
                          });
                        }}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        {COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Fuseau horaire</label>
                      <select
                        value={editFormData.timezone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        {COUNTRIES.map((country) => (
                          <option key={country.timezone} value={country.timezone}>{country.timezone}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Langue</label>
                      <select
                        value={editFormData.language || 'fr'}
                        onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="fr">Francais</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Devise</label>
                      <select
                        value={editFormData.currency || 'XOF'}
                        onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="XOF">FCFA (XOF)</option>
                        <option value="XAF">FCFA (XAF)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="MAD">Dirham (MAD)</option>
                        <option value="TND">Dinar (TND)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Activity size={18} />
                    Statut du compte
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'active', label: 'Actif', color: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle },
                      { id: 'trial', label: 'Essai', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Clock },
                      { id: 'suspended', label: 'Suspendu', color: 'bg-orange-50 border-orange-200 text-orange-700', icon: Pause },
                      { id: 'inactive', label: 'Inactif', color: 'bg-red-50 border-red-200 text-red-700', icon: XCircle },
                    ].map((status) => (
                      <label
                        key={status.id}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          editFormData.status === status.id
                            ? `${status.color  } ring-2 ring-offset-2 ring-advist-gray900`
                            : 'bg-white border-advist-bg hover:border-advist-gray300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status.id}
                          checked={editFormData.status === status.id}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Tenant['status'] })}
                          className="sr-only"
                        />
                        <status.icon size={24} />
                        <span className="text-sm font-medium">{status.label}</span>
                      </label>
                    ))}
                  </div>
                  {editFormData.status === 'trial' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                      <label className="block text-sm font-medium text-blue-900 mb-1.5">Date de fin d'essai</label>
                      <input
                        type="date"
                        value={editFormData.trialEndsAt || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, trialEndsAt: e.target.value })}
                        className="px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="p-4 bg-advist-bg rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-advist-gray500">Date de creation:</span>
                      <span className="ml-2 font-medium text-advist-gray900">
                        {editFormData.createdAt ? new Date(editFormData.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-advist-gray500">Derniere activite:</span>
                      <span className="ml-2 font-medium text-advist-gray900">
                        {editFormData.lastActivity ? new Date(editFormData.lastActivity).toLocaleString('fr-FR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Contact */}
            {editTab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Users size={18} />
                    Administrateur principal
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nom complet"
                      value={editFormData.adminName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, adminName: e.target.value })}
                      placeholder="Prenom Nom"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={editFormData.adminEmail || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, adminEmail: e.target.value })}
                      placeholder="admin@entreprise.com"
                    />
                    <Input
                      label="Telephone direct"
                      value={editFormData.adminPhone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, adminPhone: e.target.value })}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                </div>

                <div className="p-4 bg-advist-gold-light rounded-xl border border-advist-gold">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-advist-gold-dark flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-advist-gray900">Actions administrateur</h4>
                      <p className="text-sm text-advist-gray700 mt-1">
                        L'administrateur principal recoit les notifications importantes et peut gerer tous les utilisateurs de l'organisation.
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Button variant="outline" size="sm">
                          <Mail size={14} className="mr-1" />
                          Envoyer email
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye size={14} className="mr-1" />
                          Impersonifier
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats utilisateurs */}
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4">Statistiques utilisateurs</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-advist-bg rounded-xl text-center">
                      <p className="text-2xl font-bold text-advist-gray900">{editFormData.users || 0}</p>
                      <p className="text-sm text-advist-gray500">Utilisateurs actifs</p>
                    </div>
                    <div className="p-4 bg-advist-bg rounded-xl text-center">
                      <p className="text-2xl font-bold text-advist-gray900">{editFormData.maxUsers || 0}</p>
                      <p className="text-sm text-advist-gray500">Limite max</p>
                    </div>
                    <div className="p-4 bg-advist-bg rounded-xl text-center">
                      <p className="text-2xl font-bold text-advist-success">
                        {editFormData.maxUsers ? Math.round(((editFormData.users || 0) / editFormData.maxUsers) * 100) : 0}%
                      </p>
                      <p className="text-sm text-advist-gray500">Utilisation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Facturation */}
            {editTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} />
                    Plan et abonnement
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Plan d'abonnement</label>
                      <select
                        value={editFormData.plan || ''}
                        onChange={(e) => {
                          const plan = pricingPlans.find(p => p.id === e.target.value);
                          setEditFormData({
                            ...editFormData,
                            plan: e.target.value as Tenant['plan'],
                            monthlyPrice: plan?.monthlyPrice || editFormData.monthlyPrice,
                            maxUsers: plan?.maxUsers || editFormData.maxUsers,
                            maxStorage: plan?.maxStorage || editFormData.maxStorage,
                            maxDocuments: plan?.maxDocuments || editFormData.maxDocuments,
                          });
                        }}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="starter">Starter (49 000 FCFA/mois)</option>
                        <option value="business">Business (149 000 FCFA/mois)</option>
                        <option value="enterprise">Enterprise (399 000 FCFA/mois)</option>
                        <option value="custom">Sur mesure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Cycle de facturation</label>
                      <select
                        value={editFormData.billingCycle || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, billingCycle: e.target.value as Tenant['billingCycle'] })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="yearly">Annuel (-20%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <DollarSign size={18} />
                    Tarification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Prix mensuel de base (FCFA)"
                      type="number"
                      value={editFormData.monthlyPrice || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, monthlyPrice: parseInt(e.target.value) })}
                    />
                    <Input
                      label="Remise commerciale (%)"
                      type="number"
                      min={0}
                      max={100}
                      value={editFormData.discount || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, discount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-green-700">Prix effectif</span>
                        {editFormData.billingCycle === 'yearly' && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            -20% annuel
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(
                            (editFormData.monthlyPrice || 0) *
                            (100 - (editFormData.discount || 0)) / 100 *
                            (editFormData.billingCycle === 'yearly' ? 0.8 : 1)
                          )}
                          <span className="text-sm font-normal">/mois</span>
                        </p>
                        {editFormData.billingCycle === 'yearly' && (
                          <p className="text-sm text-green-600">
                            {formatCurrency(
                              (editFormData.monthlyPrice || 0) *
                              (100 - (editFormData.discount || 0)) / 100 *
                              0.8 * 12
                            )}/an
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Calendar size={18} />
                    Informations de paiement
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Methode de paiement</label>
                      <select
                        value={editFormData.paymentMethod || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      >
                        <option value="">Non defini</option>
                        <option value="Carte bancaire">Carte bancaire</option>
                        <option value="Virement bancaire">Virement bancaire</option>
                        <option value="Mobile Money (Orange)">Mobile Money (Orange)</option>
                        <option value="Mobile Money (MTN)">Mobile Money (MTN)</option>
                        <option value="Mobile Money (Wave)">Mobile Money (Wave)</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Prochain paiement</label>
                      <input
                        type="date"
                        value={editFormData.nextBilling || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nextBilling: e.target.value })}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                      />
                    </div>
                  </div>

                  {editFormData.lastPayment && (
                    <div className="mt-4 p-3 bg-advist-bg rounded-xl">
                      <span className="text-sm text-advist-gray500">Dernier paiement:</span>
                      <span className="ml-2 font-medium text-advist-gray900">
                        {new Date(editFormData.lastPayment).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Quotas */}
            {editTab === 'quotas' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Database size={18} />
                    Limites et quotas
                  </h3>
                  <p className="text-sm text-advist-gray500 mb-4">
                    Definissez les limites d'utilisation pour cette organisation. -1 = illimite.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Utilisateurs maximum"
                        type="number"
                        value={editFormData.maxUsers || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxUsers: parseInt(e.target.value) })}
                      />
                      <div className="mt-2 h-2 bg-advist-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-advist-success rounded-full"
                          style={{ width: `${Math.min(((editFormData.users || 0) / (editFormData.maxUsers || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-advist-gray500 mt-1">
                        {editFormData.users || 0} / {editFormData.maxUsers === -1 ? '∞' : editFormData.maxUsers} utilises
                      </p>
                    </div>
                    <div>
                      <Input
                        label="Stockage maximum (GB)"
                        type="number"
                        value={editFormData.maxStorage || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxStorage: parseInt(e.target.value) })}
                      />
                      <div className="mt-2 h-2 bg-advist-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-advist-info rounded-full"
                          style={{ width: `${Math.min(((editFormData.storage || 0) / (editFormData.maxStorage || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-advist-gray500 mt-1">
                        {editFormData.storage || 0} / {editFormData.maxStorage === -1 ? '∞' : editFormData.maxStorage} GB utilises
                      </p>
                    </div>
                    <div>
                      <Input
                        label="Documents par mois"
                        type="number"
                        value={editFormData.maxDocuments || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxDocuments: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-advist-gray500 mt-1">
                        {editFormData.documents || 0} documents ce mois
                      </p>
                    </div>
                    <div>
                      <Input
                        label="Workflows maximum"
                        type="number"
                        value={editFormData.maxWorkflows || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxWorkflows: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Input
                        label="Signatures par mois"
                        type="number"
                        value={editFormData.maxSignatures || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxSignatures: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Presets rapides */}
                <div>
                  <h4 className="text-sm font-medium text-advist-gray900 mb-3">Appliquer un preset</h4>
                  <div className="flex gap-3">
                    {pricingPlans.map((plan) => (
                      <Button
                        key={plan.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setEditFormData({
                          ...editFormData,
                          maxUsers: plan.maxUsers,
                          maxStorage: plan.maxStorage,
                          maxDocuments: plan.maxDocuments,
                        })}
                      >
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Modules */}
            {editTab === 'modules' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Zap size={18} />
                    Modules et fonctionnalites
                  </h3>
                  <p className="text-sm text-advist-gray500 mb-4">
                    Activez ou desactivez les modules disponibles pour cette organisation.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_MODULES.map((module) => {
                      const isEnabled = (editFormData.enabledModules || []).includes(module.id);
                      return (
                        <label
                          key={module.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isEnabled
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-advist-bg hover:border-advist-gray300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleModule(module.id)}
                            className="mt-1 rounded text-advist-success focus:ring-advist-success"
                          />
                          <div>
                            <p className={`font-medium ${isEnabled ? 'text-green-900' : 'text-advist-gray900'}`}>
                              {module.label}
                            </p>
                            <p className={`text-sm ${isEnabled ? 'text-green-700' : 'text-advist-gray500'}`}>
                              {module.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-advist-bg rounded-xl">
                  <p className="text-sm text-advist-gray700">
                    <strong>{(editFormData.enabledModules || []).length}</strong> modules actives sur{' '}
                    <strong>{AVAILABLE_MODULES.length}</strong> disponibles
                  </p>
                </div>
              </div>
            )}

            {/* Onglet Securite */}
            {editTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <Shield size={18} />
                    Parametres de securite
                  </h3>

                  <div className="space-y-4">
                    {/* OHADA */}
                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-advist-bg">
                      <div>
                        <p className="font-medium text-advist-gray900">Conformite OHADA</p>
                        <p className="text-sm text-advist-gray500">Signatures electroniques legalement reconnues</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editFormData.ohada || false}
                        onChange={(e) => setEditFormData({ ...editFormData, ohada: e.target.checked })}
                        className="w-5 h-5 rounded text-advist-success focus:ring-advist-success"
                      />
                    </label>

                    {/* 2FA */}
                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-advist-bg">
                      <div>
                        <p className="font-medium text-advist-gray900">Authentification 2FA obligatoire</p>
                        <p className="text-sm text-advist-gray500">Tous les utilisateurs doivent activer la 2FA</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editFormData.twoFactorRequired || false}
                        onChange={(e) => setEditFormData({ ...editFormData, twoFactorRequired: e.target.checked })}
                        className="w-5 h-5 rounded text-advist-success focus:ring-advist-success"
                      />
                    </label>

                    {/* SSO */}
                    <div className="p-4 bg-white rounded-xl border border-advist-bg">
                      <label className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-advist-gray900">SSO / SAML</p>
                          <p className="text-sm text-advist-gray500">Authentification unique via fournisseur externe</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editFormData.ssoEnabled || false}
                          onChange={(e) => setEditFormData({ ...editFormData, ssoEnabled: e.target.checked })}
                          className="w-5 h-5 rounded text-advist-success focus:ring-advist-success"
                        />
                      </label>
                      {editFormData.ssoEnabled && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-advist-gray900 mb-1.5">Fournisseur SSO</label>
                          <select
                            value={editFormData.ssoProvider || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, ssoProvider: e.target.value })}
                            className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold"
                          >
                            <option value="">Selectionner...</option>
                            <option value="Azure AD">Azure AD (Microsoft)</option>
                            <option value="Okta">Okta</option>
                            <option value="Google Workspace">Google Workspace</option>
                            <option value="Microsoft ADFS">Microsoft ADFS</option>
                            <option value="OneLogin">OneLogin</option>
                            <option value="Auth0">Auth0</option>
                            <option value="Custom SAML">SAML Personnalise</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* IP Whitelist */}
                    <div className="p-4 bg-white rounded-xl border border-advist-bg">
                      <p className="font-medium text-advist-gray900 mb-2">Liste blanche IP</p>
                      <p className="text-sm text-advist-gray500 mb-3">
                        Limitez l'acces a certaines adresses IP (une par ligne)
                      </p>
                      <textarea
                        value={(editFormData.ipWhitelist || []).join('\n')}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim())
                        })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold font-mono text-sm"
                        placeholder="192.168.1.xxx&#10;10.0.0.xxx"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Notes */}
            {editTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-advist-gray900 mb-4 flex items-center gap-2">
                    <FileText size={18} />
                    Notes internes
                  </h3>
                  <p className="text-sm text-advist-gray500 mb-4">
                    Ces notes sont visibles uniquement par les Super Admins.
                  </p>

                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold resize-none"
                    placeholder="Notes sur ce client, historique des interactions, points d'attention..."
                  />
                </div>

                {/* Actions dangereuses */}
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Zone de danger
                  </h4>
                  <p className="text-sm text-red-700 mb-4">
                    Ces actions sont irreversibles. Procedez avec prudence.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                      Reinitialiser les donnees
                    </Button>
                    <Button variant="danger" size="sm">
                      <Trash2 size={14} className="mr-1" />
                      Supprimer l'organisation
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer avec actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-advist-bg">
            <div className="text-sm text-advist-gray500">
              Derniere modification: {editFormData.lastActivity ? new Date(editFormData.lastActivity).toLocaleString('fr-FR') : '-'}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save size={16} className="mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Tenant Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('superadmin.tenants.createTitle', 'Nouvelle organisation')}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('superadmin.tenants.name', 'Nom de l\'organisation')}
              placeholder="Ex: Ma Societe"
              required
            />
            <Input
              label={t('superadmin.tenants.slug', 'Identifiant unique')}
              placeholder="ex: ma-societe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('superadmin.tenants.adminEmail', 'Email administrateur')}
              type="email"
              placeholder="admin@example.com"
              required
            />
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                {t('superadmin.tenants.plan', 'Plan d\'abonnement')}
              </label>
              <select className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold">
                <option value="starter">Starter (49 000 FCFA/mois)</option>
                <option value="business">Business (149 000 FCFA/mois)</option>
                <option value="enterprise">Enterprise (399 000 FCFA/mois)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                {t('superadmin.tenants.country', 'Pays')}
              </label>
              <select className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold">
                <optgroup label="Afrique de l'Ouest (UEMOA)">
                  <option value="CI">Cote d'Ivoire</option>
                  <option value="SN">Senegal</option>
                  <option value="ML">Mali</option>
                  <option value="BF">Burkina Faso</option>
                  <option value="NE">Niger</option>
                  <option value="TG">Togo</option>
                  <option value="BJ">Benin</option>
                  <option value="GW">Guinee-Bissau</option>
                </optgroup>
                <optgroup label="Afrique Centrale (CEMAC)">
                  <option value="CM">Cameroun</option>
                  <option value="GA">Gabon</option>
                  <option value="CG">Congo</option>
                  <option value="TD">Tchad</option>
                  <option value="CF">Centrafrique</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-advist-gray900 mb-1.5">
                {t('superadmin.tenants.billing', 'Cycle de facturation')}
              </label>
              <select className="w-full px-4 py-2.5 border border-advist-bg rounded-xl focus:ring-2 focus:ring-advist-gold">
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel (-20%)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="ohada" className="rounded" defaultChecked />
            <label htmlFor="ohada" className="text-sm text-advist-gray900">
              {t('superadmin.tenants.ohadaCompliant', 'Conformite OHADA (signatures electroniques legales)')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-advist-bg">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button>
              <Plus size={16} className="mr-2" />
              {t('superadmin.tenants.create', 'Creer l\'organisation')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tenant Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedTenant?.name || ''}
        size="lg"
      >
        {selectedTenant && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start gap-4 p-4 bg-advist-bg rounded-xl">
              <div className="w-16 h-16 bg-advist-dark rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {selectedTenant.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-advist-gray900">{selectedTenant.name}</h3>
                <p className="text-sm text-advist-blue-light">{selectedTenant.slug}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-xl ${getPlanBadge(selectedTenant.plan).bg} ${getPlanBadge(selectedTenant.plan).text}`}>
                    {getPlanBadge(selectedTenant.plan).label}
                  </span>
                  {selectedTenant.ohada && (
                    <span className="px-2 py-1 bg-green-50 text-advist-success text-xs font-medium rounded-xl">
                      OHADA
                    </span>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-xl ${getStatusInfo(selectedTenant.status).bg}`}>
                <span className={`text-sm font-medium ${getStatusInfo(selectedTenant.status).color}`}>
                  {getStatusInfo(selectedTenant.status).label}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-advist-bg rounded-xl">
                <p className="text-2xl font-bold text-advist-gray900">{selectedTenant.users}</p>
                <p className="text-sm text-advist-blue-light">Utilisateurs</p>
                <p className="text-xs text-advist-blue-light">/ {selectedTenant.maxUsers} max</p>
              </div>
              <div className="text-center p-4 bg-advist-bg rounded-xl">
                <p className="text-2xl font-bold text-advist-gray900">{selectedTenant.documents.toLocaleString()}</p>
                <p className="text-sm text-advist-blue-light">Documents</p>
              </div>
              <div className="text-center p-4 bg-advist-bg rounded-xl">
                <p className="text-2xl font-bold text-advist-gray900">{selectedTenant.storage} GB</p>
                <p className="text-sm text-advist-blue-light">Stockage</p>
                <p className="text-xs text-advist-blue-light">/ {selectedTenant.maxStorage} GB</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-xl font-bold text-advist-success">
                  {formatCurrency(selectedTenant.monthlyPrice * (100 - selectedTenant.discount) / 100)}
                </p>
                <p className="text-sm text-advist-blue-light">Prix/mois</p>
                {selectedTenant.discount > 0 && (
                  <p className="text-xs text-advist-success">-{selectedTenant.discount}% remise</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-advist-bg">
                <span className="text-sm text-advist-blue-light">Email contact</span>
                <span className="text-sm text-advist-gray900">{selectedTenant.email}</span>
              </div>
              {selectedTenant.phone && (
                <div className="flex items-center justify-between py-2 border-b border-advist-bg">
                  <span className="text-sm text-advist-blue-light">Telephone</span>
                  <span className="text-sm text-advist-gray900">{selectedTenant.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-advist-bg">
                <span className="text-sm text-advist-blue-light">Pays</span>
                <span className="text-sm text-advist-gray900">{selectedTenant.country}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-advist-bg">
                <span className="text-sm text-advist-blue-light">Cree le</span>
                <span className="text-sm text-advist-gray900">
                  {new Date(selectedTenant.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-advist-bg">
                <span className="text-sm text-advist-blue-light">Facturation</span>
                <span className="text-sm text-advist-gray900 capitalize">
                  {selectedTenant.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-advist-blue-light">Prochain paiement</span>
                <span className="text-sm text-advist-gray900">
                  {new Date(selectedTenant.nextBilling).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Features */}
            {selectedTenant.features && selectedTenant.features.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-advist-gray900 mb-2">Fonctionnalites actives</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTenant.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-advist-gold-light text-advist-gray900 text-xs rounded-xl">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-advist-bg">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowDetailModal(false);
                handleEditTenant(selectedTenant);
              }}>
                <Edit size={16} className="mr-2" />
                Modifier
              </Button>
              <Button variant="outline" className="flex-1">
                <Eye size={16} className="mr-2" />
                Impersonifier
              </Button>
              <Button variant="outline" className="flex-1">
                <Download size={16} className="mr-2" />
                Export
              </Button>
              {selectedTenant.status === 'active' ? (
                <Button variant="danger" className="flex-1">
                  <Pause size={16} className="mr-2" />
                  Suspendre
                </Button>
              ) : (
                <Button className="flex-1">
                  <CheckCircle size={16} className="mr-2" />
                  Activer
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TenantsPage;
