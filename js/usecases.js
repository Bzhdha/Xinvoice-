/**
 * Cas d'usage FacturX – Référentiel AFNOR NF Z55-500
 * Inclut les workflows et les étapes par rôle
 */

// ─── Rôles ──────────────────────────────────────────────────────────────────
const ROLES = {
  vendeur:     { id: 'vendeur',     label: 'Vendeur / Émetteur',       icon: '🏢' },
  acheteur:    { id: 'acheteur',    label: 'Acheteur / Destinataire',  icon: '🏦' },
  comptable_v: { id: 'comptable_v', label: 'Comptable (côté vendeur)', icon: '📊' },
  comptable_a: { id: 'comptable_a', label: 'Comptable (côté acheteur)',icon: '📋' },
  dsp:         { id: 'dsp',         label: 'Plateforme de dématérialisation (PDP/PPF)', icon: '🔄' },
};

// ─── États génériques du cycle de vie d'une facture ──────────────────────────
const ETATS = {
  BROUILLON:    { id: 'BROUILLON',    label: 'Brouillon',              color: '#94a3b8' },
  EMISE:        { id: 'EMISE',        label: 'Émise',                  color: '#3b82f6' },
  TRANSMISE:    { id: 'TRANSMISE',    label: 'Transmise / Déposée',    color: '#8b5cf6' },
  RECUE:        { id: 'RECUE',        label: 'Reçue',                  color: '#f59e0b' },
  EN_CONTROLE:  { id: 'EN_CONTROLE',  label: 'En contrôle',           color: '#f97316' },
  ACCEPTEE:     { id: 'ACCEPTEE',     label: 'Acceptée',               color: '#22c55e' },
  REFUSEE:      { id: 'REFUSEE',      label: 'Refusée',                color: '#ef4444' },
  LITIGE:       { id: 'LITIGE',       label: 'En litige',              color: '#dc2626' },
  PAYEE:        { id: 'PAYEE',        label: 'Payée',                  color: '#16a34a' },
  ARCHIVEE:     { id: 'ARCHIVEE',     label: 'Archivée',               color: '#6b7280' },
};

// ─── Cas d'usage ─────────────────────────────────────────────────────────────
const USE_CASES = {

  // ── CU-01 : Facture B2B standard ────────────────────────────────────────
  'CU-01': {
    id: 'CU-01',
    titre: 'Facture B2B standard',
    description: 'Facture classique entre deux entreprises françaises soumises à TVA. Cas le plus fréquent en France.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Prestations de services ou ventes de biens entre entreprises (B2B) sur le territoire français.',
    conditions: [
      'Les deux parties sont des entreprises françaises assujetties à TVA',
      'TVA facturée au taux applicable (standard 20%, réduit 10%, super-réduit 5,5% ou 2,1%)',
      'Pas d\'autoliquidation ni d\'exonération spéciale',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-30','BT-31','BT-40','BT-44','BT-112','BT-115','BT-118','BT-117'],
    mentions_obligatoires: [
      'Numéro de facture (séquence chronologique)',
      'Date d\'émission',
      'Numéro SIREN/SIRET du vendeur',
      'Numéro TVA intracommunautaire vendeur',
      'Numéro SIREN/SIRET de l\'acheteur',
      'Date de livraison ou de prestation (si différente de la date de facture)',
      'Taux de TVA applicable',
      'Montant HT, TVA et TTC',
      'Date ou délai de paiement',
      'Taux et conditions des pénalités de retard',
      'Indemnité forfaitaire de recouvrement (40€)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Validation et signature électronique de la facture',
          description: 'Le vendeur vérifie tous les champs obligatoires, signe électroniquement et finalise la facture FacturX.',
          checklist: [
            'Vérifier la séquence du numéro de facture',
            'Contrôler les montants (HT, TVA, TTC)',
            'S\'assurer de la présence du SIREN/SIRET des deux parties',
            'Vérifier le numéro TVA intracommunautaire',
            'Valider la cohérence TVA (taux × base = montant TVA)',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission via PDP ou dépôt sur PPF',
          description: 'Depuis le 1er septembre 2026 (grandes entreprises), la facture doit être transmise via une Plateforme de Dématérialisation Partenaire (PDP) ou le Portail Public de Facturation (PPF).',
          checklist: [
            'Choisir le canal de transmission (PDP partenaire ou PPF)',
            'Vérifier que l\'acheteur est bien inscrit sur la plateforme',
            'Conserver l\'accusé de réception de transmission',
            'Archiver la facture (conservation 10 ans)',
          ],
        },
        {
          de: 'TRANSMISE', vers: 'RECUE',
          acteur: 'dsp',
          action: 'Acheminement vers la plateforme de l\'acheteur',
          description: 'La PDP/PPF transmet la facture à la plateforme de réception de l\'acheteur et envoie un statut de réception.',
          checklist: [
            'Accusé de réception automatique émis',
            'Facture disponible dans l\'espace acheteur',
          ],
        },
        {
          de: 'RECUE', vers: 'EN_CONTROLE',
          acteur: 'acheteur',
          action: 'Contrôle et rapprochement comptable',
          description: 'L\'acheteur vérifie la conformité de la facture avec le bon de commande et les conditions contractuelles.',
          checklist: [
            'Vérifier la cohérence avec le bon de commande (BT-13)',
            'Contrôler les prix, quantités et montants',
            'Vérifier l\'identité du vendeur (SIREN, TVA)',
            'Rapprocher avec le bon de réception (BT-15)',
            'Contrôler les conditions de paiement',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Acceptation de la facture',
          description: 'La facture est validée et enregistrée en comptabilité.',
          checklist: [
            'Saisir la facture dans le système comptable (ou import automatique)',
            'Valider la récupération de TVA',
            'Programmer le paiement selon les conditions',
            'Envoyer le statut d\'acceptation via la plateforme',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'REFUSEE',
          acteur: 'acheteur',
          action: 'Refus de la facture',
          description: 'Si la facture est non conforme, l\'acheteur la refuse avec un motif.',
          checklist: [
            'Motiver le refus par écrit',
            'Envoyer le statut de refus via la plateforme',
            'Demander une facture corrective ou un avoir au vendeur',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement de la facture',
          description: 'Le paiement est effectué selon les conditions convenues (virement, prélèvement…).',
          checklist: [
            'Effectuer le virement au IBAN indiqué (BT-84)',
            'Inclure la référence de paiement (BT-83)',
            'Conserver la preuve de paiement',
          ],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_a',
          action: 'Archivage de la facture',
          description: 'La facture payée doit être archivée pendant 10 ans minimum en France.',
          checklist: [
            'Archivage dans un système à valeur probante',
            'Conservation de l\'intégralité du fichier FacturX (PDF+XML)',
            'Mise à jour des journaux comptables',
          ],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-3', valeur: '380', message: 'TypeCode 380 = Facture commerciale standard' },
        { champ: 'BT-118', valeur: 'S', message: 'TVA catégorie S = taux standard applicable' },
        { champ: 'BT-40', valeur: 'FR', message: 'Pays vendeur = France' },
        { champ: 'BT-31', presence: true, message: 'TVA intracommunautaire vendeur présente' },
        { champ: 'BT-47', presence: true, message: 'Identifiant légal acheteur présent' },
      ],
    },
  },

  // ── CU-02 : Avoir / Note de crédit ──────────────────────────────────────
  'CU-02': {
    id: 'CU-02',
    titre: 'Avoir / Note de crédit',
    description: 'Facture corrective ou avoir émis en cas d\'erreur, de retour de marchandise ou d\'annulation partielle.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Correction d\'une facture erronée, retour de marchandise, remise commerciale accordée après facturation.',
    conditions: [
      'Référence obligatoire à la facture initiale (BT-25)',
      'TypeCode 381 (avoir) ou 384 (facture corrective)',
      'Montants négatifs pour les avoirs',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-25','BT-26','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires: [
      'Numéro de l\'avoir',
      'Date de l\'avoir',
      'Référence de la facture initiale annulée ou corrigée (BT-25)',
      'Motif de l\'avoir',
      'Montants corrigés (HT, TVA, TTC)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Création et émission de l\'avoir',
          description: 'Le vendeur crée l\'avoir en référençant la facture initiale.',
          checklist: [
            'Utiliser TypeCode 381 (avoir) ou 384 (facture corrective)',
            'Renseigner BT-25 : numéro de la facture initiale',
            'Renseigner BT-26 : date de la facture initiale',
            'Justifier le motif de l\'avoir (retour, erreur, remise…)',
            'Vérifier les montants négatifs si avoir total',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission de l\'avoir',
          description: 'L\'avoir est transmis par les mêmes canaux que la facture initiale.',
          checklist: [
            'Transmettre via PDP ou PPF',
            'Vérifier que l\'avoir est lié à la facture initiale dans la plateforme',
          ],
        },
        {
          de: 'TRANSMISE', vers: 'RECUE',
          acteur: 'dsp',
          action: 'Réception de l\'avoir',
          description: 'La plateforme achemine l\'avoir vers l\'acheteur.',
          checklist: ['Vérification automatique de la référence facture initiale'],
        },
        {
          de: 'RECUE', vers: 'EN_CONTROLE',
          acteur: 'acheteur',
          action: 'Contrôle de l\'avoir',
          description: 'L\'acheteur vérifie l\'avoir et le rapproche de la facture initiale.',
          checklist: [
            'Vérifier la référence à la facture initiale',
            'Contrôler les montants remboursés',
            'Annuler ou corriger l\'écriture comptable initiale',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Acceptation de l\'avoir',
          description: 'L\'avoir est comptabilisé et le remboursement ou la compensation est programmée.',
          checklist: [
            'Comptabiliser l\'avoir en déduction',
            'Planifier le remboursement ou compenser avec une prochaine facture',
            'Mettre à jour le bilan TVA',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'ARCHIVEE',
          acteur: 'comptable_a',
          action: 'Archivage',
          description: 'L\'avoir est archivé avec la facture initiale.',
          checklist: ['Archiver l\'avoir avec référence à la facture initiale','Mise à jour du dossier de TVA récupérable'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-3', valeur: '381', message: 'TypeCode 381 = Note de crédit / Avoir' },
        { champ: 'BT-3', valeur: '384', message: 'TypeCode 384 = Facture corrective' },
        { champ: 'BT-25', presence: true, message: 'Référence à une facture précédente présente' },
      ],
    },
  },

  // ── CU-03 : Autoliquidation de TVA ──────────────────────────────────────
  'CU-03': {
    id: 'CU-03',
    titre: 'Autoliquidation de TVA (Reverse Charge)',
    description: 'Mécanisme par lequel c\'est l\'acheteur, et non le vendeur, qui déclare et paie la TVA.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Sous-traitance dans le BTP, achats à des entreprises étrangères, livraisons intracommunautaires de biens, certaines prestations de services.',
    conditions: [
      'Le vendeur ne facture pas de TVA',
      'La mention "Autoliquidation" est obligatoire sur la facture',
      'Code TVA catégorie AE (ou K pour intracommunautaire)',
      'L\'acheteur doit déclarer la TVA sur sa propre déclaration',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-31','BT-40','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires: [
      'Mention explicite "Autoliquidation" sur la facture',
      'Code catégorie TVA AE',
      'Montant TVA = 0',
      'Base d\'imposition (montant HT)',
      'TVA intracommunautaire de l\'acheteur',
      'Référence à l\'article de loi applicable (art. 283-2 du CGI)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission de la facture en autoliquidation',
          description: 'Le vendeur émet une facture HT sans TVA collectée.',
          checklist: [
            'Utiliser BT-118 = AE (Autoliquidation)',
            'Montant TVA (BT-117) = 0',
            'Ajouter la mention "Autoliquidation" en note (BT-22)',
            'Indiquer le TVA de l\'acheteur (BT-48)',
            'Référencer la base légale (CGI art. 283-2)',
            'Total TTC = Total HT (pas de TVA)',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission de la facture',
          description: 'Transmission via PDP/PPF avec marquage "autoliquidation".',
          checklist: [
            'Transmettre via PDP/PPF',
            'Vérifier que la plateforme prend en compte le mécanisme AE',
          ],
        },
        {
          de: 'RECUE', vers: 'EN_CONTROLE',
          acteur: 'acheteur',
          action: 'Contrôle et déclaration TVA',
          description: 'L\'acheteur contrôle la facture et prépare sa déclaration TVA.',
          checklist: [
            'Vérifier le mécanisme d\'autoliquidation',
            'Contrôler le montant HT facturé',
            'Calculer la TVA autoliquidée (base × taux normal)',
            'Préparer la déclaration TVA (CA3) : TVA collectée ET TVA déductible',
            'Vérifier que BT-118 = AE',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Acceptation et comptabilisation',
          description: 'Comptabilisation avec TVA autoliquidée.',
          checklist: [
            'Comptabiliser en charge HT',
            'Enregistrer TVA collectée (débit 4455xx)',
            'Enregistrer TVA déductible (crédit 44566xx)',
            'Payer uniquement le HT au vendeur',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement du montant HT',
          description: 'Seul le montant HT est payé au vendeur (pas de TVA).',
          checklist: [
            'Virement du montant HT uniquement',
            'Inclure la référence de paiement',
          ],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_a',
          action: 'Archivage',
          description: 'Conservation avec les déclarations TVA associées.',
          checklist: ['Archiver avec les déclarations TVA du trimestre/mois'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-118', valeur: 'AE', message: 'Code TVA AE = Autoliquidation (Reverse Charge)' },
        { champ: 'BT-117', valeur: '0', message: 'Montant TVA = 0 EUR (vendeur ne collecte pas la TVA)' },
        { champ: 'BT-22', pattern: 'autoliquidation', message: 'Mention "autoliquidation" dans la note' },
      ],
    },
  },

  // ── CU-04 : Livraison intracommunautaire ─────────────────────────────────
  'CU-04': {
    id: 'CU-04',
    titre: 'Livraison intracommunautaire (LIC)',
    description: 'Vente de biens expédiés ou transportés vers un autre État membre de l\'UE à destination d\'un assujetti étranger.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Export vers un pays de l\'Union Européenne (hors France). Le vendeur est exonéré de TVA française si l\'acheteur est assujetti dans son pays.',
    conditions: [
      'L\'acheteur est assujetti à la TVA dans son pays UE',
      'Les biens sont effectivement transportés hors de France',
      'Numéro TVA valide de l\'acheteur (à vérifier sur VIES)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-31','BT-40','BT-44','BT-48','BT-55','BT-112','BT-115','BT-118'],
    mentions_obligatoires: [
      'Numéro TVA intracommunautaire vendeur ET acheteur',
      'Mention "Exonération TVA – Livraison intracommunautaire – Art. 262 ter I du CGI"',
      'Pays de destination',
      'Preuve de transport (CMR, lettre de voiture…)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission de la facture LIC',
          description: 'Facturation exonérée de TVA pour livraison intracommunautaire.',
          checklist: [
            'Vérifier la validité du N° TVA acheteur sur VIES (vies.ec.europa.eu)',
            'Utiliser BT-118 = K (livraison intracommunautaire exonérée)',
            'BT-55 (pays acheteur) = code pays UE différent de FR',
            'Ajouter la mention légale d\'exonération en BT-22',
            'Conserver la preuve de transport',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission',
          description: 'La facture LIC doit aussi être déclarée à la DEB (Déclaration d\'Échanges de Biens) si > seuil.',
          checklist: [
            'Transmettre la facture via PDP/PPF',
            'Déclarer la livraison à la DEB si applicable',
            'Inclure dans la déclaration TVA ligne "LIC"',
          ],
        },
        {
          de: 'RECUE', vers: 'EN_CONTROLE',
          acteur: 'acheteur',
          action: 'Réception et autoliquidation dans le pays de l\'acheteur',
          description: 'L\'acheteur étranger autoliquide la TVA selon les règles de son pays.',
          checklist: [
            'Vérifier que la facture est bien exonérée de TVA française',
            'Déclarer l\'acquisition intracommunautaire dans le pays de l\'acheteur',
            'Autoliquider la TVA locale selon les règles nationales',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Comptabilisation',
          description: 'Comptabilisation de l\'acquisition intracommunautaire.',
          checklist: [
            'Comptabiliser en charge ou en stock',
            'TVA autoliquidée selon les règles locales',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement',
          checklist: ['Paiement du montant HT (pas de TVA française)'],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_v',
          action: 'Archivage avec preuves de transport',
          checklist: ['Archiver avec : facture, CMR/lettre de voiture, preuve de paiement, validation VIES'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-118', valeur: 'K', message: 'Code TVA K = Livraison intracommunautaire exonérée' },
        { champ: 'BT-55', presence: true, message: 'Pays acheteur renseigné (différent de FR)' },
        { champ: 'BT-48', presence: true, message: 'Numéro TVA acheteur présent (indispensable)' },
      ],
    },
  },

  // ── CU-05 : Exportation hors UE ─────────────────────────────────────────
  'CU-05': {
    id: 'CU-05',
    titre: 'Exportation hors Union Européenne',
    description: 'Vente de biens ou services à destination d\'un pays hors UE, exonérée de TVA française.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Exportation vers pays tiers (USA, UK après Brexit, Suisse, Maroc, etc.).',
    conditions: [
      'Biens physiquement exportés hors UE',
      'TVA catégorie G (exportation)',
      'Justificatifs douaniers obligatoires (DAE, justificatif d\'exportation)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-31','BT-40','BT-44','BT-55','BT-112','BT-115','BT-118'],
    mentions_obligatoires: [
      'Mention "Exonération TVA – Exportation – Art. 262 I du CGI"',
      'Numéro EORI du vendeur',
      'Pays de destination (hors UE)',
      'Justificatif d\'exportation douanière',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission facture export',
          description: 'Facturation sans TVA pour exportation.',
          checklist: [
            'Utiliser BT-118 = G (exportation)',
            'BT-55 = code pays hors UE',
            'Ajouter mention légale d\'exonération',
            'Préparer la déclaration en douane',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Envoi de la facture et dédouanement',
          description: 'La facture accompagne les documents douaniers.',
          checklist: [
            'Inclure la facture dans le dossier d\'exportation',
            'Obtenir le DAE (Document d\'Accompagnement de l\'Exportation)',
            'Conserver le justificatif d\'exportation pour récupération TVA',
          ],
        },
        {
          de: 'TRANSMISE', vers: 'RECUE',
          acteur: 'acheteur',
          action: 'Réception et dédouanement à l\'import',
          checklist: [
            'Acquitter les droits de douane et taxes locales',
            'Valider la réception des marchandises',
          ],
        },
        {
          de: 'RECUE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Acceptation de la facture',
          checklist: ['Contrôler la conformité avec la commande'],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement international',
          checklist: [
            'Virement international (SWIFT/BIC)',
            'Vérifier les conditions de change si devise étrangère',
          ],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_v',
          action: 'Archivage avec justificatifs douaniers',
          checklist: ['Archiver : facture + DAE + preuve de paiement + visa douanier'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-118', valeur: 'G', message: 'Code TVA G = Exportation hors UE exonérée' },
        { champ: 'BT-55', presence: true, message: 'Pays acheteur hors zone UE' },
      ],
    },
  },

  // ── CU-06 : Facture d'acompte ────────────────────────────────────────────
  'CU-06': {
    id: 'CU-06',
    titre: 'Facture d\'acompte / Facturation partielle',
    description: 'Facturation partielle d\'une commande avant livraison ou fin de prestation.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Grands projets, construction, commandes importantes avec paiement échelonné.',
    conditions: [
      'L\'acompte génère un fait générateur de TVA dès l\'encaissement',
      'La facture finale doit déduire les acomptes reçus',
      'TypeCode 380 avec mention explicite "Acompte"',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires: [
      'Mention "Facture d\'acompte"',
      'Numéro de la commande ou du contrat',
      'Montant de l\'acompte (HT + TVA)',
      'Date prévisionnelle de la facture finale',
      'Pourcentage du total représenté par l\'acompte',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission de la facture d\'acompte',
          description: 'Facturation d\'un acompte avant livraison/prestation.',
          checklist: [
            'Indiquer clairement "Facture d\'acompte" dans la note (BT-22)',
            'Référencer le contrat ou bon de commande (BT-12 ou BT-13)',
            'TypeCode 380 (facture normale)',
            'Inclure la TVA sur l\'acompte (exigibilité dès encaissement)',
            'Préciser le montant total du projet et le % représenté',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission',
          checklist: ['Transmettre via PDP/PPF comme toute facture'],
        },
        {
          de: 'RECUE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Validation et comptabilisation de l\'acompte',
          checklist: [
            'Comptabiliser l\'acompte en compte 409xxx ou 471xxx',
            'Récupérer la TVA dès réception de la facture d\'acompte',
            'Programmer le paiement de l\'acompte',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement de l\'acompte',
          checklist: [
            'Virer le montant de l\'acompte',
            'Conserver la trace du paiement pour imputation sur la facture finale',
          ],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_a',
          action: 'Archivage en attente de la facture finale',
          checklist: ['Archiver et noter la facture finale attendue'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-3', valeur: '386', message: 'TypeCode 386 = Facture de préparation/acompte' },
        { champ: 'BT-22', pattern: 'acompte', message: 'Mention "acompte" dans la note' },
        { champ: 'BT-12', presence: true, message: 'Référence contrat présente (projet long terme)' },
      ],
    },
  },

  // ── CU-07 : Facture B2G (Secteur public) ─────────────────────────────────
  'CU-07': {
    id: 'CU-07',
    titre: 'Facture B2G (Secteur public – Chorus Pro)',
    description: 'Facturation à destination d\'une entité publique française (État, collectivités, hôpitaux…) via Chorus Pro.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Obligation légale depuis 2017-2020 (selon taille) de transmettre les factures aux entités publiques via Chorus Pro.',
    conditions: [
      'Acheteur = entité publique française (SIRET et code service)',
      'Transmission obligatoire via Chorus Pro (portail dédié)',
      'Champ BT-10 (numéro d\'engagement ou code service) obligatoire',
      'SIRET de l\'entité publique destinataire requis',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-10','BT-27','BT-30','BT-31','BT-40','BT-44','BT-47','BT-112','BT-115'],
    mentions_obligatoires: [
      'Numéro SIRET de l\'entité publique (BT-47)',
      'Code service exécutant (BT-10)',
      'Numéro d\'engagement juridique si requis',
      'SIRET du vendeur',
      'Mentions légales habituelles',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Préparation de la facture B2G',
          description: 'Les factures B2G ont des exigences spécifiques pour Chorus Pro.',
          checklist: [
            'Récupérer le SIRET de l\'entité publique et le code service',
            'Renseigner BT-10 avec le numéro de l\'engagement ou code service',
            'Renseigner BT-47 avec le SIRET de l\'entité publique',
            'Vérifier les coordonnées du service de facturation',
            'Format FacturX profil EN 16931 recommandé',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Dépôt sur Chorus Pro',
          description: 'Dépôt obligatoire sur le portail Chorus Pro (chorus-pro.gouv.fr).',
          checklist: [
            'Se connecter à Chorus Pro (portail officiel)',
            'Déposer la facture FacturX directement ou via EDI',
            'Vérifier l\'accusé de dépôt',
            'Conserver le numéro de dépôt Chorus Pro',
          ],
        },
        {
          de: 'TRANSMISE', vers: 'RECUE',
          acteur: 'dsp',
          action: 'Traitement par Chorus Pro',
          description: 'Chorus Pro valide la facture et la transmet au service de liquidation.',
          checklist: [
            'Vérification automatique des champs obligatoires',
            'Routage vers le bon service',
          ],
        },
        {
          de: 'RECUE', vers: 'EN_CONTROLE',
          acteur: 'acheteur',
          action: 'Contrôle et certification du service fait',
          description: 'Le service acheteur vérifie la conformité de la prestation.',
          checklist: [
            'Certifier le "service fait" dans Chorus Pro',
            'Contrôler la conformité avec le bon de commande public',
            'Vérifier les délais de paiement (30 jours légaux)',
          ],
        },
        {
          de: 'EN_CONTROLE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Acceptation (Service fait certifié)',
          checklist: [
            'Valider la certification du service fait',
            'Mettre en paiement dans les délais légaux (30 jours max)',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement',
          description: 'Le délai légal de paiement des entités publiques est de 30 jours.',
          checklist: [
            'Paiement dans les 30 jours (pénalités de retard + intérêts moratoires en cas de dépassement)',
            'Taux d\'intérêts moratoires : taux directeur BCE + 8 points',
          ],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_v',
          action: 'Archivage',
          checklist: ['Archiver avec numéro de dépôt Chorus Pro et preuve de paiement'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-10', presence: true, message: 'Référence acheteur (code service Chorus Pro) présente' },
        { champ: 'BT-47', presence: true, message: 'SIRET acheteur présent (entité publique)' },
        { champ: 'BT-44', pattern: 'mairie|commune|département|région|ministère|prefecture|hôpital|chu|chu|université', message: 'Nom acheteur évoque une entité publique' },
      ],
    },
  },

  // ── CU-08 : Facture exonérée de TVA ─────────────────────────────────────
  'CU-08': {
    id: 'CU-08',
    titre: 'Facture exonérée de TVA',
    description: 'Facturation d\'activités légalement exonérées de TVA (services médicaux, enseignement, assurance, etc.).',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Professions médicales, paramédicales, enseignement, associations, assurances, petites entreprises sous franchise en base.',
    conditions: [
      'Activité relevant d\'une exonération légale de TVA',
      'Code catégorie TVA E (exonéré)',
      'Mention obligatoire du motif d\'exonération',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-40','BT-44','BT-112','BT-115','BT-118','BT-120'],
    mentions_obligatoires: [
      'Mention "TVA non applicable – Article [réf.] du CGI"',
      'Code d\'exonération TVA (BT-121)',
      'Motif d\'exonération (BT-120)',
      'Pas de numéro TVA si franchise en base',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission de la facture exonérée',
          checklist: [
            'Utiliser BT-118 = E (exonéré)',
            'Renseigner BT-120 : motif d\'exonération textuel',
            'Renseigner BT-121 : code VATEX de l\'exonération',
            'Ajouter la référence légale (article CGI) en BT-22',
            'NE PAS indiquer de TVA',
            'Si franchise en base : "TVA non applicable, article 293B du CGI"',
          ],
        },
        {
          de: 'EMISE', vers: 'TRANSMISE',
          acteur: 'vendeur',
          action: 'Transmission',
          checklist: ['Transmettre par les canaux habituels'],
        },
        {
          de: 'RECUE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Contrôle et comptabilisation',
          checklist: [
            'Vérifier la mention d\'exonération',
            'La TVA n\'est pas récupérable pour l\'acheteur',
            'Comptabiliser en charge TTC (pas de déduction TVA)',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement du montant TTC',
          checklist: ['Payer le montant TTC (= HT car pas de TVA)'],
        },
        {
          de: 'PAYEE', vers: 'ARCHIVEE',
          acteur: 'comptable_a',
          action: 'Archivage',
          checklist: ['Archiver sans récupération de TVA'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-118', valeur: 'E', message: 'Code TVA E = Exonéré de TVA' },
        { champ: 'BT-120', presence: true, message: 'Motif d\'exonération TVA présent' },
        { champ: 'BT-117', valeur: '0', message: 'Montant TVA = 0' },
        { champ: 'BT-31', presence: false, message: 'Pas de numéro TVA vendeur (franchise ou exonération)' },
      ],
    },
  },

  // ── CU-09 : Refacturation / Transfert de charges ─────────────────────────
  'CU-09': {
    id: 'CU-09',
    titre: 'Refacturation / Transfert de charges',
    description: 'Refacturation à un tiers de charges supportées pour son compte (frais remboursables, débours).',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Cabinets d\'avocats refacturant des frais, groupes refacturant des charges internes, débours refacturés.',
    conditions: [
      'Distinction entre débours (pas de TVA, non incorporés dans prix) et refacturations (avec TVA)',
      'Si refacturation : TVA au taux de la charge d\'origine',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires: [
      'Nature des frais refacturés',
      'Justificatifs des charges d\'origine',
      'TVA si applicable selon nature des charges',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        {
          de: 'BROUILLON', vers: 'EMISE',
          acteur: 'vendeur',
          action: 'Émission de la facture de refacturation',
          checklist: [
            'Détailler chaque charge refacturée avec justificatif',
            'Appliquer la TVA au taux de chaque charge d\'origine',
            'Joindre les justificatifs en pièce jointe (BG-24)',
            'Si débours : absence de TVA et mention "débours"',
          ],
        },
        {
          de: 'RECUE', vers: 'ACCEPTEE',
          acteur: 'acheteur',
          action: 'Validation des refacturations',
          checklist: [
            'Vérifier les justificatifs',
            'Contrôler la TVA appliquée',
            'Rapprocher avec les engagements de prise en charge',
          ],
        },
        {
          de: 'ACCEPTEE', vers: 'PAYEE',
          acteur: 'acheteur',
          action: 'Paiement',
          checklist: ['Payer selon les conditions convenues'],
        },
      ],
    },
    signaux_detection: {
      description: 'Ce cas d\'usage est probable si :',
      indices: [
        { champ: 'BT-122', presence: true, message: 'Documents justificatifs joints (frais d\'origine)' },
        { champ: 'BT-22', pattern: 'refacturation|remboursement|débours', message: 'Mention refacturation/débours dans la note' },
      ],
    },
  },
};

// ─── Détection automatique du cas d'usage à partir d'une facture analysée ────
function detecterCasUsage(champsPresents) {
  const resultats = [];

  for (const [id, cu] of Object.entries(USE_CASES)) {
    let score = 0;
    const indices_trouves = [];
    const indices_manquants = [];

    for (const indice of (cu.signaux_detection?.indices || [])) {
      const valeur = champsPresents[indice.champ];

      if (indice.presence === true && valeur) {
        score += 2;
        indices_trouves.push(indice.message);
      } else if (indice.presence === false && !valeur) {
        score += 1;
        indices_trouves.push(indice.message);
      } else if (indice.valeur && valeur === indice.valeur) {
        score += 3;
        indices_trouves.push(indice.message);
      } else if (indice.pattern && valeur && new RegExp(indice.pattern, 'i').test(valeur)) {
        score += 2;
        indices_trouves.push(indice.message);
      } else if (indice.valeur || indice.presence === true) {
        indices_manquants.push(indice.message);
      }
    }

    if (score > 0) {
      resultats.push({ id, cu, score, indices_trouves, indices_manquants });
    }
  }

  resultats.sort((a, b) => b.score - a.score);
  return resultats;
}
