# Guide de Déploiement sur Hostinger

Ce guide explique comment déployer le projet **Cercle des Titans** sur Hostinger.

## Prérequis

- Un compte Hostinger avec un hébergement web actif
- Accès au hPanel (panneau de contrôle Hostinger)
- Node.js installé localement pour le build

---

## Scénario A : Site Statique (Vite/React) - RECOMMANDÉ

Ce projet est un site React statique construit avec Vite. C'est le scénario recommandé.

### Étape 1 : Build du projet

```bash
# Installer les dépendances
npm install

# Construire le projet
npm run build
```

Le dossier `dist/` sera créé avec tous les fichiers statiques.

### Étape 2 : Configuration du .htaccess

Le fichier `.htaccess` est déjà inclus dans `public/` et sera copié dans `dist/` lors du build. Il contient les règles nécessaires pour :
- Le routing SPA (Single Page Application)
- La mise en cache des assets
- La compression gzip

Si le fichier n'est pas présent, créez-le dans `dist/` avec ce contenu :

```apache
Options -Indexes
RewriteEngine On
RewriteBase /

# Ne pas réécrire les fichiers et dossiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rediriger toutes les autres requêtes vers index.html
RewriteRule . /index.html [L]

# Cache control for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>
```

### Étape 3 : Upload sur Hostinger

#### Via File Manager (hPanel)

1. Connectez-vous à [hPanel](https://hpanel.hostinger.com)
2. Allez dans **Fichiers** → **Gestionnaire de fichiers**
3. Naviguez vers le dossier `public_html`
4. Supprimez les anciens fichiers (sauf `.htaccess` si déjà configuré)
5. Cliquez sur **Télécharger** et uploadez tout le contenu du dossier `dist/`
6. Vérifiez que le fichier `.htaccess` est bien à la racine de `public_html`

#### Via FTP

1. Dans hPanel, allez dans **Fichiers** → **Comptes FTP**
2. Créez un compte FTP ou utilisez les identifiants existants
3. Connectez-vous avec un client FTP (FileZilla, WinSCP, etc.)
4. Uploadez le contenu de `dist/` vers `public_html/`

#### Via Git (Recommandé pour les mises à jour)

1. Dans hPanel, allez dans **Avancé** → **Git**
2. Configurez le dépôt Git
3. Clonez le projet et configurez un webhook pour le déploiement automatique

### Étape 4 : Vérification

Testez les URLs suivantes :
- `https://votredomaine.com/` - Page d'accueil
- `https://votredomaine.com/financement/fonds-de-financement` - Page Fonds de financement
- `https://votredomaine.com/categories/comparatif` - Comparatif des catégories

Assurez-vous que :
- ✅ La navigation fonctionne sans rechargement complet
- ✅ Le refresh de page fonctionne sur toutes les routes
- ✅ L'accès direct via URL fonctionne

---

## Configuration OAuth (Google / GitHub)

Pour que l'authentification Google et GitHub fonctionne, configurez les **Redirect URIs** avec votre propre projet Supabase.

### Redirect URIs à configurer

```
Site URL: https://cercledstitans.com
Callback URL: https://VOTRE_PROJECT_REF.supabase.co/auth/v1/callback
```

### Google Cloud Console
1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre projet OAuth
3. Dans **Authorized JavaScript origins**, ajoutez :
   - `https://cercledstitans.com`
4. Dans **Authorized redirect URIs**, ajoutez :
   - `https://VOTRE_PROJECT_REF.supabase.co/auth/v1/callback`

### GitHub Developer Settings
1. Allez sur https://github.com/settings/developers
2. Sélectionnez votre OAuth App
3. Dans **Homepage URL** :
   - `https://cercledstitans.com` (production)
4. Dans **Authorization callback URL** :
   - `https://VOTRE_PROJECT_REF.supabase.co/auth/v1/callback`

### Supabase Auth Settings
Dans Supabase → Authentication → URL Configuration :
- **Site URL** : `https://cercledstitans.com`
- **Redirect URLs** : 
  - `https://cercledstitans.com`
  - `https://cercledstitans.com/dashboard`

---

## Scénario B : Next.js (Si applicable)

Si le projet utilise Next.js, vous aurez besoin de l'hébergement Node.js de Hostinger.

### Étape 1 : Configuration du projet

Assurez-vous que `package.json` contient :

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

### Étape 2 : Déploiement sur Hostinger Node.js

1. Dans hPanel, allez dans **Avancé** → **Node.js**
2. Créez une nouvelle application Node.js
3. Sélectionnez la version Node.js (18.x ou supérieure)
4. Configurez :
   - **Répertoire racine** : `/`
   - **Fichier de démarrage** : `node_modules/.bin/next`
   - **Arguments** : `start -p $PORT`

### Étape 3 : Upload et démarrage

1. Uploadez tous les fichiers du projet (sauf `node_modules/`)
2. Dans la section Node.js, cliquez sur **Exécuter npm install**
3. Cliquez sur **Exécuter npm run build**
4. Démarrez l'application

---

## Dépannage

### Les routes retournent une erreur 404

- Vérifiez que le fichier `.htaccess` est bien à la racine de `public_html`
- Vérifiez que `mod_rewrite` est activé (normalement par défaut sur Hostinger)

### Les assets ne se chargent pas

- Vérifiez que les chemins sont relatifs (pas de `/` au début)
- Vérifiez les permissions des fichiers (644 pour les fichiers, 755 pour les dossiers)

### Le site affiche une page blanche

- Ouvrez la console du navigateur (F12) pour voir les erreurs
- Vérifiez que tous les fichiers du dossier `dist/` ont été uploadés

### Problèmes de cache

Videz le cache du navigateur ou ajoutez un paramètre de version aux assets :
```html
<script src="main.js?v=1.0.0"></script>
```

---

## Support

Pour toute question :
- Documentation Hostinger : https://support.hostinger.com
- Support technique Hostinger via hPanel

---

## Checklist avant mise en production

- [ ] Build réussi sans erreurs (`npm run build`)
- [ ] Fichier `.htaccess` présent dans `dist/`
- [ ] Toutes les routes testées localement
- [ ] Variables d'environnement configurées si nécessaire
- [ ] SSL/HTTPS activé sur Hostinger
- [ ] Domaine correctement configuré