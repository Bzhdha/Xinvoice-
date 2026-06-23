/**
 * Application FacturX Analyzer – logique principale (tout en français)
 */

// ─── Aide simplifiée par BT (pour assistantes ventes / paiements) ─────────────
const BT_AIDE = {
  /* ── Identification facture ── */
  'BT-1':  { aide: 'Le numéro unique qui identifie cette facture. Chaque facture émise doit avoir un numéro distinct et chronologique.' },
  'BT-2':  { aide: 'La date à laquelle la facture a été émise par le fournisseur.' },
  'BT-3':  { aide: 'Le type de document envoyé.',
    valeurs: [
      { code:'380', libelle:'Facture – document de vente standard' },
      { code:'381', libelle:'Avoir – remboursement ou annulation partielle d\'une facture' },
      { code:'384', libelle:'Facture corrective – corrige et remplace une facture erronée' },
      { code:'386', libelle:'Facture d\'acompte – paiement partiel demandé avant la livraison' },
      { code:'383', libelle:'Note de débit – somme réclamée par l\'acheteur au vendeur' },
      { code:'532', libelle:'Facture pour livraison ou prestation partielle' },
    ]},
  'BT-5':  { aide: 'La monnaie dans laquelle sont exprimés tous les montants de la facture.',
    valeurs: [
      { code:'EUR', libelle:'Euro (France et zone euro)' },
      { code:'USD', libelle:'Dollar américain' },
      { code:'GBP', libelle:'Livre sterling (Royaume-Uni)' },
      { code:'CHF', libelle:'Franc suisse' },
    ]},
  'BT-9':  { aide: 'La date limite avant laquelle le paiement doit être reçu par le fournisseur.' },
  'BT-10': { aide: 'La référence interne de l\'acheteur à faire figurer sur la facture (code service, centre de coût, numéro d\'imputation…).' },
  'BT-11': { aide: 'Le numéro du projet ou du marché auquel se rattache cette facture.' },
  'BT-12': { aide: 'Le numéro du contrat commercial entre le fournisseur et l\'acheteur.' },
  'BT-13': { aide: 'Le numéro du bon de commande émis par l\'acheteur pour cet achat.' },
  'BT-14': { aide: 'Le numéro de commande émis par le fournisseur (numéro d\'ordre de vente).' },
  'BT-15': { aide: 'Le numéro de l\'avis de réception signé par l\'acheteur à la livraison.' },
  'BT-16': { aide: 'Le numéro du bon de livraison ou avis d\'expédition du fournisseur.' },
  'BT-19': { aide: 'La référence comptable fournie par l\'acheteur pour imputer la charge dans sa comptabilité.' },
  'BT-20': { aide: 'Le texte décrivant les délais et conditions de paiement (ex : "30 jours net", "Paiement à réception", "Escompte 2% si paiement avant le 10").' },
  'BT-22': { aide: 'Un commentaire ou une information complémentaire libre ajouté à la facture (mentions légales, instructions, précisions…).' },
  'BT-25': { aide: 'Le numéro de la facture d\'origine à laquelle ce document fait référence (ex : numéro de la facture initiale pour un avoir ou une facture corrective).' },
  'BT-26': { aide: 'La date de la facture d\'origine référencée.' },
  /* ── Fournisseur ── */
  'BT-27': { aide: 'Le nom officiel (raison sociale) de l\'entreprise qui émet la facture (le fournisseur).' },
  'BT-28': { aide: 'Le nom commercial ou l\'enseigne du fournisseur, s\'il diffère de la raison sociale.' },
  'BT-29': { aide: 'Un identifiant propre au fournisseur (numéro client, code interne…).' },
  'BT-30': { aide: 'Le numéro SIREN (9 chiffres) ou SIRET (14 chiffres) du fournisseur, attribué par l\'INSEE et servant à l\'identifier légalement en France.' },
  'BT-31': { aide: 'Le numéro de TVA intracommunautaire du fournisseur (format FR suivi de 2 chiffres puis du SIREN). Obligatoire pour les factures soumises à TVA.' },
  'BT-32': { aide: 'Un autre identifiant fiscal du fournisseur (numéro fiscal national, si différent du numéro TVA).' },
  'BT-33': { aide: 'Informations juridiques complémentaires du fournisseur (forme juridique, montant du capital, numéro RCS…).' },
  'BT-34': { aide: 'L\'adresse e-mail du fournisseur utilisée pour la transmission électronique de la facture.' },
  'BT-41': { aide: 'Le nom de la personne à contacter chez le fournisseur pour toute question sur la facture.' },
  'BT-42': { aide: 'Le numéro de téléphone du contact chez le fournisseur.' },
  'BT-43': { aide: 'L\'adresse e-mail du contact chez le fournisseur.' },
  /* ── Acheteur ── */
  'BT-44': { aide: 'Le nom officiel (raison sociale) de l\'entreprise qui reçoit la facture (l\'acheteur).' },
  'BT-45': { aide: 'Le nom commercial ou l\'enseigne de l\'acheteur.' },
  'BT-46': { aide: 'Un identifiant propre à l\'acheteur (numéro fournisseur, code interne…).' },
  'BT-47': { aide: 'Le numéro SIREN ou SIRET de l\'acheteur.' },
  'BT-48': { aide: 'Le numéro de TVA intracommunautaire de l\'acheteur.' },
  'BT-49': { aide: 'L\'adresse e-mail de l\'acheteur pour la réception électronique de la facture.' },
  'BT-56': { aide: 'Le nom de la personne à contacter chez l\'acheteur.' },
  'BT-57': { aide: 'Le numéro de téléphone du contact chez l\'acheteur.' },
  'BT-58': { aide: 'L\'adresse e-mail du contact chez l\'acheteur.' },
  /* ── Bénéficiaire du paiement ── */
  'BT-59': { aide: 'Le nom de la personne ou société qui doit recevoir le paiement, si différent du fournisseur (ex : société d\'affacturage, organisme payeur tiers).' },
  'BT-60': { aide: 'L\'identifiant de la tierce partie bénéficiaire du paiement.' },
  'BT-61': { aide: 'Le numéro légal (SIREN/SIRET) de la tierce partie bénéficiaire.' },
  /* ── Représentant fiscal ── */
  'BT-62': { aide: 'Le nom du représentant fiscal du fournisseur dans le pays de taxation (utile pour les fournisseurs étrangers sans établissement en France).' },
  'BT-63': { aide: 'Le numéro de TVA du représentant fiscal du fournisseur.' },
  /* ── Livraison ── */
  'BT-70': { aide: 'Le nom de la personne, du service ou du site qui reçoit physiquement les marchandises ou la prestation.' },
  'BT-71': { aide: 'L\'identifiant du lieu de livraison (numéro GLN, code entrepôt…).' },
  'BT-72': { aide: 'La date à laquelle les marchandises ont été effectivement livrées ou la prestation réalisée.' },
  'BT-73': { aide: 'La date de début de la période couverte par la facturation (pour les abonnements, loyers, prestations continues…).' },
  'BT-74': { aide: 'La date de fin de la période couverte par cette facture.' },
  /* ── Paiement ── */
  'BT-81': { aide: 'Le moyen par lequel le paiement doit être ou a été effectué.',
    valeurs: [
      { code:'10',  libelle:'Espèces' },
      { code:'20',  libelle:'Chèque' },
      { code:'30',  libelle:'Virement bancaire (ordre de virement classique)' },
      { code:'48',  libelle:'Carte bancaire' },
      { code:'49',  libelle:'Prélèvement automatique' },
      { code:'57',  libelle:'Virement permanent' },
      { code:'58',  libelle:'Virement SEPA (zone euro)' },
      { code:'59',  libelle:'Prélèvement SEPA (zone euro)' },
    ]},
  'BT-82': { aide: 'Un texte libre précisant les modalités ou instructions de paiement.' },
  'BT-83': { aide: 'La référence à indiquer dans le libellé du virement pour que le fournisseur identifie le règlement (souvent le numéro de facture).' },
  'BT-84': { aide: 'Le numéro IBAN du compte bancaire sur lequel le virement doit être effectué.' },
  'BT-85': { aide: 'Le nom du titulaire du compte bancaire bénéficiaire du paiement.' },
  'BT-86': { aide: 'Le code BIC/SWIFT identifiant la banque du bénéficiaire (8 ou 11 caractères).' },
  'BT-87': { aide: 'Les 4 derniers chiffres de la carte bancaire utilisée (pas le numéro complet — uniquement pour permettre la traçabilité du paiement).' },
  'BT-88': { aide: 'Le nom du titulaire de la carte bancaire utilisée pour le paiement.' },
  'BT-89': { aide: 'La référence unique du mandat autorisant le fournisseur à prélever le compte de l\'acheteur.' },
  'BT-90': { aide: 'L\'Identifiant Créancier SEPA (ICS) du fournisseur, attribué par sa banque, nécessaire pour les prélèvements.' },
  'BT-91': { aide: 'L\'IBAN du compte bancaire de l\'acheteur qui sera prélevé.' },
  /* ── Remises et frais ── */
  'BT-92': { aide: 'Le montant de la remise accordée sur l\'ensemble de la facture (remise globale, hors remises par ligne).' },
  'BT-93': { aide: 'Le montant de base sur lequel le pourcentage de remise est calculé.' },
  'BT-94': { aide: 'Le pourcentage de remise accordé (ex : 5 pour 5%).' },
  'BT-97': { aide: 'L\'explication de la remise accordée (ex : "Remise fidélité", "Remise volume", "Escompte").' },
  'BT-99': { aide: 'Le montant des frais supplémentaires ajoutés à la facture (ex : frais de livraison, frais de dossier).' },
  'BT-104':{ aide: 'L\'explication des frais ajoutés (ex : "Frais de livraison express", "Frais de dossier").' },
  /* ── Totaux ── */
  'BT-106':{ aide: 'La somme des montants HT de toutes les lignes de la facture avant application des remises et frais globaux.' },
  'BT-107':{ aide: 'Le total des remises accordées sur l\'ensemble de la facture.' },
  'BT-108':{ aide: 'Le total des frais ajoutés sur l\'ensemble de la facture.' },
  'BT-109':{ aide: 'Le montant total de la facture hors TVA (base de calcul de la TVA).' },
  'BT-110':{ aide: 'Le montant total de TVA à payer sur cette facture.' },
  'BT-112':{ aide: 'Le montant total à payer TVA incluse (= total HT + TVA).' },
  'BT-113':{ aide: 'Les sommes déjà versées (acomptes) qui sont déduites du total TTC.' },
  'BT-115':{ aide: 'Le montant exact restant à payer par l\'acheteur, après déduction des acomptes éventuels.' },
  /* ── TVA ── */
  'BT-116':{ aide: 'Le montant sur lequel s\'applique le taux de TVA pour cette catégorie (base imposable).' },
  'BT-117':{ aide: 'Le montant de TVA calculé pour cette catégorie de taux.' },
  'BT-118':{ aide: 'La catégorie de TVA applicable à cette opération ou cette ligne.',
    valeurs: [
      { code:'S',  libelle:'TVA standard (20%, 10%, 5,5% ou 2,1% selon le produit ou service)' },
      { code:'Z',  libelle:'TVA à taux zéro (opération taxable mais à 0%)' },
      { code:'E',  libelle:'Exonéré de TVA (santé, éducation, certaines associations…)' },
      { code:'AE', libelle:'Autoliquidation : c\'est l\'acheteur qui déclare et paie la TVA (BTP sous-traitance, achats intracommunautaires)' },
      { code:'K',  libelle:'Livraison à un client assujetti dans un autre pays de l\'UE (exonérée en France)' },
      { code:'G',  libelle:'Exportation hors Union Européenne (exonérée de TVA française)' },
      { code:'O',  libelle:'Hors champ TVA (dividendes, subventions, opérations non taxables)' },
      { code:'M',  libelle:'Régime de la marge : TVA calculée sur la marge du revendeur, pas sur le prix total (biens d\'occasion, antiquités)' },
    ]},
  'BT-119':{ aide: 'Le taux de TVA appliqué en pourcentage.',
    valeurs: [
      { code:'20',  libelle:'20% – Taux normal (la plupart des biens et services)' },
      { code:'10',  libelle:'10% – Taux intermédiaire (restauration, hébergement, travaux résidentiels, droits d\'auteur…)' },
      { code:'5.5', libelle:'5,5% – Taux réduit (produits alimentaires, livres, équipements pour personnes handicapées…)' },
      { code:'2.1', libelle:'2,1% – Taux super-réduit (médicaments remboursables, presse)' },
      { code:'0',   libelle:'0% – Opération à taux zéro' },
    ]},
  'BT-120':{ aide: 'L\'explication en clair de la raison pour laquelle cette opération n\'est pas soumise à TVA (obligatoire si la catégorie TVA est "Exonéré").' },
  'BT-121':{ aide: 'Le code officiel du motif d\'exonération de TVA.',
    valeurs: [
      { code:'VATEX-EU-AE',        libelle:'Autoliquidation (BTP sous-traitance, achats intracommunautaires de services)' },
      { code:'VATEX-EU-IC',        libelle:'Livraison intracommunautaire exonérée (vente à un assujetti d\'un autre pays UE)' },
      { code:'VATEX-EU-G',         libelle:'Exportation hors Union Européenne' },
      { code:'VATEX-EU-O',         libelle:'Hors champ de la TVA' },
      { code:'VATEX-FR-FRANCHISE', libelle:'Franchise en base de TVA (petite entreprise sous seuil de chiffre d\'affaires)' },
    ]},
  /* ── Documents justificatifs ── */
  'BT-122':{ aide: 'La référence ou le nom d\'un document annexe joint ou lié à la facture (bon de livraison, devis, contrat, rapport d\'intervention…).' },
  'BT-123':{ aide: 'La description du document annexe référencé.' },
  'BT-124':{ aide: 'Le lien internet permettant d\'accéder au document annexe.' },
};

// ─── Tooltip BT enrichi ───────────────────────────────────────────────────────
function initTooltipBT() {
  const tip = document.createElement('div');
  tip.id = 'bt-tooltip';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  document.addEventListener('mouseover', (e) => {
    const cible = e.target.closest('[data-bt-id]');
    if (!cible) { tip.style.display = 'none'; return; }
    const btId = cible.dataset.btId;
    const field = FIELDS[btId];
    if (!field) return;
    const aide = BT_AIDE[btId];
    const label = (field.label || '').replace(' ★', '');
    let html = `<div class="tip-code">${escHtml(btId)}</div><div class="tip-label">${escHtml(label)}</div>`;
    const texte = aide?.aide || field.description || '';
    if (texte) html += `<div class="tip-aide">${escHtml(texte)}</div>`;
    if (aide?.valeurs?.length) {
      html += `<div class="tip-valeurs"><div class="tip-valeurs-titre">Valeurs possibles</div>` +
        aide.valeurs.map(v =>
          `<div class="tip-valeur"><span class="tip-vcode">${escHtml(v.code)}</span><span class="tip-vlibelle">${escHtml(v.libelle)}</span></div>`
        ).join('') + `</div>`;
    }
    tip.innerHTML = html;
    tip.style.display = 'block';
    _positionTooltip(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (tip.style.display !== 'none') _positionTooltip(e);
  });

  document.addEventListener('mouseleave', () => { tip.style.display = 'none'; }, true);

  function _positionTooltip(e) {
    const m = 14, tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = e.clientX + m, y = e.clientY + m;
    if (x + tw > window.innerWidth  - m) x = e.clientX - tw - m;
    if (y + th > window.innerHeight - m) y = e.clientY - th - m;
    tip.style.left = Math.max(m, x) + 'px';
    tip.style.top  = Math.max(m, y) + 'px';
  }
}

// ─── État global ─────────────────────────────────────────────────────────────
let etatApp = {
  resultat: null,
  ongletActif: 'synthese',
  profilCompare: null,
  casUsageSelectionne: null,
  roleSelectionne: null,
  etatWorkflowSelectionne: null,
  xmlVisible: false,
  ucChampsSelectionne: 'REF-NOMINAL',
};

// ─── Initialisation ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDragDrop();
  initOnglets();
  initCasUsage();
  initTooltipBT();
  document.getElementById('btn-explorer-exemple').addEventListener('click', chargerExemple);
});

// ─── Drag & Drop ──────────────────────────────────────────────────────────────
function initDragDrop() {
  const zone = document.getElementById('zone-depot');
  const input = document.getElementById('input-fichier');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('survol');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('survol'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('survol');
    const fichiers = e.dataTransfer.files;
    if (fichiers.length > 0) traiterFichier(fichiers[0]);
  });

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    if (e.target.files.length > 0) traiterFichier(e.target.files[0]);
  });
}

// ─── Traitement du fichier ─────────────────────────────────────────────────────
async function traiterFichier(fichier) {
  afficherChargement(`Analyse de ${fichier.name}…`);

  try {
    const resultat = await analyserFichier(fichier);
    etatApp.resultat = resultat;
    etatApp.ongletActif = 'synthese';
    afficherResultats(resultat);
  } catch (e) {
    afficherErreur(e.message);
  }
}

function afficherChargement(message) {
  document.getElementById('zone-depot').classList.add('cache');
  document.getElementById('section-resultats').classList.remove('cache');
  document.getElementById('section-resultats').innerHTML = `
    <div class="chargement">
      <div class="spinner"></div>
      <p>${escHtml(message)}</p>
    </div>`;
}

function afficherErreur(msg) {
  document.getElementById('zone-depot').classList.remove('cache');
  document.getElementById('section-resultats').classList.add('cache');
  document.getElementById('erreur-message').textContent = msg;
  document.getElementById('banniere-erreur').classList.remove('cache');
  setTimeout(() => document.getElementById('banniere-erreur').classList.add('cache'), 8000);
}

// ─── Rendu principal ──────────────────────────────────────────────────────────
function afficherResultats(r) {
  const sec = document.getElementById('section-resultats');
  sec.innerHTML = '';

  // L'onglet Champs démarre toujours sur le cas nominal de référence
  etatApp.ucChampsSelectionne = 'REF-NOMINAL';

  // En-tête facture
  sec.appendChild(creerEnteteFaturce(r));

  // Alertes cohérence
  if (r.alertes?.length > 0) {
    sec.appendChild(creerBanniereAlertes(r.alertes));
  }

  // Barre d'onglets
  sec.appendChild(creerOnglets());

  // Contenu des onglets
  const contenu = document.createElement('div');
  contenu.id = 'contenu-onglet';
  sec.appendChild(contenu);

  afficherOnglet(etatApp.ongletActif, r);

  // Bouton recommencer
  const btnReset = document.createElement('button');
  btnReset.className = 'btn-secondaire btn-reset';
  btnReset.textContent = '↩ Analyser une autre facture';
  btnReset.addEventListener('click', reinitialiser);
  sec.appendChild(btnReset);
}

function reinitialiser() {
  etatApp = { resultat: null, ongletActif: 'synthese', profilCompare: null,
    casUsageSelectionne: null, roleSelectionne: null, etatWorkflowSelectionne: null,
    xmlVisible: false, ucChampsSelectionne: 'REF-NOMINAL' };
  document.getElementById('zone-depot').classList.remove('cache');
  document.getElementById('section-resultats').classList.add('cache');
  document.getElementById('section-resultats').innerHTML = '';
  document.getElementById('input-fichier').value = '';
}

// ─── En-tête facture ──────────────────────────────────────────────────────────
function creerEnteteFaturce(r) {
  const v = (btId) => r.champs[btId]?.valeur;
  const profil = PROFILES[r.profilDetecte] || { label: 'Inconnu', id: '?' };
  const score = r.validation?.scoreConformite ?? '–';

  const el = document.createElement('div');
  el.className = 'entete-facture';
  el.innerHTML = `
    <div class="entete-identite">
      <div class="entete-numero">
        <span class="label-petit">Facture</span>
        <span class="valeur-grande">${escHtml(v('BT-1') || '–')}</span>
        ${v('BT-2') ? `<span class="date-facture"><span class="label-petit">Date d'émission</span> ${escHtml(v('BT-2'))}</span>` : ''}
      </div>
      <div class="entete-parties">
        <div class="partie vendeur">
          <span class="label-petit">Fournisseur</span>
          <strong>${escHtml(v('BT-27') || '–')}</strong>
          ${v('BT-30') ? `<small>SIREN : ${escHtml(v('BT-30'))}</small>` : ''}
          ${v('BT-31') ? `<small>TVA : ${escHtml(v('BT-31'))}</small>` : ''}
        </div>
        <div class="fleche-parties">→</div>
        <div class="partie acheteur">
          <span class="label-petit">Client</span>
          <strong>${escHtml(v('BT-44') || '–')}</strong>
          ${v('BT-47') ? `<small>SIREN : ${escHtml(v('BT-47'))}</small>` : ''}
          ${v('BT-48') ? `<small>TVA : ${escHtml(v('BT-48'))}</small>` : ''}
        </div>
      </div>
      <div class="entete-montants">
        ${v('BT-109') ? `<div class="montant-item"><span>HT</span><strong>${formaterMontant(v('BT-109'), v('BT-5'))}</strong></div>` : ''}
        ${v('BT-110') ? `<div class="montant-item"><span>TVA</span><strong>${formaterMontant(v('BT-110'), v('BT-5'))}</strong></div>` : ''}
        <div class="montant-item total"><span>TTC</span><strong>${formaterMontant(v('BT-112'), v('BT-5')) || '–'}</strong></div>
        ${v('BT-115') ? `<div class="montant-item due"><span>À payer</span><strong>${formaterMontant(v('BT-115'), v('BT-5'))}</strong></div>` : ''}
      </div>
    </div>
    <div class="entete-meta">
      <div class="badge-type">
        <span class="badge-label">Type</span>
        <span class="badge-valeur">${descriptionTypeCode(v('BT-3'))}</span>
      </div>
      <div class="badge-score score-${classeScore(score)}">
        <span class="badge-label">Conformité</span>
        <span class="badge-valeur">${score}%</span>
      </div>
      ${(() => {
        const det = r.casUsageDetectes;
        const SEUIL = 6;       // score minimum : ≥ 3 signaux forts confirmés
        const DOMINANCE = 1.5; // le premier cas doit scorer au moins 1,5× le second
        const nominal = `<div class="badge-cas-usage badge-cas-nominal"><span class="badge-label">Cas d'usage probable</span><div class="cas-liste"><span class="cas-item">Cas nominal</span></div></div>`;
        if (!det || det.length === 0 || det[0].score < SEUIL) return nominal;
        // Vérifier la dominance : évite les égalités sans valeur informative
        if (det.length >= 2 && det[0].score < det[1].score * DOMINANCE) return nominal;
        const top = det.filter(c => c.score >= det[0].score / DOMINANCE).slice(0, 2);
        const total = top.reduce((s, c) => s + c.score, 0);
        const multi = top.length > 1;
        const items = top.map(c => {
          const pct = multi ? `<span class="cas-pct">${Math.round(c.score / total * 100)}%</span>` : '';
          return `<span class="cas-item">${escHtml(c.cu.titre)}${pct}</span>`;
        }).join('');
        return `<div class="badge-cas-usage"><span class="badge-label">Cas d'usage probable</span><div class="cas-liste">${items}</div></div>`;
      })()}
      ${r.format === 'UBL' ? '<div class="badge-alerte">⚠ Format UBL</div>' : ''}
    </div>`;
  return el;
}

function classeScore(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'bon';
  if (score >= 50) return 'moyen';
  return 'faible';
}

function descriptionTypeCode(code) {
  const codes = {
    '380': '380 – Facture',
    '381': '381 – Avoir',
    '384': '384 – Facture corrective',
    '386': '386 – Acompte',
    '532': '532 – Partielle',
  };
  return codes[code] || (code ? `Code ${code}` : '–');
}

// ─── Alertes de cohérence ─────────────────────────────────────────────────────
function creerBanniereAlertes(alertes) {
  const div = document.createElement('div');
  div.className = 'banniere-alertes';
  const erreurs = alertes.filter(a => a.niveau === 'erreur');
  const avertis = alertes.filter(a => a.niveau === 'avertissement');
  div.innerHTML = `
    <div class="alerte-titre">
      ${erreurs.length > 0 ? `<span class="badge-erreur">${erreurs.length} erreur(s)</span>` : ''}
      ${avertis.length > 0 ? `<span class="badge-avert">${avertis.length} avertissement(s)</span>` : ''}
      <span>Incohérences détectées</span>
    </div>
    <ul class="alerte-liste">
      ${alertes.map(a => `<li class="alerte-${a.niveau}">
        <span class="alerte-icone">${a.niveau === 'erreur' ? '✕' : '⚠'}</span>
        <span>${escHtml(a.message)}</span>
        ${a.champs ? `<span class="alerte-champs">${a.champs.map(c => `<code>${c}</code>`).join(' ')}</span>` : ''}
      </li>`).join('')}
    </ul>`;
  return div;
}

// ─── Onglets ──────────────────────────────────────────────────────────────────
function creerOnglets() {
  const ongletsDef = [
    { id: 'synthese',    label: '📊 Synthèse' },
    { id: 'champs',      label: '🔍 Champs' },
    { id: 'tva',         label: '📋 TVA' },
    { id: 'lignes',      label: '📝 Lignes' },
    { id: 'profils',     label: '🏅 Profils' },
    { id: 'cas-usage',   label: '💼 Cas d\'usage' },
    { id: 'xml',         label: '💻 XML brut' },
  ];

  const barre = document.createElement('div');
  barre.className = 'barre-onglets';
  barre.id = 'barre-onglets';

  for (const o of ongletsDef) {
    const btn = document.createElement('button');
    btn.className = `onglet-btn ${etatApp.ongletActif === o.id ? 'actif' : ''}`;
    btn.dataset.onglet = o.id;
    btn.innerHTML = o.label;
    if (o.id === 'lignes' && etatApp.resultat?.nbLignes > 0) {
      btn.innerHTML += ` <span class="badge-nb">${etatApp.resultat.nbLignes}</span>`;
    }
    btn.addEventListener('click', () => {
      etatApp.ongletActif = o.id;
      document.querySelectorAll('.onglet-btn').forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      afficherOnglet(o.id, etatApp.resultat);
    });
    barre.appendChild(btn);
  }
  return barre;
}

function initOnglets() {}

function afficherOnglet(id, r) {
  const conteneur = document.getElementById('contenu-onglet');
  if (!conteneur) return;
  conteneur.innerHTML = '';

  switch (id) {
    case 'synthese':    conteneur.appendChild(renderSynthese(r)); break;
    case 'champs':      conteneur.appendChild(renderChamps(r)); break;
    case 'tva':         conteneur.appendChild(renderTva(r)); break;
    case 'lignes':      conteneur.appendChild(renderLignes(r)); break;
    case 'profils':     conteneur.appendChild(renderProfils(r)); break;
    case 'cas-usage':   conteneur.appendChild(renderCasUsage(r)); break;
    case 'xml':         conteneur.appendChild(renderXml(r)); break;
  }
}

// ─── Onglet Synthèse ──────────────────────────────────────────────────────────
function renderSynthese(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';
  const v = (btId) => r.champs[btId]?.valeur;

  // Champs essentiels en grille
  const essentielsBT = [
    { bt: 'BT-1',  label: 'N° Facture' },
    { bt: 'BT-2',  label: 'Date' },
    { bt: 'BT-3',  label: 'Type' },
    { bt: 'BT-5',  label: 'Devise' },
    { bt: 'BT-10', label: 'Réf. client' },
    { bt: 'BT-12', label: 'Réf. contrat' },
    { bt: 'BT-13', label: 'Bon de commande' },
    { bt: 'BT-9',  label: 'Échéance' },
    { bt: 'BT-20', label: 'Conditions paiement' },
    { bt: 'BT-24', label: 'Profil' },
  ];

  el.innerHTML = `
    <div class="grille-synthese">
      <div class="carte-synthese">
        <h3>Identification</h3>
        <dl>
          ${essentielsBT.map(item => {
            const val = v(item.bt);
            return `<div class="dl-item ${val ? '' : 'absent'}">
              <dt>${escHtml(item.label)}</dt>
              <dd>${val ? escHtml(val) : '<span class="absent-txt">–</span>'}</dd>
            </div>`;
          }).join('')}
        </dl>
      </div>

      <div class="carte-synthese">
        <h3>Fournisseur</h3>
        <dl>
          ${[['BT-27','Nom'],['BT-28','Nom commercial'],['BT-30','SIREN'],['BT-31','TVA européenne'],
             ['BT-35','Adresse'],['BT-37','Ville'],['BT-38','Code postal'],['BT-40','Pays']].map(([bt, lb]) => {
            const val = v(bt);
            return `<div class="dl-item ${val ? '' : 'absent'}">
              <dt>${lb}</dt>
              <dd>${val ? escHtml(val) : '<span class="absent-txt">–</span>'}</dd>
            </div>`;
          }).join('')}
        </dl>
      </div>

      <div class="carte-synthese">
        <h3>Client</h3>
        <dl>
          ${[['BT-44','Nom'],['BT-45','Nom commercial'],['BT-47','SIREN'],['BT-48','TVA européenne'],
             ['BT-50','Adresse'],['BT-52','Ville'],['BT-53','Code postal'],['BT-55','Pays']].map(([bt, lb]) => {
            const val = v(bt);
            return `<div class="dl-item ${val ? '' : 'absent'}">
              <dt>${lb}</dt>
              <dd>${val ? escHtml(val) : '<span class="absent-txt">–</span>'}</dd>
            </div>`;
          }).join('')}
        </dl>
      </div>

      <div class="carte-synthese">
        <h3>Totaux</h3>
        <dl>
          ${[['BT-106','Total articles HT'],['BT-107','Remises globales'],['BT-108','Frais généraux'],
             ['BT-109','Total HT'],['BT-110','Total TVA'],['BT-112','Total TTC'],
             ['BT-113','Acomptes versés'],['BT-114','Arrondi'],['BT-115','Reste à payer']].map(([bt, lb]) => {
            const val = v(bt);
            return `<div class="dl-item ${val ? '' : 'absent'}">
              <dt>${lb}</dt>
              <dd>${val ? escHtml(formaterMontant(val, v('BT-5'))) : '<span class="absent-txt">–</span>'}</dd>
            </div>`;
          }).join('')}
        </dl>
      </div>

      <div class="carte-synthese">
        <h3>Paiement</h3>
        <dl>
          ${[['BT-81','Mode de paiement'],['BT-82','Libellé paiement'],['BT-83','Réf. paiement'],
             ['BT-84','IBAN'],['BT-85','Titulaire compte'],['BT-86','BIC banque'],
             ['BT-89','Réf. mandat'],['BT-90','ICS créancier'],['BT-91','IBAN à débiter']].map(([bt, lb]) => {
            const val = v(bt);
            return `<div class="dl-item ${val ? '' : 'absent'}">
              <dt>${lb}</dt>
              <dd>${val ? escHtml(afficherCodePaiement(bt, val)) : '<span class="absent-txt">–</span>'}</dd>
            </div>`;
          }).join('')}
        </dl>
      </div>

      ${r.tvaVentilation.length > 0 ? `
      <div class="carte-synthese">
        <h3>Détail de la TVA</h3>
        <table class="tableau-tva-mini">
          <thead><tr><th>Catégorie</th><th>Taux</th><th>Base</th><th>TVA</th></tr></thead>
          <tbody>
            ${r.tvaVentilation.map(t => `
              <tr>
                <td><span class="badge-tva tva-${(t.categorie||'?').toLowerCase()}">${escHtml(t.categorie || '?')}</span>
                    ${t.categorie ? `<small>${escHtml(CODE_DESCRIPTIONS[t.categorie] || '')}</small>` : ''}</td>
                <td>${t.taux ? `${escHtml(t.taux)}%` : '–'}</td>
                <td>${formaterMontant(t.base, v('BT-5')) || '–'}</td>
                <td>${formaterMontant(t.montant, v('BT-5')) || '–'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}

      ${r.notesDoc.length > 0 ? `
      <div class="carte-synthese carte-notes">
        <h3>Notes</h3>
        ${r.notesDoc.map(n => `<p class="note-doc">${escHtml(n.contenu || '')}</p>`).join('')}
      </div>` : ''}
    </div>`;
  return el;
}

function switchCasUsage(id) {
  etatApp.casUsageSelectionne = id;
  etatApp.ongletActif = 'cas-usage';
  document.querySelectorAll('.onglet-btn').forEach(b => {
    b.classList.toggle('actif', b.dataset.onglet === 'cas-usage');
  });
  afficherOnglet('cas-usage', etatApp.resultat);
}

function afficherCodePaiement(bt, val) {
  if (bt === 'BT-81') return `${val} – ${CODE_DESCRIPTIONS[val] || val}`;
  return val;
}

// ─── Onglet Champs BT/BG ─────────────────────────────────────────────────────

// Champs obligatoires pour un cas d'usage (génèrent rouge si absents).
// Source prioritaire : REGLES_PRESENCE (regles.js).
// Fallback : profil M + champs_requis_cle + champs_distinctifs (sans blocs_conditionnels).
function getBTsObligatoires(cuId) {
  const regle = REGLES_PRESENCE?.cas?.[cuId];
  if (regle) return new Set(regle.obligatoires);

  const obligatoires = new Set();
  const cu = USE_CASES[cuId];
  if (!cu) return obligatoires;
  const profil = cu.profil_recommande || 'en';
  Object.entries(FIELDS).forEach(([btId, f]) => {
    if (f.profiles[profil] === 'M') obligatoires.add(btId);
  });
  (cu.champs_requis_cle || []).forEach(bt => obligatoires.add(bt));
  (cu.champs_distinctifs || []).forEach(item =>
    obligatoires.add(typeof item === 'string' ? item : item.bt)
  );
  return obligatoires;
}

// Champs conditionnels pour un cas d'usage (génèrent ambre si absents, jamais rouge).
// Source prioritaire : REGLES_PRESENCE (regles.js).
// Fallback : tous les BTs des blocs_conditionnels du cas.
function getBTsConditionnels(cuId) {
  const regle = REGLES_PRESENCE?.cas?.[cuId];
  if (regle) return new Set(regle.conditionnels);

  const conditionnels = new Set();
  const cu = USE_CASES[cuId];
  if (!cu) return conditionnels;
  (cu.blocs_conditionnels || []).forEach(blocId => {
    const bloc = BLOCS_CONDITIONNELS?.[blocId];
    if (bloc) bloc.bts.forEach(item =>
      conditionnels.add(typeof item === 'string' ? item : item.bt)
    );
  });
  return conditionnels;
}

function statutBT(champ, obligatoire, conditionnel) {
  const renseigne = champ?.present || false;
  if (renseigne && (obligatoire || conditionnel)) return 'vert';
  if (!renseigne && obligatoire)  return 'rouge';
  if (!renseigne && conditionnel) return 'ambre';
  if (renseigne)                  return 'bleu';
  return 'gris';
}

function selectionnerUCChamps(cuId) {
  etatApp.ucChampsSelectionne = cuId;
  afficherOnglet('champs', etatApp.resultat);
}

function renderChamps(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  const cuActif = etatApp.ucChampsSelectionne || 'REF-NOMINAL';
  const btObligatoires  = getBTsObligatoires(cuActif);
  const btConditionnels = getBTsConditionnels(cuActif);
  const cuActuel = USE_CASES[cuActif];

  // ── Sélecteur UC ──
  const parCat = {};
  Object.entries(USE_CASES).forEach(([id, cu]) => {
    const cat = cu.categorie || 'Autres';
    if (!parCat[cat]) parCat[cat] = [];
    parCat[cat].push([id, cu]);
  });
  // Référence d'abord
  const catOrder = Object.keys(parCat).sort((a, b) =>
    a.startsWith('Référence') ? -1 : b.startsWith('Référence') ? 1 : a.localeCompare(b, 'fr')
  );

  const selectorHtml = `
    <div class="champs-uc-header">
      <div class="champs-uc-top-row">
        <div class="champs-uc-selector-wrap">
          <span class="champs-uc-label">Cas d'usage :</span>
          <select id="champs-uc-select" onchange="selectionnerUCChamps(this.value)">
            ${catOrder.map(cat => `
              <optgroup label="${escHtml(cat)}">
                ${parCat[cat].map(([id, cu]) => `
                  <option value="${escHtml(id)}" ${id === cuActif ? 'selected' : ''}>${escHtml(cu.id)} – ${escHtml(cu.titre)}</option>
                `).join('')}
              </optgroup>`).join('')}
          </select>
        </div>
        ${cuActuel ? `<span class="badge-profil profil-${cuActuel.profil_recommande}">${PROFILES[cuActuel.profil_recommande]?.label || cuActuel.profil_recommande}</span>` : ''}
      </div>
      <div class="champs-legende">
        <span class="legende-chip vert">✓ Renseigné</span>
        <span class="legende-chip rouge">✕ Information requise manquante</span>
        <span class="legende-chip ambre">⚠ Non renseigné (facultatif selon le contexte)</span>
        <span class="legende-chip bleu">● Renseigné (hors cas)</span>
        <span class="legende-chip gris">○ Sans objet / vide</span>
      </div>
    </div>`;

  // ── Groupement BT par BG, triés alphabétiquement par label ──
  const groupes = {};
  for (const [btId, field] of Object.entries(FIELDS)) {
    const bgId = field.group || 'ROOT';
    if (!groupes[bgId]) groupes[bgId] = [];
    groupes[bgId].push({ btId, field });
  }
  Object.values(groupes).forEach(liste =>
    liste.sort((a, b) => {
      const numA = parseInt(a.btId.replace('BT-', ''), 10);
      const numB = parseInt(b.btId.replace('BT-', ''), 10);
      return numA - numB;
    })
  );

  // BGs triés par numéro
  const bgOrder = Object.keys(BUSINESS_GROUPS).concat(
    Object.keys(groupes).filter(k => !(k in BUSINESS_GROUPS))
  );

  const bgHtml = bgOrder.map(bgId => {
    const champs = groupes[bgId];
    if (!champs?.length) return '';
    const bg = BUSINESS_GROUPS[bgId] || { label: bgId, icon: '📋' };

    const items = champs.map(({ btId, field }) => {
      const champ = r.champs[btId];
      const oblig = btObligatoires.has(btId);
      const cond  = btConditionnels.has(btId);
      const statut = statutBT(champ, oblig, cond);
      return { btId, field, champ, statut };
    });

    const tousGris  = items.every(i => i.statut === 'gris');
    const nbVerts   = items.filter(i => i.statut === 'vert').length;
    const nbRouges  = items.filter(i => i.statut === 'rouge').length;
    const nbAmbres  = items.filter(i => i.statut === 'ambre').length;
    const nbBleus   = items.filter(i => i.statut === 'bleu').length;

    const bgTooltip = `${bg.label} – ${items.length} champs | ${nbVerts} renseignés | ${nbRouges} obligatoires manquants | ${nbAmbres} conditionnels absents${nbBleus > 0 ? ` | ${nbBleus} hors UC` : ''}`;

    const cardsHtml = items.map(({ btId, field, champ, statut }) => {
      const label = field.label.replace(' ★','');
      const valeur = champ?.valeur;
      const ico = statut === 'vert' ? '✓' : statut === 'rouge' ? '✕' : statut === 'ambre' ? '⚠' : statut === 'bleu' ? '●' : '○';
      return `<div class="bt-card statut-${statut}" data-bt-id="${escHtml(btId)}">
        <div class="bt-card-header">
          <code class="bt-card-code">${escHtml(btId)}</code>
          <span class="bt-card-ico">${ico}</span>
        </div>
        <div class="bt-card-label">${escHtml(label)}</div>
        ${valeur ? `<div class="bt-card-val">${escHtml(afficherValeurBT(btId, champ, r).substring(0, 45))}</div>` : ''}
      </div>`;
    }).join('');

    return `
      <details class="bg-groupe" ${tousGris ? '' : 'open'} title="${escHtml(bgTooltip)}">
        <summary class="bg-groupe-titre">
          <span class="bg-expand-ico">▶</span>
          <span class="bg-icone">${bg.icon}</span>
          <span class="bg-code">${escHtml(bgId)}</span>
          <span class="bg-label-txt">${escHtml(bg.label)}</span>
          <div class="bg-compteurs">
            ${nbVerts  > 0 ? `<span class="compteur vert">${nbVerts}✓</span>` : ''}
            ${nbRouges > 0 ? `<span class="compteur rouge">${nbRouges}✕</span>` : ''}
            ${nbAmbres > 0 ? `<span class="compteur ambre">${nbAmbres}⚠</span>` : ''}
            ${nbBleus  > 0 ? `<span class="compteur bleu">${nbBleus}●</span>` : ''}
            ${tousGris     ? `<span class="compteur gris">hors UC</span>` : ''}
          </div>
        </summary>
        <div class="bt-grille">${cardsHtml}</div>
      </details>`;
  }).join('');

  el.innerHTML = selectorHtml + bgHtml;
  return el;
}

function afficherValeurBT(btId, champ, r) {
  let val = champ.valeur || '';
  // Ajouter des infos contextuelles
  if (btId === 'BT-3') {
    const desc = CODE_DESCRIPTIONS[val];
    return desc ? `${val} – ${desc}` : val;
  }
  if (btId === 'BT-81') {
    const desc = CODE_DESCRIPTIONS[val];
    return desc ? `${val} – ${desc}` : val;
  }
  if ((btId === 'BT-112' || btId === 'BT-109' || btId === 'BT-110' || btId === 'BT-115') && r.champs['BT-5']?.valeur) {
    return formaterMontant(val, r.champs['BT-5'].valeur) || val;
  }
  if (champ.schema) return `${val} (schéma: ${champ.schema})`;
  if (champ.devise && champ.devise !== r.champs['BT-5']?.valeur) return `${val} ${champ.devise}`;
  return val;
}

// ─── Onglet TVA ───────────────────────────────────────────────────────────────
function renderTva(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';
  const v = (btId) => r.champs[btId]?.valeur;
  const devise = v('BT-5') || 'EUR';

  if (r.tvaVentilation.length === 0) {
    el.innerHTML = '<p class="vide">Aucune ventilation TVA trouvée dans cette facture.</p>';
    return el;
  }

  let totalBase = 0, totalTva = 0;
  const lignesVentil = r.tvaVentilation.map((t, i) => {
    const b = parseFloat(t.base || '0');
    const m = parseFloat(t.montant || '0');
    totalBase += b;
    totalTva += m;
    return `
      <tr>
        <td><span class="badge-tva tva-${(t.categorie||'?').toLowerCase()}">${escHtml(t.categorie||'?')}</span>
            <div class="tva-desc">${escHtml(CODE_DESCRIPTIONS[t.categorie] || t.categorie || 'Inconnu')}</div></td>
        <td>${t.taux ? `${escHtml(t.taux)} %` : '<span class="absent-txt">–</span>'}</td>
        <td class="val-montant">${formaterMontant(t.base, devise) || '–'}</td>
        <td class="val-montant">${formaterMontant(t.montant, devise) || '–'}</td>
        <td>${t.motif ? escHtml(t.motif) : (t.codMotif ? `<code>${escHtml(t.codMotif)}</code>` : '–')}</td>
      </tr>`;
  });

  el.innerHTML = `
    <div class="section-tva">
      <h3>Détail de la TVA par catégorie</h3>
      <table class="tableau-tva">
        <thead>
          <tr><th>Catégorie</th><th>Taux</th><th>Base HT</th><th>Montant TVA</th><th>Motif exo.</th></tr>
        </thead>
        <tbody>${lignesVentil.join('')}</tbody>
        <tfoot>
          <tr class="total-tva">
            <td colspan="2"><strong>Total</strong></td>
            <td class="val-montant"><strong>${formaterMontant(totalBase.toString(), devise)}</strong></td>
            <td class="val-montant"><strong>${formaterMontant(totalTva.toString(), devise)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="recap-tva">
        <div class="recap-item"><span>Base HT totale (BT-109)</span><strong>${formaterMontant(v('BT-109'), devise) || '–'}</strong></div>
        <div class="recap-item"><span>TVA totale (BT-110)</span><strong>${formaterMontant(v('BT-110'), devise) || '–'}</strong></div>
        <div class="recap-item total"><span>Total TTC (BT-112)</span><strong>${formaterMontant(v('BT-112'), devise) || '–'}</strong></div>
      </div>
    </div>

    <div class="section-tva">
      <h3>Explications des catégories TVA</h3>
      <div class="grille-tva-expl">
        ${r.tvaVentilation.map(t => creerCarteExplicationTva(t)).join('')}
      </div>
    </div>`;
  return el;
}

function creerCarteExplicationTva(t) {
  const explications = {
    'S':  { titre: 'TVA standard', explication: 'Le taux de TVA normal s\'applique à cette opération (20% en France métropolitaine). Il s\'agit du cas général pour les livraisons de biens et prestations de services.', action: 'Le vendeur collecte la TVA et la reverse à l\'État. L\'acheteur assujetti peut la déduire.' },
    'Z':  { titre: 'TVA taux zéro', explication: 'Opération soumise à TVA mais avec un taux de 0%. Différent d\'une exonération : la TVA en amont reste déductible.', action: 'Aucune TVA facturée. L\'acheteur ne récupère pas de TVA.' },
    'E':  { titre: 'Exonération de TVA', explication: 'Opération légalement exonérée de TVA (art. 261 et s. du CGI). Exemples : soins médicaux, enseignement, activités bancaires/assurances.', action: 'Le vendeur ne facture pas de TVA. L\'acheteur ne peut pas récupérer de TVA. Mention légale obligatoire.' },
    'AE': { titre: 'Autoliquidation (Reverse Charge)', explication: 'Mécanisme par lequel c\'est l\'acheteur qui déclare et paie la TVA, et non le vendeur. Applicable notamment en BTP (sous-traitance) et pour les achats à des fournisseurs étrangers.', action: 'Le vendeur facture HT. L\'acheteur déclare la TVA sur sa propre déclaration (TVA collectée ET déductible).' },
    'K':  { titre: 'Livraison intracommunautaire exonérée', explication: 'Livraison de biens à destination d\'un assujetti d\'un autre État membre de l\'UE. Exonérée en France, taxée dans le pays de l\'acheteur.', action: 'Vérifier la validité du N° TVA acheteur sur VIES. L\'acheteur autoliquide la TVA dans son pays.' },
    'G':  { titre: 'Exportation hors UE', explication: 'Livraison de biens expédiés hors de l\'Union Européenne. Exonérée de TVA française.', action: 'Justificatif d\'exportation obligatoire (DAE). Déclaration en douane requise.' },
    'O':  { titre: 'Hors champ TVA', explication: 'Opération non soumise à la TVA (hors champ d\'application). Exemples : dividendes, subventions non liées à une opération taxable.', action: 'Pas de TVA. Pas de déduction possible.' },
  };

  const expl = explications[t.categorie] || { titre: `Catégorie ${t.categorie}`, explication: 'Voir la directive TVA ou le CGI pour plus d\'informations.', action: '' };

  return `<div class="carte-tva-expl tva-${(t.categorie||'?').toLowerCase()}">
    <div class="carte-tva-header">
      <span class="badge-tva-grand tva-${(t.categorie||'?').toLowerCase()}">${t.categorie || '?'}</span>
      <strong>${escHtml(expl.titre)}</strong>
    </div>
    <p>${escHtml(expl.explication)}</p>
    ${expl.action ? `<div class="tva-action"><strong>Action requise :</strong> ${escHtml(expl.action)}</div>` : ''}
    ${t.motif ? `<div class="tva-motif"><strong>Motif :</strong> ${escHtml(t.motif)}</div>` : ''}
  </div>`;
}

// ─── Onglet Lignes ────────────────────────────────────────────────────────────
function renderLignes(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  if (r.lignes.length === 0) {
    el.innerHTML = `<div class="vide-lignes">
      <p>Aucune ligne de facture trouvée.</p>
      <p>Les profils <strong>Minimum</strong> et <strong>Basic WL</strong> n'incluent pas de lignes de facture détaillées.</p>
    </div>`;
    return el;
  }

  el.innerHTML = `<h3>${r.lignes.length} ligne(s) de facture</h3>`;

  for (const ligne of r.lignes) {
    const lv = (btId) => ligne.champs[btId]?.valeur;
    const div = document.createElement('div');
    div.className = 'carte-ligne';
    div.innerHTML = `
      <div class="ligne-header">
        <span class="ligne-id">Ligne ${escHtml(ligne.id)}</span>
        <strong class="ligne-nom">${escHtml(lv('BT-153') || 'Article sans nom')}</strong>
        <span class="ligne-montant">${lv('BT-131') ? formaterMontant(lv('BT-131'), r.champs['BT-5']?.valeur) : '–'}</span>
      </div>
      <div class="ligne-detail">
        <div class="ligne-detail-grille">
          ${lv('BT-154') ? `<div><span>Description</span><span>${escHtml(lv('BT-154'))}</span></div>` : ''}
          ${lv('BT-129') ? `<div><span>Quantité</span><span>${escHtml(lv('BT-129'))} ${escHtml(ligne.champs['BT-130']?.unitCode || lv('BT-130') || '')}</span></div>` : ''}
          ${lv('BT-146') ? `<div><span>Prix unitaire net</span><span>${formaterMontant(lv('BT-146'), r.champs['BT-5']?.valeur)}</span></div>` : ''}
          ${lv('BT-148') ? `<div><span>Prix brut</span><span>${formaterMontant(lv('BT-148'), r.champs['BT-5']?.valeur)}</span></div>` : ''}
          ${lv('BT-151') ? `<div><span>Catégorie TVA</span><span><span class="badge-tva tva-${(lv('BT-151')||'s').toLowerCase()}">${escHtml(lv('BT-151'))}</span> ${lv('BT-152') ? lv('BT-152')+'%' : ''}</span></div>` : ''}
          ${lv('BT-155') ? `<div><span>Réf. vendeur</span><span>${escHtml(lv('BT-155'))}</span></div>` : ''}
          ${lv('BT-156') ? `<div><span>Réf. acheteur</span><span>${escHtml(lv('BT-156'))}</span></div>` : ''}
          ${lv('BT-157') ? `<div><span>Code standard</span><span>${escHtml(lv('BT-157'))}</span></div>` : ''}
          ${lv('BT-132') ? `<div><span>Ligne BC</span><span>${escHtml(lv('BT-132'))}</span></div>` : ''}
          ${lv('BT-133') ? `<div><span>Réf. compta</span><span>${escHtml(lv('BT-133'))}</span></div>` : ''}
          ${lv('BT-136') ? `<div><span>Remise</span><span>${formaterMontant(lv('BT-136'), r.champs['BT-5']?.valeur)}</span></div>` : ''}
          ${lv('BT-139') ? `<div><span>Motif remise</span><span>${escHtml(lv('BT-139'))}</span></div>` : ''}
          ${lv('BT-134') ? `<div><span>Période début</span><span>${escHtml(lv('BT-134'))}</span></div>` : ''}
          ${lv('BT-135') ? `<div><span>Période fin</span><span>${escHtml(lv('BT-135'))}</span></div>` : ''}
          ${lv('BT-127') ? `<div><span>Note</span><span>${escHtml(lv('BT-127'))}</span></div>` : ''}
        </div>
      </div>`;
    el.appendChild(div);
  }
  return el;
}

// ─── Onglet Profils ────────────────────────────────────────────────────────────
function renderProfils(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  el.innerHTML = `
    <h3>Conformité par profil FacturX</h3>
    <p class="sous-titre-profil">Vérification des champs obligatoires de chaque profil sur cette facture</p>
    <div class="grille-profils">
      ${PROFILE_ORDER.map(pid => {
        const v = r.validationParProfil[pid];
        const estDeclare = r.profilDetecte === pid;
        const classeScore = v.scoreConformite >= 90 ? 'excellent'
          : v.scoreConformite >= 70 ? 'bon'
          : v.scoreConformite >= 50 ? 'moyen' : 'faible';
        return `
          <div class="carte-profil ${estDeclare ? 'profil-declare' : ''} profil-${pid}">
            ${estDeclare ? '<div class="badge-declare">✓ Profil déclaré</div>' : ''}
            <div class="profil-titre">
              <h4>${escHtml(PROFILES[pid].label)}</h4>
              <div class="score-cercle score-${classeScore}">${v.scoreConformite}%</div>
            </div>
            <div class="profil-barre-fond">
              <div class="profil-barre-rempli" style="width:${v.scoreConformite}%"></div>
            </div>
            <div class="profil-stats">
              <span class="stat-ok">${v.champsMandatoires.length - v.champsManquants.filter(c => !c.ligne).length} / ${v.champsMandatoires.length} obligatoires présents</span>
            </div>
            ${v.champsManquants.length > 0 ? `
              <details class="manquants-details">
                <summary>${v.champsManquants.length} champ(s) manquant(s)</summary>
                <ul class="liste-manquants">
                  ${v.champsManquants.map(m => `
                    <li>
                      <code>${escHtml(m.btId)}</code>
                      <span>${escHtml(m.field?.label?.replace(' ★','') || m.btId)}</span>
                      ${m.ligne ? `<small>ligne ${escHtml(m.ligne)}</small>` : ''}
                    </li>`).join('')}
                </ul>
              </details>` : '<p class="profil-ok">✓ Tous les champs obligatoires sont présents</p>'}
          </div>`;
      }).join('')}
    </div>

    <div class="explication-profils">
      <h3>Qu'est-ce que les profils FacturX ?</h3>
      <div class="grille-expl-profils">
        <div class="expl-profil">
          <strong>Minimum</strong>
          <p>Le niveau minimal pour la facturation électronique. Contient uniquement les données essentielles : identités, totaux et TVA globale. Sans lignes de détail. Idéal pour les petites structures ou la phase transitoire.</p>
        </div>
        <div class="expl-profil">
          <strong>Basic WL</strong>
          <p>"Without Lines" : comme Minimum mais avec la ventilation TVA détaillée. Pas de lignes de facture. Permet la réconciliation TVA.</p>
        </div>
        <div class="expl-profil">
          <strong>Basic</strong>
          <p>Ajoute les lignes de facture avec les informations essentielles (quantité, prix, TVA). C'est le profil recommandé pour la majorité des factures B2B françaises.</p>
        </div>
        <div class="expl-profil">
          <strong>EN 16931 (Confort)</strong>
          <p>Conformité complète à la norme européenne EN 16931. Inclut tous les détails : références, contacts, adresses complètes. Requis pour les marchés publics et la facturation B2G.</p>
        </div>
        <div class="expl-profil">
          <strong>Extended</strong>
          <p>Extension française au-delà de la norme EN 16931. Permet d'inclure des informations spécifiques au contexte français (Chorus Pro, secteurs réglementés). Le plus complet.</p>
        </div>
      </div>
    </div>`;
  return el;
}

// ─── Onglet Cas d'usage ────────────────────────────────────────────────────────
function renderCasUsage(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  // Sélecteur de cas d'usage
  const cuActif = etatApp.casUsageSelectionne || (r.casUsageDetectes[0]?.id);

  // Grouper les cas d'usage par catégorie
  const parCategorie = {};
  Object.entries(USE_CASES).forEach(([id, cu]) => {
    const cat = cu.categorie || 'Autres';
    if (!parCategorie[cat]) parCategorie[cat] = [];
    parCategorie[cat].push([id, cu]);
  });

  el.innerHTML = `
    <div class="cas-usage-layout">
      <aside class="liste-cas-usage">
        <h3>Cas d'usage AFNOR XP Z12-014</h3>
        <p class="sous-titre-cu">Sélectionnez un cas d'usage pour explorer le flux, les obligations et les étapes</p>
        <ul class="cu-liste">
          ${Object.entries(parCategorie).map(([cat, items]) => `
            <li class="cu-categorie-groupe">
              <div class="cu-categorie-label">${escHtml(cat)}</div>
              <ul class="cu-sous-liste">
                ${items.map(([id, cu]) => {
                  const detection = r.casUsageDetectes.find(c => c.id === id);
                  const score = detection?.score || 0;
                  return `
                    <li class="cu-item ${cuActif === id ? 'actif' : ''} ${score > 0 ? 'detecte' : ''}"
                        onclick="selectionnerCasUsage('${id}')">
                      <div class="cu-item-titre">
                        <span class="cu-item-id">${escHtml(cu.id)}</span>
                        <span>${escHtml(cu.titre)}</span>
                        ${score > 0 ? `<span class="badge-detecte" title="Score : ${score}">✓</span>` : ''}
                      </div>
                      <div class="cu-item-profil">
                        <span class="badge-profil profil-${cu.profil_recommande}">${PROFILES[cu.profil_recommande]?.label || cu.profil_recommande}</span>
                      </div>
                    </li>`;
                }).join('')}
              </ul>
            </li>`).join('')}
        </ul>
      </aside>
      <main class="detail-cas-usage" id="detail-cas-usage">
        ${cuActif ? renduDetailCasUsage(USE_CASES[cuActif], r) : '<p class="vide">Sélectionnez un cas d\'usage</p>'}
      </main>
    </div>`;
  return el;
}

function selectionnerCasUsage(id) {
  etatApp.casUsageSelectionne = id;
  etatApp.roleSelectionne = null;
  etatApp.etatWorkflowSelectionne = null;
  document.querySelectorAll('.cu-item').forEach(el => el.classList.remove('actif'));
  document.querySelectorAll(`.cu-item`).forEach(el => {
    if (el.textContent.includes(USE_CASES[id]?.titre)) el.classList.add('actif');
  });
  const detail = document.getElementById('detail-cas-usage');
  if (detail) detail.innerHTML = renduDetailCasUsage(USE_CASES[id], etatApp.resultat);
}

function renduDetailCasUsage(cu, r) {
  if (!cu) return '<p class="vide">Cas d\'usage introuvable.</p>';

  const detection = r?.casUsageDetectes?.find(c => c.id === cu.id);
  const roleActif = etatApp.roleSelectionne;
  const etatActif = etatApp.etatWorkflowSelectionne;

  // Étapes du workflow filtrées par rôle
  const transitions = cu.workflow.transitions;
  const transitionsFiltrees = roleActif
    ? transitions.filter(t => t.acteur === roleActif || !roleActif)
    : transitions;

  // Prochaines étapes depuis l'état actuel
  const prochainesEtapes = etatActif
    ? transitions.filter(t => t.de === etatActif)
    : [];

  return `
    <div class="cu-detail">
      <div class="cu-detail-header">
        <div class="cu-id-badge">${escHtml(cu.id)}</div>
        <h2>${escHtml(cu.titre)}</h2>
        <span class="badge-profil profil-${cu.profil_recommande}">Profil recommandé : ${PROFILES[cu.profil_recommande]?.label}</span>
        ${detection ? `<div class="detection-score">✓ Correspondance avec cette facture (score : ${detection.score})</div>` : ''}
      </div>

      <div class="cu-description">
        <p>${escHtml(cu.description)}</p>
        <div class="cu-contexte">
          <strong>Contexte :</strong> ${escHtml(cu.contexte)}
        </div>
      </div>

      ${cu.champs_distinctifs?.length > 0 ? `
      <div class="cu-section">
        <h3>BTs spécifiques à ce cas d'usage</h3>
        <p class="sous-titre">Champs requis en plus d'une facture B2B standard :</p>
        <div class="grille-champs-requis">
          ${cu.champs_distinctifs.map(item => {
            const btId = typeof item === 'string' ? item : item.bt;
            const note = typeof item === 'object' ? (item.note || '') : '';
            const field = FIELDS[btId];
            const champ = r?.champs[btId];
            const present = r ? champ?.present : null;
            const classeEtat = present === null ? 'distinctif' : (present ? 'present' : 'absent');
            const icone = present === null ? '📌' : (present ? '✓' : '✕');
            return `<div class="champ-requis-item ${classeEtat}">
              <span class="champ-requis-ico">${icone}</span>
              <div class="champ-requis-corps">
                <span><code>${escHtml(btId)}</code> ${escHtml(field?.label?.replace(' ★','') || btId)}</span>
                ${note ? `<em class="champ-note-distinctif">↳ ${escHtml(note)}</em>` : ''}
                ${r && present && champ?.valeur ? `<em class="champ-val-actuelle">${escHtml(champ.valeur.substring(0, 50))}</em>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${cu.blocs_conditionnels?.length > 0 ? `
      <div class="cu-section">
        <h3>Données conditionnelles</h3>
        <p class="sous-titre">Champs qui s'activent selon votre contexte métier :</p>
        <table class="tableau-conditionnel">
          <thead><tr><th>Condition</th><th>Champs BT</th></tr></thead>
          <tbody>
            ${cu.blocs_conditionnels.map(blocId => {
              const bloc = BLOCS_CONDITIONNELS[blocId];
              if (!bloc) return '';
              return `<tr>
                <td>
                  <div class="bloc-condition-titre">${bloc.icone} ${escHtml(bloc.titre)}</div>
                  <div class="bloc-condition-texte">${escHtml(bloc.condition)}</div>
                </td>
                <td>
                  <div class="bt-chips-groupe">
                    ${bloc.bts.map(item => {
                      const btId = typeof item === 'string' ? item : item.bt;
                      const note = typeof item === 'object' ? item.note : '';
                      const champ = r?.champs[btId];
                      const present = r ? champ?.present : null;
                      const cl = present === null ? 'neutre' : (present ? 'present' : 'absent');
                      const ico = present === null ? '' : (present ? '✓ ' : '○ ');
                      return `<span class="bt-chip ${cl}" title="${escHtml(note)}">${ico}<code>${escHtml(btId)}</code></span>`;
                    }).join('')}
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>` : ''}

      ${cu.champs_recommandes?.length > 0 ? `
      <div class="cu-section">
        <h3>Champs recommandés (non obligatoires)</h3>
        <p class="sous-titre">Optionnels dans la norme, mais utiles en pratique pour ce cas :</p>
        <div class="grille-recommandes">
          ${cu.champs_recommandes.map(item => {
            const btId = typeof item === 'string' ? item : item.bt;
            const raison = typeof item === 'object' ? (item.raison || '') : '';
            const field = FIELDS[btId];
            const champ = r?.champs[btId];
            const present = r ? champ?.present : null;
            const cl = present === null ? '' : (present ? 'present' : 'absent');
            return `<div class="champ-recommande ${cl}">
              <div class="recommande-header">
                <code class="recommande-bt">${escHtml(btId)}</code>
                ${present !== null ? `<span class="recommande-ico">${present ? '✓' : '○'}</span>` : ''}
              </div>
              <div class="recommande-label">${escHtml(field?.label?.replace(' ★','') || btId)}</div>
              ${raison ? `<div class="recommande-raison">${escHtml(raison)}</div>` : ''}
              ${r && present && champ?.valeur ? `<div class="recommande-val">${escHtml(champ.valeur.substring(0,40))}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      ${cu.conditions ? `
      <div class="cu-section">
        <h3>Conditions d'application</h3>
        <ul class="cu-conditions">
          ${cu.conditions.map(c => `<li>${escHtml(c)}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${cu.mentions_obligatoires ? `
      <div class="cu-section">
        <h3>Mentions obligatoires</h3>
        <ul class="cu-mentions">
          ${cu.mentions_obligatoires.map(m => {
            // Vérifier si la mention est présente dans la facture
            const btRefs = cu.champs_requis_cle || [];
            return `<li class="mention-item">
              <span class="mention-icone">📌</span>
              <span>${escHtml(m)}</span>
            </li>`;
          }).join('')}
        </ul>
      </div>` : ''}

      ${cu.champs_requis_cle && r ? `
      <div class="cu-section">
        <h3>Champs clés et leur présence dans cette facture</h3>
        <div class="grille-champs-requis">
          ${cu.champs_requis_cle.map(btId => {
            const field = FIELDS[btId];
            const champ = r.champs[btId];
            const present = champ?.present;
            return `<div class="champ-requis-item ${present ? 'present' : 'absent'}">
              <span class="champ-requis-ico">${present ? '✓' : '✕'}</span>
              <code>${btId}</code>
              <span>${escHtml(field?.label?.replace(' ★','') || btId)}</span>
              ${present && champ.valeur ? `<em>${escHtml(champ.valeur.substring(0, 40))}</em>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <div class="cu-section cu-workflow">
        <h3>Flux de traitement</h3>

        <div class="workflow-controls">
          <div class="control-role">
            <label>Mon rôle :</label>
            <div class="role-btns">
              ${Object.entries(ROLES).map(([rid, role]) => {
                const actif = roleActif === rid;
                return `<button class="btn-role ${actif ? 'actif' : ''}" onclick="selectionnerRole('${rid}')">
                  ${role.icon} ${escHtml(role.label)}
                </button>`;
              }).join('')}
            </div>
          </div>
          <div class="control-etat">
            <label>État actuel de la facture :</label>
            <div class="etat-btns">
              ${cu.workflow.etats.map(eid => {
                const etat = ETATS[eid] || { label: eid, color: '#94a3b8' };
                const actif = etatActif === eid;
                return `<button class="btn-etat ${actif ? 'actif' : ''}"
                         style="${actif ? `background:${etat.color}20;border-color:${etat.color}` : ''}"
                         onclick="selectionnerEtat('${eid}')">
                  ${escHtml(etat.label)}
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>

        ${etatActif && prochainesEtapes.length > 0 ? `
        <div class="prochaines-etapes">
          <h4>📍 Prochaines étapes depuis "${ETATS[etatActif]?.label}"</h4>
          ${prochainesEtapes.map(t => {
            const acteurRole = ROLES[t.acteur] || { label: t.acteur, icon: '👤' };
            const estMonRole = !roleActif || t.acteur === roleActif;
            return `<div class="etape-prochaine ${estMonRole ? 'mon-role' : 'autre-role'}">
              <div class="etape-acteur">
                ${acteurRole.icon} <strong>${escHtml(acteurRole.label)}</strong>
                ${estMonRole && roleActif ? '<span class="badge-moi">C\'est vous !</span>' : ''}
              </div>
              <div class="etape-corps">
                <div class="etape-action"><strong>${escHtml(t.action)}</strong></div>
                <div class="etape-vers">→ État suivant : <span class="badge-etat">${escHtml(ETATS[t.vers]?.label || t.vers)}</span></div>
                ${t.description ? `<p>${escHtml(t.description)}</p>` : ''}
                ${t.checklist ? `
                <details class="checklist-details" ${estMonRole ? 'open' : ''}>
                  <summary>Liste de vérification</summary>
                  <ul class="checklist">
                    ${t.checklist.map(item => `
                      <li>
                        <input type="checkbox" class="check-item" id="chk-${btoa(item).slice(0,8)}">
                        <label for="chk-${btoa(item).slice(0,8)}">${escHtml(item)}</label>
                      </li>`).join('')}
                  </ul>
                </details>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>` : (etatActif ? `
        <div class="etape-finale">
          <p>✅ L'état "<strong>${ETATS[etatActif]?.label}</strong>" est un état final ou aucune transition n'est définie depuis cet état.</p>
        </div>` : '')}

        <div class="diagramme-workflow">
          <h4>Schéma du flux complet</h4>
          <div class="flux-etapes">
            ${cu.workflow.etats.map((eid, idx) => {
              const etat = ETATS[eid];
              const estActif = eid === etatActif;
              const transitionDepuis = transitions.filter(t => t.de === eid);
              return `
                <div class="flux-noeud ${estActif ? 'noeud-actif' : ''}" style="border-color:${etat.color};${estActif ? `background:${etat.color}20` : ''}">
                  <div class="noeud-label" style="color:${etat.color}">${escHtml(etat.label)}</div>
                  ${transitionDepuis.map(t => {
                    const acteurRole = ROLES[t.acteur];
                    return `<div class="noeud-action"><small>${acteurRole?.icon || ''} ${escHtml(t.action.substring(0, 40))}…</small></div>`;
                  }).join('')}
                </div>
                ${idx < cu.workflow.etats.length - 1 ? '<div class="flux-fleche">→</div>' : ''}`;
            }).join('')}
          </div>
        </div>

        <div class="liste-transitions">
          <h4>Détail de toutes les étapes</h4>
          ${transitions.map((t, idx) => {
            const acteurRole = ROLES[t.acteur] || { label: t.acteur, icon: '👤' };
            const estMoi = roleActif && t.acteur === roleActif;
            const estDepuisEtatActif = t.de === etatActif;
            return `
              <div class="transition-item ${estMoi ? 'est-moi' : ''} ${estDepuisEtatActif ? 'est-actuelle' : ''}">
                <div class="transition-header">
                  <span class="transition-num">${idx + 1}</span>
                  <span class="transition-etats">
                    <span class="etat-badge" style="border-color:${ETATS[t.de]?.color}">${escHtml(ETATS[t.de]?.label || t.de)}</span>
                    <span class="fleche-t">→</span>
                    <span class="etat-badge" style="border-color:${ETATS[t.vers]?.color}">${escHtml(ETATS[t.vers]?.label || t.vers)}</span>
                  </span>
                  <span class="transition-acteur">${acteurRole.icon} ${escHtml(acteurRole.label)}</span>
                  ${estMoi ? '<span class="badge-moi">Votre action</span>' : ''}
                </div>
                <div class="transition-action"><strong>${escHtml(t.action)}</strong></div>
                ${t.description ? `<p class="transition-desc">${escHtml(t.description)}</p>` : ''}
                ${t.checklist ? `
                  <details class="checklist-details">
                    <summary>${t.checklist.length} étape(s) de vérification</summary>
                    <ul class="checklist">
                      ${t.checklist.map(item => `<li><input type="checkbox" class="check-item"><label>${escHtml(item)}</label></li>`).join('')}
                    </ul>
                  </details>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>

      ${cu.signaux_detection ? `
      <div class="cu-section">
        <h3>Indices de détection automatique</h3>
        <p class="sous-titre">${escHtml(cu.signaux_detection.description)}</p>
        <ul class="indices-detection">
          ${cu.signaux_detection.indices.map(ind => {
            const champFacture = r?.champs[ind.champ];
            const correspond = ind.valeur ? champFacture?.valeur === ind.valeur
              : ind.presence === true ? champFacture?.present
              : ind.presence === false ? !champFacture?.present
              : ind.pattern ? new RegExp(ind.pattern,'i').test(champFacture?.valeur||'')
              : false;
            return `<li class="indice-item ${correspond ? 'indice-ok' : 'indice-absent'}">
              <span class="indice-ico">${correspond ? '✓' : '○'}</span>
              <code>${escHtml(ind.champ)}</code>
              <span>${escHtml(ind.message)}</span>
              ${champFacture?.valeur ? `<em>Valeur actuelle : "${escHtml(champFacture.valeur.substring(0,50))}"</em>` : ''}
            </li>`;
          }).join('')}
        </ul>
      </div>` : ''}
    </div>`;
}

function selectionnerRole(rid) {
  etatApp.roleSelectionne = etatApp.roleSelectionne === rid ? null : rid;
  const cu = USE_CASES[etatApp.casUsageSelectionne];
  const detail = document.getElementById('detail-cas-usage') || document.getElementById('cu-detail-accueil');
  if (detail && cu) detail.innerHTML = renduDetailCasUsage(cu, etatApp.resultat);
}

function selectionnerEtat(eid) {
  etatApp.etatWorkflowSelectionne = etatApp.etatWorkflowSelectionne === eid ? null : eid;
  const cu = USE_CASES[etatApp.casUsageSelectionne];
  const detail = document.getElementById('detail-cas-usage') || document.getElementById('cu-detail-accueil');
  if (detail && cu) detail.innerHTML = renduDetailCasUsage(cu, etatApp.resultat);
}

// ─── Onglet XML – annotation BT ──────────────────────────────────────────────

function construireBTsPourXml() {
  const list = [];
  for (const [btId, field] of Object.entries(FIELDS)) {
    if (!field.xpath) continue;
    const segs = field.xpath
      .replace(/\[[^\]]*\]/g, '') // strip [conditions]
      .split('/')
      .filter(Boolean);
    list.push({ btId, segs, label: (field.label || '').replace(' ★',''), desc: field.description || '' });
  }
  list.sort((a, b) => b.segs.length - a.segs.length); // longest = most specific first
  return list;
}

function annoterLignesXml(xmlFormate) {
  const btsList = construireBTsPourXml();
  const lignes = xmlFormate.split('\n');
  const annotations = new Array(lignes.length).fill(null);
  const stack = [];

  function matchBT() {
    for (const { btId, segs } of btsList) {
      if (stack.length < segs.length) continue;
      const tail = stack.slice(-segs.length);
      if (tail.every((t, j) => t === segs[j])) return btId;
    }
    return null;
  }

  for (let i = 0; i < lignes.length; i++) {
    const raw = lignes[i].trimStart();
    if (!raw || raw.startsWith('<?') || raw.startsWith('<!--')) continue;

    const openM  = raw.match(/^<([a-zA-Z][a-zA-Z0-9:_.-]*)(?:\s[^>]*)?>/);
    const closeM = raw.match(/^<\/([a-zA-Z][a-zA-Z0-9:_.-]*)\s*>/);
    const selfM  = raw.match(/^<([a-zA-Z][a-zA-Z0-9:_.-]*)(?:\s[^>]*)?\s*\/>/);
    const isInline = openM && raw.includes('</') && !raw.trimStart().startsWith('</');

    if (selfM) {
      stack.push(selfM[1]);
      annotations[i] = matchBT();
      stack.pop();
    } else if (isInline && openM) {
      stack.push(openM[1]);
      annotations[i] = matchBT();
      stack.pop();
    } else if (closeM) {
      if (stack.length > 0 && stack[stack.length - 1] === closeM[1]) stack.pop();
    } else if (openM) {
      stack.push(openM[1]);
    }
  }
  return annotations;
}

function syntaxColorXml(ligne) {
  let s = ligne
    .replace(/&/g, '&amp;')
    .replace(/</g, '\x01')
    .replace(/>/g, '\x02')
    .replace(/"/g, '&quot;');
  // Colorize tag names (after \x01 or \x01/)
  s = s.replace(/\x01(\/?)([\w:.-]+)/g,
    (_, sl, tag) => `\x01${sl}<span class="xc-tag">${tag}</span>`);
  // Colorize attribute name="value"
  s = s.replace(/ ([\w:.-]+)=(&quot;[^&]*&quot;)/g,
    ' <span class="xc-aname">$1</span>=<span class="xc-aval">$2</span>');
  return s.replace(/\x01/g, '&lt;').replace(/\x02/g, '&gt;');
}

function renderXml(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  if (!r.xmlTexte) {
    el.innerHTML = '<p class="vide">XML non disponible.</p>';
    return el;
  }

  const xmlFormate = prettifyXml(r.xmlTexte);
  const annotations = annoterLignesXml(xmlFormate);
  const lignes = xmlFormate.split('\n');

  const rowsHtml = lignes.map((ligne, i) => {
    const btId = annotations[i];
    const field = btId ? FIELDS[btId] : null;
    const tooltip = btId
      ? `${btId}\n${field?.label?.replace(' ★','') || ''}\n${field?.description || ''}`.trim()
      : '';
    const btCell = btId
      ? `<span class="xbt-badge" data-bt-id="${escHtml(btId)}">${escHtml(btId)}</span>`
      : '';
    return `<div class="xml-row"><div class="xml-bt-col">${btCell}</div><div class="xml-code-col">${syntaxColorXml(ligne)}</div></div>`;
  }).join('');

  el.innerHTML = `
    <div class="xml-header">
      <div class="xml-info">
        <span>Fichier : <code>${escHtml(r.nomFichierXml || 'inconnu')}</code></span>
        <span>Source : <code>${escHtml(r.sourceXml || 'inconnu')}</code></span>
        <span>Format : <code>${escHtml(r.format || 'CII')}</code></span>
        <span>Taille : <code>${r.xmlTexte.length.toLocaleString('fr-FR')} car.</code></span>
      </div>
      <button class="btn-copier" onclick="copierXml()">📋 Copier le XML</button>
    </div>
    <div class="xml-annote">${rowsHtml}</div>`;
  return el;
}

function copierXml() {
  const xml = etatApp.resultat?.xmlTexte;
  if (xml) {
    navigator.clipboard.writeText(xml).then(() => {
      const btn = document.querySelector('.btn-copier');
      if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.textContent = '📋 Copier le XML', 2000); }
    });
  }
}

function prettifyXml(xml) {
  let indent = 0;
  const INDENT = '  ';
  const lignes = xml.replace(/>\s*</g, '>\n<').split('\n');
  return lignes.map(ligne => {
    ligne = ligne.trim();
    if (!ligne) return '';
    if (ligne.startsWith('</')) indent = Math.max(0, indent - 1);
    const result = INDENT.repeat(indent) + ligne;
    if (ligne.startsWith('<') && !ligne.startsWith('</') && !ligne.startsWith('<?') && !ligne.includes('/>') && !ligne.match(/<[^/].*>.*<\//)) {
      indent++;
    }
    return result;
  }).filter(Boolean).join('\n');
}

// ─── Section Cas d'usage (page d'accueil) ────────────────────────────────────
function initCasUsage() {
  const conteneur = document.getElementById('cas-usage-accueil');
  if (!conteneur) return;

  const parCategorie = {};
  Object.entries(USE_CASES).forEach(([id, cu]) => {
    const cat = cu.categorie || 'Autres';
    if (!parCategorie[cat]) parCategorie[cat] = [];
    parCategorie[cat].push([id, cu]);
  });

  const premierId = Object.keys(USE_CASES)[0];
  etatApp.casUsageSelectionne = premierId;
  etatApp.roleSelectionne = null;
  etatApp.etatWorkflowSelectionne = null;

  conteneur.innerHTML = `
    <div class="cas-usage-layout">
      <aside class="liste-cas-usage">
        <h3>Cas d'usage AFNOR XP Z12-014</h3>
        <p class="sous-titre-cu">Sélectionnez un cas d'usage pour explorer le flux, les obligations et les étapes</p>
        <ul class="cu-liste">
          ${Object.entries(parCategorie).map(([cat, items]) => `
            <li class="cu-categorie-groupe">
              <div class="cu-categorie-label">${escHtml(cat)}</div>
              <ul class="cu-sous-liste">
                ${items.map(([id, cu]) => `
                  <li class="cu-item ${id === premierId ? 'actif' : ''}"
                      data-cu-id="${escHtml(id)}"
                      onclick="selectionnerCasUsageAccueil('${id}')">
                    <div class="cu-item-titre">
                      <span class="cu-item-id">${escHtml(cu.id)}</span>
                      <span>${escHtml(cu.titre)}</span>
                    </div>
                    <div class="cu-item-profil">
                      <span class="badge-profil profil-${cu.profil_recommande}">${PROFILES[cu.profil_recommande]?.label || cu.profil_recommande}</span>
                    </div>
                  </li>`).join('')}
              </ul>
            </li>`).join('')}
        </ul>
      </aside>
      <main class="detail-cas-usage" id="cu-detail-accueil">
        ${premierId ? renduDetailCasUsage(USE_CASES[premierId], null) : '<p class="vide">Sélectionnez un cas d\'usage</p>'}
      </main>
    </div>`;
}

function selectionnerCasUsageAccueil(id) {
  etatApp.casUsageSelectionne = id;
  etatApp.roleSelectionne = null;
  etatApp.etatWorkflowSelectionne = null;
  document.querySelectorAll('#cas-usage-accueil .cu-item').forEach(el => {
    el.classList.toggle('actif', el.dataset.cuId === id);
  });
  const detail = document.getElementById('cu-detail-accueil');
  if (detail) detail.innerHTML = renduDetailCasUsage(USE_CASES[id], null);
}

// ─── Exemple de démonstration ────────────────────────────────────────────────
function chargerExemple() {
  const xmlExemple = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>FACT-2024-00142</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">20241215</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>Merci de rappeler le numéro de facture lors du paiement.</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:SellerAssignedID>PROD-001</ram:SellerAssignedID>
        <ram:Name>Développement logiciel – Sprint 42</ram:Name>
        <ram:Description>Développement et intégration du module de facturation électronique</ram:Description>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>150.00</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="HUR">40</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>6000.00</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>BC-2024-0789</ram:BuyerReference>
      <ram:SellerTradeParty>
        <ram:Name>TechSoft Solutions SAS</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">123456789</ram:ID>
          <ram:TradingBusinessName>TechSoft</ram:TradingBusinessName>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>75001</ram:PostcodeCode>
          <ram:LineOne>15 rue de la Paix</ram:LineOne>
          <ram:CityName>Paris</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR12123456789</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">factures@techsoft.fr</ram:URIID>
        </ram:URIUniversalCommunication>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Entreprise Exemple SARL</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">987654321</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>69002</ram:PostcodeCode>
          <ram:LineOne>8 place Bellecour</ram:LineOne>
          <ram:CityName>Lyon</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">FR98987654321</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:BuyerTradeParty>
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>BC-2024-0789</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">20241210</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>FR7630001007941234567890185</ram:IBANID>
          <ram:AccountName>TechSoft Solutions SAS</ram:AccountName>
        </ram:PayeePartyCreditorFinancialAccount>
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>BNPAFRPPXXX</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>1200.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>6000.00</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>20</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Paiement à 30 jours. Pénalités de retard : 3× taux légal. Indemnité forfaitaire de recouvrement : 40 EUR.</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">20250114</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>6000.00</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>6000.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">1200.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>7200.00</ram:GrandTotalAmount>
        <ram:DuePayableAmount>7200.00</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  afficherChargement('Chargement de la facture exemple…');
  try {
    const resultat = analyserXmlCII(xmlExemple);
    resultat.nomFichierXml = 'exemple-facturx.xml';
    resultat.sourceXml = 'exemple';
    if (resultat.profilDetecte) {
      resultat.validation = validerParProfil(resultat, resultat.profilDetecte);
    }
    resultat.validationParProfil = {};
    for (const pid of PROFILE_ORDER) {
      resultat.validationParProfil[pid] = validerParProfil(resultat, pid);
    }
    resultat.alertes = verifierCoherence(resultat);
    const champsPresents = {};
    for (const [btId, c] of Object.entries(resultat.champs)) {
      if (c.present) champsPresents[btId] = c.valeur;
    }
    resultat.casUsageDetectes = detecterCasUsage(champsPresents);
    etatApp.resultat = resultat;
    afficherResultats(resultat);
  } catch (e) {
    afficherErreur(e.message);
  }
}

// ─── Utilitaires DOM ──────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
