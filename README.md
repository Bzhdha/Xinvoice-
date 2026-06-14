# Analyseur FacturX — AFNOR NF Z55-500 / XP Z12-014

Application web locale (100 % navigateur, sans serveur) pour analyser des factures électroniques au format **FacturX** (PDF+XML) ou **XML CII**, selon les normes françaises et européennes.

## Ce que fait l'application

### 1. Analyse d'une facture FacturX ou XML CII

Déposez un fichier **PDF FacturX / ZUGFeRD** ou **XML CII** dans la zone de dépôt :

- L'XML embarqué dans le PDF est extrait automatiquement (via pdf.js)
- **~130 champs BT/BG** sont identifiés avec leur valeur, leur XPath et leur niveau d'obligation
- Le **profil FacturX** est détecté automatiquement via BT-24 (Minimum, Basic WL, Basic, EN 16931, Extended)
- Un **score de conformité** (0–100 %) est calculé par profil

### 2. Résultats en 7 onglets

| Onglet | Contenu |
|---|---|
| **Synthèse** | Résumé visuel : parties, montants, profil, alertes de cohérence |
| **Champs BT/BG** | Table filtrable de tous les champs avec statut (✓ présent / ✕ manquant / ⚠ conditionnel / – N/A) |
| **TVA** | Ventilation par taux, explication de chaque catégorie (S, AE, K, E, G, Z, O) |
| **Lignes** | Détail de chaque ligne de facture (BG-25 à BG-32) |
| **Profils** | Comparaison des 5 profils : score, champs manquants par profil |
| **Cas d'usage** | Identification du ou des cas d'usage détectés + workflow interactif |
| **XML brut** | Visualisation de l'XML CII indenté |

### 3. 36 cas d'usage officiels AFNOR XP Z12-014

L'onglet **Cas d'usage** implémente les 36 cas d'usage officiels de la réforme française de la facturation électronique (Annexe A normative, AFNOR XP Z12-014), groupés par catégorie :

- Multi-commande / Multi-livraison (XP-1)
- Tiers payeur / Affacturage (XP-2 à XP-10)
- Sous-traitance / Co-traitance (XP-13, XP-14)
- Marketplace / Mandat de facturation (XP-17a, XP-17b, XP-19a, XP-19b)
- Acomptes et facture définitive (XP-20, XP-21)
- Escompte — TVA encaissement / débits (XP-22a, XP-22b)
- Cas particuliers : arrhes, bons cadeaux, péage, restaurant, TVA sur la marge, secret professionnel… (XP-24 à XP-36)

Pour chaque cas d'usage, l'application affiche :
- Description, profil recommandé, conditions d'application
- Champs clés obligatoires
- **Workflow interactif** : sélectionnez votre rôle (Vendeur, Acheteur, PDP-E, PDP-R, CdD/PPF, Tiers…) et l'état actuel de la facture → les prochaines étapes personnalisées s'affichent avec leur checklist

### 4. Flux officiels DGFiP/AFNOR (Figures 2 & 3)

Deux workflows de référence sont intégrés comme cas d'usage spéciaux :

- **`REF-NOMINAL`** : Cas nominal d'échange (Figure 2) — flux complet `PDP-E → PDP-R → CdD/PPF` avec statuts officiels `DEPOSEE → RECUE → ACCEPTEE → PAIEMENT_TRANSMIS → ENCAISSEE`
- **`REF-REJET`** : Rejet technique à l'émission (Figure 3) — rejet par la PDP-E avant transmission à la PDP-R, avec annulation comptable obligatoire

### 5. Confidentialité

Tout le traitement est effectué **localement dans le navigateur**. Aucune donnée n'est envoyée à un serveur. Les factures ne quittent pas le poste.

---

## Utilisation

```
Ouvrir index.html dans Chrome ou Firefox
```

Aucune installation, aucun serveur, aucun build. Fonctionne depuis `file://`.

---

## Structure

```
index.html          Page unique — interface complète
css/
  styles.css        Design responsive (variables CSS, badges profils/TVA, workflows)
js/
  fields.js         Référentiel ~130 champs BT/BG : XPath CII, niveaux par profil, descriptions FR
  usecases.js       36 cas d'usage XP Z12-014 + WORKFLOW_NOMINAL + WORKFLOW_REJET_TECHNIQUE
  parser.js         Extraction PDF (pdf.js), parsing XML CII/UBL, validation, cohérence
  app.js            Interface : onglets, drag & drop, rendus, workflows interactifs
```

### Profils FacturX

| Profil | URN | Usage |
|---|---|---|
| **Minimum** | `urn:factur-x.eu:1p0:minimum` | Données essentielles, phase transitoire |
| **Basic WL** | `urn:factur-x.eu:1p0:basicwl` | + ventilation TVA, sans lignes |
| **Basic** | `urn:factur-x.eu:1p0:basic` | + lignes de détail |
| **EN 16931** | `urn:cen.eu:en16931:2017` | Conformité européenne complète, B2G |
| **Extended** | `urn:factur-x.eu:1p0:extended` | Extension française Chorus Pro |

### Statuts officiels cycle de vie (réforme e-invoicing FR)

`BROUILLON → EMISE → DEPOSEE → RECUE → EN_CONTROLE → ACCEPTEE → PAIEMENT_TRANSMIS → ENCAISSEE → ARCHIVEE`

Cas de rejet : `EMISE → DEPOSEE → REJETEE → (annulation comptable → BROUILLON)`

---

## Références normatives

- **AFNOR NF Z55-500** — Facture électronique française (FacturX)
- **EN 16931-1:2017** — Norme européenne de facturation électronique
- **AFNOR XP Z12-014** — Cas d'usage B2B réforme facturation électronique (Annexe A normative)
- **UN/CEFACT CII** — Cross-Industry Invoice (format XML sous-jacent)
- **UNTDID 1001** — Codes types de document
- **UNTDID 4461** — Codes moyens de paiement
