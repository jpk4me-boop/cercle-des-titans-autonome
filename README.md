# Cercle des Titans — Version autonome

Application web de tontine, cotisations, financement communautaire, espace membre, messagerie et reçus.

Cette version est indépendante de Lovable. Elle utilise une stack standard :

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth / Database / Edge Functions
- PWA

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

L'application démarre sur :

```txt
http://localhost:8080
```

## Configuration `.env.local`

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_REF"
VITE_APP_URL="https://cercledstitans.com"
VITE_WORDPRESS_API_URL=""
```

## Scripts

```bash
npm run dev        # développement
npm run build      # build de production
npm run preview    # prévisualisation du build
npm run lint       # lint
npm run typecheck  # vérification TypeScript
```

## Structure

```txt
src/
├── components/       # composants UI et métier
├── contexts/         # contexte langue
├── hooks/            # hooks auth, messaging, UI
├── integrations/     # client et types Supabase
├── lib/              # services et utilitaires
├── pages/            # pages/routes
└── assets/           # images locales

supabase/
├── functions/        # Edge Functions
├── migrations/       # schéma SQL
└── seed_data/        # exports CSV fournis
```

## Routes principales

| Route | Description |
|---|---|
| `/` | Accueil |
| `/about` | À propos |
| `/auth` | Connexion / inscription |
| `/dashboard` | Espace membre |
| `/messages` | Messagerie membre |
| `/admin` | Tableau de bord admin |
| `/categories/comparatif` | Comparatif des catégories |
| `/financement/fonds-de-financement` | Fonds de financement |
| `/verify-receipt` | Vérification de reçu |

## Supabase

Appliquer les migrations :

```bash
supabase db push
```

Déployer les fonctions :

```bash
supabase functions deploy chat
supabase functions deploy generate-receipt
supabase functions deploy send-contribution-reminders
```

Secrets nécessaires pour les fonctions :

```bash
supabase secrets set SITE_URL="https://cercledstitans.com"
supabase secrets set ALLOWED_ORIGINS="https://cercledstitans.com,http://localhost:8080,http://localhost:5173"
supabase secrets set AI_BASE_URL="https://api.openai.com/v1"
supabase secrets set AI_API_KEY="VOTRE_CLE_API"
supabase secrets set AI_MODEL="gpt-4o-mini"
```

## Déploiement statique

```bash
npm run build
```

Uploader le contenu de `dist/` sur l'hébergeur. Le fichier `public/.htaccess` est prévu pour les hébergements Apache comme Hostinger.

## Notes importantes

- Les paiements sont encore en simulation dans `src/lib/paymentService.ts`.
- Les notes CamPay sont dans `docs/CAMPAY_INTEGRATION_NOTES.md`.
- Les variables sensibles ne doivent jamais être placées dans le dépôt.
- Le logo fourni est intégré dans `src/assets/logo-phoenix.jpg` et `public/logo-phoenix.jpg`.
