# 🔧 Dépannage (Troubleshooting)

## Problèmes courants et solutions

### ❌ "ERR_PNPM_NO_LOCKFILE Cannot install with frozen-lockfile"

**Problème** : Le fichier `pnpm-lock.yaml` n'est pas copié dans l'image Docker.

**Causes possibles** :
1. ❌ Le fichier est dans `.gitignore` et n'est pas commité
2. ❌ Le fichier n'existe pas dans le projet
3. ❌ Le `.dockerignore` bloque le fichier

**Solution** :

1. **Vérifier le .gitignore** :
   ```bash
   # Vérifier si pnpm-lock.yaml est ignoré
   cat .gitignore | grep pnpm-lock.yaml
   ```
   
   Si la ligne existe, **la supprimer** ! Le lockfile DOIT être versionné :
   ```gitignore
   # ❌ NE PAS FAIRE :
   pnpm-lock.yaml
   
   # ✅ Le lockfile doit être commité
   ```

2. **Générer le lockfile si nécessaire** :
   ```bash
   pnpm install
   ```

3. **Commiter le fichier** :
   ```bash
   git add pnpm-lock.yaml
   git commit -m "chore: add pnpm-lock.yaml to version control"
   git push
   ```

4. **Vérifier le Dockerfile** (copie explicite) :
   ```dockerfile
   COPY package.json ./
   COPY pnpm-lock.yaml ./
   ```
   **❌ Ne pas utiliser** : `COPY pnpm-lock.yaml* ./` (le wildcard peut échouer)

**Pourquoi versionner le lockfile ?**
- ✅ Garantit les mêmes versions partout (dev, CI/CD, prod)
- ✅ Builds reproductibles
- ✅ Évite les surprises en CI/CD
- ✅ Requis pour `--frozen-lockfile`

---

### ❌ "Port 27017 already in use"

**Problème** : MongoDB est déjà en cours d'exécution sur votre machine.

**Solution** :
```bash
# Arrêter tous les conteneurs
docker compose down
docker compose -f docker-compose.test.yml down

# Ou changer le port dans docker-compose.yml
ports:
  - "27018:27017"  # Utilise 27018 au lieu de 27017
```

---

### ❌ "Cannot connect to MongoDB"

**Problème** : L'API ne peut pas se connecter à MongoDB.

**Solution** :
```bash
# Vérifier que MongoDB est démarré
docker ps | grep mongo

# Vérifier les logs MongoDB
docker logs mongo-dev

# Redémarrer les services dans le bon ordre
docker compose down
docker compose up --build
```

**Vérifier** : L'URI MongoDB dans `docker-compose.yml` doit correspondre au nom du service :
```yaml
MONGO_URI: mongodb://mongo:27017/samsoul  # 'mongo' = nom du service
```

---

### ❌ "pnpm: command not found"

**Problème** : pnpm n'est pas installé dans l'image Docker.

**Solution** : Le Dockerfile utilise `corepack enable` qui active pnpm automatiquement. Vérifiez que cette ligne est présente :
```dockerfile
RUN corepack enable
```

---

### ❌ Tests qui échouent en CI/CD mais pas en local

**Problème** : Différence d'environnement entre local et CI/CD.

**Solution** :
```bash
# Tester exactement comme en CI/CD
docker compose -f docker-compose.test.yml down -v  # Nettoyer complètement
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Vérifier les logs
docker compose -f docker-compose.test.yml logs
```

---

### ❌ "Build failed: no space left on device"

**Problème** : Trop d'images Docker accumulées.

**Solution** :
```bash
# Nettoyer les images inutilisées
docker system prune -a

# Nettoyer les volumes orphelins
docker volume prune

# Nettoyer tout (ATTENTION : supprime TOUTES les images)
docker system prune -a --volumes
```

---

### ❌ Modifications du code non prises en compte

**Problème** : Le cache Docker utilise une ancienne version.

**Solution** :
```bash
# Rebuild sans cache
docker compose build --no-cache
docker compose up

# Ou en une ligne
docker compose up --build --force-recreate
```

---

### ❌ "Error: Cannot find module 'express'"

**Problème** : node_modules manquant ou incomplet.

**Solution** :
```bash
# Supprimer node_modules et rebuilder
docker compose down
docker compose build --no-cache
docker compose up
```

Dans le Dockerfile, vérifier que `pnpm install` est bien exécuté :
```dockerfile
RUN pnpm install --frozen-lockfile
```

---

### ❌ Hot reload ne fonctionne pas

**Problème** : Les volumes ne sont pas montés correctement.

**Vérifier** dans `docker-compose.yml` :
```yaml
volumes:
  - ./src:/app/src              # ✅ Monte src
  - ./package.json:/app/package.json
  - ./tsconfig.json:/app/tsconfig.json
```

**Note** : Le hot reload nécessite un script `dev` avec nodemon ou similaire. Par défaut, l'API rebuild à chaque démarrage.

---

### ❌ GitHub Actions échoue : "docker: command not found"

**Problème** : Docker n'est pas disponible dans le runner.

**Solution** : Le workflow GitHub Actions doit utiliser `ubuntu-latest` qui inclut Docker :
```yaml
jobs:
  test:
    runs-on: ubuntu-latest  # ✅ Inclut Docker
```

---

### ❌ GitLab CI échoue : "docker-compose: not found"

**Problème** : docker-compose n'est pas installé dans l'image.

**Vérifier** dans `.gitlab-ci.yml` :
```yaml
before_script:
  - apk add --no-cache docker-compose  # ✅ Installe docker-compose
```

---

### ❌ Variables d'environnement non lues

**Problème** : Le fichier `.env` n'est pas chargé.

**Solution** :
1. Créer le fichier `.env` à partir de `.env.example`
2. Vérifier que `docker-compose.yml` charge le fichier :
```yaml
env_file:
  - .env
```

Ou définir directement dans `docker-compose.yml` :
```yaml
environment:
  NODE_ENV: development
  MONGO_URI: mongodb://mongo:27017/samsoul
```

---

## 🔍 Commandes de débogage utiles

### Voir les logs d'un conteneur
```bash
docker logs api-dev
docker logs mongo-dev
docker logs -f api-dev  # Suivre en temps réel
```

### Entrer dans un conteneur
```bash
docker exec -it api-dev sh
# Puis tester des commandes
node --version
pnpm --version
ls -la
```

### Vérifier l'état des conteneurs
```bash
docker ps        # Conteneurs actifs
docker ps -a     # Tous les conteneurs
docker images    # Images disponibles
```

### Inspecter un conteneur
```bash
docker inspect api-dev
docker inspect mongo-dev
```

### Vérifier les volumes
```bash
docker volume ls
docker volume inspect api-samsoul_mongo_data
```

### Voir l'utilisation des ressources
```bash
docker stats
```

---

## 📞 Obtenir de l'aide

Si le problème persiste :

1. **Vérifier les logs** : `docker compose logs`
2. **Nettoyer complètement** : `docker compose down -v && docker system prune -a`
3. **Rebuilder** : `docker compose build --no-cache && docker compose up`
4. **Consulter la documentation** :
   - `README.md`
   - `SETUP_SUMMARY.md`
   - `WORKFLOW.md`
5. **Vérifier la configuration** :
   - Dockerfile
   - docker-compose.yml
   - package.json

---

## ✅ Checklist de santé du projet

- [ ] `docker compose up` démarre sans erreur
- [ ] L'API répond sur `http://localhost:3000`
- [ ] MongoDB est accessible depuis l'API
- [ ] Les tests passent : `docker compose -f docker-compose.test.yml up`
- [ ] Le build production fonctionne : `docker build --target production .`
- [ ] Les fichiers CI/CD sont présents : `.github/workflows/test.yml` et `.gitlab-ci.yml`

