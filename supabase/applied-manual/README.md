# supabase/applied-manual/

## Pourquoi ce dossier existe

Ce dossier contient des changements SQL qui ont été **appliqués manuellement en
production** (via l'API Supabase / SQL editor), **hors du flux CLI** des
migrations. Ils ne sont **pas** enregistrés dans
`supabase_migrations.schema_migrations`.

Il sert de **journal d'audit** : le code SQL exact qui tourne en prod, conservé
dans le repo, sans prétendre faire partie du flux `supabase db push`.

> Ces fichiers ne doivent **jamais** être placés dans `supabase/migrations/` ni
> rejoués. Ils sont déjà actifs en base.

## Projet Supabase

- **Projet** : `txllxnqcptegsgwkvzeb` (Cercle des Titans)

## Fichiers appliqués

| Fichier | Date d'application | Contenu |
|---|---|---|
| `20260619_member_account_status.applied.sql` | **2026-06-19** | Table `member_account_status` + RLS (SELECT self/admin) + helper `current_member_status()` + RPC `admin_set_member_status()` |
| `20260619_member_status_guards.applied.sql` | **2026-06-19** | Gardes de statut sur les 6 RPC tontine : blocage déclaration/sélection pour non‑`active`, exclusion des non‑`active` dans les générateurs daily/weekly + runners |

Ordre d'application : `member_account_status` **puis** `member_status_guards`
(le second dépend de la table et du helper créés par le premier).

## Rappels importants

- ⛔ **Ne pas déplacer ces fichiers dans `supabase/migrations/`.**
- ⛔ **Ne pas relancer `supabase db push`** tant que la dérive
  `migrations/ ↔ schema_migrations` n'est pas réparée. L'historique distant
  (`schema_migrations`) est figé à `20260209000000`, alors que `migrations/`
  contient déjà des fichiers postérieurs (tout le module tontine) non
  enregistrés : un `db push` tenterait de tout rejouer et échouerait sur des
  objets déjà existants.
- ⛔ **Ne pas réappliquer** le SQL de ce dossier : il est déjà actif en prod.

## À traiter séparément, plus tard

La résolution propre de la dérive `migrations/ ↔ schema_migrations` (par ex.
`supabase migration repair` pour marquer les migrations déjà appliquées) est une
opération distincte et plus risquée. Elle doit être **cadrée et validée
séparément** — elle n'est pas effectuée ici.
