# Checklist QA — Déploiement Preview

Validation guidée des parcours critiques **avant merge sur `main` et passage en production**.

- **Branche** : `feat/proph3t-core-integration`
- **Preview** : `<URL Vercel du dernier commit>`
- **Backend** : Supabase mutualisé (production) — projet `vgtmljfayiysuvrcmunt`
- **Licence** : `VITE_ENFORCE_LICENCE` = actif (mettre à `false` pour désactiver le blocage en secours)

> **Version interactive** (cases + verdict Go/No-Go automatique) :
> https://claude.ai/code/artifact/92f14e67-c396-49b4-8717-8754cf7bcd57

## Sévérité

| Tag | Sens |
|-----|------|
| **[B]** Bloquant | Doit être vert pour envisager la production. |
| **[M]** Majeur | À corriger avant prod, non bloquant pour la QA. |
| **[m]** Mineur | Finition / confort. |

**Verdict Go/No-Go** : un seul **[B]** en échec ⇒ **NO-GO**. Tous les **[B]** verts ⇒ **candidat prod** (traiter ensuite majeurs, mineurs et points non testables en preview).

---

## 01 · Pré-requis
Réunir de quoi exercer les deux chemins d'accès. Sans ces comptes, l'enforcement de licence ne peut pas être validé.

- [ ] **[B] P1 — Accéder à la preview du dernier commit**
  - _Action_ : ouvrir l'URL de déploiement Vercel de la branche.
  - _Attendu_ : l'app charge, aucune page blanche, aucune erreur bloquante en console.
- [ ] **[B] P2 — Disposer d'un compte AVEC siège Advist**
  - _Action_ : utiliser un compte dont le siège a été provisionné (ex. l'admin propriétaire).
  - _Attendu_ : le compte existe et peut se connecter.
- [ ] **[M] P3 — Disposer d'un compte SANS siège**
  - _Action_ : un compte authentifiable mais sans siège Advist actif (ex. un compte démo révoqué).
  - _Attendu_ : le compte existe pour tester le blocage de licence.

## 02 · Authentification & Licence
Vérifie le wrapper `LicensedRoute` rebranché ce cycle. C'est le contrôle d'accès jamais testé en runtime — à exercer en priorité.

- [ ] **[B] A1 — Connexion d'un compte AVEC siège**
  - _Action_ : se connecter avec le compte P2, aller sur `/user`.
  - _Attendu_ : accès accordé au tableau de bord, pas de redirection.
- [ ] **[B] A2 — Connexion d'un compte SANS siège**
  - _Action_ : se connecter avec le compte P3.
  - _Attendu_ : redirection vers `/activate-license` ; l'app n'est pas accessible.
- [ ] **[B] A3 — Superadmin non bloqué**
  - _Action_ : se connecter en superadmin.
  - _Attendu_ : accès complet même sans logique de siège (exemption plateforme).
- [ ] **[M] A4 — Pas de flash ni de boucle**
  - _Action_ : recharger plusieurs fois une page en session valide.
  - _Attendu_ : un loader bref au plus ; jamais de clignotement de blocage ni de boucle de redirection.

## 03 · Cycle de vie documentaire
La création de documents était **100 % cassée** en base (triggers obsolètes, corrigés migrations 00035–00037). C'est le test de non-régression le plus important.

- [ ] **[B] D1 — Créer un document**
  - _Action_ : nouveau document (import ou création), renseigner un titre, enregistrer.
  - _Attendu_ : succès, aucune erreur serveur (ex-`42703 « column does not exist »`).
- [ ] **[B] D2 — Le document apparaît dans la liste**
  - _Action_ : revenir à la liste des documents.
  - _Attendu_ : le document créé est présent avec son statut.
- [ ] **[M] D3 — Consulter / éditer**
  - _Action_ : ouvrir le document, modifier le titre, enregistrer.
  - _Attendu_ : aperçu correct, modification persistée.
- [ ] **[m] D4 — Supprimer (hors rétention)**
  - _Action_ : supprimer un document non soumis à rétention légale.
  - _Attendu_ : suppression OK ; un document sous rétention verrouillée reste, lui, protégé.

## 04 · Workflows de validation
Circuit d'approbation multi-étapes sur un document.

- [ ] **[B] W1 — Lancer un workflow**
  - _Action_ : démarrer un circuit de validation sur un document.
  - _Attendu_ : le workflow se crée et s'affiche comme actif.
- [ ] **[M] W2 — Étapes & décisions**
  - _Action_ : parcourir les étapes, approuver / rejeter en tant qu'assigné.
  - _Attendu_ : les transitions d'étape et l'état final sont cohérents.

## 05 · Signature & OTP
Fonction `verify-signer-otp` v11 déployée (HMAC, comparaison à temps constant, code retiré de l'objet du mail). Chemins send/verify négatifs déjà validés côté DB ; ici on valide le parcours utilisateur.

- [ ] **[B] S1 — Demander une signature externe**
  - _Action_ : inviter un signataire externe sur un document.
  - _Attendu_ : le signataire reçoit un lien ; un enregistrement de vérification est créé.
- [ ] **[B] S2 — OTP : objet de mail sans code**
  - _Action_ : consulter l'email d'OTP reçu.
  - _Attendu_ : l'objet ne contient **pas** le code (il est dans le corps du message uniquement).
- [ ] **[B] S3 — OTP : validation & verrouillage**
  - _Action_ : saisir un code correct ; puis, sur une autre demande, 3 codes faux.
  - _Attendu_ : code correct → validé. 3 faux → verrouillage (anti-brute-force).
- [ ] **[B] S4 — Signer & sceller**
  - _Action_ : finaliser la signature après vérification d'identité.
  - _Attendu_ : signature enregistrée, sceau d'intégrité (hash) généré.
- [ ] **[B] S5 — Vérification publique `/verify`**
  - _Action_ : ouvrir `/verify` et saisir le code d'intégrité du document signé.
  - _Attendu_ : document reconnu authentique, informations de signature affichées.
- [ ] **[M] S6 — Fichier verrouillé après signature**
  - _Action_ : tenter de remplacer le fichier d'un document déjà signé.
  - _Attendu_ : refus (`INTEGRITY_LOCK`) — le fichier ne peut plus changer.

## 06 · Audit & conformité
Piste d'audit reconstruite ce cycle sur `advist_audit_logs` (org-scopée, immuable, chaînée SHA-256). Writer et lecteurs réalignés.

- [ ] **[B] C1 — Les événements sont journalisés**
  - _Action_ : après création de document / signature, ouvrir la page Audit (admin).
  - _Attendu_ : les événements apparaissent (action, ressource, utilisateur, horodatage).
- [ ] **[M] C2 — Historique d'un document**
  - _Action_ : ouvrir l'historique de validation d'un document.
  - _Attendu_ : les événements de ce document sont listés dans l'ordre.
- [ ] **[m] C3 — Immuabilité (pas d'édition)**
  - _Action_ : vérifier qu'aucune UI ne permet de modifier / supprimer une ligne d'audit.
  - _Attendu_ : l'audit est en lecture seule (immuabilité garantie côté base).

## 07 · Sécurité & isolation
La clé anon est publique : la RLS est la seule frontière. À exercer avec deux organisations distinctes si possible.

- [ ] **[B] X1 — Cloisonnement inter-organisations**
  - _Action_ : avec un utilisateur de l'org A, tenter d'accéder aux documents / audit de l'org B.
  - _Attendu_ : aucune donnée d'une autre organisation n'est visible.
- [ ] **[M] X2 — Fuite de preuve de signature**
  - _Action_ : sur `/verify` (accès anonyme), inspecter la réponse réseau.
  - _Attendu_ : seules les colonnes attendues sortent ; aucun hash d'OTP, email ou IP de signataire.

## 08 · Transverse
Cohérence visuelle et robustesse générale.

- [ ] **[m] T1 — Thème Ivoire & Laiton cohérent**
  - _Action_ : parcourir dashboard, documents, landing.
  - _Attendu_ : palette ivoire/laiton homogène, aucun résidu de thème clair sur fond sombre.
- [ ] **[m] T2 — Internationalisation**
  - _Action_ : basculer FR / EN / AR (RTL).
  - _Attendu_ : pas de casse de mise en page majeure, RTL correct.
- [ ] **[m] T3 — Console & réseau propres**
  - _Action_ : ouvrir la console navigateur pendant la navigation.
  - _Attendu_ : aucune erreur bloquante ni requête en échec sur les parcours nominaux.
- [ ] **[m] T4 — Responsive**
  - _Action_ : tester en mobile et desktop.
  - _Attendu_ : mise en page utilisable aux deux tailles.

---

## ⚠ Non testable en preview — à valider en staging/prod

- **Flux SSO Atlas Studio complet** — inscription, tarifs, checkout et facturation redirigent vers le portail Atlas ; le retour de session dépend de l'environnement.
- **Envoi d'email réel** (OTP, invitations) — dépend de la clé Resend configurée sur la preview ; à défaut, vérifier le déclenchement côté logs.
- **Promotion production** — la prod déploie depuis `main` : rien de cette branche n'est en prod tant que merge + promotion Vercel ne sont pas faits.

## Verdict

- [ ] **Tous les tests [B] verts** → candidat production
- [ ] Majeurs [M] traités ou arbitrés
- [ ] Points « non testables en preview » planifiés pour staging/prod
