/**
 * routes/regions.js
 * ------------------
 * Express routes for CMA/region-level endpoints.
 *
 * These power:
 *  - Regions dropdown list
 *  - CMA heatmap & ranking table for a given year
 *  - Per-region trend charts
 */

import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /api/regions/list
router.get('/list', async (_req, res) => {
  try {
    // TODO: replace with "SELECT DISTINCT region FROM app_crime_annual_region ORDER BY region"
    const sqlText = `
      SELECT DISTINCT region
      FROM app_crime_annual_region
      ORDER BY region;
    `;

    const rows = await query(sqlText);
    res.json({ regions: rows.map(r => r.region) });
  } catch (err) {
    console.error('Error in /api/regions/list:', err);
    res.status(500).json({ error: 'Failed to load regions list.' });
  }
});

// GET /api/regions/crime?year=YYYY
router.get('/crime', async (req, res) => {
  const year = parseInt(req.query.year, 10) || 2023;

  try:
    // TODO: replace with real metrics from app_crime_annual_region
    const sqlText = `
      SELECT
        region,
        year,
        crime_rate_per_100k = 5000,
        total_incidents = 100000
      FROM app_crime_annual_region
      WHERE year = @year;
    `;

    const rows = await query(sqlText, { year });

    res.json({
      year,
      regions: rows
    });
  } catch (err) {
    console.error('Error in /api/regions/crime:', err);
    res.status(500).json({ error: 'Failed to load regions crime data.' });
  }
});

// GET /api/regions/trend?region=NAME&from=YYYY&to=YYYY
router.get('/trend', async (req, res) => {
  const region = req.query.region;
  const fromYear = parseInt(req.query.from, 10) || 2010;
  const toYear = parseInt(req.query.to, 10) || 2024;

  if (!region) {
    return res.status(400).json({ error: 'region query parameter is required.' });
  }

  try {
    // TODO: replace with "SELECT year, crime_rate_per_100k, ... FROM app_crime_annual_region ..."
    const sqlText = `
      SELECT
        region,
        year,
        crime_rate_per_100k = 5000,
        total_incidents = 100000
      FROM app_crime_annual_region
      WHERE region = @region
        AND year BETWEEN @fromYear AND @toYear
      ORDER BY year;
    `;

    const rows = await query(sqlText, { region, fromYear, toYear });

    res.json({
      region,
      from: fromYear,
      to: toYear,
      trend: rows
    });
  } catch (err) {
    console.error('Error in /api/regions/trend:', err);
    res.status(500).json({ error: 'Failed to load region trend.' });
  }
});

export default router;
