import { useEffect, useMemo, useState } from "react";
import "./App.css";

const SHEET_ID = "19QJ3zfdxihgyE1TVMEY2emfqdQku8be0Im5AbzSCh6o";

const SHEETS = {
  stats: "Harry",
  hooks: "XP_Hooks",
  levels: "XP_Levels",
};

type StatRow = {
  stat: string;
  description: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  xpToNext: number;
  hooks: string;
};

type HookRow = {
  action: string;
  stat: string;
  condition: string;
  xp: string;
  notes: string;
};

type LevelRow = {
  level: number;
  gap: number;
  total: number;
};

type Status = "loading" | "ready" | "error";

async function fetchSheet(sheetName: string) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`);
  url.searchParams.set("tqx", "out:json");
  url.searchParams.set("sheet", sheetName);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${sheetName}: ${resp.status}`);
  }
  const text = await resp.text();
  const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const cols = json.table.cols.map((c: any, idx: number) => c.label || `col${idx}`);
  const rows = json.table.rows
    .map((row: any) =>
      row.c
        ? row.c.reduce((acc: Record<string, string>, cell: any, idx: number) => {
            const label = cols[idx];
            acc[label] = cell?.v ?? "";
            return acc;
          }, {})
        : null
    )
    .filter(Boolean);
  return rows as Record<string, string>[];
}

function parseNumber(value: string | number, fallback = 0) {
  if (typeof value === "number") return value;
  const parsed = parseFloat((value ?? "").toString());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const StatCard = ({ row }: { row: StatRow }) => {
  const progress = row.nextLevelXp > 0 ? Math.min(row.currentXp / row.nextLevelXp, 1) : 0;
  return (
    <article className="stat-card">
      <header>
        <h3>{row.stat}</h3>
        <span className="level-pill">Lvl {row.level}</span>
      </header>
      <p className="description">{row.description}</p>
      <div className="progress">
        <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="progress-meta">
        <span>{formatNumber(row.currentXp)} XP</span>
        <span>
          {formatNumber(row.nextLevelXp - row.currentXp)} XP to L{row.level + 1}
        </span>
      </div>
      <p className="hook">{row.hooks}</p>
    </article>
  );
};

function App() {
  const [stats, setStats] = useState<StatRow[]>([]);
  const [hooks, setHooks] = useState<HookRow[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setStatus("loading");
      try {
        const [statsSheet, hooksSheet, levelsSheet] = await Promise.all([
          fetchSheet(SHEETS.stats),
          fetchSheet(SHEETS.hooks),
          fetchSheet(SHEETS.levels),
        ]);

        setStats(
          statsSheet
            .filter((row) => row.Stat)
            .map((row) => ({
              stat: row.Stat,
              description: row.Description,
              level: parseNumber(row.Level, 1),
              currentXp: parseNumber(row["Current XP"], 0),
              nextLevelXp: parseNumber(row["Next Level XP"], 100),
              xpToNext: parseNumber(row["XP to Next"], 100),
              hooks: row["XP Hooks"],
            }))
        );

        setHooks(
          hooksSheet
            .filter((row) => row.Action)
            .map((row) => ({
              action: row.Action,
              stat: row.Stat,
              condition: row["Condition / Trigger"],
              xp: row["XP Award"],
              notes: row["Automation Notes"],
            }))
        );

        setLevels(
          levelsSheet
            .filter((row) => row.Level)
            .map((row) => ({
              level: parseNumber(row.Level),
              gap: parseNumber(row["XP Gap"]),
              total: parseNumber(row["Total XP to reach level"]),
            }))
        );

        setLastSync(new Date().toLocaleString());
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    };

    load();
  }, []);

  const topLevels = useMemo(() => levels.slice(0, 15), [levels]);

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Work Quest</p>
          <h1>Progress Dashboard</h1>
          <p className="subtitle">Live view of Harry's stats, hooks, and XP curve</p>
        </div>
        <div className="status-block">
          <span className={`status-dot ${status}`} />
          <div>
            <p className="status-label">{status === "ready" ? "Synced" : status === "loading" ? "Refreshing" : "Error"}</p>
            <p className="status-meta">{status === "ready" ? `Updated ${lastSync}` : error ?? ""}</p>
          </div>
        </div>
      </header>

      {status === "error" && <div className="error">{error}</div>}

      <section>
        <div className="section-header">
          <h2>Stats</h2>
          <button className="ghost" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
        <div className="stat-grid">
          {stats.map((stat) => (
            <StatCard key={stat.stat} row={stat} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>XP Hooks</h2>
          <p>Actions that generate XP and keep the loop exciting.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Stat</th>
                <th>Condition</th>
                <th>XP</th>
                <th>Automation</th>
              </tr>
            </thead>
            <tbody>
              {hooks.map((hook) => (
                <tr key={`${hook.action}-${hook.stat}`}>
                  <td>{hook.action}</td>
                  <td>{hook.stat}</td>
                  <td>{hook.condition}</td>
                  <td>{hook.xp}</td>
                  <td>{hook.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Level Curve</h2>
          <p>1.1× gap growth. Full table lives in the sheet.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>XP Gap</th>
                <th>Total XP</th>
              </tr>
            </thead>
            <tbody>
              {topLevels.map((lvl) => (
                <tr key={lvl.level}>
                  <td>{lvl.level}</td>
                  <td>{formatNumber(lvl.gap)}</td>
                  <td>{formatNumber(lvl.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
