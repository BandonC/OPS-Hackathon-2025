/**
 * routes/ontario.js
 * ------------------
 * Express routes exposing Ontario-level summary and trend data
 * (crime + courts + corrections) to the frontend.
 *
 * These correspond to the endpoints described in the architecture plan:
 *  - GET /api/ontario/summary?year=YYYY
 *  - GET /api/ontario/trend?from=YYYY&to=YYYY
 */

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /api/ontario/summary?year=YYYY
router.get('/summary', async (req, res) => {
  const year = parseInt(req.query.year, 10) || 2023;

  try {
    // TODO: Replace this SQL with a real joined query once Fabric is available.
    const sqlText = `
      -- Replace this SELECT with a real aggregation from app_crime_annual_ontario,
      -- app_court_flow_annual, and app_corrections_annual.
      SELECT
        ${year} AS year,
        123456 AS total_incidents,          -- placeholder
        4500.2 AS crime_rate_per_100k,      -- placeholder
        78000 AS cleared_incidents,         -- placeholder
        63.1 AS percent_cleared             -- placeholder
      FROM app_crime_annual_ontario AS summary
    `;

    const rows = await query(sqlText, { year });
    const summary = rows[0] || null;

    res.json({ year, summary });
  } catch (err) {
    console.error('Error in /api/ontario/summary:', err);
    res.status(500).json({ error: 'Failed to load Ontario summary.' });
  }
});

// GET /api/ontario/trend?from=YYYY&to=YYYY
router.get('/trend', async (req, res) => {
  const fromYear = parseInt(req.query.from, 10) || 2010;
  const toYear = parseInt(req.query.to, 10) || 2024;

  try {
    // TODO: Replace this with a real SELECT from app_crime_annual_ontario.
    const sqlText = `
      -- Replace this with:
      -- SELECT year, crime_rate_per_100k, total_incidents, ...
      -- FROM app_crime_annual_ontario
      -- WHERE year BETWEEN @fromYear AND @toYear
      -- ORDER BY year;
      SELECT
        year = 2010,
        crime_rate_per_100k = 5200
    `;

    const rows = await query(sqlText, {
      fromYear,
      toYear
    });

    res.json({
      from: fromYear,
      to: toYear,
      trend: rows
    });
  } catch (err) {
    console.error('Error in /api/ontario/trend:', err);
    res.status(500).json({ error: 'Failed to load Ontario trend.' });
  }
});

export default router;
