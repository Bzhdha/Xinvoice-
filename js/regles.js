/**
 * REGLES_PRESENCE — source de vérité normative pour la présence des champs BT.
 *
 * Structure par cas d'usage :
 *   obligatoires : rouge si absent (champ attendu et manquant)
 *   conditionnels : ambre si absent (champ pertinent selon contexte, non bloquant)
 *
 * Référence : EN 16931-2017+A1:2019 / AFNOR XP Z12-014
 * Mise à jour normative : modifier ce fichier uniquement, sans toucher au code JS.
 */

// ── Base EN 16931 commune à tous les cas (profil EN minimum) ─────────────────
const _EN_BASE_OBLIG = [
  'BT-1','BT-2','BT-3','BT-5','BT-24',
  'BT-27','BT-40',
  'BT-44',
  'BT-106','BT-109','BT-110','BT-112','BT-115',
  'BT-116','BT-117','BT-118',
];

// Champs conditionnels communs (EN 16931 cardinalité C ou O, mais jamais rouge)
const _EN_COND_COMMUNS = [
  'BT-6','BT-7','BT-8','BT-9','BT-10','BT-11','BT-12','BT-13','BT-14',
  'BT-15','BT-16','BT-17','BT-19','BT-20','BT-22','BT-25','BT-26',
  'BT-28','BT-29','BT-30','BT-32','BT-33','BT-34',
  'BT-41','BT-42','BT-43',
  'BT-45','BT-46','BT-47','BT-48','BT-49',
  'BT-55','BT-56','BT-57','BT-58',
  'BT-59','BT-60','BT-61','BT-62','BT-63',
  'BT-70','BT-71','BT-72','BT-73','BT-74','BT-75','BT-76','BT-77','BT-78','BT-79','BT-80',
  'BT-81','BT-82','BT-83','BT-84','BT-85','BT-86','BT-87','BT-88','BT-89','BT-90','BT-91',
  'BT-92','BT-93','BT-94','BT-95','BT-96','BT-97','BT-98',
  'BT-99','BT-100','BT-101','BT-102','BT-103','BT-104','BT-105',
  'BT-107','BT-108','BT-111','BT-113','BT-114',
  'BT-119','BT-120','BT-121',
  'BT-122','BT-123','BT-124','BT-125',
];

// Champs BT ligne (conditionnels — présents si la facture a des lignes, jamais rouge au niveau en-tête)
const _LIGNE_COND = [
  'BT-126','BT-127','BT-128','BT-129','BT-130','BT-131','BT-132','BT-133','BT-134',
  'BT-135','BT-136','BT-137','BT-138','BT-139','BT-140','BT-141','BT-142','BT-143',
  'BT-144','BT-145','BT-146','BT-147','BT-148','BT-149','BT-150','BT-151','BT-152','BT-153','BT-154','BT-155',
];

// ─────────────────────────────────────────────────────────────────────────────

const REGLES_PRESENCE = {
  norme:   'EN 16931-2017+A1:2019 / AFNOR XP Z12-014',
  version: '1.0',
  date:    '2026-06-20',

  cas: {

    // ── Cas nominaux AFNOR/DGFiP ────────────────────────────────────────────

    'REF-NOMINAL': {
      obligatoires: [
        ..._EN_BASE_OBLIG,
        'BT-30','BT-31',   // SIREN et numéro TVA vendeur — requis France B2B
      ],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-REFUS': {
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-LITIGE-AVOIR': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-25','BT-26'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-LITIGE-RECTIF': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-25','BT-26'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-DEJA-PAYEE': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-9','BT-20'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-TIERS-PAYEUR': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-PARTIEL-TIERS': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-FRAIS-COLLAB-B2C': {
      // Profil 'min' – frais collaborateur B2C, base allégée sans TVA structurée
      obligatoires: ['BT-1','BT-2','BT-5','BT-24','BT-27','BT-44','BT-112','BT-115'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'REF-REJET': {
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    // ── Cas d'usage XP ──────────────────────────────────────────────────────

    'XP-1': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-13','BT-15','BT-16'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-2': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-9','BT-20'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-3': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60','BT-61'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-4': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-5': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-118'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-6': {
      // Profil 'min' — note de frais interne, base allégée sans BT-3/BT-115/TVA
      obligatoires: ['BT-1','BT-2','BT-5','BT-24','BT-27','BT-44','BT-112'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-7': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-81'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-8': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60','BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-9': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-13','BT-15','BT-59','BT-60','BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-10': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-11': {
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-12': {
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-13': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-12','BT-13','BT-118'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-14': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-12'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-15': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-13','BT-59','BT-60','BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-16': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-17a': {
      // Marketplace – flux de paiement de l'acheteur vers le vendeur
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60','BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-17b': {
      // Marketplace – autofacturation au nom du vendeur
      obligatoires: [..._EN_BASE_OBLIG, 'BT-59','BT-60','BT-84'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-18': {
      // Note de débit – référence à la facture d'origine obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-25'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-20': {
      // Facture d'acompte – référence contrat et mention obligatoires
      obligatoires: [..._EN_BASE_OBLIG, 'BT-12','BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-21': {
      // Facture définitive avec déduction des acomptes
      obligatoires: [..._EN_BASE_OBLIG, 'BT-12','BT-22','BT-113'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-22a': {
      // Escompte conditionnel – taux et base de calcul requis
      obligatoires: [..._EN_BASE_OBLIG, 'BT-20','BT-94','BT-95'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-22b': {
      // Escompte sans taux – conditions de paiement textuelles suffisantes
      obligatoires: [..._EN_BASE_OBLIG, 'BT-20'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-23': {
      // Autofacturation individu – mention BT-17 obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-17'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-24': {
      // Arrhes – mention explicite obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-25': {
      // Mandat de gestion – mention obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-26': {
      // Mandat de commettant – mention obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-27': {
      // Autofacturation B2B – profil bas, BT-118 dans base
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-28': {
      // Facture de débours – BT-118 dans base
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-29': {
      // Autoliquidation intracommunautaire – numéro TVA acheteur obligatoire
      obligatoires: [..._EN_BASE_OBLIG, 'BT-31','BT-48'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-30': {
      // Profil BWL (sans lignes) – BT-118 dans base
      obligatoires: [..._EN_BASE_OBLIG],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-31': {
      // TVA exonérée / autoliquidation – taux 0% et motif requis
      obligatoires: [..._EN_BASE_OBLIG, 'BT-119'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-32': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-73','BT-74'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-33': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-34': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-3','BT-25'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-35': {
      // TVA sur marge – taux spécifique et motif requis (profil bas)
      obligatoires: [..._EN_BASE_OBLIG, 'BT-119'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

    'XP-36': {
      obligatoires: [..._EN_BASE_OBLIG, 'BT-22'],
      conditionnels: [..._EN_COND_COMMUNS, ..._LIGNE_COND],
    },

  },
};
