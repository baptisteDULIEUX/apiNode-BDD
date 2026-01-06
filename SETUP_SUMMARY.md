# 📋 Configuration Docker & CI/CD - Récapitulatif

## ✅ Modifications effectuées

Votre projet a été configuré pour :
1. **Développement local** : lancer l'API sans exécuter les tests
2. **CI/CD automatique** : exécuter les tests sur chaque push GitHub/GitLab

---

## 🏗️ Structure du Dockerfile

Le `Dockerfile` contient maintenant **4 stages** :

### 1. **builder** (Étape de build)
- Compile le code TypeScript en JavaScript
- Utilisé comme base pour l'image de production

### 2. **production** (Image optimisée)
- Image légère avec seulement les dépendances de production
- Exécute l'application compilée
- **Commande** : `node dist/index.js`

### 3. **development** (Développement local)
- Inclut toutes les dépendances (dev + prod)
- Build et lance l'application automatiquement
- **Commande** : `sh -c "pnpm run build && node dist/index.js"`
- ✅ **Sans tests**

### 4. **test** (Tests CI/CD)
- Inclut toutes les dépendances (dev + prod)
- Exécute la suite de tests avec Vitest
- **Commande** : `pnpm test`
- ✅ **Utilisé uniquement en CI/CD**

---

## 🚀 Utilisation

### Développement local (sans tests)
```bash
# Lancer l'API en mode développement
docker compose up --build

# L'API sera disponible sur http://localhost:3000
# Les tests ne seront PAS exécutés
```

### Tests manuels (si besoin)
```bash
# Lancer les tests manuellement
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Nettoyer après les tests
docker compose -f docker-compose.test.yml down -v
```

### Production
```bash
# Build l'image de production
docker build --target production -t api-samsoul:prod .

# Lancer en production
docker run -p 3000:3000 -e MONGO_URI=mongodb://host:27017/samsoul api-samsoul:prod
```

---

## 🔄 CI/CD Automatique

### GitHub Actions (`.github/workflows/test.yml`)
- ✅ S'exécute sur push vers `main` et `develop`
- ✅ S'exécute sur les pull requests
- Utilise le stage `test` du Dockerfile
- Nettoie automatiquement après les tests

### GitLab CI (`.gitlab-ci.yml`)
- ✅ S'exécute sur push vers `main` et `develop`
- ✅ S'exécute sur les merge requests
- Utilise le stage `test` du Dockerfile
- Nettoie automatiquement après les tests

**Les tests s'exécutent automatiquement lors d'un push, sans intervention manuelle !**

---

## 📁 Fichiers créés/modifiés

### Modifiés
- ✏️ `Dockerfile` - Ajout du stage `development` et réorganisation
- ✏️ `docker-compose.yml` - Configuré pour le développement local

### Créés
- ➕ `docker-compose.test.yml` - Configuration pour les tests
- ➕ `.github/workflows/test.yml` - Pipeline GitHub Actions
- ➕ `.gitlab-ci.yml` - Pipeline GitLab CI
- ➕ `README.md` - Documentation du projet
- ➕ `DOCKER_COMMANDS.md` - Référence des commandes utiles

---

## 🎯 Résumé

| Environnement | Commande | Tests ? | Stage Docker |
|---------------|----------|---------|--------------|
| **Dev local** | `docker compose up` | ❌ Non | `development` |
| **Tests manuels** | `docker compose -f docker-compose.test.yml up` | ✅ Oui | `test` |
| **CI/CD (GitHub/GitLab)** | Automatique sur push | ✅ Oui | `test` |
| **Production** | `docker build --target production` | ❌ Non | `production` |

---

## 💡 Avantages de cette configuration

✅ **Séparation claire** entre dev et tests
✅ **Pas de ralentissement** en développement local
✅ **Tests automatiques** en CI/CD
✅ **Images optimisées** pour chaque usage
✅ **Workflow moderne** avec GitHub/GitLab

---

Pour plus de détails sur les commandes, consultez `DOCKER_COMMANDS.md` !

