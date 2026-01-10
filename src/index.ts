import express from 'express'
import dotenv from 'dotenv'

import testRoute from './testRoute';
import dbRoute from './dbRoute';
import authRoutes from './routes/auth.routes';
import connectDB from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/test', testRoute);
app.use('/api/db', dbRoute);
app.use('/api/auth', authRoutes);

// Ne connecter à MongoDB que si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

/*
2 accéléromètres -> HashMap<String, Double>
1 capteur cardiaque -> HashMap<String, Double>
1 thermomètre -> HashMap<String, Double>
+ temps de réaction -> List<Double>
+ données utilisateur
 */

/**
 * Spécifications de l'API :
 *
 * - L'API est de type REST écrite en Node.JS
 * - Elle est notamment utilisée par le serveur de centralisation des données comme relais vers la BDD, et par le frontend.
 * - L'API doit proposer des routes pour :
 *
 *   - Stocker des données en BDD
 *   - Récupérer des données en BDD
 *   - lancer des scripts python qui utilisent une IA pré-entrainée pour faire de la prédiction, classification, etc.
 *
 * - Cette API doit pouvoir lancer des scripts python et récupérer les résultats de ces scripts pour ensuite les stocker en BDD ou les renvoyer au frontend.
 */
