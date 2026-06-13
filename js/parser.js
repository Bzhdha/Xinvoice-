/**
 * Parseur FacturX – extraction PDF et analyse XML CII
 */

// ─── Namespaces CII ───────────────────────────────────────────────────────────
const CII_NS = {
  rsm: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
  ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
  udt: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
  qdt: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
};

function nsResolver(prefix) {
  return CII_NS[prefix] || null;
}

// ─── XPath helpers ────────────────────────────────────────────────────────────
function xpathTexte(doc, xpath, ctx) {
  try {
    const res = doc.evaluate(xpath, ctx || doc, nsResolver, XPathResult.STRING_TYPE, null);
    return res.stringValue?.trim() || null;
  } catch { return null; }
}

function xpathNoeud(doc, xpath, ctx) {
  try {
    const res = doc.evaluate(xpath, ctx || doc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return res.singleNodeValue;
  } catch { return null; }
}

function xpathNoeuds(doc, xpath, ctx) {
  try {
    const res = doc.evaluate(xpath, ctx || doc, nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const liste = [];
    for (let i = 0; i < res.snapshotLength; i++) liste.push(res.snapshotItem(i));
    return liste;
  } catch { return []; }
}

function xpathAttr(doc, xpath, attr, ctx) {
  const noeud = xpathNoeud(doc, xpath, ctx);
  return noeud ? noeud.getAttribute(attr) : null;
}

// ─── Extraction PDF ────────────────────────────────────────────────────────────
async function extraireXmlDepuisPdf(arrayBuffer) {
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  const task = pdfjsLib.getDocument({ data: arrayBuffer });

  let pdf;
  try {
    pdf = await task.promise;
  } catch (e) {
    throw new Error(`Impossible de lire le PDF : ${e.message}`);
  }

  // Chercher les pièces jointes (embedded files)
  const pieces = await pdf.getAttachments();
  if (pieces) {
    for (const [nom, piece] of Object.entries(pieces)) {
      const nomMin = nom.toLowerCase();
      if (
        nomMin.includes('factur-x') || nomMin.includes('facturx') ||
        nomMin.includes('zugferd') || nomMin.includes('xrechnung') ||
        nomMin.includes('order-x') || nomMin === 'invoice.xml' ||
        (nomMin.endsWith('.xml') && !nomMin.includes('thumbnail'))
      ) {
        try {
          const texte = new TextDecoder('utf-8').decode(piece.content);
          return { nom, contenu: texte, source: 'attachment' };
        } catch (e) {
          const texte = new TextDecoder('iso-8859-1').decode(piece.content);
          return { nom, contenu: texte, source: 'attachment' };
        }
      }
    }
  }

  // Fallback: chercher dans les métadonnées XMP ou le flux PDF
  try {
    const meta = await pdf.getMetadata();
    if (meta?.info?.Custom) {
      for (const [k, v] of Object.entries(meta.info.Custom)) {
        if (typeof v === 'string' && v.includes('CrossIndustryInvoice')) {
          return { nom: 'metadata', contenu: v, source: 'metadata' };
        }
      }
    }
  } catch {}

  return null;
}

// ─── Analyse XML CII ──────────────────────────────────────────────────────────
function analyserXmlCII(xmlTexte) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlTexte, 'application/xml');

  // Vérifier erreur XML
  const erreur = doc.querySelector('parsererror');
  if (erreur) {
    throw new Error(`XML invalide : ${erreur.textContent.substring(0, 200)}`);
  }

  // Vérifier namespace CrossIndustryInvoice
  const racine = doc.documentElement;
  const estCII = racine.localName === 'CrossIndustryInvoice' ||
    racine.namespaceURI?.includes('CrossIndustryInvoice');

  if (!estCII) {
    // Essayer UBL
    const estUBL = racine.localName === 'Invoice' || racine.localName === 'CreditNote';
    if (estUBL) {
      return analyserXmlUBL(doc, xmlTexte);
    }
    throw new Error(`Format XML non reconnu. Racine : <${racine.localName}>. Attendu : CrossIndustryInvoice (CII) ou Invoice (UBL).`);
  }

  return extraireChampsCII(doc, xmlTexte);
}

// ─── Extraction des champs CII ────────────────────────────────────────────────
function extraireChampsCII(doc, xmlTexte) {
  const champs = {};
  const avertissements = [];

  // ── Extraction de chaque field défini ──
  for (const [btId, field] of Object.entries(FIELDS)) {
    const valeur = xpathTexte(doc, field.xpath);
    if (valeur) {
      champs[btId] = { valeur, present: true, source: field.xpath };
    } else {
      champs[btId] = { valeur: null, present: false, source: field.xpath };
    }
  }

  // ── Champs spéciaux avec attributs ──
  // BT-34 schemeID
  const uriVendeur = xpathNoeud(doc, `//ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/ram:URIUniversalCommunication/ram:URIID`);
  if (uriVendeur) {
    champs['BT-34'].valeur = uriVendeur.textContent?.trim();
    champs['BT-34'].schema = uriVendeur.getAttribute('schemeID');
    champs['BT-34'].present = true;
  }

  // BT-30 schemeID
  const siren = xpathNoeud(doc, `//ram:ApplicableHeaderTradeAgreement/ram:SellerTradeParty/ram:SpecifiedLegalOrganization/ram:ID`);
  if (siren) {
    champs['BT-30'].valeur = siren.textContent?.trim();
    champs['BT-30'].schema = siren.getAttribute('schemeID');
    champs['BT-30'].present = true;
  }

  // BT-47 schemeID
  const sirenAcheteur = xpathNoeud(doc, `//ram:ApplicableHeaderTradeAgreement/ram:BuyerTradeParty/ram:SpecifiedLegalOrganization/ram:ID`);
  if (sirenAcheteur) {
    champs['BT-47'].valeur = sirenAcheteur.textContent?.trim();
    champs['BT-47'].schema = sirenAcheteur.getAttribute('schemeID');
    champs['BT-47'].present = true;
  }

  // BT-2 format date
  const dateNoeud = xpathNoeud(doc, '//rsm:ExchangedDocument/ram:IssueDateTime/udt:DateTimeString');
  if (dateNoeud) {
    champs['BT-2'].valeur = formaterDate(dateNoeud.textContent?.trim());
    champs['BT-2'].valeurBrute = dateNoeud.textContent?.trim();
    champs['BT-2'].format = dateNoeud.getAttribute('format');
    champs['BT-2'].present = true;
  }

  // BT-110 (peut avoir currencyID)
  const tvaTotal = xpathNoeud(doc, `//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradeSettlementHeaderMonetarySummation/ram:TaxTotalAmount`);
  if (tvaTotal) {
    champs['BT-110'].valeur = tvaTotal.textContent?.trim();
    champs['BT-110'].devise = tvaTotal.getAttribute('currencyID');
    champs['BT-110'].present = true;
  }

  // ── Lignes de facture (BG-25) ──
  const lignes = xpathNoeuds(doc, '//rsm:SupplyChainTradeTransaction/ram:IncludedSupplyChainTradeLineItem');
  const lignesExtraites = [];

  for (const ligne of lignes) {
    const champsLigne = {};
    for (const [btId, field] of Object.entries(LINE_FIELDS)) {
      // Les XPaths dans LINE_FIELDS sont relatifs au noeud ligne
      const valeur = xpathTexte(doc, field.xpath, ligne);
      // Attribut unitCode pour BT-130
      if (btId === 'BT-130') {
        const qtyNoeud = xpathNoeud(doc, 'ram:SpecifiedLineTradeDelivery/ram:BilledQuantity', ligne);
        champsLigne[btId] = {
          valeur: qtyNoeud?.textContent?.trim() || null,
          unitCode: qtyNoeud?.getAttribute('unitCode') || null,
          present: !!qtyNoeud,
        };
      } else {
        champsLigne[btId] = { valeur: valeur || null, present: !!valeur };
      }
    }

    // Numéro de ligne
    const lineId = xpathTexte(doc, 'ram:AssociatedDocumentLineDocument/ram:LineID', ligne);
    lignesExtraites.push({ id: lineId || `L${lignesExtraites.length + 1}`, champs: champsLigne });
  }

  // ── Ventilation TVA (BG-23) – plusieurs occurrences ──
  const tvaNoeuds = xpathNoeuds(doc, '//ram:ApplicableHeaderTradeSettlement/ram:ApplicableTradeTax');
  const tvaVentilation = [];
  for (const tNode of tvaNoeuds) {
    tvaVentilation.push({
      base:       xpathTexte(doc, 'ram:BasisAmount', tNode),
      montant:    xpathTexte(doc, 'ram:CalculatedAmount', tNode),
      categorie:  xpathTexte(doc, 'ram:CategoryCode', tNode),
      taux:       xpathTexte(doc, 'ram:RateApplicablePercent', tNode),
      motif:      xpathTexte(doc, 'ram:ExemptionReason', tNode),
      codMotif:   xpathTexte(doc, 'ram:ExemptionReasonCode', tNode),
      typeCode:   xpathTexte(doc, 'ram:TypeCode', tNode),
    });
  }

  // ── Remises et frais document ──
  const remises = xpathNoeuds(doc, `//ram:ApplicableHeaderTradeSettlement/ram:SpecifiedTradeAllowanceCharge`);
  const remisesDoc = [];
  for (const r of remises) {
    const indicateur = xpathTexte(doc, 'ram:ChargeIndicator/udt:Indicator', r);
    remisesDoc.push({
      type:       indicateur === 'true' ? 'frais' : 'remise',
      montant:    xpathTexte(doc, 'ram:ActualAmount', r),
      base:       xpathTexte(doc, 'ram:BasisAmount', r),
      pourcent:   xpathTexte(doc, 'ram:CalculationPercent', r),
      motif:      xpathTexte(doc, 'ram:Reason', r),
      codeMotif:  xpathTexte(doc, 'ram:ReasonCode', r),
      codeTVA:    xpathTexte(doc, 'ram:CategoryTradeTax/ram:CategoryCode', r),
      tauxTVA:    xpathTexte(doc, 'ram:CategoryTradeTax/ram:RateApplicablePercent', r),
    });
  }

  // ── Notes du document ──
  const notes = xpathNoeuds(doc, '//rsm:ExchangedDocument/ram:IncludedNote');
  const notesDoc = [];
  for (const n of notes) {
    notesDoc.push({
      contenu: xpathTexte(doc, 'ram:Content', n),
      sujet:   xpathTexte(doc, 'ram:SubjectCode', n),
    });
  }
  if (notesDoc.length > 0) {
    champs['BT-22'].valeur = notesDoc.map(n => n.contenu).filter(Boolean).join(' | ');
    champs['BT-22'].notesCompletes = notesDoc;
    champs['BT-22'].present = notesDoc.some(n => n.contenu);
  }

  // ── Documents joints (BG-24) ──
  const docsJoints = xpathNoeuds(doc, '//ram:ApplicableHeaderTradeSettlement/ram:AdditionalReferencedDocument');
  const docsJointsExtrait = [];
  for (const d of docsJoints) {
    docsJointsExtrait.push({
      reference:   xpathTexte(doc, 'ram:IssuerAssignedID', d),
      nom:         xpathTexte(doc, 'ram:Name', d),
      uri:         xpathTexte(doc, 'ram:URIID', d),
      typeCode:    xpathTexte(doc, 'ram:TypeCode', d),
    });
  }

  // ── Profil détecté ──
  const urnProfil = champs['BT-24']?.valeur;
  const profilDetecte = detectProfileFromUrn(urnProfil);

  return {
    format: 'CII',
    xmlTexte,
    champs,
    lignes: lignesExtraites,
    tvaVentilation,
    remisesDoc,
    notesDoc,
    docsJoints: docsJointsExtrait,
    profilDetecte,
    urnProfil,
    nbLignes: lignesExtraites.length,
  };
}

// ─── Fallback UBL ─────────────────────────────────────────────────────────────
function analyserXmlUBL(doc, xmlTexte) {
  // Mapping basique UBL → BT (pour signalement, pas d'analyse complète)
  const champs = {};
  const ns = { cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2' };

  function ublText(xpath) {
    try {
      const r = doc.evaluate(xpath, doc, p => ns[p] || null, XPathResult.STRING_TYPE, null);
      return r.stringValue?.trim() || null;
    } catch { return null; }
  }

  champs['BT-1']  = { valeur: ublText('//cbc:ID'), present: true };
  champs['BT-3']  = { valeur: ublText('//cbc:InvoiceTypeCode'), present: true };
  champs['BT-2']  = { valeur: ublText('//cbc:IssueDate'), present: true };
  champs['BT-5']  = { valeur: ublText('//cbc:DocumentCurrencyCode'), present: true };

  for (const [btId, field] of Object.entries(FIELDS)) {
    if (!champs[btId]) champs[btId] = { valeur: null, present: false };
  }

  return {
    format: 'UBL',
    xmlTexte,
    champs,
    lignes: [],
    tvaVentilation: [],
    remisesDoc: [],
    notesDoc: [],
    docsJoints: [],
    profilDetecte: null,
    urnProfil: null,
    nbLignes: 0,
    avertissement: 'Format UBL détecté. L\'analyse complète FacturX nécessite le format CII. Les champs principaux ont été extraits.',
  };
}

// ─── Validation par profil ─────────────────────────────────────────────────────
function validerParProfil(resultat, profilId) {
  const champsMandatoires = [];
  const champsManquants = [];
  const champsConditionnels = [];

  const tousFieds = { ...FIELDS };

  for (const [btId, field] of Object.entries(tousFieds)) {
    const niveau = field.profiles[profilId];
    const present = resultat.champs[btId]?.present;

    if (niveau === 'M') {
      champsMandatoires.push(btId);
      if (!present) champsManquants.push({ btId, field, niveau });
    } else if (niveau === 'C') {
      champsConditionnels.push({ btId, field, present });
    }
  }

  // Champs de ligne si profil >= basic
  if (['bas', 'en', 'ext'].includes(profilId) && resultat.lignes.length > 0) {
    for (const ligne of resultat.lignes) {
      for (const [btId, field] of Object.entries(LINE_FIELDS)) {
        const niveau = field.profiles[profilId];
        const present = ligne.champs[btId]?.present;
        if (niveau === 'M' && !present) {
          champsManquants.push({ btId, field, niveau, ligne: ligne.id });
        }
      }
    }
  }

  // Score de conformité
  const totalMandatoires = champsMandatoires.length;
  const manquants = champsManquants.filter(c => !c.ligne).length;
  const scoreConformite = totalMandatoires > 0
    ? Math.round(((totalMandatoires - manquants) / totalMandatoires) * 100)
    : 100;

  return {
    profilId,
    profil: PROFILES[profilId],
    scoreConformite,
    champsMandatoires,
    champsManquants,
    champsConditionnels,
    conforme: champsManquants.length === 0,
  };
}

// ─── Vérifications de cohérence ────────────────────────────────────────────────
function verifierCoherence(resultat) {
  const alertes = [];

  const v = (btId) => resultat.champs[btId]?.valeur;
  const montant = (s) => parseFloat(s?.replace(',', '.') || '0');

  // Cohérence des totaux
  const ttc  = montant(v('BT-112'));
  const tva  = montant(v('BT-110'));
  const ht   = montant(v('BT-109'));
  const due  = montant(v('BT-115'));
  const paye = montant(v('BT-113') || '0');
  const arrd = montant(v('BT-114') || '0');

  if (ht > 0 && tva >= 0 && ttc > 0) {
    const diffTtc = Math.abs(ht + tva - ttc);
    if (diffTtc > 0.02) {
      alertes.push({
        niveau: 'erreur',
        message: `Incohérence des totaux : HT (${ht}) + TVA (${tva}) ≠ TTC (${ttc}) [écart : ${diffTtc.toFixed(2)}]`,
        champs: ['BT-109', 'BT-110', 'BT-112'],
      });
    }

    const diffDue = Math.abs(ttc - paye - arrd - due);
    if (diffDue > 0.02 && due > 0) {
      alertes.push({
        niveau: 'avertissement',
        message: `Montant dû (${due}) ≠ TTC (${ttc}) − Déjà payé (${paye}) − Arrondi (${arrd})`,
        champs: ['BT-112', 'BT-113', 'BT-114', 'BT-115'],
      });
    }
  }

  // TVA : cohérence ventilation
  let sommeTvaVentilees = 0;
  for (const tva_v of resultat.tvaVentilation) {
    sommeTvaVentilees += montant(tva_v.montant);
  }
  if (tva > 0 && Math.abs(sommeTvaVentilees - tva) > 0.02) {
    alertes.push({
      niveau: 'avertissement',
      message: `Somme des TVA ventilées (${sommeTvaVentilees.toFixed(2)}) ≠ Total TVA (${tva.toFixed(2)})`,
      champs: ['BT-110', 'BT-117'],
    });
  }

  // TVA : taux incohérent
  for (const tva_v of resultat.tvaVentilation) {
    const base = montant(tva_v.base);
    const montantTva = montant(tva_v.montant);
    const taux = parseFloat(tva_v.taux || '0');
    if (base > 0 && taux > 0 && montantTva > 0) {
      const attendu = base * taux / 100;
      if (Math.abs(attendu - montantTva) > 0.02) {
        alertes.push({
          niveau: 'avertissement',
          message: `TVA catégorie ${tva_v.categorie} : base (${base}) × ${taux}% = ${attendu.toFixed(2)} ≠ ${montantTva.toFixed(2)}`,
          champs: ['BT-116', 'BT-117', 'BT-119'],
        });
      }
    }
  }

  // Date cohérence
  const dateFacture = v('BT-2');
  const dateEcheance = v('BT-9');
  if (dateFacture && dateEcheance && dateEcheance < dateFacture) {
    alertes.push({
      niveau: 'avertissement',
      message: `Date d'échéance (${dateEcheance}) antérieure à la date de facture (${dateFacture})`,
      champs: ['BT-2', 'BT-9'],
    });
  }

  // Avoir : référence facture initiale
  const typeCode = v('BT-3');
  if (typeCode === '381' || typeCode === '384') {
    if (!v('BT-25')) {
      alertes.push({
        niveau: 'erreur',
        message: `Avoir/facture corrective (TypeCode ${typeCode}) sans référence à la facture initiale (BT-25)`,
        champs: ['BT-25', 'BT-3'],
      });
    }
  }

  // Autoliquidation : TVA = 0
  const categoriesTva = resultat.tvaVentilation.map(t => t.categorie);
  if (categoriesTva.includes('AE')) {
    const tvaAutoliquidee = resultat.tvaVentilation
      .filter(t => t.categorie === 'AE')
      .reduce((s, t) => s + montant(t.montant), 0);
    if (Math.abs(tvaAutoliquidee) > 0.01) {
      alertes.push({
        niveau: 'avertissement',
        message: `Autoliquidation (AE) : le montant de TVA devrait être 0 (trouvé : ${tvaAutoliquidee})`,
        champs: ['BT-117', 'BT-118'],
      });
    }
  }

  // Lignes : total ≠ somme des lignes
  if (resultat.lignes.length > 0 && v('BT-106')) {
    let sommeLignes = 0;
    for (const ligne of resultat.lignes) {
      sommeLignes += montant(ligne.champs['BT-131']?.valeur);
    }
    const totalLignes = montant(v('BT-106'));
    if (Math.abs(sommeLignes - totalLignes) > 0.02) {
      alertes.push({
        niveau: 'avertissement',
        message: `Somme des montants nets de lignes (${sommeLignes.toFixed(2)}) ≠ BT-106 (${totalLignes.toFixed(2)})`,
        champs: ['BT-106', 'BT-131'],
      });
    }
  }

  return alertes;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function formaterDate(dateStr) {
  if (!dateStr) return null;
  // Format YYYYMMDD → JJ/MM/AAAA
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}`;
  }
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function formaterMontant(valeur, devise) {
  if (!valeur) return null;
  const nb = parseFloat(valeur.replace(',', '.'));
  if (isNaN(nb)) return valeur;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise || 'EUR',
      minimumFractionDigits: 2,
    }).format(nb);
  } catch {
    return `${nb.toFixed(2)} ${devise || 'EUR'}`;
  }
}

// ─── Point d'entrée principal ─────────────────────────────────────────────────
async function analyserFichier(fichier) {
  let xmlTexte = null;
  let nomFichierXml = null;
  let sourceXml = null;

  if (fichier.type === 'application/pdf' || fichier.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await fichier.arrayBuffer();
    const extraction = await extraireXmlDepuisPdf(buffer);
    if (!extraction) {
      throw new Error('Aucun fichier XML FacturX trouvé dans ce PDF. Vérifiez que c\'est bien une facture FacturX / ZUGFeRD.');
    }
    xmlTexte = extraction.contenu;
    nomFichierXml = extraction.nom;
    sourceXml = extraction.source;
  } else if (fichier.name.toLowerCase().endsWith('.xml') || fichier.type.includes('xml')) {
    xmlTexte = await fichier.text();
    nomFichierXml = fichier.name;
    sourceXml = 'fichier_xml';
  } else {
    throw new Error(`Format de fichier non supporté : ${fichier.type || fichier.name}. Déposez un fichier PDF (FacturX) ou XML (CII).`);
  }

  const resultat = analyserXmlCII(xmlTexte);
  resultat.nomFichierXml = nomFichierXml;
  resultat.sourceXml = sourceXml;

  // Validation par profil déclaré
  if (resultat.profilDetecte) {
    resultat.validation = validerParProfil(resultat, resultat.profilDetecte);
  }

  // Validations pour tous les profils (comparatif)
  resultat.validationParProfil = {};
  for (const pid of PROFILE_ORDER) {
    resultat.validationParProfil[pid] = validerParProfil(resultat, pid);
  }

  // Cohérence des montants
  resultat.alertes = verifierCoherence(resultat);

  // Détection cas d'usage
  const champsPresents = {};
  for (const [btId, c] of Object.entries(resultat.champs)) {
    if (c.present) champsPresents[btId] = c.valeur;
  }
  resultat.casUsageDetectes = detecterCasUsage(champsPresents);

  return resultat;
}
