# Architecture et Conception - ADVIST

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Architecture Backend](#architecture-backend)
4. [Architecture Frontend](#architecture-frontend)
5. [Architecture Mobile](#architecture-mobile)
6. [Base de données](#base-de-données)
7. [Sécurité](#sécurité)
8. [Performance et Scalabilité](#performance-et-scalabilité)
9. [Intégrations](#intégrations)
10. [Infrastructure et Déploiement](#infrastructure-et-déploiement)

---

## Vue d'ensemble

### Présentation du projet

ADVIST est une **plateforme SaaS de gestion documentaire d'entreprise** offrant :

- Gestion complète du cycle de vie des documents
- Workflows de validation configurables
- Signature électronique (simple, avancée, qualifiée)
- Conformité ISO 27001, RGPD et eIDAS
- Architecture multi-tenant
- Applications web et mobile natives

### Principes architecturaux

| Principe | Description |
|----------|-------------|
| **Séparation des responsabilités** | Backend API-only, Frontend SPA indépendant |
| **Multi-tenancy** | Isolation complète des données par organisation |
| **Scalabilité horizontale** | Services stateless, cache distribué |
| **Sécurité by design** | Chiffrement, audit immutable, RBAC granulaire |
| **Offline-first** | Support mode déconnecté avec synchronisation |

### Stack technologique

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React 18)  │  Mobile (React Native)  │  API Clients  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER (Nginx)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────────┐
│   Web Server      │ │   API Server  │ │   Task Workers        │
│   (Nginx)         │ │   (Django +   │ │   (Celery)            │
│   Static files    │ │   Gunicorn)   │ │   - Email             │
│   SPA routing     │ │   REST API    │ │   - PDF conversion    │
└───────────────────┘ └───────────────┘ │   - Notifications     │
                              │         │   - Scheduled tasks   │
                              │         └───────────────────────┘
                              │                   │
            ┌─────────────────┼───────────────────┤
            ▼                 ▼                   ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────────┐
│   PostgreSQL 16   │ │   Redis 7     │ │   Object Storage      │
│   - Data          │ │   - Cache     │ │   (S3/MinIO)          │
│   - Full-text     │ │   - Sessions  │ │   - Documents         │
│   - JSON          │ │   - Queues    │ │   - Signatures        │
└───────────────────┘ └───────────────┘ └───────────────────────┘
```

---

## Architecture globale

### Diagramme de composants

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ADVIST Platform                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         PRESENTATION LAYER                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  Web App     │  │  Mobile App  │  │  Public Site │              │ │
│  │  │  (React)     │  │  (Expo)      │  │  (Landing)   │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          API GATEWAY                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  Auth        │  │  Rate        │  │  CORS        │              │ │
│  │  │  Middleware  │  │  Limiting    │  │  Headers     │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        BUSINESS LAYER                               │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │Accounts │ │Documents│ │Workflows│ │Signatures│ │  Audit  │      │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │ Billing │ │Marketing│ │Compliance│ │ISO 27001│ │Archives │      │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          DATA LAYER                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  PostgreSQL  │  │    Redis     │  │  S3 Storage  │              │ │
│  │  │  (Primary)   │  │  (Cache)     │  │  (Files)     │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Multi-tenant

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MULTI-TENANT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Request → JWT Token → Extract org_id → Apply Tenant Context       │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     Tenant Isolation                         │   │
│   │                                                              │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│   │   │  Tenant A   │  │  Tenant B   │  │  Tenant C   │        │   │
│   │   │             │  │             │  │             │        │   │
│   │   │ • Users     │  │ • Users     │  │ • Users     │        │   │
│   │   │ • Documents │  │ • Documents │  │ • Documents │        │   │
│   │   │ • Workflows │  │ • Workflows │  │ • Workflows │        │   │
│   │   │ • Settings  │  │ • Settings  │  │ • Settings  │        │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘        │   │
│   │                                                              │   │
│   │   Isolation Level: Row-Level Security (organization_id FK)   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Mécanisme d'isolation :**

1. **Middleware OrganizationContext** : Extrait l'organisation du token JWT
2. **QuerySet filtering** : Tous les managers filtrent par `organization_id`
3. **Validation des FK** : Vérification que les références appartiennent au même tenant

```python
# Exemple de Manager avec isolation tenant
class TenantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(
            organization=get_current_organization()
        )
```

---

## Architecture Backend

### Structure des applications Django

```
backend/
├── advist/                    # Configuration projet
│   ├── settings/
│   │   ├── base.py           # Settings communs
│   │   ├── development.py    # Dev settings
│   │   └── production.py     # Prod settings
│   ├── urls.py               # URL routing principal
│   ├── celery.py             # Configuration Celery
│   └── wsgi.py               # Point d'entrée WSGI
│
├── apps/                      # Applications métier
│   ├── accounts/             # Authentification & utilisateurs
│   ├── organizations/        # Multi-entités & hiérarchie
│   ├── documents/            # Gestion documentaire
│   ├── workflows/            # Circuits de validation
│   ├── signatures/           # Signature électronique
│   ├── notifications/        # Système de notifications
│   ├── audit/                # Traçabilité immutable
│   ├── archives/             # Archivage & rétention
│   ├── billing/              # Abonnements & facturation
│   ├── support/              # Support client
│   ├── marketing/            # Marketing SaaS
│   ├── compliance/           # RGPD & conformité
│   ├── iso27001/             # Certification ISO 27001
│   ├── integrations/         # Intégrations tierces
│   ├── salesforce/           # CRM Salesforce
│   ├── collaboration/        # Temps réel
│   ├── security/             # Sécurité avancée
│   └── core/                 # Utilitaires partagés
│
├── api/                       # Configuration API globale
│   ├── urls.py               # Routing API centralisé
│   └── pagination.py         # Pagination custom
│
└── requirements/
    ├── base.txt              # Dépendances communes
    ├── development.txt       # Dépendances dev
    └── production.txt        # Dépendances prod
```

### Pattern des applications

Chaque application suit une structure standardisée :

```
app_name/
├── __init__.py
├── admin.py              # Interface admin Django
├── apps.py               # Configuration de l'app
├── models.py             # Modèles de données
├── serializers.py        # Sérializers DRF
├── views.py              # ViewSets et APIViews
├── urls.py               # Routing de l'app
├── permissions.py        # Permissions custom
├── signals.py            # Django signals
├── tasks.py              # Tâches Celery
├── services.py           # Logique métier
├── managers.py           # QuerySet managers
├── validators.py         # Validateurs custom
└── tests/
    ├── test_models.py
    ├── test_views.py
    └── test_services.py
```

### Flux de requête API

```
Request
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│  1. SecurityMiddleware (HTTPS, headers)                          │
│  2. SessionMiddleware                                            │
│  3. CorsMiddleware (CORS headers)                                │
│  4. AuthenticationMiddleware (JWT validation)                    │
│  5. OrganizationContextMiddleware (tenant isolation)             │
│  6. AuditMiddleware (logging des actions)                        │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│                           URL ROUTER                             │
│  /api/documents/ → DocumentViewSet                               │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│                            VIEWSET                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Permission check (IsAuthenticated, HasPermission)            │
│  2. Serializer validation                                        │
│  3. Business logic (Services)                                    │
│  4. Response serialization                                       │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
Response
```

### Services Layer

La logique métier complexe est encapsulée dans des services :

```python
# documents/services.py
class DocumentService:
    @staticmethod
    def create_document(user, file, metadata):
        """Crée un document avec toutes les validations métier"""
        # 1. Validation des quotas
        QuotaService.check_document_quota(user.organization)

        # 2. Création du document
        document = Document.objects.create(
            owner=user,
            organization=user.organization,
            **metadata
        )

        # 3. Upload du fichier
        version = DocumentVersion.objects.create(
            document=document,
            file=file,
            version_number=1,
            created_by=user
        )

        # 4. Conversion PDF asynchrone
        convert_to_pdf.delay(version.id)

        # 5. Calcul du checksum
        document.checksum = calculate_sha256(file)
        document.save()

        # 6. Audit log
        AuditService.log(user, 'create', document)

        return document

    @staticmethod
    def start_workflow(document, template, user):
        """Démarre un workflow de validation"""
        # Validation
        if document.active_workflow:
            raise WorkflowAlreadyActiveError()

        # Création de l'instance
        instance = WorkflowInstance.objects.create(
            template=template,
            document=document,
            initiated_by=user,
            status='in_progress'
        )

        # Création des étapes
        WorkflowService.create_steps_from_template(instance, template)

        # Activation de la première étape
        WorkflowService.activate_next_step(instance)

        # Notifications
        NotificationService.notify_workflow_started(instance)

        return instance
```

### Celery Tasks

Les tâches asynchrones sont gérées par Celery :

```python
# documents/tasks.py
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def convert_to_pdf(self, version_id):
    """Convertit un document en PDF pour signature"""
    try:
        version = DocumentVersion.objects.get(id=version_id)
        pdf_content = PDFConverter.convert(version.file)

        version.pdf_file.save(f"{version.file_name}.pdf", pdf_content)
        version.is_pdf_ready = True
        version.pdf_page_count = PDFCounter.count_pages(pdf_content)
        version.save()

    except Exception as exc:
        self.retry(exc=exc, countdown=60)

@shared_task
def send_workflow_reminder():
    """Envoie des rappels pour les tâches en attente (scheduled)"""
    pending_tasks = WorkflowAssignee.objects.filter(
        status='pending',
        step__deadline__lte=timezone.now() + timedelta(days=1),
        reminder_sent_at__isnull=True
    )

    for task in pending_tasks:
        NotificationService.send_reminder(task)
        task.reminder_sent_at = timezone.now()
        task.save()

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'workflow-reminders': {
        'task': 'documents.tasks.send_workflow_reminder',
        'schedule': crontab(hour=8, minute=0),  # Tous les jours à 8h
    },
    'archive-expired-documents': {
        'task': 'archives.tasks.archive_expired',
        'schedule': crontab(hour=2, minute=0),  # Tous les jours à 2h
    },
}
```

---

## Architecture Frontend

### Structure du projet React

```
src/
├── main.tsx                   # Point d'entrée
├── App.tsx                    # Composant racine + providers
├── index.css                  # Styles globaux Tailwind
│
├── components/                # Composants réutilisables
│   ├── ui/                   # Composants UI de base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── layout/               # Layout components
│   │   ├── UserLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── SuperAdminLayout.tsx
│   │   └── Navigation.tsx
│   ├── documents/            # Composants documents
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentViewer.tsx
│   │   └── AnnotationEditor.tsx
│   ├── workflows/            # Composants workflows
│   │   ├── WorkflowBuilder.tsx
│   │   ├── TaskCard.tsx
│   │   └── WorkflowTimeline.tsx
│   ├── signatures/           # Composants signatures
│   │   ├── SignaturePad.tsx
│   │   └── SignaturePositioner.tsx
│   └── dashboard/            # Widgets dashboard
│       ├── StatsCard.tsx
│       ├── ActivityFeed.tsx
│       └── ChartWidget.tsx
│
├── pages/                     # Pages (routes)
│   ├── auth/                 # Pages authentification
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── user/                 # Pages utilisateur
│   │   ├── DashboardPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   └── ...
│   ├── admin/                # Pages admin
│   │   ├── UsersPage.tsx
│   │   └── ...
│   └── superadmin/           # Pages super admin
│       ├── TenantsPage.tsx
│       └── ...
│
├── services/                  # Services API
│   ├── api.ts                # Client Axios configuré
│   ├── auth.ts               # Service authentification
│   ├── documents.ts          # Service documents
│   ├── workflows.ts          # Service workflows
│   └── ...
│
├── stores/                    # État global (Zustand)
│   ├── authStore.ts          # État authentification
│   ├── themeStore.ts         # État thème
│   ├── notificationStore.ts  # État notifications
│   └── offlineStore.ts       # État mode offline
│
├── hooks/                     # Custom hooks
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   ├── useWorkflows.ts
│   └── useOffline.ts
│
├── utils/                     # Utilitaires
│   ├── formatters.ts         # Formatage dates, nombres
│   ├── validators.ts         # Validation Zod schemas
│   └── crypto.ts             # Utilitaires crypto
│
├── types/                     # Types TypeScript
│   ├── document.ts
│   ├── workflow.ts
│   └── user.ts
│
└── i18n/                      # Internationalisation
    ├── fr.json
    └── en.json
```

### State Management avec Zustand

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  permissions: string[];

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      permissions: [],

      login: async (email, password) => {
        const response = await authService.login(email, password);
        set({
          user: response.user,
          accessToken: response.access,
          refreshToken: response.refresh,
          isAuthenticated: true,
          permissions: response.user.permissions,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          permissions: [],
        });
      },

      hasPermission: (permission) => {
        return get().permissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### Data Fetching avec React Query

```typescript
// hooks/useDocuments.ts
export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentService.getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentService.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Document créé avec succès');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDocumentWithWorkflow(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentService.getDocument(id),
    select: (data) => ({
      ...data,
      canEdit: data.status === 'draft' && !data.is_locked,
      canSign: data.active_workflow?.current_step?.type === 'signature',
    }),
  });
}
```

### Routing avec React Router v7

```typescript
// App.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute><UserLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/:id', element: <DocumentDetailPage /> },
      { path: 'workflows', element: <WorkflowsPage /> },
      { path: 'signatures', element: <SignaturesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'organization', element: <OrganizationPage /> },
      { path: 'audit', element: <AuditPage /> },
    ],
  },
  {
    path: '/superadmin',
    element: <ProtectedRoute requiredRole="superadmin"><SuperAdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'billing', element: <BillingDashboard /> },
    ],
  },
]);
```

### Optimisation des performances

```typescript
// vite.config.ts - Code Splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', '@radix-ui/react-dialog'],
          'vendor-pdf': ['html2pdf.js', 'pdfjs-dist'],
          'vendor-forms': ['react-hook-form', 'zod'],
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
});

// Lazy loading des pages
const DocumentsPage = lazy(() => import('./pages/user/DocumentsPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Usage avec Suspense
<Suspense fallback={<PageLoader />}>
  <DocumentsPage />
</Suspense>
```

---

## Architecture Mobile

### Structure React Native + Expo

```
mobile/
├── app/                       # File-based routing (Expo Router)
│   ├── _layout.tsx           # Layout racine
│   ├── index.tsx             # Écran d'accueil
│   ├── (auth)/               # Groupe auth (non authentifié)
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/               # Navigation par tabs (authentifié)
│       ├── _layout.tsx       # Tab navigator
│       ├── home.tsx
│       ├── documents/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       ├── tasks.tsx
│       └── profile.tsx
│
├── components/                # Composants réutilisables
│   ├── ui/                   # Composants UI de base
│   ├── documents/            # Composants spécifiques
│   └── signatures/           # Signature canvas
│
├── services/                  # Services API
│   ├── api.ts
│   └── offline.ts            # Gestion offline
│
├── stores/                    # Zustand stores
│
├── hooks/                     # Custom hooks
│
└── utils/                     # Utilitaires
```

### Fonctionnalités natives

```typescript
// Authentification biométrique
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authentifiez-vous pour accéder à ADVIST',
      fallbackLabel: 'Utiliser le code PIN',
    });
    return result.success;
  }
  return false;
}

// Stockage sécurisé
import * as SecureStore from 'expo-secure-store';

async function storeToken(token: string) {
  await SecureStore.setItemAsync('refresh_token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

// Signature manuscrite
import SignatureCanvas from 'react-native-signature-canvas';

function SignaturePad({ onSave }) {
  const ref = useRef<SignatureCanvas>(null);

  return (
    <SignatureCanvas
      ref={ref}
      onOK={(signature) => onSave(signature)}
      descriptionText="Signez ci-dessus"
      clearText="Effacer"
      confirmText="Confirmer"
      webStyle={signatureStyle}
    />
  );
}
```

### Mode Offline

```typescript
// services/offline.ts
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const storage = new MMKV();

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  payload: any;
  timestamp: number;
}

class OfflineService {
  private actionQueue: OfflineAction[] = [];

  constructor() {
    // Charger la queue au démarrage
    const saved = storage.getString('offline_queue');
    if (saved) {
      this.actionQueue = JSON.parse(saved);
    }

    // Écouter les changements de connexion
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.syncQueue();
      }
    });
  }

  async enqueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const fullAction: OfflineAction = {
      ...action,
      id: uuid(),
      timestamp: Date.now(),
    };

    this.actionQueue.push(fullAction);
    storage.set('offline_queue', JSON.stringify(this.actionQueue));
  }

  async syncQueue() {
    for (const action of this.actionQueue) {
      try {
        await api.request({
          method: this.getMethod(action.type),
          url: action.endpoint,
          data: action.payload,
        });

        // Retirer de la queue si succès
        this.actionQueue = this.actionQueue.filter(a => a.id !== action.id);
      } catch (error) {
        // Garder dans la queue si échec
        console.error('Sync failed for action:', action.id);
      }
    }

    storage.set('offline_queue', JSON.stringify(this.actionQueue));
  }
}
```

---

## Base de données

### Schéma de données simplifié

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│   │ Organization │◄────────│  Department  │         │     User     │   │
│   ├──────────────┤    1:N  ├──────────────┤    N:1  ├──────────────┤   │
│   │ id (UUID)    │         │ id (UUID)    │◄────────│ id (UUID)    │   │
│   │ name         │         │ name         │         │ email        │   │
│   │ slug         │         │ code         │         │ first_name   │   │
│   │ settings     │         │ parent_id    │─┐       │ last_name    │   │
│   │ is_active    │         │ manager_id   │ │       │ org_id       │──┐│
│   └──────────────┘         └──────────────┘ │       │ dept_id      │  ││
│          ▲                        ▲         │       │ is_active    │  ││
│          │                        └─────────┘       └──────────────┘  ││
│          │                                                 │          ││
│          └─────────────────────────────────────────────────┘          ││
│                                        1:N                             ││
│                                                                        ││
│   ┌──────────────────────────────────────────────────────────────┐    ││
│   │                        DOCUMENT DOMAIN                        │    ││
│   ├──────────────────────────────────────────────────────────────┤    ││
│   │                                                               │    ││
│   │   ┌──────────────┐         ┌──────────────────┐              │    ││
│   │   │   Document   │         │  DocumentVersion │              │    ││
│   │   ├──────────────┤    1:N  ├──────────────────┤              │    ││
│   │   │ id (UUID)    │◄────────│ id (UUID)        │              │◄───┘│
│   │   │ title        │         │ version_number   │              │     │
│   │   │ reference    │         │ file             │              │     │
│   │   │ status       │         │ checksum         │              │     │
│   │   │ org_id       │─────────│ change_summary   │              │     │
│   │   │ owner_id     │         │ created_by       │              │     │
│   │   │ type_id      │         └──────────────────┘              │     │
│   │   │ checksum     │                                           │     │
│   │   └──────────────┘                                           │     │
│   │          │                                                   │     │
│   │          │ 1:N                                               │     │
│   │          ▼                                                   │     │
│   │   ┌──────────────────┐    ┌──────────────────┐              │     │
│   │   │DocumentAnnotation│    │ DocumentAccess   │              │     │
│   │   ├──────────────────┤    ├──────────────────┤              │     │
│   │   │ id (UUID)        │    │ document_id      │              │     │
│   │   │ type             │    │ user_id          │              │     │
│   │   │ page_number      │    │ permission_level │              │     │
│   │   │ position (JSON)  │    │ granted_by       │              │     │
│   │   │ content          │    └──────────────────┘              │     │
│   │   │ context_type     │                                       │     │
│   │   └──────────────────┘                                       │     │
│   │                                                               │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                       WORKFLOW DOMAIN                         │     │
│   ├──────────────────────────────────────────────────────────────┤     │
│   │                                                               │     │
│   │   ┌──────────────────┐         ┌──────────────────┐          │     │
│   │   │WorkflowTemplate  │         │ WorkflowInstance │          │     │
│   │   ├──────────────────┤    1:N  ├──────────────────┤          │     │
│   │   │ id (UUID)        │◄────────│ id (UUID)        │          │     │
│   │   │ name             │         │ template_id      │          │     │
│   │   │ steps_config     │         │ document_id      │──────────│─────┘
│   │   │ org_id           │         │ status           │          │
│   │   │ is_active        │         │ current_step     │          │
│   │   └──────────────────┘         └──────────────────┘          │
│   │                                        │                      │
│   │                                        │ 1:N                  │
│   │                                        ▼                      │
│   │                                ┌──────────────────┐           │
│   │                                │  WorkflowStep    │           │
│   │                                ├──────────────────┤           │
│   │                                │ id (UUID)        │           │
│   │                                │ name             │           │
│   │                                │ type             │           │
│   │                                │ order            │           │
│   │                                │ status           │           │
│   │                                │ deadline         │           │
│   │                                └──────────────────┘           │
│   │                                        │                      │
│   │                                        │ 1:N                  │
│   │                                        ▼                      │
│   │                                ┌──────────────────┐           │
│   │                                │WorkflowAssignee  │           │
│   │                                ├──────────────────┤           │
│   │                                │ step_id          │           │
│   │                                │ user_id          │           │
│   │                                │ status           │           │
│   │                                │ action           │           │
│   │                                │ action_at        │           │
│   │                                └──────────────────┘           │
│   │                                                               │
│   └──────────────────────────────────────────────────────────────┘
│                                                                    │
│   ┌──────────────────────────────────────────────────────────────┐│
│   │                      SIGNATURE DOMAIN                         ││
│   ├──────────────────────────────────────────────────────────────┤│
│   │                                                               ││
│   │   ┌──────────────────┐         ┌──────────────────┐          ││
│   │   │  UserSignature   │         │DocumentSignature │          ││
│   │   ├──────────────────┤    1:N  ├──────────────────┤          ││
│   │   │ id (UUID)        │◄────────│ id (UUID)        │          ││
│   │   │ user_id          │         │ document_id      │          ││
│   │   │ signature_type   │         │ user_signature_id│          ││
│   │   │ encrypted_image  │         │ page_number      │          ││
│   │   │ pin_hash         │         │ position (JSON)  │          ││
│   │   │ is_active        │         │ timestamp        │          ││
│   │   └──────────────────┘         │ document_hash    │          ││
│   │                                │ geolocation      │          ││
│   │                                └──────────────────┘          ││
│   │                                                               ││
│   └──────────────────────────────────────────────────────────────┘│
│                                                                    │
│   ┌──────────────────────────────────────────────────────────────┐│
│   │                        AUDIT DOMAIN                           ││
│   ├──────────────────────────────────────────────────────────────┤│
│   │                                                               ││
│   │   ┌──────────────────────────────────────────────────────┐   ││
│   │   │                      AuditLog                         │   ││
│   │   ├──────────────────────────────────────────────────────┤   ││
│   │   │ id (UUID)           │ action           │ ip_address  │   ││
│   │   │ timestamp           │ resource_type    │ user_agent  │   ││
│   │   │ user_id             │ resource_id      │ chain_hash  │   ││
│   │   │ org_id              │ old_values       │ prev_hash   │   ││
│   │   │                     │ new_values       │             │   ││
│   │   └──────────────────────────────────────────────────────┘   ││
│   │                                                               ││
│   │   Note: Immutable avec chaînage cryptographique              ││
│   │                                                               ││
│   └──────────────────────────────────────────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Index et optimisations

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_documents_org_status ON documents(organization_id, status);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_created ON documents(created_at DESC);
CREATE INDEX idx_documents_reference ON documents(reference);

-- Index composite pour les filtres courants
CREATE INDEX idx_documents_org_type_status
ON documents(organization_id, document_type_id, status);

-- Index pour la recherche full-text
CREATE INDEX idx_documents_search
ON documents USING gin(to_tsvector('french', title || ' ' || description));

-- Index pour les workflows
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_assignees_pending
ON workflow_assignees(user_id, status) WHERE status = 'pending';

-- Index pour l'audit (requêtes temporelles)
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_org_action
ON audit_logs(organization_id, action, timestamp DESC);
```

### Migrations et versioning

```python
# Migration atomique avec rollback
class Migration(migrations.Migration):
    atomic = True

    dependencies = [
        ('documents', '0015_add_validation_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='validation_status',
            field=models.CharField(
                max_length=20,
                choices=VALIDATION_STATUS_CHOICES,
                default='draft',
            ),
        ),
        migrations.RunSQL(
            sql="UPDATE documents SET validation_status = 'validated' WHERE status = 'approved'",
            reverse_sql="UPDATE documents SET status = 'approved' WHERE validation_status = 'validated'",
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['validation_status'], name='doc_valid_status_idx'),
        ),
    ]
```

---

## Sécurité

### Architecture de sécurité

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      NETWORK SECURITY                               │ │
│  │  • HTTPS obligatoire (TLS 1.3)                                      │ │
│  │  • WAF (Web Application Firewall)                                   │ │
│  │  • DDoS protection                                                  │ │
│  │  • IP whitelisting (API clients)                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    APPLICATION SECURITY                             │ │
│  │  • JWT Authentication (access + refresh tokens)                     │ │
│  │  • 2FA (TOTP)                                                       │ │
│  │  • Rate limiting                                                    │ │
│  │  • CORS policy                                                      │ │
│  │  • CSP headers                                                      │ │
│  │  • Input validation (Zod + DRF serializers)                         │ │
│  │  • Output sanitization (DOMPurify)                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       DATA SECURITY                                 │ │
│  │  • Encryption at rest (AES-256)                                     │ │
│  │  • Encryption in transit (TLS)                                      │ │
│  │  • Document checksums (SHA-256)                                     │ │
│  │  • Signature PIN hashing (PBKDF2)                                   │ │
│  │  • Audit log chaining (cryptographic)                               │ │
│  │  • PII anonymization                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     ACCESS CONTROL (RBAC)                           │ │
│  │                                                                      │ │
│  │   Levels:  User → Manager → Admin → OrgAdmin → SuperAdmin           │ │
│  │                                                                      │ │
│  │   Permissions granulaires:                                          │ │
│  │   • documents.create, documents.read, documents.update              │ │
│  │   • workflows.create, workflows.approve, workflows.reject           │ │
│  │   • signatures.create, signatures.sign                              │ │
│  │   • users.manage, organization.settings                             │ │
│  │                                                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Authentification JWT

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': env('JWT_SECRET_KEY'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_OBTAIN_SERIALIZER': 'accounts.serializers.CustomTokenObtainSerializer',
}

# Token payload personnalisé
class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Claims additionnels
        token['email'] = user.email
        token['org_id'] = str(user.organization_id)
        token['permissions'] = user.get_all_permissions()
        token['is_org_admin'] = user.is_org_admin

        return token
```

### Chiffrement des signatures

```python
# signatures/encryption.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import hashlib
import base64

class SignatureEncryption:
    @staticmethod
    def encrypt_signature(image_data: bytes, user_id: str) -> bytes:
        """Chiffre l'image de signature avec AES-256"""
        key = SignatureEncryption._derive_key(user_id)
        fernet = Fernet(key)
        return fernet.encrypt(image_data)

    @staticmethod
    def decrypt_signature(encrypted_data: bytes, user_id: str) -> bytes:
        """Déchiffre l'image de signature"""
        key = SignatureEncryption._derive_key(user_id)
        fernet = Fernet(key)
        return fernet.decrypt(encrypted_data)

    @staticmethod
    def hash_pin(pin: str, salt: bytes = None) -> tuple[str, bytes]:
        """Hash le PIN avec PBKDF2"""
        if salt is None:
            salt = os.urandom(16)

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        pin_hash = base64.b64encode(kdf.derive(pin.encode())).decode()
        return pin_hash, salt

    @staticmethod
    def verify_pin(pin: str, pin_hash: str, salt: bytes) -> bool:
        """Vérifie un PIN contre son hash"""
        new_hash, _ = SignatureEncryption.hash_pin(pin, salt)
        return hmac.compare_digest(new_hash, pin_hash)
```

### Audit immutable avec chaînage

```python
# audit/models.py
class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=50)
    resource_id = models.PositiveIntegerField()
    resource_title = models.CharField(max_length=255)

    old_values = models.JSONField(null=True)
    new_values = models.JSONField(null=True)

    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()

    # Chaînage cryptographique
    chain_hash = models.CharField(max_length=64)  # SHA-256
    previous_hash = models.CharField(max_length=64)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['organization', 'action', '-timestamp']),
        ]

    def save(self, *args, **kwargs):
        if not self.chain_hash:
            self.chain_hash = self._calculate_hash()
        super().save(*args, **kwargs)

    def _calculate_hash(self) -> str:
        """Calcule le hash de l'entrée incluant le hash précédent"""
        data = f"{self.timestamp}{self.user_id}{self.action}{self.resource_type}"
        data += f"{self.resource_id}{self.previous_hash}"
        return hashlib.sha256(data.encode()).hexdigest()

    @classmethod
    def create_log(cls, user, action, resource, old_values=None, new_values=None, request=None):
        """Factory method pour créer un log avec chaînage"""
        # Récupérer le dernier hash
        last_log = cls.objects.filter(organization=user.organization).order_by('-timestamp').first()
        previous_hash = last_log.chain_hash if last_log else '0' * 64

        return cls.objects.create(
            user=user,
            organization=user.organization,
            action=action,
            resource_type=resource._meta.model_name,
            resource_id=resource.id,
            resource_title=str(resource),
            old_values=old_values,
            new_values=new_values,
            ip_address=get_client_ip(request) if request else '0.0.0.0',
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
            previous_hash=previous_hash,
        )
```

---

## Performance et Scalabilité

### Stratégie de cache

```python
# Cache multi-niveaux
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'advist',
        'TIMEOUT': 300,  # 5 minutes par défaut
    }
}

# Décorateur de cache personnalisé
from functools import wraps
from django.core.cache import cache

def cache_per_org(timeout=300):
    """Cache spécifique par organisation"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            org_id = request.user.organization_id
            cache_key = f"{org_id}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            result = cache.get(cache_key)
            if result is None:
                result = func(self, request, *args, **kwargs)
                cache.set(cache_key, result, timeout)

            return result
        return wrapper
    return decorator

# Usage
class DocumentViewSet(viewsets.ModelViewSet):
    @cache_per_org(timeout=60)
    def list(self, request):
        # Cette vue est cachée 60 secondes par organisation
        ...
```

### Pagination efficace

```python
# api/pagination.py
from rest_framework.pagination import CursorPagination

class DocumentCursorPagination(CursorPagination):
    """Pagination par curseur pour les grands datasets"""
    page_size = 20
    ordering = '-created_at'
    cursor_query_param = 'cursor'

    def get_paginated_response(self, data):
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })

# Pagination offset classique pour petits datasets
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### Optimisation des requêtes

```python
# documents/views.py
class DocumentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Document.objects.filter(
            organization=self.request.user.organization
        ).select_related(
            'owner',
            'department',
            'document_type',
            'active_workflow__template',
        ).prefetch_related(
            'versions',
            Prefetch(
                'active_workflow__steps',
                queryset=WorkflowStep.objects.select_related('step_config')
            ),
        ).annotate(
            version_count=Count('versions'),
            annotation_count=Count('annotations'),
        )
```

### Architecture de scalabilité

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     HORIZONTAL SCALING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         ┌─────────────────┐                             │
│                         │  Load Balancer  │                             │
│                         │     (Nginx)     │                             │
│                         └────────┬────────┘                             │
│                                  │                                       │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│              ▼                   ▼                   ▼                  │
│      ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │
│      │  API Server   │   │  API Server   │   │  API Server   │         │
│      │   Instance 1  │   │   Instance 2  │   │   Instance 3  │         │
│      │  (Stateless)  │   │  (Stateless)  │   │  (Stateless)  │         │
│      └───────────────┘   └───────────────┘   └───────────────┘         │
│                                  │                                       │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│              ▼                   ▼                   ▼                  │
│      ┌───────────────┐   ┌───────────────┐   ┌───────────────┐         │
│      │    Redis      │   │  PostgreSQL   │   │  S3 Storage   │         │
│      │   Cluster     │   │   Primary +   │   │  (Scalable)   │         │
│      │  (3 nodes)    │   │   Replicas    │   │               │         │
│      └───────────────┘   └───────────────┘   └───────────────┘         │
│                                                                          │
│      ┌───────────────────────────────────────────────────────┐          │
│      │                   Celery Workers                       │          │
│      │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │          │
│      │  │Worker 1 │  │Worker 2 │  │Worker 3 │  │Worker N │  │          │
│      │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │          │
│      │             (Auto-scaling based on queue depth)       │          │
│      └───────────────────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Intégrations

### Architecture d'intégration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                      ADVIST Core                                │    │
│   │                                                                 │    │
│   │   ┌─────────────────────────────────────────────────────────┐  │    │
│   │   │              Integration Service Layer                   │  │    │
│   │   │                                                          │  │    │
│   │   │  • OAuth 2.0 Token Management                            │  │    │
│   │   │  • Webhook Dispatcher                                    │  │    │
│   │   │  • Retry Queue (Celery)                                  │  │    │
│   │   │  • Data Transformation                                   │  │    │
│   │   └─────────────────────────────────────────────────────────┘  │    │
│   │                              │                                  │    │
│   └──────────────────────────────┼──────────────────────────────────┘    │
│                                  │                                       │
│      ┌───────────────────────────┼───────────────────────────┐          │
│      │                           │                           │          │
│      ▼                           ▼                           ▼          │
│  ┌──────────┐             ┌──────────┐              ┌──────────┐        │
│  │Microsoft │             │  Google  │              │Salesforce│        │
│  │   365    │             │Workspace │              │   CRM    │        │
│  ├──────────┤             ├──────────┤              ├──────────┤        │
│  │• Teams   │             │• Gmail   │              │• Contacts│        │
│  │• SharePt │             │• Drive   │              │• Accounts│        │
│  │• Outlook │             │• Calendar│              │• Docs    │        │
│  └──────────┘             └──────────┘              └──────────┘        │
│                                                                          │
│      ▼                           ▼                           ▼          │
│  ┌──────────┐             ┌──────────┐              ┌──────────┐        │
│  │   ERP    │             │  Social  │              │  QTSP    │        │
│  │ Systems  │             │  Media   │              │ (eIDAS)  │        │
│  ├──────────┤             ├──────────┤              ├──────────┤        │
│  │• Sage    │             │• LinkedIn│              │• Certinomis      │
│  │• SAP     │             │• Twitter │              │• DocuSign│        │
│  │          │             │• Facebook│              │          │        │
│  └──────────┘             └──────────┘              └──────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pattern d'intégration

```python
# integrations/services.py
from abc import ABC, abstractmethod

class IntegrationProvider(ABC):
    """Interface de base pour les intégrations"""

    @abstractmethod
    def authenticate(self, credentials: dict) -> bool:
        pass

    @abstractmethod
    def sync_documents(self, documents: list) -> dict:
        pass

    @abstractmethod
    def handle_webhook(self, payload: dict) -> None:
        pass

class MicrosoftIntegration(IntegrationProvider):
    def __init__(self, config: IntegrationConfig):
        self.config = config
        self.graph_client = self._init_graph_client()

    def authenticate(self, credentials: dict) -> bool:
        # OAuth 2.0 flow avec Microsoft
        token = self._get_oauth_token(credentials)
        self.config.access_token = token
        self.config.save()
        return True

    def sync_documents(self, documents: list) -> dict:
        results = {'synced': [], 'failed': []}

        for doc in documents:
            try:
                # Upload vers SharePoint
                self.graph_client.sites[self.config.site_id].drive.items.upload(
                    name=doc.current_version.file_name,
                    content=doc.current_version.file.read()
                )
                results['synced'].append(doc.id)
            except Exception as e:
                results['failed'].append({'id': doc.id, 'error': str(e)})

        return results

    def send_teams_notification(self, channel_id: str, message: str):
        """Envoie une notification Teams"""
        self.graph_client.teams[self.config.team_id].channels[channel_id].messages.post(
            body={'content': message}
        )
```

### Webhooks sortants

```python
# integrations/webhooks.py
import hmac
import hashlib
import requests
from celery import shared_task

@shared_task(bind=True, max_retries=5)
def dispatch_webhook(self, webhook_id: str, event: str, payload: dict):
    """Dispatche un webhook vers un endpoint externe"""
    webhook = WebhookConfig.objects.get(id=webhook_id)

    # Signature HMAC
    signature = hmac.new(
        webhook.secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()

    headers = {
        'Content-Type': 'application/json',
        'X-Advist-Event': event,
        'X-Advist-Signature': f'sha256={signature}',
        'X-Advist-Delivery': str(uuid.uuid4()),
    }

    try:
        response = requests.post(
            webhook.url,
            json=payload,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()

        # Log succès
        WebhookDelivery.objects.create(
            webhook=webhook,
            event=event,
            payload=payload,
            status_code=response.status_code,
            success=True
        )

    except requests.RequestException as exc:
        # Log échec et retry
        WebhookDelivery.objects.create(
            webhook=webhook,
            event=event,
            payload=payload,
            error=str(exc),
            success=False
        )

        # Exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## Infrastructure et Déploiement

### Architecture Docker

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Base de données PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: advist
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G

  # Cache Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Django
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/advist
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - static_files:/app/static
      - media_files:/app/media
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G

  # Worker Celery
  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A advist worker -l INFO -c 4
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/advist
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G

  # Scheduler Celery Beat
  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A advist beat -l INFO
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/advist
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend
      - redis
    deploy:
      replicas: 1

  # Frontend React
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 2

  # Reverse Proxy Nginx
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - static_files:/usr/share/nginx/static
    depends_on:
      - backend
      - frontend

  # Backup automatique
  backup:
    image: postgres:16-alpine
    command: |
      sh -c 'while true; do
        PGPASSWORD=${DB_PASSWORD} pg_dump -h postgres -U ${DB_USER} advist | gzip > /backup/advist_$(date +%Y%m%d_%H%M%S).sql.gz
        find /backup -name "*.sql.gz" -mtime +7 -delete
        sleep 86400
      done'
    volumes:
      - ./backup:/backup
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  static_files:
  media_files:

networks:
  default:
    name: advist-network
```

### Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Tests Frontend
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: frontend

  # Build Frontend
  frontend-build:
    runs-on: ubuntu-latest
    needs: frontend-test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: dist/
          retention-days: 7

  # Tests Backend
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: advist_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements/development.txt

      - name: Run migrations
        run: |
          cd backend
          python manage.py migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/advist_test
          REDIS_URL: redis://localhost:6379/0

      - name: Run tests
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/advist_test
          REDIS_URL: redis://localhost:6379/0

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

  # E2E Tests
  e2e-test:
    runs-on: ubuntu-latest
    needs: [frontend-build, backend-test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  # Deploy to staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [frontend-build, backend-test]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Deploy commands here
          echo "Deploying to staging..."

  # Deploy to production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [frontend-build, backend-test, e2e-test]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Deploy commands here
          echo "Deploying to production..."
```

### Monitoring et observabilité

```python
# Configuration Sentry
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

sentry_sdk.init(
    dsn=env('SENTRY_DSN'),
    integrations=[
        DjangoIntegration(),
        CeleryIntegration(),
        RedisIntegration(),
    ],
    traces_sample_rate=0.1,  # 10% des transactions
    profiles_sample_rate=0.1,
    environment=env('ENVIRONMENT'),
    release=env('GIT_COMMIT_SHA'),
)

# Logging structuré
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

# Usage
logger = structlog.get_logger(__name__)
logger.info("document_created", document_id=doc.id, user_id=user.id)
```

---

## Annexes

### Glossaire

| Terme | Définition |
|-------|------------|
| **Tenant** | Organisation cliente dans l'architecture multi-tenant |
| **Workflow** | Circuit de validation automatisé |
| **QES** | Qualified Electronic Signature (signature qualifiée eIDAS) |
| **RBAC** | Role-Based Access Control |
| **JWT** | JSON Web Token |
| **ISMS** | Information Security Management System (ISO 27001) |

### Références

- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Celery](https://docs.celeryq.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/documentation)
- [eIDAS Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=uriserv:OJ.L_.2014.257.01.0073.01.ENG)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
- [RGPD](https://eur-lex.europa.eu/eli/reg/2016/679)
