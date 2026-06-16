# WordPress Headless CMS — Cercle des Titans

> Mise à jour : 17 juin 2026.
> Ce document décrit le rôle de WordPress dans le projet et l'**intégration déjà présente
> dans le code**. Il complète le guide d'installation/configuration WordPress existant :
> `WORDPRESS_HEADLESS_SETUP.md` (racine), qui détaille l'install, les plugins et les
> Custom Post Types côté WordPress.

---

## 1. Rôle de WordPress

WordPress est utilisé **uniquement comme CMS headless** pour le **contenu éditorial** :

- Blog (articles)
- Pages statiques
- Témoignages
- FAQ
- CGU (conditions d'utilisation)
- Politique de confidentialité

Le frontend React consomme l'API REST WordPress (`/wp-json/wp/v2/...`) en lecture seule.

### ⛔ Limites strictes (à respecter)

WordPress **ne doit PAS** être connecté :

- au **dashboard membre** ni au **dashboard admin / super_admin** ;
- aux modules **tontines**, **paiements**, **cotisations** ;
- à **Supabase Auth** ni à la gestion des **rôles** (`user` / `admin` / `super_admin`).

WordPress sert **exclusivement** le contenu marketing/éditorial public. Toute la logique
métier (auth, rôles, tontine, paiements) reste **100 % Supabase** et n'est pas impactée.

---

## 2. Intégration déjà présente dans le code

| Élément | Fichier | Rôle |
|---------|---------|------|
| Client REST | `src/lib/wordpress.ts` | `WordPressClient` + types `WPPost`, `WPPage`, `WPTestimonial`, `WPCategory`, `WPMedia` |
| Hooks React Query | `src/hooks/useWordPress.ts` | `useWPPosts`, `useWPPost`, `useWPPages`, `useWPPage`, `useWPCategories`, `useWPTestimonials`, `useWPFAQs`, `useWPAvailable` + helpers `stripHtml`, `getFeaturedImage`, `getCategories` |
| Singleton | `wordpress` (export de `src/lib/wordpress.ts`) | instance configurée via l'URL d'API |

L'instance utilise systématiquement `?_embed=true` (médias + termes embarqués) et met en cache
via TanStack Query (`staleTime` 5–30 min selon la ressource).

---

## 3. Configuration

Variable d'environnement (injectée au **build** Vite, comme les autres `VITE_*`) :

```
VITE_WORDPRESS_API_URL=https://cms.exemple-domaine.com
```

- L'URL **ne doit pas** inclure `/wp-json` (ajouté automatiquement par le client).
- Si la variable est **absente/vide**, le client renvoie des résultats vides et journalise
  un avertissement : l'application **fonctionne sans WordPress** (dégradation gracieuse).
- `wordpress.isAvailable()` (`useWPAvailable`) permet de tester la disponibilité du CMS.

> Voir `WORDPRESS_HEADLESS_SETUP.md` pour l'installation WordPress (Hostinger / manuel),
> les plugins (ACF, CPT UI, ACF to REST API) et la création des Custom Post Types
> `testimonial` et `faq`.

---

## 4. État de câblage (réel)

| Contenu | API WordPress | Câblé dans l'app | Composant |
|---------|---------------|------------------|-----------|
| **Blog (liste)** | `/posts` | ✅ Oui | `src/pages/Blog.tsx` (`useWPPosts`, `useWPCategories`) |
| **Blog (article)** | `/posts?slug=` | ✅ Oui | `src/pages/BlogPost.tsx` (`useWPPost`) |
| **Témoignages** | `/testimonials` (CPT) | ✅ Oui | `src/components/TestimonialsSection.tsx` (`useWPTestimonials`) |
| **FAQ** | `/faqs` (CPT) | ✅ Oui | `src/components/FAQSection.tsx` (`useWPFAQs`) |
| **Pages statiques** | `/pages` | ⚪ Disponible, **non câblé** | hooks `useWPPages` / `useWPPage` prêts |
| **CGU** | `/pages?slug=` | ⚪ **Non câblé** | `src/pages/TermsOfUse.tsx` → i18n (`LanguageContext`) |
| **Politique de confidentialité** | `/pages?slug=` | ⚪ **Non câblé** | `src/pages/PrivacyPolicy.tsx` → i18n (`LanguageContext`) |

**Important** : aujourd'hui, **CGU** et **Politique de confidentialité** proviennent des
traductions i18n (`LanguageContext`), **pas** de WordPress. Le client expose déjà
`getPages()/getPage(slug)` pour les y brancher plus tard, mais **ce câblage n'est pas fait**
(et ne doit pas l'être maintenant — voir §5).

Les sections Témoignages et FAQ comportent un **repli** : si le CPT n'existe pas / l'API n'est
pas dispo, l'app utilise un contenu par défaut (pas d'erreur visible).

---

## 5. Priorités projet (ordre)

L'intégration/extension WordPress est **la dernière priorité**. Ordre à respecter :

1. Corriger les **catégories officielles** (tontine).
2. Corriger la **404 « Voir les détails »**.
3. Corriger le flux **catégorie validée → cycle → paiement**.
4. **Ensuite seulement** : étendre l'intégration WordPress CMS (ex. brancher CGU/Confidentialité
   sur les Pages WP, ajouter de nouveaux CPT, etc.).

> Tant que les priorités 1–3 ne sont pas validées, **ne pas** étendre le câblage WordPress
> ni le connecter à des zones authentifiées.

---

## 6. Sécurité & frontières

- WordPress est **public, en lecture seule** côté frontend (pas d'écriture depuis l'app).
- Aucune donnée membre, paiement, rôle ou cotisation ne transite par WordPress.
- Les contenus WordPress (HTML rendu) sont nettoyés via `stripHtml` pour les usages texte ;
  pour le rendu riche, contrôler/échapper le HTML provenant du CMS (source éditoriale de confiance).
- L'authentification, les rôles (`user`/`admin`/`super_admin`) et la logique tontine restent
  exclusivement gérés par **Supabase** — hors du périmètre WordPress.

---

## 7. Référence rapide API

| Méthode (`wordpress.*`) | Endpoint WP | Hook |
|--------------------------|-------------|------|
| `getPosts({page, perPage, category, search})` | `/posts` | `useWPPosts` |
| `getPost(slug)` | `/posts?slug=` | `useWPPost` |
| `getPostById(id)` | `/posts/:id` | — |
| `getPages()` / `getPage(slug)` | `/pages` | `useWPPages` / `useWPPage` |
| `getCategories()` | `/categories` | `useWPCategories` |
| `getMedia(id)` | `/media/:id` | — |
| `getTestimonials()` | `/testimonials` (CPT) | `useWPTestimonials` |
| `getFAQs()` | `/faqs` (CPT) | `useWPFAQs` |
| `isAvailable()` | `/wp-json/` | `useWPAvailable` |

---

*Document de cadrage. Installation détaillée : `WORDPRESS_HEADLESS_SETUP.md`.*
