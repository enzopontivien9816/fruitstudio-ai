# FRUITSTUDIO AI

Application Node.js/Express de création de concepts et prompts pour des vidéos verticales avec personnages fruits.

## Lancer en local
```bash
npm install
npm start
``
Puis ouvrir http://localhost:3000.

## État actuel
- Interface responsive en français.
- Création de prompts structurés via `POST /api/generate`.
- Exemple de genres et formats courts.
- Les 50 crédits visibles sont uniquement une démonstration côté navigateur : ils ne sont ni sécurisés ni synchronisés entre appareils.
- Cette version ne génère pas de fichiers vidéo. Pour cela, connecter un fournisseur de génération vidéo avec une clé API stockée côté serveur.
- Authentification, base de données, paiements et espace créateur sécurisé restent à intégrer avant une mise en production commerciale.

## Déploiement Render
Le fichier `render.yaml` décrit un service Node gratuit dans la région de Francfort.
