content = '''"use client";
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
    posthog.capture("search", { query, state });
    try {
      const res = await axios.post(`${API}/search`, { query, state: state || null, limit: 20, offset: 0 });
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
        query: currentQuery, state: currentState || null, limit: 20, offset: searchResults.length,
      });
      setSearchResults(prev => [...prev, ...res.data.results]);
      setHasMore(res.data.results.length === 20);
    } finally {
      setSearching(false);
    }
  }

  async function handleMatch() {
    if (!file) return;
    setMatching(true);
    posthog.capture("resume_match");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`${API}/match`, form);
      setMatchResults(res.data.matches);
      setPreview(res.data.text_preview);
    } finally {
      setMatching(false);
    }
  }

  const states = ["CA","NY","TX","WA","MA","IL","GA","VA","NJ","FL","NC","OH","PA","CO","AZ"];

  return (
    <main style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } ::placeholder { color: #334155; }`}</style>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,15,30,0.9)", padding: "0 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #6366F1, #818CF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "white" }}>V</div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "#F1F5F9" }}>VisaTrack</div>
              <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>H1B Intelligence</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "5px 12px", borderRadius: "20px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600 }}>106,326 RECORDS</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em", background: "linear-gradient(135deg, #F1F5F9 30%, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Find Your H1B Sponsor
          </h1>
          <p style={{ fontSize: "16px", color: "#475569", margin: "0 0 6px" }}>Semantic search across 106,000+ real DOL filings.</p>
          <p style={{ fontSize: "12px", color: "#334155" }}>First search may take ~30s while server wakes up</p>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          {[{ id: "search", label: "Search Sponsors" }, { id: "match", label: "Match My Resume" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as "search" | "match")} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: tab === t.id ? "linear-gradient(135deg, #6366F1, #4F46E5)" : "transparent", color: tab === t.id ? "white" : "#475569" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input style={{ flex: 1, minWidth: "200px", padding: "14px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#F1F5F9", fontSize: "14px", outline: "none" }}
                  placeholder="e.g. machine learning engineer, data scientist NYC..."
                  value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
                <select style={{ padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#F1F5F9", fontSize: "14px", outline: "none" }}
                  value={state} onChange={e => setState(e.target.value)}>
                  <option value="">All States</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleSearch} disabled={searching} style={{ padding: "14px 28px", background: searching ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: 700, cursor: searching ? "wait" : "pointer" }}>
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#334155" }}>
                <span style={{ color: "#6366F1", fontWeight: 700 }}>{searchResults.length}</span> sponsors found
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {searchResults.map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <a href={`/employer/${encodeURIComponent(r.employer)}`} style={{ textDecoration: "none" }}>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#818CF8" }}>{r.employer}</h3>
                      </a>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>{r.role} · {r.city}, {r.state}</p>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#10B981" }}>{Math.round(r.match_score * 100)}% match</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "13px", color: "#475569" }}>
                    <span style={{ color: "#10B981", fontWeight: 800, fontFamily: "monospace" }}>{r.avg_wage ? `$${r.avg_wage.toLocaleString()}` : "N/A"}</span>
                    <span>{r.filings} filing{r.filings !== 1 ? "s" : ""}</span>
                    <span>FY{r.latest_year}</span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button onClick={handleLoadMore} disabled={searching} style={{ padding: "12px 32px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", color: "#818CF8", fontSize: "14px", fontWeight: 600, cursor: searching ? "wait" : "pointer" }}>
                  {searching ? "Loading..." : "Load More Results"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "match" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#F1F5F9" }}>Match Your Resume</h2>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#475569" }}>Upload your PDF or DOCX resume to find matching H1B sponsors.</p>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <label style={{ flex: 1, padding: "14px 18px", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: file ? "#F1F5F9" : "#475569", fontSize: "13px" }}>
                  {file ? file.name : "Upload resume (PDF or DOCX)"}
                  <input type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                </label>
                <button onClick={handleMatch} disabled={!file || matching} style={{ padding: "14px 28px", background: !file ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg, #6366F1, #4F46E5)", border: "none", borderRadius: "10px", color: !file ? "#334155" : "white", fontSize: "14px", fontWeight: 700, cursor: !file ? "not-allowed" : "pointer" }}>
                  {matching ? "Analyzing..." : "Find Matches"}
                </button>
              </div>
              {preview && <p style={{ marginTop: "12px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>{preview}</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {matchResults.map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
                  <a href={`/employer/${encodeURIComponent(r.employer)}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#818CF8" }}>{r.employer}</h3>
                  </a>
                  <p style={{ margin: "4px 0 8px", fontSize: "13px", color: "#64748B" }}>{r.role} · {r.city}, {r.state}</p>
                  <span style={{ color: "#10B981", fontWeight: 800, fontFamily: "monospace" }}>{r.avg_wage ? `$${r.avg_wage.toLocaleString()}` : "N/A"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer style={{ marginTop: "60px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: "12px", color: "#1E293B" }}>
          Data sourced from <a href="https://www.dol.gov/agencies/eta/foreign-labor/performance" target="_blank" rel="noopener noreferrer" style={{ color: "#334155" }}>US Department of Labor</a> · Built by <a href="https://www.linkedin.com/in/dhanush-neelakantan-15b4481bb/" target="_blank" rel="noopener noreferrer" style={{ color: "#6366F1" }}>Dhanush Neelakantan</a> · <a href="https://github.com/Dhanush4448/visatrack" target="_blank" rel="noopener noreferrer" style={{ color: "#334155" }}>GitHub</a>
        </footer>
      </div>
    </main>
  );
}
'''

with open('frontend/src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')