# Cercle des Titans - Documentation Technique (T=0)

> Documentation générée le 22 décembre 2024

## 📋 Vue d'ensemble

**Cercle des Titans** est une application web de gestion de **tontine africaine** (épargne rotative collective). Elle permet aux membres de cotiser régulièrement, d'accéder à des fonds de financement, et de bénéficier d'un système de gains mutualisés.

---

## 🏗️ Architecture Technique

### Stack Technologique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Routing** | React Router DOM v6 |
| **State** | TanStack Query v5 |
| **Backend** | Lovable Cloud (Supabase) |
| **Auth** | Email/Password + OAuth (Google/GitHub) |
| **AI** | Lovable AI Gateway (Gemini) |
| **Email** | Resend API |

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React + Vite + Tailwind + shadcn/ui + React Router         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOVABLE CLOUD (Supabase)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  Database   │  │   Edge Functions    │  │
│  │ Email/OAuth │  │ PostgreSQL  │  │ chat, receipts,     │  │
│  │             │  │   + RLS     │  │ reminders           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐                                            │
│  │   Storage   │                                            │
│  │  (receipts) │                                            │
│  └─────────────┘                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ Lovable AI │  │   Resend   │  │  QR Server │
   │  Gateway   │  │   (Email)  │  │    API     │
   └────────────┘  └────────────┘  └────────────┘
```

---

## 🗄️ Base de Données

### Tables Principales

| Table | Description | RLS |
|-------|-------------|-----|
| `profiles` | Profils utilisateurs (nom, email, téléphone, adresse, catégorie) | ✅ |
| `contributions` | Cotisations des membres | ✅ |
| `transactions` | Historique des paiements | ✅ |
| `financing_requests` | Demandes de financement | ✅ |
| `user_roles` | Rôles utilisateurs (admin, member) | ✅ |
| `conversations` | Conversations de messagerie | ✅ |
| `messages` | Messages dans les conversations | ✅ |
| `conversation_participants` | Participants aux conversations | ✅ |

### Fonctions RPC Sécurisées

| Fonction | Usage |
|----------|-------|
| `has_role(role_name, user_id)` | Vérifie si l'utilisateur a un rôle spécifique |
| `create_transaction(...)` | Crée une transaction avec référence unique |
| `submit_financing_request(...)` | Soumet une demande de financement |
| `verify_transaction_by_reference(ref)` | Vérifie une transaction par sa référence |

### Politiques RLS Appliquées

- **Profils** : Utilisateurs voient uniquement leur propre profil, admins voient tous
- **Contributions** : Utilisateurs voient leurs cotisations, admins gèrent tout
- **Transactions** : Accès restreint aux propriétaires et admins
- **Accès anonyme** : Bloqué sur toutes les tables sensibles

---

## 🔐 Authentification & Sécurité

### Méthodes d'Authentification

1. **Email/Mot de passe** avec auto-confirmation activée
2. **OAuth Google** (Authorization Code Flow + PKCE)
3. **OAuth GitHub** (Authorization Code Flow + PKCE)

### Validation

- Validation Zod côté client pour tous les formulaires
- Validation backend dans les Edge Functions
- Callback OAuth via `/auth/callback`

### Gestion des Rôles

```typescript
// Vérification de rôle via RPC
const { data } = await supabase.rpc('has_role', { 
  _role: 'admin', 
  _user_id: user.id 
});
```

---

## 📄 Pages de l'Application

### Pages Publiques

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `Index` | Page d'accueil avec sections Hero, Avantages, Catégories, Témoignages, FAQ |
| `/auth` | `Auth` | Connexion/Inscription (Email + OAuth) |
| `/auth/callback` | `AuthCallback` | Callback OAuth |
| `/forgot-password` | `ForgotPassword` | Réinitialisation mot de passe |
| `/reset-password` | `ResetPassword` | Nouveau mot de passe |
| `/categories/comparatif` | `CategoriesComparison` | Comparatif des 6 catégories |
| `/categorie/:name` | `CategoryDetail` | Détail d'une catégorie |
| `/financement/fonds-de-financement` | `FondsFinancement` | Informations financement |
| `/blog` | `Blog` | Articles (WordPress headless) |
| `/blog/:slug` | `BlogPost` | Article individuel |
| `/a-propos` | `AboutPage` | À propos |
| `/privacy-policy` | `PrivacyPolicy` | Politique de confidentialité |
| `/terms-of-use` | `TermsOfUse` | Conditions d'utilisation |
| `/verify/:reference` | `VerifyReceipt` | Vérification reçu par QR code |

### Pages Membres (Protégées)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/dashboard` | `Dashboard` | Tableau de bord membre |
| `/contributions` | `ContributionHistory` | Historique des cotisations |
| `/messages` | `Messages` | Messagerie interne |
| `/profile/edit` | `ProfileEdit` | Modification du profil |

### Pages Admin (Protégées)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/admin` | `AdminDashboard` | Dashboard administrateur complet |

---

## 🧩 Composants Métier Clés

### ChatAgent
- Assistant IA conversationnel flottant
- Utilise Lovable AI Gateway (Gemini 2.5 Flash)
- Contexte spécialisé tontine africaine
- Streaming des réponses

### CategoryRecommender
- Recommandation de catégorie basée sur revenus/objectifs
- Algorithme de scoring multicritères
- Sauvegarde de la recommandation dans le profil

### PaymentModal
- Modal de paiement avec QR code
- Génération de référence unique
- Instructions pour Mobile Money (Orange, MTN, Wave)

### GainsSimulator
- Simulateur de gains par catégorie
- Calcul dynamique des bénéfices potentiels
- Slider pour nombre de cycles

### FinancingRequestForm
- Formulaire de demande de financement
- Validation Zod complète
- Soumission sécurisée via RPC

### ConversationList / MessageThread
- Messagerie interne entre membres
- Support temps réel (Realtime)

### CurrencyConverter
- Conversion XAF ↔ EUR
- Taux de change intégré

### LanguageToggle
- Basculement FR/EN
- Persistance localStorage

---

## ⚡ Edge Functions

### `chat`
- **Endpoint** : `/functions/v1/chat`
- **Méthode** : POST
- **Usage** : Assistant IA conversationnel
- **Modèle** : `google/gemini-2.5-flash` via Lovable AI Gateway
- **Secrets** : `LOVABLE_API_KEY`

### `generate-receipt`
- **Endpoint** : `/functions/v1/generate-receipt`
- **Méthode** : POST
- **Usage** : Génération de reçus HTML avec QR code
- **Stockage** : Bucket `receipts`
- **API externe** : `api.qrserver.com`

### `send-contribution-reminders`
- **Endpoint** : `/functions/v1/send-contribution-reminders`
- **Méthode** : POST
- **Usage** : Envoi de rappels de cotisation par email
- **Service** : Resend API
- **Secrets** : `RESEND_API_KEY`

---

## 🌍 Internationalisation

### Configuration

```typescript
// LanguageContext.tsx
type Language = 'fr' | 'en';
const translations = { fr: {...}, en: {...} };
```

### Fonctionnement
- Langue par défaut : Français
- Stockage : `localStorage.getItem('language')`
- Hook : `useLanguage()` → `{ language, setLanguage, t }`

---

## 💰 Catégories de Cotisation

| Catégorie | Cotisation/Semaine | Gain Cycle | Durée | Membres |
|-----------|-------------------|------------|-------|---------|
| **Bronze** | 5 000 XAF | 25 000 XAF | 5 semaines | 5 |
| **Silver** | 10 000 XAF | 50 000 XAF | 5 semaines | 5 |
| **Gold** | 25 000 XAF | 125 000 XAF | 5 semaines | 5 |
| **Platinum** | 50 000 XAF | 250 000 XAF | 5 semaines | 5 |
| **Diamond** | 100 000 XAF | 500 000 XAF | 5 semaines | 5 |
| **Prestige** | 200 000 XAF | 1 000 000 XAF | 5 semaines | 5 |

---

## 🔑 Secrets Configurés

| Secret | Usage |
|--------|-------|
| `LOVABLE_API_KEY` | Lovable AI Gateway |
| `RESEND_API_KEY` | Envoi d'emails |
| `TITANSECRET` | Secret applicatif |
| `SUPABASE_URL` | URL Supabase (auto) |
| `SUPABASE_ANON_KEY` | Clé anonyme (auto) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (auto) |

---

## 📦 Storage

### Bucket `receipts`
- **Accès** : Public
- **Contenu** : Reçus HTML générés
- **URL** : `{SUPABASE_URL}/storage/v1/object/public/receipts/{filename}`

---

## 🛡️ Statut Sécurité Actuel

| Mesure | Statut |
|--------|--------|
| RLS activé sur toutes les tables | ✅ |
| Politiques restrictives (user/admin) | ✅ |
| Accès anonyme bloqué | ✅ |
| Rôles stockés séparément (`user_roles`) | ✅ |
| Rate limiting Edge Functions | ✅ |
| Validation backend (Zod) | ✅ |
| CORS configuré | ✅ |
| OAuth PKCE Flow | ✅ |

---

## 📁 Structure des Dossiers

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── admin/          # Composants admin
│   └── messaging/      # Composants messagerie
├── pages/              # Pages de l'application
├── hooks/              # Hooks personnalisés
├── lib/                # Utilitaires et services
├── contexts/           # Contextes React (Language)
├── integrations/       # Configuration Supabase (auto-généré)
└── assets/             # Images et ressources

supabase/
├── functions/          # Edge Functions
│   ├── chat/
│   ├── generate-receipt/
│   └── send-contribution-reminders/
├── migrations/         # Migrations SQL
└── config.toml         # Configuration (auto-géré)

public/
├── .htaccess           # Config Apache (SPA routing)
├── robots.txt          # SEO
├── sitemap.xml         # SEO
└── og-image.jpg        # Image Open Graph
```

---

## 🔗 URLs Importantes

| Environnement | URL |
|---------------|-----|
| **Preview Lovable** | Généré automatiquement |
| **Production** | À configurer (domaine personnalisé) |
| **Callback OAuth** | `/auth/callback` |

---

## 📝 Notes de Développement

### Fichiers Auto-Générés (Ne pas modifier)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- `.env`

### Migrations
- Utiliser l'outil de migration Lovable
- Ne pas créer manuellement de fichiers SQL

### Déploiement
- **Frontend** : Clic "Update" dans le dialog de publication
- **Backend (Edge Functions)** : Déploiement automatique

### WordPress Headless
- Configuration optionnelle pour le blog
- Voir `WORDPRESS_HEADLESS_SETUP.md`

---

## 🚀 Prochaines Étapes Suggérées

1. **Notifications push** pour les rappels de cotisation
2. **Dashboard analytics** avec graphiques avancés
3. **Export PDF** des historiques de cotisation
4. **Intégration paiement** Mobile Money directe
5. **Mode hors ligne** (PWA)

---

*Documentation générée automatiquement - Cercle des Titans © 2024*
