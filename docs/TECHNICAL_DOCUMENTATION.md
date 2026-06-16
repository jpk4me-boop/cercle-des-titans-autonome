# Cercle des Titans — Documentation Technique (actuelle)

> Mise à jour : 17 juin 2026.
> Cette documentation reflète l'état **courant** du projet. La version historique
> de décembre 2024 reste consultable dans `KNOWLEDGE.md` (T=0) — elle est **dépassée**
> sur plusieurs points (rôles, tables tontine, routes, montants). Voir §12 « Écarts vs T=0 ».

---

## 1. Vue d'ensemble

**Cercle des Titans** est une application web de gestion de **tontine africaine** (épargne
rotative collective) : gestion de membres, rôles, cycles de tontine, catégories, cotisations
journalières, déclaration et validation de paiements, financement et messagerie.

Branding : « Titans » est le nom du projet/communauté. ⚠️ **« Titan » n'est pas une catégorie**
de cotisation.

---

## 2. Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling / UI** | Tailwind CSS + shadcn/ui (Radix) — thème dark/gold premium |
| **Routing** | React Router DOM v6 (BrowserRouter) |
| **State / data** | TanStack Query v5, services maison dans `src/services` & `src/lib` |
| **Backend / Auth / DB** | Supabase (PostgreSQL + RLS) via Lovable Cloud |
| **Auth** | Email/Mot de passe + OAuth (Google / GitHub), PKCE |
| **AI** | Assistant Titan (edge function `titan-assistant`) + `chat` (Lovable AI Gateway / Gemini) |
| **Email** | Resend API |
| **PWA** | `vite-plugin-pwa` (service worker, manifest) |
| **Build** | `npm run build` (Vite) · Typecheck `npm run typecheck` (`tsc --noEmit`) |

Projet Supabase de production : **`txllxnqcptegsgwkvzeb`** (« Cercle des Titans », région eu-central-1).

---

## 3. Rôles

Rôles **valides** (table `user_roles`) :

- `user`
- `admin`
- `super_admin`

⚠️ Le rôle **`member` n'existe pas / ne doit pas être utilisé**. La protection des routes
admin se fait via `RoleGuard` (`src/components/RoleGuard.tsx`).

---

## 4. Base de données

### 4.1 Tables historiques (cœur applicatif)

| Table | Description |
|-------|-------------|
| `profiles` | Profils (nom, email, téléphone, adresse, `recommended_category`) |
| `user_roles` | Rôles (`user` / `admin` / `super_admin`) |
| `contributions` | Ancienne table de cotisations (**ne pas modifier** — héritage) |
| `transactions` | Historique des paiements / reçus |
| `financing_requests` | Demandes de financement |
| `conversations`, `messages`, `conversation_participants` | Messagerie interne |

### 4.2 Module Tontine (ajouté en 2026)

Migration : `supabase/migrations/20260615173000_create_tontine_contributions_module.sql`.

| Table | Rôle | Notes |
|-------|------|-------|
| `tontine_categories` | Catégories/tiers de tontine | colonne montant : `daily_amount` |
| `member_tontine_categories` | **Adhésions** membre ↔ catégorie | *(c'est la table « memberships » — pas de table nommée `tontine_memberships`)* |
| `tontine_cycles` | Cycles de tontine | un seul `status='active'` à la fois (index partiel) |
| `payment_methods` | Moyens de paiement (Orange/MTN/Espèces/Virement) | |
| `tontine_contributions` | Cotisations journalières générées | statut `pending/partial/paid/overdue/cancelled` |
| `contribution_payments` | Paiements déclarés par les membres | statut `pending/partial/paid/rejected` + `admin_note` (motif rejet) |
| `contribution_reminders` | Rappels de cotisation | |

> **Cycles globaux** : il n'y a pas un cycle par catégorie. Les catégories portent le montant ;
> le cycle actif est commun. La génération journalière exige **exactement un** cycle actif.

### 4.3 RPC sécurisées (SECURITY DEFINER) — module tontine

| Fonction | Appelant | Sécurité clé |
|----------|----------|--------------|
| `member_select_tontine_category(p_category_id)` | membre | vérifie catégorie active, `auth.uid()` |
| `member_unselect_tontine_category(p_category_id)` | membre | n'agit que sur `auth.uid()` |
| `member_declare_tontine_payment(p_contribution_id, p_payment_method_id, p_amount, p_payment_reference, p_proof_url)` | membre | dérive `user_id/category_id/cycle_id` **depuis la cotisation** ; refuse une cotisation d'autrui |
| `admin_validate_tontine_payment(p_payment_id, p_status, p_admin_note)` | admin/super_admin | `validated_by = auth.uid()` (jamais envoyé par le front) ; recalcule le statut de la cotisation |
| `generate_daily_tontine_contributions(p_target_date)` | admin | échoue si 0 ou >1 cycle actif |
| `close_daily_tontine_contributions(p_target_date)` | admin | passe en `overdue` les cotisations impayées échues |
| `admin_list_members_enriched(...)` | admin | annuaire membres enrichi (catégories tontine) |

Autres RPC héritées : `has_role`, `create_transaction`, `submit_financing_request`,
`verify_transaction_by_reference`.

### 4.4 RLS — points notables

- `member_tontine_categories` : politiques **séparées** SELECT/INSERT/UPDATE/DELETE (pas de
  `FOR ALL` large qui affaiblirait l'INSERT). L'INSERT exige `auth.uid() = user_id` **et** catégorie active.
- `contribution_payments` : **pas** d'INSERT direct membre → passe par la RPC
  `member_declare_tontine_payment` (empêche d'attacher un paiement à la cotisation d'un autre).
- Lecture self-or-admin sur cotisations/paiements/rappels ; gestion complète pour admin/super_admin.

---

## 5. Parcours Tontine (membre ↔ admin)

```
Membre                          Admin / super_admin
──────                          ───────────────────
Rejoindre une catégorie  ──►    (génération des cotisations journalières)
   (cycle disponible)
Déclarer un paiement     ──►    Valider  ✔  / Rejeter ✖ (motif obligatoire)
   (statut: En attente)              │
                                     ▼
Voir statut + motif      ◄──    paid / rejected + admin_note
  (Validé / Rejeté)             (recalcul auto du statut de la cotisation)
Bouton « Actualiser »                Clôture des impayés (overdue)
```

### Côté membre — `src/components/member/MemberTontinePanel.tsx`
- Carte **« Cycle disponible »** : statut `En cours` / `Programmé` / `Aucun cycle`, puis CTA
  « Rejoindre le cycle » → (une fois inscrit) « Déclarer un paiement ».
- Sélection de catégories (rejoindre/quitter), cotisation du jour, tableau des cotisations.
- Section **« Mes paiements déclarés »** : statut **En attente / Validé / Rejeté**, **motif de rejet**
  affiché, bouton **« Actualiser »** (refresh ciblé sans recharger toute la page).

### Côté admin — `src/components/admin/ContributionsTab.tsx`
- Bannière cycle actif + cartes de synthèse (cotisations du jour / paiements déclarés / retards).
- Génération / clôture des cotisations (cycle actif requis).
- Paiements à valider : boutons **Valider** (1 clic) et **Rejeter** (dialogue, **motif obligatoire**).
- Carte **« Paiements rejetés »** affichant le motif communiqué au membre.
- Filtres par **statut** et **dates** (data-driven, indépendants des noms de catégories).

### Service — `src/services/tontineService.ts`
`fetchActiveCategories`, `fetchMemberCategories`, `memberSelect/UnselectCategory`,
`fetchActiveCycle`, `fetchActiveOrPlannedCycle`, `fetchMember/AllContributions`,
`fetchPaymentMethods`, `declareContributionPayment`, `fetchMember/AllPayments`,
`adminValidatePayment`, `generate/closeDailyContributions`.

---

## 6. Catégories officielles (tiers)

Liste officielle harmonisée (montants **hebdomadaires**) :

| Catégorie | Cotisation / semaine |
|-----------|----------------------|
| **Bronze** | 5 000 FCFA |
| **Silver** | 10 000 FCFA |
| **Gold** | 25 000 FCFA |
| **Diamond** | 50 000 FCFA |
| **Platinium** | 100 000 FCFA |
| **Prestige** | 200 000 FCFA |

> Orthographe **« Platinium »** conservée (déjà utilisée dans le code marketing).

### État réel vs cible (⚠️ important)

- **Couche marketing** (statique) : utilise déjà ces 6 tiers
  (`MembershipCategoriesSection`, `CategoryDetail`, `CategoryRecommender`, `paymentService`,
  `Dashboard.categoryInfo`).
- **Couche tontine (BD `tontine_categories`)** : contient **encore** `Bronze/Argent/Or/Diamant`
  (`daily_amount` 1000/2000/5000/10000). L'alignement sur les 6 tiers officiels est **préparé**
  dans `supabase/migrations/20260616130000_harmonize_tontine_categories.sql` mais **NON déployé**.
- **Question ouverte hebdo/journalier** : la table n'a que `daily_amount` et le module génère des
  cotisations **journalières**. La migration ajoute `weekly_amount` et pose `daily_amount = weekly/7`.
  À valider (ou basculer la cadence en hebdomadaire) avant déploiement.

---

## 7. Routes (`src/App.tsx`)

### Publiques
`/` · `/about` · `/blog` · `/blog/:slug` · `/privacy-policy` · `/terms-of-use` ·
`/auth` · `/auth/callback` · `/auth/callback/google` · `/forgot-password` · `/reset-password` ·
`/categorie/:categoryName` · `/categories/comparatif` · `/financement/fonds-de-financement` ·
`/verify-receipt`

### Membre
`/dashboard` · `/messages` · `/profile/edit` · `/historique-cotisations`

### Admin (via `RoleGuard`)
- `/admin` → `admin` + `super_admin`
- `/super-admin` → `super_admin`
- `/members`, `/members/:id` → `admin` + `super_admin`

Catch-all : `*` → `NotFound`.

### Détail catégorie & correction des 404
- La route détail est **`/categorie/:categoryName`** (singulier). Il n'existe **pas** de
  `/categories/:slug` (pluriel) : seul `/categories/comparatif` est déclaré littéralement.
- `CategoryDetail` (`src/pages/CategoryDetail.tsx`) résout `categoriesData[slug.toLowerCase()]`
  avec un **alias** `platinum → platinium`, et affiche une page « Catégorie non trouvée »
  gracieuse pour un slug inconnu (pas de 404 serveur).
- Tous les boutons « Voir les détails / Découvrir » naviguent vers `/categorie/<slug>` (route
  déclarée). Le bouton du dashboard « **Accéder à mon cycle** » fait défiler vers la section
  tontine de la page (pas de navigation) → plus de 404.

---

## 8. Edge Functions (`supabase/functions/`)

| Fonction | Usage |
|----------|-------|
| `titan-assistant` | Assistant IA « Titan » (chat spécialisé tontine) |
| `chat` | Assistant IA conversationnel (Lovable AI Gateway / Gemini) |
| `generate-receipt` | Reçus HTML + QR (`api.qrserver.com`), bucket `receipts` |
| `send-contribution-reminders` | Rappels de cotisation par email (Resend) |
| `run-tontine-daily-maintenance` | Maintenance journalière tontine (génération/clôture) — **préparée, à déployer après tests manuels** |

> Le **cron** d'automatisation ne doit être activé qu'après validation manuelle du cycle complet
> (génération admin → déclaration membre → validation/rejet admin → recalcul statuts → clôture overdue).

---

## 9. Authentification & OAuth

- Email/mot de passe (auto-confirmation), OAuth Google/GitHub (PKCE).
- Redirections calculées dynamiquement (`src/lib/oauthUtils.ts`, `useAuth`, `ForgotPassword`) :
  - OAuth : `${origin}/auth/callback`
  - Confirmation e-mail : `${origin}/`
  - Reset mot de passe : `${origin}/reset-password`
- Supabase **Auth → URL Configuration** doit inclure le domaine de prod (Site URL + Redirect URLs).
- Provider OAuth : redirect URI = `https://txllxnqcptegsgwkvzeb.supabase.co/auth/v1/callback`.
- Détails déploiement : voir `DEPLOYMENT_HOSTINGER.md`.

---

## 10. Build, structure & déploiement

### Commandes
```bash
npm run typecheck   # tsc --noEmit
npm run build       # Vite -> dist/
```

### Structure
```
src/
├── components/   (ui/, admin/, member/, messaging/, ...)
├── pages/
├── hooks/
├── lib/          (paymentService, oauthUtils, ...)
├── services/     (tontineService, memberService)
├── contexts/     (LanguageContext)
├── types/        (tontine.ts, ...)
└── integrations/supabase/ (client.ts, types.ts — auto-générés)

supabase/
├── functions/    (titan-assistant, chat, generate-receipt,
│                  send-contribution-reminders, run-tontine-daily-maintenance)
└── migrations/   (module tontine, maintenance, harmonisation, ...)

public/.htaccess  (fallback SPA Apache/LiteSpeed)
```

### Déploiement
- Cible **Hostinger** documentée dans `DEPLOYMENT_HOSTINGER.md` (upload `dist/`, `.htaccess`,
  variables `VITE_*` au build, config OAuth Supabase).
- ⚠️ `vite.config.ts` a `base: "./"` : risque de 404 sur assets pour les routes **imbriquées**
  (`/members/:id`, `/blog/:slug`, `/categorie/:slug`) en accès direct. Recommandé : `base: "/"`
  pour un déploiement à la racine du domaine (voir guide §5).

---

## 11. Sécurité — règles projet

- RLS active sur les tables sensibles ; accès anonyme bloqué.
- Rôles stockés séparément (`user_roles`), jamais dans le profil.
- Paiements membres uniquement via RPC `member_declare_tontine_payment`.
- Validation admin via RPC avec `validated_by = auth.uid()`.
- **Ne pas** déployer migrations / edge functions sans validation manuelle.
- **Ne pas** modifier le trigger `handle_new_user` ni l'ancienne table `contributions` sans instruction.

---

## 12. Écarts vs documentation T=0 (déc. 2024)

| Sujet | T=0 (obsolète) | Actuel |
|-------|----------------|--------|
| Rôles | `admin`, `member` | `user`, `admin`, `super_admin` (pas de `member`) |
| Tables tontine | absentes | module complet (§4.2) |
| Adhésions | — | `member_tontine_categories` (pas `tontine_memberships`) |
| Route « à propos » | `/a-propos` | `/about` |
| Route reçu | `/verify/:reference` | `/verify-receipt` |
| Route historique | `/contributions` | `/historique-cotisations` |
| Routes admin | `/admin` seul | `/admin`, `/super-admin`, `/members`, `/members/:id` |
| Montants tiers | Platinum 50k / Diamond 100k | Diamond 50k / **Platinium** 100k (§6) |
| Edge functions | 3 | + `titan-assistant`, `run-tontine-daily-maintenance` |
| Déploiement | Lovable « Update » | + guide Hostinger (`DEPLOYMENT_HOSTINGER.md`) |

---

*Document maintenu manuellement. Pour l'historique, voir `KNOWLEDGE.md` (T=0).*
