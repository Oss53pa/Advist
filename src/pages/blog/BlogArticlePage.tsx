import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sanitizeHtml } from '../../utils/sanitize';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Bookmark,
  ThumbsUp,
  ChevronRight,
  Scale,
  Zap,
  ShieldCheck,
  GraduationCap,
  Lock,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
} from 'lucide-react';

// Authors data
const blogAuthors = [
  {
    id: 1,
    name: 'Dr. Aminata Diallo',
    role: 'Experte Juridique OHADA',
    avatar: 'AD',
    color: 'bg-green-500',
    bio: "Docteure en droit des affaires, spécialisée dans le droit OHADA et la transformation digitale des entreprises africaines. 15 ans d'expérience en conseil juridique.",
    linkedin: 'https://linkedin.com/in/aminata-diallo',
  },
  {
    id: 2,
    name: 'Marc Kouassi',
    role: 'Directeur Produit',
    avatar: 'MK',
    color: 'bg-primary-600',
    bio: "Expert en gestion de produits SaaS avec plus de 10 ans d'expérience dans la digitalisation des processus documentaires.",
    linkedin: 'https://linkedin.com/in/marc-kouassi',
  },
  {
    id: 3,
    name: 'Sophie Mensah',
    role: 'Consultante Conformité',
    avatar: 'SM',
    color: 'bg-orange-500',
    bio: 'Consultante certifiée en conformité réglementaire, spécialisée dans les normes eIDAS, RGPD et les standards africains.',
    linkedin: 'https://linkedin.com/in/sophie-mensah',
  },
  {
    id: 4,
    name: 'Jean-Pierre Ndiaye',
    role: 'Expert Digitalisation',
    avatar: 'JN',
    color: 'bg-purple-500',
    bio: 'Ingénieur informatique et formateur certifié, auteur de nombreux guides sur la transformation digitale en Afrique.',
    linkedin: 'https://linkedin.com/in/jean-pierre-ndiaye',
  },
];

// Full articles data with complete content
const fullArticles: Record<string, any> = {
  'signature-electronique-valeur-juridique-afrique': {
    id: 1,
    slug: 'signature-electronique-valeur-juridique-afrique',
    title: 'La signature électronique a-t-elle une valeur juridique en Afrique ?',
    subtitle: "Guide complet sur le cadre légal dans l'espace OHADA",
    excerpt:
      "Découvrez le cadre légal de la signature électronique dans l'espace OHADA et comment elle est reconnue dans 17 pays africains.",
    category: 'juridique',
    categoryLabel: 'Juridique',
    published_at: '2024-12-15',
    updated_at: '2024-12-20',
    views_count: 12847,
    read_time: '8 min',
    likes: 342,
    comments: 28,
    icon: Scale,
    gradient: 'from-green-500 to-emerald-600',
    author: blogAuthors[0],
    tags: ['OHADA', 'Légal', 'Afrique', 'Signature électronique'],
    tableOfContents: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'cadre-ohada', title: 'Le cadre juridique OHADA' },
      { id: 'pays-membres', title: 'Les 17 pays membres' },
      { id: 'types-signatures', title: 'Types de signatures reconnues' },
      { id: 'mise-en-oeuvre', title: 'Mise en œuvre pratique' },
      { id: 'bonnes-pratiques', title: 'Bonnes pratiques' },
      { id: 'conclusion', title: 'Conclusion' },
    ],
    content: `
## Introduction {#introduction}

La transformation digitale des entreprises africaines s'accélère, et avec elle, la question de la **valeur juridique de la signature électronique** devient cruciale. Dans un contexte où les échanges commerciaux se dématérialisent de plus en plus, comprendre le cadre légal qui régit ces pratiques est essentiel pour toute organisation souhaitant moderniser ses processus.

> "La signature électronique n'est pas seulement un outil technologique, c'est un levier de compétitivité pour les entreprises africaines." - Dr. Aminata Diallo

Cet article vous guide à travers le paysage juridique de la signature électronique dans l'espace OHADA, en détaillant les textes applicables, les pays concernés et les bonnes pratiques à adopter.

## Le cadre juridique OHADA {#cadre-ohada}

L'**Organisation pour l'Harmonisation en Afrique du Droit des Affaires (OHADA)** a établi un cadre juridique unifié pour ses États membres. L'Acte Uniforme relatif au Droit Commercial Général (AUDCG), révisé en 2010, reconnaît explicitement la validité des écrits et signatures électroniques.

### Les textes fondamentaux

**Article 1er de l'AUDCG** : Définit le commerce électronique et établit les principes de base de la reconnaissance des actes dématérialisés.

**Article 82 et suivants** : Précisent les conditions de validité de la signature électronique :

- L'identification fiable du signataire
- La garantie du lien avec l'acte signé
- L'intégrité du document signé

### Équivalence avec la signature manuscrite

La signature électronique bénéficie de la **même force probante** que la signature manuscrite dès lors qu'elle remplit les conditions techniques et juridiques requises. Cette équivalence est fondamentale pour sécuriser les transactions commerciales.

## Les 17 pays membres de l'OHADA {#pays-membres}

L'espace OHADA regroupe **17 États africains** où le même cadre juridique s'applique :

| Zone | Pays |
|------|------|
| Afrique de l'Ouest | Bénin, Burkina Faso, Côte d'Ivoire, Guinée, Guinée-Bissau, Mali, Niger, Sénégal, Togo |
| Afrique Centrale | Cameroun, Centrafrique, Congo, Gabon, Guinée Équatoriale, Tchad |
| Océan Indien | Comores |
| Afrique Centrale | RD Congo |

Cette harmonisation permet aux entreprises opérant dans plusieurs pays de l'espace OHADA d'utiliser les mêmes pratiques de signature électronique, simplifiant considérablement les échanges transfrontaliers.

## Types de signatures reconnues {#types-signatures}

Le droit OHADA distingue **trois niveaux de signature électronique**, alignés sur les standards internationaux :

### 1. Signature électronique simple

- Utilisation basique (email, case à cocher)
- Valeur probante limitée
- Adaptée aux actes à faible enjeu

### 2. Signature électronique avancée

- Identification unique du signataire
- Lien exclusif avec le signataire
- Détection des modifications post-signature
- **Recommandée pour la plupart des actes commerciaux**

### 3. Signature électronique qualifiée

- Certificat qualifié délivré par un prestataire agréé
- Dispositif de création sécurisé
- **Plus haut niveau de sécurité juridique**
- Équivalence totale avec la signature manuscrite

## Mise en œuvre pratique {#mise-en-oeuvre}

Pour mettre en œuvre la signature électronique de manière conforme dans l'espace OHADA, voici les étapes essentielles :

### Étape 1 : Évaluer vos besoins

Identifiez les types de documents à signer et le niveau de sécurité requis :

- Contrats commerciaux → Signature avancée ou qualifiée
- Documents internes → Signature simple ou avancée
- Actes notariés → Signature qualifiée obligatoire

### Étape 2 : Choisir un prestataire conforme

Sélectionnez une solution de signature électronique qui :

- Respecte les exigences de l'AUDCG
- Offre une traçabilité complète (audit trail)
- Garantit l'intégrité des documents
- Propose un archivage sécurisé

### Étape 3 : Former vos équipes

La conformité juridique passe aussi par la formation de vos collaborateurs aux bonnes pratiques de signature électronique.

## Bonnes pratiques {#bonnes-pratiques}

Pour maximiser la valeur juridique de vos signatures électroniques :

**Conservation des preuves** : Archivez systématiquement les certificats de signature, horodatages et pistes d'audit pendant la durée légale de conservation.

**Vérification d'identité** : Utilisez des méthodes d'authentification robustes (OTP, biométrie) pour les documents sensibles.

**Documentation des processus** : Établissez une politique de signature électronique claire et documentée au sein de votre organisation.

**Audit régulier** : Vérifiez périodiquement la conformité de vos pratiques avec les évolutions réglementaires.

## Conclusion {#conclusion}

La signature électronique possède une **pleine valeur juridique** dans les 17 pays de l'espace OHADA, offrant aux entreprises africaines un outil puissant pour moderniser leurs processus tout en maintenant la sécurité juridique de leurs transactions.

L'adoption de cette technologie n'est plus une option mais une nécessité pour rester compétitif dans l'économie digitale. En suivant les bonnes pratiques et en choisissant des solutions conformes, vous pouvez transformer vos processus documentaires en toute confiance.

---

*Cet article a été rédigé par Dr. Aminata Diallo, experte juridique OHADA. Pour toute question spécifique à votre situation, consultez un avocat spécialisé.*
    `,
    relatedArticles: [
      'conformite-eidas-entreprises-internationales',
      'guide-complet-parapheur-electronique',
      'securite-documents-sensibles-entreprise',
    ],
  },

  'digitaliser-processus-validation-entreprise': {
    id: 2,
    slug: 'digitaliser-processus-validation-entreprise',
    title: '5 étapes pour digitaliser vos processus de validation documentaire',
    subtitle: 'Guide pratique pour une transformation réussie',
    excerpt: 'Transformez vos workflows papier en circuits de validation numériques efficaces.',
    category: 'productivite',
    categoryLabel: 'Productivité',
    published_at: '2024-12-10',
    updated_at: '2024-12-12',
    views_count: 8923,
    read_time: '6 min',
    likes: 256,
    comments: 19,
    icon: Zap,
    gradient: 'from-blue-500 to-blue-600',
    author: blogAuthors[1],
    tags: ['Workflow', 'Automatisation', 'ROI', 'Productivité'],
    tableOfContents: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'etape-1', title: 'Étape 1 : Audit des processus existants' },
      { id: 'etape-2', title: 'Étape 2 : Définir les workflows cibles' },
      { id: 'etape-3', title: 'Étape 3 : Choisir les bons outils' },
      { id: 'etape-4', title: 'Étape 4 : Déployer progressivement' },
      { id: 'etape-5', title: 'Étape 5 : Mesurer et optimiser' },
      { id: 'resultats', title: 'Résultats attendus' },
    ],
    content: `
## Introduction {#introduction}

Dans un monde où la rapidité d'exécution est devenue un avantage concurrentiel majeur, les entreprises qui maintiennent des processus de validation papier perdent un temps précieux. La **digitalisation des workflows documentaires** peut réduire vos délais de traitement de 70% et éliminer les goulets d'étranglement qui freinent votre activité.

Ce guide vous accompagne pas à pas dans la transformation de vos processus de validation, avec des conseils pratiques et des exemples concrets.

## Étape 1 : Audit des processus existants {#etape-1}

Avant de digitaliser, il est essentiel de **comprendre vos processus actuels** dans le détail.

### Cartographier les flux documentaires

Pour chaque type de document (factures, contrats, demandes d'achat, etc.), identifiez :

- **Les acteurs impliqués** : Qui initie, qui valide, qui archive ?
- **Les étapes de validation** : Combien d'approbations sont nécessaires ?
- **Les délais moyens** : Combien de temps entre chaque étape ?
- **Les points de blocage** : Où les documents restent-ils en attente ?

### Quantifier les coûts cachés

Les processus papier génèrent des coûts souvent sous-estimés :

| Poste de coût | Impact moyen |
|---------------|--------------|
| Temps de recherche documentaire | 2h/jour/employé |
| Impression et stockage | 15€/employé/mois |
| Retards de traitement | 5-10 jours/document |
| Erreurs de saisie | 3-5% des documents |

## Étape 2 : Définir les workflows cibles {#etape-2}

Une fois l'audit réalisé, concevez vos **workflows digitaux optimisés**.

### Principes de conception

**Simplifier avant de digitaliser** : Ne reproduisez pas les inefficacités du papier. Questionnez chaque étape : est-elle vraiment nécessaire ?

**Paralléliser quand possible** : Certaines validations peuvent être simultanées plutôt que séquentielles.

**Prévoir les exceptions** : Définissez des circuits de contournement pour les cas urgents.

### Exemple de workflow optimisé

**Avant** : Demande d'achat papier
1. Rédaction (1 jour)
2. Validation manager (2-3 jours)
3. Validation direction (3-5 jours)
4. Envoi aux achats (1 jour)
**Total : 7-10 jours**

**Après** : Workflow digital Advist
1. Saisie en ligne (10 min)
2. Notification et validation manager (même jour)
3. Validation direction si > seuil (même jour)
4. Transmission automatique
**Total : 1-2 jours**

## Étape 3 : Choisir les bons outils {#etape-3}

Le choix de la solution de workflow est déterminant pour le succès de votre transformation.

### Critères essentiels

**Facilité d'utilisation** : Une interface intuitive favorise l'adoption par les équipes.

**Flexibilité** : Pouvoir créer et modifier des workflows sans compétences techniques.

**Intégration** : Connexion avec vos outils existants (ERP, CRM, messagerie).

**Mobilité** : Accès sur smartphone pour valider en déplacement.

**Sécurité** : Conformité aux normes de protection des données.

### Fonctionnalités clés à rechercher

- Création de formulaires dynamiques
- Règles de routage conditionnelles
- Signatures électroniques intégrées
- Notifications et relances automatiques
- Tableaux de bord et reporting
- Archivage et recherche avancée

## Étape 4 : Déployer progressivement {#etape-4}

Un déploiement par phases maximise les chances de succès.

### Phase pilote

Commencez par **un processus simple** avec une équipe motivée :

- Choisissez un workflow à fort impact mais faible complexité
- Impliquez les utilisateurs dès la conception
- Recueillez les retours et ajustez

### Phase d'extension

Une fois le pilote validé, étendez progressivement :

- Ajoutez de nouveaux workflows
- Formez de nouvelles équipes
- Communiquez sur les succès obtenus

### Accompagnement au changement

Le facteur humain est crucial :

- **Expliquez les bénéfices** pour chaque utilisateur
- **Proposez des formations** adaptées à chaque profil
- **Désignez des ambassadeurs** dans chaque service
- **Célébrez les succès** pour maintenir la motivation

## Étape 5 : Mesurer et optimiser {#etape-5}

La digitalisation n'est pas une fin en soi mais un processus d'amélioration continue.

### KPIs à suivre

**Délais de traitement** : Temps moyen entre l'initiation et la finalisation d'un workflow.

**Taux de validation** : Pourcentage de documents validés du premier coup.

**Taux d'adoption** : Proportion d'utilisateurs actifs sur la plateforme.

**Satisfaction utilisateurs** : Enquêtes régulières auprès des équipes.

### Optimisation continue

- Analysez les rapports mensuellement
- Identifiez les nouveaux points de blocage
- Ajustez les workflows selon les retours
- Automatisez les tâches répétitives

## Résultats attendus {#resultats}

Les entreprises qui ont digitalisé leurs processus de validation constatent en moyenne :

- **-70%** de délais de traitement
- **-80%** de temps de recherche documentaire
- **+95%** de traçabilité des validations
- **-60%** de coûts d'impression et stockage
- **+40%** de satisfaction des équipes

La transformation digitale de vos processus documentaires est un investissement rentable qui porte ses fruits dès les premiers mois.

---

*Prêt à digitaliser vos processus ? Découvrez comment Advist peut vous accompagner avec un essai gratuit d'1 mois.*
    `,
    relatedArticles: [
      'roi-gestion-documentaire-digitale',
      'guide-complet-parapheur-electronique',
      'signature-electronique-valeur-juridique-afrique',
    ],
  },

  'conformite-eidas-entreprises-internationales': {
    id: 3,
    slug: 'conformite-eidas-entreprises-internationales',
    title: 'Conformité eIDAS 2.0 : ce que les entreprises doivent savoir en 2025',
    subtitle: 'Anticipez les évolutions réglementaires européennes',
    excerpt: 'Le règlement européen eIDAS évolue avec des changements majeurs.',
    category: 'conformite',
    categoryLabel: 'Conformité',
    published_at: '2024-12-05',
    updated_at: '2024-12-08',
    views_count: 6156,
    read_time: '10 min',
    likes: 189,
    comments: 23,
    icon: ShieldCheck,
    gradient: 'from-orange-500 to-amber-600',
    author: blogAuthors[2],
    tags: ['eIDAS', 'Europe', 'Réglementation', 'Conformité'],
    tableOfContents: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'eidas-2', title: "Qu'est-ce que eIDAS 2.0 ?" },
      { id: 'nouveautes', title: 'Les principales nouveautés' },
      { id: 'portefeuille', title: "Le portefeuille d'identité européen" },
      { id: 'impact', title: 'Impact pour les entreprises' },
      { id: 'preparation', title: 'Comment se préparer' },
      { id: 'calendrier', title: 'Calendrier de mise en œuvre' },
    ],
    content: `
## Introduction {#introduction}

Le règlement **eIDAS** (Electronic IDentification, Authentication and trust Services) a transformé le paysage de l'identité numérique en Europe depuis 2014. Avec l'adoption de **eIDAS 2.0** en 2024, l'Union européenne franchit une nouvelle étape majeure qui impactera toutes les entreprises opérant sur le marché européen.

Que vous soyez une entreprise africaine exportant vers l'Europe ou une multinationale présente sur les deux continents, comprendre ces évolutions est essentiel pour maintenir la conformité de vos opérations.

## Qu'est-ce que eIDAS 2.0 ? {#eidas-2}

eIDAS 2.0 est la révision majeure du règlement européen sur l'identification électronique et les services de confiance. Cette mise à jour répond aux limites identifiées dans la version originale et aux nouveaux défis de l'économie numérique.

### Objectifs principaux

**Universalité** : Donner à chaque citoyen européen accès à une identité numérique reconnue partout dans l'UE.

**Interopérabilité** : Permettre l'utilisation transfrontalière des identités et signatures électroniques.

**Sécurité renforcée** : Augmenter les exigences de sécurité face aux nouvelles menaces.

**Souveraineté numérique** : Réduire la dépendance aux solutions extra-européennes.

## Les principales nouveautés {#nouveautes}

### 1. Portefeuille d'identité numérique européen (EUDI Wallet)

La mesure phare de eIDAS 2.0 est l'obligation pour chaque État membre de proposer un **portefeuille d'identité numérique** à ses citoyens d'ici 2026.

Ce portefeuille permettra de :
- Prouver son identité en ligne et hors ligne
- Stocker et présenter des attestations vérifiables
- Signer électroniquement des documents
- S'authentifier auprès de services publics et privés

### 2. Nouveaux services de confiance qualifiés

eIDAS 2.0 introduit de nouveaux types de services qualifiés :

| Service | Description |
|---------|-------------|
| Attestations d'attributs | Certificats prouvant des caractéristiques (diplôme, permis, etc.) |
| Archivage électronique | Conservation probante à long terme |
| Registres électroniques | Équivalent des registres blockchain régulés |
| Gestion de dispositifs de signature | Services de création de signature à distance |

### 3. Exigences renforcées pour les prestataires

Les **Prestataires de Services de Confiance Qualifiés (QTSP)** devront :

- Se conformer à des normes de cybersécurité plus strictes
- Subir des audits plus fréquents
- Garantir une disponibilité minimale de service
- Maintenir des plans de continuité robustes

## Le portefeuille d'identité européen {#portefeuille}

Le **EUDI Wallet** représente un changement de paradigme dans la gestion de l'identité numérique.

### Fonctionnement

L'utilisateur télécharge l'application officielle de son pays et y stocke :

- Son identité vérifiée par l'État
- Ses attestations (diplômes, permis de conduire, etc.)
- Ses moyens de signature électronique qualifiée

### Cas d'usage pour les entreprises

**Onboarding client** : Vérification d'identité instantanée et certifiée par l'État.

**Signature de contrats** : Le client peut signer avec sa signature qualifiée stockée dans le portefeuille.

**Vérification de documents** : Contrôle automatique de l'authenticité des attestations présentées.

**Accès aux services** : Authentification forte sans créer de compte.

## Impact pour les entreprises {#impact}

### Obligations directes

**Grandes plateformes (gatekeepers)** : Obligation d'accepter le EUDI Wallet pour l'authentification et la signature.

**Services publics** : Intégration obligatoire du portefeuille d'ici 2026.

**Secteurs régulés** : Banque, assurance, santé devront accepter les attestations du portefeuille.

### Opportunités

La conformité eIDAS 2.0 offre également des avantages compétitifs :

- **Simplification du KYC** : Réduction des coûts de vérification d'identité
- **Meilleure expérience utilisateur** : Parcours client fluide et sécurisé
- **Réduction de la fraude** : Identités certifiées par l'État
- **Accès au marché européen** : Confiance accrue des clients européens

### Entreprises africaines concernées

Si votre entreprise :
- Vend des produits ou services à des clients européens
- Collabore avec des partenaires européens
- Fait signer des contrats par des résidents européens
- Traite des données de citoyens européens

Vous devez anticiper la conformité eIDAS 2.0.

## Comment se préparer {#preparation}

### Étape 1 : Évaluer l'impact

Identifiez les processus concernés :
- Parcours d'inscription clients
- Workflows de signature
- Vérifications d'identité
- Authentification des utilisateurs

### Étape 2 : Mettre à jour vos outils

Assurez-vous que vos solutions de signature électronique :
- Sont compatibles avec les standards eIDAS 2.0
- Peuvent intégrer le EUDI Wallet
- Supportent les nouveaux types d'attestations

### Étape 3 : Former vos équipes

Sensibilisez vos collaborateurs aux nouvelles pratiques :
- Équipes juridiques sur les évolutions réglementaires
- Équipes techniques sur les intégrations
- Équipes commerciales sur les nouveaux parcours clients

### Étape 4 : Anticiper les certifications

Si vous êtes prestataire de services de confiance, préparez-vous aux :
- Nouvelles exigences d'audit
- Certifications complémentaires requises
- Mises à niveau techniques obligatoires

## Calendrier de mise en œuvre {#calendrier}

| Date | Étape |
|------|-------|
| 2024 | Adoption définitive du règlement eIDAS 2.0 |
| 2025 | Publication des actes d'exécution techniques |
| 2026 | Mise à disposition des EUDI Wallets par les États membres |
| 2027 | Obligation d'acceptation par les grandes plateformes |
| 2028 | Généralisation complète |

## Conclusion

eIDAS 2.0 représente une évolution majeure de l'écosystème européen de confiance numérique. Les entreprises qui anticipent ces changements seront mieux positionnées pour :

- Répondre aux nouvelles exigences réglementaires
- Offrir une expérience utilisateur moderne
- Renforcer la confiance de leurs clients
- Accéder au marché européen dans les meilleures conditions

L'heure est à la préparation : ne laissez pas ces échéances vous surprendre.

---

*Sophie Mensah est consultante en conformité réglementaire, spécialisée dans les normes européennes et africaines. Contactez-nous pour un audit de conformité de vos processus.*
    `,
    relatedArticles: [
      'signature-electronique-valeur-juridique-afrique',
      'securite-documents-sensibles-entreprise',
      'archivage-electronique-normes-nf-z42-013',
    ],
  },

  'guide-complet-parapheur-electronique': {
    id: 4,
    slug: 'guide-complet-parapheur-electronique',
    title: 'Guide complet : Maîtriser le parapheur électronique en 10 minutes',
    subtitle: 'Tutoriel pas à pas pour optimiser vos validations',
    excerpt: 'Apprenez à créer, gérer et suivre vos circuits de validation comme un pro.',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-12-01',
    updated_at: '2024-12-03',
    views_count: 15420,
    read_time: '10 min',
    likes: 521,
    comments: 45,
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[3],
    tags: ['Tutoriel', 'Parapheur', 'Guide', 'Formation'],
    tableOfContents: [
      { id: 'introduction', title: "Qu'est-ce qu'un parapheur électronique ?" },
      { id: 'creation', title: 'Créer un parapheur' },
      { id: 'circuit', title: 'Configurer le circuit de validation' },
      { id: 'suivi', title: "Suivre l'avancement" },
      { id: 'signature', title: 'Signer et valider' },
      { id: 'astuces', title: 'Astuces avancées' },
      { id: 'faq', title: 'FAQ' },
    ],
    content: `
## Qu'est-ce qu'un parapheur électronique ? {#introduction}

Le **parapheur électronique** est l'équivalent numérique du parapheur physique traditionnel : un outil permettant de soumettre des documents à un circuit de validation et de signature. Fini les chemises cartonnées qui circulent de bureau en bureau !

### Avantages clés

- **Rapidité** : Validation en quelques clics, où que vous soyez
- **Traçabilité** : Historique complet de chaque action
- **Sécurité** : Documents protégés et signatures certifiées
- **Écologie** : Zéro papier, empreinte carbone réduite

## Créer un parapheur {#creation}

### Étape 1 : Accéder à l'interface de création

Depuis votre tableau de bord Advist, cliquez sur **"Nouveau parapheur"** ou utilisez le raccourci clavier **Ctrl + N**.

### Étape 2 : Renseigner les informations de base

**Titre** : Donnez un nom explicite à votre parapheur (ex: "Contrat Fournisseur ABC - Décembre 2024")

**Description** : Ajoutez des informations contextuelles pour les valideurs

**Priorité** : Normal, Urgent ou Critique

**Date limite** : Optionnelle mais recommandée pour les documents urgents

### Étape 3 : Ajouter les documents

Vous pouvez :
- **Glisser-déposer** des fichiers depuis votre ordinateur
- **Importer** depuis votre espace de stockage Advist
- **Scanner** directement si votre appareil le permet

**Formats supportés** : PDF, Word, Excel, images (JPG, PNG)

Tous les documents sont automatiquement convertis en PDF pour la signature.

### Étape 4 : Définir les zones de signature

Pour chaque document :
1. Cliquez sur **"Ajouter une zone de signature"**
2. Placez le cadre à l'emplacement souhaité
3. Associez la zone à un participant du circuit

Vous pouvez ajouter plusieurs zones par document et par participant.

## Configurer le circuit de validation {#circuit}

### Types de circuits

**Circuit séquentiel** : Les valideurs interviennent l'un après l'autre, dans un ordre défini.

**Circuit parallèle** : Tous les valideurs peuvent agir simultanément.

**Circuit mixte** : Combinaison de phases séquentielles et parallèles.

### Ajouter des participants

Pour chaque étape du circuit :

1. Cliquez sur **"Ajouter un participant"**
2. Recherchez la personne dans l'annuaire ou saisissez son email
3. Définissez son rôle :
   - **Valideur** : Peut approuver ou rejeter
   - **Signataire** : Doit apposer sa signature
   - **Lecteur** : Consultation uniquement
4. Configurez les options :
   - Signature obligatoire ou facultative
   - Délégation autorisée ou non
   - Notification par email/SMS

### Exemple de circuit

**Demande d'achat > 10 000 €**

| Étape | Participant | Rôle | Type |
|-------|-------------|------|------|
| 1 | Chef de service | Valideur | Séquentiel |
| 2 | Contrôleur de gestion | Valideur | Séquentiel |
| 3 | Directeur financier | Signataire | Séquentiel |
| 4 | Fournisseur | Signataire | Séquentiel |

### Modèles de circuit

Gagnez du temps en créant des **modèles réutilisables** pour vos circuits récurrents :

1. Configurez un circuit complet
2. Cliquez sur **"Enregistrer comme modèle"**
3. Donnez un nom au modèle
4. Réutilisez-le pour vos prochains parapheurs

## Suivre l'avancement {#suivi}

### Tableau de bord

Le tableau de bord affiche en temps réel :

- **Statut global** : En attente, En cours, Validé, Rejeté
- **Progression** : Barre de progression visuelle
- **Participant actuel** : Qui doit agir ?
- **Temps restant** : Si une date limite est définie

### Notifications

Configurez vos alertes :

- **Email** : À chaque changement de statut
- **SMS** : Pour les documents urgents
- **Push** : Sur l'application mobile

### Relances

Si un participant tarde à agir :

1. Accédez au détail du parapheur
2. Cliquez sur **"Relancer"** à côté du participant concerné
3. Personnalisez le message de relance si nécessaire

Les relances automatiques peuvent être configurées dans les paramètres.

## Signer et valider {#signature}

### Recevoir une demande de signature

Vous recevez une notification avec un lien direct vers le document. Cliquez pour accéder à l'interface de signature.

### Consulter le document

- **Navigation** : Utilisez les flèches ou le sommaire
- **Zoom** : Molette de souris ou boutons +/-
- **Commentaires** : Consultez les annotations des participants précédents

### Valider ou rejeter

**Pour valider** :
1. Cliquez sur **"Valider"**
2. Ajoutez un commentaire (optionnel)
3. Confirmez votre décision

**Pour rejeter** :
1. Cliquez sur **"Rejeter"**
2. Saisissez le motif du rejet (obligatoire)
3. Confirmez

Le rejet renvoie le document à l'initiateur avec vos commentaires.

### Apposer sa signature

1. Cliquez sur la zone de signature qui vous est attribuée
2. Choisissez votre méthode de signature :
   - **Signature dessinée** : Tracez avec la souris ou le doigt
   - **Signature typographique** : Sélectionnez un style
   - **Signature image** : Utilisez une signature pré-enregistrée
3. Authentifiez-vous (code OTP, mot de passe, biométrie selon configuration)
4. Validez la signature

## Astuces avancées {#astuces}

### Raccourcis clavier

| Action | Raccourci |
|--------|-----------|
| Nouveau parapheur | Ctrl + N |
| Rechercher | Ctrl + F |
| Valider rapidement | Alt + V |
| Passer à l'étape suivante | Tab |
| Zoomer | Ctrl + molette |

### Annotations et commentaires

Utilisez les outils d'annotation pour :
- **Surligner** des passages importants
- **Ajouter des notes** pour les valideurs suivants
- **Pointer** des éléments à vérifier

### Intégrations

Connectez Advist à vos outils :
- **Microsoft 365** : Import/export direct
- **Google Workspace** : Synchronisation des contacts
- **Slack/Teams** : Notifications dans vos canaux
- **Zapier** : Automatisations personnalisées

### API

Pour les développeurs, l'API Advist permet d'automatiser :
- La création de parapheurs
- L'ajout de participants
- Le suivi des statuts
- La récupération des documents signés

## FAQ {#faq}

**Puis-je modifier un document après l'avoir ajouté au parapheur ?**
Non, pour garantir l'intégrité du circuit. Vous devez créer un nouveau parapheur.

**Que se passe-t-il si un valideur est absent ?**
Vous pouvez configurer des suppléants ou utiliser la fonction de délégation.

**Les signatures sont-elles légalement valides ?**
Oui, Advist utilise des signatures conformes aux normes eIDAS et OHADA.

**Puis-je annuler un parapheur en cours ?**
Oui, l'initiateur peut annuler tant que tous les participants n'ont pas signé.

**Comment archiver les documents signés ?**
Les documents sont automatiquement archivés dans votre espace Advist avec toutes les preuves de signature.

---

*Ce tutoriel vous a été utile ? Partagez-le avec vos collègues et découvrez nos autres guides dans le Centre de Ressources.*
    `,
    relatedArticles: [
      'digitaliser-processus-validation-entreprise',
      'signature-electronique-mobile-bonnes-pratiques',
      'integration-api-signature-electronique',
    ],
  },

  'securite-documents-sensibles-entreprise': {
    id: 5,
    slug: 'securite-documents-sensibles-entreprise',
    title: 'Comment protéger vos documents sensibles : les meilleures pratiques',
    subtitle: 'Guide de sécurité pour la gestion documentaire',
    excerpt: "Chiffrement, contrôle d'accès, audit trail... Découvrez les stratégies essentielles.",
    category: 'securite',
    categoryLabel: 'Sécurité',
    published_at: '2024-11-28',
    updated_at: '2024-11-30',
    views_count: 4832,
    read_time: '7 min',
    likes: 167,
    comments: 12,
    icon: Lock,
    gradient: 'from-red-500 to-rose-600',
    author: blogAuthors[2],
    tags: ['Sécurité', 'Confidentialité', 'RGPD', 'Protection'],
    tableOfContents: [
      { id: 'introduction', title: 'Enjeux de la sécurité documentaire' },
      { id: 'classification', title: 'Classification des documents' },
      { id: 'chiffrement', title: 'Chiffrement des données' },
      { id: 'acces', title: 'Contrôle des accès' },
      { id: 'audit', title: 'Traçabilité et audit' },
      { id: 'checklist', title: 'Checklist de sécurité' },
    ],
    content: `
## Enjeux de la sécurité documentaire {#introduction}

Dans un contexte où les cyberattaques se multiplient, la protection des documents sensibles est devenue un impératif stratégique. Une fuite de données peut coûter en moyenne **4,35 millions de dollars** à une entreprise, sans compter l'impact sur la réputation.

### Types de menaces

- **Attaques externes** : Ransomware, phishing, intrusions
- **Menaces internes** : Erreurs humaines, malveillance
- **Pertes accidentelles** : Suppression, corruption de fichiers

## Classification des documents {#classification}

La première étape d'une stratégie de sécurité efficace est de **classifier vos documents** selon leur niveau de sensibilité.

### Niveaux recommandés

| Niveau | Description | Exemples |
|--------|-------------|----------|
| Public | Accessible à tous | Brochures, site web |
| Interne | Réservé aux employés | Notes de service, procédures |
| Confidentiel | Accès restreint | Contrats, données clients |
| Secret | Très haute sécurité | Brevets, stratégie, M&A |

### Actions par niveau

**Public** : Pas de restriction particulière

**Interne** : Authentification requise

**Confidentiel** : Chiffrement + contrôle d'accès + traçabilité

**Secret** : Toutes les mesures ci-dessus + approbation hiérarchique + audit renforcé

## Chiffrement des données {#chiffrement}

Le chiffrement rend vos documents illisibles sans la clé de déchiffrement.

### Chiffrement au repos

Les documents stockés doivent être chiffrés avec des algorithmes robustes :

- **AES-256** : Standard recommandé
- **Chiffrement côté serveur** : Transparent pour l'utilisateur
- **Chiffrement côté client** : Maximum de sécurité

### Chiffrement en transit

Toutes les communications doivent utiliser :

- **TLS 1.3** : Dernière version du protocole
- **Certificats valides** : Vérification de l'identité du serveur
- **Perfect Forward Secrecy** : Protection contre les interceptions futures

### Gestion des clés

- Rotation régulière des clés de chiffrement
- Stockage sécurisé (HSM recommandé)
- Procédures de récupération en cas de perte

## Contrôle des accès {#acces}

Le principe du **moindre privilège** : chaque utilisateur n'accède qu'aux documents nécessaires à son travail.

### Authentification forte

Exigez au minimum :

- **Mot de passe robuste** : 12+ caractères, complexité
- **Double facteur (2FA)** : OTP, biométrie, clé physique
- **SSO** : Single Sign-On pour centraliser la gestion

### Gestion des droits

Définissez des rôles avec des permissions granulaires :

- **Lecture** : Consulter le document
- **Modification** : Éditer le contenu
- **Partage** : Transmettre à d'autres
- **Suppression** : Effacer définitivement
- **Administration** : Gérer les droits d'accès

### Revue des accès

- Audit trimestriel des droits attribués
- Révocation immédiate lors des départs
- Validation managériale des accès sensibles

## Traçabilité et audit {#audit}

Un **audit trail** complet permet de détecter les anomalies et de répondre aux exigences réglementaires.

### Événements à tracer

- Connexions et déconnexions
- Accès aux documents
- Modifications effectuées
- Téléchargements et exports
- Partages et transmissions
- Tentatives d'accès refusées

### Conservation des logs

- Durée minimale : 1 an (RGPD)
- Durée recommandée : 3-5 ans
- Stockage sécurisé et infalsifiable
- Horodatage certifié

### Alertes automatiques

Configurez des alertes pour :

- Accès en dehors des heures de travail
- Téléchargements massifs
- Tentatives de connexion multiples
- Accès depuis des localisations inhabituelles

## Checklist de sécurité {#checklist}

**Infrastructure**
- [ ] Chiffrement AES-256 au repos
- [ ] TLS 1.3 pour toutes les communications
- [ ] Sauvegardes chiffrées et géo-répliquées
- [ ] Tests de restauration réguliers

**Accès**
- [ ] Authentification 2FA obligatoire
- [ ] Politique de mots de passe robuste
- [ ] Gestion des rôles et permissions
- [ ] Revue trimestrielle des accès

**Surveillance**
- [ ] Audit trail complet activé
- [ ] Alertes de sécurité configurées
- [ ] Monitoring 24/7
- [ ] Procédure de réponse aux incidents

**Conformité**
- [ ] Politique de sécurité documentée
- [ ] Formation des utilisateurs
- [ ] Audit de conformité annuel
- [ ] Certifications à jour (ISO 27001)

**Organisation**
- [ ] Responsable sécurité désigné (DPO)
- [ ] Procédure de signalement des incidents
- [ ] Plan de continuité d'activité
- [ ] Tests de pénétration périodiques

---

*La sécurité documentaire est un processus continu. Advist vous accompagne avec des solutions certifiées ISO 27001 et conformes RGPD.*
    `,
    relatedArticles: [
      'conformite-eidas-entreprises-internationales',
      'archivage-electronique-normes-nf-z42-013',
      'signature-electronique-valeur-juridique-afrique',
    ],
  },

  'roi-gestion-documentaire-digitale': {
    id: 6,
    slug: 'roi-gestion-documentaire-digitale',
    title: 'Calculer le ROI de votre transformation documentaire digitale',
    subtitle: "Méthodes et outils pour mesurer l'impact réel",
    excerpt: "Méthodes et outils pour mesurer l'impact réel de la dématérialisation.",
    category: 'productivite',
    categoryLabel: 'Productivité',
    published_at: '2024-11-25',
    updated_at: '2024-11-27',
    views_count: 3654,
    read_time: '12 min',
    likes: 145,
    comments: 18,
    icon: TrendingUp,
    gradient: 'from-cyan-500 to-blue-600',
    author: blogAuthors[1],
    tags: ['ROI', 'Business', 'Économies', 'Transformation'],
    tableOfContents: [
      { id: 'introduction', title: 'Pourquoi calculer le ROI ?' },
      { id: 'couts', title: 'Identifier les coûts actuels' },
      { id: 'benefices', title: 'Quantifier les bénéfices' },
      { id: 'formule', title: 'Formule de calcul du ROI' },
      { id: 'etude-cas', title: 'Étude de cas' },
      { id: 'calculateur', title: 'Calculateur interactif' },
    ],
    content: `
## Pourquoi calculer le ROI ? {#introduction}

Investir dans la transformation digitale nécessite de justifier les dépenses auprès de la direction. Le calcul du **Retour sur Investissement (ROI)** permet de :

- Valider la pertinence du projet
- Prioriser les initiatives
- Mesurer les résultats obtenus
- Communiquer sur la valeur créée

## Identifier les coûts actuels {#couts}

Avant de calculer les économies, il faut connaître vos **coûts de gestion documentaire actuels**.

### Coûts directs

**Papier et consommables**
- Ramettes de papier : 5-10€/ramette
- Cartouches d'encre : 50-100€/cartouche
- Consommation moyenne : 10 000 pages/employé/an

**Impression et copie**
- Coût par page : 0,03-0,08€
- Maintenance imprimantes : 500-2000€/an/appareil

**Stockage physique**
- Archivage : 5-15€/m²/mois
- Mètres linéaires : ~10 000 pages/mètre

**Envois postaux**
- Courrier simple : 1,50-3€
- Recommandé : 5-10€
- Express : 15-30€

### Coûts indirects

**Temps de traitement**
- Recherche documentaire : 30 min/document
- Classement et archivage : 15 min/document
- Saisie manuelle : 5 min/page

**Erreurs et pertes**
- Documents perdus : 3-5% des archives
- Erreurs de saisie : 1-3% des données
- Retards de traitement : 5-10 jours en moyenne

**Coût horaire moyen** (charges comprises) : 40-60€/heure

## Quantifier les bénéfices {#benefices}

### Économies directes

| Poste | Réduction attendue |
|-------|-------------------|
| Papier et impression | -80% |
| Stockage physique | -90% |
| Envois postaux | -70% |
| Consommables | -75% |

### Gains de productivité

| Tâche | Gain de temps |
|-------|--------------|
| Recherche documentaire | -90% (30 min → 3 min) |
| Circuit de validation | -70% (10 jours → 3 jours) |
| Saisie de données | -60% (reconnaissance auto) |
| Archivage | -95% (automatique) |

### Bénéfices qualitatifs

- **Traçabilité** : Conformité et audit facilités
- **Sécurité** : Réduction des risques de perte
- **Mobilité** : Accès distant aux documents
- **Image** : Modernité perçue par les clients

## Formule de calcul du ROI {#formule}

### Formule de base

**ROI = (Gains - Coûts) / Coûts × 100**

### Calcul détaillé

**Gains annuels =**
- Économies papier + impression
- + Économies stockage
- + Économies postales
- + Gains de productivité (heures × coût horaire)
- + Réduction des erreurs

**Coûts du projet =**
- Licence logicielle (annuelle ou amortie)
- + Intégration et paramétrage
- + Formation des utilisateurs
- + Maintenance et support

### Période de retour sur investissement

**Payback = Investissement initial / Économies annuelles**

Objectif : Payback < 12 mois pour un projet de dématérialisation

## Étude de cas {#etude-cas}

### Contexte

**Entreprise** : PME de 50 employés (secteur services)

**Situation initiale** :
- 500 000 pages imprimées/an
- 100 m² d'archives
- 20 000 courriers postaux/an
- 5 personnes dédiées à l'administratif

### Coûts annuels avant transformation

| Poste | Calcul | Montant |
|-------|--------|---------|
| Papier | 50 ramettes × 5€ | 250 € |
| Impression | 500 000 × 0,05€ | 25 000 € |
| Stockage | 100 m² × 10€ × 12 | 12 000 € |
| Courrier | 20 000 × 3€ | 60 000 € |
| Temps recherche | 2h/jour × 5 pers × 220j × 50€ | 110 000 € |
| **Total** | | **207 250 €** |

### Investissement transformation

| Poste | Montant |
|-------|---------|
| Licence Advist (50 users) | 15 000 €/an |
| Intégration | 10 000 € (one-shot) |
| Formation | 5 000 € |
| **Total année 1** | **30 000 €** |
| **Total année 2+** | **15 000 €** |

### Économies réalisées

| Poste | Réduction | Économie |
|-------|-----------|----------|
| Impression | -80% | 20 000 € |
| Stockage | -90% | 10 800 € |
| Courrier | -70% | 42 000 € |
| Temps recherche | -90% | 99 000 € |
| **Total** | | **171 800 €** |

### Calcul du ROI

**Année 1** :
- Gains : 171 800 €
- Coûts : 30 000 €
- ROI = (171 800 - 30 000) / 30 000 × 100 = **472%**

**Payback** : 30 000 / 171 800 = **2,1 mois**

## Calculateur interactif {#calculateur}

Utilisez notre calculateur en ligne pour estimer votre ROI personnalisé :

**Paramètres à renseigner** :
- Nombre d'employés
- Volume de pages imprimées/an
- Surface d'archives physiques
- Nombre de courriers postaux/an
- Temps moyen de recherche documentaire

**Résultats obtenus** :
- Coûts actuels détaillés
- Économies potentielles par poste
- ROI estimé sur 1, 3 et 5 ans
- Période de retour sur investissement

[Accéder au calculateur ROI →](/roi-calculator)

---

*Ces chiffres sont des estimations basées sur des moyennes sectorielles. Contactez-nous pour une étude personnalisée de votre situation.*
    `,
    relatedArticles: [
      'digitaliser-processus-validation-entreprise',
      'guide-complet-parapheur-electronique',
      'signature-electronique-valeur-juridique-afrique',
    ],
  },

  'archivage-electronique-normes-nf-z42-013': {
    id: 7,
    slug: 'archivage-electronique-normes-nf-z42-013',
    title: 'Archivage électronique : comprendre la norme NF Z42-013',
    subtitle: "Guide de conformité pour l'archivage probant",
    excerpt: "Tout savoir sur la norme française d'archivage électronique.",
    category: 'conformite',
    categoryLabel: 'Conformité',
    published_at: '2024-11-20',
    updated_at: '2024-11-22',
    views_count: 2891,
    read_time: '9 min',
    likes: 98,
    comments: 8,
    icon: ShieldCheck,
    gradient: 'from-orange-500 to-amber-600',
    author: blogAuthors[2],
    tags: ['Archivage', 'Norme', 'NF Z42-013', 'France'],
    tableOfContents: [
      { id: 'introduction', title: "Qu'est-ce que la NF Z42-013 ?" },
      { id: 'exigences', title: 'Exigences de la norme' },
      { id: 'mise-en-oeuvre', title: 'Mise en œuvre pratique' },
      { id: 'certification', title: 'Certification et audit' },
    ],
    content: `
## Qu'est-ce que la NF Z42-013 ? {#introduction}

La norme **NF Z42-013** est le référentiel français pour l'archivage électronique à valeur probante. Elle définit les spécifications techniques et organisationnelles pour garantir l'intégrité, la pérennité et la traçabilité des documents numériques archivés.

### Objectifs de la norme

- Garantir l'**intégrité** des documents sur le long terme
- Assurer la **traçabilité** de toutes les opérations
- Permettre la **restitution** fidèle des documents
- Maintenir la **valeur probante** des archives

### Champ d'application

La norme s'applique à tout système d'archivage électronique (SAE) souhaitant garantir la valeur juridique des documents conservés, particulièrement dans les secteurs :

- Bancaire et financier
- Assurance
- Santé
- Secteur public
- Entreprises soumises à des obligations d'archivage légales

## Exigences de la norme {#exigences}

### Exigences organisationnelles

**Politique d'archivage**
- Document formalisé décrivant les règles de gestion
- Définition des durées de conservation
- Procédures de versement et d'élimination

**Responsabilités**
- Désignation d'un responsable de l'archivage
- Définition des rôles et habilitations
- Formation du personnel

### Exigences techniques

**Intégrité des documents**
- Calcul et conservation d'empreintes numériques (hash)
- Algorithmes conformes (SHA-256 minimum)
- Vérification périodique de l'intégrité

**Horodatage**
- Horodatage qualifié de chaque opération
- Jeton d'horodatage conforme RFC 3161
- Conservation des preuves d'horodatage

**Traçabilité**
- Journalisation de toutes les opérations
- Conservation des journaux
- Protection contre les altérations

**Pérennité**
- Formats de conservation pérennes (PDF/A)
- Plan de migration technologique
- Redondance et sauvegarde

## Mise en œuvre pratique {#mise-en-oeuvre}

### Étapes de mise en conformité

1. **Audit initial** : Évaluer l'existant
2. **Politique d'archivage** : Rédiger et valider
3. **Choix de solution** : SAE conforme NF Z42-013
4. **Déploiement** : Paramétrage et migration
5. **Formation** : Utilisateurs et administrateurs
6. **Audit de conformité** : Validation externe

### Points d'attention

- Migration des archives existantes
- Interopérabilité avec les systèmes métier
- Gestion des formats obsolètes
- Plan de réversibilité

## Certification et audit {#certification}

### Certification NF 461

La certification **NF 461** atteste de la conformité d'un SAE à la norme NF Z42-013. Elle est délivrée par AFNOR Certification après audit.

### Processus de certification

1. Dépôt de dossier de candidature
2. Audit documentaire
3. Audit sur site
4. Rapport d'audit et décision
5. Surveillance annuelle

### Avantages de la certification

- Reconnaissance de la conformité
- Valeur probante renforcée
- Confiance des partenaires
- Différenciation commerciale

---

*Advist intègre des fonctionnalités d'archivage conformes aux exigences de la NF Z42-013. Contactez-nous pour en savoir plus.*
    `,
    relatedArticles: [
      'securite-documents-sensibles-entreprise',
      'conformite-eidas-entreprises-internationales',
      'signature-electronique-valeur-juridique-afrique',
    ],
  },

  'signature-electronique-mobile-bonnes-pratiques': {
    id: 8,
    slug: 'signature-electronique-mobile-bonnes-pratiques',
    title: 'Signature électronique sur mobile : guide des bonnes pratiques',
    subtitle: 'Signez en toute sécurité depuis votre smartphone',
    excerpt: 'Comment signer des documents en toute sécurité depuis votre smartphone.',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-11-15',
    updated_at: '2024-11-17',
    views_count: 5234,
    read_time: '5 min',
    likes: 234,
    comments: 31,
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[3],
    tags: ['Mobile', 'Signature', 'Tutoriel', 'Smartphone'],
    tableOfContents: [
      { id: 'introduction', title: 'Pourquoi signer sur mobile ?' },
      { id: 'preparation', title: 'Préparer son smartphone' },
      { id: 'processus', title: 'Processus de signature' },
      { id: 'securite', title: 'Conseils de sécurité' },
    ],
    content: `
## Pourquoi signer sur mobile ? {#introduction}

La signature électronique sur mobile répond aux besoins de **mobilité et de réactivité** des professionnels modernes. Plus besoin d'être devant un ordinateur pour valider un document urgent.

### Avantages

- **Disponibilité** : Signez n'importe où, n'importe quand
- **Rapidité** : Réduisez les délais de validation
- **Simplicité** : Interface tactile intuitive
- **Notifications** : Alertes en temps réel

## Préparer son smartphone {#preparation}

### Prérequis techniques

- Smartphone iOS 14+ ou Android 10+
- Connexion internet (4G/5G ou WiFi)
- Application Advist installée
- Biométrie activée (recommandé)

### Configuration initiale

1. Téléchargez l'application Advist
2. Connectez-vous avec vos identifiants
3. Activez la biométrie (Face ID / empreinte)
4. Autorisez les notifications

## Processus de signature {#processus}

### Recevoir une demande

Vous recevez une notification push. Touchez pour ouvrir directement le document.

### Consulter le document

- Faites défiler pour parcourir les pages
- Pincez pour zoomer
- Consultez les commentaires

### Signer

1. Touchez la zone de signature
2. Tracez votre signature avec le doigt
3. Validez avec la biométrie
4. Confirmez la signature

## Conseils de sécurité {#securite}

### Bonnes pratiques

- Activez le verrouillage biométrique
- Ne signez pas sur un WiFi public non sécurisé
- Vérifiez l'identité de l'expéditeur
- Lisez attentivement avant de signer

### À éviter

- Signer sur un appareil non sécurisé
- Partager ses identifiants
- Ignorer les alertes de sécurité
- Signer sans lire le document

---

*Téléchargez l'application Advist sur l'App Store et Google Play pour signer vos documents en mobilité.*
    `,
    relatedArticles: [
      'guide-complet-parapheur-electronique',
      'securite-documents-sensibles-entreprise',
      'integration-api-signature-electronique',
    ],
  },

  'integration-api-signature-electronique': {
    id: 9,
    slug: 'integration-api-signature-electronique',
    title: 'Intégrer une API de signature électronique : guide technique',
    subtitle: 'Documentation pour développeurs',
    excerpt: 'Documentation technique complète pour intégrer Advist dans vos applications.',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-11-10',
    updated_at: '2024-11-12',
    views_count: 4567,
    read_time: '15 min',
    likes: 187,
    comments: 42,
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[1],
    tags: ['API', 'Développeur', 'Intégration', 'Technique'],
    tableOfContents: [
      { id: 'introduction', title: "Vue d'ensemble de l'API" },
      { id: 'authentification', title: 'Authentification' },
      { id: 'endpoints', title: 'Endpoints principaux' },
      { id: 'webhooks', title: 'Webhooks' },
      { id: 'exemples', title: 'Exemples de code' },
    ],
    content: `
## Vue d'ensemble de l'API {#introduction}

L'API Advist permet d'intégrer les fonctionnalités de signature électronique directement dans vos applications. Elle suit les principes REST et utilise JSON pour les échanges.

### Base URL

\`\`\`
https://api.advist.io/v1
\`\`\`

### Fonctionnalités disponibles

- Création de documents à signer
- Gestion des circuits de validation
- Suivi des signatures
- Téléchargement des documents signés
- Gestion des utilisateurs

## Authentification {#authentification}

L'API utilise des tokens JWT pour l'authentification.

### Obtenir un token

\`\`\`bash
curl -X POST https://api.advist.io/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "YOUR_API_KEY_HERE", "api_secret": "YOUR_API_SECRET_HERE"}'
\`\`\`

### Réponse

\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

### Utilisation

\`\`\`bash
curl -X GET https://api.advist.io/v1/documents \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
\`\`\`

## Endpoints principaux {#endpoints}

### Documents

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /documents | Créer un document |
| GET | /documents/{id} | Récupérer un document |
| DELETE | /documents/{id} | Supprimer un document |
| GET | /documents/{id}/download | Télécharger le PDF signé |

### Signatures

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /documents/{id}/signers | Ajouter un signataire |
| GET | /documents/{id}/signatures | Liste des signatures |
| POST | /signatures/{id}/remind | Envoyer une relance |

## Webhooks {#webhooks}

Les webhooks permettent de recevoir des notifications en temps réel.

### Événements disponibles

- \`document.created\` : Document créé
- \`document.signed\` : Document signé
- \`document.completed\` : Toutes signatures obtenues
- \`document.rejected\` : Document rejeté
- \`signer.viewed\` : Signataire a consulté

### Configuration

\`\`\`bash
curl -X POST https://api.advist.io/v1/webhooks \\
  -H "Authorization: Bearer {token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/advist",
    "events": ["document.signed", "document.completed"]
  }'
\`\`\`

## Exemples de code {#exemples}

### Python

\`\`\`python
import requests

# Configuration
API_KEY = "YOUR_API_KEY_HERE"
API_SECRET = "YOUR_API_SECRET_HERE"
BASE_URL = "https://api.advist.io/v1"

# Authentification
auth_response = requests.post(
    f"{BASE_URL}/auth/token",
    json={"api_key": API_KEY, "api_secret": API_SECRET}
)
token = auth_response.json()["access_token"]

# Créer un document
headers = {"Authorization": f"Bearer {token}"}
document = requests.post(
    f"{BASE_URL}/documents",
    headers=headers,
    json={
        "name": "Contrat de service",
        "file_base64": "JVBERi0xLjQK...",
        "signers": [
            {"email": "client@example.com", "name": "Jean Dupont"}
        ]
    }
)
print(document.json())
\`\`\`

### JavaScript (Node.js)

\`\`\`javascript
const axios = require('axios');

const API_KEY = 'YOUR_API_KEY_HERE';
const API_SECRET = 'YOUR_API_SECRET_HERE';
const BASE_URL = 'https://api.advist.io/v1';

async function createDocument() {
  // Authentification
  const authResponse = await axios.post(\`\${BASE_URL}/auth/token\`, {
    api_key: API_KEY,
    api_secret: API_SECRET
  });

  const token = authResponse.data.access_token;

  // Créer un document
  const document = await axios.post(
    \`\${BASE_URL}/documents\`,
    {
      name: 'Contrat de service',
      file_base64: 'JVBERi0xLjQK...',
      signers: [
        { email: 'client@example.com', name: 'Jean Dupont' }
      ]
    },
    { headers: { Authorization: \`Bearer \${token}\` } }
  );

  console.log(document.data);
}

createDocument();
\`\`\`

---

*Pour une documentation complète, consultez notre portail développeurs : [developers.advist.io](https://developers.advist.io)*
    `,
    relatedArticles: [
      'guide-complet-parapheur-electronique',
      'digitaliser-processus-validation-entreprise',
      'signature-electronique-mobile-bonnes-pratiques',
    ],
  },
};

// Illustration component for articles
const ArticleIllustration: React.FC<{ gradient: string; icon: any; title: string }> = ({
  gradient,
  icon: Icon,
  title,
}) => (
  <div
    className={`relative w-full h-64 md:h-96 bg-gradient-to-br ${gradient} rounded-2xl overflow-hidden`}
  >
    {/* Background patterns */}
    <div className="absolute inset-0">
      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full" />
      <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-white/20 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full" />
      <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-xl rotate-12" />
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-white/10 rounded-full" />
    </div>

    {/* Grid pattern */}
    <div className="absolute inset-0 opacity-10">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

    {/* Center icon */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
        <Icon className="w-16 h-16 text-white" />
      </div>
    </div>

    {/* Bottom label */}
    <div className="absolute bottom-6 left-6 right-6">
      <p className="text-white/80 text-sm font-medium truncate">{title}</p>
    </div>
  </div>
);

export const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const article = slug ? fullArticles[slug] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">Article non trouvé</h1>
          <p className="text-primary-600 mb-6">L'article que vous recherchez n'existe pas.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au blog
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = article.icon;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article.title);

    const shareUrls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      email: `mailto:?subject=${title}&body=${url}`,
    };

    window.open(shareUrls[platform], '_blank');
  };

  // Get related articles
  const relatedArticles = article.relatedArticles
    ?.map((slug: string) => fullArticles[slug])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-primary-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-decorative text-2xl font-bold text-primary-900">Advist</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/#features"
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all"
              >
                Fonctionnalités
              </Link>
              <Link
                to="/#how-it-works"
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all"
              >
                Comment ça marche
              </Link>
              <Link
                to="/#demo"
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all"
              >
                Démo
              </Link>
              <Link
                to="/#pricing"
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all"
              >
                Tarifs
              </Link>
              <Link
                to="/blog"
                className="px-4 py-2 text-sm font-medium text-primary-900 bg-primary-100 rounded-lg"
              >
                Blog
              </Link>
              <Link
                to="/#contact"
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all"
              >
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/select-profile">
                <button className="px-4 py-2 text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors">
                  Connexion
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-primary-900 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
                  Essai gratuit
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-primary-500 hover:text-primary-700 transition-colors">
              Accueil
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <Link to="/blog" className="text-primary-500 hover:text-primary-700 transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-4 h-4 text-primary-400" />
            <span className="text-primary-900 font-medium truncate max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-900 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1.5 bg-gradient-to-r ${article.gradient} text-white text-xs font-semibold rounded-full`}
            >
              {article.categoryLabel}
            </span>
            <span className="text-sm text-primary-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.read_time} de lecture
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {article.subtitle && <p className="text-xl text-primary-600 mb-6">{article.subtitle}</p>}

          {/* Author and meta */}
          <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-primary-100">
            {article.author && (
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${article.author.color} rounded-full flex items-center justify-center text-white font-bold`}
                >
                  {article.author.avatar}
                </div>
                <div>
                  <p className="font-semibold text-primary-900">{article.author.name}</p>
                  <p className="text-sm text-primary-500">{article.author.role}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-primary-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(article.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views_count?.toLocaleString()} vues
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-10">
          <ArticleIllustration
            gradient={article.gradient}
            icon={IconComponent}
            title={article.title}
          />
        </div>

        {/* Table of Contents */}
        {article.tableOfContents && (
          <nav className="mb-10 p-6 bg-primary-50 rounded-2xl">
            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Sommaire
            </h3>
            <ul className="space-y-2">
              {article.tableOfContents.map((item: any, index: number) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-3 text-primary-600 hover:text-primary-900 transition-colors"
                  >
                    <span className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-xs font-semibold text-primary-700">
                      {index + 1}
                    </span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Article Body */}
        <div className="prose prose-lg prose-primary max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                article.content
                  .replace(/\n/g, '<br>')
                  .replace(/## (.*?) \{#(.*?)\}/g, '<h2 id="$2">$1</h2>')
                  .replace(/### (.*)/g, '<h3>$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                  .replace(/^- (.*)/gm, '<li>$1</li>')
                  .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
                  .replace(/\| (.*) \|/g, '<tr><td>$1</td></tr>')
              ),
            }}
            className="[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-primary-900 [&>h2]:mt-12 [&>h2]:mb-6 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-primary-800 [&>h3]:mt-8 [&>h3]:mb-4 [&>p]:text-primary-700 [&>p]:leading-relaxed [&>p]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-primary-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-primary-600 [&>blockquote]:my-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>li]:text-primary-700 [&>li]:mb-2 [&>code]:bg-primary-100 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-sm [&>code]:text-primary-800 [&>a]:text-green-600 [&>a]:underline [&>a]:hover:text-green-700"
          />
        </div>

        {/* Tags */}
        {article.tags && (
          <div className="mt-10 pt-6 border-t border-primary-100">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-6 bg-primary-50 rounded-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                liked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white text-primary-600 hover:bg-primary-100'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              {article.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                bookmarked
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-white text-primary-600 hover:bg-primary-100'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              Sauvegarder
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-primary-600 mr-2">Partager :</span>
            <button
              onClick={() => handleShare('linkedin')}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('email')}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopyLink}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Author Bio */}
        {article.author && (
          <div className="mt-10 p-6 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100">
            <div className="flex items-start gap-4">
              <div
                className={`w-16 h-16 ${article.author.color} rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}
              >
                {article.author.avatar}
              </div>
              <div>
                <h4 className="font-bold text-primary-900 mb-1">{article.author.name}</h4>
                <p className="text-sm text-primary-600 mb-3">{article.author.role}</p>
                <p className="text-primary-700 text-sm leading-relaxed">{article.author.bio}</p>
                {article.author.linkedin && (
                  <a
                    href={article.author.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    Suivre sur LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-primary-900 mb-8">Articles similaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle: any) => {
                const RelatedIcon = relatedArticle.icon;
                return (
                  <Link
                    key={relatedArticle.id}
                    to={`/blog/${relatedArticle.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-primary-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`relative h-32 bg-gradient-to-br ${relatedArticle.gradient}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RelatedIcon className="w-10 h-10 text-white/80" />
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-semibold text-green-600">
                        {relatedArticle.categoryLabel}
                      </span>
                      <h4 className="font-bold text-primary-900 mt-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                        {relatedArticle.title}
                      </h4>
                      <span className="text-xs text-primary-500 mt-2 block">
                        {relatedArticle.read_time}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 p-8 bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Prêt à digitaliser vos processus ?</h3>
          <p className="text-primary-200 mb-6 max-w-lg mx-auto">
            Découvrez comment Advist peut transformer votre gestion documentaire avec un essai
            gratuit d'1 mois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-900 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
            >
              Essai gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/#demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-primary-900 py-8 border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="font-decorative text-xl font-bold text-white">
              Advist
            </Link>
            <p className="text-primary-400 text-sm">
              © 2025 Advist by Atlas Studio. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/legal/privacy"
                className="text-sm text-primary-400 hover:text-white transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                to="/legal/cgu"
                className="text-sm text-primary-400 hover:text-white transition-colors"
              >
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogArticlePage;
