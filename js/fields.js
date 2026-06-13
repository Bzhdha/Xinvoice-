/**
 * FacturX / EN 16931 – Référentiel complet des champs
 * Source : AFNOR NF Z55-500 & FacturX 1.0.06 / EN 16931-1:2017
 *
 * Profils :
 *   min  = Minimum
 *   bwl  = Basic WL
 *   bas  = Basic
 *   en   = EN 16931 (Confort)
 *   ext  = Extended
 *
 * Niveaux par profil :
 *   M  = Obligatoire (Mandatory)
 *   C  = Conditionnel
 *   O  = Optionnel
 *   N  = Non applicable / non utilisé
 */

const PROFILES = {
  min:  { id: 'min',  label: 'Minimum',   urn: ['urn:factur-x.eu:1p0:minimum'] },
  bwl:  { id: 'bwl',  label: 'Basic WL',  urn: ['urn:factur-x.eu:1p0:basicwl'] },
  bas:  { id: 'bas',  label: 'Basic',     urn: ['urn:factur-x.eu:1p0:basic'] },
  en:   { id: 'en',   label: 'EN 16931',  urn: ['urn:cen.eu:en16931:2017', 'urn:factur-x.eu:1p0:en16931'] },
  ext:  { id: 'ext',  label: 'Extended',  urn: ['urn:factur-x.eu:1p0:extended'] },
};

// Ordered from least to most complete
const PROFILE_ORDER = ['min', 'bwl', 'bas', 'en', 'ext'];

function detectProfileFromUrn(urn) {
  if (!urn) return null;
  const clean = urn.trim().toLowerCase();
  for (const [key, p] of Object.entries(PROFILES)) {
    if (p.urn.some(u => clean === u.toLowerCase() || clean.startsWith(u.toLowerCase()))) {
      return key;
    }
  }
  // XRechnung / PEPPOL variants based on EN 16931
  if (clean.includes('xrechnung') || clean.includes('peppol') || clean.includes('cen.eu:en16931')) {
    return 'en';
  }
  return null;
}

// ─── Business Groups ──────────────────────────────────────────────────────────
const BUSINESS_GROUPS = {
  'ROOT':  { label: 'Document principal', icon: '📄' },
  'BG-2':  { label: 'Contrôle du processus',          icon: '⚙️' },
  'BG-3':  { label: 'Facture précédente référencée',  icon: '🔗' },
  'BG-4':  { label: 'Vendeur (Seller)',                icon: '🏢' },
  'BG-5':  { label: 'Adresse postale du vendeur',      icon: '📍' },
  'BG-6':  { label: 'Contact du vendeur',              icon: '📞' },
  'BG-7':  { label: 'Acheteur (Buyer)',                icon: '🏦' },
  'BG-8':  { label: "Adresse postale de l'acheteur",   icon: '📍' },
  'BG-9':  { label: "Contact de l'acheteur",           icon: '📞' },
  'BG-10': { label: 'Bénéficiaire (Payee)',            icon: '💳' },
  'BG-11': { label: 'Représentant fiscal du vendeur',  icon: '📋' },
  'BG-12': { label: 'Adresse du représentant fiscal',  icon: '📍' },
  'BG-13': { label: 'Informations de livraison',       icon: '🚚' },
  'BG-14': { label: "Période de facturation",          icon: '📅' },
  'BG-15': { label: "Adresse de livraison",            icon: '📍' },
  'BG-16': { label: 'Instructions de paiement',        icon: '💰' },
  'BG-17': { label: 'Virement (Credit Transfer)',      icon: '🏧' },
  'BG-18': { label: 'Carte de paiement',               icon: '💳' },
  'BG-19': { label: 'Prélèvement direct',              icon: '📥' },
  'BG-20': { label: 'Remises au niveau document',      icon: '🏷️' },
  'BG-21': { label: 'Frais au niveau document',        icon: '➕' },
  'BG-22': { label: 'Totaux du document',              icon: '🧾' },
  'BG-23': { label: 'Ventilation TVA',                 icon: '📊' },
  'BG-24': { label: 'Documents justificatifs joints',  icon: '📎' },
  'BG-25': { label: 'Lignes de facture',               icon: '📝' },
  'BG-26': { label: 'Période de la ligne',             icon: '📅' },
  'BG-27': { label: "Remises sur ligne",               icon: '🏷️' },
  'BG-28': { label: "Frais sur ligne",                 icon: '➕' },
  'BG-29': { label: 'Détail du prix',                  icon: '💲' },
  'BG-30': { label: 'TVA sur ligne',                   icon: '📊' },
  'BG-31': { label: "Informations sur l'article",      icon: '📦' },
  'BG-32': { label: "Attributs de l'article",          icon: '🏷️' },
};

// ─── XPath helpers (prefixes CII) ─────────────────────────────────────────────
// Base paths to avoid repetition
const _BASE = {
  AGREEMENT: '//ram:ApplicableHeaderTradeAgreement',
  DELIVERY:  '//ram:ApplicableHeaderTradeDelivery',
  SETTLEMENT:'//ram:ApplicableHeaderTradeSettlement',
  SELLER:    '//ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty',
  BUYER:     '//ram:ApplicableHeaderTradeAgreement/ram:BuyerTradeParty',
  TOTALS:    '//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradeSettlementHeaderMonetarySummation',
  LINE:      '//ram:IncludedSupplyChainTradeLineItem',
};

// ─── Field Definitions ────────────────────────────────────────────────────────
const FIELDS = {

  // ── BG-2 : Contrôle du processus ─────────────────────────────────────────
  'BT-23': {
    id: 'BT-23', group: 'BG-2',
    label: 'Type de processus',
    description: "Identifie le processus métier dans lequel la facture s'inscrit (ex: facturation BtoB, sous-traitance, etc.)",
    xpath: '//rsm:ExchangedDocumentContext/ram:BusinessProcessSpecifiedDocumentContextParameter/ram:ID',
    type: 'identifier',
    profiles: { min: 'O', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-24': {
    id: 'BT-24', group: 'BG-2',
    label: 'Identifiant du profil (BT-24) ★',
    description: "URN identifiant la spécification ou le profil FacturX : détermine les règles applicables",
    xpath: '//rsm:ExchangedDocumentContext/ram:GuidelineSpecifiedDocumentContextParameter/ram:ID',
    type: 'identifier',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },

  // ── Document principal ───────────────────────────────────────────────────
  'BT-1': {
    id: 'BT-1', group: 'ROOT',
    label: 'Numéro de la facture ★',
    description: "Identifiant unique de la facture attribué par le vendeur",
    xpath: '//rsm:ExchangedDocument/ram:ID',
    type: 'identifier',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
    example: 'FACT-2024-001'
  },
  'BT-2': {
    id: 'BT-2', group: 'ROOT',
    label: 'Date de la facture ★',
    description: "Date d'émission de la facture (format YYYYMMDD)",
    xpath: '//rsm:ExchangedDocument/ram:IssueDateTime/udt:DateTimeString',
    type: 'date',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-3': {
    id: 'BT-3', group: 'ROOT',
    label: 'Code type de facture ★',
    description: "Code UNTDID 1001 identifiant le type de document (380=Facture, 381=Avoir, 384=Facture corrective…)",
    xpath: '//rsm:ExchangedDocument/ram:TypeCode',
    type: 'code',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
    codeList: 'UNTDID 1001',
  },
  'BT-22': {
    id: 'BT-22', group: 'ROOT',
    label: 'Note de la facture',
    description: "Texte libre complémentaire inclus dans la facture",
    xpath: '//rsm:ExchangedDocument/ram:IncludedNote/ram:Content',
    type: 'text',
    profiles: { min: 'O', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-3 : Facture précédente ─────────────────────────────────────────────
  'BT-25': {
    id: 'BT-25', group: 'BG-3',
    label: 'Numéro de la facture précédente',
    description: "Référence d'une facture précédente (ex: facture initiale en cas d'avoir ou de correction)",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:InvoiceReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-26': {
    id: 'BT-26', group: 'BG-3',
    label: 'Date de la facture précédente',
    description: "Date de la facture précédente référencée",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:InvoiceReferencedDocument/ram:FormattedIssueDateTime/qdt:DateTimeString',
    type: 'date',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── Champs divers ────────────────────────────────────────────────────────
  'BT-5': {
    id: 'BT-5', group: 'ROOT',
    label: 'Devise de la facture ★',
    description: "Code ISO 4217 de la devise utilisée pour les montants de la facture",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:InvoiceCurrencyCode',
    type: 'code',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
    codeList: 'ISO 4217',
  },
  'BT-6': {
    id: 'BT-6', group: 'ROOT',
    label: 'Devise de comptabilisation TVA',
    description: "Devise utilisée pour la comptabilisation de la TVA (si différente de la devise de la facture)",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:TaxCurrencyCode',
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'N', en: 'C', ext: 'C' },
    codeList: 'ISO 4217',
  },
  'BT-7': {
    id: 'BT-7', group: 'ROOT',
    label: "Date du fait générateur de TVA",
    description: "Date à laquelle la TVA devient exigible (si différente de la date de facture)",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:ApplicableTradeTax[1]/ram:TaxPointDate/udt:DateString',
    type: 'date',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-8': {
    id: 'BT-8', group: 'ROOT',
    label: "Code date du fait générateur TVA",
    description: "Code UNTDID 2005 précisant quand la TVA est due",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:ApplicableTradeTax[1]/ram:DueDateTypeCode',
    type: 'code',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    codeList: 'UNTDID 2005',
  },
  'BT-9': {
    id: 'BT-9', group: 'ROOT',
    label: "Date d'échéance",
    description: "Date limite de paiement de la facture",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradePaymentTerms/ram:DueDateDateTime/udt:DateTimeString',
    type: 'date',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-10': {
    id: 'BT-10', group: 'ROOT',
    label: "Référence acheteur ★",
    description: "Référence fournie par l'acheteur, identifiant le destinataire de la facture (ex: bon de commande, service)",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:BuyerReference',
    type: 'text',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-11': {
    id: 'BT-11', group: 'ROOT',
    label: "Référence projet",
    description: "Identifiant du projet de référence",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:SpecifiedProcuringProject/ram:ID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-12': {
    id: 'BT-12', group: 'ROOT',
    label: "Référence contrat",
    description: "Identifiant du contrat commercial",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:ContractReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-13': {
    id: 'BT-13', group: 'ROOT',
    label: "Référence bon de commande acheteur",
    description: "Numéro du bon de commande émis par l'acheteur",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:BuyerOrderReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'C', ext: 'C' },
  },
  'BT-14': {
    id: 'BT-14', group: 'ROOT',
    label: "Référence bon de commande vendeur",
    description: "Numéro de l'ordre de vente émis par le vendeur",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:SellerOrderReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-15': {
    id: 'BT-15', group: 'ROOT',
    label: "Référence avis de réception",
    description: "Référence de l'avis de réception des marchandises",
    xpath: '//ram:ApplicableHeaderTradeDelivery/ram:ReceivingAdviceReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-16': {
    id: 'BT-16', group: 'ROOT',
    label: "Référence avis d'expédition",
    description: "Référence du bon de livraison",
    xpath: '//ram:ApplicableHeaderTradeDelivery/ram:DespatchAdviceReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-17': {
    id: 'BT-17', group: 'ROOT',
    label: "Référence appel d'offres / lot",
    description: "Référence à un appel d'offres ou un lot spécifique",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:AdditionalReferencedDocument[ram:TypeCode="130"]/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-19': {
    id: 'BT-19', group: 'ROOT',
    label: "Référence comptable acheteur",
    description: "Référence comptable fournie par l'acheteur pour imputation",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:ReceivableSpecifiedTradeAccountingAccount/ram:ID',
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-20': {
    id: 'BT-20', group: 'ROOT',
    label: "Conditions de paiement",
    description: "Description textuelle des conditions et modalités de paiement",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradePaymentTerms/ram:Description',
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-4 : Vendeur ────────────────────────────────────────────────────────
  'BT-27': {
    id: 'BT-27', group: 'BG-4',
    label: 'Nom du vendeur ★',
    description: "Raison sociale complète du vendeur",
    xpath: `${_BASE.SELLER}/ram:Name`,
    type: 'text',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-28': {
    id: 'BT-28', group: 'BG-4',
    label: 'Nom commercial du vendeur',
    description: "Nom commercial ou enseigne du vendeur (si différent de la raison sociale)",
    xpath: `${_BASE.SELLER}/ram:SpecifiedLegalOrganization/ram:TradingBusinessName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-29': {
    id: 'BT-29', group: 'BG-4',
    label: 'Identifiant du vendeur',
    description: "Identifiant propre du vendeur (peut inclure un code schéma)",
    xpath: `${_BASE.SELLER}/ram:GlobalID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-30': {
    id: 'BT-30', group: 'BG-4',
    label: 'Numéro SIREN/Identifiant légal vendeur ★',
    description: "Identifiant légal d'enregistrement du vendeur (SIREN en France, schéma 0002)",
    xpath: `${_BASE.SELLER}/ram:SpecifiedLegalOrganization/ram:ID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Obligatoire en France pour les factures B2B"
  },
  'BT-31': {
    id: 'BT-31', group: 'BG-4',
    label: 'Numéro TVA intracommunautaire vendeur ★',
    description: "Numéro de TVA intracommunautaire du vendeur (schéma VA)",
    xpath: `${_BASE.SELLER}/ram:SpecifiedTaxRegistration[ram:ID/@schemeID='VA']/ram:ID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Requis sauf si BT-32 est fourni"
  },
  'BT-32': {
    id: 'BT-32', group: 'BG-4',
    label: 'Identifiant fiscal vendeur',
    description: "Identifiant fiscal national du vendeur (schéma FC)",
    xpath: `${_BASE.SELLER}/ram:SpecifiedTaxRegistration[ram:ID/@schemeID='FC']/ram:ID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-33': {
    id: 'BT-33', group: 'BG-4',
    label: 'Informations légales complémentaires vendeur',
    description: "Informations légales additionnelles (ex: forme juridique, capital social)",
    xpath: `${_BASE.SELLER}/ram:Description`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-34': {
    id: 'BT-34', group: 'BG-4',
    label: 'Adresse électronique vendeur',
    description: "Adresse électronique (URI) du vendeur pour la facturation électronique",
    xpath: `${_BASE.SELLER}/ram:URIUniversalCommunication/ram:URIID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── BG-5 : Adresse postale du vendeur ─────────────────────────────────────
  'BT-35': {
    id: 'BT-35', group: 'BG-5',
    label: 'Adresse vendeur – Ligne 1',
    description: "Première ligne de l'adresse postale du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:LineOne`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-36': {
    id: 'BT-36', group: 'BG-5',
    label: 'Adresse vendeur – Ligne 2',
    description: "Deuxième ligne de l'adresse postale du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:LineTwo`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-162': {
    id: 'BT-162', group: 'BG-5',
    label: 'Adresse vendeur – Ligne 3',
    description: "Troisième ligne de l'adresse postale du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:LineThree`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-37': {
    id: 'BT-37', group: 'BG-5',
    label: 'Ville du vendeur',
    description: "Ville ou localité de l'adresse postale du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:CityName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-38': {
    id: 'BT-38', group: 'BG-5',
    label: 'Code postal vendeur',
    description: "Code postal de l'adresse du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:PostcodeCode`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-39': {
    id: 'BT-39', group: 'BG-5',
    label: 'Subdivision pays vendeur',
    description: "Région, département ou province du vendeur",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:CountrySubDivisionName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-40': {
    id: 'BT-40', group: 'BG-5',
    label: 'Pays du vendeur ★',
    description: "Code ISO 3166-1 alpha-2 du pays du vendeur (ex: FR, DE, ES)",
    xpath: `${_BASE.SELLER}/ram:PostalTradeAddress/ram:CountryID`,
    type: 'code',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
    codeList: 'ISO 3166-1 alpha-2',
  },

  // ── BG-6 : Contact du vendeur ─────────────────────────────────────────────
  'BT-41': {
    id: 'BT-41', group: 'BG-6',
    label: 'Nom du contact vendeur',
    description: "Nom de la personne à contacter chez le vendeur",
    xpath: `${_BASE.SELLER}/ram:DefinedTradeContact/ram:PersonName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-42': {
    id: 'BT-42', group: 'BG-6',
    label: 'Téléphone du contact vendeur',
    description: "Numéro de téléphone du contact vendeur",
    xpath: `${_BASE.SELLER}/ram:DefinedTradeContact/ram:TelephoneUniversalCommunication/ram:CompleteNumber`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-43': {
    id: 'BT-43', group: 'BG-6',
    label: 'Email du contact vendeur',
    description: "Adresse email du contact vendeur",
    xpath: `${_BASE.SELLER}/ram:DefinedTradeContact/ram:EmailURIUniversalCommunication/ram:URIID`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-7 : Acheteur ───────────────────────────────────────────────────────
  'BT-44': {
    id: 'BT-44', group: 'BG-7',
    label: "Nom de l'acheteur ★",
    description: "Raison sociale complète de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:Name`,
    type: 'text',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-45': {
    id: 'BT-45', group: 'BG-7',
    label: "Nom commercial de l'acheteur",
    description: "Nom commercial ou enseigne de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:SpecifiedLegalOrganization/ram:TradingBusinessName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-46': {
    id: 'BT-46', group: 'BG-7',
    label: "Identifiant de l'acheteur",
    description: "Identifiant propre de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:ID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-47': {
    id: 'BT-47', group: 'BG-7',
    label: "SIREN/Identifiant légal acheteur",
    description: "Identifiant légal d'enregistrement de l'acheteur (SIREN en France)",
    xpath: `${_BASE.BUYER}/ram:SpecifiedLegalOrganization/ram:ID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Requis si l'acheteur est une personne morale (B2B France)"
  },
  'BT-48': {
    id: 'BT-48', group: 'BG-7',
    label: "Numéro TVA acheteur",
    description: "Numéro de TVA intracommunautaire de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:SpecifiedTaxRegistration[ram:ID/@schemeID='VA']/ram:ID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Requis si l'acheteur est assujetti à la TVA"
  },
  'BT-49': {
    id: 'BT-49', group: 'BG-7',
    label: "Adresse électronique acheteur",
    description: "Adresse électronique (URI) de l'acheteur pour la facturation électronique",
    xpath: `${_BASE.BUYER}/ram:URIUniversalCommunication/ram:URIID`,
    type: 'identifier',
    profiles: { min: 'C', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── BG-8 : Adresse acheteur ───────────────────────────────────────────────
  'BT-50': {
    id: 'BT-50', group: 'BG-8',
    label: "Adresse acheteur – Ligne 1",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:LineOne`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-51': {
    id: 'BT-51', group: 'BG-8',
    label: "Adresse acheteur – Ligne 2",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:LineTwo`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-163': {
    id: 'BT-163', group: 'BG-8',
    label: "Adresse acheteur – Ligne 3",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:LineThree`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-52': {
    id: 'BT-52', group: 'BG-8',
    label: "Ville de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:CityName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-53': {
    id: 'BT-53', group: 'BG-8',
    label: "Code postal acheteur",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:PostcodeCode`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-54': {
    id: 'BT-54', group: 'BG-8',
    label: "Subdivision pays acheteur",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:CountrySubDivisionName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-55': {
    id: 'BT-55', group: 'BG-8',
    label: "Pays de l'acheteur",
    description: "Code ISO 3166-1 alpha-2 du pays de l'acheteur",
    xpath: `${_BASE.BUYER}/ram:PostalTradeAddress/ram:CountryID`,
    type: 'code',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'C', ext: 'C' },
    codeList: 'ISO 3166-1 alpha-2',
  },

  // ── BG-9 : Contact acheteur ───────────────────────────────────────────────
  'BT-56': {
    id: 'BT-56', group: 'BG-9',
    label: "Nom du contact acheteur",
    xpath: `${_BASE.BUYER}/ram:DefinedTradeContact/ram:PersonName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-57': {
    id: 'BT-57', group: 'BG-9',
    label: "Téléphone contact acheteur",
    xpath: `${_BASE.BUYER}/ram:DefinedTradeContact/ram:TelephoneUniversalCommunication/ram:CompleteNumber`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-58': {
    id: 'BT-58', group: 'BG-9',
    label: "Email contact acheteur",
    xpath: `${_BASE.BUYER}/ram:DefinedTradeContact/ram:EmailURIUniversalCommunication/ram:URIID`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-10 : Bénéficiaire ──────────────────────────────────────────────────
  'BT-59': {
    id: 'BT-59', group: 'BG-10',
    label: "Nom du bénéficiaire",
    description: "Nom de l'entité qui reçoit le paiement (si différente du vendeur)",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:PayeeTradeParty/ram:Name',
    type: 'text',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-60': {
    id: 'BT-60', group: 'BG-10',
    label: "Identifiant du bénéficiaire",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:PayeeTradeParty/ram:ID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-61': {
    id: 'BT-61', group: 'BG-10',
    label: "Identifiant légal du bénéficiaire",
    xpath: '//ram:ApplicableHeaderTradeSettlement/ram:PayeeTradeParty/ram:SpecifiedLegalOrganization/ram:ID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-11 : Représentant fiscal du vendeur ────────────────────────────────
  'BT-62': {
    id: 'BT-62', group: 'BG-11',
    label: "Nom du représentant fiscal vendeur",
    description: "Nom du mandataire fiscal du vendeur (cas d'autoliquidation ou de ventes à distance)",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:SellerTaxRepresentativeTradeParty/ram:Name',
    type: 'text',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-63': {
    id: 'BT-63', group: 'BG-11',
    label: "TVA du représentant fiscal vendeur",
    xpath: '//ram:ApplicableHeaderTradeAgreement/ram:SellerTaxRepresentativeTradeParty/ram:SpecifiedTaxRegistration[ram:ID/@schemeID="VA"]/ram:ID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── BG-13 : Livraison ─────────────────────────────────────────────────────
  'BT-70': {
    id: 'BT-70', group: 'BG-13',
    label: "Nom du destinataire de livraison",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:Name`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-71': {
    id: 'BT-71', group: 'BG-13',
    label: "Identifiant lieu de livraison",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:GlobalID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-72': {
    id: 'BT-72', group: 'BG-13',
    label: "Date de livraison effective",
    xpath: `${_BASE.DELIVERY}/ram:ActualDeliverySupplyChainEvent/ram:OccurrenceDateTime/udt:DateTimeString`,
    type: 'date',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-14 : Période de facturation ───────────────────────────────────────
  'BT-73': {
    id: 'BT-73', group: 'BG-14',
    label: "Début de la période de facturation",
    xpath: `${_BASE.SETTLEMENT}/ram:BillingSpecifiedPeriod/ram:StartDateTime/udt:DateTimeString`,
    type: 'date',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-74': {
    id: 'BT-74', group: 'BG-14',
    label: "Fin de la période de facturation",
    xpath: `${_BASE.SETTLEMENT}/ram:BillingSpecifiedPeriod/ram:EndDateTime/udt:DateTimeString`,
    type: 'date',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-15 : Adresse de livraison ──────────────────────────────────────────
  'BT-75': {
    id: 'BT-75', group: 'BG-15',
    label: "Adresse livraison – Ligne 1",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:PostalTradeAddress/ram:LineOne`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-78': {
    id: 'BT-78', group: 'BG-15',
    label: "Ville de livraison",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:PostalTradeAddress/ram:CityName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-79': {
    id: 'BT-79', group: 'BG-15',
    label: "Code postal livraison",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:PostalTradeAddress/ram:PostcodeCode`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-80': {
    id: 'BT-80', group: 'BG-15',
    label: "Pays de livraison",
    xpath: `${_BASE.DELIVERY}/ram:ShipToTradeParty/ram:PostalTradeAddress/ram:CountryID`,
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'C', ext: 'C' },
    codeList: 'ISO 3166-1 alpha-2',
  },

  // ── BG-16 : Instructions de paiement ─────────────────────────────────────
  'BT-81': {
    id: 'BT-81', group: 'BG-16',
    label: "Code moyen de paiement",
    description: "Code UNTDID 4461 du moyen de paiement (30=Virement, 49=Prélèvement, 58=SEPA Credit Transfer…)",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:TypeCode`,
    type: 'code',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    codeList: 'UNTDID 4461',
  },
  'BT-82': {
    id: 'BT-82', group: 'BG-16',
    label: "Texte moyen de paiement",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:Information`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-83': {
    id: 'BT-83', group: 'BG-16',
    label: "Référence de remise",
    description: "Référence de paiement ou numéro de remise (ex: numéro de facture à rappeler dans le virement)",
    xpath: `${_BASE.SETTLEMENT}/ram:PaymentReference`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-17 : Virement ──────────────────────────────────────────────────────
  'BT-84': {
    id: 'BT-84', group: 'BG-17',
    label: "IBAN du compte bénéficiaire",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:PayeePartyCreditorFinancialAccount/ram:IBANID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-85': {
    id: 'BT-85', group: 'BG-17',
    label: "Nom du compte bénéficiaire",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:PayeePartyCreditorFinancialAccount/ram:AccountName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-86': {
    id: 'BT-86', group: 'BG-17',
    label: "BIC de la banque bénéficiaire",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:PayeeSpecifiedCreditorFinancialInstitution/ram:BICID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-18 : Carte de paiement ─────────────────────────────────────────────
  'BT-87': {
    id: 'BT-87', group: 'BG-18',
    label: "Numéro de carte (4 derniers chiffres)",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:ApplicableTradeSettlementFinancialCard/ram:ID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-88': {
    id: 'BT-88', group: 'BG-18',
    label: "Titulaire de la carte",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:ApplicableTradeSettlementFinancialCard/ram:CardholderName`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },

  // ── BG-19 : Prélèvement ───────────────────────────────────────────────────
  'BT-89': {
    id: 'BT-89', group: 'BG-19',
    label: "Référence mandat de prélèvement",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradePaymentTerms/ram:DirectDebitMandateID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-90': {
    id: 'BT-90', group: 'BG-19',
    label: "Identifiant créancier (ICS)",
    xpath: `${_BASE.SETTLEMENT}/ram:CreditorReferenceID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-91': {
    id: 'BT-91', group: 'BG-19',
    label: "IBAN compte à débiter",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeSettlementPaymentMeans/ram:PayerPartyDebtorFinancialAccount/ram:IBANID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── BG-20 : Remises document ──────────────────────────────────────────────
  'BT-92': {
    id: 'BT-92', group: 'BG-20',
    label: "Montant de la remise document",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:ActualAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-93': {
    id: 'BT-93', group: 'BG-20',
    label: "Montant de base de la remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:BasisAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-94': {
    id: 'BT-94', group: 'BG-20',
    label: "Pourcentage de la remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:CalculationPercent`,
    type: 'percent',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-95': {
    id: 'BT-95', group: 'BG-20',
    label: "Code TVA de la remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:CategoryTradeTax/ram:CategoryCode`,
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-96': {
    id: 'BT-96', group: 'BG-20',
    label: "Taux TVA de la remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:CategoryTradeTax/ram:RateApplicablePercent`,
    type: 'percent',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-97': {
    id: 'BT-97', group: 'BG-20',
    label: "Motif de la remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:Reason`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-98': {
    id: 'BT-98', group: 'BG-20',
    label: "Code motif remise",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:ReasonCode`,
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
    codeList: 'UNTDID 5189',
  },

  // ── BG-21 : Frais document ────────────────────────────────────────────────
  'BT-99': {
    id: 'BT-99', group: 'BG-21',
    label: "Montant des frais document",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='true']/ram:ActualAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-102': {
    id: 'BT-102', group: 'BG-21',
    label: "Code TVA des frais",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='true']/ram:CategoryTradeTax/ram:CategoryCode`,
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-104': {
    id: 'BT-104', group: 'BG-21',
    label: "Motif des frais",
    xpath: `${_BASE.SETTLEMENT}/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='true']/ram:Reason`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },

  // ── BG-22 : Totaux du document ────────────────────────────────────────────
  'BT-106': {
    id: 'BT-106', group: 'BG-22',
    label: "Total HT des lignes ★",
    description: "Somme de tous les montants nets des lignes de facture",
    xpath: `${_BASE.TOTALS}/ram:LineTotalAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-107': {
    id: 'BT-107', group: 'BG-22',
    label: "Total des remises document",
    xpath: `${_BASE.TOTALS}/ram:AllowanceTotalAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-108': {
    id: 'BT-108', group: 'BG-22',
    label: "Total des frais document",
    xpath: `${_BASE.TOTALS}/ram:ChargeTotalAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  'BT-109': {
    id: 'BT-109', group: 'BG-22',
    label: "Total HT de la facture ★",
    description: "Montant total de la facture hors TVA",
    xpath: `${_BASE.TOTALS}/ram:TaxBasisTotalAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-110': {
    id: 'BT-110', group: 'BG-22',
    label: "Montant total TVA ★",
    description: "Montant total de la TVA de la facture",
    xpath: `${_BASE.TOTALS}/ram:TaxTotalAmount`,
    type: 'amount',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-111': {
    id: 'BT-111', group: 'BG-22',
    label: "TVA totale en devise comptable",
    description: "Montant total TVA converti dans la devise de comptabilisation (si différente)",
    xpath: `${_BASE.TOTALS}/ram:TaxTotalAmount[@currencyID]`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'N', en: 'C', ext: 'C' },
  },
  'BT-112': {
    id: 'BT-112', group: 'BG-22',
    label: "Total TTC de la facture ★",
    description: "Montant total de la facture TVA incluse",
    xpath: `${_BASE.TOTALS}/ram:GrandTotalAmount`,
    type: 'amount',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-113': {
    id: 'BT-113', group: 'BG-22',
    label: "Montant déjà payé",
    description: "Somme déjà versée (acomptes, prépaiements)",
    xpath: `${_BASE.TOTALS}/ram:TotalPrepaidAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-114': {
    id: 'BT-114', group: 'BG-22',
    label: "Montant d'arrondi",
    xpath: `${_BASE.TOTALS}/ram:RoundingAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'O', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-115': {
    id: 'BT-115', group: 'BG-22',
    label: "Montant dû ★",
    description: "Montant restant à payer (TTC moins acomptes moins arrondi)",
    xpath: `${_BASE.TOTALS}/ram:DuePayableAmount`,
    type: 'amount',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },

  // ── BG-23 : Ventilation TVA ───────────────────────────────────────────────
  'BT-116': {
    id: 'BT-116', group: 'BG-23',
    label: "Base imposable TVA",
    description: "Montant total imposable pour chaque catégorie de TVA",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:BasisAmount`,
    type: 'amount',
    profiles: { min: 'N', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-117': {
    id: 'BT-117', group: 'BG-23',
    label: "Montant TVA par catégorie ★",
    description: "Montant de TVA calculé pour chaque catégorie",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:CalculatedAmount`,
    type: 'amount',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-118': {
    id: 'BT-118', group: 'BG-23',
    label: "Code catégorie TVA ★",
    description: "Code de catégorie TVA (S=Standard, Z=Zéro, E=Exonéré, AE=Autoliquidation, K=Intracommunautaire…)",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:CategoryCode`,
    type: 'code',
    profiles: { min: 'M', bwl: 'M', bas: 'M', en: 'M', ext: 'M' },
    codeList: 'VATEX / EN 16931',
  },
  'BT-119': {
    id: 'BT-119', group: 'BG-23',
    label: "Taux de TVA",
    description: "Taux de TVA applicable en pourcentage (ex: 20, 10, 5.5, 2.1 pour la France)",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:RateApplicablePercent`,
    type: 'percent',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Requis si catégorie S ou Z"
  },
  'BT-120': {
    id: 'BT-120', group: 'BG-23',
    label: "Motif d'exonération TVA",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:ExemptionReason`,
    type: 'text',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    condition: "Requis si catégorie E (exonéré)"
  },
  'BT-121': {
    id: 'BT-121', group: 'BG-23',
    label: "Code motif d'exonération",
    xpath: `${_BASE.SETTLEMENT}/ram:ApplicableTradeTax/ram:ExemptionReasonCode`,
    type: 'code',
    profiles: { min: 'N', bwl: 'C', bas: 'C', en: 'C', ext: 'C' },
    codeList: 'VATEX',
  },

  // ── BG-24 : Documents joints ──────────────────────────────────────────────
  'BT-122': {
    id: 'BT-122', group: 'BG-24',
    label: "Référence document justificatif",
    xpath: `${_BASE.SETTLEMENT}/ram:AdditionalReferencedDocument/ram:IssuerAssignedID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-123': {
    id: 'BT-123', group: 'BG-24',
    label: "Description document justificatif",
    xpath: `${_BASE.SETTLEMENT}/ram:AdditionalReferencedDocument/ram:Name`,
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-124': {
    id: 'BT-124', group: 'BG-24',
    label: "URL document externe",
    xpath: `${_BASE.SETTLEMENT}/ram:AdditionalReferencedDocument/ram:URIID`,
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },

};

// ── Champs de lignes (BG-25) – structure répétée ──────────────────────────────
const LINE_FIELDS = {
  'BT-126': {
    id: 'BT-126', group: 'BG-25',
    label: "Identifiant de la ligne ★",
    xpath: 'ram:AssociatedDocumentLineDocument/ram:LineID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-127': {
    id: 'BT-127', group: 'BG-25',
    label: "Note sur la ligne",
    xpath: 'ram:AssociatedDocumentLineDocument/ram:IncludedNote/ram:Content',
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-128': {
    id: 'BT-128', group: 'BG-25',
    label: "Identifiant objet de la ligne",
    xpath: 'ram:AssociatedDocumentLineDocument/ram:AdditionalReferencedDocument/ram:IssuerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-129': {
    id: 'BT-129', group: 'BG-25',
    label: "Quantité facturée ★",
    xpath: 'ram:SpecifiedLineTradeDelivery/ram:BilledQuantity',
    type: 'quantity',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-130': {
    id: 'BT-130', group: 'BG-25',
    label: "Unité de mesure",
    xpath: 'ram:SpecifiedLineTradeDelivery/ram:BilledQuantity/@unitCode',
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
    codeList: 'UN/ECE Rec 20',
  },
  'BT-131': {
    id: 'BT-131', group: 'BG-25',
    label: "Montant net de la ligne ★",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeSettlementLineMonetarySummation/ram:LineTotalAmount',
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-132': {
    id: 'BT-132', group: 'BG-25',
    label: "Référence ligne bon de commande",
    xpath: 'ram:SpecifiedLineTradeAgreement/ram:BuyerOrderReferencedDocument/ram:LineID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-133': {
    id: 'BT-133', group: 'BG-25',
    label: "Référence comptable ligne",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:ReceivableSpecifiedTradeAccountingAccount/ram:ID',
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  // BG-29 : Prix
  'BT-146': {
    id: 'BT-146', group: 'BG-29',
    label: "Prix net unitaire ★",
    xpath: 'ram:SpecifiedLineTradeAgreement/ram:NetPriceProductTradePrice/ram:ChargeAmount',
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-147': {
    id: 'BT-147', group: 'BG-29',
    label: "Remise sur prix brut",
    xpath: 'ram:SpecifiedLineTradeAgreement/ram:GrossPriceProductTradePrice/ram:AppliedTradeAllowanceCharge/ram:ActualAmount',
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-148': {
    id: 'BT-148', group: 'BG-29',
    label: "Prix brut unitaire",
    xpath: 'ram:SpecifiedLineTradeAgreement/ram:GrossPriceProductTradePrice/ram:ChargeAmount',
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-149': {
    id: 'BT-149', group: 'BG-29',
    label: "Quantité de base du prix",
    xpath: 'ram:SpecifiedLineTradeAgreement/ram:NetPriceProductTradePrice/ram:BasisQuantity',
    type: 'quantity',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  // BG-30 : TVA ligne
  'BT-151': {
    id: 'BT-151', group: 'BG-30',
    label: "Code TVA article ★",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:ApplicableTradeTax/ram:CategoryCode',
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-152': {
    id: 'BT-152', group: 'BG-30',
    label: "Taux TVA article",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:ApplicableTradeTax/ram:RateApplicablePercent',
    type: 'percent',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  // BG-31 : Article
  'BT-153': {
    id: 'BT-153', group: 'BG-31',
    label: "Nom de l'article ★",
    xpath: 'ram:SpecifiedTradeProduct/ram:Name',
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'M', en: 'M', ext: 'M' },
  },
  'BT-154': {
    id: 'BT-154', group: 'BG-31',
    label: "Description de l'article",
    xpath: 'ram:SpecifiedTradeProduct/ram:Description',
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-155': {
    id: 'BT-155', group: 'BG-31',
    label: "Référence vendeur de l'article",
    xpath: 'ram:SpecifiedTradeProduct/ram:SellerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-156': {
    id: 'BT-156', group: 'BG-31',
    label: "Référence acheteur de l'article",
    xpath: 'ram:SpecifiedTradeProduct/ram:BuyerAssignedID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-157': {
    id: 'BT-157', group: 'BG-31',
    label: "Code article (standard)",
    description: "Identifiant standard de l'article (ex: GTIN/EAN)",
    xpath: 'ram:SpecifiedTradeProduct/ram:GlobalID',
    type: 'identifier',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-158': {
    id: 'BT-158', group: 'BG-31',
    label: "Classification de l'article",
    xpath: 'ram:SpecifiedTradeProduct/ram:DesignatedProductClassification/ram:ClassCode',
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-159': {
    id: 'BT-159', group: 'BG-31',
    label: "Pays d'origine de l'article",
    xpath: 'ram:SpecifiedTradeProduct/ram:OriginTradeCountry/ram:ID',
    type: 'code',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
    codeList: 'ISO 3166-1 alpha-2',
  },
  // BG-26 : Période ligne
  'BT-134': {
    id: 'BT-134', group: 'BG-26',
    label: "Début de période de la ligne",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:BillingSpecifiedPeriod/ram:StartDateTime/udt:DateTimeString',
    type: 'date',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-135': {
    id: 'BT-135', group: 'BG-26',
    label: "Fin de période de la ligne",
    xpath: 'ram:SpecifiedLineTradeSettlement/ram:BillingSpecifiedPeriod/ram:EndDateTime/udt:DateTimeString',
    type: 'date',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  // BG-27 : Remise ligne
  'BT-136': {
    id: 'BT-136', group: 'BG-27',
    label: "Montant remise sur ligne",
    xpath: "ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:ActualAmount",
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-139': {
    id: 'BT-139', group: 'BG-27',
    label: "Motif de la remise sur ligne",
    xpath: "ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='false']/ram:Reason",
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
  // BG-28 : Frais ligne
  'BT-141': {
    id: 'BT-141', group: 'BG-28',
    label: "Montant frais sur ligne",
    xpath: "ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='true']/ram:ActualAmount",
    type: 'amount',
    profiles: { min: 'N', bwl: 'N', bas: 'O', en: 'O', ext: 'O' },
  },
  'BT-144': {
    id: 'BT-144', group: 'BG-28',
    label: "Motif des frais sur ligne",
    xpath: "ram:SpecifiedLineTradeSettlement/ram:SpecifiedTradeAllowanceCharge[ram:ChargeIndicator/udt:Indicator='true']/ram:Reason",
    type: 'text',
    profiles: { min: 'N', bwl: 'N', bas: 'C', en: 'C', ext: 'C' },
  },
};

// ─── Code lists for tooltips ──────────────────────────────────────────────────
const CODE_DESCRIPTIONS = {
  // Invoice type codes (BT-3) - UNTDID 1001
  '380': 'Facture commerciale',
  '381': 'Avoir (note de crédit)',
  '382': 'Facture de commission',
  '383': 'Facture de débit',
  '384': 'Facture corrective',
  '386': 'Facture de préparation',
  '387': 'Feuille de voyage',
  '388': 'Note de débit',
  '389': 'Facture de location',
  '393': 'Note de débit à facturation loyer',
  '394': 'Note de crédit à facturation loyer',
  '395': 'Facture de crédit',
  '396': 'Facture débit facturation loyer',
  '532': 'Facture partielle (acompte)',

  // VAT category codes (BT-118)
  'S':  'TVA standard',
  'Z':  'TVA taux zéro',
  'E':  'Exonéré de TVA',
  'AE': 'Autoliquidation (Reverse Charge)',
  'K':  'Livraison intracommunautaire exonérée',
  'G':  'Exportation hors UE',
  'O':  'Hors champ TVA',
  'L':  'TVA taux réduit Iles Canaries (IGIC)',
  'M':  'TVA taux réduit Ceuta/Melilla (IPSI)',

  // Payment means codes (BT-81) - UNTDID 4461
  '10': 'Espèces',
  '20': 'Chèque',
  '30': 'Virement bancaire',
  '42': 'Paiement par compte bancaire',
  '48': 'Carte de crédit',
  '49': 'Prélèvement direct',
  '57': 'Virement permanent',
  '58': 'Virement SEPA (SCT)',
  '59': 'Prélèvement SEPA (SDD)',
  '97': 'Compensation',
};
