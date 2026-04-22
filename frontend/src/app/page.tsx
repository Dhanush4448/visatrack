"use client";
import { useState, useEffect } from "react";

interface Project {
  id: number;
  name: string;
  source: string | null;
  created_at: string;
  file_count: number;
  chunk_count: number;
}

interface Message {
  role: string;
  text: string;
  type?: string;
}

interface FileInfo {
  filename: string;
  chunks: number;
}

interface DebtScore {
  overall_score: number;
  complexity: number;
  security: number;
  documentation: number;
  testability: number;
  modernization_urgency: number;
  summary: string;
  top_issues: string[];
}

const API = "http://localhost:8000";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0f;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
  }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* Sidebar */
  .sidebar {
    width: 260px;
    min-width: 260px;
    background: #0f0f1a;
    border-right: 1px solid #1e1e2e;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #1e1e2e;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .logo-text {
    font-size: 15px;
    font-weight: 600;
    color: #f1f5f9;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 11px;
    color: #475569;
    font-family: 'JetBrains Mono', monospace;
    padding-left: 38px;
  }

  .sidebar-section {
    padding: 14px 12px;
    border-bottom: 1px solid #1e1e2e;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
    font-family: 'JetBrains Mono', monospace;
  }

  .input-field {
    width: 100%;
    background: #1a1a2e;
    border: 1px solid #2a2a3e;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 12px;
    color: #e2e8f0;
    margin-bottom: 6px;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s;
  }

  .input-field:focus { border-color: #6366f1; }
  .input-field::placeholder { color: #3a3a5c; }

  .btn-primary {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .btn-primary:hover { background: #5254cc; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-secondary {
    width: 100%;
    background: #1e1e2e;
    color: #94a3b8;
    border: 1px solid #2a2a3e;
    border-radius: 6px;
    padding: 7px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .btn-secondary:hover { background: #252540; color: #e2e8f0; }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

  .projects-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .projects-list::-webkit-scrollbar { width: 4px; }
  .projects-list::-webkit-scrollbar-track { background: transparent; }
  .projects-list::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }

  .project-item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 2px;
    border: 1px solid transparent;
    transition: all 0.15s;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .project-item:hover { background: #1a1a2e; border-color: #2a2a3e; }
  .project-item.active { background: #1e1e3a; border-color: #6366f1; }

  .project-name {
    font-size: 13px;
    font-weight: 500;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .project-meta {
    font-size: 11px;
    color: #475569;
    margin-top: 2px;
    font-family: 'JetBrains Mono', monospace;
  }

  .delete-btn {
    background: none;
    border: none;
    color: #475569;
    cursor: pointer;
    font-size: 14px;
    padding: 0 2px;
    flex-shrink: 0;
    transition: color 0.15s;
  }

  .delete-btn:hover { color: #ef4444; }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #0a0a0f; }

  .topbar {
    padding: 14px 24px;
    border-bottom: 1px solid #1e1e2e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0a0a0f;
  }

  .project-title { font-size: 15px; font-weight: 600; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; }
  .project-subtitle { font-size: 12px; color: #475569; margin-top: 2px; }

  .topbar-actions { display: flex; gap: 8px; align-items: center; }

  .score-badge {
    font-size: 12px;
    color: #94a3b8;
    background: #1e1e2e;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #2a2a3e;
    font-family: 'JetBrains Mono', monospace;
  }

  .tab-btn {
    background: #1e1e2e;
    color: #94a3b8;
    border: 1px solid #2a2a3e;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .tab-btn:hover { background: #252540; color: #e2e8f0; }
  .tab-btn.active { background: #6366f1; color: white; border-color: #6366f1; }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    color: #475569;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: #1e1e2e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    border: 1px solid #2a2a3e;
  }

  .empty-title { font-size: 18px; font-weight: 500; color: #64748b; }
  .empty-sub { font-size: 13px; color: #334155; text-align: center; max-width: 300px; }

  /* Chat */
  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-area::-webkit-scrollbar { width: 4px; }
  .chat-area::-webkit-scrollbar-track { background: transparent; }
  .chat-area::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }

  .msg-user {
    display: flex;
    justify-content: flex-end;
  }

  .msg-user .bubble {
    background: #6366f1;
    color: white;
    padding: 10px 16px;
    border-radius: 12px 12px 2px 12px;
    font-size: 14px;
    line-height: 1.6;
    max-width: 65%;
    white-space: pre-wrap;
  }

  .msg-ai { display: flex; justify-content: flex-start; gap: 10px; }

  .ai-avatar {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .msg-ai .bubble {
    background: #131320;
    border: 1px solid #1e1e2e;
    color: #e2e8f0;
    padding: 12px 16px;
    border-radius: 2px 12px 12px 12px;
    font-size: 14px;
    line-height: 1.7;
    max-width: 75%;
    white-space: pre-wrap;
    font-family: 'Inter', sans-serif;
  }

  .msg-ai .bubble.docs {
    border-color: #6366f1;
    background: #0f0f1f;
  }

  .msg-label {
    font-size: 10px;
    color: #475569;
    margin-bottom: 6px;
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .thinking .bubble {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 12px 16px;
  }

  .dot {
    width: 6px; height: 6px;
    background: #6366f1;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Input bar */
  .input-bar {
    padding: 16px 24px;
    border-top: 1px solid #1e1e2e;
    display: flex;
    gap: 10px;
  }

  .chat-input {
    flex: 1;
    background: #131320;
    border: 1px solid #2a2a3e;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    color: #e2e8f0;
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s;
  }

  .chat-input:focus { border-color: #6366f1; }
  .chat-input::placeholder { color: #334155; }

  .send-btn {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .send-btn:hover { background: #5254cc; }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Files view */
  .files-area {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .files-area::-webkit-scrollbar { width: 4px; }
  .files-area::-webkit-scrollbar-track { background: transparent; }
  .files-area::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }

  .files-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .files-title { font-size: 14px; font-weight: 500; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

  .file-card {
    background: #0f0f1a;
    border: 1px solid #1e1e2e;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 8px;
    transition: border-color 0.15s;
  }

  .file-card:hover { border-color: #2a2a3e; }

  .file-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .file-info { display: flex; align-items: center; gap: 8px; min-width: 0; }

  .file-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    flex-shrink: 0;
  }

  .file-name {
    font-size: 13px;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }

  .file-chunks {
    font-size: 11px;
    color: #334155;
    font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
  }

  .file-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }

  .score-num {
    font-size: 13px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .score-green { color: #22c55e; }
  .score-yellow { color: #f59e0b; }
  .score-red { color: #ef4444; }

  .action-btn {
    background: #1e1e2e;
    color: #64748b;
    border: 1px solid #2a2a3e;
    border-radius: 5px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .action-btn:hover { background: #252540; color: #94a3b8; }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .score-card {
    margin-top: 10px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid;
  }

  .score-card.green { background: #052e16; border-color: #166534; }
  .score-card.yellow { background: #1c1400; border-color: #78350f; }
  .score-card.red { background: #1c0505; border-color: #7f1d1d; }

  .score-dims {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }

  .score-dim { text-align: center; }
  .score-dim-val { font-size: 15px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
  .score-dim-label { font-size: 10px; color: #475569; margin-top: 2px; }

  .score-summary { font-size: 12px; color: #94a3b8; margin-bottom: 6px; line-height: 1.5; }
  .score-issues { font-size: 11px; color: #64748b; }
  .score-issues li { margin-bottom: 2px; list-style: none; }

  .upload-label {
    background: #1e1e2e;
    color: #94a3b8;
    border: 1px solid #2a2a3e;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .upload-label:hover { background: #252540; color: #e2e8f0; }

  .score-all-btn {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .score-all-btn:hover { background: #5254cc; }
  .score-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .chat-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    color: #334155;
  }

  .chat-empty-title { font-size: 16px; color: #475569; font-weight: 500; }
  .chat-empty-sub { font-size: 13px; color: #334155; text-align: center; max-width: 400px; line-height: 1.6; }

  .suggestion-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }

  .chip {
    background: #131320;
    border: 1px solid #2a2a3e;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace;
  }

  .chip:hover { border-color: #6366f1; color: #a5b4fc; background: #0f0f1f; }
`;

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoName, setRepoName] = useState("");
  const [ingestingRepo, setIngestingRepo] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [scores, setScores] = useState<Record<string, DebtScore>>({});
  const [scoringAll, setScoringAll] = useState(false);
  const [projectScore, setProjectScore] = useState<number | null>(null);
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [view, setView] = useState<"chat" | "files">("chat");

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    const res = await fetch(`${API}/projects`);
    const data = await res.json();
    setProjects(data.projects);
  }

  async function loadFiles(projectId: number) {
    const res = await fetch(`${API}/files/${projectId}`);
    const data = await res.json();
    setFiles(data.files);
  }

  async function selectProject(project: Project) {
    setActiveProject(project);
    setMessages([]);
    setScores({});
    setProjectScore(null);
    setView("chat");
    await loadFiles(project.id);
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    const res = await fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName })
    });
    const data = await res.json();
    setNewProjectName("");
    await loadProjects();
    const newProj: Project = { id: data.id, name: data.name, source: null, created_at: new Date().toISOString(), file_count: 0, chunk_count: 0 };
    setActiveProject(newProj);
    setFiles([]);
    setMessages([]);
  }

  async function deleteProject(projectId: number) {
    await fetch(`${API}/projects/${projectId}`, { method: "DELETE" });
    if (activeProject?.id === projectId) { setActiveProject(null); setFiles([]); setMessages([]); }
    await loadProjects();
  }

  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeProject) return;
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(selectedFiles).forEach(f => formData.append("files", f));
    const res = await fetch(`${API}/upload?project_id=${activeProject.id}`, { method: "POST", body: formData });
    const data = await res.json();
    await loadFiles(activeProject.id);
    await loadProjects();
    setUploading(false);
    setMessages(prev => [...prev, { role: "ai", text: `Indexed ${data.files.length} file(s) — ${data.total_chunks} chunks.\n\n${data.files.map((f: string) => `• ${f}`).join("\n")}\n\nAsk me anything!` }]);
  }

  async function ingestRepo() {
    if (!repoUrl.trim() || !repoName.trim()) return;
    setIngestingRepo(true);
    const res = await fetch(`${API}/ingest-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: repoUrl, project_name: repoName })
    });
    const data = await res.json();
    await loadProjects();
    setIngestingRepo(false);
    setRepoUrl("");
    setRepoName("");
    if (!data.error) {
      const newProj: Project = { id: data.project_id, name: data.project_name, source: repoUrl, created_at: new Date().toISOString(), file_count: data.files_indexed, chunk_count: data.total_chunks };
      setActiveProject(newProj);
      await loadFiles(data.project_id);
      setMessages([{ role: "ai", text: `✓ Indexed ${data.files_indexed} files from ${data.project_name}.\n\nAsk me anything about this codebase!` }]);
    }
  }

  async function ask(q?: string) {
    const text = q || question;
    if (!text.trim() || !activeProject) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setQuestion("");
    setLoading(true);
    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, project_id: activeProject.id })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: "ai", text: data.answer }]);
    setLoading(false);
  }

  async function generateDocs(filename: string) {
    if (!activeProject) return;
    setGeneratingDocs(true);
    setView("chat");
    setMessages(prev => [...prev, { role: "ai", text: `Generating documentation for ${filename}...` }]);
    const res = await fetch(`${API}/generate-docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, project_id: activeProject.id })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { role: "ai", text: `Documentation for ${filename}:\n\n${data.docs}`, type: "docs" }]);
    setGeneratingDocs(false);
  }

  async function scoreAll() {
    if (!activeProject || files.length === 0) return;
    setScoringAll(true);
    setProjectScore(null);
    setScores({});
    const newScores: Record<string, DebtScore> = {};
    for (const file of files) {
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        const res = await fetch(`${API}/score-debt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.filename, project_id: activeProject.id })
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.scores) { newScores[file.filename] = data.scores; setScores(prev => ({ ...prev, [file.filename]: data.scores })); }
      } catch { continue; }
    }
    const allScores = Object.values(newScores).map(s => s.overall_score);
    if (allScores.length > 0) {
      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      setProjectScore(Math.round(avg * 10) / 10);
    }
    setScoringAll(false);
  }

  function scoreClass(score: number) {
    if (score >= 8) return "score-green";
    if (score >= 5) return "score-yellow";
    return "score-red";
  }

  function scoreCardClass(score: number) {
    if (score >= 8) return "score-card green";
    if (score >= 5) return "score-card yellow";
    return "score-card red";
  }

  const suggestions = [
    "What does this codebase do?",
    "Where is authentication handled?",
    "What are the main security risks?",
    "How is data validated?"
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon">🔍</div>
              <span className="logo-text">LegacyLens</span>
            </div>
            <div className="logo-sub">// codebase intelligence</div>
          </div>

          <div className="sidebar-section">
            <div className="section-label">Index GitHub repo</div>
            <input className="input-field" type="text" value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="Project name" />
            <input className="input-field" type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && ingestRepo()} placeholder="https://github.com/user/repo" />
            <button className="btn-primary" onClick={ingestRepo} disabled={ingestingRepo || !repoUrl.trim() || !repoName.trim()}>
              {ingestingRepo ? "⟳ Indexing..." : "↗ Index repository"}
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">New project</div>
            <input className="input-field" type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} onKeyDown={e => e.key === "Enter" && createProject()} placeholder="Project name" />
            <button className="btn-secondary" onClick={createProject} disabled={!newProjectName.trim()}>
              + Create project
            </button>
          </div>

          <div className="projects-list">
            <div className="section-label" style={{padding: "4px 8px"}}>Projects ({projects.length})</div>
            {projects.length === 0 && <p style={{fontSize: "12px", color: "#334155", padding: "8px", fontFamily: "JetBrains Mono, monospace"}}>// no projects yet</p>}
            {projects.map(p => (
              <div key={p.id} className={`project-item ${activeProject?.id === p.id ? "active" : ""}`} onClick={() => selectProject(p)}>
                <div style={{minWidth: 0}}>
                  <div className="project-name">{p.name}</div>
                  <div className="project-meta">{p.file_count} files · {p.chunk_count} chunks</div>
                </div>
                <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteProject(p.id); }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="main">
          {!activeProject ? (
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <div className="empty-title">No project selected</div>
              <div className="empty-sub">Index a GitHub repository or create a project to start analyzing your codebase</div>
            </div>
          ) : (
            <>
              <div className="topbar">
                <div>
                  <div className="project-title">{activeProject.name}</div>
                  <div className="project-subtitle">{files.length} files · {activeProject.chunk_count} chunks indexed</div>
                </div>
                <div className="topbar-actions">
                  {projectScore !== null && (
                    <div className="score-badge">
                      health: <span className={scoreClass(projectScore)}>{projectScore}/10</span>
                    </div>
                  )}
                  <button className={`tab-btn ${view === "chat" ? "active" : ""}`} onClick={() => setView("chat")}>Chat</button>
                  <button className={`tab-btn ${view === "files" ? "active" : ""}`} onClick={() => setView("files")}>Files & Memory</button>
                </div>
              </div>

              {view === "files" ? (
                <div className="files-area">
                  <div className="files-toolbar">
                    <div className="files-title">// {files.length} indexed files</div>
                    <div style={{display: "flex", gap: "8px"}}>
                      <label className="upload-label">
                        <input type="file" accept=".py,.js,.ts,.java,.go,.rb,.php,.cs,.cpp,.c,.tsx" onChange={uploadFiles} multiple style={{display: "none"}} />
                        {uploading ? "⟳ Uploading..." : "+ Upload files"}
                      </label>
                      <button className="score-all-btn" onClick={scoreAll} disabled={scoringAll}>
                        {scoringAll ? `Scoring ${Object.keys(scores).length}/${files.length}...` : "⚡ Score all"}
                      </button>
                    </div>
                  </div>

                  {files.map((f, i) => (
                    <div key={i} className="file-card">
                      <div className="file-row">
                        <div className="file-info">
                          <div className="file-dot"></div>
                          <span className="file-name">{f.filename}</span>
                          <span className="file-chunks">{f.chunks}ch</span>
                        </div>
                        <div className="file-actions">
                          {scores[f.filename] && (
                            <span className={`score-num ${scoreClass(scores[f.filename].overall_score)}`}>
                              {scores[f.filename].overall_score}/10
                            </span>
                          )}
                          <button className="action-btn" onClick={() => generateDocs(f.filename)} disabled={generatingDocs}>
                            Docs
                          </button>
                        </div>
                      </div>
                      {scores[f.filename] && (
                        <div className={scoreCardClass(scores[f.filename].overall_score)}>
                          <div className="score-dims">
                            {[
                              ["Complexity", scores[f.filename].complexity],
                              ["Security", scores[f.filename].security],
                              ["Docs", scores[f.filename].documentation],
                              ["Testability", scores[f.filename].testability],
                              ["Modernize", scores[f.filename].modernization_urgency],
                            ].map(([label, val]) => (
                              <div key={label as string} className="score-dim">
                                <div className={`score-dim-val ${scoreClass(val as number)}`}>{val}</div>
                                <div className="score-dim-label">{label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="score-summary">{scores[f.filename].summary}</div>
                          <ul className="score-issues">
                            {scores[f.filename].top_issues.map((issue, j) => (
                              <li key={j}>→ {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="chat-area">
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <div className="empty-icon" style={{width: "48px", height: "48px", fontSize: "20px"}}>💬</div>
                        <div className="chat-empty-title">Ask anything about {activeProject.name}</div>
                        <div className="chat-empty-sub">Query your codebase in plain English. Get cited answers with exact file and line references.</div>
                        <div className="suggestion-chips">
                          {suggestions.map((s, i) => (
                            <div key={i} className="chip" onClick={() => ask(s)}>{s}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        m.role === "user" ? (
                          <div key={i} className="msg-user">
                            <div className="bubble">{m.text}</div>
                          </div>
                        ) : (
                          <div key={i} className="msg-ai">
                            <div className="ai-avatar">🔍</div>
                            <div className={`bubble ${m.type === "docs" ? "docs" : ""}`}>
                              <div className="msg-label">{m.type === "docs" ? "generated docs" : "legacylens"}</div>
                              {m.text}
                            </div>
                          </div>
                        )
                      ))
                    )}
                    {loading && (
                      <div className="msg-ai thinking">
                        <div className="ai-avatar">🔍</div>
                        <div className="bubble">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="input-bar">
                    <input
                      className="chat-input"
                      type="text"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && ask()}
                      placeholder={`Ask anything about ${activeProject.name}...`}
                    />
                    <button className="send-btn" onClick={() => ask()} disabled={!question.trim() || loading}>
                      Send →
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
