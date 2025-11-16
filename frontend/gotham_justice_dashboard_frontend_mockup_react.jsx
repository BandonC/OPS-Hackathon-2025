import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Search,
  Map as MapIcon,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Shield,
  Filter,
  TrendingUp,
  Users,
  Play,
  Pause,
  Flame,
  BookMarked,
  BookmarkPlus,
  Beaker,
  Settings2,
  Eye,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

// --- Mock data --- //
const years = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i);

const mockTrend = years.map((y, i) => ({ year: String(y), rate: 1900 - i * 40 + (i % 2 ? 60 : -20) }));
const mockViolations = [
  { type: "Assault", count: 4200 },
  { type: "Theft", count: 5300 },
  { type: "Break & Enter", count: 1500 },
  { type: "Homicide", count: 72 },
  { type: "Fraud", count: 2100 },
];

const mockIntake = [
  { year: "2020", Intake: 4800, Cleared: 2100 },
  { year: "2021", Intake: 5050, Cleared: 2300 },
  { year: "2022", Intake: 5200, Cleared: 2450 },
  { year: "2023", Intake: 5400, Cleared: 2600 },
  { year: "2024", Intake: 5600, Cleared: 2750 },
];

// mock anomaly scores aligned to years
const mockAnomaly = years.map((y, i) => ({
  year: String(y),
  score: i % 3 === 0 ? 7 : i % 5 === 0 ? 10 : 2 + (i % 4),
}));

const municipalities = [
  "All Ontario",
  "Toronto",
  "Ottawa",
  "Peel Region",
  "York Region",
  "Hamilton",
  "London",
  "Windsor",
  "Kingston",
];

// --- Small UI atoms --- //
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      {children}
    </span>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function KPI({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex items-center gap-4">
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">{icon}</div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

// Simple runtime tests panel to validate core logic
function TestPanel({
  filteredTrend,
  forecastSeries,
  forecastHorizon,
  yearRange,
  simCrimeRate,
}: {
  filteredTrend: { year: string; rate: number }[];
  forecastSeries: { year: string; rate: number }[];
  forecastHorizon: number;
  yearRange: [number, number];
  simCrimeRate: number;
}) {
  const tests = [
    {
      name: "forecast length matches horizon when data exists",
      pass:
        (filteredTrend.length === 0 && forecastSeries.length === 0) ||
        (filteredTrend.length > 0 && forecastSeries.length === forecastHorizon),
    },
    {
      name: "filteredTrend years within range",
      pass: filteredTrend.every(
        (d) => Number(d.year) >= yearRange[0] && Number(d.year) <= yearRange[1]
      ),
    },
    { name: "simCrimeRate is number >= 0", pass: Number.isFinite(simCrimeRate) && simCrimeRate >= 0 },
  ];
  return (
    <div className="mt-2 text-xs text-slate-600">
      <div className="font-medium mb-1">Self‑tests</div>
      <ul className="space-y-1">
        {tests.map((t, i) => (
          <li key={i}>
            <Badge>{t.pass ? "PASS" : "FAIL"}</Badge> {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GothamJusticeDashboardMock() {
  // --- Nav state --- //
  const [tab, setTab] = useState<"Dashboard" | "Heatmaps" | "Trends">("Dashboard");

  // --- Filter state --- //
  const [selectedYear, setSelectedYear] = useState<number>(years[years.length - 1]);
  const [yearRange, setYearRange] = useState<[number, number]>([
    2020,
    years[years.length - 1],
  ]);
  const [municipality, setMunicipality] = useState<string>("All Ontario");
  const [query, setQuery] = useState("");
  const [violations, setViolations] = useState<string[]>([
    "Assault",
    "Theft",
    "Break & Enter",
    "Homicide",
    "Fraud",
  ]);
  const [ageGroup, setAgeGroup] = useState<"Adult" | "Youth" | "Both">("Both");
  const [clearance, setClearance] = useState<"Any" | "By Charge" | "Otherwise">(
    "Any"
  );
  const [rate, setRate] = useState<number>(2000);

  // --- Accessibility & View --- //
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  // --- Heatmap controls --- //
  const [heatCrimeType, setHeatCrimeType] = useState<string>("All");
  const [heatAutoPlay, setHeatAutoPlay] = useState(false);
  const [heatYear, setHeatYear] = useState<number>(yearRange[0]);
  useEffect(() => {
    if (!heatAutoPlay) return;
    const id = setInterval(() => {
      setHeatYear((y) => (y >= yearRange[1] ? yearRange[0] : y + 1));
    }, 1200);
    return () => clearInterval(id);
  }, [heatAutoPlay, yearRange]);

  // --- Trends controls --- //
  const [seasonalityMode, setSeasonalityMode] = useState<"Off" | "On">("On");
  const [forecastHorizon, setForecastHorizon] = useState<5 | 10>(5);
  const [showForecast, setShowForecast] = useState(true);

  // --- Bookmarks --- //
  const presets = {
    Courts: { municipality: "All Ontario", heatCrimeType: "Assault" },
    Corrections: { municipality: "Peel Region", heatCrimeType: "Theft" },
    Police: { municipality: "Toronto", heatCrimeType: "All" },
  } as const;
  const applyPreset = (k: keyof typeof presets) => {
    setMunicipality(presets[k].municipality);
    setHeatCrimeType(presets[k].heatCrimeType);
  };

  const filteredTrend = useMemo(() => {
    let base = mockTrend.filter(
      (d) => Number(d.year) >= yearRange[0] && Number(d.year) <= yearRange[1]
    );
    if (seasonalityMode === "On") {
      base = base.map((d, i) => ({
        ...d,
        rate: d.rate - (i % 4 === 0 ? 10 : 0),
      }));
    }
    return base;
  }, [yearRange, seasonalityMode]);

  const forecastSeries = useMemo(() => {
    if (!filteredTrend.length) return [] as { year: string; rate: number }[];
    const lastYear = Number(filteredTrend.at(-1)!.year);
    const lastRate = filteredTrend.at(-1)!.rate;
    const growth = 0.02; // mock 2% YoY growth
    const out: { year: string; rate: number }[] = [];
    for (let k = 1; k <= forecastHorizon; k++) {
      out.push({
        year: String(lastYear + k),
        rate: Math.round(lastRate * Math.pow(1 + growth, k)),
      });
    }
    return out;
  }, [filteredTrend, forecastHorizon]);

  const filteredViolations = useMemo(
    () => mockViolations.filter((v) => violations.includes(v.type)),
    [violations]
  );

  // --- Scenario simulation --- //
  const [scenarioClearanceDelta, setScenarioClearanceDelta] = useState(3); // percentage points
  const [scenarioTheftDelta, setScenarioTheftDelta] = useState(-5); // % change
  const simCrimeRate = useMemo(() => {
    const base = filteredTrend.at(-1)?.rate ?? 0;
    const adj = base * (scenarioTheftDelta / 100) - scenarioClearanceDelta * 2;
    return Math.max(200, Math.round(base + adj));
  }, [filteredTrend, scenarioClearanceDelta, scenarioTheftDelta]);

  // --- Handlers --- //
  const toggleViolation = (t: string) => {
    setViolations((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // --- UI --- //
  return (
    <div
      className={`${highContrast ? "contrast-150" : ""} min-h-screen bg-slate-50 text-slate-900`}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <MapIcon className="w-6 h-6 text-slate-700" />
          <h1 className="text-xl font-semibold">Gotham · Justice Dimension Data</h1>

          {/* Global search */}
          <div className="ml-6 relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search (e.g., 'Toronto assault 2023 clearance')"
              className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-slate-600">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button className="inline-flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 hover:bg-slate-100">
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </button>
            <button className="inline-flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white hover:bg-slate-50">
              <Download className="w-4 h-4" /> Export Briefing
            </button>
          </div>
        </div>

        {/* Bookmarks row */}
        <div className="max-w-7xl mx-auto px-4 pb-2 flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-slate-700" />
          <span className="text-sm text-slate-600">Bookmark Views:</span>
          <button
            onClick={() => applyPreset("Courts")}
            className="text-sm px-2 py-1 border rounded-lg"
          >
            Courts
          </button>
          <button
            onClick={() => applyPreset("Corrections")}
            className="text-sm px-2 py-1 border rounded-lg"
          >
            Corrections
          </button>
          <button
            onClick={() => applyPreset("Police")}
            className="text-sm px-2 py-1 border rounded-lg"
          >
            Police
          </button>
          <button className="ml-2 inline-flex items-center gap-1 text-sm px-2 py-1 border rounded-lg">
            <BookmarkPlus className="w-4 h-4" />Save current
          </button>

          {/* Accessibility quick controls */}
          <div className="ml-auto flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-700" />
            <label className="text-xs">High contrast</label>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
            <label className="text-xs ml-3">Font</label>
            <input
              type="range"
              min={0.9}
              max={1.2}
              step={0.05}
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2">
          <Tab
            active={tab === "Dashboard"}
            onClick={() => setTab("Dashboard")}
            icon={<LayoutGrid className="w-4 h-4" />}
            label="Dashboard"
          />
          <Tab
            active={tab === "Heatmaps"}
            onClick={() => setTab("Heatmaps")}
            icon={<Flame className="w-4 h-4" />}
            label="Heatmaps"
          />
          <Tab
            active={tab === "Trends"}
            onClick={() => setTab("Trends")}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Trends"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar Filters */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
              <h2 className="font-medium">Filters</h2>
            </div>

            {/* Municipality */}
            <label className="text-xs text-slate-600">Municipality</label>
            <div className="relative mt-1 mb-3">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search municipality"
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm mb-4"
            >
              {municipalities
                .filter((m) => m.toLowerCase().includes(query.toLowerCase()))
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>

            {/* Violation Type */}
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-1">Violation Type</div>
              <div className="grid grid-cols-2 gap-2">
                {mockViolations.map((v) => (
                  <label key={v.type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={violations.includes(v.type)}
                      onChange={() => toggleViolation(v.type)}
                    />
                    <span>{v.type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-1">Age Group</div>
              <div className="flex items-center gap-3 text-sm">
                {(["Both", "Adult", "Youth"] as const).map((a) => (
                  <label key={a} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="age"
                      checked={ageGroup === a}
                      onChange={() => setAgeGroup(a)}
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clearance Type */}
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-1">Clearance</div>
              <select
                value={clearance}
                onChange={(e) => setClearance(e.target.value as any)}
                className="w-full border rounded-lg px-2 py-2 text-sm"
              >
                <option>Any</option>
                <option>By Charge</option>
                <option>Otherwise</option>
              </select>
            </div>

            {/* Crime Rate */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Crime Rate ≤</span>
                <Badge>{rate.toLocaleString()}</Badge>
              </div>
              <input
                type="range"
                min={200}
                max={3000}
                step={50}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Year Range */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Years</span>
                <Badge>
                  {yearRange[0]}–{yearRange[1]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min={2020}
                  max={selectedYear}
                  value={yearRange[0]}
                  onChange={(e) =>
                    setYearRange([Number(e.target.value), yearRange[1]])
                  }
                  className="w-20 border rounded-lg px-2 py-1 text-sm"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  min={yearRange[0]}
                  max={selectedYear}
                  value={yearRange[1]}
                  onChange={(e) =>
                    setYearRange([yearRange[0], Number(e.target.value)])
                  }
                  className="w-20 border rounded-lg px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Data Integration status */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-4 h-4 text-slate-700" />
              <h3 className="font-medium">Data Integration</h3>
            </div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>
                Azure Data Factory: <Badge>Scheduled</Badge>
              </li>
              <li>
                Databricks ETL: <Badge>OK</Badge>
              </li>
              <li>
                Schema: <Badge>Standardized</Badge>
              </li>
            </ul>
          </div>

          {/* About Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h3 className="font-medium">Purpose</h3>
            </div>
            <p className="text-sm text-slate-600">
              Track Ontario police-reported crime, charges, and court intake. Filters for municipality, violation, age,
              clearance, and time. Update annually.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <section className="col-span-12 lg:col-span-9 space-y-6">
          {tab === "Dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPI
                  title="Total Incidents"
                  value="12,340"
                  subtitle="Filtered view"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <KPI
                  title="Clearance by Charge"
                  value="41%"
                  subtitle="y/y +3pp"
                  icon={<Filter className="w-5 h-5" />}
                />
                <KPI
                  title="Adult vs Youth"
                  value="88% / 12%"
                  subtitle="share of charges"
                  icon={<Users className="w-5 h-5" />}
                />
                <KPI
                  title="Crime Rate"
                  value={`1,640 /100k`}
                  subtitle={`${yearRange[0]}–${yearRange[1]}`}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Ontario Crime Map</h3>
                    <Badge>Embed Power BI</Badge>
                  </div>
                  <div className="h-60 grid place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <MapIcon className="w-5 h-5" />
                      <span>Map visualization placeholder</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Violation Distribution</h3>
                    <div className="flex gap-2 flex-wrap">
                      {violations.map((v) => (
                        <Badge key={v}>{v}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredViolations}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Insights</h3>
                  <div className="flex gap-2">
                    <Badge>RLS Ready</Badge>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 border-b">
                        <th className="py-2">#</th>
                        <th className="py-2">Statement</th>
                        <th className="py-2">Metric</th>
                        <th className="py-2">Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { s: "Assault rate down in Toronto vs 2023", m: "-4.2%", w: "YoY" },
                        { s: "Theft rising in Peel Region", m: "+6.8%", w: "YoY" },
                        { s: "Clearance by charge improved", m: "+3pp", w: `${yearRange[0]}–${yearRange[1]}` },
                        { s: "Youth share stable province-wide", m: "~12%", w: "YoY" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                          <td className="py-2 pr-2">{row.s}</td>
                          <td className="py-2 pr-2 font-medium">{row.m}</td>
                          <td className="py-2 pr-2 text-slate-500">{row.w}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Inline self tests for sanity */}
                <TestPanel
                  filteredTrend={filteredTrend}
                  forecastSeries={[]}
                  forecastHorizon={forecastHorizon}
                  yearRange={yearRange}
                  simCrimeRate={simCrimeRate}
                />
              </div>
            </>
          )}

          {tab === "Heatmaps" && (
            <>
              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-slate-700" />
                    <h3 className="font-medium">Heatmaps</h3>
                    <Badge>Hotspots</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <label>Type</label>
                    <select
                      className="border rounded-lg px-2 py-1"
                      value={heatCrimeType}
                      onChange={(e) => setHeatCrimeType(e.target.value)}
                    >
                      {["All", ...mockViolations.map((v) => v.type)].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <label>Year</label>
                    <Badge>{heatYear}</Badge>
                    <button
                      onClick={() => setHeatAutoPlay((v) => !v)}
                      className="inline-flex items-center gap-1 border rounded-lg px-2 py-1"
                    >
                      {heatAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {heatAutoPlay ? "Pause" : "Play"}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={yearRange[0]}
                  max={yearRange[1]}
                  step={1}
                  value={heatYear}
                  onChange={(e) => setHeatYear(Number(e.target.value))}
                  className="w-full mb-3"
                />
                <div className="h-96 grid place-items-center rounded-xl border border-dashed border-slate-300 text-slate-500 bg-slate-50">
                  <div className="text-center">
                    <div className="mb-2">
                      Power BI heatmap placeholder for {municipality} · {heatCrimeType} · {heatYear}
                    </div>
                    <Badge>Hotspot Detection ON</Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "Trends" && (
            <>
              {/* Controls row: clean 1-liners */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center gap-3">
                <div className="text-sm">Seasonality:</div>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={seasonalityMode}
                  onChange={(e) => setSeasonalityMode(e.target.value as any)}
                >
                  <option>On</option>
                  <option>Off</option>
                </select>
                <div className="text-sm ml-2">Forecast horizon:</div>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={forecastHorizon}
                  onChange={(e) =>
                    setForecastHorizon(Number(e.target.value) as 5 | 10)
                  }
                >
                  <option value={5}>5 years</option>
                  <option value={10}>10 years</option>
                </select>
                <label className="text-sm ml-auto flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showForecast}
                    onChange={(e) => setShowForecast(e.target.checked)}
                  />
                  Show forecast
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crime rate + forecast */}
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Crime rate & forecast</h3>
                    <Badge>
                      {yearRange[0]}–{yearRange[1]} {showForecast && `+ ${forecastHorizon}y`}
                    </Badge>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[...filteredTrend, ...(showForecast ? forecastSeries : [])]}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="rate"
                          stroke="#2563eb"
                          fillOpacity={1}
                          fill="url(#grad)"
                        />
                        {/* emphasize points */}
                        <Line type="monotone" dataKey="rate" stroke="#2563eb" dot={true} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Self‑tests for forecast */}
                  <TestPanel
                    filteredTrend={filteredTrend}
                    forecastSeries={forecastSeries}
                    forecastHorizon={forecastHorizon}
                    yearRange={yearRange}
                    simCrimeRate={simCrimeRate}
                  />
                </div>

                {/* Separate anomaly chart */}
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Anomaly detection</h3>
                    <Badge>z-score</Badge>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mockAnomaly.filter(
                          (d) =>
                            Number(d.year) >= yearRange[0] &&
                            Number(d.year) <= yearRange[1]
                        )}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Context: top spikes indicate sudden deviations vs prior years/months.
                  </p>
                </div>
              </div>

              {/* Case intake & clearance with dots and insights */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Case intake & clearance trends</h3>
                  <Badge>with insights</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        ...mockIntake,
                        ...(showForecast
                          ? [
                              {
                                year: String(Number(mockIntake.at(-1)!.year) + 1),
                                Intake: mockIntake.at(-1)!.Intake * 1.03,
                                Cleared: mockIntake.at(-1)!.Cleared * 1.04,
                              },
                            ]
                          : []),
                      ]}
                      margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Intake"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={true}
                      />
                      <Line
                        type="monotone"
                        dataKey="Cleared"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <ul className="text-sm text-slate-700 mt-3 grid sm:grid-cols-2 gap-2 list-disc pl-5">
                  <li>Clearance improving slightly; projected +1–2pp next year.</li>
                  <li>Intake growth stable at ~2–3% YoY in mock data.</li>
                </ul>
              </div>

              {/* Demand forecast with pie chart */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Forecasting demand distribution</h3>
                  <Badge>pie</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={[
                            { name: "Courts", value: 62 },
                            { name: "Corrections", value: 38 },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {["#2563eb", "#16a34a"].map((c, i) => (
                            <Cell key={i} fill={c} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <KPI
                      title="Courts workload"
                      value={`${Math.round((filteredTrend.at(-1)?.rate || 1200) / 12)} cases/wk`}
                      subtitle="next 12 mo."
                      icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <KPI
                      title="Corrections occupancy"
                      value={`${(70 + (filteredTrend.length % 7)).toString()}%`}
                      subtitle="proj."
                      icon={<Users className="w-5 h-5" />}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Illustrative only. Connect to Databricks forecast output for production.
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <div>
              Data: Statistics Canada • Scope: Ontario • Years: 2020–{selectedYear}
            </div>
            <div>Last updated: mock • Pipelines: ADF + Databricks • Team: The WatchTower</div>
          </div>
        </section>
      </main>
    </div>
  );
}
