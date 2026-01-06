# Commandes Docker utiles

## Développement local (sans tests)

### Lancer l'API en mode développement
```bash
docker compose up --build
```

### Lancer en arrière-plan
```bash
docker compose up -d --build
```

### Voir les logs
```bash
docker compose logs -f api
```

### Arrêter les services
```bash
docker compose down
```

### Arrêter et supprimer les volumes
```bash
docker compose down -v
```

## Tests

### Lancer les tests
```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

### Nettoyer après les tests
```bash
docker compose -f docker-compose.test.yml down -v
```

## Production

### Construire l'image de production
```bash
docker build --target production -t api-samsoul:prod .
```

### Lancer l'image de production
```bash
docker run -p 3000:3000 -e MONGO_URI=mongodb://host:27017/samsoul api-samsoul:prod
```

## Debugging

### Entrer dans le conteneur en cours d'exécution
```bash
docker exec -it api-dev sh
```

### Voir les conteneurs en cours
```bash
docker ps
```

### Voir tous les conteneurs
```bash
docker ps -a
```

### Nettoyer tous les conteneurs arrêtés
```bash
docker container prune
```

### Nettoyer toutes les images non utilisées
```bash
docker image prune -a
```

