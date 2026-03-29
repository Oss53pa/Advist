# Changelog

Toutes les modifications notables de ce projet seront documentees dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhere au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Support complet de l'authentification par cookies HttpOnly
- Chiffrement AES-GCM pour les donnees de session
- Dockerfiles pour tous les services (backend, frontend, celery)
- Configuration docker-compose.prod.yml pour la production
- Tests E2E avec Playwright
- Support RTL pour l'arabe
- Validation des numeros de telephone ouest-africains (+225, +221, etc.)
- Endpoint de health check pour le monitoring
- Documentation CONTRIBUTING.md
- Documentation PRA/PCA

### Changed
- Augmentation du seuil de couverture de tests de 40% a 80%
- Migration de localStorage vers cookies HttpOnly pour les tokens
- Amelioration du contraste des couleurs pour l'accessibilite (WCAG AA)
- Mise a jour des dependances npm (correction vulnerabilites)

### Security
- Correction de la vulnerabilite jspdf (Path Traversal)
- Correction des vulnerabilites react-router (CSRF, XSS)
- Suppression du chiffrement Base64 insecure
- Implementation du chiffrement AES-GCM avec cles ephemeres

### Fixed
- Validation des numeros de telephone pour le marche ouest-africain
- Support du mode RTL pour les langues arabes

---

## [1.0.0] - 2026-01-10

### Added

#### Core Features
- Gestion documentaire multi-tenant
- Workflows d'approbation personnalisables
- Signatures electroniques (Simple, Avancee, Qualifiee)
- Conformite RGPD complete
- Conformite eIDAS

#### Authentication & Security
- Authentification JWT avec refresh tokens
- Support 2FA (TOTP, Email OTP)
- RBAC avec permissions granulaires
- Audit trail cryptographique
- Protection XSS via DOMPurify
- Protection CSRF

#### Integrations
- Mobile Money (Orange Money, MTN, Wave, Moov)
- Microsoft 365 (SharePoint, OneDrive, Teams)
- Google Workspace (Drive, Gmail, Calendar)
- ERP (Sage 100, Sage X3, SAP)
- CRM (Salesforce)
- e-Gouv (RCCM, Cadastre)

#### UI/UX
- Design system coherent (24 composants)
- Responsive design mobile-first
- Mode offline avec synchronisation
- Internationalisation (FR, EN, ES, PT, AR)
- Theme personnalisable

#### Backend
- API REST avec Django REST Framework
- Documentation OpenAPI/Swagger
- Taches asynchrones avec Celery
- Cache Redis
- Logging structure (structlog)

#### DevOps
- CI/CD avec GitHub Actions
- Configuration Docker
- Tests automatises (127 tests, 72% couverture)
- Linting et formatage automatiques

### Technical Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Django 5, DRF, PostgreSQL 16, Redis 7
- State: Zustand, React Query
- Forms: React Hook Form, Zod
- i18n: i18next
- Tests: Vitest, Playwright

---

## Types de Changements

- **Added** pour les nouvelles fonctionnalites
- **Changed** pour les changements de fonctionnalites existantes
- **Deprecated** pour les fonctionnalites qui seront supprimees
- **Removed** pour les fonctionnalites supprimees
- **Fixed** pour les corrections de bugs
- **Security** pour les corrections de vulnerabilites
