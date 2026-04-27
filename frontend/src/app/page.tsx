"use client";
import { useState } from "react";
import axios from "axios";
import posthog from "posthog-js";

const API = "https://visatrack-backend.onrender.com/api";

interface Result {
  employer: string;
  role: string;
  city: string;
  state: string;
  filings: number;
  avg_wage: number | null;
  latest_year: number;
  match_score: number;
}

function TierBadge({ filings }: { filings: number }) {
  if (filings >= 50) return (
    <span style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#1a1a2e", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      ★ Platinum
    </span>
  );
  if (filings >= 10) return (
    <span style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "white", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      ◆ Gold
    </span>
  );
  return (
    <span style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      Sponsor
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "#10B981" : pct >= 55 ? "#F59E0B" : "#6366F1";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "52px" }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "50%",
        background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative"
      }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "50%",
          background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color }}>{pct}%</span>
        </div>
      </div>
      <span style={{ fontSize: "9px", color: "#64748B", letterSpacing: "0.05em", textTransform: "uppercase" }}>match</span>
    </div>
  );
}

function ResultCard({ r }: { r: Result }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function fetchInsight() {
    if (insight) { setExpanded(!expanded); return; }
    setLoading(true);
    posthog.capture("ai_insight_clicked", { employer: r.employer });
    try {
      const res = await axios.post(`${API}/insight`, {
        employer: r.employer, role: r.role, city: r.city,
        state: r.state, avg_wage: r.avg_wage, filings: r.filings,
      });
      setInsight(res.data.insight);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "20px",
      transition: "all 0.2s ease",
      cursor: "default",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <ScoreRing score={r.match_score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <a href={`/employer/${encodeURIComponent(r.employer)}`} style={{ textDecoration: "none" }}>
  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#818CF8", lineHeight: 1.3, cursor: "pointer" }}>
    {r.employer}
  </h3>
</a>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                {r.role} · {r.city}, {r.state}
              </p>
            </div>
            <TierBadge filings={r.filings} />
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", fontFamily: "monospace" }}>
                {r.avg_wage ? `$${r.avg_wage.toLocaleString()}` : "N/A"}
              </span>
              <span style={{ fontSize: "11px", color: "#475569", marginLeft: "4px" }}>avg/yr</span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569" }}>
              <span style={{ color: "#94A3B8" }}>{r.filings}</span> filing{r.filings !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: "12px", color: "#475569" }}>FY{r.latest_year}</div>
            <button
              onClick={fetchInsight}
              disabled={loading}
              style={{
                marginLeft: "auto",
                background: loading ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818CF8",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={e => !loading && ((e.target as HTMLElement).style.background = "rgba(99,102,241,0.25)")}
              onMouseLeave={e => !loading && ((e.target as HTMLElement).style.background = "rgba(99,102,241,0.15)")}
            >
              {loading ? "Analyzing..." : expanded ? "Hide Insight" : "✦ AI Insight"}
            </button>
          </div>
        </div>
      </div>

      {expanded && insight && (
        <div style={{
          marginTop: "16px",
          padding: "14px 16px",
          background: "rgba(99,102,241,0.08)",
          borderLeft: "3px solid #6366F1",
          borderRadius: "0 8px 8px 0",
          fontSize: "13px",
          color: "#CBD5E1",
          lineHeight: 1.7,
        }}>
          {insight}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"search" | "match">("search");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [searchResults, setSearchResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [matchResults, setMatchResults] = useState<Result[]>([]);
  const [matching, setMatching] = useState(false);
  const [preview, setPreview] = useState("");

  async function handleSearch() {
  if (!query.trim()) return;
  setSearching(true);
  setCurrentQuery(query);
  setCurrentState(state);
  posthog.capture("search", { query: query, state: state });
  try {
    const res = await axios.post(`${API}/search`, { query, state: state || null, limit: 20 });
    setSearchResults(res.data.results);
    setHasMore(res.data.results.length === 20);
  } finally {
    setSearching(false);
  }
}

async function handleLoadMore() {
  setSearching(true);
  try {
    const res = await axios.post(`${API}/search`, {
      query: currentQuery,
      state: currentState || null,
      limit: 20,
      offset: searchResults.length,
    });
    setSearchResults(prev => [...prev, ...res.data.results]);
    setHasMore(res.data.results.length === 20);
  } finally {
    setSearching(false);
  }
}

  const states = ["CA", "NY", "TX", "WA", "MA", "IL", "GA", "VA", "NJ", "FL", "NC", "OH", "PA", "CO", "AZ"];

  return (
    <main style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #334155; }
        input, select { font-family: inherit; }
        body { margin: 0; }
      `}</style>

      {/* Ambient background glow */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 70%)"
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,15,30,0.8)",
        backdropFilter: "blur(12px)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: 800, color: "white",
            }}>V</div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.02em" }}>VisaTrack</div>
              <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>H1B Intelligence</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              padding: "5px 12px", borderRadius: "20px",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
              <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600, letterSpacing: "0.04em" }}>
                106,326 RECORDS
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#334155" }}>FY2025 Q4</div>
          </div>
        </div>
      </header>

      <div style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: "0 0 12px",
            letterSpacing: "-0.03em", lineHeight: 1.1,
            background: "linear-gradient(135deg, #F1F5F9 30%, #94A3B8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Find Your H1B Sponsor
          </h1>
          <p style={{ fontSize: "16px", color: "#475569", margin: "0 0 8px", maxWidth: "480px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Semantic search across 106,000+ real DOL filings. No guesswork — real companies, real salaries, real data.
          </p>
          <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
            First search may take ~30s while server wakes up · Subsequent searches are fast
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          {[
            { id: "search", label: "🔍 Search Sponsors" },
            { id: "match", label: "📄 Match My Resume" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "search" | "match")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t.id ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "transparent",
                color: tab === t.id ? "white" : "#475569",
                boxShadow: tab === t.id ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {tab === "search" && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "20px", marginBottom: "24px",
            }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input
                  style={{
                    flex: 1, minWidth: "200px", padding: "14px 18px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px", color: "#F1F5F9", fontSize: "14px", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="e.g. machine learning engineer, data scientist NYC..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <select
                  style={{
                    padding: "14px 16px", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                    color: state ? "#F1F5F9" : "#475569", fontSize: "14px", outline: "none", cursor: "pointer",
                  }}
                  value={state}
                  onChange={e => setState(e.target.value)}
                >
                  <option value="">All States</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  style={{
                    padding: "14px 28px",
                    background: searching ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                    border: "none", borderRadius: "10px",
                    color: "white", fontSize: "14px", fontWeight: 700,
                    cursor: searching ? "wait" : "pointer",
                    boxShadow: searching ? "none" : "0 4px 16px rgba(99,102,241,0.4)",
                    transition: "all 0.2s",
                    letterSpacing: "0.02em",
                  }}
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Quick searches */}
              <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "#334155", alignSelf: "center" }}>Try:</span>
                {["software engineer", "data scientist", "product manager", "DevOps engineer"].map(s => (
                  <button key={s} onClick={() => { setQuery(s); }}
                    style={{
                      padding: "5px 12px", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px",
                      color: "#64748B", fontSize: "11px", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = "#94A3B8"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = "#64748B"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#334155" }}>
                  <span style={{ color: "#6366F1", fontWeight: 700 }}>{searchResults.length}</span> sponsors found
                </span>
                <span style={{ fontSize: "11px", color: "#1E293B", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Sorted by relevance
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
  {searchResults.map((r, i) => <ResultCard key={i} r={r} />)}
</div>

{hasMore && (
  <div style={{ textAlign: "center", marginTop: "24px" }}>
    <button
      onClick={handleLoadMore}
      disabled={searching}
      style={{
        padding: "12px 32px",
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: "10px",
        color: "#818CF8",
        fontSize: "14px",
        fontWeight: 600,
        cursor: searching ? "wait" : "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
    >
      {searching ? "Loading..." : "Load More Results"}
    </button>
  </div>
)}
        )}

        {/* Match Tab */}
        {tab === "match" && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "28px", marginBottom: "24px",
            }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#F1F5F9" }}>
                Match Your Resume
              </h2>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                Upload your PDF or DOCX resume. We'll find H1B sponsors whose filings semantically match your skills and experience using vector similarity.
              </p>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{
                  flex: 1, minWidth: "200px", padding: "14px 18px",
                  background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.12)",
                  borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                  color: file ? "#F1F5F9" : "#475569", fontSize: "13px", transition: "all 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                >
                  <span style={{ fontSize: "18px" }}>{file ? "📄" : "⬆️"}</span>
                  {file ? file.name : "Upload resume (PDF or DOCX)"}
                  <input type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                </label>
                <button
                  onClick={handleMatch}
                  disabled={!file || matching}
                  style={{
                    padding: "14px 28px",
                    background: !file ? "rgba(99,102,241,0.1)" : matching ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                    border: !file ? "1px solid rgba(99,102,241,0.2)" : "none",
                    borderRadius: "10px", color: !file ? "#334155" : "white",
                    fontSize: "14px", fontWeight: 700,
                    cursor: !file ? "not-allowed" : matching ? "wait" : "pointer",
                    boxShadow: file && !matching ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {matching ? "Analyzing..." : "Find Matches"}
                </button>
              </div>

              {preview && (
                <div style={{
                  marginTop: "16px", padding: "12px 16px",
                  background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: "8px", fontSize: "12px", color: "#475569",
                  fontFamily: "DM Mono, monospace", lineHeight: 1.6,
                }}>
                  <span style={{ color: "#10B981", fontWeight: 600, display: "block", marginBottom: "4px" }}>✓ Resume parsed successfully</span>
                  {preview}
                </div>
              )}
            </div>

            {matchResults.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#334155" }}>
                  <span style={{ color: "#6366F1", fontWeight: 700 }}>{matchResults.length}</span> matched sponsors
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {matchResults.map((r, i) => <ResultCard key={i} r={r} />)}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: "60px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#1E293B", margin: 0 }}>
            Data sourced from{" "}
            <a href="https://www.dol.gov/agencies/eta/foreign-labor/performance" target="_blank" rel="noopener noreferrer"
              style={{ color: "#334155", textDecoration: "underline" }}>
              US Department of Labor LCA Disclosures
            </a>
            {" "}· FY2025 Q4 · Built by{" "}
            <a href="https://www.linkedin.com/in/dhanush-neelakantan-15b4481bb/" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6366F1", textDecoration: "none" }}>
              Dhanush Neelakantan
            </a>
            {" "}·{" "}
            <a href="https://github.com/Dhanush4448/visatrack" target="_blank" rel="noopener noreferrer"
              style={{ color: "#334155", textDecoration: "underline" }}>
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
