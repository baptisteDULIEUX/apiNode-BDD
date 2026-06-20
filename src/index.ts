import express from 'express'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import testRoute from './testRoute';
import userDbRoutes from './routes/user.db.routes';
import sensorDbRoutes from './routes/sensor.db.routes';
import sessionDbRoutes from './routes/session.db.routes';
import phoneTestDbRoutes from './routes/phoneTest.db.routes';
import authRoutes from './routes/auth.routes';
import seedRoutes from './routes/seed.routes';
import adminRoutes from './routes/admin.routes';
import connectDB from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger Setup
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use('/api/test', testRoute);
app.use('/api/db/user', userDbRoutes);
app.use('/api/db/user', phoneTestDbRoutes);
app.use('/api/db/sensor', sensorDbRoutes);
app.use('/api/db', sessionDbRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/admin', adminRoutes);

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
