# Configuration WordPress Headless CMS

Ce guide explique comment configurer WordPress comme CMS headless pour gérer le contenu du site Cercle des Titans.

## 1. Installation WordPress

### Option A : Hostinger (recommandé pour débutants)
1. Connectez-vous à votre compte Hostinger
2. Allez dans "Sites web" → "Ajouter un site"
3. Choisissez "WordPress"
4. Configurez le domaine (ex: `cms.cercle-des-titans.com`)
5. Notez l'URL d'administration

### Option B : Installation manuelle
1. Téléchargez WordPress sur wordpress.org
2. Uploadez sur votre hébergement
3. Suivez l'assistant d'installation

## 2. Configuration WordPress pour Headless

### 2.1 Plugins essentiels à installer

1. **WP REST API Controller** - Contrôle les endpoints REST
2. **Advanced Custom Fields (ACF)** - Champs personnalisés
3. **Custom Post Type UI** - Types de contenu personnalisés
4. **ACF to REST API** - Expose les champs ACF dans l'API
5. **JWT Authentication for WP REST API** (optionnel) - Sécurité

### 2.2 Créer les Custom Post Types

Dans WordPress Admin → CPT UI → Ajouter un nouveau type :

#### Témoignages (Testimonials)
- Nom du type : `testimonial`
- Label : `Témoignages`
- Supports : Titre, Éditeur, Image à la une

#### FAQ
- Nom du type : `faq`
- Label : `FAQ`
- Supports : Titre, Éditeur

### 2.3 Créer les champs ACF

#### Groupe "Témoignage" (pour le type Testimonial)
- `author_name` (Texte) - Nom de l'auteur
- `author_role` (Texte) - Rôle/Profession
- `author_avatar` (Image) - Photo de l'auteur
- `rating` (Nombre) - Note de 1 à 5

### 2.4 Activer CORS

Ajoutez dans `wp-content/themes/votre-theme/functions.php` :

```php
// Enable CORS for REST API
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
});

// Expose custom post types to REST API
add_action('init', function() {
    global $wp_post_types;
    
    if (isset($wp_post_types['testimonial'])) {
        $wp_post_types['testimonial']->show_in_rest = true;
        $wp_post_types['testimonial']->rest_base = 'testimonials';
    }
    
    if (isset($wp_post_types['faq'])) {
        $wp_post_types['faq']->show_in_rest = true;
        $wp_post_types['faq']->rest_base = 'faqs';
    }
});
```

## 3. Connecter Lovable à WordPress

### 3.1 Ajouter l'URL WordPress

Une fois WordPress installé, ajoutez l'URL dans le fichier `.env` du projet Lovable :

```env
VITE_WORDPRESS_API_URL=https://votre-site-wordpress.com
```

> **Note** : Remplacez par l'URL réelle de votre WordPress

### 3.2 Utilisation dans le code

```tsx
import { useWPPosts, useWPPage, useWPTestimonials } from '@/hooks/useWordPress';

// Récupérer les articles
const { data: posts, isLoading } = useWPPosts({ perPage: 10 });

// Récupérer une page par slug
const { data: aboutPage } = useWPPage('a-propos');

// Récupérer les témoignages
const { data: testimonials } = useWPTestimonials();
```

## 4. Structure du contenu recommandée

### Pages à créer dans WordPress
- `a-propos` - Page À propos
- `faq` - Page FAQ
- `conditions-utilisation` - CGU
- `politique-confidentialite` - Politique de confidentialité

### Catégories d'articles suggérées
- Actualités
- Conseils financiers
- Témoignages membres
- Événements

## 5. Tester l'API

Testez que l'API fonctionne :

```
https://votre-site.com/wp-json/wp/v2/posts
https://votre-site.com/wp-json/wp/v2/pages
https://votre-site.com/wp-json/wp/v2/testimonials
```

## 6. Sécurité

### Recommandations
1. Utilisez HTTPS pour votre WordPress
2. Limitez les permissions REST API avec le plugin WP REST API Controller
3. Désactivez les endpoints non utilisés
4. Configurez un CDN (Cloudflare) pour le cache

### Optionnel : Authentification JWT

Pour les opérations d'écriture (non nécessaire pour lecture seule) :

1. Installez "JWT Authentication for WP REST API"
2. Ajoutez dans `.htaccess` :
```apache
RewriteEngine on
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

## 7. Support

Pour toute question sur l'intégration :
- Documentation WordPress REST API : https://developer.wordpress.org/rest-api/
- Documentation ACF : https://www.advancedcustomfields.com/resources/

---

## Récapitulatif des étapes

1. ✅ Installer WordPress sur un hébergement
2. ✅ Installer les plugins (ACF, CPT UI, ACF to REST API)
3. ✅ Créer les custom post types (testimonials, faqs)
4. ✅ Configurer CORS dans functions.php
5. ✅ Ajouter `VITE_WORDPRESS_API_URL` dans Lovable
6. ✅ Tester les endpoints API
7. ✅ Commencer à créer du contenu !
