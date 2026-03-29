# ADVIST - Application de Gestion Documentaire avec Workflow de Validation

## 1. Présentation du Projet

### 1.1 Contexte
Application web complète de gestion du cycle de vie documentaire intégrant des workflows de validation, d'approbation et de signature électronique. L'application est multi-entités, sécurisée et conforme aux exigences légales de traçabilité.

### 1.2 Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18+ avec TypeScript |
| Backend | Django 5+ avec Django REST Framework |
| Base de données | PostgreSQL 15+ |
| Authentification | JWT + OAuth 2.0 |
| Stockage fichiers | S3-compatible (MinIO ou AWS S3) |
| Cache | Redis |
| Recherche | Elasticsearch (optionnel) |
| Conteneurisation | Docker + Docker Compose |

### 1.3 Charte Graphique ADVIST

**Palette de couleurs :**
- `#EAEAEA` : Fond principal
- `#A29790` : Accents secondaires, bordures, hover
- `#3A4654` : Texte secondaire, titres de modules
- `#383733` : Texte principal, contrastes forts
- `#FFFFFF` : Cartes et surfaces

**Typographie :** Quicksand (Regular, Medium, Semibold)

---

## 2. Architecture Technique

### 2.1 Structure du Projet

```
advist/
├── backend/
│   ├── advist/
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── accounts/          # Gestion utilisateurs
│   │   ├── organizations/     # Multi-entités
│   │   ├── documents/         # Gestion documentaire
│   │   ├── workflows/         # Circuits de validation
│   │   ├── signatures/        # Signature électronique
│   │   ├── notifications/     # Système de notifications
│   │   ├── audit/             # Traçabilité et logs
│   │   └── archives/          # Archivage et rétention
│   ├── core/                  # Utilitaires partagés
│   ├── api/                   # Configuration API globale
│   ├── manage.py
│   └── requirements/
│       ├── base.txt
│       ├── development.txt
│       └── production.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Composants UI réutilisables
│   │   │   ├── layout/        # Navbar, Sidebar, Layout
│   │   │   ├── documents/     # Composants documents
│   │   │   ├── workflows/     # Composants workflows
│   │   │   └── signatures/    # Composants signatures
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/          # Appels API
│   │   ├── store/             # État global (Zustand)
│   │   ├── types/             # Types TypeScript
│   │   ├── utils/
│   │   └── styles/
│   │       ├── theme.ts       # Thème ADVIST
│   │       └── globals.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 3. Fonctionnalités

### 3.1 Gestion des Utilisateurs et Organisations
- Authentification JWT avec refresh tokens
- Support OAuth 2.0
- Gestion multi-entités (organisations et filiales)
- Départements hiérarchiques
- Rôles et permissions granulaires
- Authentification à deux facteurs (2FA)

### 3.2 Gestion Documentaire
- Upload multi-fichiers avec validation d'extension et taille
- Versioning automatique des documents
- Verrouillage de documents pour édition exclusive
- Métadonnées personnalisables par type de document
- Système de tags
- Conversion automatique en PDF
- Annotations (surlignage, commentaires, dessins, tampons)
- Commentaires et mentions

### 3.3 Workflows de Validation
- Création de modèles de workflows réutilisables
- Types d'étapes : approbation, signature, revue, information
- Assignation par utilisateur, rôle ou département
- Règles de validation : tous, un seul, majorité
- Délais et rappels automatiques
- Escalade automatique
- Conditions de branchement
- Délégation de tâches

### 3.4 Signature Électronique
- Gestion des signatures personnelles (formelle, initiales, paraphe)
- Positionnement libre sur le document
- Sécurisation par PIN
- Horodatage et géolocalisation
- Certificat de signature
- Filigrane unique
- Journal d'audit des signatures

### 3.5 Notifications
- Notifications in-app, email et push
- Templates personnalisables
- Préférences utilisateur

### 3.6 Audit et Traçabilité
- Journal d'audit immutable
- Chaînage cryptographique des logs
- Actions tracées : création, modification, suppression, consultation, téléchargement, approbation, rejet, signature, archivage

### 3.7 Archivage
- Politique de rétention configurable
- Archivage automatique
- Restauration de documents

---

## 4. API REST - Endpoints Principaux

### 4.1 Authentification
```
POST   /api/auth/login/              # Connexion
POST   /api/auth/logout/             # Déconnexion
POST   /api/auth/refresh/            # Rafraîchir le token
POST   /api/auth/register/           # Inscription
POST   /api/auth/password/reset/     # Réinitialisation mot de passe
POST   /api/auth/password/change/    # Changement mot de passe
GET    /api/auth/me/                 # Profil utilisateur
```

### 4.2 Utilisateurs et Organisations
```
GET    /api/users/                   # Liste des utilisateurs
POST   /api/users/                   # Créer un utilisateur
GET    /api/users/{id}/              # Détail utilisateur
PATCH  /api/users/{id}/              # Modifier utilisateur
DELETE /api/users/{id}/              # Supprimer utilisateur

GET    /api/organizations/           # Liste des organisations
POST   /api/organizations/           # Créer une organisation
GET    /api/organizations/{id}/      # Détail organisation
PATCH  /api/organizations/{id}/      # Modifier organisation

GET    /api/departments/             # Liste des départements
POST   /api/departments/             # Créer un département
GET    /api/departments/{id}/        # Détail département
PATCH  /api/departments/{id}/        # Modifier département

GET    /api/roles/                   # Liste des rôles
POST   /api/roles/                   # Créer un rôle
```

### 4.3 Documents
```
GET    /api/documents/               # Liste des documents
POST   /api/documents/               # Créer un document
GET    /api/documents/{id}/          # Détail document
PATCH  /api/documents/{id}/          # Modifier document
DELETE /api/documents/{id}/          # Supprimer document
POST   /api/documents/{id}/upload_version/   # Nouvelle version
POST   /api/documents/{id}/lock/     # Verrouiller
POST   /api/documents/{id}/unlock/   # Déverrouiller
GET    /api/documents/{id}/download/ # Télécharger
POST   /api/documents/{id}/start_workflow/   # Démarrer workflow

GET    /api/document-types/          # Types de documents
POST   /api/document-types/          # Créer un type
```

### 4.4 Workflows
```
GET    /api/workflow-templates/      # Modèles de workflow
POST   /api/workflow-templates/      # Créer un modèle
GET    /api/workflow-templates/{id}/ # Détail modèle
PATCH  /api/workflow-templates/{id}/ # Modifier modèle

GET    /api/workflow-instances/      # Instances de workflow
GET    /api/workflow-instances/{id}/ # Détail instance

GET    /api/my-tasks/                # Mes tâches en attente
POST   /api/my-tasks/{id}/approve/   # Approuver
POST   /api/my-tasks/{id}/reject/    # Rejeter
POST   /api/my-tasks/{id}/delegate/  # Déléguer
```

### 4.5 Signatures
```
GET    /api/user-signatures/         # Mes signatures
POST   /api/user-signatures/         # Créer une signature
DELETE /api/user-signatures/{id}/    # Supprimer une signature
POST   /api/documents/{id}/sign/     # Signer un document
```

### 4.6 Notifications
```
GET    /api/notifications/           # Mes notifications
PATCH  /api/notifications/{id}/      # Marquer comme lue
POST   /api/notifications/mark-all-read/  # Tout marquer comme lu
```

### 4.7 Dashboard
```
GET    /api/dashboard/stats/         # Statistiques
GET    /api/dashboard/recent/        # Activité récente
```

---

## 5. Règles d'UX

### 5.1 Design System
- Interface épurée avec fond `#EAEAEA`
- Cartes blanches avec ombres légères
- Navigation latérale collapsible
- Barre de recherche globale
- Notifications en temps réel

### 5.2 Responsive Design
- Mobile-first approach
- Breakpoints : sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar se transforme en menu hamburger sur mobile

### 5.3 Accessibilité
- Contraste WCAG AA minimum
- Navigation au clavier
- Labels ARIA appropriés
- Focus visible

### 5.4 Performance
- Lazy loading des composants
- Virtualisation des listes longues
- Mise en cache des requêtes avec React Query
- Optimistic updates

---

## 6. Exigences de Sécurité

### 6.1 Authentification
- Tokens JWT avec expiration courte (15 min access, 7 jours refresh)
- Rotation automatique des refresh tokens
- Blocage après 5 tentatives de connexion échouées
- Sessions invalidées après changement de mot de passe

### 6.2 Autorisation
- RBAC (Role-Based Access Control)
- Permissions granulaires par ressource
- Isolation des données par organisation

### 6.3 Protection des Données
- Chiffrement AES-256 pour les signatures stockées
- Hash SHA-256 pour l'intégrité des documents
- HTTPS obligatoire en production
- Headers de sécurité (CSP, HSTS, X-Frame-Options)

### 6.4 Audit
- Logging de toutes les actions sensibles
- Chaînage cryptographique des logs d'audit
- Rétention des logs configurable

---

## 7. Déploiement

### 7.1 Développement
```bash
# Cloner le repository
git clone <repository-url>
cd advist

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer les services
docker-compose up -d

# Migrations et données initiales
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 7.2 Production
```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# Migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 7.3 Variables d'Environnement

```bash
# Django
DEBUG=0
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=yourdomain.com

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379/0

# Storage
AWS_S3_ENDPOINT_URL=https://s3.amazonaws.com
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=advist-documents

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=user
EMAIL_HOST_PASSWORD=password

# Security
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-32-byte-key
```

---

## 8. Tests

### 8.1 Backend
```bash
# Lancer tous les tests
docker-compose exec backend pytest

# Avec couverture
docker-compose exec backend pytest --cov=apps --cov-report=html

# Tests spécifiques
docker-compose exec backend pytest apps/documents/tests/
```

### 8.2 Frontend
```bash
# Tests unitaires
docker-compose exec frontend npm test

# Tests avec couverture
docker-compose exec frontend npm run test:coverage

# Tests E2E
docker-compose exec frontend npm run test:e2e
```

---

## 9. CI/CD

Le projet utilise GitHub Actions pour :
- Linting (ESLint, Flake8, Black)
- Tests automatisés
- Build des images Docker
- Déploiement automatique (staging/production)

---

## 10. Licence

Propriétaire - Patokouna © 2024
