/**
 * server.js
 * ----------
 * Entry point for the Gotham API service.
 *
 * Responsibilities:
 *  - Create an Express app
 *  - Configure CORS, JSON parsing, simple rate limiting
 *  - Mount healthcheck and API routes
 *  - Start HTTP server
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import ontarioRoutes from './routes/ontario.js';
import regionsRoutes from './routes/regions.js';

const app = express();
const port = process.env.PORT || 4000;

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: frontendOrigin
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 120               // 120 requests per minute
});
app.use(limiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Mount API routes
app.use('/api/ontario', ontarioRoutes);
app.use('/api/regions', regionsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server
app.listen(port, () => {
  console.log(`Gotham API listening on http://localhost:${port}`);
});
