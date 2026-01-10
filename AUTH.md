# API d'Authentification

## Routes disponibles

### 1. Inscription (Register)
**POST** `/api/auth/register`

Crée un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "John Doe"
}
```

**Réponse (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### 2. Connexion (Login)
**POST** `/api/auth/login`

Connecte un utilisateur existant.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### 3. Profil utilisateur (Me)
**GET** `/api/auth/me`

Récupère les informations de l'utilisateur connecté (route protégée).

**Headers requis:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-10T16:00:00.000Z",
  "updatedAt": "2026-01-10T16:00:00.000Z"
}
```

---

## Utilisation avec le Frontend

### Exemple avec Fetch API

```javascript
// 1. Inscription
const register = async (email, password, name) => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Sauvegarder le token (localStorage, sessionStorage, ou cookie)
    localStorage.setItem('token', data.token);
    return data;
  } else {
    throw new Error(data.message);
  }
};

// 2. Connexion
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.token);
    return data;
  } else {
    throw new Error(data.message);
  }
};

// 3. Récupérer le profil utilisateur
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message);
  }
};

// 4. Déconnexion (côté frontend)
const logout = () => {
  localStorage.removeItem('token');
};
```

### Exemple avec Axios

```javascript
import axios from 'axios';

// Configuration de base
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Inscription
export const register = (email, password, name) => 
  api.post('/auth/register', { email, password, name });

// Connexion
export const login = (email, password) => 
  api.post('/auth/login', { email, password });

// Profil
export const getProfile = () => 
  api.get('/auth/me');
```

---

## Protéger vos routes

Pour protéger une route existante avec l'authentification :

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth.middleware';
import { AuthRequest } from './types/auth.types';

const router = Router();

// Route protégée
router.get('/protected-route', authenticate, async (req: AuthRequest, res) => {
  // req.user contient les informations de l'utilisateur connecté
  const userId = req.user?._id;
  
  res.json({ 
    message: 'Accès autorisé',
    userId 
  });
});

export default router;
```

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès (login, get profile) |
| 201 | Créé avec succès (register) |
| 400 | Données invalides |
| 401 | Non authentifié ou token invalide |
| 409 | Email déjà utilisé |
| 500 | Erreur serveur |

---

## Sécurité

- Les mots de passe sont hashés avec bcrypt (salt rounds: 10)
- Les tokens JWT expirent après 7 jours
- Le mot de passe n'est jamais retourné dans les réponses API
- **Important:** Changez `JWT_SECRET` en production avec une clé forte
