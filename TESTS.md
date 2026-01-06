# Tests de l'API SamSoul

## Structure des tests

### Tests créés :

1. **test/app.test.ts** - Tests de base pour la route de test
2. **test/database.test.ts** - Tests de la connexion MongoDB
3. **test/model.test.ts** - Tests du modèle SensorData
4. **test/db.test.ts** - Tests des routes de l'API (CRUD complet)

## Couverture des tests

### Routes testées :

#### POST /api/db/store
- ✅ Stockage de données complètes avec tous les champs
- ✅ Stockage de données minimales
- ✅ Gestion des erreurs (userId manquant)

#### GET /api/db/user/:userId
- ✅ Récupération de toutes les données d'un utilisateur
- ✅ Pagination avec limit et skip
- ✅ Utilisateur inexistant (retourne tableau vide)

#### GET /api/db/user/:userId/latest
- ✅ Récupération des dernières données d'un utilisateur
- ✅ Utilisateur inexistant (retourne 404)

#### GET /api/db/user/:userId/range
- ✅ Récupération par plage de dates (startDate et endDate)
- ✅ Récupération avec seulement startDate
- ✅ Récupération sans filtres de date

#### DELETE /api/db/user/:userId
- ✅ Suppression de toutes les données d'un utilisateur
- ✅ Utilisateur inexistant (retourne deletedCount: 0)

### Modèle testé :

- ✅ Création avec tous les champs
- ✅ Création avec champs minimaux
- ✅ Validation (userId requis)
- ✅ Timestamp automatique
- ✅ Types Map pour données de capteurs
- ✅ Recherche par userId
- ✅ Tri par timestamp

### Connexion DB testée :

- ✅ Connexion MongoDB réussie
- ✅ Objet de connexion valide

## Exécution des tests

### Prérequis
1. MongoDB doit être en cours d'exécution localement ou accessible via l'URI configuré
2. Les dépendances doivent être installées : `pnpm install`

### Commandes

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests en mode watch
pnpm test --watch

# Exécuter les tests avec couverture
pnpm test --coverage
```

### Configuration

Les tests utilisent l'environnement configuré dans `.env` ou `.env.test`.

Variable d'environnement importante :
- `MONGODB_URI` : URI de connexion MongoDB (défaut: mongodb://localhost:27017/samsoul)

## Notes importantes

- Les tests nettoient automatiquement les données de test après exécution
- Chaque suite de tests utilise des userId de test uniques pour éviter les conflits
- La connexion MongoDB est fermée automatiquement après tous les tests
- Les tests attendent que la connexion DB soit établie avant de s'exécuter

