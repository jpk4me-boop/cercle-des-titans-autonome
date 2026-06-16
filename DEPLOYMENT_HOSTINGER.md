# Déploiement sur Hostinger — Cercle des Titans

Guide de déploiement de l'application (React + Vite + Supabase) sur un hébergement
mutualisé Hostinger (Apache / LiteSpeed).

---

## 1. Pré-requis

- Node.js 18+ et npm en local.
- Un domaine ou sous-domaine Hostinger pointant vers un dossier `public_html`.
- Un projet Supabase actif (auth + base de données).
- Les variables d'environnement de production (voir §6).

---

## 2. Build de production

```bash
npm install
npm run typecheck   # doit passer sans erreur
npm run build       # génère le dossier dist/
```

Le résultat est dans `dist/`. C'est **le contenu de `dist/`** (et non le dossier lui-même)
qui doit être déposé à la racine `public_html`.

### Vérifier que `.htaccess` est bien dans `dist/`

Le fichier `public/.htaccess` est copié automatiquement par Vite à la racine de `dist/`
(tout le contenu de `public/` est recopié, fichiers cachés inclus).

```powershell
# Windows / PowerShell
dir dist          # liste visible
dir dist /a       # inclut les fichiers cachés -> .htaccess doit apparaître
```

```bash
# bash / Git Bash
ls -la dist        # .htaccess doit apparaître dans la liste
```

Si `.htaccess` n'apparaît pas, ne pas continuer : le routage SPA ne fonctionnera pas.

---

## 3. Upload sur Hostinger

1. Ouvrir **hPanel → Gestionnaire de fichiers** (ou via FTP/SFTP).
2. Aller dans `public_html` (vider l'ancien contenu si redéploiement).
3. Téléverser **tout le contenu de `dist/`** :
   - `index.html`
   - `assets/`
   - `.htaccess` *(activer « afficher les fichiers cachés » dans le gestionnaire)*
   - `manifest`, `sw.js`, `robots.txt`, `sitemap.xml`, images, etc.
4. Vérifier que `.htaccess` est bien présent à la racine de `public_html`.

> ⚠️ Le gestionnaire de fichiers Hostinger masque les fichiers commençant par `.`
> par défaut. Activez l'option d'affichage des fichiers cachés, sinon `.htaccess`
> ne sera pas visible ni téléversé.

---

## 4. Routage SPA (`.htaccess`)

L'application est une **Single Page Application** : toutes les routes sont gérées côté
client par React Router. Le serveur doit donc renvoyer `index.html` pour toute route
inconnue. C'est le rôle de `public/.htaccess` :

```apache
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^.*$ index.html [L]
```

- Les fichiers/dossiers existants sont servis tels quels.
- Toute autre requête est redirigée vers `index.html` → React Router prend le relais.

Le fichier ajoute aussi : en-têtes de sécurité, cache des assets, GZIP, types MIME.

### Routes couvertes (vérifiées)

| Route | Déclarée dans `App.tsx` | Accès |
|---|---|---|
| `/` | ✅ | public |
| `/about` | ✅ | public |
| `/blog` | ✅ | public |
| `/blog/:slug` | ✅ | public |
| `/privacy-policy`, `/terms-of-use` | ✅ | public |
| `/auth`, `/auth/callback`, `/auth/callback/google` | ✅ | public |
| `/forgot-password`, `/reset-password` | ✅ | public |
| `/dashboard` | ✅ | membre |
| `/messages`, `/profile/edit` | ✅ | membre |
| `/categorie/:categoryName` *(détail catégorie — équivaut à `/category/:code`)* | ✅ | public |
| `/categories/comparatif` | ✅ | public |
| `/financement/fonds-de-financement` | ✅ | public |
| `/verify-receipt` | ✅ | public |
| `/historique-cotisations` | ✅ | membre |
| `/admin` | ✅ | admin / super_admin (RoleGuard) |
| `/super-admin` | ✅ | super_admin (RoleGuard) |
| `/members`, `/members/:id` | ✅ | admin / super_admin (RoleGuard) |
| `*` (404) | ✅ | `NotFound` |

> La route détail catégorie est **`/categorie/:categoryName`** (singulier, en français).
> Les boutons « Voir les détails / Découvrir » naviguent tous vers cette route déclarée
> (`/categorie/<slug>`), donc plus de 404. Le bouton du dashboard « Accéder à mon cycle »
> fait défiler vers la section tontine de la même page (pas de navigation).

---

## 5. ⚠️ Important : `base` Vite et routes imbriquées

`vite.config.ts` utilise actuellement :

```ts
base: "./", // Relative paths for static hosting
```

Avec des **chemins relatifs**, les assets sont référencés en `./assets/...`. Cela
fonctionne pour `/` et les routes à un seul segment (`/dashboard`), mais **casse le
chargement des assets en accès direct / rafraîchissement sur les routes à 2+ segments** :

- `/members/:id`
- `/blog/:slug`
- `/categorie/:categoryName`
- `/auth/callback/google`

Exemple : sur `/members/123`, `./assets/app.js` est résolu en `/members/assets/app.js`
→ **404 sur les assets**, page blanche.

### Recommandation

- **Déploiement à la racine du domaine** (`https://exemple.com/`) → utiliser `base: "/"` :

  ```ts
  base: "/",
  ```

- **Déploiement dans un sous-dossier** (`https://exemple.com/app/`) → garder un base
  explicite correspondant, ex. `base: "/app/"` (et `RewriteBase /app/` dans `.htaccess`).

Après modification de `base`, refaire `npm run build`. *(Changement de config non
appliqué dans ce commit — à valider selon la cible de déploiement.)*

---

## 6. Variables d'environnement

Vite **inline** les variables `VITE_*` au moment du `npm run build`. Elles doivent donc
être présentes **en local au build**, pas sur le serveur Hostinger.

`.env.local` (non commité) :

```
VITE_SUPABASE_URL=https://<project_ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<clé publishable / anon>
```

> Projet Supabase de production : `txllxnqcptegsgwkvzeb` (Cercle des Titans).
> Ne jamais committer `.env.local`. Utiliser `.env.example` comme modèle.

Après tout changement de `.env.local`, **rebuild obligatoire** puis re-upload de `dist/`.

---

## 7. OAuth / Supabase — cohérence des URLs

L'application calcule ses URLs de redirection **dynamiquement** à partir du domaine courant :

| Usage | Code | URL produite |
|---|---|---|
| OAuth Google/GitHub | `getOAuthRedirectUrl()` | `${origin}/auth/callback` |
| Confirmation e-mail (signup) | `useAuth` | `${origin}/` |
| Réinitialisation mot de passe | `ForgotPassword` | `${origin}/reset-password` |

`origin` = le domaine réel servant l'app (Hostinger en prod, Lovable en preview, localhost
en dev). Pour que ces redirections soient acceptées, il faut **les déclarer dans Supabase
et chez le provider** :

### a) Supabase → Authentication → URL Configuration

- **Site URL** : `https://<domaine-hostinger-prod>`
- **Redirect URLs** (en ajouter une par environnement utilisé) :
  - `https://<domaine-hostinger-prod>/auth/callback`
  - `https://<domaine-hostinger-prod>/reset-password`
  - `https://<domaine-hostinger-prod>/`
  - *(et les équivalents Lovable preview / `http://localhost:8080` si besoin en test)*

### b) Provider OAuth (Google Cloud Console / GitHub)

- **Authorized redirect URI** = l'URL de callback **Supabase** (pas celle de l'app) :
  - `https://txllxnqcptegsgwkvzeb.supabase.co/auth/v1/callback`
- Le flux : app → Supabase (`/auth/v1/callback`) → retour app (`${origin}/auth/callback`).

### c) Routes app présentes

- `/auth/callback` et `/auth/callback/google` sont déclarées dans `App.tsx` ✅
- `/reset-password` est déclarée ✅

> Si un domaine n'est pas dans la liste **Redirect URLs** de Supabase, la connexion OAuth
> et les e-mails de confirmation échoueront (« redirect URL not allowed »).

---

## 8. Vérification post-déploiement

1. Charger `https://<domaine>/` → la home s'affiche.
2. Accès direct `https://<domaine>/dashboard` puis **F5** → pas de 404 serveur (SPA OK).
3. Tester une route imbriquée (`/categorie/bronze`, `/blog/<slug>`) en accès direct
   → vérifier que les assets chargent (voir §5 si page blanche).
4. Connexion Google/e-mail → retour correct sur l'app (voir §7).
5. Console navigateur : pas d'erreur 404 sur `assets/...`.

---

## 9. Checklist rapide

- [ ] `npm run typecheck` OK
- [ ] `npm run build` OK
- [ ] `.htaccess` présent dans `dist/` (`dir dist /a`)
- [ ] `base` Vite cohérent avec la cible (racine `/` vs sous-dossier)
- [ ] Contenu de `dist/` (y compris `.htaccess`) téléversé dans `public_html`
- [ ] Fichiers cachés affichés/téléversés sur Hostinger
- [ ] Variables `VITE_*` injectées au build
- [ ] Supabase : Site URL + Redirect URLs incluent le domaine de prod
- [ ] Provider OAuth : redirect URI = callback Supabase
- [ ] Accès direct + refresh sur `/dashboard` et une route imbriquée testés
