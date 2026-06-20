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
  TRANSMISE:          { id: 'TRANSMISE',          label: 'Transmise (via PDP)',           color: '#8b5cf6' },
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

/**
 * WORKFLOW_REFUS (Figure 5 – Refus d'une facture par l'ACHETEUR)
 * L'acheteur refuse la facture (motif métier). Statut « Refusée » transmis via PDP-R → PDP-E → CdD/PPF.
 * Annulation comptable des deux côtés si la facture avait déjà été enregistrée.
 * Le vendeur devra émettre un avoir ou une facture corrective.
 */
const WORKFLOW_REFUS = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','REFUSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture',
      description: 'Le vendeur crée et soumet la facture à sa PDP-E.',
      checklist: ['Vérifier tous les champs obligatoires','Contrôler les montants HT/TVA/TTC'],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 + statut « Déposée » → CdD/PPF',
      description: 'La PDP-E valide et transmet la facture. Le CdD/PPF reçoit le flux 1 et le statut « Déposée ».',
      checklist: ['Validation technique par la PDP-E','Envoi flux 1 au CdD/PPF','Acheminement vers PDP-R acheteur'],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③a Réception de la facture par la PDP-R',
      description: 'La PDP-R reçoit et met la facture à disposition de l\'acheteur.',
      checklist: ['Accusé de réception automatique'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④a Traitement de la facture',
      description: 'L\'acheteur contrôle la facture (conformité, rapprochement commande/livraison).',
      checklist: ['Vérifier la conformité avec la commande','Contrôler les montants et TVA'],
    },
    {
      de: 'EN_CONTROLE', vers: 'REFUSEE', acteur: 'acheteur',
      action: '④b Refus de la facture – statut « Refusée » → PDP-R → PDP-E → CdD/PPF',
      description: 'L\'acheteur refuse la facture pour motif métier. Le statut « Refusée » est transmis via PDP-R à la PDP-E puis au CdD/PPF (étape 4c).',
      checklist: [
        'Documenter le motif du refus',
        'Envoyer le statut « Refusée » via PDP-R',
        'PDP-E reçoit le statut (étape 4c) et notifie le vendeur',
        'CdD/PPF reçoit également le statut « Refusée »',
        '① b (acheteur) : si la facture avait déjà été enregistrée comptablement, procéder à l\'annulation comptable',
      ],
    },
    {
      de: 'REFUSEE', vers: 'ARCHIVEE', acteur: 'vendeur',
      action: '① a Annulation comptable + action corrective',
      description: 'Le vendeur procède à l\'annulation comptable de la facture refusée et émet un avoir ou une facture corrective.',
      checklist: [
        'Annuler la facture en comptabilité (extourne ou avoir)',
        'Identifier le motif du refus transmis par l\'acheteur',
        'Émettre une facture corrective (TypeCode 384) ou un avoir (TypeCode 381)',
        'Archiver la facture refusée avec le motif de refus',
      ],
    },
  ],
};

/**
 * WORKFLOW_LITIGE_AVOIR (Figure 6 – Facture en litige suivie d'un AVOIR partiel ou total)
 * L'acheteur met la facture F1 « en litige ». Le vendeur émet un avoir F2.
 * Après acceptation de F2, paiement du solde (F1 - F2) et encaissement.
 * Les deux documents (F1 et F2) passent au statut « Encaissée ».
 */
const WORKFLOW_LITIGE_AVOIR = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','LITIGE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture F1',
      checklist: ['Émettre la facture F1 normalement'],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 (F1) + statut → CdD/PPF',
      checklist: ['Transmission PDP-E → PDP-R','Flux 1 et statut « Déposée » au CdD/PPF'],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception de F1',
      checklist: ['Accusé de réception PDP-R'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④ Traitement de F1',
      checklist: ['Contrôle F1 : conformité, montants, TVA'],
    },
    {
      de: 'EN_CONTROLE', vers: 'LITIGE', acteur: 'acheteur',
      action: 'Mise en litige – statut « En litige » transmis au vendeur',
      description: 'L\'acheteur émet un statut « En litige » sur F1 avec le motif. Ce statut remonte via PDP-R → PDP-E.',
      checklist: [
        'Documenter le motif du litige',
        'Envoyer le statut « En litige » via PDP-R',
        'PDP-E reçoit le statut et notifie le vendeur',
      ],
    },
    {
      de: 'LITIGE', vers: 'EMISE', acteur: 'vendeur',
      action: 'Création et émission de l\'avoir F2 (partiel ou total)',
      description: 'Le vendeur crée un avoir F2 pour résoudre le litige. F2 référence F1 via BT-25.',
      checklist: [
        'Créer l\'avoir F2 avec TypeCode 381',
        'Référencer F1 dans BT-25 (numéro F1) et BT-26 (date F1)',
        'Montant de l\'avoir = montant du litige (partiel ou total)',
        'Transmettre F2 via PDP-E (flux 2 → CdD/PPF)',
      ],
    },
    {
      de: 'LITIGE', vers: 'ACCEPTEE', acteur: 'acheteur',
      action: 'Réception et approbation de l\'avoir F2 – statut « Approuvée » sur F1 et F2',
      description: 'L\'acheteur valide l\'avoir F2. Les deux documents passent au statut « Approuvée ».',
      checklist: [
        'Vérifier que F2 couvre bien le litige',
        'Envoyer statut « Approuvée » sur F2 ET sur F1 via PDP-R',
        'Comptabiliser l\'avoir F2',
        'Calculer le solde restant dû (F1 – F2) si avoir partiel',
      ],
    },
    {
      de: 'ACCEPTEE', vers: 'PAIEMENT_TRANSMIS', acteur: 'acheteur',
      action: 'Le cas échéant, paiement du solde (F1 – F2)',
      description: 'Si l\'avoir est partiel, l\'acheteur paie le solde restant dû. Statut « Paiement Transmis » émis.',
      checklist: [
        'Calculer le solde : montant F1 – montant F2',
        'Effectuer le virement du solde au vendeur',
        'Envoyer statut « Paiement Transmis » via PDP-R sur F1 et F2',
      ],
    },
    {
      de: 'PAIEMENT_TRANSMIS', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: 'Encaissement + statut « Encaissée » sur F1 et F2',
      description: 'Le vendeur encaisse le solde et émet le statut « Encaissée » sur F1 et F2 via PDP-E → PDP-R → CdD/PPF.',
      checklist: [
        'Vérifier le crédit bancaire',
        'Rapprocher le paiement avec F1 et F2',
        'Émettre statut « Encaissée » sur F1 via PDP-E',
        'Émettre statut « Encaissée » sur F2 via PDP-E',
        'CdD/PPF reçoit le statut « Encaissée »',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_v',
      action: 'Archivage de F1 et F2',
      checklist: ['Archiver F1 et F2 ensemble avec les statuts de litige','Conservation 10 ans'],
    },
  ],
};

/**
 * WORKFLOW_LITIGE_RECTIFICATIF (Figure 7 – Facture en litige suivie d'une Facture Rectificative)
 * Similaire à Figure 6 mais F2 est une facture rectificative (TypeCode 384) qui annule et remplace F1.
 * F2 peut être payée seule si F1 est annulée, ou un solde peut être calculé.
 */
const WORKFLOW_LITIGE_RECTIFICATIF = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','LITIGE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture F1',
      checklist: ['Émettre la facture F1 normalement'],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 (F1) + statut → CdD/PPF',
      checklist: ['Transmission PDP-E → PDP-R','Flux 1 et statut « Déposée » au CdD/PPF'],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception de F1', checklist: ['Réception PDP-R'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④ Traitement de F1', checklist: ['Contrôle F1'],
    },
    {
      de: 'EN_CONTROLE', vers: 'LITIGE', acteur: 'acheteur',
      action: 'Mise en litige – statut « En litige »',
      description: 'L\'acheteur met F1 en litige avec motif. Le statut remonte au vendeur via PDP-R → PDP-E.',
      checklist: ['Documenter le motif','Envoyer statut « En litige » via PDP-R'],
    },
    {
      de: 'LITIGE', vers: 'EMISE', acteur: 'vendeur',
      action: 'Création et émission de la facture rectificative F2',
      description: 'Le vendeur crée une facture rectificative F2 (TypeCode 384) qui annule et remplace F1.',
      checklist: [
        'Créer F2 avec TypeCode 384 (facture corrective)',
        'Référencer F1 dans BT-25 et BT-26',
        'F2 doit corriger les éléments litigieux de F1',
        'Transmettre F2 via PDP-E (flux F2 → CdD/PPF)',
      ],
    },
    {
      de: 'LITIGE', vers: 'ACCEPTEE', acteur: 'acheteur',
      action: 'Réception et approbation de F2 – statut « Approuvée » sur F1 et F2',
      description: 'L\'acheteur valide F2. Les deux documents F1 et F2 passent au statut « Approuvée ».',
      checklist: [
        'Vérifier que F2 corrige correctement les éléments litigieux',
        'Envoyer statut « Approuvée » sur F2 et F1 via PDP-R',
        'F1 est annulée comptablement et remplacée par F2',
        'Comptabiliser F2',
      ],
    },
    {
      de: 'ACCEPTEE', vers: 'PAIEMENT_TRANSMIS', acteur: 'acheteur',
      action: 'Paiement de F2 + statut « Paiement Transmis »',
      description: 'L\'acheteur paie le montant de F2 (la facture rectificative). Statut « Paiement Transmis » émis sur F2.',
      checklist: [
        'Payer le montant de F2',
        'Envoyer statut « Paiement Transmis » sur F2 via PDP-R',
        'Si un solde avait déjà été payé sur F1, prendre en compte dans le calcul',
      ],
    },
    {
      de: 'PAIEMENT_TRANSMIS', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: 'Encaissement + statut « Encaissée » sur F1 et F2',
      description: 'Le vendeur encaisse le paiement de F2 et émet le statut « Encaissée » sur F1 et F2.',
      checklist: [
        'Vérifier le crédit bancaire',
        'Émettre statut « Encaissée » sur F1 et F2 via PDP-E',
        'CdD/PPF notifié du statut « Encaissée »',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_v',
      action: 'Archivage de F1 et F2',
      checklist: ['Archiver F1 (annulée) et F2 (rectificative) avec les statuts de litige','Conservation 10 ans'],
    },
  ],
};

/**
 * WORKFLOW_DEJA_PAYEE (Figure 8 – Facture déjà payée par l'ACHETEUR ou un tiers PAYEUR)
 * Le paiement est effectué AVANT l'émission de la facture (achat comptant, paiement à la commande).
 * La facture est créée a posteriori. Elle passe directement au statut « Encaissée » sans
 * les étapes EN_CONTROLE / ACCEPTEE / PAIEMENT_TRANSMIS.
 */
const WORKFLOW_DEJA_PAYEE = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture déjà payée',
      description: 'Le paiement a déjà été reçu (étape 5 du diagramme). Le vendeur a encaissé (6a) AVANT de créer la facture.',
      checklist: [
        'Vérifier que le paiement a bien été encaissé (6a)',
        'Indiquer BT-20 = "Acquitté" ou "Payé"',
        'Renseigner BT-81 (moyen de paiement utilisé)',
        'Solde à payer = 0 (déjà réglé)',
        'Date de paiement ≤ date d\'émission',
      ],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 + statut « Déposée » et « Encaissée » → CdD/PPF',
      description: 'La PDP-E transmet le flux 1. Dès la transmission, le statut « Encaissée » peut être émis simultanément (paiement déjà constaté).',
      checklist: [
        'Transmission PDP-E → PDP-R',
        'Flux 1 et statut « Déposée » au CdD/PPF',
        'Le statut « Encaissée » est mis à jour immédiatement (6b)',
      ],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception de la facture par l\'acheteur',
      description: 'L\'acheteur reçoit la facture à titre informatif (déjà payée).',
      checklist: ['Réception PDP-R automatique'],
    },
    {
      de: 'RECUE', vers: 'ENCAISSEE', acteur: 'pdp_e',
      action: '⑥b/⑥c Mise à jour statut « Encaissée » → PDP-R et CdD/PPF (étape 7)',
      description: 'Le statut « Encaissée » est émis par la PDP-E du vendeur, transmis à la PDP-R (6c) et au CdD/PPF (étape 7). Pas de statuts EN_CONTROLE / ACCEPTEE / PAIEMENT_TRANSMIS.',
      checklist: [
        'Émettre statut « Encaissée » via PDP-E (6b)',
        'PDP-R reçoit le statut « Encaissée » (6c)',
        'CdD/PPF reçoit le statut « Encaissée » (7)',
        'L\'acheteur comptabilise la charge sans procédure de paiement',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_a',
      action: 'Archivage direct',
      checklist: ['Archiver la facture déjà payée','Pas de flux de paiement à archiver'],
    },
  ],
};

/**
 * WORKFLOW_TIERS_PAYEUR (Figure 9 – Facture à payer par un tiers désigné à la facturation)
 * Trois acteurs : PDP-E (Vendeur), PDP-R (Acheteur), OD/PDP (Tiers Payeur).
 * L'acheteur valide la facture mais informe le tiers payeur qui effectue le règlement.
 * Le vendeur reçoit le paiement du tiers et émet le statut « Encaissée ».
 */
const WORKFLOW_TIERS_PAYEUR = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture F1 avec identification du tiers payeur',
      description: 'La facture identifie le tiers payeur (OD ou PDP) dans BG-10 avec l\'IBAN de paiement.',
      checklist: [
        'Identifier le tiers payeur dans BG-10 (BT-59 nom, BT-60 identifiant)',
        'BT-84 = IBAN du tiers payeur (pas du vendeur)',
        'Vérifier le mandat ou accord tripartite avec le tiers',
      ],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 (F1) + statut → CdD/PPF + information tiers payeur',
      description: 'La PDP-E transmet la facture et informe le tiers payeur (OD/PDP) de l\'existence de la facture.',
      checklist: [
        'Transmission PDP-E → PDP-R (acheteur)',
        'Flux 1 et statut « Déposée » au CdD/PPF',
        'Notification au tiers payeur de la facture émise',
      ],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception de la facture par l\'acheteur',
      checklist: ['Accusé de réception PDP-R'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④ Traitement de la facture par l\'acheteur',
      checklist: ['Contrôle conformité','Rapprochement commande'],
    },
    {
      de: 'EN_CONTROLE', vers: 'ACCEPTEE', acteur: 'acheteur',
      action: 'Information du bon traitement → tiers payeur',
      description: 'L\'acheteur valide la facture et informe le tiers payeur (OD/PDP) que la facture est acceptée et doit être payée.',
      checklist: [
        'Valider la facture',
        'Envoyer statut « Acceptée » via PDP-R',
        'Notifier le tiers payeur (OD/PDP) de l\'instruction de paiement',
        'Fournir les références de paiement au tiers payeur',
      ],
    },
    {
      de: 'ACCEPTEE', vers: 'PAIEMENT_TRANSMIS', acteur: 'tiers',
      action: 'Paiement de la facture par le tiers payeur (OD/PDP) + statut « Paiement Transmis »',
      description: 'Le tiers payeur (OD ou PDP) effectue le virement et émet le statut « Paiement Transmis » qui remonte via PDP-R → PDP-E.',
      checklist: [
        'Le tiers payeur (OD/PDP) vire le montant au IBAN du vendeur',
        'Statut « Paiement Transmis » émis par le tiers via sa plateforme',
        'Statut transmis au vendeur via PDP-R → PDP-E',
      ],
    },
    {
      de: 'PAIEMENT_TRANSMIS', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: 'Encaissement + information tiers payeur + statut « Encaissée »',
      description: 'Le vendeur encaisse le paiement du tiers et informe le tiers de l\'encaissement. Statut « Encaissée » transmis à PDP-R et CdD/PPF.',
      checklist: [
        'Vérifier le crédit bancaire reçu du tiers payeur',
        'Informer le tiers payeur de l\'encaissement de la facture',
        'Émettre statut « Encaissée » via PDP-E (6b)',
        'CdD/PPF reçoit le statut « Encaissée »',
        'PDP-R (acheteur) reçoit le statut « Encaissée »',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_v',
      action: 'Archivage avec accord tripartite',
      checklist: ['Archiver la facture','Archiver l\'accord avec le tiers payeur','Conservation 10 ans'],
    },
  ],
};

/**
 * WORKFLOW_PARTIEL_TIERS (Figure 10 – Prise en charge partielle acheteur + tiers connu)
 * La facture est adressée à l'acheteur, mais un tiers (OD/PDP) prend en charge une partie.
 * Deux flux de paiement distincts → deux encaissements → e-reporting du montant tiers → statut « Encaissée ».
 * Correspond à XP-4.
 */
const WORKFLOW_PARTIEL_TIERS = {
  etats: ['BROUILLON','EMISE','DEPOSEE','RECUE','EN_CONTROLE','ACCEPTEE','PAIEMENT_TRANSMIS','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'BROUILLON', vers: 'EMISE', acteur: 'vendeur',
      action: '① Création de la facture avec identification du tiers et de sa quote-part',
      description: 'La facture est adressée à l\'acheteur. Le tiers payeur (OD/PDP) est identifié dans BG-10 avec sa quote-part.',
      checklist: [
        'Identifier le tiers dans BG-10 (BT-59, BT-60)',
        'Indiquer la quote-part du tiers et celle de l\'acheteur',
        'IBAN du vendeur en BT-84 (les deux parties paient au vendeur)',
        'Référencer la convention de prise en charge (contrat, convention…)',
      ],
    },
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'pdp_e',
      action: '② Transmission flux 1 de la facture + statut → CdD/PPF + information du tiers payeur',
      description: 'La PDP-E transmet la facture et informe le tiers payeur (OD/PDP) de la facture émise.',
      checklist: [
        'Transmission PDP-E → PDP-R (acheteur)',
        'Flux 1 et statut « Déposée » au CdD/PPF',
        'Notification au tiers payeur (OD/PDP) de la facture et de sa quote-part',
      ],
    },
    {
      de: 'DEPOSEE', vers: 'RECUE', acteur: 'pdp_r',
      action: '③ Réception de la facture par l\'acheteur (PDP-R)',
      checklist: ['Réception automatique PDP-R'],
    },
    {
      de: 'RECUE', vers: 'EN_CONTROLE', acteur: 'acheteur',
      action: '④ Traitement de la facture – mise à jour des statuts',
      description: 'L\'acheteur contrôle la facture et coordonne avec le tiers la répartition des montants.',
      checklist: [
        'Vérifier la répartition acheteur / tiers',
        'Contrôler le montant total et les quotes-parts',
        'Coordonner avec le tiers (OD/PDP) pour validation de sa quote-part',
      ],
    },
    {
      de: 'EN_CONTROLE', vers: 'ACCEPTEE', acteur: 'acheteur',
      action: 'Acceptation et instruction de double paiement',
      description: 'L\'acheteur accepte la facture et instrumente les deux flux de paiement (sa quote-part + celle du tiers).',
      checklist: [
        'Valider la facture',
        'Programmer son propre paiement (quote-part acheteur)',
        'Notifier le tiers (OD/PDP) de son instruction de paiement (quote-part tiers)',
      ],
    },
    {
      de: 'ACCEPTEE', vers: 'PAIEMENT_TRANSMIS', acteur: 'acheteur',
      action: 'Double paiement : acheteur + tiers (OD/PDP) → statut « Paiement Transmis »',
      description: 'L\'acheteur paie sa quote-part et le tiers (OD/PDP) paie la sienne. Les deux statuts « Paiement Transmis » sont transmis au vendeur.',
      checklist: [
        'L\'acheteur vire sa quote-part au IBAN du vendeur',
        'Le tiers (OD/PDP) vire sa quote-part au IBAN du vendeur',
        'Statut « Paiement Transmis » de l\'acheteur via PDP-R',
        'Statut « Paiement Transmis » du tiers (OD/PDP) via son canal',
      ],
    },
    {
      de: 'PAIEMENT_TRANSMIS', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: 'Double encaissement + e-reporting du montant tiers + statut « Encaissée »',
      description: 'Le vendeur encaisse les deux paiements. Le montant payé par le tiers (OD/PDP) est soumis à e-reporting. Statut « Encaissée » transmis à PDP-R et CdD/PPF.',
      checklist: [
        'Encaisser la quote-part de l\'acheteur (6a acheteur)',
        'Encaisser la quote-part du tiers (OD/PDP)',
        'E-reporting du montant payé par le tiers (si B2C ou tiers non assujetti)',
        'Émettre statut « Encaissée » via PDP-E → PDP-R et CdD/PPF',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_v',
      action: 'Archivage avec convention de prise en charge et e-reporting',
      checklist: [
        'Archiver la facture',
        'Archiver la convention de prise en charge (tiers)',
        'Archiver les deux preuves de paiement',
        'Conserver les données d\'e-reporting transmises au PPF',
      ],
    },
  ],
};

/**
 * WORKFLOW_FRAIS_COLLAB_B2C (Figure 12 – Frais payés par un collaborateur, facture au nom du collaborateur)
 * ATTENTION : Ce flux est B2C (facture au nom du collaborateur, un particulier).
 * → Il relève de l'E-REPORTING (flux 10.3, 10.4 vers PPF), PAS de l'e-facturation B2B.
 * Le paiement (5) précède la création de la facture (1).
 * L'entreprise (OD/PDP côté acheteur) reçoit les données pour remboursement des frais.
 * Trois acteurs : PDP-E (Vendeur), Tiers (Collaborateur/individu), OD/PDP (Entreprise employeur).
 */
const WORKFLOW_FRAIS_COLLAB_B2C = {
  etats: ['EMISE','DEPOSEE','ENCAISSEE','ARCHIVEE'],
  transitions: [
    {
      de: 'EMISE', vers: 'DEPOSEE', acteur: 'vendeur',
      action: '① + ② Création de la facture + ajout e-reporting (flux 10.3 / 10.4 → PPF)',
      description: 'IMPORTANT : Cette opération est B2C (facture au nom du collaborateur individu). Elle relève de l\'e-reporting, pas de l\'e-facture B2B. Le paiement a déjà été effectué par le collaborateur (étape 5). Le vendeur a encaissé (6a) AVANT de créer la facture.\n\nLe vendeur ajoute la vente dans son flux d\'e-reporting quotidien (flux 10.3 / 10.4) transmis au PPF.',
      checklist: [
        'VÉRIFIER : La facture est au nom du collaborateur (individu), pas de l\'entreprise',
        'Si facture au nom de l\'entreprise → utiliser le flux e-facture B2B (XP-5)',
        'Le paiement (5) et l\'encaissement (6a) sont ANTÉRIEURS à la création de la facture',
        'Ajouter la vente dans le flux d\'e-reporting quotidien (flux 10.3 / 10.4) vers le PPF',
        'Le PPF reçoit le cumul quotidien des ventes B2C',
      ],
    },
    {
      de: 'DEPOSEE', vers: 'ENCAISSEE', acteur: 'vendeur',
      action: '③a/③b Transmission de la facture au collaborateur ET à l\'entreprise + données d\'encaissement → PPF (étape 7)',
      description: 'La facture est transmise au collaborateur (3a) et à l\'entreprise (OD/PDP) (3b). Les données de paiement (cumul quotidien des encaissements) sont transmises au PPF (étape 7).',
      checklist: [
        'Remettre la facture au collaborateur (3a)',
        'Transmettre une copie à l\'entreprise (OD/PDP) pour remboursement (3b)',
        'Le PPF (étape 7) reçoit le cumul quotidien des encaissements',
        'L\'OD/PDP de l\'entreprise reçoit les données pour intégration en note de frais',
      ],
    },
    {
      de: 'ENCAISSEE', vers: 'ARCHIVEE', acteur: 'comptable_a',
      action: 'Remboursement du collaborateur par l\'entreprise + archivage',
      description: 'L\'entreprise rembourse le collaborateur via sa procédure de notes de frais. La facture est archivée côté vendeur et côté entreprise.',
      checklist: [
        'L\'entreprise rembourse le collaborateur (note de frais)',
        'Vérifier la déductibilité TVA (facture au nom du collaborateur ≠ au nom de l\'entreprise)',
        'Archiver la facture au niveau du collaborateur',
        'L\'entreprise archive dans sa note de frais',
        'Conservation 10 ans',
      ],
    },
  ],
};

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
    workflow: WORKFLOW_DEJA_PAYEE,
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
    workflow: WORKFLOW_TIERS_PAYEUR,
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
    workflow: WORKFLOW_PARTIEL_TIERS,
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
      'BT-73/BT-74 : période de facturation à renseigner',
      'Le montant est identique à chaque période (ou indexé selon clause contractuelle)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-73','BT-74','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires:['Période couverte (BT-73 début – BT-74 fin)', 'Référence au contrat ou abonnement (BT-12)', 'Montant mensuel ou périodique'],
    workflow: _workflowStandard('acheteur'),
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ:'BT-73', presence:true, message:'Date de début de période de facturation présente' },
        { champ:'BT-74', presence:true, message:'Date de fin de période de facturation présente' },
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

  'REF-REFUS': {
    id: 'REF-REFUS',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Refus de facture par l\'acheteur (Figure 5)',
    description: 'L\'acheteur refuse la facture pour motif métier. Statut « Refusée » transmis via PDP-R → PDP-E → CdD/PPF. Annulation comptable des deux côtés. Le vendeur doit émettre un avoir ou une facture corrective.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Tout cas où l\'acheteur refuse une facture pour non-conformité métier (erreur de prix, de quantité, de référence, prestation non conforme…).',
    conditions: [
      'La facture a bien été transmise et reçue par la PDP-R',
      'Le refus est un refus métier (pas un rejet technique PDP-E)',
      'Le statut « Refusée » est transmis via PDP-R → PDP-E et au CdD/PPF',
      'Si la facture avait déjà été comptabilisée : annulation comptable obligatoire des deux côtés',
    ],
    champs_requis_cle: [],
    mentions_obligatoires: ['Motif du refus documenté','Statut « Refusée » transmis à toutes les parties','Avoir ou facture corrective à émettre'],
    workflow: WORKFLOW_REFUS,
    signaux_detection: { description: 'Cas activé lors d\'un refus métier acheteur', indices: [] },
  },

  'REF-LITIGE-AVOIR': {
    id: 'REF-LITIGE-AVOIR',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Facture en litige + avoir partiel ou total (Figure 6)',
    description: 'L\'acheteur met la facture F1 « en litige ». Le vendeur émet un avoir F2 pour résoudre le litige. Après acceptation de F2, paiement du solde (F1 – F2) et statut « Encaissée » sur F1 et F2.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Litige commercial résolu par émission d\'un avoir partiel (ex : erreur sur une ligne) ou total (annulation complète de F1).',
    conditions: [
      'L\'acheteur émet un statut « En litige » sur F1 avec motif',
      'Le vendeur émet un avoir F2 (TypeCode 381) référençant F1',
      'L\'acheteur valide F2 et émet « Approuvée » sur F1 et F2',
      'Si avoir partiel : paiement du solde F1 – F2',
      'Statut « Encaissée » émis sur F1 ET F2',
    ],
    champs_requis_cle: ['BT-3','BT-25','BT-26'],
    mentions_obligatoires: ['Avoir F2 avec TypeCode 381','BT-25 = numéro de F1','BT-26 = date de F1'],
    workflow: WORKFLOW_LITIGE_AVOIR,
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ: 'BT-3', valeur: '381', message: 'TypeCode 381 = Avoir (note de crédit)' },
        { champ: 'BT-25', presence: true, message: 'Référence à la facture initiale en litige (BT-25)' },
      ],
    },
  },

  'REF-LITIGE-RECTIF': {
    id: 'REF-LITIGE-RECTIF',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Facture en litige + facture rectificative (Figure 7)',
    description: 'L\'acheteur met F1 en litige. Le vendeur émet une facture rectificative F2 (TypeCode 384) qui annule et remplace F1. Paiement de F2 et statut « Encaissée » sur F1 et F2.',
    profil_recommande: 'en',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Litige résolu par remplacement complet de la facture initiale (erreur substantielle nécessitant une refacturation totale).',
    conditions: [
      'L\'acheteur émet un statut « En litige » sur F1 avec motif',
      'Le vendeur émet une facture rectificative F2 (TypeCode 384) référençant F1',
      'F2 annule et remplace F1',
      'L\'acheteur valide F2 et émet « Approuvée » sur F1 et F2',
      'Paiement de F2 et statut « Encaissée » sur F1 ET F2',
    ],
    champs_requis_cle: ['BT-3','BT-25','BT-26'],
    mentions_obligatoires: ['Facture rectificative F2 avec TypeCode 384','BT-25 = numéro de F1','BT-26 = date de F1'],
    workflow: WORKFLOW_LITIGE_RECTIFICATIF,
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ: 'BT-3', valeur: '384', message: 'TypeCode 384 = Facture rectificative / corrective' },
        { champ: 'BT-25', presence: true, message: 'Référence à la facture initiale (BT-25)' },
      ],
    },
  },

  'REF-DEJA-PAYEE': {
    id: 'REF-DEJA-PAYEE',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Facture déjà payée par l\'acheteur ou un tiers (Figure 8)',
    description: 'Le paiement est effectué AVANT l\'émission de la facture. La facture est créée a posteriori. Elle passe directement au statut « Encaissée » sans les étapes EN_CONTROLE / ACCEPTEE / PAIEMENT_TRANSMIS. Correspond au cas d\'usage XP-2.',
    profil_recommande: 'bas',
    profils_acceptes: ['bas', 'en', 'ext'],
    contexte: 'Achats comptants, paiements à la commande, achats en ligne pré-payés. L\'encaissement (6a) précède la création de la facture (1).',
    conditions: [
      'Le paiement a été encaissé AVANT l\'émission de la facture',
      'La facture mentionne "Acquitté" et le moyen de paiement (BT-81)',
      'Pas d\'étapes EN_CONTROLE / ACCEPTEE / PAIEMENT_TRANSMIS',
      'Statut « Encaissée » émis dès la transmission (6b) → PDP-R (6c) → CdD/PPF (7)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-20','BT-27','BT-44','BT-81','BT-112','BT-115'],
    mentions_obligatoires: ['BT-20 = "Acquitté"','BT-81 = moyen de paiement utilisé','Solde à payer = 0'],
    workflow: WORKFLOW_DEJA_PAYEE,
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ: 'BT-20', pattern: 'acquitté|payé|réglé|comptant', message: 'Mention "acquitté/payé" dans les conditions de paiement' },
        { champ: 'BT-81', presence: true, message: 'Moyen de paiement renseigné (paiement déjà effectué)' },
      ],
    },
  },

  'REF-TIERS-PAYEUR': {
    id: 'REF-TIERS-PAYEUR',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Facture à payer par un tiers désigné – OD ou PDP (Figure 9)',
    description: 'Trois acteurs : Vendeur (PDP-E), Acheteur (PDP-R), Tiers Payeur (OD ou PDP). L\'acheteur valide la facture et instruit le tiers payeur. Le tiers effectue le règlement. Correspond aux cas XP-3, XP-7, XP-8, XP-9.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Affacturage, centralisation de trésorerie de groupe, carte d\'achat logée, paiement via OD (Opérateur de Dématérialisation) ou PDP tiers.',
    conditions: [
      'Le tiers payeur est identifié dans la facture (BG-10)',
      'L\'IBAN de paiement (BT-84) est celui du vendeur (le tiers paie au vendeur)',
      'L\'acheteur informe le tiers payeur après acceptation',
      'Le tiers émet le statut « Paiement Transmis »',
      'Le vendeur encaisse et informe le tiers de l\'encaissement',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires: ['Tiers payeur identifié (BG-10)','Mandat ou accord tripartite','IBAN du vendeur en BT-84'],
    workflow: WORKFLOW_TIERS_PAYEUR,
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ: 'BT-59', presence: true, message: 'Tiers payeur identifié dans BG-10 (BT-59)' },
        { champ: 'BT-60', presence: true, message: 'Identifiant du tiers payeur présent (BT-60)' },
      ],
    },
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

  'REF-PARTIEL-TIERS': {
    id: 'REF-PARTIEL-TIERS',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Prise en charge partielle acheteur + tiers connu (Figure 10)',
    description: 'La facture est adressée à l\'acheteur, mais un tiers (OD/PDP) prend en charge une quote-part. Deux flux de paiement distincts → deux encaissements → e-reporting du montant tiers → statut « Encaissée ». Correspond à XP-4.',
    profil_recommande: 'en',
    profils_acceptes: ['en', 'ext'],
    contexte: 'Prise en charge partielle par un OPCO (formation), une mutuelle, une assurance, une centrale de paiement de groupe. Le tiers est connu et identifié dès l\'émission de la facture.',
    conditions: [
      'Le tiers payeur (OD/PDP) est identifié dans BG-10',
      'Deux quotes-parts distinctes : acheteur et tiers',
      'Deux flux de paiement séparés au vendeur',
      'E-reporting du montant payé par le tiers si applicable',
      'Statut « Encaissée » émis après les deux encaissements',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-59','BT-60','BT-84','BT-112','BT-115'],
    mentions_obligatoires: [
      'Tiers payeur identifié (BG-10 : BT-59, BT-60)',
      'Quote-part de chaque partie clairement indiquée',
      'Convention de prise en charge référencée',
    ],
    workflow: WORKFLOW_PARTIEL_TIERS,
    signaux_detection: {
      description: 'Cas probable si :',
      indices: [
        { champ: 'BT-59', presence: true, message: 'Tiers payeur identifié (BG-10)' },
        { champ: 'BT-22', pattern: 'prise en charge|subvention|opco|mutuelle|assurance|partiel', message: 'Mention prise en charge partielle dans la note' },
      ],
    },
  },

  'REF-FRAIS-COLLAB-B2C': {
    id: 'REF-FRAIS-COLLAB-B2C',
    categorie: 'Référence officielle AFNOR/DGFiP',
    titre: 'Frais collaborateur – facture au nom du collaborateur (Figure 12) – E-REPORTING B2C',
    description: '⚠ FLUX B2C — PAS d\'e-facture B2B. La facture est au nom du collaborateur (individu). Le vendeur est soumis à l\'e-reporting (flux 10.3 / 10.4 → PPF). L\'entreprise reçoit les données pour rembourser le collaborateur. Paiement (5) et encaissement (6a) antérieurs à la création de la facture.',
    profil_recommande: 'min',
    profils_acceptes: ['min', 'bwl'],
    contexte: 'Frais professionnels payés par un collaborateur avec une facture au nom du collaborateur (individu) et non de l\'entreprise. Contrairement à XP-5, la facture n\'est PAS au nom de l\'entreprise.',
    conditions: [
      '⚠ La facture est au NOM DU COLLABORATEUR (individu), pas de l\'entreprise',
      'C\'est une transaction B2C → e-reporting obligatoire, PAS d\'e-facture B2B',
      'Le paiement (5) précède la création de la facture (1)',
      'Flux 10.3 / 10.4 transmis au PPF (cumul quotidien des ventes et encaissements)',
      'L\'entreprise (OD/PDP) reçoit les données en copie pour la note de frais',
      'La TVA peut ne pas être déductible pour l\'entreprise (facture pas à son nom)',
    ],
    champs_requis_cle: ['BT-1','BT-2','BT-5','BT-27','BT-44','BT-112','BT-115'],
    mentions_obligatoires: [
      'Nom et adresse du collaborateur (individu) comme acheteur',
      'PAS de numéro TVA acheteur (individu)',
      'E-reporting flux 10.3 / 10.4 au PPF obligatoire',
    ],
    workflow: WORKFLOW_FRAIS_COLLAB_B2C,
    signaux_detection: {
      description: 'Cas B2C — flux e-reporting, pas e-facture',
      indices: [
        { champ: 'BT-48', presence: false, message: 'Pas de numéro TVA acheteur (individu probable)' },
        { champ: 'BT-47', presence: false, message: 'Pas d\'identifiant légal acheteur (individu)' },
      ],
    },
  },
});

// ─── BTs distinctifs par cas d'usage (vs facture B2B standard) ──────────────
// Champs NON présents dans une facture B2B ordinaire (BT-1,2,3,5,24,27,30,31,40,44,47,109,110,112,115,116,117,118)
const CHAMPS_DISTINCTIFS = {
  'XP-1': [
    { bt:'BT-13', note:'Référence bon de commande – une par commande groupée (peut être multiple)' },
    { bt:'BT-16', note:'Référence bon de livraison / avis d\'expédition par lot' },
    { bt:'BT-15', note:'Référence avis de réception (si applicable)' },
    { bt:'BT-72', note:'Date de livraison effective par ligne ou groupe' },
    { bt:'BT-73', note:'Début de la période de facturation groupée (BG-14)' },
    { bt:'BT-74', note:'Fin de la période de facturation groupée (BG-14)' },
  ],
  'XP-2': [
    { bt:'BT-81', note:'Moyen de paiement utilisé (paiement déjà encaissé)' },
    { bt:'BT-20', note:'Conditions de paiement : mention "Acquitté" ou "Payé" obligatoire' },
    { bt:'BT-113', note:'Montant déjà payé = montant TTC (solde = 0)' },
    { bt:'BT-115', note:'= 0 : aucun solde restant dû (déjà réglé)' },
  ],
  'XP-3': [
    { bt:'BT-59', note:'Nom du tiers payeur (bénéficiaire – différent du vendeur)' },
    { bt:'BT-60', note:'Identifiant du tiers payeur' },
    { bt:'BT-61', note:'Identifiant légal du tiers (SIREN/SIRET)' },
    { bt:'BT-84', note:'IBAN du tiers payeur – l\'acheteur paie ce tiers, pas le vendeur' },
  ],
  'XP-4': [
    { bt:'BT-59', note:'Nom du tiers prenant en charge une partie (OPCO, mutuelle…)' },
    { bt:'BT-60', note:'Identifiant du tiers (prise en charge partielle)' },
    { bt:'BT-92', note:'Montant de la quote-part tiers (BG-20 remise) ou BT-99 (BG-21 frais)' },
    { bt:'BT-22', note:'Note indiquant la répartition acheteur / tiers' },
  ],
  'XP-5': [
    { bt:'BT-122', note:'Référence justificatif joint (frais avancés par le collaborateur)' },
    { bt:'BT-123', note:'Description du document justificatif' },
  ],
  'XP-6': [],
  'XP-7': [
    { bt:'BT-81', note:'= 48 : carte bancaire (carte d\'achat / carte logée)' },
    { bt:'BT-87', note:'4 derniers chiffres de la carte (traçabilité transaction)' },
    { bt:'BT-88', note:'Titulaire de la carte (nom du détenteur)' },
  ],
  'XP-8': [
    { bt:'BT-59', note:'Nom du factor (cessionnaire de la créance)' },
    { bt:'BT-60', note:'Identifiant du factor' },
    { bt:'BT-84', note:'IBAN du factor – l\'acheteur règle le factor, pas le vendeur' },
    { bt:'BT-22', note:'Mention obligatoire "Créance cédée à [factor]" – notification de cession' },
  ],
  'XP-9': [
    { bt:'BT-59', note:'Nom du distributeur/dépositaire (tiers bénéficiaire)' },
    { bt:'BT-60', note:'Identifiant du distributeur' },
    { bt:'BT-13', note:'Référence commande émise par le distributeur' },
    { bt:'BT-84', note:'IBAN du distributeur pour paiement' },
  ],
  'XP-10': [
    { bt:'BT-84', note:'IBAN potentiellement redirigé (subrogation / cession confidentielle)' },
    { bt:'BT-22', note:'Accord de subrogation ou cession si notification requise' },
  ],
  'XP-11': [
    { bt:'BT-49', note:'Adresse électronique acheteur (routage vers le tiers traitant mandaté)' },
  ],
  'XP-12': [],
  'XP-13': [
    { bt:'BT-12', note:'Référence du marché principal (obligatoire en sous-traitance)' },
    { bt:'BT-118', note:'AE = Autoliquidation (sous-traitance BTP, CGI art. 283-2)' },
    { bt:'BT-120', note:'Motif d\'exonération : "Autoliquidation TVA – sous-traitance BTP"' },
    { bt:'BT-121', note:'Code motif exo : VATEX-EU-AE' },
    { bt:'BT-59', note:'Maître d\'ouvrage (si paiement direct au sous-traitant)' },
    { bt:'BT-84', note:'IBAN du sous-traitant (si paiement direct)' },
  ],
  'XP-14': [
    { bt:'BT-12', note:'Référence du marché commun (GME, consortium)' },
    { bt:'BT-22', note:'Mention mandataire du groupement et quote-part co-traitant' },
  ],
  'XP-15': [
    { bt:'BT-59', note:'Nom du tiers commandeur (centrale d\'achat, holding)' },
    { bt:'BT-60', note:'Identifiant du tiers commandeur' },
    { bt:'BT-13', note:'Référence commande émise par le tiers (pas par l\'acheteur final)' },
    { bt:'BT-84', note:'IBAN du tiers qui effectue le paiement' },
  ],
  'XP-16': [
    { bt:'BT-118', note:'E ou O sur la partie débours (hors TVA, CGI art. 267 II)' },
    { bt:'BT-120', note:'Motif d\'exonération TVA débours (art. 267 II du CGI)' },
    { bt:'BT-121', note:'Code motif exo sur la partie débours' },
    { bt:'BT-122', note:'Références des justificatifs au nom du client (obligatoires)' },
  ],
  'XP-17a': [
    { bt:'BT-59', note:'Nom de la Marketplace (intermédiaire de paiement)' },
    { bt:'BT-60', note:'Identifiant de la Marketplace' },
    { bt:'BT-84', note:'IBAN de la Marketplace – l\'acheteur paie la plateforme' },
    { bt:'BT-13', note:'Référence commande Marketplace' },
  ],
  'XP-17b': [
    { bt:'BT-59', note:'Marketplace mandataire de facturation (émet au nom du vendeur)' },
    { bt:'BT-84', note:'IBAN pour paiement via Marketplace' },
    { bt:'BT-22', note:'Mention mandat de facturation : "émis par [Marketplace] au nom de [Vendeur]"' },
  ],
  'XP-18': [
    { bt:'BT-3', note:'= 383 (TypeCode note de débit) – rôles vendeur/acheteur inversés' },
    { bt:'BT-25', note:'Référence à la facture ou contrat objet du débit' },
    { bt:'BT-26', note:'Date de la facture initiale référencée' },
  ],
  'XP-19a': [
    { bt:'BT-30', note:'SIREN/SIRET du vendeur réel (pas du tiers facturant mandataire)' },
    { bt:'BT-31', note:'TVA intracommunautaire du vendeur réel' },
    { bt:'BT-22', note:'Mention mandat de facturation + identité du tiers mandataire obligatoire' },
  ],
  'XP-19b': [
    { bt:'BT-17', note:'Référence accord / indicateur auto-facturation (self-billing)' },
    { bt:'BT-22', note:'Mention "Autofacturation" obligatoire (accord acheteur–vendeur)' },
    { bt:'BT-23', note:'Type de processus : peut identifier le processus d\'auto-facturation' },
  ],
  'XP-20': [
    { bt:'BT-3', note:'= 386 (TypeCode facture d\'acompte) ou 380 avec mention explicite' },
    { bt:'BT-12', note:'Référence au contrat global dont l\'acompte fait partie' },
    { bt:'BT-22', note:'Mention "Acompte n°X sur contrat N°Y" + % ou montant global' },
  ],
  'XP-21': [
    { bt:'BT-25', note:'Référence aux factures d\'acompte antérieures (une par acompte)' },
    { bt:'BT-113', note:'Montant total des acomptes déjà versés (déduit du TTC)' },
    { bt:'BT-92', note:'Remises BG-20 = déduction des acomptes (montant + motif)' },
    { bt:'BT-22', note:'Mention "Facture définitive – déduction acomptes n°X, Y, Z"' },
  ],
  'XP-22a': [
    { bt:'BT-20', note:'Conditions de paiement : taux escompte, date limite, montant net si utilisé' },
    { bt:'BT-92', note:'Montant de l\'escompte (remise conditionnelle sur document BG-20)' },
    { bt:'BT-94', note:'Taux de l\'escompte (%)' },
    { bt:'BT-95', note:'Code TVA recalculée sur la base nette après escompte (services)' },
    { bt:'BT-96', note:'Taux TVA sur la base nette (si escompte utilisé – TVA à l\'encaissement)' },
  ],
  'XP-22b': [
    { bt:'BT-20', note:'Mention escompte conditionnel (taux, date limite de paiement)' },
    { bt:'BT-22', note:'Précision : TVA calculée sur le brut avant escompte (biens, TVA aux débits)' },
  ],
  'XP-23': [
    { bt:'BT-17', note:'Indicateur self-billing (acheteur émet au nom du vendeur particulier)' },
    { bt:'BT-22', note:'Mention "Autofacturation" + accord du vendeur particulier référencé' },
    { bt:'BT-118', note:'E ou O si le vendeur particulier n\'est pas assujetti à la TVA' },
  ],
  'XP-24': [
    { bt:'BT-22', note:'Mention EXPLICITE "Arrhes" (pas "acompte") + conditions d\'annulation' },
    { bt:'BT-3', note:'= 386 ou 380 selon convention – mais qualifier expressément "arrhes"' },
  ],
  'XP-25': [
    { bt:'BT-113', note:'Valeur du bon/carte cadeau utilisée (prépaiement déduit du TTC)' },
    { bt:'BT-22', note:'Référence et valeur du bon cadeau utilisé en déduction' },
  ],
  'XP-26': [
    { bt:'BT-22', note:'Clause de réserve de propriété (doit figurer sur la facture pour être opposable)' },
  ],
  'XP-27': [
    { bt:'BT-73', note:'Début de la période de péage (relevé mensuel)' },
    { bt:'BT-74', note:'Fin de la période couverte par le relevé de péage' },
    { bt:'BT-119', note:'= 20 : taux TVA 20% applicable aux péages autoroutiers' },
    { bt:'BT-22', note:'Nombre de passages et/ou plaque d\'immatriculation si relevé global' },
  ],
  'XP-28': [
    { bt:'BT-119', note:'= 10 : taux intermédiaire TVA restauration (bons de restaurant)' },
    { bt:'BT-22', note:'Nombre de convives et nature du repas (professionnel)' },
  ],
  'XP-29': [
    { bt:'BT-31', note:'Numéro TVA de l\'assujetti unique de groupe (commun à toutes les entités membres)' },
    { bt:'BT-48', note:'Numéro TVA de groupe de l\'entité acheteur membre' },
    { bt:'BT-118', note:'O = Hors champ TVA pour les flux internes au groupe TVA' },
  ],
  'XP-30': [],
  'XP-31': [
    { bt:'BT-119', note:'Taux multiples dans la même facture (5,5% / 10% / 20% …)' },
    { bt:'BT-120', note:'Motif d\'exonération pour chaque catégorie E ou O' },
    { bt:'BT-121', note:'Code motif exo VATEX pour chaque catégorie exonérée' },
  ],
  'XP-32': [
    { bt:'BT-73', note:'Début de la période facturée (abonnement, loyer, SaaS…)' },
    { bt:'BT-74', note:'Fin de la période facturée' },
    { bt:'BT-12', note:'Référence au contrat ou abonnement récurrent' },
    { bt:'BT-7',  note:'Date fait générateur TVA (si services à TVA à l\'encaissement)' },
  ],
  'XP-33': [
    { bt:'BT-22', note:'Mention OBLIGATOIRE "Régime particulier – biens d\'occasion" (art. 297A CGI)' },
    { bt:'BT-110', note:'= 0 ou absent : la TVA NE DOIT PAS figurer séparément sous peine de taxation sur le prix total' },
    { bt:'BT-116', note:'Base imposable = prix de vente TTC (marge incluse) pour le régime de la marge' },
  ],
  'XP-34': [
    { bt:'BT-3',  note:'= 381 (avoir) pour annuler la partie de la créance non payée' },
    { bt:'BT-25', note:'Référence à la facture initiale partiellement encaissée' },
    { bt:'BT-26', note:'Date de la facture initiale référencée' },
  ],
  'XP-35': [
    { bt:'BT-119', note:'= 10 : taux réduit TVA droits d\'auteur (art. 278-0 bis CGI)' },
    { bt:'BT-22', note:'Nature des droits cédés/concédés, œuvre concernée, période' },
    { bt:'BT-12', note:'Référence contrat de cession de droits ou accord de royalties' },
  ],
  'XP-36': [
    { bt:'BT-22', note:'Description générique de la prestation (respectant le secret professionnel)' },
    { bt:'BT-29', note:'Identifiant professionnel (n° Ordre, SIREN) pour identifier le prestataire' },
  ],
  'REF-LITIGE-AVOIR': [
    { bt:'BT-3',  note:'= 381 (avoir F2) référençant la facture F1 en litige' },
    { bt:'BT-25', note:'Numéro de la facture initiale F1 (obligatoire sur l\'avoir)' },
    { bt:'BT-26', note:'Date de la facture initiale F1' },
  ],
  'REF-LITIGE-RECTIF': [
    { bt:'BT-3',  note:'= 384 (facture rectificative F2) annulant et remplaçant F1' },
    { bt:'BT-25', note:'Numéro de la facture initiale F1 (obligatoire sur la rectificative)' },
    { bt:'BT-26', note:'Date de la facture initiale F1' },
  ],
  'REF-DEJA-PAYEE': [
    { bt:'BT-81', note:'Moyen de paiement utilisé (déjà encaissé avant émission)' },
    { bt:'BT-20', note:'= "Acquitté" – mention obligatoire sur facture déjà payée' },
    { bt:'BT-113', note:'Montant total prépayé (= TTC, solde = 0)' },
  ],
  'REF-TIERS-PAYEUR': [
    { bt:'BT-59', note:'Nom du tiers payeur identifié dans BG-10' },
    { bt:'BT-60', note:'Identifiant du tiers payeur (OD/PDP)' },
    { bt:'BT-84', note:'IBAN du vendeur (le tiers paie directement au vendeur)' },
  ],
  'REF-PARTIEL-TIERS': [
    { bt:'BT-59', note:'Nom du tiers prenant en charge une quote-part (OPCO, mutuelle)' },
    { bt:'BT-60', note:'Identifiant du tiers (prise en charge partielle)' },
    { bt:'BT-22', note:'Quote-parts acheteur et tiers clairement ventilées dans la note' },
  ],
  'REF-FRAIS-COLLAB-B2C': [
    { bt:'BT-44', note:'Nom du COLLABORATEUR individu (pas de l\'entreprise) comme acheteur' },
    { bt:'BT-47', note:'Absent (individu non immatriculé) – déclencheur e-reporting B2C' },
    { bt:'BT-48', note:'Absent (pas de TVA pour un individu) – flux 10.3/10.4 PPF requis' },
  ],
};

// Enrichir les cas d'usage avec leurs champs distinctifs
Object.entries(CHAMPS_DISTINCTIFS).forEach(([id, champs]) => {
  if (USE_CASES[id]) USE_CASES[id].champs_distinctifs = champs;
});

// ─── Blocs de données conditionnelles ────────────────────────────────────────
// Champs qui s'activent selon une condition métier spécifique
const BLOCS_CONDITIONNELS = {
  'livraison': {
    icone: '🚚', titre: 'Adresse de livraison distincte',
    condition: 'Si les biens/services sont livrés à une adresse différente de celle de l\'acheteur',
    bts: [
      { bt:'BT-70', note:'Nom du destinataire de livraison' },
      { bt:'BT-71', note:'Identifiant du lieu de livraison (GLN)' },
      { bt:'BT-72', note:'Date de livraison effective' },
      { bt:'BT-75', note:'Adresse de livraison – Ligne 1 (BG-15)' },
      { bt:'BT-78', note:'Ville de livraison' },
      { bt:'BT-79', note:'Code postal de livraison' },
      { bt:'BT-80', note:'Pays de livraison (ISO 3166)' },
    ],
  },
  'periode': {
    icone: '📅', titre: 'Période de prestation ou de facturation',
    condition: 'Si la facture couvre une période définie (abonnement, loyer, maintenance, SaaS…)',
    bts: [
      { bt:'BT-73', note:'Début de la période de facturation (BG-14)' },
      { bt:'BT-74', note:'Fin de la période de facturation (BG-14)' },
    ],
  },
  'virement': {
    icone: '🏧', titre: 'Paiement par virement bancaire (SEPA)',
    condition: 'Si le règlement s\'effectue par virement (BT-81 = 30 ou 58)',
    bts: [
      { bt:'BT-84', note:'IBAN du compte bénéficiaire (obligatoire pour virement)' },
      { bt:'BT-85', note:'Nom du titulaire du compte bénéficiaire' },
      { bt:'BT-86', note:'BIC de la banque bénéficiaire' },
      { bt:'BT-83', note:'Référence de paiement à rappeler dans le virement' },
    ],
  },
  'carte': {
    icone: '💳', titre: 'Paiement par carte bancaire',
    condition: 'Si le règlement a été ou sera effectué par carte (BT-81 = 48)',
    bts: [
      { bt:'BT-87', note:'4 derniers chiffres de la carte (BG-18)' },
      { bt:'BT-88', note:'Nom du titulaire de la carte' },
    ],
  },
  'prelevement': {
    icone: '📥', titre: 'Paiement par prélèvement SEPA',
    condition: 'Si le vendeur prélève directement le compte de l\'acheteur (BT-81 = 49)',
    bts: [
      { bt:'BT-89', note:'Référence du mandat de prélèvement SEPA (BG-19)' },
      { bt:'BT-90', note:'Identifiant créancier SEPA (ICS)' },
      { bt:'BT-91', note:'IBAN du compte à débiter' },
    ],
  },
  'beneficiaire': {
    icone: '👤', titre: 'Bénéficiaire du paiement ≠ vendeur',
    condition: 'Si le paiement doit être adressé à un tiers (factor, centrale de paiement, OD/PDP…)',
    bts: [
      { bt:'BT-59', note:'Nom du bénéficiaire (BG-10)' },
      { bt:'BT-60', note:'Identifiant du bénéficiaire' },
      { bt:'BT-61', note:'Identifiant légal du bénéficiaire (SIREN/SIRET)' },
    ],
  },
  'representant_fiscal': {
    icone: '🌍', titre: 'Représentant fiscal du vendeur',
    condition: 'Si le vendeur est établi hors UE ou n\'est pas immatriculé localement à la TVA',
    bts: [
      { bt:'BT-62', note:'Nom du représentant fiscal du vendeur (BG-11)' },
      { bt:'BT-63', note:'N° TVA du représentant fiscal dans le pays d\'imposition' },
    ],
  },
  'remise_doc': {
    icone: '🏷️', titre: 'Remise globale sur le document',
    condition: 'Si une remise s\'applique à l\'ensemble de la facture (hors remises par ligne BG-27)',
    bts: [
      { bt:'BT-92', note:'Montant de la remise document (BG-20)' },
      { bt:'BT-93', note:'Montant de base de calcul de la remise' },
      { bt:'BT-94', note:'Taux de remise (%)' },
      { bt:'BT-97', note:'Motif de la remise (texte libre)' },
      { bt:'BT-98', note:'Code motif remise (UNTDID 5189)' },
    ],
  },
  'frais_doc': {
    icone: '➕', titre: 'Frais globaux sur le document',
    condition: 'Si des frais s\'ajoutent au montant total (port, emballage, frais de dossier…)',
    bts: [
      { bt:'BT-99',  note:'Montant des frais document (BG-21)' },
      { bt:'BT-102', note:'Code catégorie TVA des frais' },
      { bt:'BT-104', note:'Motif des frais (texte libre)' },
    ],
  },
  'exoneration_tva': {
    icone: '📋', titre: 'Exonération, autoliquidation ou hors champ TVA',
    condition: 'Si une ou plusieurs lignes sont exonérées (E), en autoliquidation (AE), hors champ (O) ou intracommunautaires (K)',
    bts: [
      { bt:'BT-120', note:'Motif textuel d\'exonération (ex : "CGI art. 283-2 – autoliquidation")' },
      { bt:'BT-121', note:'Code motif VATEX (ex : VATEX-EU-AE, VATEX-EU-IC, VATEX-FR-FRANCHISE…)' },
    ],
  },
  'acomptes_prepayment': {
    icone: '💰', titre: 'Acomptes ou prépaiements déjà versés',
    condition: 'Si des acomptes ont déjà été encaissés avant la présente facture',
    bts: [
      { bt:'BT-113', note:'Montant total des prépaiements déduits du TTC' },
      { bt:'BT-25',  note:'Référence à la/aux facture(s) d\'acompte précédente(s)' },
      { bt:'BT-26',  note:'Date de la facture d\'acompte référencée' },
    ],
  },
  'contact_vendeur': {
    icone: '📞', titre: 'Contact spécifique chez le vendeur',
    condition: 'Si un interlocuteur précis (commercial, ADV, SAV) doit être communiqué',
    bts: [
      { bt:'BT-41', note:'Nom du contact vendeur (BG-6)' },
      { bt:'BT-42', note:'Téléphone du contact' },
      { bt:'BT-43', note:'Email du contact' },
    ],
  },
  'contact_acheteur': {
    icone: '📱', titre: 'Contact spécifique chez l\'acheteur',
    condition: 'Si un interlocuteur précis (comptabilité, prescripteur) est désigné côté acheteur',
    bts: [
      { bt:'BT-56', note:'Nom du contact acheteur (BG-9)' },
      { bt:'BT-57', note:'Téléphone du contact' },
      { bt:'BT-58', note:'Email du contact' },
    ],
  },
  'justificatifs': {
    icone: '📎', titre: 'Documents justificatifs joints ou référencés',
    condition: 'Si des pièces accompagnent la facture ou sont accessibles par URL',
    bts: [
      { bt:'BT-122', note:'Référence du document justificatif (BG-24)' },
      { bt:'BT-123', note:'Description du document' },
      { bt:'BT-124', note:'URL d\'accès au document externe' },
    ],
  },
  'devise_tva': {
    icone: '💱', titre: 'Devise de comptabilisation TVA différente',
    condition: 'Si la TVA est comptabilisée dans une devise différente de la devise de la facture',
    bts: [
      { bt:'BT-6',   note:'Devise de comptabilisation TVA (ISO 4217)' },
      { bt:'BT-111', note:'Montant TVA total converti dans la devise comptable' },
    ],
  },
  'facture_precedente': {
    icone: '🔗', titre: 'Facture précédente référencée (BG-3)',
    condition: 'Si ce document fait référence à un document antérieur (avoir, rectificative, solde…)',
    bts: [
      { bt:'BT-25', note:'Numéro de la facture précédente' },
      { bt:'BT-26', note:'Date de la facture précédente' },
    ],
  },
};

// Mapping cas d'usage → blocs conditionnels applicables
const BLOCS_PAR_CAS = {
  'XP-1':  ['livraison','periode','virement','remise_doc','frais_doc','contact_acheteur','justificatifs'],
  'XP-2':  ['virement','carte','prelevement'],
  'XP-3':  ['beneficiaire','virement'],
  'XP-4':  ['beneficiaire','remise_doc'],
  'XP-5':  ['justificatifs','contact_vendeur'],
  'XP-6':  ['justificatifs'],
  'XP-7':  ['carte'],
  'XP-8':  ['beneficiaire','virement'],
  'XP-9':  ['beneficiaire','virement'],
  'XP-10': ['virement'],
  'XP-11': ['contact_acheteur'],
  'XP-12': [],
  'XP-13': ['exoneration_tva','beneficiaire','virement','justificatifs'],
  'XP-14': ['justificatifs'],
  'XP-15': ['beneficiaire','virement'],
  'XP-16': ['exoneration_tva','justificatifs'],
  'XP-17a':['beneficiaire','virement'],
  'XP-17b':['beneficiaire'],
  'XP-18': ['facture_precedente'],
  'XP-19a':['contact_vendeur'],
  'XP-19b':[],
  'XP-20': ['virement','prelevement'],
  'XP-21': ['acomptes_prepayment','remise_doc','virement'],
  'XP-22a':['remise_doc','virement'],
  'XP-22b':['remise_doc','virement'],
  'XP-23': ['exoneration_tva'],
  'XP-24': ['virement'],
  'XP-25': ['acomptes_prepayment'],
  'XP-26': ['livraison','virement'],
  'XP-27': ['periode','virement'],
  'XP-28': ['virement','justificatifs'],
  'XP-29': ['exoneration_tva'],
  'XP-30': [],
  'XP-31': ['exoneration_tva'],
  'XP-32': ['periode','virement','prelevement'],
  'XP-33': [],
  'XP-34': ['facture_precedente','acomptes_prepayment'],
  'XP-35': ['virement','contact_vendeur'],
  'XP-36': ['contact_vendeur','justificatifs'],
  'REF-NOMINAL':      ['livraison','periode','virement','prelevement','carte','remise_doc','frais_doc','justificatifs','contact_vendeur','contact_acheteur'],
  'REF-REFUS':        ['facture_precedente'],
  'REF-LITIGE-AVOIR': ['facture_precedente','acomptes_prepayment'],
  'REF-LITIGE-RECTIF':['facture_precedente'],
  'REF-DEJA-PAYEE':   ['virement','carte','prelevement'],
  'REF-TIERS-PAYEUR': ['beneficiaire','virement'],
  'REF-PARTIEL-TIERS':['beneficiaire','remise_doc'],
  'REF-FRAIS-COLLAB-B2C':['justificatifs'],
  'REF-REJET':        [],
};

// Champs optionnels mais recommandés (utiles en pratique même si non obligatoires)
const CHAMPS_RECOMMANDES_PAR_CAS = {
  'XP-1': [
    { bt:'BT-9',  raison:'Date d\'échéance globale de la facture groupée' },
    { bt:'BT-10', raison:'Référence acheteur (service / centre de coût destinataire)' },
    { bt:'BT-20', raison:'Conditions de paiement (délai, mode, pénalités de retard)' },
    { bt:'BT-22', raison:'Note récapitulative des commandes et livraisons regroupées' },
  ],
  'XP-2': [
    { bt:'BT-82', raison:'Description textuelle du moyen de paiement utilisé' },
    { bt:'BT-83', raison:'Référence de la transaction ou du reçu de paiement' },
  ],
  'XP-3': [
    { bt:'BT-9',  raison:'Date d\'échéance pour le tiers payeur' },
    { bt:'BT-20', raison:'Conditions de paiement précisant le rôle et les délais du tiers' },
    { bt:'BT-82', raison:'Instructions de paiement à l\'attention du tiers' },
  ],
  'XP-4': [
    { bt:'BT-9',  raison:'Date d\'échéance de paiement' },
    { bt:'BT-20', raison:'Conditions précisant la répartition acheteur / tiers' },
  ],
  'XP-5': [
    { bt:'BT-72', raison:'Date de la dépense (date du ticket ou de l\'achat)' },
    { bt:'BT-22', raison:'Nature professionnelle de la dépense (obligatoire pour déductibilité)' },
  ],
  'XP-7': [
    { bt:'BT-9',  raison:'Date de débit / relevé de carte' },
    { bt:'BT-83', raison:'Référence de la transaction carte (rapprochement relevé)' },
  ],
  'XP-8': [
    { bt:'BT-9',  raison:'Date d\'échéance de paiement au factor' },
    { bt:'BT-20', raison:'Conditions mentionnant la cession de créance au factor' },
  ],
  'XP-9': [
    { bt:'BT-9',  raison:'Date d\'échéance de paiement' },
    { bt:'BT-15', raison:'Référence avis de réception côté distributeur' },
  ],
  'XP-13': [
    { bt:'BT-22', raison:'Mention légale autoliquidation (obligatoire sur la facture : "Autoliquidation – CGI art. 283-2")' },
    { bt:'BT-11', raison:'Référence du sous-projet ou lot de travaux concerné' },
    { bt:'BT-9',  raison:'Date d\'échéance de paiement' },
  ],
  'XP-14': [
    { bt:'BT-22', raison:'Quote-part du co-traitant et référence au groupement / mandataire' },
    { bt:'BT-9',  raison:'Date d\'échéance de paiement' },
  ],
  'XP-16': [
    { bt:'BT-9',  raison:'Date d\'échéance de remboursement des débours' },
    { bt:'BT-22', raison:'Texte de la mention légale "Débours – art. 267 II CGI"' },
  ],
  'XP-18': [
    { bt:'BT-9',  raison:'Date limite de règlement de la note de débit' },
    { bt:'BT-22', raison:'Motif détaillé et calcul du débit' },
  ],
  'XP-19b': [
    { bt:'BT-22', raison:'Mention "Autofacturation" et référence de l\'accord acheteur–vendeur' },
    { bt:'BT-9',  raison:'Date d\'échéance du paiement au vendeur' },
  ],
  'XP-20': [
    { bt:'BT-9',  raison:'Date d\'échéance du paiement de l\'acompte' },
    { bt:'BT-20', raison:'Conditions de paiement et calendrier des prochains acomptes' },
    { bt:'BT-83', raison:'Référence de paiement spécifique à cet acompte' },
  ],
  'XP-21': [
    { bt:'BT-9',  raison:'Date d\'échéance du solde final' },
    { bt:'BT-20', raison:'Conditions de paiement du solde restant dû' },
    { bt:'BT-22', raison:'Liste numérotée des acomptes déduits (n° facture + montant)' },
  ],
  'XP-22a': [
    { bt:'BT-9',  raison:'Date d\'échéance normale (si escompte non utilisé)' },
    { bt:'BT-22', raison:'Calcul TTC avec et sans escompte + date limite de l\'offre' },
  ],
  'XP-22b': [
    { bt:'BT-9',  raison:'Date d\'échéance normale et date limite pour bénéficier de l\'escompte' },
  ],
  'XP-24': [
    { bt:'BT-9',  raison:'Date d\'échéance des arrhes' },
    { bt:'BT-20', raison:'Conditions d\'annulation et sort des arrhes (perdues ou × 2)' },
  ],
  'XP-26': [
    { bt:'BT-9',  raison:'Date d\'échéance (le transfert de propriété est lié au paiement)' },
    { bt:'BT-20', raison:'Conditions de paiement intégrant la clause de réserve' },
  ],
  'XP-27': [
    { bt:'BT-9',  raison:'Date d\'échéance du relevé de péage mensuel' },
    { bt:'BT-10', raison:'Référence du contrat télépage (abonnement Liber-t, Sanef…)' },
  ],
  'XP-28': [
    { bt:'BT-72', raison:'Date du repas (peut différer de la date de facturation)' },
    { bt:'BT-10', raison:'Référence de la réservation ou du bon de commande entreprise' },
  ],
  'XP-29': [
    { bt:'BT-22', raison:'Mention du régime d\'assujetti unique (art. 256C du CGI)' },
  ],
  'XP-31': [
    { bt:'BT-22', raison:'Note explicative de la ventilation par taux pour faciliter la comptabilisation acheteur' },
  ],
  'XP-32': [
    { bt:'BT-9',  raison:'Prochaine date d\'échéance de paiement' },
    { bt:'BT-83', raison:'Référence de paiement pour ce cycle (rapprochement automatique)' },
    { bt:'BT-20', raison:'Conditions : mode de paiement, clause d\'indexation si applicable' },
  ],
  'XP-33': [
    { bt:'BT-72', raison:'Date d\'acquisition du bien d\'occasion (historique du bien)' },
    { bt:'BT-22', raison:'Description précise du bien : marque, modèle, état, kilométrage…' },
  ],
  'XP-35': [
    { bt:'BT-9',  raison:'Date d\'échéance des royalties' },
    { bt:'BT-83', raison:'Référence de la transaction de droits (rapprochement SACEM, ADAGP…)' },
  ],
  'XP-36': [
    { bt:'BT-9',  raison:'Date d\'échéance des honoraires' },
    { bt:'BT-33', raison:'Informations légales du prestataire (forme juridique, Ordre professionnel)' },
  ],
  'REF-NOMINAL': [
    { bt:'BT-9',  raison:'Date d\'échéance de paiement' },
    { bt:'BT-10', raison:'Référence acheteur (service, centre de coût)' },
    { bt:'BT-20', raison:'Conditions de paiement (délai, mode, pénalités de retard légales)' },
    { bt:'BT-13', raison:'Référence bon de commande de l\'acheteur' },
    { bt:'BT-72', raison:'Date de livraison effective' },
    { bt:'BT-83', raison:'Référence de paiement à rappeler dans le virement' },
  ],
};

// Enrichir les cas d'usage avec blocs conditionnels et champs recommandés
Object.entries(BLOCS_PAR_CAS).forEach(([id, blocs]) => {
  if (USE_CASES[id]) USE_CASES[id].blocs_conditionnels = blocs;
});
Object.entries(CHAMPS_RECOMMANDES_PAR_CAS).forEach(([id, champs]) => {
  if (USE_CASES[id]) USE_CASES[id].champs_recommandes = champs;
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
