/**
 * Application FacturX Analyzer – logique principale (tout en français)
 */

// ─── État global ─────────────────────────────────────────────────────────────
let etatApp = {
  resultat: null,
  ongletActif: 'synthese',
  profilCompare: null,
  casUsageSelectionne: null,
  roleSelectionne: null,
  etatWorkflowSelectionne: null,
  xmlVisible: false,
};

// ─── Initialisation ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDragDrop();
  initOnglets();
  initCasUsage();
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
    casUsageSelectionne: null, roleSelectionne: null, etatWorkflowSelectionne: null, xmlVisible: false };
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
        <span class="date-facture">${escHtml(v('BT-2') || '')}</span>
      </div>
      <div class="entete-parties">
        <div class="partie vendeur">
          <span class="label-petit">Vendeur</span>
          <strong>${escHtml(v('BT-27') || '–')}</strong>
          ${v('BT-30') ? `<small>SIREN : ${escHtml(v('BT-30'))}</small>` : ''}
          ${v('BT-31') ? `<small>TVA : ${escHtml(v('BT-31'))}</small>` : ''}
        </div>
        <div class="fleche-parties">→</div>
        <div class="partie acheteur">
          <span class="label-petit">Acheteur</span>
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
      <div class="badge-profil profil-${r.profilDetecte || 'inconnu'}">
        <span class="badge-label">Profil</span>
        <span class="badge-valeur">${escHtml(profil.label)}</span>
      </div>
      <div class="badge-type">
        <span class="badge-label">Type</span>
        <span class="badge-valeur">${descriptionTypeCode(v('BT-3'))}</span>
      </div>
      <div class="badge-score score-${classeScore(score)}">
        <span class="badge-label">Conformité</span>
        <span class="badge-valeur">${score}%</span>
      </div>
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
    { id: 'champs',      label: '🔍 Champs BT/BG' },
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
    { bt: 'BT-10', label: 'Réf. acheteur' },
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
        <h3>Vendeur</h3>
        <dl>
          ${[['BT-27','Nom'],['BT-28','Nom commercial'],['BT-30','SIREN'],['BT-31','TVA intra'],
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
        <h3>Acheteur</h3>
        <dl>
          ${[['BT-44','Nom'],['BT-45','Nom commercial'],['BT-47','SIREN'],['BT-48','TVA intra'],
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
          ${[['BT-106','Total HT lignes'],['BT-107','Remises document'],['BT-108','Frais document'],
             ['BT-109','Total HT'],['BT-110','Total TVA'],['BT-112','Total TTC'],
             ['BT-113','Déjà payé'],['BT-114','Arrondi'],['BT-115','Montant dû']].map(([bt, lb]) => {
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
          ${[['BT-81','Moyen paiement'],['BT-82','Texte paiement'],['BT-83','Réf. remise'],
             ['BT-84','IBAN'],['BT-85','Titulaire compte'],['BT-86','BIC'],
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
        <h3>Ventilation TVA</h3>
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
      <div class="carte-synthese">
        <h3>Notes</h3>
        ${r.notesDoc.map(n => `<p class="note-doc">${escHtml(n.contenu || '')}</p>`).join('')}
      </div>` : ''}

      ${r.casUsageDetectes.length > 0 ? `
      <div class="carte-synthese carte-cas-usage">
        <h3>Cas d'usage probable</h3>
        ${r.casUsageDetectes.slice(0, 2).map(res => `
          <div class="cu-mini">
            <div class="cu-mini-titre">
              <strong>${escHtml(res.cu.titre)}</strong>
              <span class="badge-profil profil-${res.cu.profil_recommande}">${PROFILES[res.cu.profil_recommande]?.label}</span>
            </div>
            <p>${escHtml(res.cu.description)}</p>
            <div class="cu-mini-indices">
              ${res.indices_trouves.map(i => `<span class="indice-ok">✓ ${escHtml(i)}</span>`).join('')}
            </div>
            <button class="btn-lien" onclick="switchCasUsage('${res.id}')">Voir le flux →</button>
          </div>`).join('')}
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
function renderChamps(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  const profil = r.profilDetecte || 'bas';

  // Filtres
  el.innerHTML = `
    <div class="barre-filtres">
      <input type="search" id="filtre-champs" placeholder="Filtrer par BT, nom ou valeur…" oninput="filtrerChamps(this.value)">
      <select id="filtre-statut" onchange="filtrerChamps(document.getElementById('filtre-champs').value)">
        <option value="">Tous les champs</option>
        <option value="present">Présents uniquement</option>
        <option value="manquant-m">Manquants obligatoires</option>
        <option value="manquant-c">Manquants conditionnels</option>
      </select>
      <label class="label-filtre">Profil de référence :
        <select id="filtre-profil" onchange="filtrerChamps(document.getElementById('filtre-champs').value)">
          ${PROFILE_ORDER.map(p => `<option value="${p}" ${p === profil ? 'selected' : ''}>${PROFILES[p].label}</option>`).join('')}
        </select>
      </label>
    </div>
    <div id="conteneur-champs"></div>`;

  setTimeout(() => {
    el.querySelector('#conteneur-champs').innerHTML = renduGroupesChamps(r, profil, '', 'tous');
  }, 0);

  return el;
}

function filtrerChamps(texte) {
  const statut = document.getElementById('filtre-statut')?.value || '';
  const profil = document.getElementById('filtre-profil')?.value || etatApp.resultat?.profilDetecte || 'bas';
  const conteneur = document.getElementById('conteneur-champs');
  if (conteneur) {
    conteneur.innerHTML = renduGroupesChamps(etatApp.resultat, profil, texte, statut);
  }
}

function renduGroupesChamps(r, profil, filtreTxt, filtreStatut) {
  // Regrouper les champs par BG
  const groupes = {};
  for (const [btId, field] of Object.entries(FIELDS)) {
    const g = field.group || 'ROOT';
    if (!groupes[g]) groupes[g] = [];
    groupes[g].push({ btId, field });
  }

  let html = '';
  for (const [bgId, champs] of Object.entries(groupes)) {
    const bg = BUSINESS_GROUPS[bgId] || { label: bgId, icon: '📋' };

    const lignesHtml = champs.map(({ btId, field }) => {
      const champ = r.champs[btId];
      const valeur = champ?.valeur;
      const present = champ?.present;
      const niveauProfil = field.profiles[profil];

      // Filtres
      if (filtreTxt) {
        const t = filtreTxt.toLowerCase();
        const match = btId.toLowerCase().includes(t) ||
          field.label.toLowerCase().includes(t) ||
          (valeur || '').toLowerCase().includes(t) ||
          (field.description || '').toLowerCase().includes(t);
        if (!match) return '';
      }
      if (filtreStatut === 'present' && !present) return '';
      if (filtreStatut === 'manquant-m' && (present || niveauProfil !== 'M')) return '';
      if (filtreStatut === 'manquant-c' && (present || niveauProfil !== 'C')) return '';

      const classeStatut = present ? 'present'
        : niveauProfil === 'M' ? 'manquant-obligatoire'
        : niveauProfil === 'C' ? 'manquant-conditionnel'
        : niveauProfil === 'N' ? 'non-applicable'
        : 'absent-optionnel';

      const iconeStatut = present ? '✓'
        : niveauProfil === 'M' ? '✕'
        : niveauProfil === 'C' ? '⚠'
        : niveauProfil === 'N' ? '–'
        : '○';

      const labelNiveau = { M: 'Obligatoire', C: 'Conditionnel', O: 'Optionnel', N: 'Non applicable' };

      return `<tr class="ligne-champ ${classeStatut}" title="${escHtml(field.description || '')}">
        <td class="col-bt"><code class="bt-code">${escHtml(btId)}</code></td>
        <td class="col-statut">
          <span class="icone-statut">${iconeStatut}</span>
          <span class="niveau-profil niveau-${niveauProfil?.toLowerCase() || 'n'}">${labelNiveau[niveauProfil] || niveauProfil || '–'}</span>
        </td>
        <td class="col-label">${escHtml(field.label.replace(' ★', ''))}
          ${field.condition ? `<br><small class="condition-txt">↳ ${escHtml(field.condition)}</small>` : ''}
          ${field.codeList ? `<small class="code-list-badge">Liste : ${escHtml(field.codeList)}</small>` : ''}
        </td>
        <td class="col-valeur">
          ${present
            ? `<span class="valeur-champ">${escHtml(afficherValeurBT(btId, champ, r))}</span>`
            : `<span class="valeur-absente">${niveauProfil === 'N' ? 'Non utilisé dans ce profil' : 'Non renseigné'}</span>`}
        </td>
      </tr>`;
    }).filter(Boolean).join('');

    if (!lignesHtml) continue;

    html += `
      <details class="groupe-bg" open>
        <summary class="groupe-bg-titre">
          <span class="bg-icone">${bg.icon}</span>
          <span class="bg-id">${escHtml(bgId)}</span>
          <span class="bg-label">${escHtml(bg.label)}</span>
        </summary>
        <table class="tableau-champs">
          <thead><tr><th>BT</th><th>Statut</th><th>Champ</th><th>Valeur</th></tr></thead>
          <tbody>${lignesHtml}</tbody>
        </table>
      </details>`;
  }

  return html || '<p class="vide">Aucun champ correspondant au filtre.</p>';
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

  el.innerHTML = `
    <div class="cas-usage-layout">
      <aside class="liste-cas-usage">
        <h3>Cas d'usage AFNOR</h3>
        <p class="sous-titre-cu">Sélectionnez un cas d'usage pour explorer le flux, les obligations et les étapes</p>
        <ul class="cu-liste">
          ${Object.entries(USE_CASES).map(([id, cu]) => {
            const detection = r.casUsageDetectes.find(c => c.id === id);
            const score = detection?.score || 0;
            return `
              <li class="cu-item ${cuActif === id ? 'actif' : ''} ${score > 0 ? 'detecte' : ''}"
                  onclick="selectionnerCasUsage('${id}')">
                <div class="cu-item-titre">
                  <span>${escHtml(cu.titre)}</span>
                  ${score > 0 ? `<span class="badge-detecte" title="Score de correspondance : ${score}">✓ Détecté</span>` : ''}
                </div>
                <div class="cu-item-profil">
                  <span class="badge-profil profil-${cu.profil_recommande}">${PROFILES[cu.profil_recommande]?.label}</span>
                </div>
              </li>`;
          }).join('')}
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
                const etat = ETATS[eid];
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
  const detail = document.getElementById('detail-cas-usage');
  if (detail && cu) detail.innerHTML = renduDetailCasUsage(cu, etatApp.resultat);
}

function selectionnerEtat(eid) {
  etatApp.etatWorkflowSelectionne = etatApp.etatWorkflowSelectionne === eid ? null : eid;
  const cu = USE_CASES[etatApp.casUsageSelectionne];
  const detail = document.getElementById('detail-cas-usage');
  if (detail && cu) detail.innerHTML = renduDetailCasUsage(cu, etatApp.resultat);
}

// ─── Onglet XML ───────────────────────────────────────────────────────────────
function renderXml(r) {
  const el = document.createElement('div');
  el.className = 'onglet-contenu';

  if (!r.xmlTexte) {
    el.innerHTML = '<p class="vide">XML non disponible.</p>';
    return el;
  }

  const xmlFormate = prettifyXml(r.xmlTexte);
  el.innerHTML = `
    <div class="xml-header">
      <div class="xml-info">
        <span>Fichier : <code>${escHtml(r.nomFichierXml || 'inconnu')}</code></span>
        <span>Source : <code>${escHtml(r.sourceXml || 'inconnu')}</code></span>
        <span>Format : <code>${escHtml(r.format || 'CII')}</code></span>
        <span>Taille : <code>${r.xmlTexte.length.toLocaleString('fr-FR')} caractères</code></span>
      </div>
      <button class="btn-copier" onclick="copierXml()">📋 Copier le XML</button>
    </div>
    <div class="xml-conteneur">
      <pre id="xml-pre" class="xml-code"><code>${escHtml(xmlFormate)}</code></pre>
    </div>`;
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

  conteneur.innerHTML = `
    <div class="grille-cu-accueil">
      ${Object.entries(USE_CASES).map(([id, cu]) => `
        <div class="cu-card-accueil" onclick="afficherDetailCuAccueil('${id}')">
          <div class="cu-card-header">
            <span class="cu-card-id">${escHtml(cu.id)}</span>
            <span class="badge-profil profil-${cu.profil_recommande}">${PROFILES[cu.profil_recommande]?.label}</span>
          </div>
          <h4>${escHtml(cu.titre)}</h4>
          <p>${escHtml(cu.description)}</p>
        </div>`).join('')}
    </div>
    <div id="cu-detail-accueil" class="cache"></div>`;
}

function afficherDetailCuAccueil(id) {
  const cu = USE_CASES[id];
  const div = document.getElementById('cu-detail-accueil');
  if (!div || !cu) return;
  etatApp.casUsageSelectionne = id;
  etatApp.roleSelectionne = null;
  etatApp.etatWorkflowSelectionne = null;
  div.classList.remove('cache');
  div.innerHTML = renduDetailCasUsage(cu, null);
  div.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
