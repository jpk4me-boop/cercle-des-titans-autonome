export interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

// Témoignages illustratifs : avatars en initiales (dégradé), noms partiellement
// anonymisés — voir l'avertissement de transparence dans la section.
export const testimonials: Testimonial[] = [
  {
    name: "Nadia El Amrani",
    role: "Pharmacienne · Rabat",
    content:
      "J'ai rejoint le cercle pour structurer mon épargne avec plus de discipline. L'approche est claire et adaptée à mon rythme, et je suis mes cotisations en toute transparence.",
    rating: 5,
    avatar: "NE",
  },
  {
    name: "Mamadou Baldé",
    role: "Chauffeur VTC · Conakry",
    content:
      "La tontine m'aide à mieux organiser mes revenus. Je sais ce que je dois cotiser et je peux suivre mon évolution simplement, sans frais cachés.",
    rating: 5,
    avatar: "MB",
  },
  {
    name: "Grace Achieng",
    role: "Restauratrice · Nairobi",
    content:
      "Avec mon activité, les revenus varient souvent. Le cercle m'apporte une méthode régulière pour garder une vraie discipline financière.",
    rating: 4,
    avatar: "GA",
  },
  {
    name: "Jean-Baptiste Koffi",
    role: "Enseignant · Lomé",
    content:
      "J'apprécie la transparence du fonctionnement. Les étapes sont compréhensibles et le suivi des cotisations donne confiance dans la gestion.",
    rating: 5,
    avatar: "JK",
  },
  {
    name: "Rokhaya Sow",
    role: "Couturière · Thiès",
    content:
      "Cette plateforme me permet d'épargner progressivement, sans pression. C'est simple, régulier et utile pour faire avancer mon atelier.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Samuel Nkemba",
    role: "Développeur web · Douala",
    content:
      "L'espace membre est pratique et me permet de suivre mes engagements. Le système est lisible et bien pensé, chaque opération reste vérifiable.",
    rating: 5,
    avatar: "SN",
  },
  {
    name: "Aïcha Bensalah",
    role: "Gérante de salon · Casablanca",
    content:
      "Le cercle m'aide à séparer mes dépenses personnelles de mes objectifs d'épargne. C'est un vrai cadre de discipline sur le long terme.",
    rating: 4,
    avatar: "AB",
  },
  {
    name: "Ibrahima Touré",
    role: "Artisan menuisier · Bamako",
    content:
      "Je cherchais une solution simple pour cotiser régulièrement. Le suivi me permet de rester concentré sur mes objectifs et d'étaler mes échéances.",
    rating: 5,
    avatar: "IT",
  },
  {
    name: "Marie Kouadio",
    role: "Infirmière · Abidjan",
    content:
      "Le fonctionnement est clair et rassurant. J'avance étape par étape, avec une meilleure visibilité sur mes contributions et leurs échéances.",
    rating: 5,
    avatar: "MK",
  },
  {
    name: "Fatou Ndiaye",
    role: "Consultante RH · Dakar",
    content:
      "J'aime le côté structuré et sérieux. Le cercle apporte une approche professionnelle à une pratique d'épargne collective, sans promesses irréalistes.",
    rating: 5,
    avatar: "FN",
  },
  {
    name: "Kofi Mensah",
    role: "Commerçant · Abidjan",
    content:
      "Pour mon commerce, la régularité est essentielle. Cette plateforme me donne un cadre simple pour organiser mes cotisations et réinvestir sereinement.",
    rating: 4,
    avatar: "KM",
  },
  {
    name: "Aminata Diallo",
    role: "Entrepreneure · Dakar",
    content:
      "Une solution claire et adaptée aux entrepreneurs qui veulent avancer avec méthode. Chaque cotisation est tracée et je vois clairement où va mon argent.",
    rating: 5,
    avatar: "AD",
  },
];
