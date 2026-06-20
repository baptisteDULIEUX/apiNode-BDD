# API SamSoul

API pour connecter l'application SamSoul avec une base de données MongoDB.

## 🚀 Démarrage rapide

### Développement local (sans tests)

Pour lancer l'API en mode développement local sans exécuter les tests :

```bash
docker compose up --build
```

L'API sera accessible sur `http://localhost:3000`

### Exécuter les tests manuellement

Si vous souhaitez lancer les tests en local :

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

### Arrêter les services

```bash
# Pour le développement
docker compose down

# Pour les tests
docker compose -f docker-compose.test.yml down -v
```

## 🔧 Configuration

### Environnements Docker disponibles

Le `Dockerfile` contient plusieurs stages :

- **builder** : Construction de l'application TypeScript
- **production** : Image optimisée pour la production
- **development** : Image pour le développement local (sans tests)
- **test** : Image pour exécuter les tests (utilisée en CI/CD)

### Variables d'environnement

Copiez `.env.example` vers `.env` et ajustez les valeurs selon vos besoins :

```bash
cp .env.example .env
```

## 🧪 CI/CD

Les tests s'exécutent automatiquement sur push vers GitHub ou GitLab :

### GitHub Actions
- Configuré dans `.github/workflows/test.yml`
- S'exécute sur les branches `main` et `develop`
- S'exécute également sur les pull requests

### GitLab CI
- Configuré dans `.gitlab-ci.yml`
- S'exécute sur les branches `main` et `develop`
- S'exécute également sur les merge requests

Les tests utilisent automatiquement le stage `test` du Dockerfile avec le fichier `docker-compose.test.yml`.

## 📦 Technologies

- **Node.js 22** (Alpine)
- **TypeScript**
- **Express**
- **MongoDB 7**
- **Mongoose**
- **Swagger / OpenAPI 3.0** (Documentation)
- **Vitest** (tests)
- **pnpm** (gestionnaire de paquets)

## 🛠️ Scripts disponibles

```bash
# Lancer le serveur en mode développement
pnpm run dev

# Build du projet
pnpm run build

# Lancer les tests
pnpm test
```

## 📚 Documentation

L'API est documentée de manière interactive via **Swagger / OpenAPI**.

Une fois l'application démarrée (via Docker ou `pnpm run dev`), la documentation complète et testable de l'API est accessible à l'adresse suivante :
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

- `TESTS.md` - Explications sur l'architecture et l'exécution des tests
- `WORKFLOW.md` - Guide sur les processus Git et CI/CD du projet

## 📝 Licence

Privé

