// Contact WhatsApp public du Cercle des Titans.
//
// Source unique du numéro WhatsApp public, pour éviter toute duplication dans
// les composants (Hero, Bourse Rentrée, Contact, Footer). Les messages passés
// à `buildPublicWhatsAppUrl` sont des constantes STATIQUES définies dans le
// code — jamais de donnée personnelle ni de contenu de formulaire.

/** Numéro WhatsApp public (format international, chiffres uniquement). */
export const PUBLIC_WHATSAPP_NUMBER = "237672482763"; // +237 672 482 763

/**
 * Construit un lien wa.me public vers le numéro du Cercle des Titans, avec un
 * message statique prérempli. Le message est encodé pour l'URL.
 */
export const buildPublicWhatsAppUrl = (message: string): string =>
  `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
