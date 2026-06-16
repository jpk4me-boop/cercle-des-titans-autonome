\# Cercle des Titans — Mémoire projet pour Claude Code



\## Projet



Cercle des Titans est une application web React/TypeScript + Supabase pour gérer une communauté, des membres, des rôles, des cycles de tontines, des cotisations journalières et des paiements.



Le projet local réel se trouve normalement ici :



C:\\Users\\user\\Projects\\cercle-des-titans-autonome



Claude Code doit toujours travailler dans ce dossier local réel, pas dans une archive ZIP isolée.



\## Stack technique



\* Frontend : React + TypeScript + Vite

\* Backend / Auth / DB : Supabase

\* UI : composants React existants du projet

\* Build : npm run build

\* Typecheck : npm run typecheck si disponible

\* Gestion de code : Git local



\## Règles très importantes



Ne jamais faire ces actions sans instruction explicite :



\* Ne pas commit.

\* Ne pas push.

\* Ne pas reconstruire tout le site.

\* Ne pas réécrire toute l’architecture.

\* Ne pas modifier le trigger Supabase handle\_new\_user sans instruction explicite.

\* Ne pas utiliser le rôle "member".

\* Ne pas modifier l’ancienne table contributions.

\* Ne pas casser les pages /admin, /super-admin, /members.

\* Ne pas recréer une deuxième logique de cycles de tontines.

\* Ne pas déployer les migrations Supabase sans validation manuelle.

\* Ne pas déployer les fonctions Edge sans validation manuelle.



\## Rôles utilisés



Les rôles valides sont :



\* user

\* admin

\* super\_admin



Ne pas introduire le rôle "member".



\## Tables importantes



La table officielle existante des cycles est :



\* tontine\_cycles



Le nouveau module de cotisations/paiements doit utiliser :



\* tontine\_contributions



Ne pas utiliser l’ancienne table contributions pour le nouveau module.



\## Objectif actuel



Finaliser proprement le module tontines :



1\. Cycles de tontines.

2\. Catégories de tontines.

3\. Adhésion des membres à une catégorie.

4\. Génération des cotisations journalières.

5\. Déclaration des paiements par les membres.

6\. Validation des paiements par admin/super\_admin.

7\. Clôture des cotisations impayées.

8\. Interface admin pour cotisations/paiements.

9\. Interface membre pour consulter et payer ses cotisations.

10\. Automatisation cron, mais uniquement après validation manuelle du fonctionnement.



\## État connu du projet



Les cycles de tontines côté admin fonctionnent déjà :



\* créer un cycle

\* activer un cycle

\* clôturer un cycle

\* actualiser la liste



Il ne faut pas casser cette logique.



Des fichiers liés au module tontine peuvent déjà exister :



\* supabase/migrations/create\_tontine\_contributions\_module.sql

\* src/types/tontine.ts

\* src/services/tontineService.ts

\* composants admin ou membre liés aux tontines

\* fonctions Edge liées au cron



Toujours inspecter l’état réel du projet avant de modifier.



\## Points de sécurité à corriger ou vérifier en priorité



Avant toute nouvelle fonctionnalité, vérifier la couche SQL/RLS.



\### 1. RLS member\_tontine\_categories



Attention à ne pas utiliser une politique trop large du type FOR ALL qui affaiblit une politique INSERT plus stricte.



La bonne approche est de séparer :



\* SELECT

\* INSERT

\* UPDATE

\* DELETE



L’INSERT doit vérifier que :



\* auth.uid() = user\_id

\* la catégorie sélectionnée est active

\* l’utilisateur ne crée pas une adhésion pour quelqu’un d’autre



\### 2. Sécurité contribution\_payments



Un membre ne doit jamais pouvoir créer un paiement lié à la cotisation d’un autre membre.



La meilleure approche recommandée est une RPC sécurisée :



member\_declare\_tontine\_payment



Elle doit recevoir uniquement :



\* contribution\_id

\* payment\_method\_id

\* amount

\* payment\_reference

\* proof\_url éventuellement



Puis elle doit récupérer elle-même depuis tontine\_contributions :



\* user\_id

\* category\_id

\* cycle\_id



Elle doit vérifier que la contribution appartient bien à auth.uid().



\### 3. Validation admin



La RPC admin\_validate\_tontine\_payment doit utiliser auth.uid() comme validateur.



Ne pas passer p\_validated\_by depuis le frontend.



\### 4. tontine\_cycles



Si la colonne status existe déjà, ADD COLUMN IF NOT EXISTS ne change pas son default.



Il faut vérifier et éventuellement ajouter :



ALTER TABLE public.tontine\_cycles ALTER COLUMN status SET DEFAULT 'planned';



\### 5. Plusieurs cycles actifs



Attention : si plusieurs cycles sont status='active', une fonction avec LIMIT 1 peut choisir un cycle arbitraire.



Il faut soit :



\* empêcher plusieurs cycles actifs avec une contrainte ou index partiel ;

\* soit faire échouer la génération s’il y a plus d’un cycle actif.



\## RPC à vérifier



Vérifier en détail :



\* member\_select\_tontine\_category

\* member\_unselect\_tontine\_category

\* member\_declare\_tontine\_payment si créée

\* generate\_daily\_tontine\_contributions

\* admin\_validate\_tontine\_payment

\* close\_daily\_tontine\_contributions

\* run\_daily\_tontine\_cron si créée



Pour chaque RPC, vérifier :



\* paramètres

\* sécurité

\* auth.uid()

\* SECURITY DEFINER ou non

\* tables lues

\* tables écrites

\* droits GRANT/REVOKE

\* erreurs possibles

\* cohérence métier



\## Cron / automatisation



Ne pas déployer le cron maintenant.



Logique souhaitée :



\* Générer les cotisations du jour.

\* Clôturer seulement les cotisations des jours passés, ou bien clôturer le soir/la nuit après la journée de paiement.



Un cron acceptable peut faire :



\* generate p\_target\_date

\* close due\_date < p\_target\_date



Il ne doit pas générer aujourd’hui puis clôturer immédiatement les cotisations d’aujourd’hui.



Le cron doit être déployé seulement après les tests manuels :



\* génération admin

\* déclaration paiement membre

\* validation paiement admin

\* recalcul statut paid / partial / pending

\* clôture overdue



\## Commandes de validation



Après chaque intervention importante, exécuter :



git status --short



git diff --stat



npm run typecheck



npm run build



Si npm run typecheck n’existe pas, le signaler clairement.



\## Format de rapport attendu après modification



Toujours fournir :



1\. Fichiers modifiés.

2\. Résumé précis des changements.

3\. Risques corrigés.

4\. Risques restants.

5\. Résultat complet de npm run typecheck.

6\. Résultat complet de npm run build.

7\. Résultat de git status --short.

8\. Ne pas commit.

9\. Ne pas push.



\## Priorité actuelle de travail



La priorité actuelle est :



1\. Vérifier le vrai état Git du projet local.

2\. Corriger la sécurité SQL/RLS.

3\. Sécuriser la déclaration de paiement membre.

4\. Corriger les protections des cycles actifs.

5\. Valider build/typecheck.

6\. Ensuite seulement intégrer ou ajuster l’interface.

7\. Le cron vient en dernier.



\## Instruction permanente



Avant toute modification, inspecter les fichiers concernés.



Ne pas travailler “large”.



Faire des modifications chirurgicales et limitées.



Attendre validation humaine avant toute étape risquée.



