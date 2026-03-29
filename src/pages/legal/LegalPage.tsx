import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock } from 'lucide-react';

const legalContent = {
  mentions: {
    title: 'Mentions Légales',
    icon: FileText,
    lastUpdate: '1er janvier 2025',
    sections: [
      {
        title: '1. Informations légales sur l\'éditeur',
        content: `Conformément aux dispositions de la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques en Côte d'Ivoire et au Règlement (UE) 2016/679 (RGPD), nous vous informons que :

Raison sociale : ATLAS-STUDIO SARL
Forme juridique : Société à Responsabilité Limitée
Capital social : 1 000 000 FCFA
Siège social : Plateau, Rue du Commerce, Immeuble CCIA, Abidjan, Côte d'Ivoire
RCCM : CI-ABJ-2024-B-12345
N° Contribuable : CI-2024-0012345-A
Téléphone : +225 01 02 03 04 05
Email : contact@advist.com

Directeur de la publication : M. [Nom du Directeur Général]
Responsable de la rédaction : M. [Nom du Responsable]`
      },
      {
        title: '2. Hébergement des données',
        content: `Conformément aux exigences du RGPD (Articles 44-49) relatives aux transferts de données :

Hébergeur principal :
Amazon Web Services EMEA SARL
38 Avenue John F. Kennedy, L-1855 Luxembourg
Téléphone : +352 2789 0057

Localisation des données :
• Données primaires : Centre de données AWS Europe (Paris, France - eu-west-3)
• Données de sauvegarde : Centre de données AWS Europe (Francfort, Allemagne - eu-central-1)

Certifications de l'hébergeur :
• ISO 27001, ISO 27017, ISO 27018
• SOC 1, SOC 2, SOC 3
• PCI DSS Level 1
• Conformité RGPD attestée

Les données ne sont jamais transférées hors de l'Espace Économique Européen (EEE) sans garanties appropriées conformément au Chapitre V du RGPD.`
      },
      {
        title: '3. Propriété intellectuelle',
        content: `Conformément au Code de la Propriété Intellectuelle et aux accords OAPI (Organisation Africaine de la Propriété Intellectuelle) :

L'ensemble des éléments constituant le site et la plateforme ADVIST sont protégés par :
• Le droit d'auteur (Code de la Propriété Intellectuelle, L.111-1 et suivants)
• Le droit des marques (Accord de Bangui révisé, Annexe III)
• Le droit des bases de données (Directive 96/9/CE)

Sont notamment protégés :
• La marque ADVIST® et le logo associé
• L'architecture et le code source de la plateforme
• Les textes, graphismes, images et contenus multimédia
• Les bases de données et leur structure

Toute reproduction, représentation, modification, publication, transmission ou exploitation non autorisée est passible de poursuites conformément aux articles L.335-2 et suivants du Code de la Propriété Intellectuelle.`
      },
      {
        title: '4. Limitation de responsabilité',
        content: `Conformément à la loi n°2013-546 du 30 juillet 2013 sur les transactions électroniques :

ATLAS-STUDIO s'engage à mettre en œuvre tous les moyens raisonnables pour assurer :
• La disponibilité du service (SLA 99.9%)
• L'intégrité et la sécurité des données
• La conformité aux normes applicables

Exclusions de responsabilité :
• Force majeure (Art. 1218 du Code Civil)
• Fait d'un tiers ou de l'utilisateur
• Dysfonctionnements liés à l'environnement technique de l'utilisateur
• Contenus créés ou importés par les utilisateurs

En tout état de cause, la responsabilité d'ATLAS-STUDIO est limitée au montant des sommes effectivement versées par l'utilisateur au cours des 12 derniers mois.`
      },
      {
        title: '5. Cookies et traceurs',
        content: `Conformément à la Directive 2002/58/CE modifiée (ePrivacy) et aux recommandations de la CNIL :

Types de cookies utilisés :
• Cookies strictement nécessaires : fonctionnement du site (exemptés de consentement)
• Cookies de performance : analyse d'audience (Google Analytics 4)
• Cookies de fonctionnalité : personnalisation de l'expérience
• Cookies publicitaires : aucun

Durée de conservation : 13 mois maximum conformément aux recommandations CNIL.

Gestion des préférences : Vous pouvez à tout moment modifier vos préférences via le bandeau cookies ou les paramètres de votre navigateur.`
      },
      {
        title: '6. Accessibilité',
        content: `ATLAS-STUDIO s'engage à rendre la plateforme ADVIST accessible conformément au Référentiel Général d'Amélioration de l'Accessibilité (RGAA) et aux Web Content Accessibility Guidelines (WCAG) 2.1 niveau AA.

En cas de difficulté d'accessibilité, contactez-nous : accessibilite@advist.com`
      }
    ]
  },
  privacy: {
    title: 'Politique de Confidentialité',
    icon: Lock,
    lastUpdate: '1er janvier 2025',
    sections: [
      {
        title: '1. Responsable du traitement',
        content: `Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi ivoirienne n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel :

Responsable du traitement :
ATLAS-STUDIO SARL
Plateau, Rue du Commerce, Immeuble CCIA
Abidjan, Côte d'Ivoire

Délégué à la Protection des Données (DPO) :
Email : dpo@advist.com
Adresse : ATLAS-STUDIO - DPO, BP 1234, Abidjan, Côte d'Ivoire

Autorité de contrôle :
• ARTCI (Autorité de Régulation des Télécommunications de Côte d'Ivoire)
• CNIL (Commission Nationale de l'Informatique et des Libertés) pour les utilisateurs européens`
      },
      {
        title: '2. Données collectées et finalités',
        content: `Conformément au principe de minimisation (Art. 5.1.c RGPD), nous collectons uniquement les données nécessaires :

DONNÉES D'IDENTIFICATION (Base légale : Exécution du contrat - Art. 6.1.b)
• Nom, prénom, email professionnel, téléphone
• Fonction, entreprise, numéro SIRET/RCCM
Finalités : Création et gestion du compte, facturation, support client

DONNÉES DE CONNEXION (Base légale : Intérêt légitime - Art. 6.1.f)
• Adresse IP, logs de connexion, appareil utilisé
• Données de navigation, cookies techniques
Finalités : Sécurité, prévention de la fraude, amélioration du service

DONNÉES D'UTILISATION (Base légale : Exécution du contrat - Art. 6.1.b)
• Documents uploadés, signatures, workflows
• Historique des actions, métadonnées
Finalités : Fourniture du service, preuve de signature, audit trail

DONNÉES DE SIGNATURE ÉLECTRONIQUE (Base légale : Obligation légale - Art. 6.1.c)
• Certificat de signature, horodatage qualifié
• Preuves de consentement, piste d'audit
Finalités : Conformité eIDAS et OHADA, valeur probante`
      },
      {
        title: '3. Destinataires des données',
        content: `Conformément à l'Art. 13.1.e du RGPD, vos données peuvent être transmises à :

DESTINATAIRES INTERNES
• Équipe support client (données de compte)
• Équipe technique (données de connexion)
• Service comptabilité (données de facturation)

SOUS-TRAITANTS (Art. 28 RGPD)
Tous nos sous-traitants sont liés par des clauses contractuelles types (CCT) approuvées par la Commission Européenne :
• Amazon Web Services (hébergement) - CCT signées
• Stripe (paiement) - Certifié PCI DSS
• SendGrid (emails transactionnels) - CCT signées
• Autorité de certification eIDAS (signatures)

TIERS AUTORISÉS
• Autorités judiciaires sur réquisition légale
• Commissaires aux comptes (obligations légales)

AUCUNE vente ou location de données à des tiers à des fins commerciales.`
      },
      {
        title: '4. Transferts internationaux',
        content: `Conformément au Chapitre V du RGPD (Articles 44-49) :

PRINCIPE : Vos données sont hébergées exclusivement dans l'Union Européenne (France, Allemagne).

EXCEPTIONS ENCADRÉES :
En cas de transfert vers un pays tiers, nous garantissons un niveau de protection adéquat par :
• Décision d'adéquation de la Commission Européenne (Art. 45)
• Clauses Contractuelles Types (CCT) approuvées (Art. 46.2.c)
• Règles d'entreprise contraignantes (BCR) le cas échéant

ÉTATS-UNIS : Pour les services américains (ex: support technique), nous utilisons les CCT post-Schrems II avec mesures supplémentaires (chiffrement, pseudonymisation).

Vous pouvez obtenir une copie des garanties appropriées en contactant notre DPO.`
      },
      {
        title: '5. Durées de conservation',
        content: `Conformément au principe de limitation de la conservation (Art. 5.1.e RGPD) :

DONNÉES DE COMPTE
• Durée : Pendant la relation contractuelle + 3 ans (prescription commerciale)
• Archivage intermédiaire : 5 ans supplémentaires (obligations fiscales)

DOCUMENTS ET SIGNATURES ÉLECTRONIQUES
• Durée : 10 ans minimum (Art. L.137-2 Code de commerce, Art. 2224 Code civil)
• Justification : Valeur probante et obligations légales eIDAS/OHADA

LOGS DE CONNEXION
• Durée : 1 an (Art. 6 II LCEN, décret n°2011-219)
• Finalité : Sécurité et lutte contre la fraude

DONNÉES DE FACTURATION
• Durée : 10 ans (Art. L.123-22 Code de commerce)
• Justification : Obligations comptables et fiscales

COOKIES
• Durée : 13 mois maximum (Délibération CNIL n°2020-091)

À l'expiration de ces délais, les données sont supprimées ou anonymisées de manière irréversible.`
      },
      {
        title: '6. Vos droits',
        content: `Conformément aux Articles 15 à 22 du RGPD et à la loi ivoirienne n°2013-450, vous disposez des droits suivants :

DROIT D'ACCÈS (Art. 15)
Obtenir confirmation du traitement et une copie de vos données.

DROIT DE RECTIFICATION (Art. 16)
Corriger les données inexactes ou incomplètes.

DROIT À L'EFFACEMENT / "Droit à l'oubli" (Art. 17)
Demander la suppression de vos données (sauf obligations légales de conservation).

DROIT À LA LIMITATION (Art. 18)
Limiter le traitement dans certaines circonstances.

DROIT À LA PORTABILITÉ (Art. 20)
Recevoir vos données dans un format structuré et lisible par machine (JSON, CSV).

DROIT D'OPPOSITION (Art. 21)
Vous opposer au traitement pour des raisons tenant à votre situation particulière.

DROIT DE RETRAIT DU CONSENTEMENT (Art. 7.3)
Retirer votre consentement à tout moment (prospection commerciale).

DIRECTIVES POST-MORTEM
Définir des directives relatives à la conservation et communication de vos données après votre décès.

EXERCICE DE VOS DROITS :
• Email : dpo@advist.com
• Courrier : ATLAS-STUDIO - DPO, BP 1234, Abidjan, Côte d'Ivoire
• Délai de réponse : 1 mois (prolongeable de 2 mois si complexité)

RÉCLAMATION :
Vous pouvez introduire une réclamation auprès de l'ARTCI (Côte d'Ivoire) ou de la CNIL (France) si vous estimez que vos droits ne sont pas respectés.`
      },
      {
        title: '7. Sécurité des données',
        content: `Conformément à l'Art. 32 du RGPD, nous mettons en œuvre des mesures techniques et organisationnelles appropriées :

MESURES TECHNIQUES
• Chiffrement AES-256 des données au repos
• Chiffrement TLS 1.3 pour les données en transit
• Authentification multi-facteurs (MFA) disponible
• Pare-feu applicatif (WAF) et protection DDoS
• Détection d'intrusion (IDS/IPS)
• Sauvegarde chiffrée quotidienne avec rétention 30 jours

MESURES ORGANISATIONNELLES
• Politique de sécurité de l'information (PSSI)
• Sensibilisation et formation des employés
• Contrôle d'accès basé sur les rôles (RBAC)
• Procédure de gestion des incidents (< 72h notification CNIL si violation)
• Tests d'intrusion annuels par tiers indépendant

CERTIFICATIONS
• ISO 27001:2022 - Système de management de la sécurité de l'information
• ISO 27701:2019 - Extension vie privée
• SOC 2 Type II - Contrôles de sécurité
• Conformité PCI DSS pour les paiements`
      },
      {
        title: '8. Cookies et technologies similaires',
        content: `Conformément à l'Art. 82 de la loi Informatique et Libertés et à la Directive ePrivacy :

COOKIES STRICTEMENT NÉCESSAIRES (Exemptés de consentement)
• Session utilisateur, authentification, sécurité
• Préférences de langue, accessibilité
• Équilibrage de charge

COOKIES DE MESURE D'AUDIENCE (Consentement requis)
• Google Analytics 4 (anonymisation IP activée)
• Finalité : Statistiques de fréquentation, amélioration du service
• Durée : 13 mois

COOKIES DE FONCTIONNALITÉ (Consentement requis)
• Personnalisation de l'interface
• Mémorisation des préférences
• Durée : 13 mois

AUCUN COOKIE PUBLICITAIRE OU DE TRAÇAGE TIERS

Gestion des préférences : Accessible via le lien "Gérer les cookies" en pied de page.`
      }
    ]
  },
  cgu: {
    title: "Conditions Générales d'Utilisation",
    icon: Shield,
    lastUpdate: '1er janvier 2025',
    sections: [
      {
        title: 'Article 1 - Objet et acceptation',
        content: `1.1 OBJET
Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation de la plateforme ADVIST, service de gestion électronique de documents et de signature électronique édité par ATLAS-STUDIO SARL.

1.2 ACCEPTATION
L'accès et l'utilisation de la plateforme ADVIST impliquent l'acceptation pleine et entière des présentes CGU. En cochant la case "J'accepte les CGU" lors de l'inscription, l'Utilisateur reconnaît avoir pris connaissance des présentes et les accepter sans réserve.

1.3 MODIFICATIONS
ATLAS-STUDIO se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés par email et notification in-app au moins 30 jours avant l'entrée en vigueur des modifications. L'utilisation continue du service après ce délai vaut acceptation des nouvelles CGU.

1.4 HIÉRARCHIE DES DOCUMENTS
En cas de contradiction, l'ordre de prévalence est le suivant :
1. Conditions Particulières signées
2. Présentes CGU
3. Politique de Confidentialité
4. Documentation technique`
      },
      {
        title: 'Article 2 - Définitions',
        content: `Pour l'interprétation des présentes CGU, les termes suivants ont la signification indiquée :

"Administrateur" : Utilisateur disposant de droits étendus de gestion du compte Organisation.

"Document" : Tout fichier électronique uploadé sur la plateforme (PDF, Word, Excel, images, etc.).

"Organisation" : Entité juridique (entreprise, association, administration) titulaire d'un compte ADVIST.

"Plateforme" ou "Service" : L'ensemble des fonctionnalités accessibles via app.advist.com et les applications mobiles.

"Signature Électronique" : Données sous forme électronique jointes ou associées à d'autres données électroniques et utilisées par le signataire pour signer (Art. 3 Règlement eIDAS).

"Signataire" : Personne physique qui crée une signature électronique.

"Utilisateur" : Toute personne physique disposant d'un accès à la plateforme.

"Workflow" : Circuit de validation personnalisable définissant les étapes d'approbation d'un document.`
      },
      {
        title: 'Article 3 - Description du service',
        content: `3.1 FONCTIONNALITÉS PRINCIPALES
La plateforme ADVIST propose les services suivants :
• Gestion Électronique de Documents (GED) : upload, organisation, recherche, versioning
• Workflows de validation : circuits d'approbation multi-niveaux paramétrables
• Signature électronique : signature simple, avancée et qualifiée selon eIDAS
• Archivage à valeur probante : conservation sécurisée conforme aux normes
• Tableaux de bord et reporting : analytics et suivi des KPIs

3.2 NIVEAUX DE SIGNATURE (Règlement eIDAS n°910/2014)
• Signature Électronique Simple (SES) : Art. 3.10 - Présomption de fiabilité
• Signature Électronique Avancée (SEA) : Art. 3.11 - Liée au signataire de manière univoque
• Signature Électronique Qualifiée (SEQ) : Art. 3.12 - Équivalence juridique avec signature manuscrite

3.3 CONFORMITÉ LÉGALE
Le service est conçu pour être conforme à :
• Règlement (UE) n°910/2014 (eIDAS) sur l'identification électronique
• Acte Uniforme OHADA relatif au droit commercial général (Art. 82-1 et suivants)
• Loi ivoirienne n°2013-546 du 30 juillet 2013 sur les transactions électroniques
• Règlement (UE) 2016/679 (RGPD) sur la protection des données

3.4 DISPONIBILITÉ
ATLAS-STUDIO s'engage sur un taux de disponibilité de 99.9% (hors maintenance programmée). Les maintenances sont annoncées 48h à l'avance sauf urgence sécuritaire.`
      },
      {
        title: 'Article 4 - Inscription et compte utilisateur',
        content: `4.1 CONDITIONS D'INSCRIPTION
L'inscription est réservée aux personnes physiques majeures et capables juridiquement, agissant pour le compte d'une Organisation ou à titre personnel.

4.2 PROCESSUS D'INSCRIPTION
• Création du compte avec email professionnel vérifié
• Validation des CGU et de la Politique de Confidentialité
• Vérification de l'identité pour les signatures avancées/qualifiées
• Activation du compte par l'Administrateur de l'Organisation

4.3 OBLIGATIONS DE L'UTILISATEUR
L'Utilisateur s'engage à :
• Fournir des informations exactes, complètes et à jour
• Maintenir la confidentialité stricte de ses identifiants
• Ne pas partager son compte avec des tiers
• Signaler immédiatement toute utilisation non autorisée
• Utiliser une adresse email professionnelle valide

4.4 RESPONSABILITÉ
L'Utilisateur est seul responsable de l'utilisation faite de son compte et des actions effectuées sous ses identifiants. ATLAS-STUDIO ne saurait être tenue responsable d'un accès non autorisé résultant d'une négligence de l'Utilisateur.`
      },
      {
        title: 'Article 5 - Signature électronique - Cadre juridique',
        content: `5.1 VALEUR JURIDIQUE
Conformément à l'Article 25 du Règlement eIDAS et à l'Article 82-1 de l'Acte Uniforme OHADA :
• La signature électronique qualifiée a un effet juridique équivalent à celui d'une signature manuscrite
• La signature électronique ne peut être refusée comme preuve en justice au seul motif qu'elle se présente sous forme électronique

5.2 PROCESSUS DE SIGNATURE
Le processus de signature ADVIST garantit :
• L'identification du signataire (authentification forte)
• Le lien univoque avec le document signé (empreinte SHA-256)
• L'intégrité du document (scellement cryptographique)
• L'horodatage qualifié (source de temps certifiée)
• La non-répudiation (piste d'audit complète)

5.3 CERTIFICAT DE SIGNATURE
Chaque signature génère un certificat contenant :
• Identité du signataire et méthode de vérification
• Date et heure exactes (horodatage RFC 3161)
• Empreinte cryptographique du document
• Chaîne de certification et validité
• Preuves de consentement (audit trail)

5.4 CONSERVATION DES PREUVES
Les preuves de signature sont conservées pendant 10 ans minimum, conformément aux obligations légales de conservation des écrits électroniques.

5.5 REFUS DE SIGNATURE
Le signataire peut refuser de signer un document. Ce refus est tracé et notifié à l'expéditeur.`
      },
      {
        title: 'Article 6 - Obligations et responsabilités de l\'utilisateur',
        content: `6.1 USAGE CONFORME
L'Utilisateur s'engage à utiliser le Service conformément à :
• Sa destination (gestion documentaire et signature électronique)
• La législation en vigueur (notamment RGPD, eIDAS, OHADA)
• Les présentes CGU et la Politique de Confidentialité
• Les droits des tiers

6.2 INTERDICTIONS
Il est strictement interdit de :
• Utiliser le Service à des fins illicites ou frauduleuses
• Usurper l'identité d'un tiers pour signer un document
• Uploader des contenus illicites, diffamatoires ou portant atteinte aux droits de tiers
• Tenter de contourner les mesures de sécurité
• Effectuer du reverse engineering ou décompiler le Service
• Utiliser des robots, scrapers ou outils d'extraction automatisée
• Surcharger intentionnellement l'infrastructure (attaques DDoS)

6.3 CONTENUS UPLOADÉS
L'Utilisateur garantit détenir tous les droits nécessaires sur les documents uploadés et dégage ATLAS-STUDIO de toute responsabilité concernant leur contenu.

6.4 SANCTIONS
En cas de violation des présentes obligations, ATLAS-STUDIO se réserve le droit de :
• Suspendre temporairement l'accès au compte
• Résilier le compte sans préavis ni indemnité
• Engager des poursuites judiciaires le cas échéant`
      },
      {
        title: 'Article 7 - Tarification et paiement',
        content: `7.1 FORMULES D'ABONNEMENT
Les tarifs en vigueur sont disponibles sur la page Tarifs du site. Les formules incluent :
• Gratuit : Usage personnel limité
• Starter : Petites équipes (jusqu'à 5 utilisateurs)
• Business : Entreprises (jusqu'à 25 utilisateurs)
• Enterprise : Sur mesure (utilisateurs illimités)

7.2 MODALITÉS DE PAIEMENT
• Facturation mensuelle ou annuelle (17% de réduction)
• Paiement par carte bancaire (Visa, Mastercard) ou virement
• Prélèvement automatique pour les abonnements
• Facturation émise et disponible dans l'espace client

7.3 RÉVISION DES TARIFS
ATLAS-STUDIO se réserve le droit de modifier ses tarifs. Les Utilisateurs seront informés 30 jours avant l'application des nouveaux tarifs. Les tarifs en cours restent applicables jusqu'à l'échéance de l'abonnement.

7.4 RETARD DE PAIEMENT
En cas de retard de paiement :
• Rappel automatique à J+7
• Mise en demeure à J+15
• Suspension du service à J+30 (les documents restent accessibles en lecture seule)
• Résiliation automatique à J+60

Pénalités de retard : 3 fois le taux d'intérêt légal + indemnité forfaitaire de 40€ pour frais de recouvrement.`
      },
      {
        title: 'Article 8 - Propriété intellectuelle',
        content: `8.1 DROITS D'ATLAS-STUDIO
ATLAS-STUDIO est titulaire de l'ensemble des droits de propriété intellectuelle relatifs à :
• La plateforme ADVIST (code source, architecture, algorithmes)
• La marque ADVIST® et les éléments graphiques associés
• La documentation et les contenus éditoriaux
• Les bases de données et leur structure

8.2 LICENCE D'UTILISATION
ATLAS-STUDIO concède à l'Utilisateur une licence d'utilisation non exclusive, personnelle, non transférable et non cessible, pour la durée de l'abonnement, limitée aux fonctionnalités souscrites.

8.3 CONTENUS UTILISATEUR
L'Utilisateur conserve l'intégralité de ses droits sur les documents uploadés. Il concède à ATLAS-STUDIO une licence limitée permettant le traitement technique nécessaire à la fourniture du Service (stockage, affichage, transmission).

8.4 RETOUR D'EXPÉRIENCE
Les suggestions d'amélioration soumises par les Utilisateurs peuvent être librement utilisées par ATLAS-STUDIO sans contrepartie.`
      },
      {
        title: 'Article 9 - Limitation de responsabilité',
        content: `9.1 OBLIGATION DE MOYENS
ATLAS-STUDIO est soumise à une obligation de moyens. Elle s'engage à mettre en œuvre les ressources nécessaires pour assurer la qualité et la continuité du Service.

9.2 EXCLUSIONS DE RESPONSABILITÉ
ATLAS-STUDIO ne saurait être tenue responsable :
• Des dommages indirects (perte de chiffre d'affaires, préjudice commercial, perte de données utilisateur)
• Des interruptions temporaires pour maintenance ou mise à jour
• Des dysfonctionnements liés à l'environnement technique de l'Utilisateur
• Des contenus uploadés par les Utilisateurs
• De l'utilisation frauduleuse par un tiers ayant obtenu les identifiants de l'Utilisateur
• Des cas de force majeure (Art. 1218 du Code Civil)

9.3 PLAFOND D'INDEMNISATION
En tout état de cause, la responsabilité contractuelle d'ATLAS-STUDIO est limitée au montant des sommes effectivement versées par l'Utilisateur au cours des 12 mois précédant le fait générateur.

9.4 DÉLAI DE RÉCLAMATION
Toute réclamation doit être formulée dans un délai de 30 jours suivant la survenance du fait générateur, par email à support@advist.com.`
      },
      {
        title: 'Article 10 - Durée et résiliation',
        content: `10.1 DURÉE
Les présentes CGU sont conclues pour la durée de l'abonnement souscrit, renouvelable par tacite reconduction sauf dénonciation.

10.2 RÉSILIATION PAR L'UTILISATEUR
L'Utilisateur peut résilier son abonnement à tout moment depuis son espace personnel :
• Effet : Fin de la période d'abonnement en cours
• Accès maintenu jusqu'à l'échéance
• Export des données disponible pendant 30 jours

10.3 RÉSILIATION PAR ATLAS-STUDIO
ATLAS-STUDIO peut résilier l'accès :
• Pour non-paiement : Après mise en demeure restée infructueuse 15 jours
• Pour violation des CGU : Résiliation immédiate en cas de violation grave, avec préavis de 8 jours sinon
• Pour cessation d'activité : Préavis de 3 mois

10.4 EFFETS DE LA RÉSILIATION
À la résiliation :
• Accès à la plateforme désactivé
• Données exportables pendant 30 jours
• Conservation des documents signés pendant 10 ans (obligation légale)
• Facturation au prorata pour les abonnements annuels (hors résiliation pour faute)`
      },
      {
        title: 'Article 11 - Protection des données personnelles',
        content: `Le traitement des données personnelles est régi par notre Politique de Confidentialité, accessible à l'adresse /legal/privacy et faisant partie intégrante des présentes CGU.

ATLAS-STUDIO s'engage à respecter le Règlement (UE) 2016/679 (RGPD) et la loi ivoirienne n°2013-450 sur la protection des données.

Pour toute question relative à vos données personnelles, contactez notre DPO : dpo@advist.com`
      },
      {
        title: 'Article 12 - Dispositions générales',
        content: `12.1 INTÉGRALITÉ
Les présentes CGU, la Politique de Confidentialité et les éventuelles Conditions Particulières constituent l'intégralité de l'accord entre les parties.

12.2 NULLITÉ PARTIELLE
Si une clause des présentes CGU est déclarée nulle, les autres clauses conservent leur pleine validité.

12.3 TOLÉRANCE
Le fait pour ATLAS-STUDIO de ne pas se prévaloir d'une clause ne vaut pas renonciation à s'en prévaloir ultérieurement.

12.4 CESSION
L'Utilisateur ne peut céder ses droits et obligations sans accord préalable écrit d'ATLAS-STUDIO. ATLAS-STUDIO peut librement céder le contrat en cas de restructuration.

12.5 DROIT APPLICABLE
Les présentes CGU sont régies par le droit ivoirien, sans préjudice des dispositions impératives du pays de résidence de l'Utilisateur consommateur.

12.6 RÈGLEMENT DES LITIGES
• Réclamation préalable : support@advist.com (réponse sous 15 jours)
• Médiation : Médiateur de la consommation désigné sur demande
• Juridiction compétente : Tribunaux d'Abidjan (Côte d'Ivoire)

Pour les consommateurs européens : Plateforme de règlement en ligne des litiges (RLL) : https://ec.europa.eu/consumers/odr

12.7 CONTACT
ATLAS-STUDIO SARL
Plateau, Rue du Commerce, Immeuble CCIA
Abidjan, Côte d'Ivoire
Email : legal@advist.com
Téléphone : +225 01 02 03 04 05`
      }
    ]
  }
};

type LegalType = 'mentions' | 'privacy' | 'cgu';

export const LegalPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const content = legalContent[type as LegalType];

  if (!content) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">Page non trouvée</h1>
          <Link to="/" className="text-primary-900 hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-primary-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-900 to-primary-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="font-decorative text-2xl text-primary-900">Advist</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-primary-200 overflow-hidden">
          {/* Title */}
          <div className="bg-gradient-to-r from-primary-900 to-primary-800 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{content.title}</h1>
                <p className="text-primary-400 text-sm mt-1">Dernière mise à jour : {content.lastUpdate}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="p-8 space-y-8">
            {content.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-lg font-semibold text-primary-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-sm text-primary-500">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="text-primary-600 whitespace-pre-line pl-8 leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-primary-50 px-8 py-6 border-t border-primary-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-primary-500">
                Pour toute question, contactez-nous à{' '}
                <a href="mailto:legal@advist.com" className="text-primary-900 hover:underline">
                  legal@advist.com
                </a>
              </p>
              <div className="flex gap-4 text-sm">
                {Object.entries(legalContent).map(([key, value]) => (
                  <Link
                    key={key}
                    to={`/legal/${key}`}
                    className={`text-primary-500 hover:text-primary-900 transition-colors ${
                      type === key ? 'font-semibold text-primary-900' : ''
                    }`}
                  >
                    {value.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
