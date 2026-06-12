# Notes d'intégration CamPay

Le contrat fourni décrit l'utilisation de CamPay pour recevoir des paiements MTN Mobile Money et Orange Money dans la zone CEMAC.

## Points opérationnels à retenir

- CamPay permet de recevoir des paiements MTN Mobile Money et Orange Money via API.
- Le service est prévu pour une durée d'un an renouvelable tacitement.
- Les commissions indiquées dans le contrat sont :
  - 2 % TTC sur les montants crédités ;
  - 1 % TTC sur les retraits ;
  - 5 % pour les cartes VISA/Mastercard ;
  - 2 % pour la conversion des soldes cartes vers Mobile Money ;
  - 5 000 FCFA pour les retraits vers compte bancaire à T+5 jours.
- Les retraits Mobile Money sont séparés par réseau : solde MTN vers MTN, solde Orange vers Orange.

## Ce qui manque pour coder l'intégration complète

Le contrat ne contient pas les détails techniques nécessaires :

- URL de base de l'API CamPay ;
- endpoints de paiement ;
- endpoints de vérification ;
- format exact des webhooks ;
- signature ou mécanisme de validation ;
- clés API de production et sandbox ;
- politique de retry et statuts de transaction.

## Architecture recommandée

Ne pas appeler CamPay directement depuis React. Créer une Edge Function Supabase sécurisée :

```txt
React PaymentModal
   ↓
Supabase Edge Function: initiate-campay-payment
   ↓
CamPay API
   ↓
Webhook CamPay → Edge Function: campay-webhook
   ↓
Table transactions
```

## Variables à prévoir

```bash
supabase secrets set CAMPAY_BASE_URL="..."
supabase secrets set CAMPAY_APP_USERNAME="..."
supabase secrets set CAMPAY_APP_PASSWORD="..."
supabase secrets set CAMPAY_WEBHOOK_SECRET="..."
```

## Statut actuel du code

`src/lib/paymentService.ts` fonctionne en mode simulation. C'est utile pour les tests, mais il faut remplacer cette partie par une fonction serveur avant la mise en production.
