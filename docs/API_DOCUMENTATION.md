# Documentation de l'API ADVIST

## Table des matières

1. [Introduction](#introduction)
2. [Authentification](#authentification)
3. [Format des réponses](#format-des-réponses)
4. [Endpoints](#endpoints)
   - [Authentication](#authentication)
   - [Users](#users)
   - [Organizations](#organizations)
   - [Documents](#documents)
   - [Workflows](#workflows)
   - [Signatures](#signatures)
   - [Notifications](#notifications)
   - [Audit](#audit)
   - [Billing](#billing)
5. [Codes d'erreur](#codes-derreur)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)

---

## Introduction

L'API ADVIST est une API RESTful qui permet d'interagir avec la plateforme de gestion documentaire. Elle utilise le format JSON pour les requêtes et réponses.

### Base URL

```
Production: https://api.advist.io/api/
Développement: http://localhost:8000/api/
```

### Versioning

L'API utilise le versioning via URL. La version actuelle est `v1`.

```
https://api.advist.io/api/v1/
```

### Headers requis

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
```

---

## Authentification

L'API utilise l'authentification JWT (JSON Web Tokens).

### Obtenir un token

```http
POST /api/auth/login/
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "votre_mot_de_passe"
}
```

**Réponse (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "Jean",
    "last_name": "Dupont",
    "organization": {
      "id": "org-uuid",
      "name": "Ma Société"
    },
    "roles": ["user", "manager"]
  }
}
```

### Rafraîchir le token

```http
POST /api/auth/refresh/
```

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse (200 OK):**
```json
{
  "access": "nouveau_access_token..."
}
```

### Durée de validité des tokens

| Token | Durée |
|-------|-------|
| Access Token | 15 minutes |
| Refresh Token | 7 jours |

### Déconnexion

```http
POST /api/auth/logout/
```

**Body:**
```json
{
  "refresh": "refresh_token_à_invalider"
}
```

---

## Format des réponses

### Réponse réussie

```json
{
  "status": "success",
  "data": {
    // Données de la réponse
  }
}
```

### Réponse paginée

```json
{
  "count": 150,
  "next": "https://api.advist.io/api/documents/?page=2",
  "previous": null,
  "results": [
    // Liste des éléments
  ]
}
```

### Réponse d'erreur

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Les données fournies sont invalides",
  "details": {
    "email": ["Ce champ est requis."]
  }
}
```

---

## Endpoints

### Authentication

#### Inscription

```http
POST /api/auth/register/
```

**Body:**
```json
{
  "email": "nouveau@example.com",
  "password": "MotDePasse123!",
  "password_confirm": "MotDePasse123!",
  "first_name": "Jean",
  "last_name": "Dupont",
  "organization_name": "Ma Nouvelle Société"
}
```

**Réponse (201 Created):**
```json
{
  "message": "Inscription réussie. Veuillez vérifier votre email.",
  "user": {
    "id": "uuid",
    "email": "nouveau@example.com"
  }
}
```

#### Réinitialisation du mot de passe

```http
POST /api/auth/password/reset/
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### Changement de mot de passe

```http
POST /api/auth/password/change/
```

**Body:**
```json
{
  "old_password": "ancien_mot_de_passe",
  "new_password": "nouveau_mot_de_passe",
  "new_password_confirm": "nouveau_mot_de_passe"
}
```

#### Profil utilisateur connecté

```http
GET /api/auth/me/
```

**Réponse (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "Jean",
  "last_name": "Dupont",
  "avatar": "https://storage.advist.io/avatars/user.jpg",
  "organization": {
    "id": "org-uuid",
    "name": "Ma Société",
    "logo": "https://storage.advist.io/logos/org.png"
  },
  "department": {
    "id": "dept-uuid",
    "name": "Direction Générale"
  },
  "job_title": "Directeur",
  "language": "fr",
  "timezone": "Africa/Dakar",
  "two_factor_enabled": true,
  "permissions": [
    "documents.create",
    "documents.read",
    "documents.update",
    "workflows.approve"
  ]
}
```

---

### Users

#### Liste des utilisateurs

```http
GET /api/users/
```

**Paramètres de requête:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| page | integer | Numéro de page (défaut: 1) |
| page_size | integer | Éléments par page (défaut: 20, max: 100) |
| search | string | Recherche par nom ou email |
| department | uuid | Filtrer par département |
| is_active | boolean | Filtrer par statut actif |
| ordering | string | Tri: `created_at`, `-created_at`, `last_name` |

**Réponse (200 OK):**
```json
{
  "count": 45,
  "next": "https://api.advist.io/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "avatar": "url",
      "department": {
        "id": "uuid",
        "name": "Finance"
      },
      "job_title": "Comptable",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Créer un utilisateur

```http
POST /api/users/
```

**Body:**
```json
{
  "email": "nouveau@example.com",
  "first_name": "Marie",
  "last_name": "Martin",
  "department_id": "dept-uuid",
  "job_title": "Analyste",
  "roles": ["user"],
  "send_invitation": true
}
```

#### Détail d'un utilisateur

```http
GET /api/users/{id}/
```

#### Modifier un utilisateur

```http
PATCH /api/users/{id}/
```

**Body:**
```json
{
  "job_title": "Analyste Senior",
  "department_id": "nouveau-dept-uuid"
}
```

#### Supprimer un utilisateur

```http
DELETE /api/users/{id}/
```

---

### Organizations

#### Liste des organisations

```http
GET /api/organizations/
```

#### Détail de l'organisation

```http
GET /api/organizations/{id}/
```

**Réponse (200 OK):**
```json
{
  "id": "uuid",
  "name": "Ma Société",
  "slug": "ma-societe",
  "logo": "https://storage.advist.io/logos/org.png",
  "email": "contact@masociete.com",
  "phone": "+221 33 123 4567",
  "address": "123 Rue Example, Dakar",
  "website": "https://masociete.com",
  "settings": {
    "document_numbering": "auto",
    "retention_days": 365,
    "require_2fa": false,
    "allowed_file_types": ["pdf", "docx", "xlsx"]
  },
  "subscription": {
    "plan": "Professional",
    "status": "active",
    "current_period_end": "2024-12-31"
  },
  "stats": {
    "total_users": 45,
    "total_documents": 1250,
    "storage_used_gb": 12.5
  }
}
```

#### Départements

```http
GET /api/departments/
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| parent | uuid | Filtrer par département parent |
| include_children | boolean | Inclure les sous-départements |

**Réponse (200 OK):**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Direction Générale",
      "code": "DG",
      "parent": null,
      "manager": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      },
      "children": [
        {
          "id": "uuid",
          "name": "Secrétariat",
          "code": "DG-SEC"
        }
      ],
      "user_count": 5
    }
  ]
}
```

---

### Documents

#### Liste des documents

```http
GET /api/documents/
```

**Paramètres de requête:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| page | integer | Numéro de page |
| page_size | integer | Éléments par page |
| search | string | Recherche dans titre et description |
| status | string | Filtrer par statut: `draft`, `pending`, `in_review`, `approved`, `rejected`, `signed`, `archived` |
| document_type | uuid | Filtrer par type de document |
| department | uuid | Filtrer par département |
| owner | uuid | Filtrer par propriétaire |
| created_after | date | Documents créés après cette date |
| created_before | date | Documents créés avant cette date |
| tags | string | Tags séparés par virgule |
| ordering | string | Tri: `created_at`, `-created_at`, `title`, `status` |

**Réponse (200 OK):**
```json
{
  "count": 150,
  "results": [
    {
      "id": "doc-uuid",
      "title": "Contrat de prestation",
      "reference": "DOC-2024-0001",
      "description": "Contrat de prestation de services",
      "status": "pending",
      "validation_status": "submitted",
      "document_type": {
        "id": "type-uuid",
        "name": "Contrat",
        "icon": "file-text"
      },
      "current_version": 2,
      "owner": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      },
      "department": {
        "id": "dept-uuid",
        "name": "Juridique"
      },
      "tags": ["contrat", "urgent"],
      "is_locked": false,
      "active_workflow": {
        "id": "wf-uuid",
        "status": "in_progress",
        "current_step": "Validation Manager"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T14:20:00Z"
    }
  ]
}
```

#### Créer un document

```http
POST /api/documents/
Content-Type: multipart/form-data
```

**Body (form-data):**
| Champ | Type | Description |
|-------|------|-------------|
| file | file | Fichier du document (requis) |
| title | string | Titre du document (requis) |
| document_type_id | uuid | ID du type de document (requis) |
| description | string | Description (optionnel) |
| department_id | uuid | ID du département (optionnel) |
| tags | string | Tags séparés par virgule |
| metadata | json | Métadonnées personnalisées |

**Réponse (201 Created):**
```json
{
  "id": "doc-uuid",
  "title": "Nouveau document",
  "reference": "DOC-2024-0002",
  "status": "draft",
  "current_version": 1,
  "versions": [
    {
      "version_number": 1,
      "file_name": "document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "created_at": "2024-01-15T10:30:00Z",
      "created_by": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      }
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Détail d'un document

```http
GET /api/documents/{id}/
```

**Réponse (200 OK):**
```json
{
  "id": "doc-uuid",
  "title": "Contrat de prestation",
  "reference": "DOC-2024-0001",
  "description": "Contrat de prestation de services IT",
  "status": "in_review",
  "validation_status": "under_review",
  "document_type": {
    "id": "type-uuid",
    "name": "Contrat",
    "required_fields": ["client_name", "amount", "duration"]
  },
  "current_version": 3,
  "versions": [
    {
      "version_number": 3,
      "file_name": "contrat_v3.pdf",
      "file_size": 2048000,
      "mime_type": "application/pdf",
      "pdf_page_count": 12,
      "change_summary": "Modification des clauses de paiement",
      "created_at": "2024-01-16T14:20:00Z",
      "created_by": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      }
    }
  ],
  "owner": {
    "id": "user-uuid",
    "full_name": "Jean Dupont",
    "email": "jean.dupont@example.com"
  },
  "department": {
    "id": "dept-uuid",
    "name": "Juridique"
  },
  "metadata": {
    "client_name": "ACME Corp",
    "amount": 50000,
    "currency": "XOF",
    "duration": "12 months"
  },
  "tags": ["contrat", "client", "2024"],
  "is_locked": true,
  "locked_by": {
    "id": "user-uuid",
    "full_name": "Marie Martin"
  },
  "active_workflow": {
    "id": "wf-uuid",
    "template_name": "Validation Contrat",
    "status": "in_progress",
    "current_step_order": 2,
    "steps": [
      {
        "order": 1,
        "name": "Revue juridique",
        "status": "completed",
        "completed_at": "2024-01-15T16:00:00Z"
      },
      {
        "order": 2,
        "name": "Validation Manager",
        "status": "active",
        "assignees": [
          {
            "user": "Pierre Durand",
            "status": "pending"
          }
        ]
      }
    ]
  },
  "signatures": [],
  "checksum": "sha256:abc123...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T14:20:00Z"
}
```

#### Uploader une nouvelle version

```http
POST /api/documents/{id}/upload_version/
Content-Type: multipart/form-data
```

**Body:**
| Champ | Type | Description |
|-------|------|-------------|
| file | file | Nouveau fichier (requis) |
| change_summary | string | Résumé des modifications |

#### Télécharger un document

```http
GET /api/documents/{id}/download/
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| version | integer | Version spécifique (défaut: dernière) |
| format | string | Format: `original`, `pdf` |

#### Verrouiller/Déverrouiller

```http
POST /api/documents/{id}/lock/
POST /api/documents/{id}/unlock/
```

#### Démarrer un workflow

```http
POST /api/documents/{id}/start_workflow/
```

**Body:**
```json
{
  "template_id": "template-uuid",
  "comment": "Merci de valider ce contrat urgent"
}
```

#### Actions de validation

```http
# Soumettre pour revue
POST /api/documents/{id}/submit_for_review/

# Démarrer la revue
POST /api/documents/{id}/start_review/

# Demander des modifications
POST /api/documents/{id}/request_changes/
Body: { "comment": "Merci de corriger la section 3" }

# Valider
POST /api/documents/{id}/validate/
Body: { "comment": "Validé sans réserve" }

# Rejeter
POST /api/documents/{id}/reject/
Body: { "reason": "Non conforme aux procédures" }
```

#### Annotations

```http
# Lister les annotations
GET /api/documents/{id}/annotations/

# Créer une annotation
POST /api/documents/{id}/annotations/
```

**Body (création):**
```json
{
  "annotation_type": "comment",
  "page_number": 3,
  "position": {
    "x": 150,
    "y": 200,
    "width": 100,
    "height": 50
  },
  "content": "Cette clause doit être reformulée",
  "context_type": "paragraph",
  "quoted_text": "Le client s'engage à...",
  "is_private": false
}
```

```http
# Modifier une annotation
PATCH /api/documents/{id}/annotations/{annotation_id}/

# Résoudre une annotation
POST /api/documents/{id}/annotations/{annotation_id}/resolve/
Body: { "resolution_note": "Corrigé dans la version 4" }
```

#### Comparaison de versions

```http
GET /api/documents/{id}/compare_versions/?v1=2&v2=3
```

**Réponse:**
```json
{
  "version_1": {
    "version_number": 2,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "version_2": {
    "version_number": 3,
    "created_at": "2024-01-16T14:20:00Z"
  },
  "changes": {
    "added_pages": [13],
    "removed_pages": [],
    "modified_pages": [3, 7, 8],
    "text_diff": [
      {
        "page": 3,
        "type": "modification",
        "old_text": "Le paiement sera effectué en 30 jours",
        "new_text": "Le paiement sera effectué en 45 jours"
      }
    ]
  }
}
```

---

### Workflows

#### Templates de workflow

```http
GET /api/workflow-templates/
```

**Réponse:**
```json
{
  "results": [
    {
      "id": "template-uuid",
      "name": "Validation Standard",
      "description": "Workflow de validation en 3 étapes",
      "document_types": [
        {"id": "type-uuid", "name": "Contrat"}
      ],
      "steps_config": [
        {
          "id": "step-1",
          "name": "Revue initiale",
          "type": "review",
          "order": 1,
          "assignee_type": "role",
          "assignee_role": "reviewer",
          "deadline_days": 2,
          "reminder_days": 1
        },
        {
          "id": "step-2",
          "name": "Approbation Manager",
          "type": "approval",
          "order": 2,
          "assignee_type": "department_head",
          "approval_rule": "any",
          "deadline_days": 3
        },
        {
          "id": "step-3",
          "name": "Signature Direction",
          "type": "signature",
          "order": 3,
          "assignee_type": "user",
          "assignee_user_id": "user-uuid",
          "deadline_days": 5
        }
      ],
      "is_active": true
    }
  ]
}
```

#### Créer un template

```http
POST /api/workflow-templates/
```

**Body:**
```json
{
  "name": "Nouveau Workflow",
  "description": "Description du workflow",
  "document_types": ["type-uuid-1", "type-uuid-2"],
  "steps_config": [
    {
      "name": "Étape 1",
      "type": "approval",
      "order": 1,
      "assignee_type": "user",
      "assignee_user_id": "user-uuid",
      "deadline_days": 3,
      "reminder_days": 1,
      "escalation": {
        "enabled": true,
        "after_days": 5,
        "escalate_to": "department_head"
      }
    }
  ]
}
```

#### Instances de workflow

```http
GET /api/workflow-instances/
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| status | string | `pending`, `in_progress`, `completed`, `cancelled`, `rejected` |
| document | uuid | Filtrer par document |
| initiated_by | uuid | Filtrer par initiateur |

#### Détail d'une instance

```http
GET /api/workflow-instances/{id}/
```

**Réponse:**
```json
{
  "id": "instance-uuid",
  "template": {
    "id": "template-uuid",
    "name": "Validation Standard"
  },
  "document": {
    "id": "doc-uuid",
    "title": "Contrat XYZ",
    "reference": "DOC-2024-0001"
  },
  "status": "in_progress",
  "current_step_order": 2,
  "initiated_by": {
    "id": "user-uuid",
    "full_name": "Jean Dupont"
  },
  "started_at": "2024-01-15T10:30:00Z",
  "steps": [
    {
      "id": "step-uuid",
      "name": "Revue initiale",
      "type": "review",
      "order": 1,
      "status": "completed",
      "result": "approved",
      "started_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T16:00:00Z",
      "assignees": [
        {
          "user": {
            "id": "user-uuid",
            "full_name": "Marie Martin"
          },
          "status": "completed",
          "action": "approved",
          "comment": "RAS",
          "action_at": "2024-01-15T16:00:00Z"
        }
      ]
    },
    {
      "id": "step-uuid-2",
      "name": "Approbation Manager",
      "type": "approval",
      "order": 2,
      "status": "active",
      "deadline": "2024-01-18T10:30:00Z",
      "assignees": [
        {
          "user": {
            "id": "user-uuid",
            "full_name": "Pierre Durand"
          },
          "status": "pending"
        }
      ]
    }
  ]
}
```

#### Actions sur les workflows

```http
# Annuler un workflow
POST /api/workflow-instances/{id}/cancel/
Body: { "reason": "Document obsolète" }

# Historique des actions
GET /api/workflow-instances/{id}/history/

# Ajouter un validateur
POST /api/workflow-instances/{id}/add-validator/
Body: {
  "step_id": "step-uuid",
  "user_id": "user-uuid",
  "reason": "Expertise requise"
}

# Retirer un validateur
DELETE /api/workflow-instances/{id}/remove-validator/{step_id}/

# Réordonner les étapes
POST /api/workflow-instances/{id}/reorder-steps/
Body: {
  "steps_order": ["step-uuid-2", "step-uuid-1", "step-uuid-3"]
}

# Passer une étape
POST /api/workflow-instances/{id}/skip-step/
Body: {
  "step_id": "step-uuid",
  "reason": "Validateur absent"
}
```

#### Mes tâches en attente

```http
GET /api/my-tasks/
```

**Réponse:**
```json
{
  "count": 5,
  "results": [
    {
      "id": "task-uuid",
      "workflow_instance": {
        "id": "wf-uuid",
        "document": {
          "id": "doc-uuid",
          "title": "Contrat ABC",
          "reference": "DOC-2024-0001"
        }
      },
      "step": {
        "id": "step-uuid",
        "name": "Approbation Manager",
        "type": "approval"
      },
      "status": "pending",
      "deadline": "2024-01-18T10:30:00Z",
      "is_overdue": false,
      "initiated_by": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      },
      "created_at": "2024-01-15T16:00:00Z"
    }
  ]
}
```

#### Actions sur mes tâches

```http
# Approuver
POST /api/my-tasks/{id}/approve/
Body: { "comment": "Validé" }

# Rejeter
POST /api/my-tasks/{id}/reject/
Body: { "reason": "Non conforme" }

# Demander des modifications
POST /api/my-tasks/{id}/request_changes/
Body: { "comment": "Modifier la section 2" }

# Déléguer
POST /api/my-tasks/{id}/delegate/
Body: {
  "delegate_to": "user-uuid",
  "reason": "Expertise requise",
  "keep_visibility": true
}
```

---

### Signatures

#### Mes signatures personnelles

```http
GET /api/user-signatures/
```

**Réponse:**
```json
{
  "results": [
    {
      "id": "sig-uuid",
      "name": "Signature principale",
      "signature_type": "formal",
      "is_active": true,
      "created_at": "2024-01-01T10:00:00Z",
      "expires_at": "2025-01-01T10:00:00Z"
    },
    {
      "id": "sig-uuid-2",
      "name": "Initiales",
      "signature_type": "initials",
      "is_active": true
    }
  ]
}
```

#### Créer une signature

```http
POST /api/user-signatures/
Content-Type: multipart/form-data
```

**Body:**
| Champ | Type | Description |
|-------|------|-------------|
| name | string | Nom de la signature |
| signature_type | string | `formal`, `initials`, `paraph` |
| image | file | Image de la signature (PNG/JPEG) |
| pin | string | Code PIN de protection (4-6 chiffres) |

#### Signer un document

```http
POST /api/documents/{id}/sign/
```

**Body:**
```json
{
  "user_signature_id": "sig-uuid",
  "pin": "1234",
  "page_number": 12,
  "position": {
    "x": 400,
    "y": 650,
    "width": 150,
    "height": 50
  },
  "signature_level": "advanced",
  "geolocation": {
    "latitude": 14.6937,
    "longitude": -17.4441
  }
}
```

**Réponse (201 Created):**
```json
{
  "id": "docsig-uuid",
  "document": {
    "id": "doc-uuid",
    "title": "Contrat XYZ"
  },
  "signer": {
    "id": "user-uuid",
    "full_name": "Jean Dupont"
  },
  "signature_level": "advanced",
  "page_number": 12,
  "timestamp": "2024-01-16T15:30:00Z",
  "document_hash": "sha256:def456...",
  "certificate_id": "CERT-2024-001",
  "watermark_id": "WM-abc123"
}
```

---

### Notifications

#### Liste des notifications

```http
GET /api/notifications/
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| is_read | boolean | Filtrer par statut lu/non lu |
| type | string | Type de notification |

**Réponse:**
```json
{
  "count": 25,
  "unread_count": 8,
  "results": [
    {
      "id": "notif-uuid",
      "type": "workflow_task",
      "title": "Nouvelle tâche de validation",
      "message": "Vous avez une nouvelle tâche de validation pour le document 'Contrat ABC'",
      "data": {
        "document_id": "doc-uuid",
        "workflow_id": "wf-uuid"
      },
      "is_read": false,
      "created_at": "2024-01-16T14:00:00Z"
    }
  ]
}
```

#### Marquer comme lu

```http
PATCH /api/notifications/{id}/
Body: { "is_read": true }

# Marquer toutes comme lues
POST /api/notifications/mark-all-read/
```

---

### Audit

#### Journaux d'audit

```http
GET /api/audit-logs/
```

**Paramètres:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| user | uuid | Filtrer par utilisateur |
| action | string | `create`, `read`, `update`, `delete`, `download`, `approve`, `sign` |
| resource_type | string | `document`, `user`, `workflow`, `organization` |
| resource_id | integer | ID de la ressource |
| start_date | datetime | Date de début |
| end_date | datetime | Date de fin |

**Réponse:**
```json
{
  "count": 1500,
  "results": [
    {
      "id": "audit-uuid",
      "timestamp": "2024-01-16T15:30:00Z",
      "user": {
        "id": "user-uuid",
        "full_name": "Jean Dupont",
        "email": "jean.dupont@example.com"
      },
      "action": "sign",
      "resource_type": "document",
      "resource_id": 123,
      "resource_title": "Contrat ABC",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "old_values": null,
      "new_values": {
        "signature_id": "docsig-uuid"
      },
      "chain_hash": "sha256:abc123..."
    }
  ]
}
```

---

### Billing

> **Note:** Ces endpoints sont réservés aux administrateurs et super-administrateurs.

#### Plans d'abonnement

```http
GET /api/billing/plans/
```

**Réponse:**
```json
{
  "results": [
    {
      "id": "plan-uuid",
      "name": "Starter",
      "code": "starter",
      "price": 25000,
      "currency": "XOF",
      "billing_cycle": "monthly",
      "features": {
        "max_users": 5,
        "max_documents": 100,
        "max_storage_gb": 5,
        "max_workflows": 10,
        "signatures": true,
        "api_access": false,
        "custom_branding": false
      },
      "trial_days": 14,
      "is_active": true,
      "is_featured": false
    },
    {
      "id": "plan-uuid-2",
      "name": "Professional",
      "code": "professional",
      "price": 75000,
      "currency": "XOF",
      "billing_cycle": "monthly",
      "features": {
        "max_users": 25,
        "max_documents": 1000,
        "max_storage_gb": 50,
        "max_workflows": 100,
        "signatures": true,
        "api_access": true,
        "custom_branding": true
      },
      "is_featured": true
    }
  ]
}
```

#### Abonnement actuel

```http
GET /api/billing/subscriptions/current/
```

**Réponse:**
```json
{
  "id": "sub-uuid",
  "plan": {
    "id": "plan-uuid",
    "name": "Professional",
    "price": 75000
  },
  "status": "active",
  "started_at": "2024-01-01T00:00:00Z",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-01-31T23:59:59Z",
  "usage": {
    "users": {
      "current": 15,
      "limit": 25,
      "percentage": 60
    },
    "documents": {
      "current": 450,
      "limit": 1000,
      "percentage": 45
    },
    "storage_gb": {
      "current": 12.5,
      "limit": 50,
      "percentage": 25
    }
  }
}
```

#### Factures

```http
GET /api/billing/invoices/
```

#### Historique des paiements

```http
GET /api/billing/payments/
```

---

## Codes d'erreur

| Code HTTP | Code erreur | Description |
|-----------|-------------|-------------|
| 400 | VALIDATION_ERROR | Données invalides |
| 400 | INVALID_FILE_TYPE | Type de fichier non autorisé |
| 401 | AUTHENTICATION_REQUIRED | Token manquant ou invalide |
| 401 | TOKEN_EXPIRED | Token expiré |
| 403 | PERMISSION_DENIED | Permission insuffisante |
| 403 | DOCUMENT_LOCKED | Document verrouillé par un autre utilisateur |
| 403 | WORKFLOW_IN_PROGRESS | Workflow en cours, action impossible |
| 404 | NOT_FOUND | Ressource non trouvée |
| 409 | CONFLICT | Conflit (ex: version obsolète) |
| 422 | INVALID_SIGNATURE_PIN | Code PIN de signature invalide |
| 422 | SIGNATURE_LOCKED | Signature verrouillée après trop de tentatives |
| 429 | RATE_LIMIT_EXCEEDED | Trop de requêtes |
| 500 | INTERNAL_ERROR | Erreur serveur |

---

## Rate Limiting

L'API applique les limites suivantes :

| Endpoint | Limite |
|----------|--------|
| Authentification | 5 requêtes/minute |
| Upload de fichiers | 10 requêtes/minute |
| Autres endpoints | 100 requêtes/minute |

Headers de réponse :
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```

---

## Webhooks

ADVIST peut envoyer des webhooks pour notifier votre système des événements importants.

### Configuration

```http
POST /api/webhooks/
```

**Body:**
```json
{
  "url": "https://votre-serveur.com/webhook",
  "events": [
    "document.created",
    "document.signed",
    "workflow.completed",
    "workflow.rejected"
  ],
  "secret": "votre_secret_pour_verification"
}
```

### Événements disponibles

| Événement | Description |
|-----------|-------------|
| `document.created` | Nouveau document créé |
| `document.updated` | Document modifié |
| `document.deleted` | Document supprimé |
| `document.signed` | Document signé |
| `document.approved` | Document validé |
| `document.rejected` | Document rejeté |
| `workflow.started` | Workflow démarré |
| `workflow.step_completed` | Étape de workflow complétée |
| `workflow.completed` | Workflow terminé |
| `workflow.rejected` | Workflow rejeté |
| `user.created` | Nouvel utilisateur |
| `user.deactivated` | Utilisateur désactivé |

### Format du payload

```json
{
  "event": "document.signed",
  "timestamp": "2024-01-16T15:30:00Z",
  "data": {
    "document": {
      "id": "doc-uuid",
      "title": "Contrat ABC",
      "reference": "DOC-2024-0001"
    },
    "signature": {
      "id": "sig-uuid",
      "signer": {
        "id": "user-uuid",
        "full_name": "Jean Dupont"
      }
    }
  },
  "signature": "sha256_hmac_du_payload"
}
```

### Vérification de la signature

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## SDK et exemples

### Python

```python
import requests

class AdviSTAPI:
    def __init__(self, base_url, email, password):
        self.base_url = base_url
        self.session = requests.Session()
        self._authenticate(email, password)

    def _authenticate(self, email, password):
        response = self.session.post(
            f"{self.base_url}/auth/login/",
            json={"email": email, "password": password}
        )
        tokens = response.json()
        self.session.headers["Authorization"] = f"Bearer {tokens['access']}"

    def get_documents(self, **params):
        return self.session.get(
            f"{self.base_url}/documents/",
            params=params
        ).json()

    def create_document(self, file_path, title, document_type_id):
        with open(file_path, "rb") as f:
            return self.session.post(
                f"{self.base_url}/documents/",
                files={"file": f},
                data={
                    "title": title,
                    "document_type_id": document_type_id
                }
            ).json()

# Usage
api = AdviSTAPI("https://api.advist.io/api", "user@example.com", "password")
documents = api.get_documents(status="pending")
```

### JavaScript/TypeScript

```typescript
class AdviSTAPI {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const { access } = await response.json();
    this.accessToken = access;
  }

  async getDocuments(params?: Record<string, string>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/documents/?${query}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return response.json();
  }

  async signDocument(
    documentId: string,
    signatureId: string,
    pin: string,
    position: { x: number; y: number; page: number }
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}/sign/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        user_signature_id: signatureId,
        pin,
        page_number: position.page,
        position: { x: position.x, y: position.y, width: 150, height: 50 },
      }),
    });
    return response.json();
  }
}

// Usage
const api = new AdviSTAPI("https://api.advist.io/api");
await api.authenticate("user@example.com", "password");
const docs = await api.getDocuments({ status: "pending" });
```

---

## Support

Pour toute question concernant l'API :

- **Documentation OpenAPI** : `https://api.advist.io/api/docs/`
- **Email** : api-support@advist.io
- **Status** : `https://status.advist.io`
