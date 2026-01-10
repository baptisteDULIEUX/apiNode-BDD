# Tests de l'API SamSoul

## Structure des tests

### Tests créés :

1. **test/app.test.ts** - Tests de base pour la route de test
2. **test/database.test.ts** - Tests de la connexion MongoDB
3. **test/model.test.ts** - Tests du modèle SensorData
4. **test/db.test.ts** - Tests des routes de l'API (CRUD complet)
5. **test/user.model.test.ts** - Tests du modèle User (authentification)
6. **test/auth.routes.test.ts** - Tests des routes d'authentification
7. **test/auth.middleware.test.ts** - Tests du middleware d'authentification

## Tests d'authentification

### User Model Tests (test/user.model.test.ts)

#### Création d'utilisateur
- ✅ Création avec données valides
- ✅ Hash automatique du mot de passe
- ✅ Pas de re-hash si le mot de passe n'est pas modifié

#### Validation
- ✅ Email requis
- ✅ Mot de passe requis
- ✅ Nom requis
- ✅ Format d'email valide
- ✅ Email unique
- ✅ Longueur minimale du mot de passe (6 caractères)
- ✅ Conversion email en minuscules
- ✅ Trim des espaces (email et nom)

#### Comparaison de mot de passe
- ✅ Validation d'un mot de passe correct
- ✅ Rejet d'un mot de passe incorrect
- ✅ Gestion des mots de passe vides

#### Requêtes utilisateur
- ✅ Mot de passe non retourné par défaut
- ✅ Mot de passe retourné avec select explicite

### Auth Routes Tests (test/auth.routes.test.ts)

#### POST /api/auth/register
- ✅ Inscription avec données valides
- ✅ Erreur 400 si email manquant
- ✅ Erreur 400 si mot de passe manquant
- ✅ Erreur 400 si nom manquant
- ✅ Erreur 409 si email déjà utilisé
- ✅ Hash du mot de passe

#### POST /api/auth/login
- ✅ Connexion avec credentials valides
- ✅ Erreur 400 si email manquant
- ✅ Erreur 400 si mot de passe manquant
- ✅ Erreur 401 avec email inexistant
- ✅ Erreur 401 avec mot de passe incorrect
- ✅ Email insensible à la casse

#### GET /api/auth/me
- ✅ Retour du profil avec token valide
- ✅ Erreur 401 sans token
- ✅ Erreur 401 avec token invalide
- ✅ Erreur 401 avec header Authorization malformé
- ✅ Erreur 401 si l'utilisateur n'existe plus

#### Validation des tokens
- ✅ Tokens différents pour différents utilisateurs
- ✅ Nouveau token à chaque login

#### Tests d'intégration
- ✅ Parcours complet : register → login → get profile

### Auth Middleware Tests (test/auth.middleware.test.ts)

#### Token valide
- ✅ Authentification avec token valide
- ✅ Utilisateur attaché à la requête
- ✅ Support de différents formats d'Authorization header

#### Token manquant
- ✅ Erreur 401 sans header Authorization
- ✅ Erreur 401 si le header ne commence pas par "Bearer"
- ✅ Erreur 401 si le header est vide

#### Token invalide
- ✅ Erreur 401 avec token malformé
- ✅ Erreur 401 avec token expiré
- ✅ Erreur 401 si l'utilisateur n'existe pas
- ✅ Erreur 401 avec token signé avec un secret différent

#### Configuration JWT_SECRET
- ✅ Erreur 500 si JWT_SECRET n'est pas configuré

#### Objet utilisateur
- ✅ Mot de passe non inclus dans l'objet user
- ✅ Tous les autres champs inclus

#### Cas limites
- ✅ Gestion des espaces supplémentaires
- ✅ Sensibilité à la casse pour "Bearer"
- ✅ Gestion d'un token sans userId

## Couverture des tests SensorData

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

