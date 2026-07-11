# TradingStats — Suivi de Productivité

Application web de suivi de productivité et d'habitudes, développée à partir du
tableau Excel "Dashboard Productivité". Remplace le classeur par un outil
interactif : cases à cocher (0 / ½ / 1), calculs automatiques, navigation par
mois, statistiques et graphiques.

## Fonctionnalités

- **Dashboard** — habitudes quotidiennes (sommeil, réveil, sport, sessions de
  travail, gestion des émotions, lecture, formation), 3 tâches du jour avec
  intitulé + score, et un score "Day Win" calculé automatiquement pour
  chaque jour et pour le mois.
- **Health** — 10 habitudes de santé/hygiène suivies séparément, dont la
  moyenne alimente automatiquement le Dashboard.
- **Statistiques** — évolution du Day Win sur le mois, classement des
  habitudes par taux de réussite, série en cours, meilleure/pire habitude.
- Navigation par mois/année, données sauvegardées localement dans le
  navigateur (localStorage), export/import JSON, thème clair/sombre
  automatique.

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production
```

Stack : React, TypeScript, Vite, Tailwind CSS, Zustand, Recharts.
