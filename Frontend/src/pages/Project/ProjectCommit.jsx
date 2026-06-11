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
function Avatar({ name, size = 36, forceInitials = false }) {
    const seed = encodeURIComponent(name || "user");
    const src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=transparent`;
    const [failed, setFailed] = useState(false);
    const showInitials = forceInitials || failed;

    return (
        <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-white overflow-hidden rounded-full border-2 border-border-default"
            style={{
                width: size, height: size,
                background: showInitials ? hashColor(name) : "var(--color-surface)",
                fontSize: size * 0.35,
            }}
        >
            {showInitials ? (
                initials(name)
            ) : (
                <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
            )}
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
        <div className="flex items-center gap-2">
            <span className="text-success text-xs font-semibold min-w-[36px]">+{added}</span>
            <span className="text-error text-xs font-semibold min-w-[36px]">-{removed}</span>
            <div className="flex gap-[2px]">
                {Array.from({ length: addW }).map((_, i) => (
                    <div key={`a${i}`} className="w-[7px] h-[7px] rounded-[1px] bg-success" />
                ))}
                {Array.from({ length: remW }).map((_, i) => (
                    <div key={`r${i}`} className="w-[7px] h-[7px] rounded-[1px] bg-error" />
                ))}
                {Array.from({ length: Math.max(neutral, 0) }).map((_, i) => (
                    <div key={`n${i}`} className="w-[7px] h-[7px] rounded-[1px] bg-border-subtle" />
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
        <span className={`inline-flex items-center gap-1.5 bg-surface border border-border-default rounded-md px-2 py-0.5 text-xs ${isDeleted ? "text-error line-through" : "text-text-primary"}`}>
            <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: bg }} />
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
        <div className="relative bg-card border border-border-default rounded-2xl p-4 transition hover:border-primary/50 hover:shadow-md overflow-hidden group">
            {/* left accent line */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${isMerge ? "bg-gradient-to-b from-purple-400 to-purple-600" : "bg-gradient-to-b from-blue-400 to-blue-600"}`} />

            <div className="flex justify-between items-start gap-3">
                {/* left */}
                <div className="flex gap-3 items-start flex-1 min-w-0">
                    {/* commit type icon */}
                    <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 border ${isMerge ? "bg-purple-500/10 border-purple-500/30 text-purple-500" : "bg-primary-soft border-primary/20 text-primary"}`}>
                        {isMerge ? <GitMerge size={15} /> : <GitCommit size={15} />}
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* author row */}
                        <div className="flex items-center gap-2 mb-1.5">
                            <Avatar name={commit.author} size={24} />
                            <span className="text-text-primary font-semibold text-[13px]">{commit.author || "Unknown"}</span>
                            <span className="text-text-muted text-xs">•</span>
                            <span className="text-text-muted text-xs">{timeAgo(commit.date)}</span>
                            <span className="bg-surface border border-border-default rounded px-1.5 py-[1px] text-[11px] text-text-secondary font-mono">{sha}</span>
                        </div>

                        {/* message */}
                        <p className="text-text-primary text-[14px] font-medium mb-2 leading-relaxed">
                            {commit.message}
                        </p>

                        {/* merge description */}
                        {isMerge && commit.description && (
                            <div className="border-l-[3px] border-purple-500/50 pl-2.5 mb-2 text-text-secondary text-xs italic">
                                {commit.description}
                            </div>
                        )}

                        {/* files */}
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {files.map((f, i) => <FileChip key={i} name={f} />)}
                            </div>
                        )}

                        {/* diff bar */}
                        <DiffBar added={commit.added ?? 0} removed={commit.removed ?? 0} />
                    </div>
                </div>

                {/* view diff button */}
                {commit.url && (
                    <a href={commit.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-surface border border-border-default hover:bg-primary-soft hover:text-primary hover:border-primary/30 rounded-lg px-3 py-1.5 text-xs text-text-secondary no-underline whitespace-nowrap flex-shrink-0 transition">
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
            <div className="flex items-center gap-2.5 mb-3">
                <Calendar size={13} className="text-text-muted" />
                <span className="text-text-muted text-[11px] font-bold tracking-widest uppercase">{label}</span>
                <div className="flex-1 h-[1px] bg-border-subtle" />
            </div>
            <div className="flex flex-col gap-2.5">
                {commits.map((c, i) => <CommitCard key={c.sha || i} commit={c} />)}
            </div>
        </div>
    );
}

/* ── tab ── */
function Tab({ icon, label, active, onClick, badge }) {
    return (
        <div onClick={onClick} className={`flex items-center gap-2 cursor-pointer pb-2.5 border-b-2 text-[13px] font-medium transition ${active ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            {icon} {label}
            {badge != null && (
                <span className={`rounded-full px-1.5 py-[1px] text-[11px] font-bold ${active ? "bg-primary text-white" : "bg-border-subtle text-text-secondary"}`}>
                    {badge}
                </span>
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
                const res = await axios.get(`/api/project/${id}`);
                setProject(res.data.project || res.data);
            } catch { }
        };
        if (id) fetchProject();
    }, [id]);

    /* fetch all team users for mapping member IDs to profiles */
    const [allUsers, setAllUsers] = useState([]);
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                if (!user?._id) return;
                const res = await axios.get(`/api/invite/team/active/${user._id}`);
                setAllUsers(res.data || []);
            } catch (err) {
                console.error('Failed to fetch users', err?.message || err);
            }
        };
        fetchAllUsers();
    }, [user?._id]);

    /* fetch commits */
    useEffect(() => {
        const fetchCommits = async () => {
            try {
                setLoadingCommits(true);
                const res = await axios.get(`/api/project/${id}/commits`, {
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
        <div className="flex h-screen bg-background">
            <DashboardLeftSide />
            <div className="flex-1 h-screen overflow-y-auto bg-background text-text-primary px-2 py-6 font-sans">
                <DashboardHeader user={user} />

                {/* project card */}
                <div className="mt-8 bg-card border border-border-default rounded-[18px] p-5 md:p-6 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                            <GitCommit size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-primary m-0">
                                {project?.projectName || "Project Repository"}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-[7px] h-[7px] rounded-full bg-success inline-block" />
                                <span className="text-text-secondary text-[13px]">
                                    Branch: <span className="text-success font-semibold">main</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* stats */}
                    <div className="flex items-center gap-6">
                        {[
                            { val: commits.length, label: "Commits" },
                            { val: pullCount, label: "Pull Requests" },
                            { val: memberCount, label: "Members" },
                        ].map((s, i, arr) => (
                            <React.Fragment key={s.label}>
                                <div className="text-center">
                                    <p className="text-text-primary font-bold text-xl m-0">{s.val}</p>
                                    <p className="text-text-muted text-[11px] m-0">{s.label}</p>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="w-[1px] h-8 bg-border-subtle" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* tabs */}
                <div className="mt-6 border-b border-border-default flex gap-7 pb-0  px-6 ">
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
                    <div className="mt-6 px-3 flex flex-col gap-7">
                        {loadingCommits ? (
                            <div className="flex items-center gap-2.5 text-text-muted py-8">
                                <RotateCcw size={16} className="animate-spin" />
                                Loading commits…
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
                    <div className="mt-4  ">
                           <CodeViewer projectId={id} filePath={currentPath} />
                    </div>
                )}

                {/* pull requests placeholder */}
                {activeTab === "prs" && (
                    <div className="mt-8 text-center text-text-muted py-12">
                        <GitPullRequest size={40} className="mx-auto mb-3 block opacity-40" />
                        <p className="text-sm">Pull requests view coming soon.</p>
                    </div>
                )}

                {/* members */}
                {activeTab === "members" && (
                    <div className="mt-8 flex flex-wrap gap-3.5">
                        {project?.members && project.members.length > 0 ? (
                            project.members.map((m) => {
                                const member = allUsers.find(u => u._id === m) || (authUser?.user && authUser.user._id === m ? authUser.user : (typeof m === 'object' ? m : null));
                                const name = member ? (member.fullName || member.name) : (typeof m === 'string' ? m : 'Unknown');
                                const email = member ? member.email : undefined;
                                const idKey = member?._id || (typeof m === 'string' ? m : JSON.stringify(m));

                                return (
                                    <div key={idKey} className="flex items-center gap-3 bg-surface border border-border-default rounded-xl px-4 py-3 min-w-[200px]">
                                        <Avatar name={name} size={38} forceInitials={true} />
                                        <div>
                                            <p className="text-text-primary font-semibold text-[13px] m-0">{name}</p>
                                            {email && <p className="text-text-muted text-[11px] m-0">{email}</p>}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-text-muted">No members found for this project.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}