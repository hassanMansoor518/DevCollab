import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
    GitCommit, Code, RotateCcw, GitMerge,
    GitPullRequest, Users, ChevronRight,
    ExternalLink, Plus, Minus, Calendar
} from "lucide-react";

import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import DashboardHeader from "../../component/DashboardHeader";
import CodeViewer from "./CodeViewer";

/* ── helpers ── */
function groupByDate(commits) {
    return commits.reduce((acc, c) => {
        const label = formatDateLabel(new Date(c.date));
        if (!acc[label]) acc[label] = [];
        acc[label].push(c);
        return acc;
    }, {});
}
function formatDateLabel(d) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())
        return `TODAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    if (d.toDateString() === yesterday.toDateString())
        return `YESTERDAY, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
}
function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
function hashColor(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const hue = Math.abs(h) % 360;
    return `hsl(${hue},60%,55%)`;
}
function initials(name = "") {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ── avatar with real image fallback ── */
function Avatar({ name, size = 36 }) {
    const seed = encodeURIComponent(name || "user");
    const src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=0d1117`;
    const [failed, setFailed] = useState(false);
    return (
        <div
            style={{
                width: size, height: size, borderRadius: "50%",
                background: failed ? hashColor(name) : "#0d1117",
                border: "2px solid rgba(255,255,255,0.12)",
                overflow: "hidden", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size * 0.35, fontWeight: 700, color: "#fff",
                fontFamily: "monospace",
            }}
        >
            {!failed
                ? <img src={src} alt={name} style={{ width: "100%", height: "100%" }} onError={() => setFailed(true)} />
                : initials(name)
            }
        </div>
    );
}

/* ── diff bar ── */
function DiffBar({ added = 0, removed = 0 }) {
    const max = Math.max(added + removed, 1);
    const addW = Math.round((added / max) * 60);
    const remW = Math.round((removed / max) * 60);
    const neutral = 60 - addW - remW;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, minWidth: 36 }}>+{added}</span>
            <span style={{ color: "#f87171", fontSize: 12, fontWeight: 600, minWidth: 36 }}>-{removed}</span>
            <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: addW }).map((_, i) => (
                    <div key={`a${i}`} style={{ width: 7, height: 7, borderRadius: 1, background: "#4ade80" }} />
                ))}
                {Array.from({ length: remW }).map((_, i) => (
                    <div key={`r${i}`} style={{ width: 7, height: 7, borderRadius: 1, background: "#f87171" }} />
                ))}
                {Array.from({ length: Math.max(neutral, 0) }).map((_, i) => (
                    <div key={`n${i}`} style={{ width: 7, height: 7, borderRadius: 1, background: "rgba(255,255,255,0.12)" }} />
                ))}
            </div>
        </div>
    );
}

/* ── file chip ── */
function FileChip({ name }) {
    const ext = name?.split(".").pop() || "";
    const colors = { js: "#f7df1e", ts: "#3178c6", css: "#264de4", jsx: "#61dafb", tsx: "#61dafb", py: "#3572A5" };
    const bg = colors[ext] || "#6b7280";
    const isDeleted = name?.startsWith("-") || false;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "2px 8px", fontSize: 12, color: isDeleted ? "#f87171" : "#e2e8f0",
            textDecoration: isDeleted ? "line-through" : "none",
        }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: bg, flexShrink: 0 }} />
            {name?.replace(/^-/, "")}
        </span>
    );
}

/* ── commit card ── */
function CommitCard({ commit }) {
    const isMerge = commit.message?.toLowerCase().startsWith("merge");
    const files = commit.files || [];
    const sha = (commit.sha || "abc1234").slice(0, 7);

    return (
        <div style={{
            background: "linear-gradient(135deg, rgba(13,27,42,0.9) 0%, rgba(17,24,39,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "16px 20px",
            transition: "border-color 0.2s, box-shadow 0.2s",
            position: "relative", overflow: "hidden",
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(96,165,250,0.3)";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(96,165,250,0.07)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* left accent line */}
            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: isMerge ? "linear-gradient(to bottom, #a78bfa, #7c3aed)" : "linear-gradient(to bottom, #60a5fa, #3b82f6)",
                borderRadius: "14px 0 0 14px",
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                {/* left */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    {/* commit type icon */}
                    <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: isMerge ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.12)",
                        border: `1px solid ${isMerge ? "rgba(139,92,246,0.3)" : "rgba(59,130,246,0.25)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        {isMerge
                            ? <GitMerge size={15} color="#a78bfa" />
                            : <GitCommit size={15} color="#60a5fa" />
                        }
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        {/* author row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <Avatar name={commit.author} size={24} />
                            <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{commit.author || "Unknown"}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>•</span>
                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{timeAgo(commit.date)}</span>
                            <span style={{
                                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 5, padding: "1px 6px", fontSize: 11,
                                color: "rgba(255,255,255,0.4)", fontFamily: "monospace",
                            }}>{sha}</span>
                        </div>

                        {/* message */}
                        <p style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>
                            {commit.message}
                        </p>

                        {/* merge description */}
                        {isMerge && commit.description && (
                            <div style={{
                                borderLeft: "3px solid rgba(139,92,246,0.5)",
                                paddingLeft: 10, marginBottom: 8,
                                color: "rgba(255,255,255,0.45)", fontSize: 12, fontStyle: "italic",
                            }}>
                                {commit.description}
                            </div>
                        )}

                        {/* files */}
                        {files.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                                {files.map((f, i) => <FileChip key={i} name={f} />)}
                            </div>
                        )}

                        {/* diff bar */}
                        <DiffBar added={commit.added ?? 0} removed={commit.removed ?? 0} />
                    </div>
                </div>

                {/* view diff button */}
                {commit.url && (
                    <a href={commit.url} target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#94a3b8",
                        textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                        transition: "background 0.2s, color 0.2s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(96,165,250,0.1)"; e.currentTarget.style.color = "#60a5fa"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                        <ExternalLink size={12} /> View Diff
                    </a>
                )}
            </div>
        </div>
    );
}

/* ── date group ── */
function DateGroup({ label, commits }) {
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Calendar size={13} color="#4b5563" />
                <span style={{ color: "#4b5563", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>{label}</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {commits.map((c, i) => <CommitCard key={c.sha || i} commit={c} />)}
            </div>
        </div>
    );
}

/* ── tab ── */
function Tab({ icon, label, active, onClick, badge }) {
    return (
        <div onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            paddingBottom: 10, borderBottom: active ? "2px solid #60a5fa" : "2px solid transparent",
            color: active ? "#60a5fa" : "#6b7280", fontSize: 13, fontWeight: 500,
            transition: "color 0.2s",
        }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#6b7280"; }}
        >
            {icon} {label}
            {badge != null && (
                <span style={{
                    background: active ? "#1d4ed8" : "rgba(255,255,255,0.08)",
                    color: active ? "#bfdbfe" : "#6b7280",
                    borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                }}>{badge}</span>
            )}
        </div>
    );
}

/* ── DEMO DATA (remove when backend is wired) ── */
const DEMO_COMMITS = [
    {
        sha: "aef7101", author: "Marcus Thorne", date: new Date().toISOString(),
        message: "Refactor dashboard layout for better responsiveness",
        files: ["Dashboard.js", "MobileNav.js", "-OldLayout.css"],
        added: 124, removed: 48, url: "#",
    },
    {
        sha: "17c04fc", author: "Elena Vance", date: new Date(Date.now() - 3 * 3600000).toISOString(),
        message: "Fix authentication token refresh logic",
        files: ["auth.service.ts"],
        added: 12, removed: 2, url: "#",
    },
    {
        sha: "e1f388a", author: "DevCollab Bot", date: new Date(Date.now() - 26 * 3600000).toISOString(),
        message: "Merge pull request #115 from feature/analytics-v2",
        description: "Updated tracking pixels and added weekly reports engine.",
        files: [],
        added: 1402, removed: 322, url: "#",
    },
];

/* ════════════════════════════════════════════ */
export default function ProjectCommit() {
    const { id } = useParams();
    const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");
    const user = authUser?.user;

    const [project, setProject] = useState(null);
    const [commits, setCommits] = useState(DEMO_COMMITS);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [activeTab, setActiveTab] = useState("commits");
    const [currentPath, setCurrentPath] = useState("");
    const [pullCount] = useState(3);
    const [memberCount] = useState(5);

    /* fetch project */
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`http://localhost:3001/api/project/${id}`);
                setProject(res.data.project || res.data);
            } catch { }
        };
        if (id) fetchProject();
    }, [id]);

    /* fetch commits */
    useEffect(() => {
        const fetchCommits = async () => {
            try {
                setLoadingCommits(true);
                const res = await axios.get(`http://localhost:3001/api/project/${id}/commits`, {
                    headers: { Authorization: `Bearer ${authUser.token || ""}` },
                });
                const data = res.data.commits || res.data || [];
                if (data.length) setCommits(data);
            } catch {
                /* keep demo data */
            } finally {
                setLoadingCommits(false);
            }
        };
        if (activeTab === "commits") fetchCommits();
    }, [id, activeTab]);

    const grouped = groupByDate(commits);

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <DashboardLeftSide />
            <div style={{
                flex: 1, height: "100vh", overflowY: "auto",
                background: "linear-gradient(135deg, #050B18 0%, #071428 60%, #030712 100%)",
                color: "#fff", padding: "24px 32px", fontFamily: "'Inter', sans-serif",
            }}>
                <DashboardHeader user={user} />

                {/* project card */}
                <div style={{
                    marginTop: 32,
                    background: "linear-gradient(135deg, #0D1B2A 0%, #111827 100%)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 18, padding: "20px 24px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                        }}>
                            <GitCommit size={22} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                                {project?.projectName || "Project Repository"}
                            </h1>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                                <span style={{ color: "#6b7280", fontSize: 13 }}>
                                    Branch: <span style={{ color: "#4ade80", fontWeight: 600 }}>main</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* stats */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        {[
                            { val: commits.length, label: "Commits" },
                            { val: pullCount, label: "Pull Requests" },
                            { val: memberCount, label: "Members" },
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.label}>
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 20, margin: 0 }}>{s.val}</p>
                                    <p style={{ color: "#4b5563", fontSize: 11, margin: 0 }}>{s.label}</p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.07)" }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* tabs */}
                <div style={{
                    marginTop: 24, borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", gap: 28, paddingBottom: 0,
                }}>
                    <Tab icon={<GitCommit size={15} />} label="Commits" active={activeTab === "commits"}
                        onClick={() => setActiveTab("commits")} badge={commits.length} />
                    <Tab icon={<GitPullRequest size={15} />} label="Pull Requests" active={activeTab === "prs"}
                        onClick={() => setActiveTab("prs")} badge={pullCount} />
                    <Tab icon={<Code size={15} />} label="Code View" active={activeTab === "code"}
                        onClick={() => setActiveTab("code")} />
                    <Tab icon={<Users size={15} />} label="Members" active={activeTab === "members"}
                        onClick={() => setActiveTab("members")} />
                </div>

                {/* commits tab */}
                {activeTab === "commits" && (
                    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 28 }}>
                        {loadingCommits ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280", padding: "32px 0" }}>
                                <RotateCcw size={16} style={{ animation: "spin 1s linear infinite" }} />
                                Loading commits…
                                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            </div>
                        ) : (
                            Object.entries(grouped).map(([label, list]) => (
                                <DateGroup key={label} label={label} commits={list} />
                            ))
                        )}
                    </div>
                )}

                {/* code tab */}
                {activeTab === "code" && (
                    <div style={{ marginTop: 24 }}>
                        <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Repository Files</h2>
                        <CodeViewer projectId={id} filePath={currentPath} />
                    </div>
                )}

                {/* pull requests placeholder */}
                {activeTab === "prs" && (
                    <div style={{ marginTop: 32, textAlign: "center", color: "#4b5563", padding: "48px 0" }}>
                        <GitPullRequest size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                        <p style={{ fontSize: 14 }}>Pull requests view coming soon.</p>
                    </div>
                )}

                {/* members placeholder */}
                {activeTab === "members" && (
                    <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 14 }}>
                        {["Marcus Thorne", "Elena Vance", "DevCollab Bot", "Priya Sharma", "Leo Kim"].map(name => (
                            <div key={name} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12, padding: "12px 16px", minWidth: 200,
                            }}>
                                <Avatar name={name} size={38} />
                                <div>
                                    <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13, margin: 0 }}>{name}</p>
                                    <p style={{ color: "#4b5563", fontSize: 11, margin: 0 }}>Contributor</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}