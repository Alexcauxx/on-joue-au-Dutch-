/**
 * Palette de couleurs de l'application Dutch.
 * Toutes les couleurs sont centralisées ici.
 * Pour changer le thème global, il suffit de modifier ce fichier.
 */
export const G = {
  bg:      '#060912',                    // fond de l'app
  felt:    '#0b1e13',                    // tapis vert foncé
  feltR:   '#112b1b',                    // centre du tapis (plus clair)
  gold:    '#d4a853',                    // or — couleur principale
  goldL:   '#f0cb72',                    // or clair (boutons, highlights)
  goldDim: 'rgba(212,168,83,.55)',       // or atténué
  text:    '#f0ebe0',                    // texte principal (crème)
  dim:     'rgba(240,235,224,.42)',      // texte secondaire/gris
  navy:    '#1a237e',                    // dos des cartes
  navyL:   '#2d3f9e',                    // dos des cartes (gradient)
  ok:      '#5bc97b',                    // vert succès
  err:     '#e06060',                    // rouge erreur
  border:  'rgba(255,255,255,.055)',     // bordures subtiles
  surface: 'rgba(255,255,255,.045)',     // surfaces légèrement visibles
}

/**
 * Raccourci pour choisir la famille de police.
 * @param {boolean} serif - true pour Cormorant Garamond (titres), false pour DM Sans (texte)
 */
export const ff = (serif = false) =>
  serif
    ? '"Cormorant Garamond", Georgia, serif'
    : '"DM Sans", "Helvetica Neue", sans-serif'
