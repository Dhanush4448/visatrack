import axios from "axios";

export interface Sponsor {
  employer: string;
  role: string;
  city: string;
  state: string;
  filings: number;
  avg_wage: number;
  latest_year: number;
  match_score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: Sponsor[];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const searchSponsors = async (
  query: string,
  state?: string,
  min_wage?: number
): Promise<SearchResponse> => {
  const res = await api.post("/api/search", { query, state, min_wage });
  return res.data;
};

export const matchResume = async (file: File): Promise<SearchResponse> => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/api/match", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export default api;
