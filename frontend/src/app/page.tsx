"use client";
import { useState } from "react";
import { searchSponsors, Sponsor } from "@/lib/api";

export default function Home() {
  const [query, setQuery]       = useState("");
  const [state, setState]       = useState("");
  const [results, setResults]   = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchSponsors(query, state || undefined);
      setResults(data.results);
      setSearched(true);
    } catch (e) {
      setError("Search failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span className="font-bold text-gray-900 text-lg">VisaTrack</span>
          <span className="text-gray-400 text-sm">H1B Intelligence Platform</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {!searched && (
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Find who actually sponsors H1B
            </h1>
            <p className="text-gray-500 text-lg">
              Real data from{" "}
              <span className="text-blue-600 font-medium">847,000+ DOL filings</span>
              {" "}— not guesses
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex gap-3">
            <input
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900
                         placeholder-gray-400 focus:outline-none focus:border-blue-400 text-base"
              placeholder="Try: software engineer California"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <select
              className="px-3 py-3 rounded-xl border border-gray-200 text-gray-600
                         focus:outline-none focus:border-blue-400 bg-white text-sm"
              value={state}
              onChange={e => setState(e.target.value)}
            >
              <option value="">All states</option>
              {["CA","NY","TX","WA","IL","MA","VA","GA","NJ","NC",
                "FL","CO","AZ","OH","MN","MI","PA","OR","UT","MD"]
                .map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium
                         hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {searched && (
          <p className="text-gray-500 text-sm mb-4">
            {results.length} sponsors found for{" "}
            <span className="font-medium text-gray-900">"{query}"</span>
          </p>
        )}

        <div className="flex flex-col gap-4">
          {results.map((s, i) => <SponsorCard key={i} sponsor={s} />)}
        </div>

        {searched && results.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No results found</p>
            <p className="text-sm">Try a broader search or remove the state filter</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SponsorCard({ sponsor: s }: { sponsor: Sponsor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5
                    hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{s.employer}</h3>
          <p className="text-gray-500 text-sm mt-0.5">{s.role}</p>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2.5 py-1 rounded-lg ml-3">
          {(s.match_score * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className={`text-xl font-bold ${s.filings > 100 ? "text-green-600" : "text-gray-900"}`}>
            {s.filings}
          </p>
          <p className="text-xs text-gray-400 mt-1">LCA filings</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-900">
            {s.avg_wage ? `$${Math.round(s.avg_wage / 1000)}k` : "N/A"}
          </p>
          <p className="text-xs text-gray-400 mt-1">avg salary</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-sm font-bold text-gray-900">{s.city}, {s.state}</p>
          <p className="text-xs text-gray-400 mt-1">location</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">FY{s.latest_year}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          s.filings > 500 ? "bg-green-50 text-green-700" :
          s.filings > 100 ? "bg-blue-50 text-blue-700"  :
          s.filings > 10  ? "bg-gray-100 text-gray-600" :
                            "bg-yellow-50 text-yellow-700"
        }`}>
          {s.filings > 500 ? "Very active sponsor" :
           s.filings > 100 ? "Active sponsor"      :
           s.filings > 10  ? "Regular sponsor"     : "Occasional sponsor"}
        </span>
      </div>
    </div>
  );
}
