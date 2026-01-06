import express from 'express'
import dotenv from 'dotenv'

import testRoute from './testRoute';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/test', testRoute);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

/*
2 accélérometres -> HashMap<String, Double>
1 capteur cardiaque -> HashMap<String, Double>
1 thermometre -> HashMap<String, Double>
+ temps de réaction -> List<Double>
+ données utilisateur
 */