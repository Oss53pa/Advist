# Advist ↔ Atlas Studio Suite — Integration Contract

This document describes how Advist integrates with the Atlas Studio Suite
universal platform. Atlas Studio owns identity, subscription, plan and
seat/role management. Advist consumes these as a tenant application.

## 1. Source of truth — what lives where

| Concern | Owner | Storage |
|---|---|---|
| User authentication | Atlas Studio | `auth.users` (Supabase) + `licence_seats.user_id` |
| Tenant / organization | Atlas Studio | `licence_seats.tenant_id` (Atlas Studio mirrors into `profiles.organization_id` via SSO) |
| Subscription / plan | Atlas Studio | `licences.plan_id` → `plans.*` |
| Plan features matrix | Atlas Studio | `plans.features` (jsonb), `plan_features` |
| Seat / role | Atlas Studio | `licence_seats.role` (`app_super_admin` / `app_admin` / `editor` / `viewer`) |
| Billing / invoices | Atlas Studio | `subscriptions`, `invoices`, `subscription_addons`, `addons` |
| App-specific data | Advist | `documents`, `workflows`, `signatures`, etc. |

**Advist NEVER writes to Atlas Studio universal tables.** It only reads.

## 2. SSO flow — atlas-sso Edge Function

```
[Atlas Studio Portal] --HMAC-signed JWT--> /auth?token=<jwt>
                                              │
                                              ▼
                                       atlas-sso Edge Function
                                              │
                            ┌─────────────────┴─────────────────┐
                            │ 1. verifyAtlasJWT(token, SECRET)  │
                            │ 2. Find/create auth.users row     │
                            │ 3. Find/create profiles row       │
                            │ 4. Mirror plan into app_metadata  │
                            │ 5. Generate magic-link token_hash │
                            └─────────────────┬─────────────────┘
                                              ▼
                                       Frontend verifyOtp
                                              │
                                              ▼
                                  Session established → /admin or /user
                                  (computed from licence_seats.role)
```

### Required JWT claims (signed by Atlas Studio with shared `JWT_SECRET`)

| Claim | Type | Required | Notes |
|---|---|---|---|
| `userId` | string (UUID) | **yes** | Atlas Studio user identifier |
| `email` | string | **yes** | becomes the Supabase auth email |
| `fullName` | string | **yes** | display name |
| `appId` | string | **yes** | must equal `"advist"` |
| `plan` | string | optional | plan slug (e.g. `business`, `enterprise`); if present, mirrored to `auth.users.app_metadata.advist_plan` as a UI hint. The authoritative plan still comes from `licences.plan_id → plans.name` queried at runtime. |
| `iat` / `exp` | number | **yes** | standard JWT timestamps |

### What atlas-sso does NOT do (and why)

- **Does not create roles** — Atlas Studio provisions the buyer as
  `app_super_admin` directly in `licence_seats` before the SSO redirect.
- **Does not create organizations** — done by Atlas Studio when the tenant
  signs up.
- **Does not create subscriptions** — billing flows happen on
  `atlas-studio.org`. Stripe / CinetPay webhooks are received by Atlas
  Studio, not Advist.

## 3. Frontend reads (from Atlas Studio)

### Role / access control
```ts
// src/services/postLoginRoute.ts
const { data } = await supabase
  .from('licence_seats')
  .select('role')
  .eq('user_id', userId)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
// role ∈ {'app_super_admin', 'app_admin', 'editor', 'viewer'}
```

### Plan / features / quotas
```ts
// src/services/features.ts
const { data: seat } = await supabase
  .from('licence_seats')
  .select('licence_id, tenant_id, licences(*, plans(*))')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

const plan = seat?.licences?.plans?.name;
const features = seat?.licences?.plans?.features ?? {};
const expiresAt = seat?.licences?.expires_at;
```

### Database function — RLS gate
```sql
-- public.is_org_admin() reads from licence_seats.role
-- Used in dozens of RLS policies across the schema.
SELECT EXISTS (
  SELECT 1 FROM public.licence_seats ls
  WHERE ls.user_id = auth.uid()
    AND ls.status = 'active'
    AND ls.role IN ('app_super_admin', 'app_admin')
);
```

## 4. What Advist removed (alignment phases 1 → 3.5)

- ❌ Self-service registration (`/signup`, `/register`) → redirects to
  `https://atlas-studio.org/portal/signup`
- ❌ Self-service checkout (`/checkout`) → redirects to
  `https://atlas-studio.org/applications/advist`
- ❌ "Choose your profile" page (`/select-profile`) — role auto-resolved
  from `licence_seats.role` post-login
- ❌ Super-admin billing pages (`/superadmin/billing`, `/superadmin/pricing`,
  `/superadmin/addons`) → all redirect to Atlas Studio portal
- ❌ Legacy Enterprise license activation (`/activate-license`) → redirects
- ❌ Edge Functions `start-trial`, `create-checkout`, `stripe-webhook`
  (deleted — Atlas Studio handles all billing webhooks)
- ❌ Tables `subscription_plans`, `payments`, `billing_history`, `roles`,
  `user_roles`, `role_permissions`, `profiles.role_id` (dropped via
  migration `00033_drop_advist_legacy_billing_and_roles.sql`)

## 5. Tables KEPT (shared with Atlas Studio)

These look "billing" but are Atlas Studio universal:
- `subscriptions` (`solution_id`, `app_id`, `mrr_fcfa`, `is_granted`)
- `subscription_addons` (FK to Atlas Studio `subscriptions` and `addons`)
- `addons` (Atlas Studio addon catalog)
- `invoices` (`tenant_id`, `app_id`, `cinetpay_transaction_id`)
- `licences`, `licence_seats`, `licence_activations`, `licence_audit_log`
- `plans`, `products`, `plan_features`

**Do not drop any of these from Advist.** They are managed by Atlas Studio.
