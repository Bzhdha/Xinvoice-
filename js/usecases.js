/**
 * Cas d'usage FacturX – AFNOR XP Z12-014 (Annexe A normative)
 * Réforme Facture Électronique France – 36 cas d'usage officiels
 */

// ─── Rôles ──────────────────────────────────────────────────────────────────
const ROLES = {
  vendeur:     { id: 'vendeur',     label: 'Vendeur / Émetteur',                         icon: '🏢' },
  acheteur:    { id: 'acheteur',    label: 'Acheteur / Destinataire',                    icon: '🏦' },
  tiers:       { id: 'tiers',       label: 'Tiers (payeur, bénéficiaire, mandataire)',   icon: '🤝' },
  comptable_v: { id: 'comptable_v', label: 'Comptable (côté vendeur)',                   icon: '📊' },
  comptable_a: { id: 'comptable_a', label: 'Comptable (côté acheteur)',                  icon: '📋' },
  pdp_e:       { id: 'pdp_e',       label: 'PDP-E – Plateforme de dématérialisation Émettrice', icon: '📤' },
  pdp_r:       { id: 'pdp_r',       label: 'PDP-R – Plateforme de dématérialisation Réceptrice', icon: '📥' },
  cdd_ppf:     { id: 'cdd_ppf',     label: 'CdD / PPF – Concentrateur de Données / Portail Public de Facturation', icon: '🏛' },
};

// ─── États officiels du cycle de vie d'une facture (réforme e-invoicing FR) ─
const ETATS = {
  BROUILLON:          { id: 'BROUILLON',          label: 'Brouillon',                    color: '#94a3b8' },
  EMISE:              { id: 'EMISE',              label: 'Émise',                        color: '#3b82f6' },
  DEPOSEE:            { id: 'DEPOSEE',            label: 'Déposée (sur PDP-E)',          color: '#6366f1' },
  REJETEE:            { id: 'REJETEE',            label: 'Rejetée (technique PDP-E)',    color: '#f43f5e' },
  RECUE:              { id: 'RECUE',              label: 'Reçue (par PDP-R)',            color: '#f59e0b' },
  EN_CONTROLE:        { id: 'EN_CONTROLE',        label: 'En traitement / Contrôle',    color: '#f97316' },
  ACCEPTEE:           { id: 'ACCEPTEE',           label: 'Acceptée',                     color: '#22c55e' },
  REFUSEE:            { id: 'REFUSEE',            label: 'Refusée (métier)',             color: '#ef4444' },
  LITIGE:             { id: 'LITIGE',             label: 'En litige',                    color: '#dc2626' },
  PAIEMENT_TRANSMIS:  { id: 'PAIEMENT_TRANSMIS',  label: 'Paiement transmis',           color: '#0ea5e9' },
  PAYEE:              { id: 'PAYEE',              label: 'Payée',                        color: '#16a34a' },
  ENCAISSEE:          { id: 'ENCAISSEE',          label: 'Encaissée (rapprochée)',       color: '#15803d' },
  ARCHIVEE:           { id: 'ARCHIVEE',           label: 'Archivée',                     color: '#6b7280' },
};

// ─── Workflows de référence AFNOR/DGFiP (Figures 2 & 3) ─────────────────────

/**
 * WORKFLOW_NOMINAL (Figure 2 – Cas nominal d'échange de facture)
 * Acteurs : PDP-E (vendeur), PDP-R (acheteur), CdD/PPF
 * Étapes officielles :
 *   1. Création facture (vendeur)
 *   2. Transmission flux 1 + statut « Déposée » → PDP-E → CdD/PPF
 *   3. Réception par PDP-R
 *   4a. Traitement de la facture (acheteur)
 *   4b/4c. Statuts de traitement retournés au vendeur via PDP-E
 *   5a. Paiement (acheteur)
 *   5b/5c. Statut « Paiement Transmis »
 *   6a. Encaissement et rapprochement (vendeur)
 *   6b/6c. Statut « Encaissée »
 *   7. CdD/PPF reçoit statut « Encaissée »
 */
const WORKFLOW_NOMINAL = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création et validation de la facture',
      description: 'Le vendeur crée et valide la facture FacturX avant transmission à sa PDP-E.',
      checklist: ['Vérifier tous les champs obligatoires selon le profil déclaré','Contrôler HT/TVA/TTC','Valider la cohérence TVA','Apposer signature électronique si requise'],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 – Dépôt sur PDP-E et envoi statut « Déposée »',
      description: 'La PDP-E reçoit la facture, la valide techniquement (format, schéma), transmet le flux 1 à la PDP-R et envoie le statut « Déposée » au CdD/PPF.',
      checklist: [
        'PDP-E valide le format FacturX (schéma XML CII)',
        'Transmission du flux 1 (données de facturation) au CdD/PPF',
        'Statut « Déposée » envoyé au CdD/PPF',
        'Acheminement de la facture vers la PDP-R de l\'acheteur',
      ],
    },
    {
      de: 'DEPOSEE', vers: 'REJETEE', acteur: 'pdp_e',
      action: '② Rejet technique à l\'émission (Figure 3)',
      description: 'Si la facture est techniquement non conforme, la PDP-E la rejette. → Voir workflow de rejet (WORKFLOW_REJET_TECHNIQUE).',
      checklist: ['Identifier l\'erreur technique (format, schéma, données obligatoires)','Notifier le vendeur du rejet','Annulation comptable de la facture'],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception par la PDP-R de l\'acheteur',
      description: 'La PDP-R reçoit la facture et la met à disposition de l\'acheteur.',
      checklist: ['Accusé de réception automatique de la PDP-R','Facture disponible dans l\'espace acheteur'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④a Traitement de la facture',
      description: 'L\'acheteur traite la facture : rapprochement commande/livraison, contrôle conformité.',
      checklist: ['Rapprocher avec le bon de commande','Vérifier les montants','Contrôler les données fiscales du vendeur'],
    },
    {
      de: 'EN_CONTROLE', vers: 'ACCEPTEE', acteur: 'acheteur',
      action: '④b Statut de traitement : Acceptée',
      description: 'L\'acheteur accepte la facture. Le statut est transmis à la PDP-E via la PDP-R (étape 4c).',
      checklist: ['Enregistrer en comptabilité','Envoyer le statut d\'acceptation via PDP-R → PDP-E','Le vendeur reçoit la confirmation (étape 4c)'],
    },
    {
      de: 'EN_CONTROLE', vers: 'REFUSEE', acteur: 'acheteur',
      action: '④b Statut de traitement : Refusée (métier)',
      description: 'L\'acheteur refuse la facture pour motif métier. Statut transmis à la PDP-E.',
      checklist: ['Motiver le refus','Envoyer statut « Refusée » via PDP-R','Le vendeur doit émettre un avoir ou une facture corrective'],
    },
    {
      de: 'ACCEPTEE', vers: 'PAIEMENT_TRANSMIS', acteur: 'acheteur',
      action: '⑤a/⑤b Paiement de la facture – Statut « Paiement Transmis »',
      description: 'L\'acheteur effectue le paiement et transmet le statut « Paiement Transmis » via sa PDP-R.',
      checklist: ['Effectuer le virement bancaire','Envoyer statut « Paiement Transmis » via PDP-R (étape 5b)','Le vendeur reçoit la notification via sa PDP-E (étape 5c)'],
    },
    {
      de: 'PAIEMENT_TRANSMIS', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: '⑥a/⑥b Encaissement et rapprochement – Statut « Encaissée »',
      description: 'Le vendeur rapproche le paiement reçu avec la facture et émet le statut « Encaissée » via sa PDP-E. Ce statut est transmis à la PDP-R (6c) et au CdD/PPF (étape 7).',
      checklist: [
        'Vérifier le crédit bancaire reçu',
        'Rapprocher avec la facture correspondante',
        'Émettre le statut « Encaissée » via PDP-E (étape 6b)',
        'PDP-E transmet au CdD/PPF (étape 7) et à la PDP-R (étape 6c)',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_v',
      action: 'Archivage (conservation 10 ans minimum)',
      description: 'La facture encaissée et tous les statuts associés doivent être archivés.',
      checklist: ['Archiver le fichier FacturX complet (PDF+XML)','Archiver les statuts échangés','Conservation 10 ans minimum'],
    },
  ],
};

/**
 * WORKFLOW_REJET_TECHNIQUE (Figure 3 – Rejet à l'émission d'une facture e-invoicing)
 * Cas où la PDP-E rejette la facture techniquement dès l'émission (avant transmission à la PDP-R).
 * Le CdD/PPF reçoit quand même les données de facturation (flux 1) et les statuts.
 */
const WORKFLOW_REJET_TECHNIQUE = {
  etats: ['BROUILLON','EMISE','DEPOSEE','REJETEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture',
      description: 'Le vendeur crée la facture et la soumet à sa PDP-E pour transmission.',
      checklist: ['Créer la facture FacturX','Soumettre à la PDP-E'],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Dépôt sur PDP-E – contrôle technique en cours',
      description: 'La PDP-E reçoit la facture et procède aux contrôles techniques.',
      checklist: ['Validation du format XML (schéma CII)','Contrôle des champs obligatoires','Vérification de la signature si requise'],
    },
    {
      de: 'DEPOSEE', vers: 'REJETEE', acteur: 'pdp_e',
      action: '② Rejet de la facture en émission par la PDP-E',
      description: 'La PDP-E rejette la facture pour non-conformité technique. Le CdD/PPF est informé via les statuts « Déposée » et « Rejetée ». La facture n\'est PAS transmise à la PDP-R de l\'acheteur.',
      checklist: [
        'PDP-E notifie le vendeur du rejet et du motif technique',
        'Statuts « Déposée » puis « Rejetée » transmis au CdD/PPF (flux 1)',
        'La facture n\'atteint PAS l\'acheteur',
        '→ Passer à l\'étape 1b : Annulation comptable',
      ],
    },
    {
      de: 'REJETEE', vers: 'BROUILLON', acteur: 'vendeur',
      action: '① b Annulation comptable et correction de la facture',
      description: 'Le vendeur annule la facture rejetée en comptabilité, corrige l\'erreur technique et recrée une nouvelle facture.',
      checklist: [
        'Annuler la facture dans le système comptable (ne pas la laisser en attente)',
        'Identifier et corriger l\'erreur technique signalée par la PDP-E',
        'Créer une nouvelle facture avec un nouveau numéro de séquence',
        'Ne PAS réémettre la même facture avec le même numéro',
      ],
    },
  ],
};

// ─── Workflow standard (réutilisé pour les cas simples) ─────────────────────
// Aligné sur le cas nominal officiel AFNOR/DGFiP (Figure 2)
function _workflowStandard(acteurControle) {
  acteurControle = acteurControle || 'acheteur';
  return {
    etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
    transitions: [
      { de:'BROUILLON',         vers:'EMISE',             acteur:'vendeur',       action:'① Création et validation de la facture',                   checklist:['Vérifier tous les champs obligatoires','Contrôler HT/TVA/TTC','Valider la cohérence TVA'] },
      { de:'EMISE',             vers:'DEPOSEE',           acteur:'pdp_e',         action:'② Dépôt sur PDP-E + statut « Déposée » → CdD/PPF',        checklist:['PDP-E valide le format FacturX','Flux 1 transmis au CdD/PPF','Statut « Déposée » envoyé','Acheminement vers PDP-R acheteur'] },
      { de:'DEPOSEE',           vers:'REJETEE',           acteur:'pdp_e',         action:'② Rejet technique (voir WORKFLOW_REJET_TECHNIQUE)',         checklist:['Identifier l\'erreur technique','Notifier le vendeur','Annulation comptable obligatoire'] },
      { de:'DEPOSEE',           vers:'RECUE',             acteur:'pdp_r',         action:'③ Réception par PDP-R acheteur',                           checklist:['Accusé de réception PDP-R','Facture disponible chez l\'acheteur'] },
      { de:'RECUE',             vers:'EN_CONTROLE',       acteur:acteurControle,  action:'④a Traitement de la facture',                              checklist:['Rapprocher avec commande/livraison','Contrôler les montants','Vérifier les données fiscales'] },
      { de:'EN_CONTROLE',       vers:'ACCEPTEE',          acteur:acteurControle,  action:'④b Statut « Acceptée » → PDP-R → PDP-E',                  checklist:['Enregistrer en comptabilité','Envoyer statut d\'acceptation via PDP-R','Vendeur notifié via PDP-E (étape 4c)'] },
      { de:'EN_CONTROLE',       vers:'REFUSEE',           acteur:acteurControle,  action:'④b Statut « Refusée » (motif métier)',                     checklist:['Motiver le refus','Envoyer statut « Refusée » via PDP-R','Demander un avoir ou une facture corrective'] },
      { de:'ACCEPTEE',          vers:'PAIEMENT_TRANSMIS', acteur:'acheteur',      action:'⑤a/⑤b Paiement + statut « Paiement Transmis »',           checklist:['Virer le montant au IBAN indiqué (BT-84)','Envoyer statut « Paiement Transmis » via PDP-R (5b)','Vendeur notifié via PDP-E (5c)'] },
      { de:'PAIEMENT_TRANSMIS', vers:'ENCAISSEE',         acteur:'vendeur',       action:'⑥a/⑥b Encaissement + statut « Encaissée » → CdD/PPF',    checklist:['Vérifier le crédit bancaire','Rapprocher avec la facture','Émettre statut « Encaissée » via PDP-E (6b)','CdD/PPF notifié (étape 7), PDP-R notifiée (6c)'] },
      { de:'ENCAISSEE',         vers:'ARCHIVEE',          acteur:'comptable_a',   action:'Archivage (10 ans minimum)',                               checklist:['Archiver le fichier FacturX complet (PDF+XML)','Archiver les statuts échangés'] },
    ],
  };
}

// ─── Cas d'usage AFNOR XP Z12-014 ───────────────────────────────────────────
const USE_CASES = {

  // ── XP-1 : Multi-commande / Multi-livraison ─────────────────────────────
  'XP-1': {
    id: 'XP-1',
    categorie: 'Multi-commande / Multi-livraison',
    titre: 'Facture groupée multi-commandes / multi-livraisons',
    description: 'Une seule facture regroupe plusieurs bons de commande et/ou plusieurs livraisons distinctes.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Relations commerciales régulières avec facturation périodique regroupant plusieurs ordres et livraisons.',
    conditions: [
      'Plusieurs références de commandes (BT-13) et/ou bons de livraison (BT-16) rattachées à la même facture',
      'Chaque ligne de facture peut référencer une commande ou une livraison différente',
      'Profil EN 16931 recommandé pour la granularité des références',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-13','BT-15','BT-16','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires: [
      'Numéros des bons de commande concernés (BT-13 ou champs ligne)',
      'Numéros des bons de livraison concernés (BT-15 ou BT-16)',
      'Date de livraison ou période de prestation par ligne (si différente)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Regroupement et émission de la facture groupée',
          checklist:[
            'Lister toutes les commandes et livraisons couvertes',
            'Vérifier BT-13 (réf. commande) par ligne ou en entête',
            'Vérifier BT-16 (réf. livraison) par ligne si applicable',
            'Contrôler que les dates de livraison sont correctes',
            'Vérifier le cumul des montants HT, TVA, TTC',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission via PDP/PPF',
          checklist:['Transmettre via la plateforme habituelle','Conserver l\'accusé de transmission'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement automatique', checklist:['Statut de réception envoyé'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Rapprochement avec les commandes et BL',
          checklist:[
            'Rapprocher chaque ligne avec le bon de commande correspondant',
            'Vérifier les quantités livrées vs facturées',
            'Contrôler les prix unitaires par rapport aux conditions négociées',
          ]},
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation globale ou partielle',
          checklist:['Comptabiliser par centre de coût ou commande','Programmer le paiement unique'] },
        { de:'EN_CONTROLE', vers:'REFUSEE', acteur:'acheteur', action:'Refus si écart sur une ou plusieurs lignes',
          checklist:['Identifier la ou les lignes litigieuses','Demander une facture corrective'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement global',
          checklist:['Effectuer un seul virement pour l\'ensemble de la facture groupée'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage avec références commandes',
          checklist:['Archiver avec toutes les références commandes et BL associées'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-13', presence:true, message:'Référence bon de commande présente' },
        { champ:'BT-16', presence:true, message:'Référence livraison présente' },
        { champ:'BT-15', presence:true, message:'Référence réception présente' },
      ],
    },
  },

  // ── XP-2 : Facture déjà payée à l'émission ──────────────────────────────
  'XP-2': {
    id: 'XP-2',
    categorie: 'Facture déjà payée par un tiers ou l\'acheteur',
    titre: 'Facture déjà réglée par l\'acheteur ou un tiers à l\'émission',
    description: 'La facture est émise après que le paiement a déjà été effectué (achat comptant, carte bancaire, paiement immédiat).',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Ventes au comptant, paiements en ligne, règlement à la commande.',
    conditions: [
      'Montant déjà encaissé = montant de la facture',
      'Mention "Acquitté" ou moyen de paiement indiqué',
      'Date de paiement antérieure ou égale à la date d\'émission',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-9','BT-20','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Acquitté" ou "Payé" sur la facture',
      'Mode de paiement utilisé (BT-81)',
      'Date de paiement (BT-9)',
      'Montant déjà réglé',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture acquittée',
          checklist:[
            'Vérifier que le paiement a bien été reçu avant émission',
            'Indiquer BT-9 (date d\'échéance) = date du jour ou antérieure',
            'Ajouter BT-20 (texte conditions paiement) = "Acquitté"',
            'Renseigner BT-81 (moyen de paiement) : carte, virement, espèces…',
            'Total restant dû = 0',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission de la facture pour archivage comptable',
          checklist:['Transmettre via PDP/PPF','La facture est informative : le paiement est déjà effectué'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement', checklist:['Réception automatique'] },
        { de:'RECUE', vers:'ARCHIVEE', acteur:'acheteur', action:'Archivage direct (pas de paiement à faire)',
          checklist:[
            'Vérifier la mention "Acquitté"',
            'Comptabiliser la charge et le paiement simultanément',
            'Archiver la facture sans procédure de paiement',
          ]},
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-20', pattern:'acquitté|payé|réglé|comptant', message:'Mention "acquitté/payé" dans les conditions de paiement' },
        { champ:'BT-81', presence:true, message:'Moyen de paiement indiqué (paiement déjà effectué)' },
        { champ:'BT-9',  presence:true, message:'Date d\'échéance présente (peut indiquer paiement immédiat)' },
      ],
    },
  },

  // ── XP-3 : Facture à payer par un tiers PAYEUR connu ───────────────────
  'XP-3': {
    id: 'XP-3',
    categorie: 'Facture à payer par un tiers',
    titre: 'Facture à payer par un tiers PAYEUR identifié',
    description: 'Le paiement est effectué par un tiers identifié (organisme payeur, centrale de paiement) qui n\'est ni le vendeur ni l\'acheteur.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Organismes de sécurité sociale, mutuelles, assurances, centrales de paiement de groupe.',
    conditions: [
      'Le tiers payeur est connu et identifié dans la facture (BG-10)',
      'L\'acheteur reçoit la facture mais le paiement est adressé au tiers',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-61','BT-112','BT-115'],
    mentions_obligatoires:[
      'Identité du tiers payeur (BG-10 : BT-59 nom, BT-60 identifiant)',
      'IBAN du tiers payeur pour le virement (BT-84)',
      'Mention explicite que le paiement doit être adressé au tiers',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission avec identification du tiers payeur',
          checklist:[
            'Renseigner BG-10 (partie bénéficiaire du paiement)',
            'BT-59 : nom du tiers payeur',
            'BT-60 : identifiant du tiers payeur',
            'BT-84 : IBAN du tiers payeur (pas celui du vendeur)',
            'Vérifier le mandat ou accord tripartite',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission à l\'acheteur ET notification au tiers',
          checklist:['Transmettre via PDP/PPF','Notifier le tiers payeur de la facture émise'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement', checklist:['Statut de réception'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle et validation de la facture',
          checklist:['Vérifier l\'identité du tiers payeur','Contrôler les montants','Valider le paiement par le tiers'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation et instruction de paiement au tiers',
          checklist:['Notifier le tiers payeur de l\'acceptation','Transmettre l\'ordre de paiement au tiers'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'tiers', action:'Paiement par le tiers au vendeur',
          checklist:['Le tiers effectue le virement sur l\'IBAN du vendeur','Conserver la preuve de paiement'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage tripartite',
          checklist:['Archiver la facture, l\'accord tripartite, la preuve de paiement'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Nom du bénéficiaire du paiement (tiers) présent (BT-59)' },
        { champ:'BT-60', presence:true, message:'Identifiant du tiers payeur présent (BT-60)' },
      ],
    },
  },

  // ── XP-4 : Prise en charge partielle par un tiers ───────────────────────
  'XP-4': {
    id: 'XP-4',
    categorie: 'Facture à payer par un tiers',
    titre: 'Prise en charge partielle par un tiers (subvention, assurance)',
    description: 'Une partie est payée par l\'acheteur, le reste par un tiers (subvention, mutuelle, assurance, aide publique).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Formation professionnelle (OPCO), remboursements mutuelles/assurances, subventions partielles.',
    conditions: [
      'Le montant total est partagé entre l\'acheteur et un tiers',
      'La quote-part de chacun doit être clairement indiquée',
      'Deux flux de paiement distincts',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-112','BT-115'],
    mentions_obligatoires:[
      'Montant à la charge de l\'acheteur',
      'Montant pris en charge par le tiers avec son identité',
      'Base de la prise en charge (accord, convention, subvention)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission avec ventilation des parts',
          checklist:[
            'Indiquer le montant total et la répartition',
            'Identifier le tiers (BG-10) et sa quote-part',
            'Référencer la convention ou accord de prise en charge',
            'Indiquer l\'IBAN du vendeur pour les deux flux',
          ]},
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle et coordination avec le tiers',
          checklist:['Vérifier la répartition des montants','Valider avec le tiers la quote-part','Programmer les deux paiements'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation et double instruction de paiement',
          checklist:['Valider la facture','Instruire le tiers pour sa quote-part'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Double paiement : acheteur + tiers',
          checklist:['Paiement de la quote-part acheteur','Confirmation de paiement par le tiers'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage avec preuves des deux paiements',
          checklist:['Archiver la convention de prise en charge','Archiver les deux preuves de paiement'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Tiers bénéficiaire identifié (co-paiement)' },
        { champ:'BT-22', pattern:'subvention|prise en charge|opco|mutuelle|assurance', message:'Mention subvention/prise en charge dans la note' },
      ],
    },
  },

  // ── XP-5 : Frais collaborateurs avec facture ────────────────────────────
  'XP-5': {
    id: 'XP-5',
    categorie: 'Frais payés par des tiers avec facture',
    titre: 'Frais professionnels payés par un collaborateur — facture au nom de l\'entreprise',
    description: 'Un collaborateur avance des frais professionnels et obtient une facture au nom de son entreprise. L\'entreprise se fait refacturer.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Notes de frais, déplacements professionnels, repas d\'affaires avec facture nominative entreprise.',
    conditions: [
      'La facture est émise au nom de l\'entreprise (acheteur)',
      'Le collaborateur a avancé les fonds',
      'Remboursement via note de frais ou refacturation interne',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:['Nom et adresse de l\'entreprise acheteur','TVA récupérable si activité taxable','Justificatif de la dépense professionnelle'],
    workflow: {
      etats: ['EMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'EMISE', vers:'RECUE', acteur:'vendeur', action:'Remise de la facture au collaborateur',
          checklist:['Facture au nom de l\'entreprise (pas du collaborateur)','TVA mentionnée correctement'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle par le service comptable',
          checklist:['Vérifier que le nom de l\'entreprise est correct','Contrôler le caractère professionnel de la dépense','Valider la récupération de TVA'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Validation de la note de frais',
          checklist:['Comptabiliser la charge','Comptabiliser la TVA déductible','Programmer le remboursement au collaborateur'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Remboursement au collaborateur',
          checklist:['Virer le montant TTC au collaborateur','Conserver la facture originale'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage', checklist:['Archiver la facture et la note de frais'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'frais|déplacement|note de frais|remboursement', message:'Mention frais/déplacement dans la note' },
      ],
    },
  },

  // ── XP-6 : Frais sans facture (ticket de caisse) ────────────────────────
  'XP-6': {
    id: 'XP-6',
    categorie: 'Frais payés par des tiers sans facture',
    titre: 'Frais professionnels sans facture nominative (ticket de caisse)',
    description: 'Dépenses professionnelles payées par un collaborateur sans facture au nom de l\'entreprise (ticket de caisse, reçu simple).',
    profil_recommande: 'min',
    profils_acceptes: ['min', 'bwl', 'bas'],
    contexte: 'Petites dépenses quotidiennes, transports en commun, parking, repas sous plafond.',
    conditions: [
      'Pas de facture nominative possible',
      'Remboursement sur justificatif (ticket, reçu)',
      'Limites d\'exonération URSSAF à respecter',
      'Hors périmètre e-facture : e-reporting ou simple note de frais interne',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112'],
    mentions_obligatoires:['Justificatif de la dépense','Caractère professionnel établi','Respect des limites URSSAF'],
    workflow: {
      etats: ['RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle de la note de frais avec justificatifs',
          checklist:['Vérifier l\'authenticité des justificatifs','Contrôler les plafonds URSSAF','Vérifier le caractère professionnel'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'comptable_a', action:'Validation comptable',
          checklist:['Comptabiliser en charge','Pas de TVA récupérable sur ticket de caisse standard'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Remboursement au collaborateur',
          checklist:['Virement sur compte du collaborateur'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage de la note de frais',
          checklist:['Archiver notes de frais + justificatifs (5 ans minimum)'] },
      ],
    },
    signaux_detection: { description: 'Cas particulier hors périmètre e-facture standard', indices: [] },
  },

  // ── XP-7 : Carte d'achat / carte logée ──────────────────────────────────
  'XP-7': {
    id: 'XP-7',
    categorie: 'Facture suite à achat payé avec carte logée',
    titre: 'Facture suite à achat par carte d\'achat ou carte logée',
    description: 'Achats réalisés via une carte d\'achat d\'entreprise (carte logée). La facture est émise directement à l\'entreprise et payée via le programme de carte.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Programmes de cartes d\'achat B2B, achats décentralisés, voyages d\'affaires avec carte logée.',
    conditions: [
      'Le paiement est réglé automatiquement par le prestataire de carte (banque)',
      'L\'entreprise reçoit un relevé de carte en complément de la facture',
      'Référence du programme de carte à indiquer si disponible',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-44','BT-81','BT-112','BT-115'],
    mentions_obligatoires:['Moyen de paiement carte (BT-81 = 48)', 'Référence de la transaction carte si disponible'],
    workflow: {
      etats: ['EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission de la facture',
          checklist:['BT-81 = 48 (carte bancaire)','Indiquer la référence transaction si connue'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement', checklist:['Réception automatique'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Rapprochement avec relevé de carte',
          checklist:['Rapprocher la facture avec le relevé de carte','Vérifier la transaction correspondante'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Validation et réconciliation',
          checklist:['Comptabiliser la charge','Valider la récupération TVA','Le paiement est automatique via la carte'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'tiers', action:'Paiement automatique par le prestataire de carte',
          checklist:['Le prestataire de carte règle le vendeur','Aucune action manuelle requise'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage', checklist:['Archiver facture + relevé de carte correspondant'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-81', valeur:'48', message:'Moyen de paiement 48 = Carte bancaire' },
      ],
    },
  },

  // ── XP-8 : Affacturage / tiers destinataire du paiement ─────────────────
  'XP-8': {
    id: 'XP-8',
    categorie: 'Facture à payer à un tiers',
    titre: 'Affacturage – paiement à un tiers déterminé (factor)',
    description: 'Le vendeur a cédé ses créances à un factor (affactureur). L\'acheteur doit payer le factor, non le vendeur.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Contrats d\'affacturage, cession de créances, centralisation de trésorerie de groupe.',
    conditions: [
      'Le vendeur a signé un contrat d\'affacturage avec un factor',
      'L\'IBAN dans BT-84 est celui du factor, pas du vendeur',
      'Mention de la cession de créance obligatoire',
      'L\'acheteur a été notifié de la cession',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Créance cédée à [nom du factor]"',
      'IBAN du factor pour le paiement (BT-84)',
      'Identité du factor (BG-10 : BT-59, BT-60)',
      'Notification de cession de créance',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission avec cession de créance au factor',
          checklist:[
            'Renseigner BG-10 avec l\'identité du factor',
            'BT-84 = IBAN du factor',
            'Ajouter mention "Créance cédée à [factor]" en BT-22',
            'Vérifier que le contrat d\'affacturage couvre cette facture',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission à l\'acheteur + déclaration au factor',
          checklist:['Transmettre via PDP/PPF','Déclarer la facture auprès du factor pour financement'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement', checklist:['Notification de réception'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle et prise en compte de la cession',
          checklist:['Prendre note de la cession de créance','Confirmer la nouvelle domiciliation de paiement','Contrôler la facture normalement'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation – paiement programmé au factor',
          checklist:['Enregistrer l\'IBAN du factor','Programmer le virement au factor à l\'échéance'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement au factor',
          checklist:['Virement sur l\'IBAN du factor','Référencer la facture dans le paiement'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage', checklist:['Archiver facture + notification de cession + preuve de paiement au factor'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Bénéficiaire du paiement différent du vendeur (factor probable)' },
        { champ:'BT-22', pattern:'affacturage|factor|cession|créance cédée', message:'Mention affacturage/cession dans la note' },
      ],
    },
  },

  // ── XP-9 : Tiers Distributeur gestionnaire commande/réception ───────────
  'XP-9': {
    id: 'XP-9',
    categorie: 'Facture à payer à un tiers',
    titre: 'Paiement à un tiers Distributeur gérant commande et réception',
    description: 'Un distributeur ou dépositaire gère à la fois la commande, la réception des marchandises et le paiement pour le compte de l\'acheteur final.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Distribution multi-niveaux, centrales d\'achat, grossistes intermédiaires.',
    conditions: [
      'Le distributeur agit en son propre nom mais pour le compte de l\'acheteur final',
      'Les références commande et livraison sont celles du distributeur',
      'Le paiement transite par le distributeur',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-13','BT-15','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires:['Identité du distributeur (BG-10)','Référence commande distributeur (BT-13)','IBAN distributeur pour paiement'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Tiers bénéficiaire du paiement identifié' },
        { champ:'BT-13', presence:true, message:'Référence commande distributeur' },
      ],
    },
  },

  // ── XP-10 : Bénéficiaire inconnu / subrogation ───────────────────────────
  'XP-10': {
    id: 'XP-10',
    categorie: 'Facture à payer à un tiers',
    titre: 'Paiement à un tiers bénéficiaire inconnu (subrogation, affacturage confidentiel)',
    description: 'La créance est cédée à un tiers non identifié dans la facture (affacturage confidentiel, subrogation sans notification).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Affacturage confidentiel, subrogation légale (assurance-crédit), cession de créances judiciaires.',
    conditions: [
      'L\'acheteur peut ne pas être informé de la cession',
      'Le paiement peut être redirigé ultérieurement',
      'Complexité juridique : vérifier les règles de notification',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-84','BT-112','BT-115'],
    mentions_obligatoires:['IBAN de paiement (peut être celui du factor en cas de notification)','Accord de subrogation ou de cession si notification requise'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: { description: 'Cas complexe nécessitant analyse contractuelle', indices: [] },
  },

  // ── XP-11 : Traitement par tiers pour le compte de l'acheteur ───────────
  'XP-11': {
    id: 'XP-11',
    categorie: 'Facture à recevoir et traiter par un tiers',
    titre: 'Facture reçue et traitée par un tiers pour le compte de l\'acheteur',
    description: 'Un prestataire extérieur (service de gestion, outsourceur) reçoit et traite les factures au nom de l\'acheteur.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Externalisation de la comptabilité fournisseurs, service de gestion des factures, PDP agissant pour le compte de l\'acheteur.',
    conditions: [
      'Mandat de gestion entre l\'acheteur et le tiers traitant',
      'Le tiers traite et valide les factures au nom de l\'acheteur',
      'L\'acheteur reste responsable du paiement final',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Identité du tiers traitant si mentionné','Mandat de gestion opposable'],
    workflow: _workflowStandard('tiers'),
    signaux_detection: { description: 'Cas probable si la réception est gérée par une PDP mandatée', indices: [] },
  },

  // ── XP-12 : Intermédiaire transparent ────────────────────────────────────
  'XP-12': {
    id: 'XP-12',
    categorie: 'Intermédiaire transparent',
    titre: 'Intermédiaire transparent gestionnaire de factures pour son commettant acheteur',
    description: 'Un intermédiaire agit de façon transparente pour son commettant : les factures sont émises au nom du commettant (acheteur réel).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Centrales d\'achat agissant en tant que mandataires transparents, prestataires en nom propre pour compte d\'autrui.',
    conditions: [
      'L\'intermédiaire agit au nom et pour le compte du commettant',
      'La facture porte le nom du commettant (acheteur réel)',
      'L\'intermédiaire n\'est pas partie à la facture en son propre nom',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Nom du commettant comme acheteur','Mandat de représentation si applicable'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: { description: 'Cas nécessitant analyse contractuelle', indices: [] },
  },

  // ── XP-13 : Sous-traitance avec paiement direct ──────────────────────────
  'XP-13': {
    id: 'XP-13',
    categorie: 'Sous-traitance',
    titre: 'Facture de sous-traitance avec paiement direct ou délégation de paiement',
    description: 'Dans les marchés de travaux (BTP), le sous-traitant peut facturer directement le maître d\'ouvrage et être payé directement (paiement direct).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Marchés publics et privés de travaux BTP avec sous-traitants déclarés et acceptés.',
    conditions: [
      'Sous-traitant déclaré et accepté par le maître d\'ouvrage (loi 75-1334)',
      'Demande de paiement direct ou délégation de paiement',
      'Lien avec le contrat principal obligatoire',
      'Autoliquidation TVA possible en sous-traitance BTP',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-12','BT-13','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:[
      'Référence du marché principal',
      'Identité du maître d\'ouvrage (si paiement direct)',
      'Mention autoliquidation TVA si applicable (CGI art. 283-2)',
      'Numéro d\'acceptation du sous-traitant',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture de sous-traitance',
          checklist:[
            'Référencer le marché principal (BT-12)',
            'Identifier le titulaire du marché (BT-44 ou note)',
            'Si autoliquidation : BT-118=AE, BT-117=0, mention légale',
            'Si paiement direct : IBAN du sous-traitant en BT-84',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission au titulaire ET au maître d\'ouvrage si paiement direct',
          checklist:['Envoyer via PDP/PPF','En paiement direct : notifier le maître d\'ouvrage directement'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle par le titulaire du marché',
          checklist:['Vérifier la conformité des travaux','Valider le décompte de sous-traitance','Vérifier l\'autoliquidation si applicable'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation et transmission au maître d\'ouvrage',
          checklist:['Valider la facture','Transmettre au maître d\'ouvrage pour paiement direct si applicable'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'tiers', action:'Paiement direct par le maître d\'ouvrage ou par le titulaire',
          checklist:['Paiement dans les délais légaux','Justifier le paiement au sous-traitant'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Archivage', checklist:['Archiver avec accord de sous-traitance et décompte'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-118', valeur:'AE', message:'Autoliquidation TVA (fréquente en sous-traitance BTP)' },
        { champ:'BT-12', presence:true, message:'Référence contrat présente (marché principal)' },
        { champ:'BT-22', pattern:'sous-traitance|sous-traitant|paiement direct', message:'Mention sous-traitance dans la note' },
      ],
    },
  },

  // ── XP-14 : Co-traitance B2B ──────────────────────────────────────────────
  'XP-14': {
    id: 'XP-14',
    categorie: 'Co-traitance',
    titre: 'Facture co-traitance B2B',
    description: 'Plusieurs entreprises co-traitantes facturent ensemble ou séparément pour un marché commun.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Groupements momentanés d\'entreprises (GME), consortiums, appels d\'offres groupés.',
    conditions: [
      'Existence d\'un accord de co-traitance (groupement conjoint ou solidaire)',
      'Chaque co-traitant facture sa propre quote-part, ou un mandataire facture l\'ensemble',
      'Référence au marché commun obligatoire',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-12','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Référence du marché commun','Identité du mandataire du groupement si applicable','Quote-part du co-traitant concerné'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-12', presence:true, message:'Référence contrat/marché commun présente' },
        { champ:'BT-22', pattern:'co-traitance|groupement|gme|consortium|mandataire', message:'Mention co-traitance dans la note' },
      ],
    },
  },

  // ── XP-15 : Commande/paiement par un tiers pour le compte de l'acheteur ─
  'XP-15': {
    id: 'XP-15',
    categorie: 'Tiers commandeur',
    titre: 'Facture suite à commande et paiement par un tiers pour le compte de l\'acheteur',
    description: 'Un tiers (centrale d\'achat, maison-mère, holding) passe la commande et paie pour le compte de l\'acheteur final.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Achats centralisés de groupe, centrale d\'achat groupement, holding payant pour ses filiales.',
    conditions: [
      'Le tiers agit en mandataire de l\'acheteur final',
      'La facture peut être émise à l\'acheteur final ou au tiers',
      'Le paiement est effectué par le tiers',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-13','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires:['Identité du tiers commandeur','Mandat de représentation','IBAN du tiers pour paiement'],
    workflow: _workflowStandard('tiers'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Tiers payeur identifié (centrale d\'achat, holding)' },
        { champ:'BT-13', presence:true, message:'Référence commande présente (commande du tiers)' },
      ],
    },
  },

  // ── XP-16 : Facture de débours ────────────────────────────────────────────
  'XP-16': {
    id: 'XP-16',
    categorie: 'Débours',
    titre: 'Facture de débours pour remboursement',
    description: 'Remboursement de frais avancés pour le compte d\'un client sans marge ni TVA (débours au sens fiscal).',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Avocats refacturant des droits de greffe, experts refacturant des frais d\'analyse, agences refacturant des achats médias.',
    conditions: [
      'Les sommes sont avancées au nom et pour le compte du client',
      'Pas de TVA sur les débours (si conditions art. 267 II du CGI réunies)',
      'Justificatifs au nom du client exigés',
      'Distinction débours/refacturation (avec marge = TVA applicable)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-22','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Débours" sur la facture',
      'Justificatifs des charges avancées au nom du client',
      'Distinction claire débours / honoraires',
      'Référence légale si exonération TVA (CGI art. 267 II)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture de débours',
          checklist:[
            'Identifier clairement les débours vs honoraires',
            'Joindre ou référencer les justificatifs au nom du client',
            'Pas de TVA sur la partie débours si conditions CGI réunies',
            'TVA normale sur la partie honoraires',
          ]},
        { de:'EMISE', vers:'RECUE', acteur:'acheteur', action:'Réception et vérification', checklist:['Vérifier les justificatifs fournis','Contrôler l\'absence de marge sur les débours'] },
        { de:'RECUE', vers:'ACCEPTEE', acteur:'acheteur', action:'Validation', checklist:['Comptabiliser en charge TTC pour les débours sans TVA'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement', checklist:['Payer le total (honoraires TTC + débours)'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage avec justificatifs', checklist:['Archiver facture + tous les justificatifs de débours'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'débours|avances|frais avancés', message:'Mention débours dans la note' },
        { champ:'BT-122', presence:true, message:'Documents justificatifs joints (frais avancés)' },
      ],
    },
  },

  // ── XP-17a : Marketplace – tiers intermédiaire de paiement ───────────────
  'XP-17a': {
    id: 'XP-17a',
    categorie: 'Marketplace / Intermédiaire',
    titre: 'Facture via Marketplace – tiers intermédiaire de paiement',
    description: 'Le vendeur utilise une Marketplace pour vendre. La plateforme collecte le paiement et reverse au vendeur déduction faite de sa commission.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Ventes via Amazon, Cdiscount, FNAC, Mirakl, ou toute plateforme de vente en ligne B2B.',
    conditions: [
      'La facture est émise par le vendeur à l\'acheteur final',
      'La Marketplace collecte le paiement (tiers intermédiaire)',
      'Le vendeur reçoit le paiement net de commission',
      'La Marketplace émet sa propre facture de commission au vendeur',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires:[
      'Identification de la Marketplace comme intermédiaire de paiement',
      'IBAN de la Marketplace pour le paiement acheteur → Marketplace',
      'Référence de la commande Marketplace',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture via la Marketplace',
          checklist:[
            'Identifier la Marketplace comme intermédiaire (BG-10)',
            'BT-84 = IBAN de la Marketplace pour réception du paiement acheteur',
            'Référencer la commande Marketplace (BT-13)',
            'Vérifier les obligations fiscales de la Marketplace',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission via la Marketplace',
          checklist:['La Marketplace transmet la facture à l\'acheteur via son système ou PDP'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle de la facture',
          checklist:['Vérifier les biens/services reçus','Contrôler les montants'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation', checklist:['Valider la commande Marketplace'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement à la Marketplace',
          checklist:['Paiement à la Marketplace (pas directement au vendeur)','La Marketplace reversera au vendeur déduction commission'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Archivage', checklist:['Archiver facture + relevé Marketplace + commission'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-59', presence:true, message:'Intermédiaire de paiement (Marketplace) identifié' },
        { champ:'BT-22', pattern:'marketplace|plateforme|commission', message:'Mention marketplace dans la note' },
      ],
    },
  },

  // ── XP-17b : Marketplace + mandat de facturation ─────────────────────────
  'XP-17b': {
    id: 'XP-17b',
    categorie: 'Marketplace / Intermédiaire',
    titre: 'Facture via Marketplace avec mandat de facturation',
    description: 'La Marketplace émet la facture au nom du vendeur via un mandat de facturation, en plus d\'être intermédiaire de paiement.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Marketplaces opérant avec mandat de facturation (self-billing Marketplace) : la plateforme génère les factures pour les vendeurs.',
    conditions: [
      'Mandat de facturation entre la Marketplace et le vendeur',
      'La Marketplace émet la facture au nom du vendeur',
      'Mention obligatoire "Facture émise par [Marketplace] au nom de [Vendeur]"',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Facture émise par [Marketplace] au nom de [Vendeur]" (mandat de facturation)',
      'Identité du vendeur réel comme émetteur',
      'Identité de la Marketplace comme mandataire de facturation',
    ],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'mandat.*facturation|facturation.*mandat|au nom de', message:'Mention mandat de facturation dans la note' },
        { champ:'BT-59', presence:true, message:'Mandataire de facturation identifié' },
      ],
    },
  },

  // ── XP-18 : Notes de débit ────────────────────────────────────────────────
  'XP-18': {
    id: 'XP-18',
    categorie: 'Notes de débit',
    titre: 'Gestion des notes de débit',
    description: 'Une note de débit est émise par l\'acheteur vers le vendeur pour réclamer une somme (pénalité, correction, remise non accordée).',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Pénalités de retard, corrections de prix, litiges commerciaux résolus par débit.',
    conditions: [
      'TypeCode 383 (note de débit) ou équivalent',
      'L\'émetteur est l\'acheteur (inversion des rôles)',
      'Référence à la facture initiale ou au motif du débit',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-25','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'TypeCode 383 (note de débit)',
      'Motif du débit (pénalité, correctif…)',
      'Référence à la facture ou au contrat initial',
      'Montant du débit (HT + TVA si applicable)',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','REFUSEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'acheteur', action:'Émission de la note de débit par l\'acheteur',
          checklist:[
            'Utiliser TypeCode 383',
            'Référencer la facture ou le contrat objet du débit (BT-25)',
            'Justifier le motif du débit',
            'Calculer le montant exact avec TVA si applicable',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'acheteur', action:'Transmission au vendeur', checklist:['Transmettre via PDP/PPF'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'vendeur', action:'Contrôle de la note de débit',
          checklist:['Vérifier le bien-fondé du débit','Contrôler le calcul du montant réclamé','Accepter ou contester'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'vendeur', action:'Acceptation du débit',
          checklist:['Comptabiliser le débit en charge ou en réduction de produit','Programmer le paiement à l\'acheteur'] },
        { de:'EN_CONTROLE', vers:'REFUSEE', acteur:'vendeur', action:'Contestation du débit',
          checklist:['Motiver le refus','Engager une procédure de résolution du litige'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'vendeur', action:'Paiement du débit à l\'acheteur',
          checklist:['Virer le montant à l\'acheteur','Ou compenser avec une prochaine facture'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Archivage', checklist:['Archiver note de débit et preuve de règlement'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-3', valeur:'383', message:'TypeCode 383 = Note de débit' },
        { champ:'BT-25', presence:true, message:'Référence à une facture initiale (motif du débit)' },
      ],
    },
  },
};

// ─── Partie 2 : XP-19 à XP-36 + detecterCasUsage ────────────────────────────
// (ajout via Object.assign ci-dessous)

Object.assign(USE_CASES, {

  // ── XP-19a : Tiers facturant avec mandat de facturation ──────────────────
  'XP-19a': {
    id: 'XP-19a',
    categorie: 'Mandat de facturation',
    titre: 'Facture émise par un tiers facturant avec mandat de facturation',
    description: 'Un prestataire tiers émet la facture au nom du vendeur sur la base d\'un mandat de facturation (outsourcing facturation).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Sociétés de gestion, prestataires de services de facturation, centrales de facturation de groupe.',
    conditions: [
      'Mandat de facturation signé entre le vendeur et le tiers facturant',
      'La facture porte le nom et le SIREN du vendeur réel',
      'Le tiers facturant peut être identifié dans les métadonnées',
      'Mention obligatoire du mandat de facturation sur la facture',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-30','BT-31','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Facture émise par [tiers] au nom de [vendeur] – Mandat de facturation du [date]"',
      'SIREN/SIRET et TVA du vendeur réel',
      'Identité du tiers mandataire de facturation',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'tiers', action:'Émission par le tiers mandataire au nom du vendeur',
          checklist:[
            'Vérifier que le mandat de facturation est valide et en cours',
            'La facture doit mentionner le mandat',
            'Les données fiscales (SIREN, TVA) sont celles du vendeur',
            'Signature électronique du tiers peut être utilisée',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'tiers', action:'Transmission via PDP/PPF au nom du vendeur',
          checklist:['Transmettre en tant que mandataire','Conserver l\'accusé pour le vendeur'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Contrôle normal',
          checklist:['Vérifier les données du vendeur réel','Contrôler la mention du mandat','Valider les montants'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation', checklist:['Acceptation normale','Paiement au vendeur réel (ou au tiers si BG-10 renseigné)'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement', checklist:['Payer selon les instructions de paiement de la facture'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage', checklist:['Archiver avec copie du mandat de facturation'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'mandat.*facturation|facturation.*mandat|au nom de|mandataire', message:'Mention mandat de facturation' },
      ],
    },
  },

  // ── XP-19b : Auto-facturation (self-billing) ─────────────────────────────
  'XP-19b': {
    id: 'XP-19b',
    categorie: 'Auto-facturation',
    titre: 'Auto-facturation (self-billing) – l\'acheteur émet la facture au nom du vendeur',
    description: 'L\'acheteur émet lui-même la facture au nom du vendeur, sur la base d\'un accord d\'auto-facturation (common en royalties, agriculture, énergie).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Droits d\'auteur, royalties, livraisons agricoles, contrats d\'énergie, secteurs avec pricing ex-post.',
    conditions: [
      'Accord d\'auto-facturation entre acheteur et vendeur',
      'Mention obligatoire "Autofacturation" (BT-17 = true, ou mention explicite)',
      'Le vendeur ne doit pas émettre de facture pour les mêmes opérations',
      'BT-17 (indicateur auto-facturation) = true en EN 16931',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-17','BT-27','BT-30','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention "Autofacturation" obligatoire (BT-17)',
      'Accord d\'auto-facturation référencé',
      'Données fiscales complètes du vendeur (SIREN, TVA)',
      'Le vendeur ne doit pas émettre de facture en parallèle',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'acheteur', action:'Émission de l\'auto-facture par l\'acheteur',
          checklist:[
            'Renseigner BT-17 = true (indicateur autofacturation)',
            'Ajouter mention "Autofacturation" en BT-22 si BT-17 non supporté',
            'Utiliser les données fiscales du vendeur (non de l\'acheteur)',
            'Référencer l\'accord d\'auto-facturation',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'acheteur', action:'Envoi de l\'auto-facture au vendeur pour validation',
          checklist:['Transmettre via PDP/PPF','Le vendeur doit valider l\'auto-facture'] },
        { de:'TRANSMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement vers le vendeur', checklist:['Statut de réception'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'vendeur', action:'Contrôle de l\'auto-facture par le vendeur',
          checklist:['Vérifier la conformité des montants calculés','Valider les données de la facture','S\'assurer de ne pas émettre de facture en double'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'vendeur', action:'Acceptation de l\'auto-facture',
          checklist:['Comptabiliser le produit','La TVA est collectée par le vendeur (pas l\'acheteur)'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement au vendeur', checklist:['Payer selon les conditions de l\'accord'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Archivage', checklist:['Archiver avec accord d\'auto-facturation'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-17', valeur:'true', message:'BT-17 = true (indicateur autofacturation)' },
        { champ:'BT-22', pattern:'autofacturation|auto-facturation|self.billing', message:'Mention autofacturation dans la note' },
      ],
    },
  },

  // ── XP-20 : Facture d'acompte ─────────────────────────────────────────────
  'XP-20': {
    id: 'XP-20',
    categorie: 'Acomptes et facturation définitive',
    titre: 'Facture d\'acompte (premier paiement partiel)',
    description: 'Facture émise pour percevoir un acompte avant la livraison ou la fin de la prestation. Donne lieu à TVA dès l\'encaissement.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Grands projets, construction, commandes importantes, prestations longue durée.',
    conditions: [
      'TypeCode 386 (acompte) ou 380 avec mention "acompte"',
      'TVA exigible dès l\'encaissement de l\'acompte',
      'La facture définitive (XP-21) devra déduire cet acompte',
      'Référence au contrat ou bon de commande global obligatoire',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-12','BT-22','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:[
      'Mention "Facture d\'acompte n°X sur contrat N°Y"',
      'Montant de l\'acompte (HT + TVA)',
      'Pourcentage ou montant du contrat global',
      'Date prévisionnelle de la facture définitive',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture d\'acompte',
          checklist:[
            'TypeCode 386 ou 380 avec mention "acompte" en BT-22',
            'Référencer le contrat (BT-12) ou la commande (BT-13)',
            'Inclure la TVA sur le montant de l\'acompte',
            'Préciser le montant total du projet et % représenté',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission via PDP/PPF', checklist:['Transmettre normalement'] },
        { de:'RECUE', vers:'ACCEPTEE', acteur:'acheteur', action:'Validation et comptabilisation de l\'acompte',
          checklist:[
            'Comptabiliser en compte fournisseur acompte (409xxx)',
            'Récupérer la TVA dès réception de la facture d\'acompte',
            'Programmer le paiement de l\'acompte',
          ]},
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement de l\'acompte',
          checklist:['Virer le montant TTC de l\'acompte','Conserver trace pour déduction sur facture définitive'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage en attente de la facture définitive',
          checklist:['Archiver et noter la relation avec la future facture définitive (XP-21)'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-3', valeur:'386', message:'TypeCode 386 = Facture d\'acompte' },
        { champ:'BT-22', pattern:'acompte|avance|tranche', message:'Mention acompte/avance dans la note' },
        { champ:'BT-12', presence:true, message:'Référence contrat présente (projet global)' },
      ],
    },
  },

  // ── XP-21 : Facture définitive (après acomptes) ───────────────────────────
  'XP-21': {
    id: 'XP-21',
    categorie: 'Acomptes et facturation définitive',
    titre: 'Facture définitive soldant les acomptes perçus',
    description: 'Facture finale clôturant un projet, déduisant les acomptes déjà versés et facturés (XP-20). Le solde restant dû est facturé.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Clôture de projet, livraison finale, fin de prestation après versement d\'acomptes.',
    conditions: [
      'Les acomptes déjà perçus doivent être déduits du total',
      'Référence à chaque facture d\'acompte (BG-20 ou BG-21 pour remises/majorations)',
      'Le solde = total TTC - somme des acomptes versés',
      'TVA réajustée selon les acomptes déjà déclarés',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-12','BT-22','BT-27','BT-44','BT-112','BT-113','BT-115'],
    mentions_obligatoires:[
      'Mention "Facture définitive – Déduction des acomptes"',
      'Références des factures d\'acompte déduites',
      'Montants des acomptes déduits',
      'Total général HT et TTC',
      'Solde à payer',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture définitive',
          checklist:[
            'Lister toutes les factures d\'acompte (références et montants)',
            'Déduire chaque acompte du montant total (BG-20 ou note BT-22)',
            'Calculer le solde à payer TTC',
            'Mentionner les numéros des factures d\'acompte',
            'Vérifier la TVA : seul le complément de TVA est dû',
          ]},
        { de:'EMISE', vers:'TRANSMISE', acteur:'vendeur', action:'Transmission', checklist:['Transmettre via PDP/PPF'] },
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Rapprochement avec les acomptes versés',
          checklist:[
            'Vérifier que tous les acomptes versés sont bien déduits',
            'Contrôler le solde restant dû',
            'Comparer avec les factures d\'acompte archivées',
            'Clôturer les écritures comptables d\'acompte (compte 409)',
          ]},
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation de la facture définitive',
          checklist:['Comptabiliser le solde','Solder les comptes d\'acompte','Programmer le paiement du solde'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement du solde', checklist:['Virer le solde TTC restant dû'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage complet',
          checklist:['Archiver la facture définitive ET toutes les factures d\'acompte','Vérifier la cohérence des montants totaux'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'définitif|solde|déduction.*acompte|acompte.*déduit', message:'Mention facture définitive/solde dans la note' },
        { champ:'BT-113', presence:true, message:'Montant total des paiements arrondis (solde après acomptes)' },
      ],
    },
  },

  // ── XP-22a : Escompte – TVA à l'encaissement ─────────────────────────────
  'XP-22a': {
    id: 'XP-22a',
    categorie: 'Escompte',
    titre: 'Facture avec escompte pour paiement rapide – TVA à l\'encaissement (services)',
    description: 'Facture de prestations de services avec offre d\'escompte pour paiement anticipé. TVA exigible à l\'encaissement donc ajustée si escompte utilisé.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Prestataires de services soumis à TVA à l\'encaissement proposant un escompte commercial.',
    conditions: [
      'TVA sur les services est exigible à l\'encaissement',
      'Si l\'escompte est utilisé, la base TVA est réduite du montant de l\'escompte',
      'L\'escompte doit être clairement conditionnel ("si paiement avant le XX")',
      'BG-20 (remise sur document) ou BT-94/BT-95 pour l\'escompte',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-20','BT-27','BT-44','BT-94','BT-95','BT-112','BT-115','BT-118'],
    mentions_obligatoires:[
      'Taux et montant de l\'escompte proposé',
      'Date limite pour bénéficier de l\'escompte',
      'Mention "TVA calculée sur le net après escompte si paiement avant [date]"',
      'Montant TTC avec et sans escompte',
    ],
    workflow: {
      etats: ['BROUILLON','EMISE','TRANSMISE','RECUE','EN_CONTROLE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission avec clause d\'escompte',
          checklist:[
            'Définir le taux d\'escompte et la date limite',
            'Calculer le montant HT net d\'escompte',
            'Recalculer la TVA sur la base nette si paiement anticipé',
            'Mentionner les deux montants TTC (avec et sans escompte)',
            'Indiquer en BT-20 les conditions de paiement avec escompte',
          ]},
        { de:'RECUE', vers:'EN_CONTROLE', acteur:'acheteur', action:'Décision sur l\'escompte',
          checklist:['Évaluer l\'opportunité financière de l\'escompte','Vérifier la date limite','Décider de payer tôt ou à l\'échéance'] },
        { de:'EN_CONTROLE', vers:'ACCEPTEE', acteur:'acheteur', action:'Validation et choix de paiement',
          checklist:['Si escompte utilisé : comptabiliser le montant net et la TVA réduite','Si non : comptabiliser le montant plein'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement (avec ou sans escompte)',
          checklist:['Payer le montant net si dans les délais escompte','Ou payer le plein montant à l\'échéance'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Régularisation TVA si escompte utilisé',
          checklist:['Émettre une note de crédit TVA si l\'escompte a été utilisé','Archiver la facture et la note de régularisation'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-20', pattern:'escompte|ristourne|paiement.*anticipé|%.*avant', message:'Conditions d\'escompte dans les conditions de paiement' },
        { champ:'BT-94', presence:true, message:'Remise sur document présente (escompte possible)' },
      ],
    },
  },

  // ── XP-22b : Escompte – TVA aux débits (biens) ───────────────────────────
  'XP-22b': {
    id: 'XP-22b',
    categorie: 'Escompte',
    titre: 'Facture avec escompte pour paiement rapide – TVA aux débits (livraisons de biens)',
    description: 'Facture de livraison de biens avec offre d\'escompte. TVA exigible à la livraison (débits), donc la base TVA est calculée sur le montant sans escompte.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Fournisseurs de biens soumis à TVA aux débits proposant un escompte de règlement.',
    conditions: [
      'TVA sur les biens est exigible à la livraison (TVA aux débits)',
      'La TVA est calculée sur le prix brut (avant escompte éventuel)',
      'L\'escompte réduit la base HT mais la TVA reste calculée sur le brut',
      'Note de crédit TVA si l\'escompte est effectivement utilisé',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-20','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:[
      'Taux et montant de l\'escompte proposé',
      'Date limite pour bénéficier de l\'escompte',
      'TVA calculée sur le prix brut (avant escompte)',
      'Mention "Escompte de X% si paiement avant [date]"',
    ],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-20', pattern:'escompte|ristourne|paiement.*anticipé|%.*avant', message:'Conditions d\'escompte dans les conditions de paiement' },
        { champ:'BT-3', valeur:'380', message:'TypeCode 380 = Facture standard (vente de biens)' },
      ],
    },
  },

  // ── XP-23 : Auto-facturation particulier/professionnel ────────────────────
  'XP-23': {
    id: 'XP-23',
    categorie: 'Auto-facturation particulier / professionnel',
    titre: 'Auto-facturation entre particulier et professionnel',
    description: 'Un professionnel (acheteur) émet une facture au nom d\'un vendeur particulier ou d\'un professionnel non équipé pour la facturation électronique.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Achats aux particuliers, droits d\'auteur à des particuliers, agriculteurs non assujettis.',
    conditions: [
      'Le vendeur est un particulier ou n\'est pas assujetti à TVA',
      'L\'acheteur professionnel émet la facture au nom du vendeur',
      'Accord préalable du vendeur (acceptation de l\'auto-facturation)',
      'Mention "Autofacturation" obligatoire',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-17','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Mention "Autofacturation"','Identité complète du vendeur particulier','Accord du vendeur référencé','Pas de TVA si vendeur non assujetti'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-17', valeur:'true', message:'BT-17 = true (autofacturation)' },
        { champ:'BT-31', presence:false, message:'Pas de TVA vendeur (particulier ou non assujetti)' },
      ],
    },
  },

  // ── XP-24 : Arrhes ────────────────────────────────────────────────────────
  'XP-24': {
    id: 'XP-24',
    categorie: 'Arrhes',
    titre: 'Gestion des arrhes',
    description: 'Arrhes versées lors de la commande : contrairement à l\'acompte, les arrhes permettent à l\'acheteur de se rétracter (en les perdant) ou au vendeur (en remboursant le double).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Réservations hôtelières, événements, commandes personnalisées avec droit de rétractation.',
    conditions: [
      'Qualification juridique explicite : "arrhes" (pas "acompte")',
      'TVA exigible dès l\'encaissement des arrhes si activité taxable',
      'En cas d\'annulation : les arrhes sont conservées (pas de facture corrective) ou remboursées × 2',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-22','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Mention explicite "Arrhes" (pas "acompte")', 'Conditions d\'annulation et conséquences sur les arrhes', 'TVA si activité taxable'],
    workflow: {
      etats: ['BROUILLON','EMISE','RECUE','ACCEPTEE','PAYEE','ARCHIVEE'],
      transitions: [
        { de:'BROUILLON', vers:'EMISE', acteur:'vendeur', action:'Émission de la facture d\'arrhes',
          checklist:['Mentionner explicitement "arrhes"','Indiquer les conditions d\'annulation','Inclure la TVA si applicable','Préciser le montant total de la commande'] },
        { de:'EMISE', vers:'RECUE', acteur:'acheteur', action:'Réception', checklist:['Prendre note des conditions d\'annulation'] },
        { de:'RECUE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation', checklist:['Comprendre la distinction arrhes/acompte'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement des arrhes', checklist:['Payer le montant des arrhes','Conserver pour imputation sur la facture finale si pas d\'annulation'] },
        { de:'PAYEE', vers:'ARCHIVEE', acteur:'comptable_a', action:'Archivage', checklist:['Archiver en notant la distinction arrhes/acompte pour le traitement comptable en cas d\'annulation'] },
      ],
    },
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'arrhes', message:'Mention "arrhes" dans la note' },
      ],
    },
  },

  // ── XP-25 : Bons et cartes cadeaux ───────────────────────────────────────
  'XP-25': {
    id: 'XP-25',
    categorie: 'Bons et cartes cadeaux',
    titre: 'Gestion des bons et cartes cadeaux',
    description: 'Émission ou utilisation de bons cadeaux ou cartes cadeaux en paiement total ou partiel d\'une facture.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Vente de bons cadeaux, utilisation de cartes cadeaux, programmes de fidélité.',
    conditions: [
      'Le bon cadeau est un instrument à usage unique (SVP) ou multi-usage (MPV) selon la directive TVA',
      'TVA à la vente du bon si SVP (usage unique), à l\'utilisation si MPV (multi-usage)',
      'La valeur du bon utilisée en paiement réduit le montant dû',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-22','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Valeur du bon utilisé en déduction', 'Type de bon (usage unique ou multi-usage)', 'TVA selon le type de bon'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'bon.*cadeau|carte.*cadeau|coupon|voucher', message:'Mention bon/carte cadeau dans la note' },
      ],
    },
  },

  // ── XP-26 : Clause de réserve contractuelle ───────────────────────────────
  'XP-26': {
    id: 'XP-26',
    categorie: 'Clause de réserve',
    titre: 'Factures avec clause de réserve de propriété contractuelle',
    description: 'La facture comporte une clause de réserve de propriété : le vendeur reste propriétaire des biens jusqu\'au paiement intégral.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Ventes de matériaux, équipements, biens avec paiement différé et réserve de propriété.',
    conditions: [
      'Clause de réserve de propriété mentionnée sur la facture (obligatoire pour être opposable)',
      'La TVA est due à la livraison malgré la réserve',
      'En cas de non-paiement : le vendeur peut revendiquer les biens',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-22','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Clause de réserve de propriété explicite (BT-22)', 'Conditions de rétention en cas de défaut de paiement'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'réserve.*propriété|propriété.*réserve|clause.*réserve', message:'Clause de réserve de propriété dans la note' },
      ],
    },
  },

  // ── XP-27 : Tickets de péage ──────────────────────────────────────────────
  'XP-27': {
    id: 'XP-27',
    categorie: 'Cas particuliers',
    titre: 'Tickets de péage vendus à un assujetti',
    description: 'Factures pour péages autoroutiers ou taxes de passage délivrées à des assujettis TVA.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Abonnements télépage (Liber-t), péages facturés aux entreprises, relevés mensuels de péage.',
    conditions: [
      'TVA à 20% sur les péages (sauf exonérations spécifiques)',
      'La facture peut être globale mensuelle pour tous les passages',
      'Déductibilité TVA conditionnelle selon l\'utilisation du véhicule',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:['Période couverte', 'Nombre de passages si facturation globale', 'Taux de TVA applicable (20%)'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'péage|autoroute|télépeage|liber-t|passage', message:'Mention péage dans la note' },
      ],
    },
  },

  // ── XP-28 : Notes de restaurant ───────────────────────────────────────────
  'XP-28': {
    id: 'XP-28',
    categorie: 'Cas particuliers',
    titre: 'Notes de restaurant',
    description: 'Factures de restauration délivrées à des professionnels pour des repas d\'affaires.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Repas d\'affaires, restaurants d\'entreprise, traiteurs pour événements professionnels.',
    conditions: [
      'TVA à 10% sur la restauration (taux intermédiaire)',
      'La TVA est déductible pour les repas professionnels sous conditions',
      'Montant et nombre de convives recommandés sur la note',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:['Nombre de convives', 'Nature du repas (d\'affaires)', 'TVA à 10%'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'restaurant|repas|déjeuner|dîner|convive', message:'Mention restaurant/repas dans la note' },
        { champ:'BT-119', valeur:'10', message:'Taux TVA 10% (restauration)' },
      ],
    },
  },

  // ── XP-29 : Assujetti unique ──────────────────────────────────────────────
  'XP-29': {
    id: 'XP-29',
    categorie: 'Assujetti unique',
    titre: 'Assujetti unique (art. 256 C du CGI) – Groupe TVA',
    description: 'Plusieurs entités juridiques constituent un assujetti unique TVA. Les opérations internes au groupe sont hors champ TVA.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Groupes de sociétés ayant opté pour le régime d\'assujetti unique (groupement TVA français, art. 256C CGI).',
    conditions: [
      'Les entités membres de l\'assujetti unique partagent un seul numéro TVA de groupe',
      'Les opérations entre membres ne sont pas soumises à TVA',
      'La facturation interne peut être simplifiée',
      'Obligation de déclarer TVA globalement pour le groupe',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-31','BT-44','BT-48','BT-112','BT-115'],
    mentions_obligatoires:['Numéro TVA de l\'assujetti unique (commun au groupe)', 'Identification des entités membres concernées'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'assujetti unique|groupe tva|256 c|groupe fiscal', message:'Mention assujetti unique/groupe TVA' },
        { champ:'BT-31', presence:true, message:'Numéro TVA de groupe présent' },
      ],
    },
  },

  // ── XP-30 : TVA déjà collectée (e-reporting B2C) ─────────────────────────
  'XP-30': {
    id: 'XP-30',
    categorie: 'TVA déjà collectée',
    titre: 'TVA déjà collectée – e-reporting B2C avec facture a posteriori',
    description: 'Dans le cadre de l\'e-reporting B2C, la TVA a déjà été déclarée sur les données de transaction. Une facture est émise a posteriori à la demande du client.',
    profil_recommande: 'bwl',
    profils_acceptes: ['min', 'bwl', 'bas'],
    contexte: 'E-commerce B2C, ventes au comptoir, prestations à des particuliers. La facture a posteriori peut être demandée par le client pour ses notes de frais.',
    conditions: [
      'La TVA a déjà été déclarée via l\'e-reporting de données de transaction',
      'La facture est émise a posteriori sur demande',
      'Hors périmètre facturation électronique B2B (B2C)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118'],
    mentions_obligatoires:['Date de la transaction initiale', 'Mode de paiement utilisé', 'Mention que la TVA a déjà été collectée'],
    workflow: {
      etats: ['EMISE','RECUE','ARCHIVEE'],
      transitions: [
        { de:'EMISE', vers:'RECUE', acteur:'vendeur', action:'Remise de la facture a posteriori au client', checklist:['Vérifier que la TVA a bien été déclarée dans l\'e-reporting','Émettre la facture à la demande du client'] },
        { de:'RECUE', vers:'ARCHIVEE', acteur:'acheteur', action:'Archivage', checklist:['Archiver pour justification des frais professionnels'] },
      ],
    },
    signaux_detection: {
      description: 'Cas B2C – hors périmètre e-facture standard', indices: [],
    },
  },

  // ── XP-31 : Factures mixtes ───────────────────────────────────────────────
  'XP-31': {
    id: 'XP-31',
    categorie: 'Factures mixtes',
    titre: 'Factures mixtes (opérations taxables et non taxables ou à taux différents)',
    description: 'Une même facture comporte des opérations soumises à des régimes TVA différents (exonéré, taux réduit, taux normal) ou mixtes (B2B + B2C).',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Prestataires ayant des activités mixtes : médicales et commerciales, exportations et ventes domestiques, produits à taux multiples.',
    conditions: [
      'Plusieurs lignes BT-118 avec différents codes catégorie TVA',
      'Ventilation TVA (BG-23) par taux obligatoire',
      'Chaque ligne de facture doit indiquer son taux et code catégorie',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118','BT-119'],
    mentions_obligatoires:['Ventilation par taux de TVA','Code catégorie par ligne','Base imposable par taux','Total TVA par taux'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-118', presence:true, message:'Code catégorie TVA présent (vérifier les multiples taux)' },
        { champ:'BT-119', presence:true, message:'Taux de TVA présent sur les lignes' },
      ],
    },
  },

  // ── XP-32 : Paiements mensuels / facturation périodique ──────────────────
  'XP-32': {
    id: 'XP-32',
    categorie: 'Paiements mensuels',
    titre: 'Paiements mensuels – facturation périodique récurrente',
    description: 'Facturation périodique pour des prestations récurrentes (loyer, abonnement, maintenance, SaaS…) avec émission mensuelle systématique.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Abonnements, contrats de maintenance, loyers, SaaS, services récurrents.',
    conditions: [
      'La facture couvre une période définie (mois, trimestre)',
      'BT-7/BT-8 : période de facturation à renseigner',
      'Le montant est identique à chaque période (ou indexé selon clause contractuelle)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-7','BT-8','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Période couverte (BT-7 début – BT-8 fin)', 'Référence au contrat ou abonnement (BT-12)', 'Montant mensuel ou périodique'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-7', presence:true, message:'Date de début de période de facturation présente' },
        { champ:'BT-8', presence:true, message:'Date de fin de période de facturation présente' },
        { champ:'BT-12', presence:true, message:'Référence contrat/abonnement présente' },
      ],
    },
  },

  // ── XP-33 : Régime TVA sur la marge ──────────────────────────────────────
  'XP-33': {
    id: 'XP-33',
    categorie: 'TVA sur la marge',
    titre: 'Régime de TVA sur la marge bénéficiaire',
    description: 'Régime spécial TVA applicable aux biens d\'occasion, œuvres d\'art, antiquités, objets de collection. TVA calculée sur la marge du revendeur.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Revendeurs de véhicules d\'occasion, antiquaires, galeries d\'art, solderies, brocanteurs.',
    conditions: [
      'Le bien a été acquis sans possibilité de déduction TVA',
      'TVA calculée sur la marge (prix vente - prix achat)',
      'La facture ne doit PAS mentionner la TVA séparément (sinon taxation sur le prix total)',
      'Mention obligatoire du régime applicable',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-22','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Mention du régime de TVA sur la marge : "Régime particulier – biens d\'occasion" (art. 297A CGI)',
      'La TVA NE DOIT PAS être mentionnée séparément',
      'Description précise du bien (marque, modèle, état)',
    ],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'marge|occasion|297.?a|régime particulier|art.*297', message:'Mention régime marge/occasion dans la note' },
        { champ:'BT-118', valeur:'M', message:'Code TVA M = Régime de marge (si supporté)' },
      ],
    },
  },

  // ── XP-34 : Encaissement partiel et annulation ────────────────────────────
  'XP-34': {
    id: 'XP-34',
    categorie: 'Encaissement partiel et annulation',
    titre: 'Encaissement partiel et annulation',
    description: 'Gestion du cas où seulement une partie de la facture est payée, puis annulation totale ou partielle de la créance.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Clients en difficulté, remises exceptionnelles post-facturation, créances irrécouvrables partielles.',
    conditions: [
      'Paiement partiel constaté',
      'L\'avoir doit être émis pour la partie non réglée si annulation',
      'TVA à reverser ou à régulariser selon le cas',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-25','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Référence à la facture initiale (BT-25)','Montant encaissé vs montant total','Motif de l\'annulation partielle'],
    workflow: {
      etats: ['EMISE','RECUE','ACCEPTEE','PAYEE','LITIGE','ARCHIVEE'],
      transitions: [
        { de:'EMISE', vers:'RECUE', acteur:'dsp', action:'Acheminement', checklist:['Réception normale'] },
        { de:'RECUE', vers:'ACCEPTEE', acteur:'acheteur', action:'Acceptation partielle', checklist:['Accepter la facture','Paiement partiel programmé'] },
        { de:'ACCEPTEE', vers:'PAYEE', acteur:'acheteur', action:'Paiement partiel',
          checklist:['Payer le montant possible','Notifier le vendeur du paiement partiel et du motif'] },
        { de:'PAYEE', vers:'LITIGE', acteur:'vendeur', action:'Constat d\'encaissement partiel et gestion du solde',
          checklist:['Constater l\'encaissement partiel','Décider : relance, accord, ou abandon de créance','Émettre un avoir si annulation de la partie restante'] },
        { de:'LITIGE', vers:'ARCHIVEE', acteur:'comptable_v', action:'Clôture et régularisation TVA',
          checklist:['Passer la créance irrécouvrable en perte','Régulariser la TVA sur la partie annulée (CGI art. 272)','Archiver tous les justificatifs'] },
      ],
    },
    signaux_detection: { description: 'Cas de gestion complexe post-émission', indices: [] },
  },

  // ── XP-35 : Notes d'auteur ────────────────────────────────────────────────
  'XP-35': {
    id: 'XP-35',
    categorie: 'Notes d\'auteur',
    titre: 'Notes d\'auteur – droits d\'auteur et propriété intellectuelle',
    description: 'Facturation de droits d\'auteur, royalties, ou notes de droits. Régime fiscal et social spécifique pour les auteurs.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Auteurs, compositeurs, illustrateurs, photographes, auteurs de logiciels, percevant des droits.',
    conditions: [
      'TVA à 10% sur les droits d\'auteur (taux réduit)',
      'Option possible pour le régime général (TVA à 20%) si revenus > seuil',
      'Gestion AGESSA/MDA ou auto-facturation possible par l\'éditeur',
      'Prélèvement à la source sur les droits si géré par une société de gestion (SACEM, ADAGP…)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115','BT-118','BT-119'],
    mentions_obligatoires:['Nature des droits cédés ou concédés', 'Période couverte', 'TVA au taux réduit 10% (si applicable)', 'Référence à l\'œuvre ou au contrat de cession'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-22', pattern:'droits.*auteur|royalties|redevance|cession.*droits|propriété.*intellectuelle', message:'Mention droits d\'auteur/royalties dans la note' },
        { champ:'BT-119', valeur:'10', message:'Taux TVA 10% (droits d\'auteur à taux réduit)' },
      ],
    },
  },

  // ── XP-36 : Secret professionnel ──────────────────────────────────────────
  'XP-36': {
    id: 'XP-36',
    categorie: 'Secret professionnel',
    titre: 'Opérations soumises au secret professionnel',
    description: 'Factures émises dans des secteurs soumis au secret professionnel (avocats, médecins, notaires). Les données de la facture doivent être protégées.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Professions réglementées avec obligation de secret : avocats, médecins, experts-comptables, notaires.',
    conditions: [
      'Le contenu de la facture peut être soumis au secret professionnel',
      'Données minimalistes sur l\'objet de la prestation si nécessaire',
      'La plateforme PDP/PPF doit garantir la confidentialité',
      'Possibilité d\'utiliser des codes génériques pour l\'objet de la facture',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Description générique de la prestation respectant le secret', 'Honoraires HT et TVA', 'Identification du professionnel (Ordre, SIREN)'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-27', pattern:'avocat|barreau|cabinet.*médical|notaire|expert.comptable', message:'Nom vendeur évoque une profession soumise au secret' },
        { champ:'BT-22', pattern:'confidentiel|secret.*professionnel|honoraires', message:'Mention confidentialité/secret dans la note' },
      ],
    },
  },

});

// ─── Workflows de référence officiels exposés comme cas d'usage ──────────────
Object.assign(USE_CASES, {
  'REF-NOMINAL': {
    id: 'REF-NOMINAL',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Cas nominal d\'échange de facture (Figure 2)',
    description: 'Flux d\'échange standard entre PDP-E (vendeur) et PDP-R (acheteur), avec transmission au CdD/PPF. Conforme aux spécifications AFNOR/DGFiP de la réforme e-invoicing.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Ce flux est le cas nominal applicable à toute facture B2B dans le cadre de la réforme française de la facturation électronique (obligatoire à partir de 2026).',
    conditions: [
      'Les deux parties (vendeur et acheteur) sont inscrites sur une PDP ou le PPF',
      'La facture est émise au format FacturX ou Factur-X (PDF+XML CII) ou XML CII',
      'La PDP-E valide techniquement la facture avant transmission',
      'Les statuts (Déposée, Acceptée, Refusée, Paiement Transmis, Encaissée) sont échangés via les PDPs',
      'Le CdD/PPF reçoit le flux 1 (données de facturation) et les statuts clés',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-3','BT-5','BT-27','BT-30','BT-31','BT-44','BT-112','BT-115'],
    mentions_obligatoires:[
      'Format FacturX ou XML CII conforme',
      'Profil BT-24 correctement renseigné',
      'Tous les champs obligatoires du profil déclaré présents',
    ],
    workflow: WORKFLOW_NOMINAL,
    signaux_detection: { description: 'Ce flux est le flux de référence pour toute facture B2B française', indices: [] },
  },

  'REF-REJET': {
    id: 'REF-REJET',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Rejet technique à l\'émission par la PDP-E (Figure 3)',
    description: 'Flux de rejet technique : la PDP-E détecte une non-conformité et rejette la facture avant sa transmission à la PDP-R de l\'acheteur. L\'acheteur ne reçoit rien. Le vendeur doit corriger et réémettre.',
    profil_recommande: 'en',
    profils_acceptes: ['min', 'bwl', 'bas', 'en', 'ext'],
    contexte: 'Ce flux s\'applique quand la facture soumise à la PDP-E ne passe pas les contrôles de validation technique (format invalide, champs obligatoires manquants, schéma XML non conforme).',
    conditions: [
      'La facture est techniquement non conforme (format, schéma, champs obligatoires)',
      'La PDP-E rejette la facture AVANT transmission à la PDP-R',
      'Le CdD/PPF est informé des statuts « Déposée » puis « Rejetée »',
      'L\'acheteur ne reçoit PAS la facture rejetée',
      'Le vendeur doit annuler comptablement et créer une NOUVELLE facture',
    ],
    champs_requis_cle: [],
    mentions_obligatoires:[
      'La facture rejetée ne doit PAS être renvoyée avec le même numéro',
      'Une annulation comptable doit être effectuée (étape 1b)',
      'Une nouvelle facture avec un nouveau numéro doit être créée',
    ],
    workflow: WORKFLOW_REJET_TECHNIQUE,
    signaux_detection: { description: 'Ce flux s\'applique en cas d\'erreur technique détectée par la PDP-E', indices: [] },
  },
});

// ─── Détection automatique du cas d'usage ────────────────────────────────────
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
