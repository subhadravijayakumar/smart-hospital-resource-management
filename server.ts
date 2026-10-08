import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './server/db.ts';
import { trainHospitalPredictionModels } from './server/ml/predictionEngine.ts';
import { apiRouter } from './server/routes/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Initialize SQLite Database and run seed migrations
  console.log('Initializing Smart Hospital Relational Database...');
  initDatabase();
  console.log('Database initialized successfully.');

  // Pre-train ML Prediction Models
  console.log('Training Machine Learning Multivariate Regression Models...');
  trainHospitalPredictionModels();
  console.log('ML Models trained and ready for inference.');

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Smart Hospital Resource Optimization Engine',
      database: 'Connected (SQLite/MySQL Compatible)',
      ml_status: 'Models Trained & Calibrated'
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Hospital Resource Management System is running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
