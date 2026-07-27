/**
 * ISO 27001:2022 Mock Data - SMSI (ISMS)
 *
 * Données mock pour le développement sans backend
 */
import type {
  ControlCategory,
  Control,
  StatementOfApplicability,
  ControlImplementation,
  RiskRegister,
  Risk,
  AuditProgram,
  InternalAudit,
  AuditFinding,
  CorrectiveAction,
  ISO27001Dashboard,
  SecurityPolicy,
  ISMSObjective,
  InformationAsset,
} from '@/types/iso27001';

// =============================================================================
// CONTROL CATEGORIES
// =============================================================================

export const mockControlCategories: ControlCategory[] = [
  {
    id: 'a5000000-0000-0000-0000-000000000001',
    code: 'A.5',
    name: 'Contrôles organisationnels',
    name_en: 'Organizational controls',
    description: 'Contrôles liés à la gouvernance, aux politiques, aux rôles et responsabilités.',
    control_count: 37,
    order: 1,
  },
  {
    id: 'a6000000-0000-0000-0000-000000000002',
    code: 'A.6',
    name: 'Contrôles liés aux personnes',
    name_en: 'People controls',
    description: "Contrôles relatifs au personnel avant, pendant et après l'emploi.",
    control_count: 8,
    order: 2,
  },
  {
    id: 'a7000000-0000-0000-0000-000000000003',
    code: 'A.7',
    name: 'Contrôles physiques',
    name_en: 'Physical controls',
    description: 'Contrôles de sécurité physique et environnementale.',
    control_count: 14,
    order: 3,
  },
  {
    id: 'a8000000-0000-0000-0000-000000000004',
    code: 'A.8',
    name: 'Contrôles technologiques',
    name_en: 'Technological controls',
    description: "Contrôles techniques et technologiques de sécurité de l'information.",
    control_count: 34,
    order: 4,
  },
];

// =============================================================================
// SAMPLE CONTROLS (premiers de chaque catégorie)
// =============================================================================

export const mockControls: Control[] = [
  {
    id: 'c5010000-0000-0000-0000-000000000001',
    category: 'a5000000-0000-0000-0000-000000000001',
    code: 'A.5.1',
    name: "Politiques de sécurité de l'information",
    name_en: 'Policies for information security',
    description:
      "La politique de sécurité de l'information et les politiques par thème doivent être définies, approuvées par la direction, publiées, communiquées et reconnues par le personnel concerné et les parties intéressées pertinentes.",
    description_en:
      'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties.',
    control_types: ['preventive'],
    security_properties: ['confidentiality', 'integrity', 'availability'],
    cybersecurity_concepts: ['identify', 'protect'],
    operational_capabilities: ['governance'],
    security_domains: ['governance_ecosystem'],
    implementation_guidance: '',
    iso27002_section: '5.1',
    nist_mapping: ['ID.GV-1'],
    is_active: true,
    order: 1,
  },
  {
    id: 'c5020000-0000-0000-0000-000000000002',
    category: 'a5000000-0000-0000-0000-000000000001',
    code: 'A.5.2',
    name: "Rôles et responsabilités en matière de sécurité de l'information",
    name_en: 'Information security roles and responsibilities',
    description:
      "Les rôles et responsabilités en matière de sécurité de l'information doivent être définis et attribués conformément aux besoins de l'organisation.",
    description_en:
      'Information security roles and responsibilities shall be defined and allocated according to the organization needs.',
    control_types: ['preventive'],
    security_properties: ['confidentiality', 'integrity', 'availability'],
    cybersecurity_concepts: ['identify'],
    operational_capabilities: ['governance'],
    security_domains: ['governance_ecosystem'],
    implementation_guidance: '',
    iso27002_section: '5.2',
    nist_mapping: ['ID.AM-6', 'ID.GV-2'],
    is_active: true,
    order: 2,
  },
  {
    id: 'c6010000-0000-0000-0000-000000000038',
    category: 'a6000000-0000-0000-0000-000000000002',
    code: 'A.6.1',
    name: 'Sélection des candidats',
    name_en: 'Screening',
    description:
      "Des vérifications des antécédents de tous les candidats à l'emploi doivent être effectuées avant leur intégration.",
    description_en:
      'Background verification checks on all candidates for employment shall be carried out prior to joining the organization.',
    control_types: ['preventive'],
    security_properties: ['confidentiality', 'integrity'],
    cybersecurity_concepts: ['protect'],
    operational_capabilities: ['human_resource_security'],
    security_domains: ['governance_ecosystem'],
    implementation_guidance: '',
    iso27002_section: '6.1',
    nist_mapping: ['PR.IP-11'],
    is_active: true,
    order: 38,
  },
  {
    id: 'c7010000-0000-0000-0000-000000000046',
    category: 'a7000000-0000-0000-0000-000000000003',
    code: 'A.7.1',
    name: 'Périmètres de sécurité physique',
    name_en: 'Physical security perimeters',
    description:
      "Des périmètres de sécurité doivent être définis et utilisés pour protéger les zones contenant des informations et d'autres actifs associés.",
    description_en:
      'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
    control_types: ['preventive'],
    security_properties: ['confidentiality', 'integrity', 'availability'],
    cybersecurity_concepts: ['protect'],
    operational_capabilities: ['physical_security'],
    security_domains: ['protection'],
    implementation_guidance: '',
    iso27002_section: '7.1',
    nist_mapping: ['PE-3'],
    is_active: true,
    order: 46,
  },
  {
    id: 'c8010000-0000-0000-0000-000000000060',
    category: 'a8000000-0000-0000-0000-000000000004',
    code: 'A.8.1',
    name: 'Terminaux utilisateurs',
    name_en: 'User endpoint devices',
    description:
      'Les informations stockées sur, traitées par ou accessibles via les terminaux utilisateurs doivent être protégées.',
    description_en:
      'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
    control_types: ['preventive'],
    security_properties: ['confidentiality', 'integrity', 'availability'],
    cybersecurity_concepts: ['protect'],
    operational_capabilities: ['asset_management', 'information_protection'],
    security_domains: ['protection'],
    implementation_guidance: '',
    iso27002_section: '8.1',
    nist_mapping: ['SC-7'],
    is_active: true,
    order: 60,
  },
];

// =============================================================================
// STATEMENT OF APPLICABILITY
// =============================================================================

export const mockSoA: StatementOfApplicability = {
  id: 'soa-001',
  organization: 'org-001',
  version: '1.0',
  title: "Déclaration d'Applicabilité SMSI",
  description: 'DdA pour le périmètre du système de gestion documentaire Advist',
  status: 'approved',
  prepared_by: 'user-001',
  prepared_by_detail: {
    id: 'user-001',
    email: 'rssi@entreprise.com',
    first_name: 'Jean',
    last_name: 'Dupont',
    full_name: 'Jean Dupont',
  },
  approved_by: 'user-002',
  approved_at: '2024-12-01T10:00:00Z',
  total_controls: 93,
  applicable_controls: 87,
  implemented_controls: 72,
  created_at: '2024-11-01T09:00:00Z',
  updated_at: '2024-12-01T10:00:00Z',
};

export const mockControlImplementations: ControlImplementation[] = [
  {
    id: 'impl-001',
    soa: 'soa-001',
    control: 'c5010000-0000-0000-0000-000000000001',
    is_applicable: true,
    applicability_justification: 'Requis pour la gouvernance SMSI',
    implementation_status: 'implemented',
    implementation_percentage: 100,
    implementation_description: "Politique de sécurité de l'information documentée et approuvée",
    implementation_method: 'Document POL-SEC-001 approuvé par la direction',
    control_owner: 'user-001',
    evidence_description: 'POL-SEC-001 v2.0, PV de revue direction',
    effectiveness: 'effective',
    effectiveness_notes: 'Revue annuelle effectuée',
    last_effectiveness_review: '2024-11-15',
    actual_implementation_date: '2024-01-15',
    notes: '',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-11-15T14:30:00Z',
  },
  {
    id: 'impl-002',
    soa: 'soa-001',
    control: 'c5020000-0000-0000-0000-000000000002',
    is_applicable: true,
    applicability_justification: 'Requis pour définir les responsabilités',
    implementation_status: 'implemented',
    implementation_percentage: 100,
    implementation_description: 'Fiches de poste avec responsabilités sécurité définies',
    implementation_method: 'Organigramme sécurité et RACI',
    control_owner: 'user-003',
    evidence_description: 'ORG-SEC-001, Fiches de poste',
    effectiveness: 'effective',
    effectiveness_notes: '',
    last_effectiveness_review: '2024-10-20',
    actual_implementation_date: '2024-02-01',
    notes: '',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-10-20T11:00:00Z',
  },
  {
    id: 'impl-003',
    soa: 'soa-001',
    control: 'c8010000-0000-0000-0000-000000000060',
    is_applicable: true,
    applicability_justification: 'Protection des postes de travail',
    implementation_status: 'partial',
    implementation_percentage: 75,
    implementation_description: 'MDM déployé sur 75% du parc',
    implementation_method: 'Microsoft Intune',
    control_owner: 'user-004',
    evidence_description: 'Rapport de déploiement Intune',
    effectiveness: 'partial',
    effectiveness_notes: 'Déploiement en cours',
    target_implementation_date: '2025-03-31',
    notes: 'Reste 25% des postes à migrer',
    created_at: '2024-06-01T09:00:00Z',
    updated_at: '2024-12-15T16:00:00Z',
  },
];

// =============================================================================
// RISK REGISTER
// =============================================================================

export const mockRiskRegister: RiskRegister = {
  id: 'reg-001',
  organization: 'org-001',
  name: 'Registre des risques 2024',
  description: "Registre principal des risques de sécurité de l'information",
  period_start: '2024-01-01',
  period_end: '2024-12-31',
  status: 'approved',
  approved_by: 'user-002',
  approved_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T09:00:00Z',
  updated_at: '2024-12-01T14:00:00Z',
  risks_count: 24,
  high_risks_count: 5,
};

export const mockRisks: Risk[] = [
  {
    id: 'risk-001',
    register: 'reg-001',
    reference: 'R-2024-001',
    title: 'Accès non autorisé aux données clients',
    description:
      "Risque d'accès non autorisé aux données personnelles des clients via exploitation de vulnérabilités applicatives",
    risk_type: 'confidentiality',
    risk_owner: 'user-001',
    risk_owner_detail: {
      id: 'user-001',
      email: 'rssi@entreprise.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      full_name: 'Jean Dupont',
    },
    inherent_impact: 4,
    inherent_likelihood: 3,
    inherent_risk_score: 12,
    inherent_risk_level: 'high',
    current_impact: 4,
    current_likelihood: 2,
    current_risk_score: 8,
    current_risk_level: 'medium',
    existing_controls_description: 'WAF, tests de pénétration annuels, authentification MFA',
    treatment_option: 'reduce',
    treatment_justification: "Réduction par renforcement des contrôles d'accès",
    residual_impact: 3,
    residual_likelihood: 1,
    residual_risk_score: 3,
    residual_risk_level: 'low',
    is_accepted: false,
    acceptance_justification: '',
    status: 'treatment_in_progress',
    last_review_date: '2024-12-01',
    next_review_date: '2025-03-01',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'risk-002',
    register: 'reg-001',
    reference: 'R-2024-002',
    title: 'Indisponibilité de la plateforme',
    description:
      "Risque d'indisponibilité prolongée de la plateforme suite à une panne infrastructure",
    risk_type: 'availability',
    risk_owner: 'user-004',
    inherent_impact: 5,
    inherent_likelihood: 2,
    inherent_risk_score: 10,
    inherent_risk_level: 'high',
    current_impact: 4,
    current_likelihood: 1,
    current_risk_score: 4,
    current_risk_level: 'low',
    existing_controls_description:
      'Infrastructure redondante AWS, sauvegardes quotidiennes, PRA testé',
    treatment_option: 'accept',
    treatment_justification: 'Risque résiduel acceptable avec les contrôles en place',
    residual_impact: 4,
    residual_likelihood: 1,
    residual_risk_score: 4,
    residual_risk_level: 'low',
    is_accepted: true,
    accepted_by: 'user-002',
    accepted_at: '2024-06-15T14:00:00Z',
    acceptance_justification: "Risque résiduel accepté - niveau conforme à l'appétence au risque",
    status: 'monitoring',
    last_review_date: '2024-12-01',
    next_review_date: '2025-06-01',
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// =============================================================================
// AUDITS
// =============================================================================

export const mockAuditProgram: AuditProgram = {
  id: 'prog-2024',
  organization: 'org-001',
  name: "Programme d'audit SMSI 2024",
  description: "Programme annuel d'audits internes ISO 27001",
  year: 2024,
  objectives: "Vérifier la conformité aux exigences ISO 27001:2022 et l'efficacité du SMSI",
  scope: 'Ensemble du périmètre SMSI',
  lead_auditor: 'user-005',
  status: 'in_progress',
  approved_by: 'user-002',
  approved_at: '2024-01-10T09:00:00Z',
  created_at: '2024-01-05T09:00:00Z',
  updated_at: '2024-12-01T10:00:00Z',
  audits_count: 4,
  completed_audits_count: 3,
};

export const mockAudits: InternalAudit[] = [
  {
    id: 'audit-001',
    program: 'prog-2024',
    reference: 'AUD-2024-001',
    title: "Audit des contrôles d'accès",
    audit_type: 'partial',
    scope: 'Contrôles A.5.15 à A.5.18 et A.8.2 à A.8.5',
    clauses_audited: ['5.15', '5.16', '5.17', '5.18', '8.2', '8.3', '8.4', '8.5'],
    processes_audited: ['Gestion des identités', "Contrôle d'accès", 'Authentification'],
    audit_criteria: "ISO 27001:2022, Politique de contrôle d'accès",
    lead_auditor: 'user-005',
    external_auditors: [],
    planned_start_date: '2024-03-01',
    planned_end_date: '2024-03-15',
    actual_start_date: '2024-03-04',
    actual_end_date: '2024-03-18',
    status: 'completed',
    conclusion: 'minor_nc',
    executive_summary:
      "Audit satisfaisant avec 2 non-conformités mineures identifiées relatives à la revue des droits d'accès.",
    report_date: '2024-03-25',
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2024-03-25T16:00:00Z',
    findings_count: 4,
    open_findings_count: 1,
  },
];

export const mockFindings: AuditFinding[] = [
  {
    id: 'find-001',
    audit: 'audit-001',
    reference: 'AUD-2024-001-NC01',
    title: "Revue des droits d'accès non effectuée trimestriellement",
    description:
      "La revue des droits d'accès privilégiés n'a pas été effectuée au T4 2023 comme requis par la procédure PRO-ACC-002.",
    finding_type: 'nc_minor',
    clause_reference: 'A.5.18',
    control_reference: 'c5180000-0000-0000-0000-000000000018',
    evidence: "Logs IAM, registre des revues d'accès",
    risk_impact: 'medium',
    auditee: 'user-004',
    auditee_response: 'La revue sera effectuée et le processus sera renforcé',
    auditee_response_date: '2024-03-20',
    status: 'closed',
    resolution_date: '2024-04-15',
    resolution_notes: 'Revue effectuée, rappel automatique mis en place',
    verified_by: 'user-005',
    verified_at: '2024-04-20T10:00:00Z',
    created_at: '2024-03-18T14:00:00Z',
    updated_at: '2024-04-20T10:00:00Z',
  },
];

// =============================================================================
// CORRECTIVE ACTIONS
// =============================================================================

export const mockCorrectiveActions: CorrectiveAction[] = [
  {
    id: 'ca-001',
    organization: 'org-001',
    finding: 'find-001',
    source_type: 'audit_finding',
    source_reference: 'AUD-2024-001-NC01',
    reference: 'AC-2024-001',
    title: "Automatisation des revues d'accès",
    problem_description: "Revue des droits d'accès non effectuée trimestriellement",
    root_cause_analysis: 'Méthode 5 Pourquoi appliquée',
    root_cause: 'Absence de rappel automatique et processus manuel',
    action_description: "Mise en place d'alertes automatiques et tableau de bord de suivi",
    expected_outcome: 'Revues effectuées systématiquement chaque trimestre',
    responsible: 'user-004',
    due_date: '2024-04-30',
    completion_date: '2024-04-15',
    status: 'verified',
    progress_percentage: 100,
    effectiveness_review: 'Revue Q2 2024 effectuée dans les délais',
    is_effective: true,
    effectiveness_reviewed_by: 'user-005',
    effectiveness_reviewed_at: '2024-07-15T10:00:00Z',
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2024-07-15T10:00:00Z',
    is_overdue: false,
  },
];

// =============================================================================
// SECURITY POLICIES
// =============================================================================

export const mockPolicies: SecurityPolicy[] = [
  {
    id: 'pol-001',
    organization: 'org-001',
    code: 'POL-SEC-001',
    title: "Politique de Sécurité de l'Information",
    description: "Politique générale de sécurité de l'information de l'organisation",
    policy_type: 'policy',
    version: '2.0',
    effective_date: '2024-01-01',
    review_date: '2025-01-01',
    content_summary:
      "Définit les principes, objectifs et responsabilités en matière de sécurité de l'information.",
    owner: 'user-001',
    status: 'published',
    approved_at: '2023-12-15T10:00:00Z',
    published_at: '2024-01-01T00:00:00Z',
    requires_acknowledgment: true,
    created_at: '2023-11-01T09:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    linked_controls: ['c5010000-0000-0000-0000-000000000001'],
    acknowledgments_count: 45,
    pending_acknowledgments_count: 3,
    applicable_to: { all_personnel: true },
  },
  {
    id: 'pol-002',
    organization: 'org-001',
    code: 'POL-ACC-001',
    title: "Politique de Contrôle d'Accès",
    description: "Politique définissant les règles de contrôle d'accès aux systèmes et données",
    policy_type: 'policy',
    version: '1.5',
    effective_date: '2024-03-01',
    review_date: '2025-03-01',
    content_summary: "Règles d'attribution, de revue et de révocation des droits d'accès.",
    owner: 'user-004',
    status: 'published',
    approved_at: '2024-02-20T14:00:00Z',
    published_at: '2024-03-01T00:00:00Z',
    requires_acknowledgment: true,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    linked_controls: [
      'c5150000-0000-0000-0000-000000000015',
      'c5160000-0000-0000-0000-000000000016',
    ],
    acknowledgments_count: 48,
    pending_acknowledgments_count: 0,
    applicable_to: { all_personnel: true },
  },
];

// =============================================================================
// OBJECTIVES
// =============================================================================

export const mockObjectives: ISMSObjective[] = [
  {
    id: 'obj-001',
    organization: 'org-001',
    code: 'OBJ-2024-001',
    title: 'Réduction des incidents de sécurité',
    description: "Réduire de 20% le nombre d'incidents de sécurité par rapport à 2023",
    related_policy: 'pol-001',
    target_value: 'Réduction de 20%',
    measurement_method: "Nombre d'incidents enregistrés dans le système de ticketing",
    measurement_frequency: 'quarterly',
    responsible: 'user-001',
    start_date: '2024-01-01',
    target_date: '2024-12-31',
    resources_needed: 'Outils de détection, formation des équipes',
    status: 'active',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'obj-002',
    organization: 'org-001',
    code: 'OBJ-2024-002',
    title: 'Formation et sensibilisation',
    description: "100% du personnel formé à la sécurité de l'information",
    target_value: '100%',
    measurement_method: 'Taux de complétion des formations obligatoires',
    measurement_frequency: 'quarterly',
    responsible: 'user-003',
    start_date: '2024-01-01',
    target_date: '2024-12-31',
    resources_needed: 'Plateforme e-learning, budget formation',
    status: 'active',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// =============================================================================
// ASSETS
// =============================================================================

export const mockAssets: InformationAsset[] = [
  {
    id: 'asset-001',
    organization: 'org-001',
    asset_id: 'AST-APP-001',
    name: 'Application Advist',
    description: 'Plateforme de gestion documentaire et signature électronique',
    category: 'cat-software',
    confidentiality_level: 'confidential',
    integrity_level: 4,
    availability_level: 5,
    business_value: 'critical',
    value_justification: 'Application cœur de métier',
    asset_owner: 'user-001',
    location: 'AWS eu-west-3',
    location_details: { region: 'Paris', provider: 'AWS' },
    lifecycle_status: 'active',
    acquisition_date: '2023-01-01',
    review_date: '2025-01-01',
    metadata: {},
    tags: ['saas', 'cloud', 'production'],
    is_active: true,
    created_at: '2023-01-01T09:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'asset-002',
    organization: 'org-001',
    asset_id: 'AST-DATA-001',
    name: 'Base de données clients',
    description: 'Base de données contenant les informations clients et documents',
    category: 'cat-information',
    confidentiality_level: 'restricted',
    integrity_level: 5,
    availability_level: 4,
    business_value: 'critical',
    value_justification: 'Données clients sensibles - RGPD',
    asset_owner: 'user-001',
    location: 'AWS RDS eu-west-3',
    location_details: { region: 'Paris', service: 'RDS', encrypted: true },
    lifecycle_status: 'active',
    acquisition_date: '2023-01-01',
    review_date: '2025-01-01',
    metadata: { encryption: 'AES-256', backup_retention: '30 days' },
    tags: ['database', 'pii', 'rgpd', 'encrypted'],
    is_active: true,
    created_at: '2023-01-01T09:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
];

// =============================================================================
// DASHBOARD
// =============================================================================

export const mockDashboard: ISO27001Dashboard = {
  soa_stats: {
    total_controls: 93,
    applicable_controls: 87,
    implemented_controls: 72,
    implementation_percentage: 83,
    by_category: [
      {
        category_code: 'A.5',
        category_name: 'Organisationnels',
        total: 37,
        applicable: 35,
        implemented: 30,
        percentage: 86,
      },
      {
        category_code: 'A.6',
        category_name: 'Personnes',
        total: 8,
        applicable: 8,
        implemented: 7,
        percentage: 88,
      },
      {
        category_code: 'A.7',
        category_name: 'Physiques',
        total: 14,
        applicable: 12,
        implemented: 10,
        percentage: 83,
      },
      {
        category_code: 'A.8',
        category_name: 'Technologiques',
        total: 34,
        applicable: 32,
        implemented: 25,
        percentage: 78,
      },
    ],
  },
  risk_stats: {
    total_risks: 24,
    by_level: { low: 8, medium: 11, high: 4, critical: 1 },
    treated_risks: 18,
    accepted_risks: 4,
    overdue_reviews: 2,
  },
  audit_stats: {
    planned_audits: 4,
    completed_audits: 3,
    open_findings: 3,
    overdue_findings: 0,
    nc_major_count: 0,
    nc_minor_count: 2,
  },
  corrective_action_stats: {
    total: 8,
    open: 2,
    overdue: 0,
    effectiveness_rate: 85,
  },
  objective_stats: {
    total: 5,
    achieved: 2,
    on_track: 2,
    at_risk: 1,
  },
  recent_activities: [
    {
      id: 'act-001',
      type: 'risk',
      action: 'updated',
      description: 'Risque R-2024-001 mis à jour',
      timestamp: '2024-12-30T14:30:00Z',
    },
    {
      id: 'act-002',
      type: 'action',
      action: 'completed',
      description: 'Action corrective AC-2024-003 clôturée',
      timestamp: '2024-12-29T16:00:00Z',
    },
  ],
  upcoming_reviews: [
    {
      id: 'rev-001',
      type: 'risk_review',
      title: 'Revue risque R-2024-005',
      due_date: '2025-01-15',
    },
  ],
  upcoming_audits: [
    {
      id: 'aud-002',
      type: 'internal_audit',
      title: "Audit continuité d'activité",
      due_date: '2025-02-01',
    },
  ],
};

// =============================================================================
// EXPORT ALL MOCKS
// =============================================================================

export default {
  controlCategories: mockControlCategories,
  controls: mockControls,
  soa: mockSoA,
  controlImplementations: mockControlImplementations,
  riskRegister: mockRiskRegister,
  risks: mockRisks,
  auditProgram: mockAuditProgram,
  audits: mockAudits,
  findings: mockFindings,
  correctiveActions: mockCorrectiveActions,
  policies: mockPolicies,
  objectives: mockObjectives,
  assets: mockAssets,
  dashboard: mockDashboard,
};
