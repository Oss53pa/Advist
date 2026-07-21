# Audit 360° — Advist

**Date :** 2026-07-21 · **Branche :** `feat/proph3t-core-integration` · **Commit :** `e12556c`
**Périmètre :** code, sécurité, design UI/UX, intégrations, commercial

> ✅ **CRIT-1 corrigé et vérifié en production** le 2026-07-21 (migration `00034`).
> L'exploit décrit ci-dessous n'est plus reproductible — voir § 7 pour les preuves de correction.

---

## 0. Synthèse exécutive

Advist est une application mature : **330 fichiers TS/TSX, ~115 000 lignes**, build qui passe,
`tsc --noEmit` propre, 0 erreur ESLint, i18n sur 5 langues, PWA + service worker, 33 migrations SQL.
La base technique est sérieuse.

Mais l'audit révèle **une faille critique qui casse la promesse centrale du produit** (la valeur
probante de la signature électronique), et un **écart entre les allégations commerciales et
l'implémentation réelle**.

| # | Sévérité | Domaine | Sujet | Statut |
|---|----------|---------|-------|--------|
| CRIT-1 | 🔴 Critique | Sécurité | `anon` peut lire/modifier les vérifications de signataires (bypass OTP + fuite PII) | ✅ **corrigé + vérifié en prod** |
| CRIT-2 | 🔴 Critique | Commercial/Légal | « Certifié eIDAS » affiché alors que l'intégration QTSP n'existe pas | ✅ **corrigé** (UI + 4 locales) |
| MAJ-1 | 🟠 Majeur | Sécurité | 189 fonctions `SECURITY DEFINER` exécutables par `anon` (base mutualisée) | ⏳ à traiter au niveau org |
| MAJ-2 | 🟠 Majeur | A11y | Boutons à icône seule sans nom accessible | ✅ **24 → 9** + ESLint a11y actif |
| MAJ-3 | 🟠 Majeur | Commercial | Chiffres de preuve sociale contradictoires (2 500+ vs 500+) | ✅ **harmonisé à 500+** |
| MAJ-4 | 🟠 Majeur | Code | Couverture de tests quasi nulle (12 fichiers pour 330) | ⏳ backlog |
| MIN-1 | 🟡 Mineur | Perf | `vendor-pdf` : 1 036 kB (215 kB brotli) | ⏳ backlog |
| MIN-2 | 🟡 Mineur | i18n | ar/es/pt bloqués à 1600 clés vs 2326 en fr (~31 % manquant) | ⏳ backlog |
| MIN-3 | 🟡 Mineur | Code | 175 `any`, 152 `console.*`, 37 TODO/FIXME, fichiers de 3 440 lignes | ⏳ backlog |
| BONUS | 🟡 Mineur | Build | Sélecteurs CSS sur-échappés (`.w-\\[595px\\]`) → styles d'impression inopérants | ✅ **corrigé** |
| BONUS | 🟡 Mineur | Tests | `logger.test.ts` : `_consoleSpy` déclaré / `consoleSpy` assigné | ✅ **corrigé (12 tests)** |

---

## 1. Sécurité

### 🔴 CRIT-1 — `anon` contrôle la table de vérification des signataires

**Fichier :** `supabase/migrations/00032_audit_immutability.sql:140-153`

```sql
CREATE POLICY "anon_select_signer_verifications" ON signer_verifications
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_signer_verifications" ON signer_verifications
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_select_signature_consents" ON signature_consents
  FOR SELECT TO anon USING (true);
```

La clé `anon` est publique par conception et **présente en clair dans le bundle JS**
(`src/lib/atlasErrorMonitor.ts:10`, `src/hooks/useLandingContent.ts:5`). Elle est donc connue de
tout visiteur. La RLS est par conséquent **l'unique frontière de sécurité** — et ici elle est ouverte.

**Contenu de la table** (`00026_signer_verifications.sql:19-56`) :
`signer_email`, `signer_name`, `signer_phone`, `otp_hash`, `attempts`, `max_attempts`,
`verified_at`, `status`, `ip_address`, `user_agent`.

**Trois impacts cumulés :**

1. **Fuite de PII de masse** — `SELECT USING(true)` expose e-mails, noms, téléphones, IP et
   user-agents de **tous les signataires de toutes les organisations**. Violation RGPD
   (art. 32/33) alors que le badge « RGPD » est affiché sur la landing.

2. **Bypass total de l'OTP par écriture** — `UPDATE USING(true) WITH CHECK(true)` permet :
   ```sql
   UPDATE signer_verifications SET status='verified', verified_at=now() WHERE id='<cible>';
   ```
   → identité « vérifiée » sans jamais connaître le code. Permet aussi de remettre `attempts` à 0
   (neutralise le verrouillage anti-brute-force géré par l'Edge Function).

3. **Bypass de l'OTP par cassage hors-ligne** — l'OTP fait **6 chiffres**
   (`supabase/functions/verify-signer-otp/index.ts:25`) et `otp_hash` est un **SHA-256 non salé**.
   Lisible via `anon`, l'espace de 10⁶ hachages se pré-calcule en quelques secondes → code en clair.

> **L'Edge Function `verify-signer-otp` est bien conçue (service_role, limitation des tentatives),
> mais elle est intégralement contournable : PostgREST expose la table en direct à `anon`.**

**Aggravation :** le fichier s'appelle `00032_audit_immutability.sql` et commente
`'Garantit l immutabilite de la piste d audit - Loi CI 2013-546'`, tout en accordant `UPDATE` à
`anon` sur la table de preuve. L'intention et l'implémentation sont contradictoires.

**Correctif proposé** — supprimer l'accès direct `anon` et router par l'Edge Function :

```sql
DROP POLICY IF EXISTS "anon_select_signer_verifications" ON signer_verifications;
DROP POLICY IF EXISTS "anon_update_signer_verifications" ON signer_verifications;
DROP POLICY IF EXISTS "anon_insert_signer_verifications" ON signer_verifications;
DROP POLICY IF EXISTS "anon_select_signature_consents"   ON signature_consents;
DROP POLICY IF EXISTS "anon_insert_signature_consents"   ON signature_consents;
-- service_role (Edge Function) conserve FOR ALL ; le client anon n'accède plus à la table.
REVOKE ALL ON signer_verifications, signature_consents FROM anon;
```

Durcissements complémentaires :
- Saler `otp_hash` (HMAC avec secret serveur) ou ne jamais l'exposer.
- Retirer le code OTP de l'**objet** de l'e-mail (`index.ts:134`) — visible en notification/écran
  verrouillé et journalisé par les relais SMTP.

**Vérification post-correctif :** rejouer `get_advisors(type: security)` → les entrées
`rls_policy_always_true` sur `signature_consents` / `signer_verifications` doivent disparaître.

---

### 🟠 MAJ-1 — Surface `SECURITY DEFINER` exposée à `anon`

`get_advisors` sur le projet live `vgtmljfayiysuvrcmunt` remonte **662 avertissements** :

| Nb | Règle |
|----|-------|
| 320 | `authenticated_security_definer_function_executable` |
| 189 | `anon_security_definer_function_executable` |
| 104 | `function_search_path_mutable` |
| 38 | `rls_enabled_no_policy` |
| 8 | `rls_policy_always_true` |
| 2 | `extension_in_public` (`vector`, `pg_net`) |
| 1 | `auth_insufficient_mfa_options` |

⚠️ **Nuance importante :** ce projet Supabase est **mutualisé** entre toutes les applications Atlas
Studio (préfixes `atlasbanx_`, `fna_`, `ap_portal_`, `cc_cj_`, `asvc_`…). La majorité de ces 662
alertes **ne relèvent pas d'Advist**. Le chiffre est à traiter au niveau de l'organisation, pas de
l'app. Les 104 `function_search_path_mutable` sont néanmoins un risque réel d'injection via
`search_path` sur des fonctions privilégiées.

**Note sur la mutualisation :** la base étant partagée, une faille dans une app sœur expose
potentiellement les données Advist. C'est un choix d'architecture à réévaluer pour un produit qui
vend de la conformité.

### ✅ Points sains

- **Pas de `service_role` côté client** — vérifié sur tout le dépôt, uniquement dans les `.sql`.
- **`.env` correctement ignoré** (`.gitignore:97`), seul `.env.example` est suivi.
- **XSS maîtrisé** — les 5 `dangerouslySetInnerHTML` passent **tous** par `sanitizeHtml()`
  (`src/utils/sanitize.ts`), DOMPurify avec allow-list stricte, `FORBID_TAGS` script/iframe/form,
  `rel="noopener noreferrer"` auto sur les liens externes. Bien fait.
- **RLS active sur toutes les tables `public` en production** — aucun `rls_disabled_in_public`.
  (Les 52 tables sans `ENABLE ROW LEVEL SECURITY` dans les fichiers de migration ont été activées
  hors migrations → **dérive migrations/production** à corriger pour la reproductibilité.)

---

## 2. Code

**Volumétrie :** 330 fichiers · 115 432 lignes · 139 composants · 92 pages · 46 services.

| Indicateur | Valeur | Avis |
|---|---|---|
| `tsc --noEmit` | ✅ 0 erreur | Excellent |
| ESLint | 0 erreur / 250 warnings | Bon |
| Tests unitaires | **12 fichiers / 330** | 🟠 Très faible |
| Tests e2e | 53 fichiers Playwright | ✅ Bon |
| `any` | 175 | 🟡 |
| `console.*` | 152 | 🟡 (retirés en prod via `drop_console`) |
| TODO/FIXME | 37 | 🟡 |

**🟠 MAJ-4 — Tests.** Aucun test ne couvre les services critiques : `signerOtpService`,
`signatureService`, `signatureConsentService`, `qesService`, `exportDossierService`. Pour un produit
dont la valeur est la preuve juridique, c'est le principal risque de régression. Priorité : tester le
parcours OTP et le chaînage de hachage d'audit.

**🟡 MIN-3 — Fichiers monolithiques.** `SettingsPage.tsx` **3 440 lignes**, `DocumentsPage.tsx` 2 394,
`TenantsPage.tsx` 2 216, `DocumentDetailPage.tsx` 2 090. Difficiles à tester et à faire évoluer.

**Dette repérée en séance :** l'arbre de travail contient un refactor non committé de grande ampleur
(−8 457 lignes : suppression du système de gating/abonnement, `FeatureGate`, `plans.ts`,
`useTenantPlan`, `PricingSection`, `CheckoutPage`). À finaliser et committer avec son propre contexte.

---

## 3. Design & UI/UX

**Système de design :** solide. Tokens centralisés (`src/styles/theme.ts` + variables CSS), thème
**Ivoire & Laiton** désormais cohérent, police unique **Dosis**, dark mode présent.

### 🟠 MAJ-2 — Accessibilité

> ⚠️ **Correction de l'audit initial.** Les chiffres publiés en premiere passe
> (« 9 alt sur 45 », « 1 aria-label sur 1268 ») provenaient d'un `grep` mono-ligne qui ne voyait pas
> les attributs places sur les lignes suivantes du JSX. Mesure correcte ci-dessous, apres analyse
> multi-ligne des balises.

| Contrôle | Avant | Après correctifs | Norme |
|---|---|---|---|
| `<img>` sans `alt` | **0 / 45** ✅ | 0 / 45 | WCAG 1.1.1 ✅ |
| Boutons **icône seule sans nom** | **24 / 710** | **9 / 710** | WCAG 4.1.2 |
| Boutons avec `aria-label`/`title` | 45 | **60** | — |
| `jsx-a11y` (ESLint) | absent | **actif** | prévention |

Le vrai probleme n'etait donc pas les images (toutes correctement decrites) mais les **boutons a
icône seule** : 24 controles reellement muets pour un lecteur d'ecran, dont la barre d'outils de
signature et la visionneuse de documents — les deux ecrans les plus critiques du produit.

Les 9 restants sont : 2 faux positifs (`AiInsightCard`, libelle dynamique `{action.label}`),
1 primitive generique (`FloatingButton`, le nom incombe a l'appelant), 1 maquette decorative
(desormais `aria-hidden`), et 5 ecrans d'administration a faible trafic.

**Backlog restant remonte par ESLint** (en `warn`, non bloquant) : 182 `label-has-associated-control`,
81 `no-static-element-interactions`, 69 `click-events-have-key-events`.

C'est un risque commercial direct : les appels d'offres publics et grands comptes (cible OHADA/
institutionnel affichée) exigent fréquemment un niveau RGAA/WCAG AA.

**Correctif à faible coût / fort impact :** ajouter `aria-label` sur les boutons à icône,
`alt` sur les images, convertir les `<div onClick>` en `<button>`. Activer `eslint-plugin-jsx-a11y`
pour empêcher les régressions.

### Points positifs
- Support RTL réel (`html[dir='rtl']`) pour l'arabe.
- Styles d'impression A4 très travaillés.
- `:focus-visible` défini globalement.
- Contrastes corrigés explicitement (section « WCAG AA » dans `index.css`).

---

## 4. Intégrations & performance

**Stack :** React 18.3 · Vite 7 · Supabase JS 2.98 · React Router 7 · Zustand 5 · TanStack Query 5 ·
Sentry 10 · i18next 25 · Tailwind 3.4. Versions récentes et cohérentes.

**Bundle (brotli) :**

| Chunk | Brut | Brotli |
|---|---|---|
| `vendor-pdf` | 1 036 kB | **215 kB** |
| `index` | 577 kB | 122 kB |
| `vendor-react` | 189 kB | 53 kB |
| `SettingsPage` | 196 kB | 28 kB |
| CSS | 161 kB | 18 kB |

**🟡 MIN-1 —** `vendor-pdf` (html2pdf + html2canvas + jspdf) pèse à lui seul plus que tout le reste.
Vérifier qu'il est bien en `import()` dynamique et jamais chargé au démarrage. Envisager une
génération PDF côté serveur (Edge Function) pour supprimer ce poids du client.

**🟡 MIN-2 — i18n incomplet :** fr 2 326 · en 2 126 · **ar/es/pt bloqués à 1 600**. ~31 % de clés
manquantes sur 3 langues, et 200 manquantes en anglais — le fallback affichera du français à des
utilisateurs anglophones/hispanophones.

**Couplage Atlas Studio :** auth, facturation, pricing et inscription sont délégués à
`atlas-studio.org`. Conséquence constatée en session : **aucune page authentifiée n'est testable en
local** sans passer par le SSO externe. Cela ralentit le développement et empêche les tests e2e
autonomes sur les parcours connectés.

---

## 5. Commercial

### 🔴 CRIT-2 — « Certifié eIDAS » sans QTSP

La landing affiche :
- `HeroSection.tsx:477` — « **Signature certifiée eIDAS** »
- `FeaturesSection.tsx:177` — « valeur juridique, horodatage qualifié et **certificat eIDAS** »
- Badges `eIDAS`, `ISO 27001`, `RGPD`, `OHADA` (hero, CTA, footer)

Or le code documente lui-même l'inverse — `src/services/qesService.ts:7-9` :

> *« Actual QTSP (Qualified Trust Service Provider) integration will be handled via Edge Functions
> in **Phase 5**. This service currently manages the local certificate and session records. »*

Sous eIDAS, seule une **QTSP inscrite sur une liste de confiance UE** peut émettre une signature
qualifiée (QES). Sans elle, la signature relève au mieux du niveau *simple/avancé* — pas « certifiée ».

**Risques :** pratique commerciale trompeuse (dir. 2005/29/CE) ; **contestation de la valeur probante**
des contrats signés par les clients ; responsabilité en cas de litige. De même, afficher
« ISO 27001 » sans certificat d'audit valide est une allégation non soutenable.

**Recommandation :** aligner immédiatement le discours sur la réalité — « signature électronique
avancée », « conforme à la loi ivoirienne 2013-546 », « horodatage et piste d'audit chaînée » — et
réserver « eIDAS/QES » à l'après-intégration QTSP. Combiné à CRIT-1, la promesse de preuve est
aujourd'hui **techniquement et juridiquement fragile**.

### 🟠 MAJ-3 — Preuve sociale incohérente

Dans **le même composant**, à 38 lignes d'écart :
- `TrustedBySection.tsx:37` → « **+2 500 entreprises** nous font confiance »
- `TrustedBySection.tsx:75` → « **500+** ENTREPRISES »
- `HeroSection.tsx:150` → « **2 500+** entreprises satisfaites »

Contradiction visible par tout prospect attentif : cela détruit la crédibilité des autres chiffres
(99,9 % de disponibilité, 17 pays OHADA). **Choisir un chiffre unique, vérifiable, et l'harmoniser.**

**À vérifier également :** `TrustedBySection.tsx:4-15` code en dur, en fallback, des marques réelles
(Orange, Ecobank, NSIA, Société Générale, Total Energies, MTN, UBA, BSIC, Orabank, BIAO). Si ces
entreprises ne sont pas clientes et consentantes, leur affichage constitue un risque juridique
(fausse allégation d'endossement). Ce fallback s'affiche dès que la config distante est vide.

### Positionnement — les atouts

Le positionnement est **pertinent et différenciant** :
- **« 2 à 3× moins cher que DocuSign, conçu pour l'Afrique »** — angle prix + souveraineté crédible.
- **Conformité OHADA / loi CI 2013-546** — vrai fossé concurrentiel face aux acteurs US/EU.
- **Ancrage local** — FCFA, Mobile Money, WhatsApp Business, 17 pays OHADA, arabe supporté.
- **Piste d'audit chaînée SHA-256** (`compute_audit_hash`) — argument technique fort, réellement
  implémenté côté base.

Le produit a un vrai marché. Le risque n'est pas le positionnement, c'est **l'écart entre la promesse
affichée et l'implémentation** (CRIT-1 + CRIT-2), qui sur ce segment — la confiance — est l'actif
le plus difficile à reconstruire après un incident.

---

## 6. Plan d'action priorisé

**Immédiat (avant tout nouveau déploiement)**
1. **CRIT-1** — supprimer les policies `anon` sur `signer_verifications` / `signature_consents`,
   `REVOKE` les droits, forcer le passage par l'Edge Function. Rejouer `get_advisors`.
2. **CRIT-2** — retirer « certifié eIDAS » et « ISO 27001 » de la landing tant que non acquis.
3. Sortir le code OTP de l'objet des e-mails ; saler `otp_hash`.

**Court terme (2–4 semaines)**
4. **MAJ-3** — harmoniser les chiffres ; valider juridiquement les logos clients.
5. **MAJ-2** — `aria-label` sur les boutons à icône, `alt` sur les images, `<div onClick>` → `<button>`,
   activer `eslint-plugin-jsx-a11y`.
6. **MAJ-4** — tests sur `signerOtpService`, `signatureService`, chaînage d'audit.
7. Resynchroniser les migrations avec la production (les 52 tables à RLS implicite).

**Moyen terme**
8. Corriger les 104 `function_search_path_mutable` (`SET search_path = ''`).
9. Compléter ar/es/pt (~700 clés) et en (~200).
10. Vérifier le lazy-load de `vendor-pdf` ; envisager le PDF côté serveur.
11. Découper `SettingsPage` (3 440 l.) et `DocumentsPage` (2 394 l.).
12. Réévaluer la base Supabase mutualisée pour un produit vendu sur la conformité.

---

## 7. Correctifs appliqués — preuves

### CRIT-1 — vérifié en production (projet `vgtmljfayiysuvrcmunt`)

Migration `00034_fix_anon_signature_evidence_rls.sql`. Sondes PostgREST avec la clé `anon`
publique, `limit=0` (aucune donnée extraite) :

| Sonde | Avant | Après |
|---|---|---|
| `SELECT otp_hash` | **HTTP 200** ❌ | `42501 permission denied` ✅ |
| `SELECT signer_email, signer_phone` | **HTTP 200** ❌ | `42501 permission denied` ✅ |
| `SELECT ip_address` | **HTTP 200** ❌ | `42501 permission denied` ✅ |
| `PATCH status='verified'` (bypass OTP) | ouvert ❌ | `42501 permission denied` ✅ |
| `INSERT signer_verifications` | ouvert ❌ | `42501 permission denied` ✅ |
| `SELECT signature_consents` | **HTTP 200** ❌ | `42501 permission denied` ✅ |
| `SELECT` colonnes /verify (non régression) | 200 | **200** ✅ |
| `INSERT` consentement (non régression) | — | refus par **policy** (doc inexistant) ✅ |

`pg_policies` après correctif : plus aucune policy `anon` en `USING(true)`. Les seules policies
`true` restantes sont `service_role` (comportement attendu).

**Note :** la table `signer_verifications` était **vide** (`Content-Range: */0`) au moment du
correctif — aucune donnée personnelle n'a donc été exposée. La correction est préventive.

### Durcissement OTP — `supabase/functions/verify-signer-otp/index.ts`
- `SHA-256` nu → **HMAC-SHA256** clé serveur (`OTP_HASH_SECRET`, repli sur la service-role key :
  aucune configuration requise). Le pré-calcul des 10⁶ codes devient impossible sans le secret.
- Comparaison **à temps constant** (`timingSafeEqual`).
- `generateOTP()` : **rejection sampling** (supprime le biais modulo de `uint32 % 10⁶`).
- Le code OTP **ne figure plus dans l'objet** de l'e-mail.

⚠️ **À déployer** (`supabase functions deploy verify-signer-otp`) — non déployé automatiquement car
non testable de bout en bout ici. Le vecteur urgent est déjà neutralisé côté RLS ; ceci est de la
défense en profondeur. Faire un test OTP réel avant mise en service de la signature externe.

### CRIT-2 — allégations alignées sur la réalité
- « Signature certifiée eIDAS » → « Signature électronique avancée »
- « horodatage qualifié et certificat eIDAS » → « horodatage serveur et piste d'audit chaînée SHA-256 »
- Badges `eIDAS` / `ISO 27001` → `OHADA` / `Loi CI 2013-546` / `RGPD` / `Audit SHA-256`
  (hero, CTA, footer)
- 15 chaînes corrigées dans `fr/en/es/pt`.

**Volontairement non modifié :**
- `iso27001.*` — c'est le **module produit** de gestion des 93 contrôles de l'Annexe A pour les
  clients, pas une auto-certification d'Advist.
- `qes.*` (`qualifiedCertificate`, `legalValue`, `securityNote`, texte de consentement) — **texte
  juridiquement contraignant**. À faire réécrire par un juriste, pas par un correctif automatique.
  Ces chaînes affirment toujours une équivalence eIDAS : **à traiter avant toute mise en service
  du parcours QES**.

### Reste à faire (priorisé)
1. Déployer l'Edge Function OTP + test de bout en bout.
2. Faire valider les chaînes `qes.*` par un juriste.
3. Confirmer le chiffre réel d'entreprises clientes (harmonisé à 500+ par prudence) et vérifier
   l'accord des marques citées en fallback dans `TrustedBySection.tsx:4-15`.
4. Tests sur `signerOtpService` / `signatureService` / chaînage d'audit.
5. `Button.test.tsx` (10 échecs) : les tests attendent des classes tokens (`bg-advist-gray900`)
   que le composant n'utilise pas — antérieur à cette session, à arbitrer (aligner le composant
   sur les tokens serait cohérent avec MIN-3).
