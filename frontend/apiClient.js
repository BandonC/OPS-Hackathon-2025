/**
 * apiClient.js
 * -------------
 * Thin wrapper around fetch for calling the Gotham API from the React frontend.
 * All components should call these functions instead of hard-coding URLs.
 */

const API_BASE_URL = import.meta.env.VITE_GOTHAM_API_BASE || 'http://localhost:4000/api';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function getOntarioSummary(year) {
  const url = `${API_BASE_URL}/ontario/summary?year=${encodeURIComponent(year)}`;
  return getJson(url);
}

export async function getOntarioTrend(fromYear, toYear) {
  const url = `${API_BASE_URL}/ontario/trend?from=${encodeURIComponent(fromYear)}&to=${encodeURIComponent(toYear)}`;
  return getJson(url);
}

export async function getRegionsList() {
  const url = `${API_BASE_URL}/regions/list`;
  return getJson(url);
}

export async function getRegionsCrime(year) {
  const url = `${API_BASE_URL}/regions/crime?year=${encodeURIComponent(year)}`;
  return getJson(url);
}

export async function getRegionTrend(region, fromYear, toYear) {
  const url = `${API_BASE_URL}/regions/trend?region=${encodeURIComponent(region)}&from=${encodeURIComponent(fromYear)}&to=${encodeURIComponent(toYear)}`;
  return getJson(url);
}
