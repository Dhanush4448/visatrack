"use client";
import { useState } from "react";
import axios from "axios";

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

function ResultCard({ r }: { r: Result }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tier = r.filings >= 50 ? "Platinum" : r.filings >= 10 ? "Gold" : "Sponsor";

  async function fetchInsight() {
    if (insight) { setInsight(null); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/insight`, {
        employer: r.employer,
        role: r.role,
        city: r.city,
        state: r.state,
        avg_wage: r.avg_wage,
        filings: r.filings,
      });
      setInsight(res.data.insight);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{r.employer}</h3>
          <p className="text-sm text-gray-500">
            {r.role} · {r.city}, {r.state}
          </p>
        </div>
        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
          {Math.round(r.match_score * 100)}% match
        </span>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{r.avg_wage ? "$" + r.avg_wage.toLocaleString() : "N/A"}</span>
          <span>{tier} · {r.filings} filing{r.filings !== 1 ? "s" : ""}</span>
          <span>FY{r.latest_year}</span>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50"
        >
          {loading ? "..." : insight ? "Hide" : "AI Insight"}
        </button>
      </div>
      {insight && (
        <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-900">
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

  const [file, setFile] = useState<File | null>(null);
  const [matchResults, setMatchResults] = useState<Result[]>([]);
  const [matching, setMatching] = useState(false);
  const [preview, setPreview] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await axios.post(`${API}/search`, {
        query,
        state: state || null,
        limit: 20,
      });
      setSearchResults(res.data.results);
    } finally {
      setSearching(false);
    }
  }

  async function handleMatch() {
    if (!file) return;
    setMatching(true);
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">VisaTrack</h1>
            <p className="text-xs text-gray-500">H1B Intelligence Platform</p>
          </div>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
            106,613 records
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("search")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              tab === "search"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Search Sponsors
          </button>
          <button
            onClick={() => setTab("match")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              tab === "match"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Match My Resume
          </button>
        </div>

        {tab === "search" && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex gap-3">
                <input
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Try: machine learning engineer, data scientist NYC"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <select
                  className="px-3 py-3 rounded-xl border border-gray-200 text-gray-600 focus:outline-none"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All States</option>
                  {["CA","NY","TX","WA","MA","IL","GA","VA","NJ","FL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {searchResults.map((r, i) => (
                <ResultCard key={i} r={r} />
              ))}
            </div>
          </div>
        )}

        {tab === "match" && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-1">Upload Your Resume</h2>
              <p className="text-sm text-gray-500 mb-4">
                We will find H1B sponsors whose filings best match your skills and experience.
              </p>
              <div className="flex gap-3 items-center">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm text-gray-600"
                />
                <button
                  onClick={handleMatch}
                  disabled={!file || matching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {matching ? "Analyzing..." : "Find Matches"}
                </button>
              </div>
              {preview && (
                <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg p-3 font-mono">
                  {preview}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {matchResults.map((r, i) => (
                <ResultCard key={i} r={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}