"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

const API = "https://visatrack-backend.onrender.com/api";

interface EmployerProfile {
  employer: string;
  total_filings: number;
  avg_wage: number | null;
  min_wage: number | null;
  max_wage: number | null;
  top_roles: [string, number][];
  top_cities: [string, number][];
  by_year: Record<string, number>;
  recent_filings: {
    role: string;
    wage: number | null;
    city: string;
    state: string;
    year: number;
  }[];
}

export default function EmployerPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/employer/${encodeURIComponent(name)}`)
      .then(res => setProfile(res.data))
      .finally(() => setLoading(false));
  }, [name]);

  const tier = profile && profile.total_filings >= 50 ? "Platinum" :
    profile && profile.total_filings >= 10 ? "Gold" : "Sponsor";

  return (
    <main style={{ minHeight: "100vh", background: "#0A0F1E", color: "#F1F5F9", fontFamily: "system-ui, sans-serif", padding: "24px" }}>
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* Back button */}
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#6366F1", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          ← Back to Search
        </Link>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px", color: "#475569" }}>
            Loading employer profile...
          </div>
        )}

        {profile && (
          <>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {profile.employer}
                </h1>
                <span style={{
                  background: tier === "Platinum" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                  color: tier === "Platinum" ? "#1a1a2e" : "white",
                  fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", letterSpacing: "0.08em"
                }}>
                  {tier === "Platinum" ? "★ PLATINUM" : tier === "Gold" ? "◆ GOLD" : "SPONSOR"}
                </span>
              </div>
              <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
                H1B Sponsor Profile · FY2025 Q4 · Source: US Department of Labor
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Total Filings", value: profile.total_filings.toLocaleString(), color: "#6366F1" },
                { label: "Avg Salary", value: profile.avg_wage ? `$${profile.avg_wage.toLocaleString()}` : "N/A", color: "#10B981" },
                { label: "Min Salary", value: profile.min_wage ? `$${profile.min_wage.toLocaleString()}` : "N/A", color: "#F59E0B" },
                { label: "Max Salary", value: profile.max_wage ? `$${profile.max_wage.toLocaleString()}` : "N/A", color: "#EC4899" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px", padding: "20px",
                }}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: stat.color, fontFamily: "monospace" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Roles + Cities */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Top Roles</h3>
                {profile.top_roles.map(([role, count]) => (
                  <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "13px", color: "#CBD5E1" }}>{role}</span>
                    <span style={{ fontSize: "13px", color: "#6366F1", fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Top Locations</h3>
                {profile.top_cities.map(([city, count]) => (
                  <div key={city} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "13px", color: "#CBD5E1" }}>{city}</span>
                    <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Filings Table */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent Filings</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: "#475569", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Role</th>
                      <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Salary</th>
                      <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Location</th>
                      <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.recent_filings.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 12px", color: "#CBD5E1" }}>{f.role}</td>
                        <td style={{ padding: "10px 12px", color: "#10B981", fontFamily: "monospace", fontWeight: 700 }}>
                          {f.wage ? `$${f.wage.toLocaleString()}` : "N/A"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{f.city}, {f.state}</td>
                        <td style={{ padding: "10px 12px", color: "#475569" }}>FY{f.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}