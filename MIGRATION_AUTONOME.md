# Migration autonome — Cercle des Titans

Cette version est une base indépendante de Lovable. Elle conserve la stack React/Vite/Supabase, mais supprime les éléments qui imposaient l'usage de Lovable pour développer ou déployer l'application.

## Modifications effectuées

- Suppression de `lovable-tagger` du projet et de `vite.config.ts`.
- Suppression du fichier `.env` contenant les valeurs de projet ; remplacement par `.env.example`.
- Suppression des références directes à `*.lovable.app` dans les Edge Functions.
- Remplacement du proxy IA Lovable par un fournisseur IA compatible OpenAI via `AI_BASE_URL`, `AI_API_KEY` et `AI_MODEL`.
- Génération des reçus : l'URL de vérification utilise maintenant `SITE_URL` au lieu de transformer l'URL Supabase en domaine Lovable.
- Ajout du logo phoenix fourni dans `public/logo-phoenix.jpg` et `src/assets/logo-phoenix.jpg`.
- Intégration du logo dans la barre de navigation.
- Ajout de la vérification Google dans `public/google5a41c101e9f19dbc.html`.
- Ajout du rôle `super_admin` et compatibilité avec les politiques admin via une migration Supabase.
- Conservation des exports CSV dans `supabase/seed_data/`.
- Ajout de notes pour l'intégration CamPay.

## Démarrage local

```bash
cp .env.example .env.local
npm install
npm run dev
```

L'application démarre par défaut sur :

```txt
http://localhost:8080
```

## Variables Supabase côté frontend

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_REF"
VITE_APP_URL="https://cercledstitans.com"
```

## Secrets Supabase Edge Functions

À configurer dans Supabase :

```bash
supabase secrets set SITE_URL="https://cercledstitans.com"
supabase secrets set ALLOWED_ORIGINS="https://cercledstitans.com,http://localhost:8080,http://localhost:5173"
supabase secrets set AI_BASE_URL="https://api.openai.com/v1"
supabase secrets set AI_API_KEY="VOTRE_CLE_API"
supabase secrets set AI_MODEL="gpt-4o-mini"
```

## Déploiement des fonctions

```bash
supabase functions deploy chat
supabase functions deploy generate-receipt
supabase functions deploy send-contribution-reminders
```

## Base de données

Appliquer les migrations :

```bash
supabase db push
```

Les CSV fournis sont placés dans :

```txt
supabase/seed_data/
```

Ils peuvent être importés via l'interface Supabase ou convertis en `seed.sql` selon la structure finale de la base.

## Paiements

Le service actuel garde le mode simulation pour les transactions. Pour passer en production avec CamPay, voir :

```txt
docs/CAMPAY_INTEGRATION_NOTES.md
```
