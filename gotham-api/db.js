/**
 * db.js
 * ----------
 * Centralized database access layer for the Gotham API.
 * In production this will connect to the Microsoft Fabric SQL endpoint and expose
 * a simple `query(sql, params)` function used by all route handlers.
 *
 * While you don't have Fabric access, this file returns mock data so you can
 * build and test the API and frontend wiring.
 */

import 'dotenv/config';
import sql from 'mssql';

const useMock = !process.env.FABRIC_SQL_SERVER; // if no env, fall back to mock mode

// --- REAL DB CONFIG (Fabric SQL endpoint) ----------------------------------

// When you're ready, fill these from environment variables (.env).
const dbConfig = {
  server: process.env.FABRIC_SQL_SERVER,     // e.g. "tcp:<server>.sql.azuresynapse.net,1433"
  database: process.env.FABRIC_SQL_DATABASE, // e.g. "dataRaw"
  user: process.env.FABRIC_SQL_USER,
  password: process.env.FABRIC_SQL_PASSWORD,
  options: {
    encrypt: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

/**
 * getPool()
 * Lazily creates and then returns a shared connection pool.
 */
let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

/**
 * query(sqlText, params)
 *
 * In real mode: runs a parameterized query against Fabric SQL and returns `recordset`.
 * In mock mode: returns small hard-coded data suitable for frontend wiring.
 */
export async function query(sqlText, params = {}) {
  if (useMock) {
    return mockQuery(sqlText, params);
  }

  const pool = await getPool();
  const request = pool.request();

  // Bind parameters
  Object.entries(params).forEach(([name, value]) => {
    request.input(name, value);
  });

  const result = await request.query(sqlText);
  return result.recordset;
}

// ---------------------------------------------------------------------------
// MOCK IMPLEMENTATION (no Fabric access yet)
// ---------------------------------------------------------------------------

function mockQuery(sqlText, params) {
  // Very simple SQL sniffing to decide which mock to return.
  const normalized = sqlText.toLowerCase();

  if (normalized.includes('from app_crime_annual_ontario') && normalized.includes('summary')) {
    // Ontario summary example
    return Promise.resolve([
      {
        year: params.year || 2023,
        total_incidents: 123456,
        crime_rate_per_100k: 4500.2,
        cleared_incidents: 78000,
        percent_cleared: 63.1
      }
    ]);
  }

  if (normalized.includes('from app_crime_annual_ontario') && normalized.includes('order by year')) {
    // Ontario trend example
    return Promise.resolve([
      { year: 2010, crime_rate_per_100k: 5200 },
      { year: 2015, crime_rate_per_100k: 4800 },
      { year: 2020, crime_rate_per_100k: 4600 },
      { year: 2023, crime_rate_per_100k: 4500 }
    ]);
  }

  if (normalized.includes('from app_crime_annual_region') && normalized.includes('distinct')) {
    // Regions list
    return Promise.resolve([
      { region: 'Toronto' },
      { region: 'Ottawa–Gatineau' },
      { region: 'Hamilton' }
    ]);
  }

  if (normalized.includes('from app_crime_annual_region') && normalized.includes('where year =')) {
    // Regions crime for a year
    return Promise.resolve([
      {
        region: 'Toronto',
        year: params.year || 2023,
        crime_rate_per_100k: 5100,
        total_incidents: 200000
      },
      {
        region: 'Ottawa–Gatineau',
        year: params.year || 2023,
        crime_rate_per_100k: 4300,
        total_incidents: 50000
      }
    ]);
  }

  if (normalized.includes('from app_crime_annual_region') && normalized.includes('where region =')) {
    // Single region trend
    const region = params.region || 'Toronto';
    return Promise.resolve([
      { region, year: 2010, crime_rate_per_100k: 5400 },
      { region, year: 2015, crime_rate_per_100k: 5200 },
      { region, year: 2020, crime_rate_per_100k: 5000 },
      { region, year: 2023, crime_rate_per_100k: 4900 }
    ]);
  }

  // Default: empty result
  return Promise.resolve([]);
}
