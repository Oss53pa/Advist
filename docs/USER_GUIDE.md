# Guide Utilisateur ADVIST

## Table des matières

1. [Introduction](#introduction)
2. [Prise en main](#prise-en-main)
3. [Gestion des documents](#gestion-des-documents)
4. [Workflows de validation](#workflows-de-validation)
5. [Signature électronique](#signature-électronique)
6. [Collaboration](#collaboration)
7. [Tableau de bord et analytics](#tableau-de-bord-et-analytics)
8. [Administration](#administration)
9. [Application mobile](#application-mobile)
10. [FAQ et dépannage](#faq-et-dépannage)

---

## Introduction

### Qu'est-ce qu'ADVIST ?

ADVIST est une plateforme de gestion documentaire d'entreprise qui vous permet de :

- **Centraliser** tous vos documents professionnels
- **Automatiser** les circuits de validation
- **Signer électroniquement** vos documents en conformité avec les réglementations
- **Collaborer** en temps réel avec vos équipes
- **Tracer** toutes les actions pour une conformité totale

### Profils utilisateurs

| Profil | Rôle |
|--------|------|
| **Utilisateur** | Accès aux documents, création, validation, signature |
| **Manager** | Gestion d'équipe, approbation des workflows |
| **Administrateur** | Gestion des utilisateurs et paramètres de l'organisation |
| **Super Administrateur** | Administration globale de la plateforme (multi-tenant) |

---

## Prise en main

### 1. Connexion

1. Accédez à l'application via votre navigateur : `https://app.advist.io`
2. Entrez votre **email** et **mot de passe**
3. Si la double authentification (2FA) est activée, entrez le code de votre application d'authentification
4. Cliquez sur **Se connecter**

### 2. Première connexion

Lors de votre première connexion :

1. **Changez votre mot de passe** temporaire
2. **Complétez votre profil** (photo, préférences de langue)
3. **Créez vos signatures** personnelles (voir section [Signature électronique](#signature-électronique))

### 3. Navigation

L'interface se compose de :

```
┌─────────────────────────────────────────────────────────────────┐
│  Logo    Recherche                    Notifications  Profil    │
├─────────────────────────────────────────────────────────────────┤
│         │                                                       │
│  Menu   │              Zone de contenu principale              │
│  latéral│                                                       │
│         │                                                       │
│ • Accueil│                                                      │
│ • Documents                                                     │
│ • Workflows                                                     │
│ • Signatures                                                    │
│ • Projets                                                       │
│ • Calendrier                                                    │
│ • Paramètres                                                    │
│         │                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Tableau de bord

Votre tableau de bord affiche :

- **Statistiques** : documents créés, validés, signés ce mois
- **Tâches en attente** : documents à valider ou signer
- **Activité récente** : dernières actions sur vos documents
- **Documents récents** : accès rapide aux fichiers consultés
- **Alertes** : délais dépassés, actions requises

---

## Gestion des documents

### Créer un document

1. Cliquez sur **+ Nouveau document** dans la barre d'outils
2. Sélectionnez le **type de document** (Contrat, Facture, Note, etc.)
3. Remplissez les informations :
   - **Titre** (obligatoire)
   - **Description**
   - **Département** (optionnel)
   - **Tags** pour faciliter la recherche
4. **Uploadez le fichier** (glisser-déposer ou clic)
   - Formats acceptés : PDF, Word, Excel, images
   - Taille maximale : selon votre abonnement
5. Cliquez sur **Créer**

### Organiser vos documents

#### Par dossiers

1. Accédez à **Documents > Dossiers**
2. Cliquez sur **+ Nouveau dossier**
3. Nommez le dossier et définissez les permissions
4. Glissez-déposez des documents dans les dossiers

#### Par projets

Les projets regroupent des documents liés à une même initiative :

1. Accédez à **Projets > + Nouveau projet**
2. Définissez :
   - Nom du projet
   - Description
   - Membres de l'équipe
   - Échéance (optionnel)
3. Ajoutez des documents au projet

#### Par tags

Utilisez les tags pour une classification transversale :

- Cliquez sur un document > **Ajouter un tag**
- Tapez le tag ou sélectionnez un existant
- Filtrez par tag dans la liste des documents

### Rechercher des documents

#### Recherche simple

Utilisez la barre de recherche en haut de l'écran :
- Recherche par **titre**
- Recherche par **contenu** (texte du document)
- Recherche par **référence**

#### Recherche avancée

Cliquez sur l'icône de filtre pour affiner :

| Filtre | Options |
|--------|---------|
| **Statut** | Brouillon, En attente, Validé, Signé, Archivé |
| **Type** | Contrat, Facture, Note, Rapport, etc. |
| **Période** | Date de création, modification |
| **Propriétaire** | Créateur du document |
| **Département** | Service concerné |
| **Tags** | Étiquettes associées |

### Consulter un document

En cliquant sur un document, vous accédez à sa vue détaillée :

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Retour    Titre du document                    Actions ▼     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │                    Aperçu du document                       ││
│  │                       (PDF viewer)                          ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Informations        Versions       Workflow       Commentaires │
│  ─────────────────────────────────────────────────────────────  │
│  Type: Contrat       v3 (actuelle)  En cours      5 commentaires│
│  Créé: 15/01/2024    v2             Étape 2/3                   │
│  Par: Jean Dupont    v1                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Versionner un document

Chaque modification crée une nouvelle version :

1. Ouvrez le document
2. Cliquez sur **Actions > Nouvelle version**
3. Uploadez le fichier mis à jour
4. Ajoutez un **résumé des modifications**
5. Validez

#### Comparer les versions

1. Onglet **Versions**
2. Sélectionnez deux versions à comparer
3. Cliquez sur **Comparer**
4. Les différences sont surlignées :
   - Vert : ajouts
   - Rouge : suppressions
   - Jaune : modifications

### Partager un document

#### Partage interne

1. Cliquez sur **Actions > Partager**
2. Recherchez un utilisateur ou groupe
3. Définissez les droits :
   - **Lecture** : consultation uniquement
   - **Commentaire** : lecture + annotations
   - **Modification** : lecture + commentaire + édition
4. Cliquez sur **Partager**

#### Partage externe (lien sécurisé)

1. Cliquez sur **Actions > Lien de partage**
2. Configurez :
   - **Expiration** : durée de validité du lien
   - **Mot de passe** : protection optionnelle
   - **Permissions** : lecture, téléchargement
3. Copiez le lien généré

---

## Workflows de validation

### Comprendre les workflows

Un workflow est un circuit de validation automatisé. Il définit :

- Les **étapes** de validation (revue, approbation, signature)
- Les **validateurs** à chaque étape
- Les **délais** et rappels automatiques
- Les **conditions** de passage à l'étape suivante

### Démarrer un workflow

1. Ouvrez votre document
2. Cliquez sur **Démarrer un workflow**
3. Sélectionnez un **modèle de workflow** :
   - Validation simple (1 approbateur)
   - Validation hiérarchique (N+1, N+2)
   - Circuit de signature
   - Workflow personnalisé
4. Vérifiez ou modifiez les validateurs
5. Ajoutez un **commentaire** (optionnel)
6. Cliquez sur **Démarrer**

### Suivre l'avancement

Le statut du workflow est visible dans l'onglet **Workflow** du document :

```
Étape 1: Revue juridique        ✓ Complété
         Marie Martin           Approuvé le 15/01/2024

Étape 2: Approbation Manager    ● En cours
         Pierre Durand          En attente (délai: 18/01)

Étape 3: Signature Direction    ○ À venir
         Jean Dupont
```

Légende :
- ✓ Étape complétée
- ● Étape en cours
- ○ Étape à venir
- ✗ Étape rejetée

### Valider une tâche

Quand vous avez une tâche de validation :

1. Accédez à **Mes tâches** ou cliquez sur la notification
2. Consultez le document
3. Choisissez votre action :

| Action | Description |
|--------|-------------|
| **Approuver** | Valide l'étape et passe à la suivante |
| **Rejeter** | Arrête le workflow (motif obligatoire) |
| **Demander des modifications** | Renvoie au créateur pour correction |
| **Déléguer** | Transfère la tâche à un collègue |

4. Ajoutez un commentaire si nécessaire
5. Confirmez votre décision

### Modifier un workflow en cours

Si vous avez les droits, vous pouvez :

#### Ajouter un validateur

1. Onglet **Workflow > Modifier**
2. Cliquez sur **+ Ajouter un validateur**
3. Sélectionnez l'étape
4. Choisissez le nouveau validateur
5. Indiquez la raison

#### Retirer un validateur

1. Cliquez sur le validateur à retirer
2. Sélectionnez **Retirer**
3. Confirmez (si l'étape est en cours, elle sera réassignée)

#### Réordonner les étapes

1. Glissez-déposez les étapes pour changer l'ordre
2. Seules les étapes non démarrées peuvent être déplacées

### Notifications et rappels

Vous recevez des notifications pour :

- Nouvelle tâche de validation
- Rappel avant échéance (1 jour avant par défaut)
- Tâche en retard
- Document validé/rejeté
- Modifications demandées

Configurez vos préférences dans **Paramètres > Notifications**.

---

## Signature électronique

### Créer vos signatures

Avant de signer, créez vos signatures personnelles :

1. Accédez à **Signatures > Mes signatures**
2. Cliquez sur **+ Nouvelle signature**
3. Choisissez le type :
   - **Signature formelle** : signature complète
   - **Initiales** : pour parapher chaque page
   - **Paraphe** : pour les modifications
4. Dessinez votre signature sur le pad tactile ou uploadez une image
5. Définissez un **code PIN** de sécurité (4-6 chiffres)
6. Cliquez sur **Enregistrer**

### Signer un document

1. Ouvrez le document à signer
2. Cliquez sur **Signer** (ou répondez à votre tâche de signature)
3. **Naviguez** dans le document avec les pages miniatures
4. **Positionnez** votre signature :
   - Cliquez sur l'emplacement souhaité
   - Redimensionnez si nécessaire
   - Répétez pour chaque signature requise
5. Sélectionnez la signature à utiliser
6. Entrez votre **code PIN**
7. Cliquez sur **Confirmer la signature**

### Vérifier une signature

Pour vérifier l'authenticité d'une signature :

1. Ouvrez le document signé
2. Cliquez sur une signature
3. Consultez les informations :
   - Signataire
   - Date et heure exactes
   - Adresse IP et localisation
   - Hash du document
   - Certificat de signature

### Certificat de signature

Après signature, un certificat est généré automatiquement :

```
┌─────────────────────────────────────────────────────────────────┐
│                    CERTIFICAT DE SIGNATURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Document: Contrat de prestation XYZ                            │
│  Référence: DOC-2024-0001                                       │
│  Hash SHA-256: abc123def456...                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  SIGNATURES                                                      │
│                                                                  │
│  1. Jean DUPONT                                                  │
│     Signé le: 16/01/2024 à 15:30:45 UTC                         │
│     IP: 192.168.1.100                                           │
│     Localisation: Dakar, Sénégal                                │
│     Type: Signature avancée                                      │
│     Watermark: WM-abc123                                        │
│                                                                  │
│  2. Marie MARTIN                                                 │
│     Signé le: 16/01/2024 à 16:45:12 UTC                         │
│     ...                                                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Ce document a été signé électroniquement via ADVIST.           │
│  Vérifiez l'authenticité sur: https://verify.advist.io/abc123   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Niveaux de signature

ADVIST supporte trois niveaux de signature (conformes eIDAS) :

| Niveau | Description | Usage |
|--------|-------------|-------|
| **Simple** | Signature basique avec authentification | Documents internes |
| **Avancée** | Signature avec identification forte du signataire | Contrats commerciaux |
| **Qualifiée** | Signature avec certificat qualifié (QTSP) | Documents légaux, actes officiels |

---

## Collaboration

### Annotations

Ajoutez des commentaires directement sur le document :

1. Ouvrez le document
2. Cliquez sur l'icône **Annotation**
3. Sélectionnez le type :
   - **Surlignage** : met en évidence du texte
   - **Commentaire** : ajoute une note à un endroit précis
   - **Soulignement** / **Barrage**
   - **Dessin** : forme libre
   - **Tampon** : tampon prédéfini
4. Sélectionnez la zone sur le document
5. Ajoutez votre commentaire
6. Cliquez sur **Publier**

### Annotations contextuelles

Pour des commentaires plus précis, utilisez les annotations contextuelles :

1. Sélectionnez du texte ou un élément
2. Choisissez le contexte :
   - **Paragraphe** : annotation liée à un paragraphe
   - **Tableau** : référence une ligne/colonne spécifique
   - **Graphique** : lié à un graphique ou figure
   - **En-tête/Pied de page**
3. Le texte sélectionné est automatiquement cité

### Résoudre une annotation

Quand une annotation est traitée :

1. Cliquez sur l'annotation
2. Sélectionnez **Résoudre**
3. Ajoutez une note de résolution (optionnel)
4. L'annotation est marquée comme résolue mais reste visible

### Commentaires

Les commentaires généraux (non liés à un emplacement) se trouvent dans l'onglet **Commentaires** :

1. Tapez votre message
2. Mentionnez un utilisateur avec **@nom**
3. Ajoutez des pièces jointes si nécessaire
4. Cliquez sur **Envoyer**

Les réponses créent des fils de discussion imbriqués.

### Chat document

Pour les discussions en temps réel :

1. Cliquez sur l'icône **Chat** en bas à droite
2. Un panneau s'ouvre avec la conversation en direct
3. Tous les utilisateurs ayant le document ouvert peuvent participer
4. Les messages sont sauvegardés avec l'historique du document

---

## Tableau de bord et analytics

### Widgets disponibles

Personnalisez votre tableau de bord avec ces widgets :

| Widget | Description |
|--------|-------------|
| **Statistiques** | Documents créés, validés, signés |
| **Tâches en attente** | Liste des validations/signatures à faire |
| **Activité récente** | Flux des dernières actions |
| **Documents récents** | Accès rapide aux fichiers consultés |
| **Calendrier** | Échéances des workflows |
| **Graphiques** | Évolution mensuelle, répartition par type |
| **Alertes** | Retards, actions urgentes |
| **Benchmark** | Comparaison avec votre secteur |

### Personnaliser le tableau de bord

1. Cliquez sur **Personnaliser** en haut à droite
2. Glissez-déposez les widgets pour les réorganiser
3. Cliquez sur **+** pour ajouter un widget
4. Cliquez sur **x** sur un widget pour le retirer
5. Redimensionnez en tirant les coins
6. Sauvegardez votre configuration

### Rapports et analytics

Accédez aux analytics détaillées via **Analytics** dans le menu :

#### Métriques clés

- **Volume documentaire** : nombre de documents par période
- **Temps de validation** : durée moyenne des workflows
- **Taux d'approbation** : pourcentage de documents validés vs rejetés
- **Activité utilisateur** : engagement par utilisateur

#### Exporter un rapport

1. Accédez à **Analytics > Rapports**
2. Sélectionnez la période
3. Choisissez les métriques à inclure
4. Cliquez sur **Exporter** (PDF ou Excel)

### Rapport exécutif

Pour les managers et dirigeants, un rapport consolidé est disponible :

1. Accédez à **Rapports exécutifs**
2. Sélectionnez la période (hebdomadaire, mensuel, trimestriel)
3. Le rapport inclut :
   - Résumé des KPI
   - Tendances et évolutions
   - Comparaison avec le secteur (benchmark)
   - Calcul du ROI
   - Recommandations

---

## Administration

> Cette section concerne les administrateurs d'organisation.

### Gestion des utilisateurs

#### Inviter un utilisateur

1. Accédez à **Administration > Utilisateurs**
2. Cliquez sur **+ Inviter**
3. Remplissez :
   - Email
   - Nom et prénom
   - Département
   - Rôle(s)
4. Cliquez sur **Envoyer l'invitation**

L'utilisateur recevra un email avec un lien d'activation.

#### Modifier un utilisateur

1. Cliquez sur l'utilisateur dans la liste
2. Modifiez les informations
3. Sauvegardez

#### Désactiver un utilisateur

1. Cliquez sur l'utilisateur
2. Sélectionnez **Désactiver**
3. Confirmez

L'utilisateur ne pourra plus se connecter mais ses documents sont conservés.

### Gestion des rôles

Les rôles définissent les permissions des utilisateurs :

1. Accédez à **Administration > Rôles**
2. Créez ou modifiez un rôle
3. Configurez les permissions :

| Catégorie | Permissions |
|-----------|-------------|
| **Documents** | Créer, Lire, Modifier, Supprimer, Télécharger |
| **Workflows** | Créer, Approuver, Rejeter, Modifier |
| **Signatures** | Créer, Signer |
| **Utilisateurs** | Voir, Créer, Modifier, Désactiver |
| **Organisation** | Voir paramètres, Modifier paramètres |
| **Audit** | Consulter les journaux |

### Paramètres de l'organisation

#### Informations générales

- Nom et logo de l'organisation
- Coordonnées
- Secteur d'activité

#### Paramètres documents

- **Numérotation automatique** : format des références (ex: DOC-{YEAR}-{SEQ})
- **Types de documents** : ajouter/modifier les types disponibles
- **Métadonnées** : champs personnalisés par type
- **Formats autorisés** : extensions de fichiers acceptées
- **Taille maximale** : limite de taille des fichiers

#### Paramètres workflows

- **Templates par défaut** : workflows disponibles
- **Délais standards** : durées par type d'étape
- **Escalade automatique** : actions après dépassement de délai
- **Notifications** : fréquence des rappels

#### Sécurité

- **Politique de mot de passe** : complexité, expiration
- **Double authentification** : obligatoire ou optionnelle
- **Sessions** : durée, connexions simultanées
- **IP autorisées** : restriction par adresse IP

### Journaux d'audit

Consultez l'historique complet des actions :

1. Accédez à **Administration > Audit**
2. Filtrez par :
   - Utilisateur
   - Type d'action
   - Ressource
   - Période
3. Exportez pour analyse externe

Chaque entrée affiche :
- Date et heure
- Utilisateur
- Action effectuée
- Ressource concernée
- Adresse IP
- Détails (avant/après pour les modifications)

### Archivage

#### Politique de rétention

Configurez la durée de conservation des documents :

1. Accédez à **Administration > Archives > Politiques**
2. Créez une politique :
   - Types de documents concernés
   - Durée de rétention (en jours)
   - Action à l'expiration (archiver, supprimer, notifier)

#### Consulter les archives

Les documents archivés restent accessibles :

1. Accédez à **Administration > Archives**
2. Recherchez par période ou type
3. Pour restaurer, cliquez sur **Restaurer**

---

## Application mobile

### Installation

L'application ADVIST est disponible sur :

- **iOS** : App Store
- **Android** : Google Play Store

Recherchez "ADVIST" et installez l'application.

### Connexion

1. Ouvrez l'application
2. Entrez l'**URL de votre organisation** (ex: masociete.advist.io)
3. Connectez-vous avec vos identifiants
4. Activez l'**authentification biométrique** (optionnel) pour un accès rapide

### Fonctionnalités mobiles

| Fonctionnalité | Description |
|----------------|-------------|
| **Consultation** | Visualisez tous vos documents |
| **Validation** | Approuvez ou rejetez les workflows |
| **Signature** | Signez avec votre doigt ou stylet |
| **Notifications push** | Alertes en temps réel |
| **Mode offline** | Accès aux documents téléchargés sans connexion |
| **Scan** | Numérisez des documents avec la caméra |

### Mode offline

L'application fonctionne même sans connexion :

1. Les documents consultés récemment sont mis en cache
2. Téléchargez explicitement des documents pour un accès offline
3. Les actions (validations, commentaires) sont mises en file d'attente
4. La synchronisation se fait automatiquement au retour de la connexion

### Signer sur mobile

1. Ouvrez le document à signer
2. Naviguez jusqu'à la zone de signature
3. Touchez pour positionner votre signature
4. Signez avec votre doigt sur l'écran tactile
5. Confirmez avec votre code PIN ou empreinte digitale

---

## FAQ et dépannage

### Questions fréquentes

#### Comment réinitialiser mon mot de passe ?

1. Sur la page de connexion, cliquez sur **Mot de passe oublié**
2. Entrez votre email
3. Suivez le lien reçu par email
4. Définissez un nouveau mot de passe

#### Comment configurer la double authentification (2FA) ?

1. Accédez à **Paramètres > Sécurité**
2. Activez la **Double authentification**
3. Scannez le QR code avec une application d'authentification (Google Authenticator, Authy)
4. Entrez le code généré pour confirmer

#### Pourquoi ne puis-je pas modifier un document ?

Plusieurs raisons possibles :
- Le document est **verrouillé** par un autre utilisateur
- Un **workflow est en cours**
- Vous n'avez pas les **permissions** nécessaires
- Le document est **archivé**

#### Comment annuler un workflow en cours ?

1. Ouvrez le document
2. Onglet **Workflow**
3. Cliquez sur **Annuler le workflow**
4. Indiquez la raison
5. Seul l'initiateur ou un administrateur peut annuler

#### Mes signatures ont disparu, que faire ?

Les signatures ont une date d'expiration pour des raisons de sécurité. Pour en créer de nouvelles :
1. Accédez à **Signatures > Mes signatures**
2. Créez de nouvelles signatures
3. Les anciennes signatures sur les documents restent valides

### Messages d'erreur courants

| Erreur | Solution |
|--------|----------|
| "Session expirée" | Reconnectez-vous |
| "Document verrouillé" | Attendez que l'autre utilisateur ait terminé ou contactez-le |
| "Quota dépassé" | Contactez votre administrateur pour augmenter le quota |
| "Format non supporté" | Convertissez le fichier dans un format accepté (PDF recommandé) |
| "PIN incorrect" | Attendez 5 minutes si bloqué, puis réessayez |

### Support

Si vous rencontrez un problème :

1. Consultez cette documentation
2. Contactez votre administrateur interne
3. Soumettez un ticket via **Support** dans l'application
4. Email : support@advist.io

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + N` | Nouveau document |
| `Ctrl + F` | Rechercher |
| `Ctrl + S` | Sauvegarder |
| `Ctrl + P` | Imprimer |
| `Esc` | Fermer le panneau actuel |
| `?` | Afficher l'aide |

---

## Annexe : Glossaire

| Terme | Définition |
|-------|------------|
| **Document** | Fichier uploadé dans la plateforme avec ses métadonnées |
| **Workflow** | Circuit de validation automatisé |
| **Version** | Révision d'un document, numérotée séquentiellement |
| **Annotation** | Commentaire ou marque placé directement sur le document |
| **Signature électronique** | Mécanisme d'authentification et d'approbation d'un document |
| **2FA** | Double authentification, sécurité renforcée |
| **Tenant** | Organisation cliente dans le système |
| **RGPD** | Règlement Général sur la Protection des Données |
| **eIDAS** | Règlement européen sur la signature électronique |

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | Janvier 2024 | Version initiale |
| 1.1 | Mars 2024 | Ajout fonctionnalités mobile |
| 1.2 | Juin 2024 | Annotations contextuelles |
| 2.0 | Janvier 2025 | Nouvelle interface, workflows améliorés |

---

*Documentation ADVIST - Dernière mise à jour : Janvier 2025*
