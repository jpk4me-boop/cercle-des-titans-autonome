import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  // Navbar
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.about': { fr: 'À propos', en: 'About Us' },
  'nav.tontine': { fr: 'La Tontine', en: 'The Tontine' },
  'nav.presentation': { fr: 'Présentation', en: 'Overview' },
  'nav.categories': { fr: 'Les catégories', en: 'Categories' },
  'nav.comparison': { fr: 'Comparatif', en: 'Comparison' },
  'nav.financing': { fr: 'Appui', en: 'Support' },
  'nav.financingFund': { fr: 'Fonds d\'appui communautaire', en: 'Community Support Fund' },
  'nav.howItWorks': { fr: 'Comment ça marche', en: 'How It Works' },
  'nav.testimonials': { fr: 'Témoignages', en: 'Testimonials' },
  'nav.join': { fr: 'Rejoindre', en: 'Join Now' },
  'nav.memberArea': { fr: 'Espace membre', en: 'Member Area' },
  'nav.admin': { fr: 'Admin', en: 'Admin' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },

  // Hero Section
  'hero.title1': { fr: 'Ensemble, nous', en: 'Together, we' },
  'hero.title2': { fr: 'épargnons, investissons', en: 'save, invest' },
  'hero.title3': { fr: 'et réussissons', en: 'and succeed' },
  'hero.subtitle': {
    fr: 'Rejoignez le Cercle des Titans, une communauté africaine solidaire dédiée à l\'épargne collective. Grâce à des tontines encadrées et un suivi transparent des cotisations, chaque membre épargne avec régularité et avance en confiance.',
    en: 'Join the Circle of Titans, a solidarity-driven African community dedicated to collective savings. Through structured tontines and transparent contribution tracking, each member saves consistently and moves forward with confidence.'
  },
  'hero.feature1': { fr: 'Tontine structurée', en: 'Structured ROSCA' },
  'hero.feature2': { fr: 'Fonds d\'appui communautaire', en: 'Community Support Fund' },
  'hero.feature3': { fr: 'Réussite collective', en: 'Collective Success' },
  'hero.feature4': { fr: 'Discipline & entraide', en: 'Discipline & Support' },
  'hero.cta': { fr: 'Rejoindre le Cercle', en: 'Join the Circle' },
  'hero.ctaSecondary': { fr: 'Voir comment ça marche', en: 'See How It Works' },

  // About Section
  'about.heritage': { fr: 'Notre héritage', en: 'Our Heritage' },
  'about.title': { fr: 'La Tontine Africaine', en: 'The African Tontine' },
  'about.description1': { 
    fr: 'La tontine est un modèle collectif d\'épargne et de mobilisation de capital profondément enraciné dans la culture africaine. Elle repose sur un engagement régulier de membres réunis autour de règles claires et de confiance mutuelle.',
    en: 'The tontine is a collective savings and capital mobilization model deeply rooted in African culture. It relies on regular commitment from members united around clear rules and mutual trust.'
  },
  'about.description2': { 
    fr: 'Ce système, transmis de génération en génération, permet à chacun d\'accéder à des fonds importants tout en cultivant la solidarité et la confiance au sein de la communauté.',
    en: 'This system, passed down through generations, allows everyone to access significant funds while cultivating solidarity and trust within the community.'
  },
  'about.exampleTitle': { fr: 'Exemple concret', en: 'Concrete Example' },
  'about.exampleText1': { fr: '24 membres cotisent 10 000 FCFA chaque mois.', en: '24 members contribute 10,000 FCFA each month.' },
  'about.exampleText2': { fr: 'Cagnotte mensuelle totale:', en: 'Total monthly pot:' },
  'about.exampleAmount': { fr: '240 000 FCFA', en: '240,000 FCFA' },
  'about.exampleFooter': { fr: 'Aucun intérêt • Aucun frais • 100% solidaire', en: 'No interest • No fees • 100% solidarity' },

  // Advantages
  'advantage.noInterest.title': { fr: 'Sans intérêts', en: 'Interest-Free' },
  'advantage.noInterest.desc': { 
    fr: 'Un système basé sur la confiance mutuelle. Aucun intérêt bancaire, aucun taux caché. Les membres cotisent ensemble et bénéficient des montants mobilisés équitablement.',
    en: 'A system based on mutual trust. No bank interest, no hidden rates. Members contribute together and benefit from mobilized amounts fairly.'
  },
  'advantage.solidarity.title': { fr: 'Solidarité communautaire', en: 'Community Solidarity' },
  'advantage.solidarity.desc': { 
    fr: 'Chacun avance grâce aux autres. Les cotisations créent un soutien collectif où chaque membre contribue à la réussite de tous.',
    en: 'Everyone moves forward thanks to others. Contributions create collective support where each member contributes to everyone\'s success.'
  },
  'advantage.discipline.title': { fr: 'Discipline financière', en: 'Financial Discipline' },
  'advantage.discipline.desc': { 
    fr: 'Un cadre structuré qui vous aide à épargner régulièrement, planifier et atteindre vos objectifs financiers.',
    en: 'A structured framework that helps you save regularly, plan, and achieve your financial goals.'
  },
  'advantage.social.title': { fr: 'Lien social', en: 'Social Bonds' },
  'advantage.social.desc': { 
    fr: 'Renforcez vos liens avec une communauté partageant les mêmes valeurs d\'entraide, discipline et ambition.',
    en: 'Strengthen your bonds with a community sharing the same values of mutual aid, discipline, and ambition.'
  },
  'advantage.access.title': { fr: 'Accès aux fonds mobilisés', en: 'Access to Pooled Funds' },
  'advantage.access.desc': {
    fr: 'Accédez aux montants mobilisés par le groupe selon des règles claires et un calendrier défini, sans procédures complexes.',
    en: 'Access the amounts pooled by the group according to clear rules and a defined schedule, without complex procedures.'
  },
  'advantage.flexibility.title': { fr: 'Flexibilité', en: 'Flexibility' },
  'advantage.flexibility.desc': { 
    fr: 'Choisissez la catégorie de cotisation qui correspond à vos moyens et évoluez progressivement.',
    en: 'Choose the contribution category that matches your means and progress gradually.'
  },

  // How It Works
  'howItWorks.title': { fr: 'Comment ça marche ?', en: 'How Does It Work?' },
  'howItWorks.subtitle': { fr: 'Un processus simple et transparent pour épargner ensemble', en: 'A simple and transparent process to save together' },
  'howItWorks.step1.title': { fr: 'Rejoignez un cercle', en: 'Join a Circle' },
  'howItWorks.step1.desc': { 
    fr: 'Intégrez un groupe de confiance composé de membres partageant les mêmes objectifs financiers. Bénéficiez d\'un cadre structuré et d\'un accompagnement communautaire.',
    en: 'Join a trusted group of members sharing the same financial goals. Benefit from a structured framework and community support.'
  },
  'howItWorks.step2.title': { fr: 'Cotisez régulièrement', en: 'Contribute Regularly' },
  'howItWorks.step2.desc': { 
    fr: 'Chaque membre contribue une somme fixe selon un calendrier défini. Cette constance sécurise la cagnotte collective.',
    en: 'Each member contributes a fixed amount according to a defined schedule. This consistency secures the collective pot.'
  },
  'howItWorks.step3.title': { fr: 'Recevez votre pot', en: 'Receive Your Pot' },
  'howItWorks.step3.desc': { 
    fr: 'À tour de rôle, chaque membre reçoit la totalité des cotisations collectées pour financer ses projets.',
    en: 'In turn, each member receives all collected contributions to finance their projects.'
  },

  // Benefits
  'benefits.title': { fr: 'Pourquoi nous rejoindre ?', en: 'Why Join Us?' },
  'benefits.subtitle': { fr: 'Le Cercle offre un accès facile à l\'appui de projets sans banques ni procédures complexes', en: 'The Circle provides easy access to project support without banks or complex procedures' },
  'benefits.growth.title': { fr: 'Croissance financière', en: 'Financial Growth' },
  'benefits.growth.desc': { fr: 'Atteignez vos objectifs d\'épargne dans un cadre régulier, structuré et transparent', en: 'Reach your savings goals within a regular, structured and transparent framework' },
  'benefits.community.title': { fr: 'Soutien communautaire', en: 'Community Support' },
  'benefits.community.desc': { fr: 'La force du groupe favorise la progression individuelle', en: 'The strength of the group fosters individual growth' },
  'benefits.noBank.title': { fr: 'Sans contraintes bancaires', en: 'No Bank Constraints' },
  'benefits.noBank.desc': { fr: 'Pas de dossiers complexes ni de conditions strictes', en: 'No complex files or strict conditions' },
  'benefits.trust.title': { fr: 'Confiance & transparence', en: 'Trust & Transparency' },
  'benefits.trust.desc': { fr: 'Règles claires et gestion transparente du cercle', en: 'Clear rules and transparent circle management' },

  // Financing
  'financing.title': { fr: 'Appui', en: 'Support' },
  'financing.subtitle': { fr: 'Des solutions d\'appui adaptées à vos besoins, sans les contraintes bancaires traditionnelles', en: 'Support solutions adapted to your needs, without traditional bank constraints' },
  'financing.projects.title': { fr: 'Appui aux projets', en: 'Project Support' },
  'financing.projects.desc': { fr: 'Accédez à des fonds pour démarrer ou développer votre activité grâce à la solidarité du groupe.', en: 'Access funds to start or grow your business through group solidarity.' },
  'financing.projects.amount': { fr: 'Jusqu\'à 500 000 FCFA', en: 'Up to 500,000 FCFA' },
  'financing.investment.title': { fr: 'Épargne collective organisée', en: 'Organized Collective Savings' },
  'financing.investment.desc': { fr: 'Participez à des projets communautaires solidaires et progressez équitablement avec le groupe.', en: 'Take part in solidarity-driven community projects and progress fairly with the group.' },
  'financing.investment.amount': { fr: 'Progression collective', en: 'Collective progress' },
  'financing.emergency.title': { fr: 'Fonds d\'urgence', en: 'Emergency Fund' },
  'financing.emergency.desc': { fr: 'Bénéficiez d\'un appui solidaire en cas d\'imprévu grâce au fonds de solidarité du cercle, selon les règles du groupe.', en: 'Benefit from solidarity support in case of unexpected events through the circle\'s solidarity fund, according to group rules.' },
  'financing.emergency.amount': { fr: 'Solidarité en cas d\'imprévu', en: 'Solidarity in unexpected times' },
  'financing.loan.title': { fr: 'Appui communautaire encadré', en: 'Structured Community Support' },
  'financing.loan.desc': { fr: 'Bénéficiez d\'un appui du cercle, sans intérêts bancaires ni frais cachés. Restitution flexible selon les règles du groupe.', en: 'Benefit from community support, without bank interest or hidden fees. Flexible restitution according to group rules.' },
  'financing.loan.amount': { fr: 'Sans intérêts bancaires', en: 'No bank interest' },
  'financing.cta': { fr: 'Demander un appui', en: 'Request Support' },

  // Testimonials
  'testimonials.title': { fr: 'Témoignages', en: 'Testimonials' },
  'testimonials.badge': { fr: 'Ils nous font confiance', en: 'Trusted by our members' },
  'testimonials.subtitle': { fr: 'Découvrez ce que nos membres disent de leur expérience', en: 'Discover what our members say about their experience' },
  'testimonials.disclaimer': {
    fr: 'Les avatars sont des illustrations générées et ne représentent pas de photographies réelles. Certains noms ont été modifiés pour préserver la confidentialité des membres.',
    en: 'Avatars are generated illustrations and do not represent real photographs. Some names have been changed to protect members’ privacy.',
  },
  
  // FAQ
  'faq.title': { fr: 'Questions fréquentes', en: 'Frequently Asked Questions' },
  'faq.subtitle': { fr: 'Tout ce que vous devez savoir sur la tontine et notre communauté', en: 'Everything you need to know about tontine and our community' },
  'faq.q1': { fr: 'Qu\'est-ce qu\'une tontine ?', en: 'What is a tontine (ROSCA)?' },
  'faq.a1': { 
    fr: 'Une tontine est un système d\'épargne collectif traditionnel africain où un groupe de personnes cotise régulièrement une somme fixe. À chaque tour, un membre reçoit la totalité du pot commun.',
    en: 'A tontine (ROSCA) is a traditional African collective savings system where a group of people regularly contributes a fixed amount. Each round, one member receives the entire common pot.'
  },
  'faq.q2': { fr: 'Comment rejoindre le Cercle des Titans ?', en: 'How do I join the Circle of Titans?' },
  'faq.a2': { 
    fr: 'Cliquez sur « Rejoindre » et remplissez le formulaire. Notre équipe vous contactera pour vous présenter les différents cercles disponibles.',
    en: 'Click "Join Now" and fill out the form. Our team will contact you to present the different available circles.'
  },
  'faq.q3': { fr: 'Quel est le montant minimum de cotisation ?', en: 'What is the minimum contribution amount?' },
  'faq.a3': {
    fr: 'Les montants varient selon les catégories. Nous proposons des cercles adaptés à tous les budgets, à partir de 5 000 FCFA par semaine.',
    en: 'Amounts vary by category. We offer circles adapted to all budgets, starting from 5,000 FCFA per week.'
  },
  'faq.q4': { fr: 'Comment est déterminé l\'ordre de réception ?', en: 'How is the receiving order determined?' },
  'faq.a4': { 
    fr: 'L\'ordre peut être déterminé par tirage au sort, enchères, rotation fixe ou selon les besoins urgents des membres.',
    en: 'The order can be determined by lottery, bidding, fixed rotation, or based on members\' urgent needs.'
  },
  'faq.q5': { fr: 'La tontine est-elle légale ?', en: 'Is the tontine legal?' },
  'faq.a5': { 
    fr: 'Oui, la tontine est parfaitement légale. Notre structure respecte toutes les réglementations en vigueur.',
    en: 'Yes, the tontine is perfectly legal. Our structure complies with all applicable regulations.'
  },

  // Contact
  'contact.label': { fr: 'Contact', en: 'Contact' },
  'contact.title': { fr: 'Rejoignez le', en: 'Join the' },
  'contact.titleHighlight': { fr: 'Cercle', en: 'Circle' },
  'contact.subtitle': {
    fr: 'Envie d\'épargner au sein d\'une communauté encadrée et transparente ? Remplissez le formulaire et notre équipe vous recontactera.',
    en: 'Want to save within a structured and transparent community? Fill out the form and our team will get back to you.'
  },
  'contact.address': { fr: 'Adresse', en: 'Address' },
  'contact.phone': { fr: 'Téléphone', en: 'Phone' },
  'contact.email': { fr: 'Email', en: 'Email' },
  'contact.formTitle': { fr: 'Formulaire d\'inscription', en: 'Registration Form' },
  'contact.namePlaceholder': { fr: 'Votre nom complet', en: 'Your full name' },
  'contact.emailPlaceholder': { fr: 'Votre adresse email', en: 'Your email address' },
  'contact.phonePlaceholder': { fr: 'Votre numéro de téléphone', en: 'Your phone number' },
  'contact.messagePlaceholder': { fr: 'Parlez-nous de vos objectifs financiers...', en: 'Tell us about your financial goals...' },
  'contact.submit': { fr: 'Envoyer ma demande', en: 'Send my request' },
  'contact.submitting': { fr: 'Envoi en cours...', en: 'Sending...' },
  'contact.success.title': { fr: 'Demande envoyée !', en: 'Request sent!' },
  'contact.success.desc': { fr: 'Nous vous contacterons dans les plus brefs délais.', en: 'We will contact you as soon as possible.' },

  // Footer
  'footer.description': { 
    fr: 'Une communauté d\'épargne collective inspirée de la tradition africaine, modernisée pour l\'ère numérique.',
    en: 'A collective savings community inspired by African tradition, modernized for the digital age.'
  },
  'footer.navigation': { fr: 'Navigation', en: 'Navigation' },
  'footer.contact': { fr: 'Contact', en: 'Contact' },
  'footer.followUs': { fr: 'Suivez-nous', en: 'Follow Us' },
  'footer.legalMentions': { fr: 'Mentions légales', en: 'Legal Mentions' },
  'footer.privacyPolicy': { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
  'footer.terms': { fr: 'CGU', en: 'Terms of Use' },
  'footer.copyright': { fr: 'Tous droits réservés.', en: 'All rights reserved.' },

  // Membership Categories
  'membership.badge': { fr: 'Choisissez votre niveau', en: 'Choose Your Level' },
  'membership.title': { fr: 'Nos catégories de', en: 'Our Contribution' },
  'membership.titleHighlight': { fr: 'cotisation', en: 'Categories' },
  'membership.subtitle': { 
    fr: 'Rejoignez le Cercle des Titans et choisissez la catégorie qui correspond à vos ambitions financières.',
    en: 'Join the Circle of Titans and choose the category that matches your financial ambitions.'
  },
  'membership.recommended': { fr: 'RECOMMANDÉ', en: 'RECOMMENDED' },
  'membership.perWeek': { fr: '/Semaine', en: '/Week' },
  'membership.join': { fr: 'Rejoindre', en: 'Join Now' },
  'membership.learnMore': { fr: 'En savoir plus', en: 'Learn More' },
  'membership.helpText': { 
    fr: 'Besoin d\'aide pour choisir ? Contactez notre équipe pour un accompagnement personnalisé.',
    en: 'Need help choosing? Contact our team for personalized guidance.'
  },
  'membership.contactUs': { fr: 'Nous contacter', en: 'Contact Us' },

  // Category names and taglines
  'category.bronze.name': { fr: 'Bronze', en: 'Bronze' },
  'category.bronze.tagline': { fr: 'Commencer à partir de rien', en: 'Start from scratch' },
  'category.silver.name': { fr: 'Silver', en: 'Silver' },
  'category.silver.tagline': { fr: 'Le premier vrai levier de progression', en: 'Your first real lever for growth' },
  'category.gold.name': { fr: 'Gold', en: 'Gold' },
  'category.gold.tagline': { fr: 'Transformer l\'ambition en action', en: 'Turn ambition into action' },
  'category.diamond.name': { fr: 'Diamond', en: 'Diamond' },
  'category.diamond.tagline': { fr: 'Accélérer sa réussite financière', en: 'Accelerate your financial success' },
  'category.platinum.name': { fr: 'Platinium', en: 'Platinum' },
  'category.platinum.tagline': { fr: 'Jouer dans la cour des grands', en: 'Play in the big leagues' },
  'category.prestige.name': { fr: 'Prestige', en: 'Prestige' },
  'category.prestige.tagline': { fr: 'Le sommet du Cercle des Titans', en: 'The pinnacle of the Circle' },

  // Category benefits
  'benefit.structuredTontine': { fr: 'Tontine structurée', en: 'Structured ROSCA' },
  'benefit.financialDiscipline': { fr: 'Discipline financière', en: 'Financial discipline' },
  'benefit.communityIntegration': { fr: 'Intégration communautaire', en: 'Community integration' },
  'benefit.basicOpportunities': { fr: 'Accès aux opportunités de base', en: 'Access to basic opportunities' },
  'benefit.microFinancing': { fr: 'Possibilité de micro-appui', en: 'Micro-support options' },
  'benefit.enhancedTontine': { fr: 'Tontine renforcée', en: 'Enhanced ROSCA' },
  'benefit.improvedBonus': { fr: 'Avantages améliorés', en: 'Improved benefits' },
  'benefit.priorityAccess': { fr: 'Accès prioritaire aux opportunités', en: 'Priority access to opportunities' },
  'benefit.activeNetwork': { fr: 'Réseau actif', en: 'Active network' },
  'benefit.projectFinancing': { fr: 'Possibilité d\'appui aux projets', en: 'Project support options' },
  'benefit.higherGains': { fr: 'Montants de cycle plus élevés', en: 'Higher cycle amounts' },
  'benefit.reinforcedBonus': { fr: 'Avantages renforcés', en: 'Enhanced benefits' },
  'benefit.fundingEligibility': { fr: 'Éligibilité élevée au fonds', en: 'High funding eligibility' },
  'benefit.communityRecognition': { fr: 'Reconnaissance communautaire', en: 'Community recognition' },
  'benefit.highImpact': { fr: 'Tontine à fort impact', en: 'High-impact ROSCA' },
  'benefit.highBonus': { fr: 'Avantages élevés', en: 'High-tier benefits' },
  'benefit.fundingPriority': { fr: 'Priorité à l\'appui', en: 'Support priority' },
  'benefit.strategicPosition': { fr: 'Position stratégique', en: 'Strategic position' },
  'benefit.privilegedAccess': { fr: 'Accès privilégié aux appuis importants', en: 'Privileged access to major support' },
  'benefit.premiumBonus': { fr: 'Avantages premium', en: 'Premium benefits' },
  'benefit.strategicSupport': { fr: 'Accompagnement stratégique', en: 'Strategic support' },
  'benefit.enhancedVisibility': { fr: 'Visibilité renforcée', en: 'Enhanced visibility' },
  'benefit.maxFundAccess': { fr: 'Accès maximal aux fonds', en: 'Maximum fund access' },
  'benefit.exclusiveBonus': { fr: 'Avantages membres', en: 'Member benefits' },
  'benefit.eliteNetwork': { fr: 'Réseau privé', en: 'Private network' },
  'benefit.priorityTreatment': { fr: 'Traitement prioritaire des projets', en: 'Priority project treatment' },

  // Payment Section
  'payment.title': { fr: 'Choisissez Votre', en: 'Choose Your' },
  'payment.titleHighlight': { fr: 'Cotisation', en: 'Contribution' },
  'payment.subtitle': { 
    fr: 'Sélectionnez une catégorie et payez en toute sécurité via MTN Mobile Money ou Orange Money',
    en: 'Select a category and pay securely via MTN Mobile Money or Orange Money'
  },
  'payment.monthlyAmount': { fr: 'Montant mensuel', en: 'Monthly Amount' },
  'payment.payNow': { fr: 'Payer maintenant', en: 'Pay Now' },
  'payment.methodsTitle': { fr: 'Modes de paiement acceptés', en: 'Accepted Payment Methods' },

  // About Page
  'aboutPage.hero.badge': { fr: 'Notre Histoire', en: 'Our Story' },
  'aboutPage.hero.title': { fr: 'Cercle des Titans', en: 'Circle of Titans' },
  'aboutPage.hero.subtitle': { 
    fr: 'Une communauté africaine dynamique dédiée à la réussite financière collective à travers des tontines structurées.',
    en: 'A vibrant African community dedicated to collective financial success through structured rotating savings.'
  },

  'aboutPage.mission.badge': { fr: 'Notre Mission', en: 'Our Mission' },
  'aboutPage.mission.title': { fr: 'Transformer des vies par la solidarité financière', en: 'Transforming Lives Through Financial Solidarity' },
  'aboutPage.mission.text1': { 
    fr: 'Le Cercle des Titans est né d\'une vision simple mais puissante : permettre à chaque Africain, où qu\'il soit dans le monde, d\'accéder à des opportunités financières sans les barrières traditionnelles des banques.',
    en: 'The Circle of Titans was born from a simple but powerful vision: enabling every African, wherever they are in the world, to access financial opportunities without the traditional barriers of banks.'
  },
  'aboutPage.mission.text2': { 
    fr: 'Nous croyons que la force du collectif peut transformer des petites cotisations régulières en véritables leviers de croissance personnelle et professionnelle.',
    en: 'We believe that the power of the collective can transform small regular contributions into real levers for personal and professional growth.'
  },

  'aboutPage.history.badge': { fr: 'Notre Histoire', en: 'Our History' },
  'aboutPage.history.title': { fr: 'Enracinés dans la tradition, tournés vers l\'avenir', en: 'Rooted in Tradition, Looking to the Future' },
  'aboutPage.history.text1': { 
    fr: 'La tontine est un pilier ancestral des communautés africaines depuis des siècles. Ce système d\'épargne collective, basé sur la confiance mutuelle et la solidarité, a permis à des générations entières de financer leurs projets, leurs études, leurs entreprises.',
    en: 'The tontine has been an ancestral pillar of African communities for centuries. This collective savings system, based on mutual trust and solidarity, has enabled entire generations to finance their projects, studies, and businesses.'
  },
  'aboutPage.history.text2': { 
    fr: 'En 2024, nous avons décidé de moderniser ce modèle éprouvé pour l\'adapter à l\'ère numérique, tout en préservant les valeurs fondamentales qui font sa force : la confiance, la discipline et l\'entraide.',
    en: 'In 2024, we decided to modernize this proven model for the digital age, while preserving the fundamental values that make it strong: trust, discipline, and mutual aid.'
  },
  'aboutPage.history.milestone1.year': { fr: '2024', en: '2024' },
  'aboutPage.history.milestone1.title': { fr: 'Fondation', en: 'Foundation' },
  'aboutPage.history.milestone1.desc': { fr: 'Création du Cercle des Titans à Douala', en: 'Creation of Circle of Titans in Douala' },
  'aboutPage.history.milestone2.year': { fr: '2024', en: '2024' },
  'aboutPage.history.milestone2.title': { fr: 'Expansion', en: 'Expansion' },
  'aboutPage.history.milestone2.desc': { fr: 'Ouverture à la diaspora africaine', en: 'Opening to the African diaspora' },
  'aboutPage.history.milestone3.year': { fr: '2025', en: '2025' },
  'aboutPage.history.milestone3.title': { fr: 'Croissance', en: 'Growth' },
  'aboutPage.history.milestone3.desc': { fr: 'Plus de 500 membres actifs', en: 'Over 500 active members' },

  'aboutPage.values.badge': { fr: 'Nos Valeurs', en: 'Our Values' },
  'aboutPage.values.title': { fr: 'Les piliers de notre communauté', en: 'The Pillars of Our Community' },
  'aboutPage.values.trust.title': { fr: 'Confiance', en: 'Trust' },
  'aboutPage.values.trust.desc': { 
    fr: 'La confiance mutuelle est le fondement de notre communauté. Chaque membre s\'engage à respecter ses engagements envers les autres.',
    en: 'Mutual trust is the foundation of our community. Each member commits to honoring their commitments to others.'
  },
  'aboutPage.values.discipline.title': { fr: 'Discipline', en: 'Discipline' },
  'aboutPage.values.discipline.desc': { 
    fr: 'La régularité et la rigueur dans les cotisations permettent à chacun d\'atteindre ses objectifs financiers.',
    en: 'Regularity and rigor in contributions allow everyone to achieve their financial goals.'
  },
  'aboutPage.values.empowerment.title': { fr: 'Autonomisation', en: 'Empowerment' },
  'aboutPage.values.empowerment.desc': { 
    fr: 'Nous croyons en la capacité de chacun à transformer sa vie grâce au soutien du collectif.',
    en: 'We believe in everyone\'s ability to transform their life through collective support.'
  },
  'aboutPage.values.solidarity.title': { fr: 'Solidarité', en: 'Solidarity' },
  'aboutPage.values.solidarity.desc': { 
    fr: 'L\'entraide et le soutien mutuel sont au cœur de chaque action du Cercle des Titans.',
    en: 'Mutual aid and support are at the heart of every action of the Circle of Titans.'
  },
  'aboutPage.values.transparency.title': { fr: 'Transparence', en: 'Transparency' },
  'aboutPage.values.transparency.desc': { 
    fr: 'Toutes nos règles et processus sont clairs, documentés et accessibles à tous les membres.',
    en: 'All our rules and processes are clear, documented, and accessible to all members.'
  },
  'aboutPage.values.excellence.title': { fr: 'Excellence', en: 'Excellence' },
  'aboutPage.values.excellence.desc': { 
    fr: 'Nous visons l\'excellence dans tout ce que nous faisons, pour offrir le meilleur à notre communauté.',
    en: 'We strive for excellence in everything we do, to offer the best to our community.'
  },

  'aboutPage.team.badge': { fr: 'Notre Équipe', en: 'Our Team' },
  'aboutPage.team.title': { fr: 'Des leaders engagés pour votre réussite', en: 'Committed Leaders for Your Success' },
  'aboutPage.team.subtitle': { 
    fr: 'Une équipe passionnée, expérimentée et dévouée à la mission du Cercle des Titans.',
    en: 'A passionate, experienced team dedicated to the Circle of Titans mission.'
  },

  'aboutPage.cta.title': { fr: 'Prêt à rejoindre notre communauté ?', en: 'Ready to Join Our Community?' },
  'aboutPage.cta.subtitle': { 
    fr: 'Commencez votre parcours vers la réussite financière collective dès aujourd\'hui.',
    en: 'Start your journey towards collective financial success today.'
  },
  'aboutPage.cta.button': { fr: 'Rejoindre le Cercle', en: 'Join the Circle' },

  // Privacy Policy
  'privacy.title': { fr: 'Politique de Confidentialité', en: 'Privacy Policy' },
  'privacy.subtitle': { 
    fr: 'Nous nous engageons à protéger vos informations personnelles et votre vie privée.',
    en: 'We are committed to protecting your personal information and privacy.'
  },
  'privacy.lastUpdated': { fr: 'Dernière mise à jour', en: 'Last updated' },
  'privacy.section1.title': { fr: 'Collecte des Informations', en: 'Information Collection' },
  'privacy.section1.content': { 
    fr: 'Nous collectons les informations que vous nous fournissez directement lors de votre inscription, y compris votre nom, adresse email, numéro de téléphone et informations de paiement. Ces données sont essentielles pour gérer votre adhésion et vos cotisations au sein du Cercle des Titans.\n\nNous pouvons également collecter automatiquement certaines informations techniques comme votre adresse IP, type de navigateur et pages visitées pour améliorer nos services.',
    en: 'We collect information you provide directly when you register, including your name, email address, phone number, and payment information. This data is essential for managing your membership and contributions within the Circle of Titans.\n\nWe may also automatically collect certain technical information such as your IP address, browser type, and pages visited to improve our services.'
  },
  'privacy.section2.title': { fr: 'Utilisation des Données', en: 'Data Usage' },
  'privacy.section2.content': { 
    fr: 'Vos informations personnelles sont utilisées pour:\n• Gérer votre compte et vos cotisations\n• Vous contacter concernant votre participation à la tontine\n• Envoyer des notifications importantes sur les cycles de paiement\n• Améliorer nos services et votre expérience utilisateur\n• Respecter nos obligations légales et réglementaires',
    en: 'Your personal information is used to:\n• Manage your account and contributions\n• Contact you regarding your tontine participation\n• Send important notifications about payment cycles\n• Improve our services and your user experience\n• Comply with our legal and regulatory obligations'
  },
  'privacy.section3.title': { fr: 'Protection des Données', en: 'Data Protection' },
  'privacy.section3.content': { 
    fr: 'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.\n\nVos informations de paiement sont cryptées et traitées via des plateformes sécurisées conformes aux normes PCI-DSS.',
    en: 'We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, modification, disclosure, or destruction.\n\nYour payment information is encrypted and processed through secure platforms compliant with PCI-DSS standards.'
  },
  'privacy.section4.title': { fr: 'Vos Droits', en: 'Your Rights' },
  'privacy.section4.content': { 
    fr: 'Conformément à la réglementation applicable, vous disposez des droits suivants:\n• Droit d\'accès à vos données personnelles\n• Droit de rectification des informations inexactes\n• Droit à l\'effacement de vos données\n• Droit à la portabilité de vos données\n• Droit d\'opposition au traitement\n\nPour exercer ces droits, contactez-nous à l\'adresse indiquée ci-dessous.',
    en: 'In accordance with applicable regulations, you have the following rights:\n• Right to access your personal data\n• Right to rectify inaccurate information\n• Right to erasure of your data\n• Right to data portability\n• Right to object to processing\n\nTo exercise these rights, contact us at the address indicated below.'
  },
  'privacy.section5.title': { fr: 'Cookies et Technologies', en: 'Cookies and Technologies' },
  'privacy.section5.content': { 
    fr: 'Notre site utilise des cookies et technologies similaires pour améliorer votre expérience de navigation, analyser l\'utilisation du site et personnaliser le contenu.\n\nVous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités du site.',
    en: 'Our site uses cookies and similar technologies to enhance your browsing experience, analyze site usage, and personalize content.\n\nYou can configure your browser to refuse cookies, but this may affect certain site features.'
  },
  'privacy.section6.title': { fr: 'Modifications de la Politique', en: 'Policy Changes' },
  'privacy.section6.content': { 
    fr: 'Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page.\n\nNous vous encourageons à consulter régulièrement cette page pour rester informé des mises à jour.',
    en: 'We reserve the right to modify this privacy policy at any time. Changes become effective upon posting on this page.\n\nWe encourage you to regularly review this page to stay informed of updates.'
  },
  'privacy.contact.title': { fr: 'Nous Contacter', en: 'Contact Us' },
  'privacy.contact.content': { 
    fr: 'Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à:',
    en: 'For any questions regarding this privacy policy or your personal data, contact us at:'
  },

  // Terms of Use
  'terms.title': { fr: 'Conditions d\'Utilisation', en: 'Terms of Use' },
  'terms.subtitle': { 
    fr: 'Veuillez lire attentivement ces conditions avant d\'utiliser nos services.',
    en: 'Please read these terms carefully before using our services.'
  },
  'terms.lastUpdated': { fr: 'Dernière mise à jour', en: 'Last updated' },
  'terms.section1.title': { fr: 'Acceptation des Conditions', en: 'Acceptance of Terms' },
  'terms.section1.content': { 
    fr: 'En accédant à ce site et en utilisant les services du Cercle des Titans, vous acceptez d\'être lié par ces conditions d\'utilisation, toutes les lois et réglementations applicables.\n\nSi vous n\'acceptez pas ces conditions, veuillez ne pas utiliser nos services.',
    en: 'By accessing this site and using the Circle of Titans services, you agree to be bound by these terms of use, all applicable laws and regulations.\n\nIf you do not accept these terms, please do not use our services.'
  },
  'terms.section2.title': { fr: 'Adhésion et Participation', en: 'Membership and Participation' },
  'terms.section2.content': { 
    fr: 'L\'adhésion au Cercle des Titans implique:\n• Le paiement des frais d\'adhésion selon votre catégorie choisie\n• L\'engagement à respecter le calendrier des cotisations\n• La participation active aux activités du cercle\n• Le respect des autres membres et des règles de la communauté\n\nToute violation de ces engagements peut entraîner l\'exclusion du cercle.',
    en: 'Membership in the Circle of Titans involves:\n• Payment of membership fees according to your chosen category\n• Commitment to respecting the contribution schedule\n• Active participation in circle activities\n• Respect for other members and community rules\n\nAny violation of these commitments may result in exclusion from the circle.'
  },
  'terms.section3.title': { fr: 'Cotisations et Paiements', en: 'Contributions and Payments' },
  'terms.section3.content': { 
    fr: 'Les cotisations doivent être versées selon le calendrier établi pour chaque cycle. Le non-paiement des cotisations dans les délais impartis peut entraîner:\n• Des pénalités de retard\n• La suspension de vos droits de bénéficiaire\n• L\'exclusion du cercle en cas de récidive\n\nTous les paiements sont définitifs et non remboursables, sauf disposition contraire.',
    en: 'Contributions must be paid according to the established schedule for each cycle. Failure to pay contributions on time may result in:\n• Late penalties\n• Suspension of your beneficiary rights\n• Exclusion from the circle in case of repeated offenses\n\nAll payments are final and non-refundable unless otherwise stated.'
  },
  'terms.section4.title': { fr: 'Comportement Interdit', en: 'Prohibited Conduct' },
  'terms.section4.content': { 
    fr: 'Il est strictement interdit de:\n• Fournir des informations fausses ou trompeuses\n• Utiliser les services à des fins illégales\n• Tenter de frauder ou manipuler le système de tontine\n• Harceler ou nuire aux autres membres\n• Divulguer les informations confidentielles des autres membres\n• Utiliser le nom du Cercle des Titans sans autorisation',
    en: 'It is strictly prohibited to:\n• Provide false or misleading information\n• Use services for illegal purposes\n• Attempt to defraud or manipulate the tontine system\n• Harass or harm other members\n• Disclose confidential information of other members\n• Use the Circle of Titans name without authorization'
  },
  'terms.section5.title': { fr: 'Limitation de Responsabilité', en: 'Limitation of Liability' },
  'terms.section5.content': { 
    fr: 'Le Cercle des Titans ne peut être tenu responsable:\n• Des pertes financières résultant du non-respect des règles par d\'autres membres\n• Des interruptions temporaires de service\n• Des dommages indirects ou consécutifs\n\nNotre responsabilité maximale est limitée au montant des cotisations que vous avez versées.',
    en: 'The Circle of Titans cannot be held liable for:\n• Financial losses resulting from other members not following rules\n• Temporary service interruptions\n• Indirect or consequential damages\n\nOur maximum liability is limited to the amount of contributions you have paid.'
  },
  'terms.section6.title': { fr: 'Juridiction et Droit Applicable', en: 'Jurisdiction and Applicable Law' },
  'terms.section6.content': { 
    fr: 'Ces conditions sont régies par les lois du Cameroun. Tout litige relatif à ces conditions ou à l\'utilisation de nos services sera soumis à la compétence exclusive des tribunaux de Douala, Cameroun.\n\nEn cas de conflit entre ces conditions et toute autre condition spécifique, les conditions spécifiques prévaudront.',
    en: 'These terms are governed by the laws of Cameroon. Any dispute relating to these terms or the use of our services will be subject to the exclusive jurisdiction of the courts of Douala, Cameroon.\n\nIn case of conflict between these terms and any specific terms, the specific terms shall prevail.'
  },
  'terms.agreement.title': { fr: 'Questions Juridiques', en: 'Legal Questions' },
  'terms.agreement.content': { 
    fr: 'Pour toute question concernant ces conditions d\'utilisation, contactez notre équipe juridique:',
    en: 'For any questions regarding these terms of use, contact our legal team:'
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key as keyof typeof translations];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
