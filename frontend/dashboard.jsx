/**
 * dashboard.jsx
 * ------------------
 * Gotham landing dashboard.
 *
 * Data sources (per architecture plan):
 *  - /api/ontario/summary -> crime_annual_ontario, court_flow_annual, corrections_annual
 *  - /api/ontario/trend   -> crime_annual_ontario time series
 */

import { useEffect, useState } from 'react';
import { getOntarioSummary, getOntarioTrend } from '../api/apiClient';

export default function DashboardPage() {
  const [year, setYear] = useState(2023);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);
  const [errorTrend, setErrorTrend] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      setLoadingSummary(true);
      setErrorSummary(null);
      try {
        const data = await getOntarioSummary(year);
        setSummary(data.summary);
      } catch (err) {
        console.error(err);
        setErrorSummary(err.message);
      } finally {
        setLoadingSummary(false);
      }
    }
    loadSummary();
  }, [year]);

  useEffect(() => {
    async function loadTrend() {
      setLoadingTrend(true);
      setErrorTrend(null);
      try {
        const data = await getOntarioTrend(2010, 2024);
        setTrend(data.trend || []);
      } catch (err) {
        console.error(err);
        setErrorTrend(err.message);
      } finally {
        setLoadingTrend(false);
      }
    }
    loadTrend();
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Gotham Dashboard</h1>
        <div>
          <label>
            Year:&nbsp;
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {Array.from({ length: 15 }).map((_, idx) => {
                const y = 2010 + idx;
                return (
                  <option key={y} value={y}>{y}</option>
                );
              })}
            </select>
          </label>
        </div>
      </header>

      <section className="dashboard-kpis">
        {loadingSummary && <p>Loading KPIs…</p>}
        {errorSummary && <p className="error">Failed to load summary: {errorSummary}</p>}
        {summary && !loadingSummary && !errorSummary && (
          <div className="kpi-grid">
            <KpiCard
              title="Total Incidents"
              value={summary.total_incidents?.toLocaleString()}
            />
            <KpiCard
              title="Crime Rate per 100k"
              value={summary.crime_rate_per_100k?.toFixed(1)}
            />
            <KpiCard
              title="Cleared Incidents"
              value={summary.cleared_incidents?.toLocaleString()}
            />
            <KpiCard
              title="Clearance Rate (%)"
              value={summary.percent_cleared?.toFixed(1)}
            />
          </div>
        )}
      </section>

      <section className="dashboard-trend">
        <h2>Ontario Crime Trend (2010–2024)</h2>
        {loadingTrend && <p>Loading trend…</p>}
        {errorTrend && <p className="error">Failed to load trend: {errorTrend}</p>}
        {!loadingTrend && !errorTrend && trend.length === 0 && (
          <p>No trend data available.</p>
        )}
        {!loadingTrend && !errorTrend && trend.length > 0 && (
          <SimpleTrendChart data={trend} />
        )}
      </section>
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value ?? '—'}</div>
    </div>
  );
}

// Very simple SVG trend chart; you can replace with a real chart lib later.
function SimpleTrendChart({ data }) {
  const width = 600;
  const height = 200;
  const padding = 20;

  const years = data.map(d => d.year);
  const values = data.map(d => d.crime_rate_per_100k);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const xScale = year =>
    padding +
    ((year - minYear) / (maxYear - minYear || 1)) * (width - 2 * padding);

  const yScale = val =>
    height - padding -
    ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);

  const pathD = data
    .map((d, i) => {
      const x = xScale(d.year);
      const y = yScale(d.crime_rate_per_100k);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="trend-chart">
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />
      {data.map(d => (
        <circle
          key={d.year}
          cx={xScale(d.year)}
          cy={yScale(d.crime_rate_per_100k)}
          r={3}
        />
      ))}
    </svg>
  );
}
