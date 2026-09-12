import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    GitCommit, RotateCcw, GitMerge, GitPullRequest, Users,
    ExternalLink, Calendar, Plus, X, GitBranch, CheckCircle2,
    XCircle, Circle, AlertCircle, Clock, Loader2, Trash2,
    UserMinus, Settings, Shield, Globe, Lock, ChevronDown,
    Save, RefreshCw, Link2, Info, MoreVertical, Eye
} from "lucide-react";

import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import TopHeader from "./Workspace/TopHeader";
import DevCollabWorkspace from "./Workspace/DevCollabWorkspace";

const API_URL = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_URL || "https://devcollab-production-f16f.up.railway.app");

/* ═══════════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════════ */

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
    if (!dateStr) return "—";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function hashColor(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const hue = Math.abs(h) % 360;
    return `hsl(${hue},55%,52%)`;
}

function initials(name = "") {
    return name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "??";
}

/* ═══════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════ */

function Avatar({ name, src, size = 28 }) {
    const [failed, setFailed] = useState(false);
    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}&backgroundColor=0d1522`;
    const imgSrc = !failed && src ? src : fallbackUrl;

    return (
        <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-[#E6EDF3] overflow-hidden rounded-full border border-[#1E293B]"
            style={{ width: size, height: size, background: "#151E2D", fontSize: size * 0.38 }}
        >
            <img
                src={imgSrc}
                alt={name || "User"}
                className="w-full h-full object-cover"
                onError={() => setFailed(true)}
            />
        </div>
    );
}

function AvatarInitials({ name, size = 28 }) {
    return (
        <div
            className="flex-shrink-0 flex items-center justify-center font-mono font-bold text-white overflow-hidden rounded-full"
            style={{ width: size, height: size, background: hashColor(name), fontSize: size * 0.38 }}
        >
            {initials(name)}
        </div>
    );
}

function StatusBadge({ status }) {
    const cfg = {
        open: { icon: Circle, color: "#3FB950", bg: "#0f2619", border: "#1a4d2a", label: "Open" },
        merged: { icon: GitMerge, color: "#A371F7", bg: "#1c1030", border: "#3d2470", label: "Merged" },
        closed: { icon: XCircle, color: "#F85149", bg: "#1e0e0c", border: "#5a1d1a", label: "Closed" },
    }[status] || { icon: Circle, color: "#8B949E", bg: "#151E2D", border: "#1E293B", label: status };

    const Icon = cfg.icon;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide border"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
            <Icon size={11} />
            {cfg.label}
        </span>
    );
}

function SectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
                <h2 className="text-sm font-bold text-[#E6EDF3] tracking-tight">{title}</h2>
                {subtitle && <p className="text-[11px] text-[#8B949E] mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function EmptyState({ icon: Icon, title, message, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#0D1522] border border-[#1E293B] flex items-center justify-center mb-4">
                <Icon size={22} className="text-[#3E4D61]" />
            </div>
            <h3 className="text-sm font-semibold text-[#8B949E] mb-1">{title}</h3>
            <p className="text-[11px] text-[#6E7681] max-w-sm leading-relaxed mb-4">{message}</p>
            {action}
        </div>
    );
}

function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex items-center justify-center gap-2.5 py-20 text-[#8B949E] text-xs">
            <Loader2 size={16} className="animate-spin text-[#3794FF]" />
            <span>{label}</span>
        </div>
    );
}

function ErrorBanner({ message, onRetry }) {
    return (
        <div className="flex items-center justify-between bg-[#1a0f0f] border border-[#5a1d1a] rounded p-3 text-xs">
            <div className="flex items-center gap-2 text-[#F85149]">
                <AlertCircle size={14} />
                <span>{message}</span>
            </div>
            {onRetry && (
                <button onClick={onRetry} className="text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
                    <RefreshCw size={13} />
                </button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   COMMIT COMPONENTS
═══════════════════════════════════════════════════════ */

function CommitCard({ commit }) {
    const isMerge = commit.message?.toLowerCase().startsWith("merge");
    const sha = (commit.sha || "").slice(0, 7);
    const lines = commit.message?.split("\n") || [];
    const headline = lines[0] || "";
    const body = lines.slice(1).filter(Boolean).join("\n");

    return (
        <div className="relative bg-[#0B111B] border border-[#1E293B] hover:border-[#3794FF]/40 rounded p-3 transition-all overflow-hidden group cursor-default">
            <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${isMerge ? "bg-[#A371F7]" : "bg-[#3794FF]"}`} />

            <div className="flex justify-between items-start gap-3 pl-2">
                <div className="flex gap-2.5 items-start flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border mt-0.5 ${isMerge
                        ? "bg-[#A371F7]/10 border-[#A371F7]/30 text-[#A371F7]"
                        : "bg-[#3794FF]/10 border-[#3794FF]/30 text-[#3794FF]"
                        }`}>
                        {isMerge ? <GitMerge size={13} /> : <GitCommit size={13} />}
                    </div>

                    <div className="min-w-0 flex-1">
                        {/* Author row */}
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px]">
                            <Avatar name={commit.author} src={commit.authorAvatar} size={18} />
                            <span className="text-[#E6EDF3] font-semibold truncate max-w-[140px]">{commit.author || "Unknown"}</span>
                            <span className="text-[#3E4D61]">•</span>
                            <span className="text-[#8B949E]">{timeAgo(commit.date)}</span>
                            <code className="bg-[#0D1522] border border-[#1E293B] rounded px-1.5 py-0.5 text-[10px] text-[#8B949E] font-mono shrink-0">
                                {sha}
                            </code>
                        </div>

                        {/* Commit message */}
                        <p className="text-[#E6EDF3] text-xs font-medium mb-1 leading-relaxed">{headline}</p>
                        {body && (
                            <p className="text-[#8B949E] text-[11px] leading-relaxed border-l-2 border-[#1E293B] pl-2 mb-1 italic">{body}</p>
                        )}

                        {/* Date */}
                        <span className="text-[10px] text-[#6E7681] font-mono">{formatFullDate(commit.date)}</span>
                    </div>
                </div>

                {commit.url && (
                    <a
                        href={commit.url}
                        target="_blank"
                        rel="noreferrer"
                        title="View on GitHub"
                        className="inline-flex items-center gap-1 bg-[#0D1522] border border-[#1E293B] hover:border-[#3794FF]/40 rounded px-2 py-1 text-xs text-[#8B949E] hover:text-[#E6EDF3] no-underline shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <ExternalLink size={11} />
                        <span className="hidden sm:inline">View</span>
                    </a>
                )}
            </div>
        </div>
    );
}

function DateGroup({ label, commits }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2.5">
                <Calendar size={11} className="text-[#6E7681]" />
                <span className="text-[#8B949E] text-[10px] font-bold tracking-widest uppercase">{label}</span>
                <div className="flex-1 h-[1px] bg-[#172033]" />
                <span className="text-[#6E7681] text-[10px] font-mono">{commits.length}</span>
            </div>
            <div className="flex flex-col gap-2">
                {commits.map((c, i) => <CommitCard key={c.sha || i} commit={c} />)}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   PULL REQUEST COMPONENTS
═══════════════════════════════════════════════════════ */

function PRCard({ pr, onMerge, onClose, onReopen, currentUserId, isOwner }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const lines = (pr.description || "").split("\n").filter(Boolean);

    return (
        <div className="relative bg-[#0B111B] border border-[#1E293B] hover:border-[#3794FF]/30 rounded transition-all overflow-hidden group">
            {/* Status left accent */}
            <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${pr.status === "merged" ? "bg-[#A371F7]"
                : pr.status === "closed" ? "bg-[#F85149]"
                    : "bg-[#3FB950]"
                }`} />

            <div className="p-3 pl-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <GitPullRequest
                            size={15}
                            className={`mt-0.5 shrink-0 ${pr.status === "merged" ? "text-[#A371F7]"
                                : pr.status === "closed" ? "text-[#F85149]"
                                    : "text-[#3FB950]"
                                }`}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-xs font-semibold text-[#E6EDF3]">{pr.title}</h3>
                                <StatusBadge status={pr.status} />
                            </div>

                            {lines.length > 0 && (
                                <p className="text-[11px] text-[#8B949E] mb-2 leading-relaxed line-clamp-2">{lines[0]}</p>
                            )}

                            <div className="flex items-center gap-3 text-[10px] text-[#6E7681] font-mono flex-wrap">
                                <span className="text-[#8B949E]">#{pr.number}</span>
                                <span className="flex items-center gap-1">
                                    <Avatar name={pr.author?.fullName || "?"} src={pr.author?.avatar} size={14} />
                                    <span>{pr.author?.fullName || "Unknown"}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <GitBranch size={10} className="text-[#3794FF]" />
                                    <code className="text-[#3794FF]">{pr.sourceBranch}</code>
                                    <span className="text-[#3E4D61]">→</span>
                                    <code className="text-[#8B949E]">{pr.targetBranch}</code>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {timeAgo(pr.createdAt)}
                                </span>
                                {pr.status === "merged" && pr.mergedAt && (
                                    <span className="flex items-center gap-1 text-[#A371F7]">
                                        <CheckCircle2 size={10} />
                                        merged {timeAgo(pr.mergedAt)}
                                        {pr.mergedBy?.fullName && ` by ${pr.mergedBy.fullName}`}
                                    </span>
                                )}
                                {pr.status === "closed" && pr.closedAt && (
                                    <span className="flex items-center gap-1 text-[#F85149]">
                                        <XCircle size={10} />
                                        closed {timeAgo(pr.closedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions menu */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-[#1E293B] hover:bg-[#0D1522] text-[#6E7681] hover:text-[#E6EDF3] transition-all opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical size={13} />
                        </button>

                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-[#0D1522] border border-[#1E293B] rounded shadow-xl z-50 overflow-hidden">
                                    {pr.status === "open" && (
                                        <>
                                            <button
                                                onClick={() => { onMerge(pr); setMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#A371F7] hover:bg-[#1c1030] transition-colors"
                                            >
                                                <GitMerge size={12} />
                                                Merge Pull Request
                                            </button>
                                            <button
                                                onClick={() => { onClose(pr); setMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#F85149] hover:bg-[#1a0f0f] transition-colors"
                                            >
                                                <XCircle size={12} />
                                                Close PR
                                            </button>
                                        </>
                                    )}
                                    {pr.status === "closed" && (
                                        <button
                                            onClick={() => { onReopen(pr); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#3FB950] hover:bg-[#0f2619] transition-colors"
                                        >
                                            <RefreshCw size={12} />
                                            Reopen PR
                                        </button>
                                    )}
                                    {pr.status === "merged" && (
                                        <div className="px-3 py-2 text-[11px] text-[#6E7681] italic">
                                            Merged PRs are read-only
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CreatePRModal({ projectId, branches, defaultBranch, currentUser, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [sourceBranch, setSourceBranch] = useState("");
    const [targetBranch, setTargetBranch] = useState(defaultBranch || "main");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) return setError("PR title is required.");
        if (!sourceBranch) return setError("Please select a source branch.");
        if (!targetBranch) return setError("Please select a target branch.");
        if (sourceBranch === targetBranch) return setError("Source and target branches must be different.");

        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/project/${projectId}/pull-requests`, {
                title: title.trim(),
                description: description.trim(),
                sourceBranch,
                targetBranch,
                authorId: currentUser?._id,
            });
            onCreated(res.data.pullRequest);
            toast.success(`Pull Request #${res.data.pullRequest.number} opened!`);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create pull request.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0B111B] border border-[#1E293B] rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
                    <div className="flex items-center gap-2">
                        <GitPullRequest size={15} className="text-[#3FB950]" />
                        <h2 className="text-sm font-bold text-[#E6EDF3]">Open a Pull Request</h2>
                    </div>
                    <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#1E293B] text-[#6E7681] hover:text-[#E6EDF3] transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    {error && <ErrorBanner message={error} />}

                    {/* Title */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Brief description of changes..."
                            autoFocus
                            className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-xs text-[#E6EDF3] placeholder-[#3E4D61] outline-none transition-colors font-mono"
                        />
                    </div>

                    {/* Branches */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><GitBranch size={10} className="text-[#3794FF]" /> Source Branch *</span>
                            </label>
                            <select
                                value={sourceBranch}
                                onChange={e => setSourceBranch(e.target.value)}
                                className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-xs text-[#E6EDF3] outline-none transition-colors font-mono cursor-pointer appearance-none"
                            >
                                <option value="" className="text-[#6E7681]">Select branch…</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><GitBranch size={10} className="text-[#8B949E]" /> Target Branch *</span>
                            </label>
                            <select
                                value={targetBranch}
                                onChange={e => setTargetBranch(e.target.value)}
                                className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-xs text-[#E6EDF3] outline-none transition-colors font-mono cursor-pointer appearance-none"
                            >
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe what changes this PR introduces..."
                            rows={4}
                            className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-xs text-[#E6EDF3] placeholder-[#3E4D61] outline-none transition-colors resize-none font-mono"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Cancel</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-60 text-white text-xs px-4 py-1.5 rounded font-semibold transition-colors"
                        >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <GitPullRequest size={12} />}
                            {submitting ? "Opening…" : "Open Pull Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   CONFIRMATION DIALOG
═══════════════════════════════════════════════════════ */

function ConfirmDialog({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#0B111B] border border-[#1E293B] rounded-lg shadow-2xl w-full max-w-sm mx-4 p-5">
                <h3 className="text-sm font-bold text-[#E6EDF3] mb-2">{title}</h3>
                <p className="text-[11px] text-[#8B949E] leading-relaxed mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} disabled={loading} className="px-3 py-1.5 text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded transition-colors disabled:opacity-60 ${confirmClass}`}
                    >
                        {loading && <Loader2 size={12} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════ */

export default function ProjectCommit({ initialTab = "code" }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const authData = JSON.parse(localStorage.getItem("ChatApp") || "{}");
    const user = authData?.user;
    const token = authData?.token;

    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState(initialTab);

    /* ── Commits State ── */
    const [commits, setCommits] = useState([]);
    const [commitsLoading, setCommitsLoading] = useState(false);
    const [commitsError, setCommitsError] = useState("");
    const [commitsHasRepo, setCommitsHasRepo] = useState(null); // null=unknown, false=no repo, true=has repo
    const [commitsEmpty, setCommitsEmpty] = useState(false);

    /* ── Pull Requests State ── */
    const [pullRequests, setPullRequests] = useState([]);
    const [prsLoading, setPrsLoading] = useState(false);
    const [prsError, setPrsError] = useState("");
    const [openCount, setOpenCount] = useState(0);
    const [mergedCount, setMergedCount] = useState(0);
    const [closedCount, setClosedCount] = useState(0);
    const [prFilter, setPrFilter] = useState("open");
    const [showCreatePR, setShowCreatePR] = useState(false);
    const [branches, setBranches] = useState(["main"]);
    const [defaultBranch, setDefaultBranch] = useState("main");
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    /* ── Members State ── */
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState("");

    /* ── Settings State ── */
    const [settings, setSettings] = useState({ projectName: "", description: "", visibility: "private", githubRepo: "" });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);

    /* ─────────────────────────────────────────────── */
    /*  FETCH PROJECT                                   */
    /* ─────────────────────────────────────────────── */
    const fetchProject = useCallback(async () => {
        if (!id) return;
        try {
            const res = await axios.get(`${API_URL}/api/project/${id}`);
            const proj = res.data.project || res.data;
            setProject(proj);
            setSettings({
                projectName: proj.projectName || "",
                description: proj.description || "",
                visibility: proj.visibility || "private",
                githubRepo: proj.githubRepo || "",
            });
        } catch (err) {
            console.error("Failed to fetch project:", err.message);
        }
    }, [id]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    /* ─────────────────────────────────────────────── */
    /*  FETCH COMMITS                                   */
    /* ─────────────────────────────────────────────── */
    const fetchCommits = useCallback(async () => {
        if (!id) return;
        setCommitsLoading(true);
        setCommitsError("");
        try {
            const res = await axios.get(`${API_URL}/api/project/${id}/commits`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = res.data;
            setCommitsHasRepo(data.hasRepo ?? true);
            setCommitsEmpty(data.noCommits ?? data.commits?.length === 0);
            setCommits(Array.isArray(data.commits) ? data.commits : []);
        } catch (err) {
            const msg = err.response?.data?.error || "Failed to load commits.";
            setCommitsError(msg);
            setCommits([]);
        } finally {
            setCommitsLoading(false);
        }
    }, [id, token]);

    /* ─────────────────────────────────────────────── */
    /*  FETCH PULL REQUESTS                             */
    /* ─────────────────────────────────────────────── */
    const fetchPRs = useCallback(async (filter = "all") => {
        if (!id) return;
        setPrsLoading(true);
        setPrsError("");
        try {
            const res = await axios.get(`${API_URL}/api/project/${id}/pull-requests`, {
                params: { status: filter },
            });
            const data = res.data;
            setPullRequests(data.pullRequests || []);
            setOpenCount(data.openCount ?? 0);
            setMergedCount(data.mergedCount ?? 0);
            setClosedCount(data.closedCount ?? 0);
        } catch (err) {
            setPrsError(err.response?.data?.error || "Failed to load pull requests.");
        } finally {
            setPrsLoading(false);
        }
    }, [id]);

    /* ─────────────────────────────────────────────── */
    /*  FETCH BRANCHES                                  */
    /* ─────────────────────────────────────────────── */
    const fetchBranches = useCallback(async () => {
        if (!id) return;
        try {
            const res = await axios.get(`${API_URL}/api/project/${id}/branches`);
            setBranches(res.data.branches || ["main"]);
            setDefaultBranch(res.data.default || "main");
        } catch (_) {
            setBranches(["main", "develop"]);
        }
    }, [id]);

    /* ─────────────────────────────────────────────── */
    /*  FETCH MEMBERS                                   */
    /* ─────────────────────────────────────────────── */
    const fetchMembers = useCallback(async () => {
        if (!id) return;
        setMembersLoading(true);
        setMembersError("");
        try {
            const res = await axios.get(`${API_URL}/api/project/${id}/members`);
            setMembers(res.data.members || []);
        } catch (err) {
            setMembersError(err.response?.data?.error || "Failed to load members.");
        } finally {
            setMembersLoading(false);
        }
    }, [id]);

    /* ─────────────────────────────────────────────── */
    /*  TAB CHANGE — lazy-load data                     */
    /* ─────────────────────────────────────────────── */
    useEffect(() => {
        if (activeTab === "commits") fetchCommits();
        else if (activeTab === "prs") { fetchPRs(prFilter); fetchBranches(); }
        else if (activeTab === "members") fetchMembers();
    }, [activeTab]);

    /* ─────────────────────────────────────────────── */
    /*  PR ACTIONS                                      */
    /* ─────────────────────────────────────────────── */
    const handleMergePR = (pr) => {
        setConfirmDialog({
            title: "Merge Pull Request",
            message: `Are you sure you want to merge PR #${pr.number}: "${pr.title}"? This action cannot be undone.`,
            confirmLabel: "Merge Pull Request",
            confirmClass: "bg-[#A371F7] hover:bg-[#9060e0] text-white",
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const res = await axios.patch(`${API_URL}/api/project/${id}/pull-requests/${pr._id}/merge`, {
                        mergedById: user?._id,
                    });
                    // Update local state
                    setPullRequests(prev => prev.map(p => p._id === pr._id ? res.data.pullRequest : p));
                    setOpenCount(c => Math.max(0, c - 1));
                    setMergedCount(c => c + 1);
                    toast.success(`PR #${pr.number} merged successfully!`);
                    setConfirmDialog(null);
                    // Refetch to get full updated list
                    fetchPRs(prFilter);
                } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to merge PR.");
                } finally {
                    setActionLoading(false);
                }
            },
        });
    };

    const handleClosePR = (pr) => {
        setConfirmDialog({
            title: "Close Pull Request",
            message: `Close PR #${pr.number}: "${pr.title}"? You can reopen it later.`,
            confirmLabel: "Close PR",
            confirmClass: "bg-[#F85149]/10 hover:bg-[#F85149]/20 border border-[#F85149]/40 text-[#F85149]",
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    const res = await axios.patch(`${API_URL}/api/project/${id}/pull-requests/${pr._id}/close`);
                    setPullRequests(prev => prev.map(p => p._id === pr._id ? res.data.pullRequest : p));
                    setOpenCount(c => Math.max(0, c - 1));
                    setClosedCount(c => c + 1);
                    toast.success(`PR #${pr.number} closed.`);
                    setConfirmDialog(null);
                    fetchPRs(prFilter);
                } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to close PR.");
                } finally {
                    setActionLoading(false);
                }
            },
        });
    };

    const handleReopenPR = async (pr) => {
        try {
            const res = await axios.patch(`${API_URL}/api/project/${id}/pull-requests/${pr._id}/reopen`);
            setPullRequests(prev => prev.map(p => p._id === pr._id ? res.data.pullRequest : p));
            setClosedCount(c => Math.max(0, c - 1));
            setOpenCount(c => c + 1);
            toast.success(`PR #${pr.number} reopened.`);
            fetchPRs(prFilter);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to reopen PR.");
        }
    };

    /* ─────────────────────────────────────────────── */
    /*  MEMBER ACTIONS                                  */
    /* ─────────────────────────────────────────────── */
    const handleRemoveMember = (member) => {
        setConfirmDialog({
            title: "Remove Team Member",
            message: `Remove ${member.fullName} from this project? They will lose access to all project resources.`,
            confirmLabel: "Remove Member",
            confirmClass: "bg-[#F85149]/10 hover:bg-[#F85149]/20 border border-[#F85149]/40 text-[#F85149]",
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await axios.delete(`${API_URL}/api/project/${id}/members/${member._id}`);
                    setMembers(prev => prev.filter(m => m._id !== member._id));
                    toast.success(`${member.fullName} removed from project.`);
                    setConfirmDialog(null);
                } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to remove member.");
                } finally {
                    setActionLoading(false);
                }
            },
        });
    };

    /* ─────────────────────────────────────────────── */
    /*  SETTINGS ACTIONS                                */
    /* ─────────────────────────────────────────────── */
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSettingsError("");
        if (!settings.projectName.trim()) {
            setSettingsError("Project name cannot be empty.");
            return;
        }
        setSettingsSaving(true);
        try {
            const res = await axios.put(`${API_URL}/api/project/${id}`, {
                projectName: settings.projectName.trim(),
                description: settings.description.trim(),
                visibility: settings.visibility,
                githubRepo: settings.githubRepo.trim(),
            });
            setProject(res.data);
            toast.success("Project settings saved!");
        } catch (err) {
            setSettingsError(err.response?.data?.error || "Failed to save settings.");
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleDeleteProject = () => {
        setConfirmDialog({
            title: "Delete Project",
            message: `This will permanently delete "${project?.projectName}" and all associated workspace data. This action cannot be undone. Type the project name to confirm.`,
            confirmLabel: "Delete Project",
            confirmClass: "bg-[#F85149] hover:bg-[#d93025] text-white",
            onConfirm: async () => {
                setDeleteProjectLoading(true);
                setActionLoading(true);
                try {
                    await axios.delete(`${API_URL}/api/project/${id}`);
                    toast.success("Project deleted.");
                    setConfirmDialog(null);
                    navigate("/project");
                } catch (err) {
                    toast.error(err.response?.data?.error || "Failed to delete project.");
                    setDeleteProjectLoading(false);
                    setActionLoading(false);
                }
            },
        });
    };

    /* ─────────────────────────────────────────────── */
    /*  DERIVED VALUES                                  */
    /* ─────────────────────────────────────────────── */
    const projectName = project?.projectName || "Project";
    const grouped = groupByDate(commits);
    const isOwner = user && project?.members?.[0] && (
        (typeof project.members[0] === "string" && project.members[0] === user._id) ||
        (project.members[0]?._id && project.members[0]._id === user._id)
    );

    /* ─────────────────────────────────────────────── */
    /*  CODE VIEW → RENDER WORKSPACE                    */
    /* ─────────────────────────────────────────────── */
    if (activeTab === "code") {
        return (
            <DevCollabWorkspace
                projectId={id}
                project={project}
                commitsCount={commits.length}
                pullCount={openCount}
                memberCount={members.length || project?.members?.length || 0}
                user={user}
                onTabChange={(tab) => setActiveTab(tab)}
            />
        );
    }

    /* ─────────────────────────────────────────────── */
    /*  FULL PAGE LAYOUT (non-code tabs)                */
    /* ─────────────────────────────────────────────── */
    return (
        <div className="flex h-screen bg-[#0D1117] text-[#E6EDF3] overflow-hidden font-sans select-none">
            <DashboardLeftSide />

            <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#0D1117]">
                <TopHeader
                    projectName={projectName}
                    branch={defaultBranch}
                    commitsCount={commits.length}
                    pullCount={openCount}
                    memberCount={members.length || project?.members?.length || 0}
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(tab)}
                    user={user}
                    onPullLatest={() => toast.success("Repository is up to date.")}
                    onPush={() => toast("Use the Code View to commit and push changes.", { icon: "ℹ️" })}
                />

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-hidden relative">

                    {/* ════════ COMMITS TAB ════════ */}
                    {activeTab === "commits" && (
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E293B] scrollbar-track-transparent">
                            <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 space-y-5">
                                {/* Header */}
                                <SectionHeader
                                    title="Commit History"
                                    subtitle={`${project?.githubRepo ? `Repository: ${project.githubRepo}` : "No GitHub repository linked"}`}
                                    action={
                                        <button
                                            onClick={fetchCommits}
                                            disabled={commitsLoading}
                                            className="flex items-center gap-1.5 text-[11px] text-[#8B949E] hover:text-[#E6EDF3] border border-[#1E293B] hover:border-[#3794FF]/40 rounded px-2.5 py-1 transition-all"
                                        >
                                            <RefreshCw size={11} className={commitsLoading ? "animate-spin" : ""} />
                                            Refresh
                                        </button>
                                    }
                                />

                                {/* Stats bar */}
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#0B111B] border border-[#1E293B] rounded px-3 py-2 text-center min-w-[72px]">
                                        <span className="block text-base font-bold text-[#E6EDF3] font-mono">{commits.length}</span>
                                        <span className="text-[10px] text-[#8B949E] uppercase tracking-wider">Commits</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <span className="w-2 h-2 rounded-full bg-[#3FB950]" />
                                        <span className="text-[#8B949E]">Branch:</span>
                                        <code className="text-[#3FB950] font-mono font-semibold">{defaultBranch}</code>
                                    </div>
                                    {project?.githubData?.html_url && (
                                        <a
                                            href={project.githubData.html_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-[11px] text-[#8B949E] hover:text-[#3794FF] transition-colors"
                                        >
                                            <ExternalLink size={11} />
                                            <span>Open on GitHub</span>
                                        </a>
                                    )}
                                </div>

                                {/* Content states */}
                                {commitsLoading && <LoadingSpinner label="Fetching commits from repository..." />}

                                {!commitsLoading && commitsError && (
                                    <ErrorBanner message={commitsError} onRetry={fetchCommits} />
                                )}

                                {!commitsLoading && !commitsError && commitsHasRepo === false && (
                                    <EmptyState
                                        icon={Link2}
                                        title="No GitHub Repository Linked"
                                        message="This project doesn't have a GitHub repository connected. Link a repository in Settings to see commit history."
                                        action={
                                            <button
                                                onClick={() => setActiveTab("settings")}
                                                className="flex items-center gap-1.5 bg-[#3794FF] hover:bg-[#2b6fc4] text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
                                            >
                                                <Settings size={12} />
                                                Go to Settings
                                            </button>
                                        }
                                    />
                                )}

                                {!commitsLoading && !commitsError && commitsHasRepo === true && commitsEmpty && (
                                    <EmptyState
                                        icon={GitCommit}
                                        title="No commits yet"
                                        message="This repository doesn't have any commits. Make your first commit by editing files in the Code View, then committing and pushing changes via Source Control."
                                        action={
                                            <button
                                                onClick={() => setActiveTab("code")}
                                                className="flex items-center gap-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-white text-xs px-3 py-1.5 rounded font-medium transition-colors"
                                            >
                                                <GitCommit size={12} />
                                                Open Code View
                                            </button>
                                        }
                                    />
                                )}

                                {!commitsLoading && !commitsError && commits.length > 0 && (
                                    <div className="space-y-6">
                                        {Object.entries(grouped).map(([label, list]) => (
                                            <DateGroup key={label} label={label} commits={list} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════ PULL REQUESTS TAB ════════ */}
                    {activeTab === "prs" && (
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E293B] scrollbar-track-transparent">
                            <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 space-y-4">
                                <SectionHeader
                                    title="Pull Requests"
                                    subtitle="Review, merge, and manage code integration requests"
                                    action={
                                        <button
                                            onClick={() => setShowCreatePR(true)}
                                            className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                                        >
                                            <Plus size={12} />
                                            New Pull Request
                                        </button>
                                    }
                                />

                                {/* Filter tabs */}
                                <div className="flex items-center gap-1 border-b border-[#1E293B] pb-0">
                                    {[
                                        { key: "open", label: "Open", count: openCount, icon: Circle, color: "#3FB950" },
                                        { key: "closed", label: "Closed", count: closedCount, icon: XCircle, color: "#F85149" },
                                        { key: "merged", label: "Merged", count: mergedCount, icon: GitMerge, color: "#A371F7" },
                                        { key: "all", label: "All", count: openCount + closedCount + mergedCount, icon: GitPullRequest, color: "#8B949E" },
                                    ].map(f => {
                                        const Icon = f.icon;
                                        const active = prFilter === f.key;
                                        return (
                                            <button
                                                key={f.key}
                                                onClick={() => {
                                                    setPrFilter(f.key);
                                                    fetchPRs(f.key);
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 -mb-[1px] transition-all whitespace-nowrap ${active
                                                    ? "border-[#3794FF] text-[#E6EDF3]"
                                                    : "border-transparent text-[#8B949E] hover:text-[#E6EDF3]"
                                                    }`}
                                            >
                                                <Icon size={11} style={{ color: active ? f.color : undefined }} />
                                                {f.label}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${active ? "bg-[#1E293B] text-[#E6EDF3]" : "bg-[#0D1522] text-[#6E7681]"}`}>
                                                    {f.count}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    <div className="ml-auto">
                                        <button onClick={() => fetchPRs(prFilter)} className="flex items-center gap-1 text-[10px] text-[#6E7681] hover:text-[#E6EDF3] transition-colors px-2 py-1">
                                            <RefreshCw size={10} className={prsLoading ? "animate-spin" : ""} />
                                        </button>
                                    </div>
                                </div>

                                {/* PR list */}
                                {prsLoading && <LoadingSpinner label="Loading pull requests..." />}

                                {!prsLoading && prsError && <ErrorBanner message={prsError} onRetry={() => fetchPRs(prFilter)} />}

                                {!prsLoading && !prsError && pullRequests.length === 0 && (
                                    <EmptyState
                                        icon={GitPullRequest}
                                        title={prFilter === "open" ? "No open pull requests" : prFilter === "merged" ? "No merged pull requests" : prFilter === "closed" ? "No closed pull requests" : "No pull requests yet"}
                                        message={
                                            prFilter === "open"
                                                ? "All pull requests have been merged or closed. Open a new one to propose changes."
                                                : "No pull requests match this filter. Open a new pull request to start reviewing code."
                                        }
                                        action={
                                            <button
                                                onClick={() => setShowCreatePR(true)}
                                                className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                                            >
                                                <Plus size={12} />
                                                New Pull Request
                                            </button>
                                        }
                                    />
                                )}

                                {!prsLoading && pullRequests.length > 0 && (
                                    <div className="space-y-2">
                                        {pullRequests.map(pr => (
                                            <PRCard
                                                key={pr._id}
                                                pr={pr}
                                                onMerge={handleMergePR}
                                                onClose={handleClosePR}
                                                onReopen={handleReopenPR}
                                                currentUserId={user?._id}
                                                isOwner={isOwner}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════ MEMBERS TAB ════════ */}
                    {activeTab === "members" && (
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E293B] scrollbar-track-transparent">
                            <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 space-y-4">
                                <SectionHeader
                                    title="Team Members"
                                    subtitle={`${members.length} collaborator${members.length !== 1 ? "s" : ""} with access to this project`}
                                    action={
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={fetchMembers}
                                                disabled={membersLoading}
                                                className="flex items-center gap-1.5 text-[11px] text-[#8B949E] hover:text-[#E6EDF3] border border-[#1E293B] hover:border-[#3794FF]/40 rounded px-2.5 py-1 transition-all"
                                            >
                                                <RefreshCw size={11} className={membersLoading ? "animate-spin" : ""} />
                                            </button>
                                            <button
                                                onClick={() => toast("Invite functionality coming soon — use the team settings.", { icon: "👥" })}
                                                className="flex items-center gap-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors"
                                            >
                                                <Plus size={12} />
                                                Invite Member
                                            </button>
                                        </div>
                                    }
                                />

                                {membersLoading && <LoadingSpinner label="Loading team members..." />}

                                {!membersLoading && membersError && (
                                    <ErrorBanner message={membersError} onRetry={fetchMembers} />
                                )}

                                {!membersLoading && !membersError && members.length === 0 && (
                                    <EmptyState
                                        icon={Users}
                                        title="No team members found"
                                        message="This project doesn't have any members yet, or they couldn't be loaded. Invite collaborators to get started."
                                    />
                                )}

                                {!membersLoading && members.length > 0 && (
                                    <div className="space-y-2">
                                        {members.map((member, idx) => {
                                            const isSelf = user && member._id?.toString() === user._id?.toString();
                                            const isProjectOwner = member.role === "Owner";

                                            return (
                                                <div
                                                    key={member._id || idx}
                                                    className="bg-[#0B111B] border border-[#1E293B] hover:border-[#3794FF]/20 rounded p-3 flex items-center justify-between gap-3 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {/* Avatar */}
                                                        <div className="relative shrink-0">
                                                            <Avatar name={member.fullName} src={member.avatar} size={38} />
                                                            {isSelf && (
                                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#3FB950] ring-2 ring-[#0B111B]" title="Online" />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-xs font-semibold text-[#E6EDF3] truncate">{member.fullName}</p>
                                                                {isSelf && <span className="text-[10px] text-[#6E7681] italic">(you)</span>}
                                                            </div>
                                                            <p className="text-[11px] text-[#8B949E] truncate font-mono">{member.email}</p>
                                                            {member.joinedAt && (
                                                                <p className="text-[10px] text-[#6E7681] mt-0.5">
                                                                    Joined {timeAgo(member.joinedAt)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right side: role + actions */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {/* Provider badge */}
                                                        {member.provider && member.provider !== "local" && (
                                                            <span className="text-[10px] text-[#6E7681] bg-[#0D1522] border border-[#1E293B] px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                                                                {member.provider}
                                                            </span>
                                                        )}

                                                        {/* Role badge */}
                                                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded border font-mono ${isProjectOwner
                                                            ? "bg-[#3794FF]/10 text-[#3794FF] border-[#3794FF]/30"
                                                            : "bg-[#151E2D] text-[#8B949E] border-[#1E293B]"
                                                            }`}>
                                                            {member.role || "Member"}
                                                        </span>

                                                        {/* Remove action — only for project owner, not on self, not on owner */}
                                                        {isOwner && !isSelf && !isProjectOwner && (
                                                            <button
                                                                onClick={() => handleRemoveMember(member)}
                                                                title={`Remove ${member.fullName}`}
                                                                className="w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-[#F85149]/40 hover:bg-[#F85149]/10 text-[#6E7681] hover:text-[#F85149] transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <UserMinus size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════ SETTINGS TAB ════════ */}
                    {activeTab === "settings" && (
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E293B] scrollbar-track-transparent">
                            <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 space-y-5">
                                <SectionHeader
                                    title="Project Settings"
                                    subtitle="Manage general settings, repository configuration, and access controls"
                                />

                                {/* ── General Settings ── */}
                                <form onSubmit={handleSaveSettings}>
                                    <section className="bg-[#0B111B] border border-[#1E293B] rounded overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
                                            <Info size={13} className="text-[#3794FF]" />
                                            <span className="text-[11px] font-bold text-[#E6EDF3] uppercase tracking-wider">General</span>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            {settingsError && <ErrorBanner message={settingsError} />}

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">Project Name</label>
                                                <input
                                                    type="text"
                                                    value={settings.projectName}
                                                    onChange={e => setSettings(s => ({ ...s, projectName: e.target.value }))}
                                                    className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-sm text-[#E6EDF3] outline-none transition-colors font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">Description</label>
                                                <textarea
                                                    value={settings.description}
                                                    onChange={e => setSettings(s => ({ ...s, description: e.target.value }))}
                                                    rows={3}
                                                    placeholder="Brief description of what this project does..."
                                                    className="w-full bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#3E4D61] outline-none transition-colors resize-none font-mono"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">Visibility</label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { value: "private", icon: Lock, label: "Private", desc: "Only invited members can access" },
                                                        { value: "public", icon: Globe, label: "Public", desc: "Visible to everyone" },
                                                    ].map(opt => {
                                                        const Icon = opt.icon;
                                                        const active = settings.visibility === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => setSettings(s => ({ ...s, visibility: opt.value }))}
                                                                className={`flex-1 flex items-center gap-2.5 p-3 rounded border transition-all text-left ${active
                                                                    ? "border-[#3794FF]/50 bg-[#18233A] text-[#E6EDF3]"
                                                                    : "border-[#1E293B] bg-[#0D1522] text-[#8B949E] hover:border-[#3794FF]/20"
                                                                    }`}
                                                            >
                                                                <Icon size={14} className={active ? "text-[#3794FF]" : "text-[#6E7681]"} />
                                                                <div>
                                                                    <p className="text-xs font-semibold">{opt.label}</p>
                                                                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* ── Repository Settings ── */}
                                    <section className="bg-[#0B111B] border border-[#1E293B] rounded overflow-hidden mt-4">
                                        <div className="px-4 py-3 border-b border-[#1E293B] flex items-center gap-2">
                                            <GitBranch size={13} className="text-[#3FB950]" />
                                            <span className="text-[11px] font-bold text-[#E6EDF3] uppercase tracking-wider">Repository</span>
                                        </div>
                                        <div className="p-4">
                                            <label className="block text-[11px] font-semibold text-[#8B949E] mb-1.5 uppercase tracking-wider">GitHub Repository URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={settings.githubRepo}
                                                    onChange={e => setSettings(s => ({ ...s, githubRepo: e.target.value }))}
                                                    placeholder="username/repository-name or full GitHub URL"
                                                    className="flex-1 bg-[#0D1522] border border-[#1E293B] focus:border-[#3794FF]/60 rounded px-3 py-2 text-sm text-[#E6EDF3] placeholder-[#3E4D61] outline-none transition-colors font-mono"
                                                />
                                            </div>
                                            {project?.githubData?.html_url && (
                                                <a href={project.githubData.html_url} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#3794FF] hover:underline">
                                                    <ExternalLink size={10} />
                                                    Open on GitHub
                                                </a>
                                            )}
                                            {project?.githubData && (
                                                <div className="flex items-center gap-4 mt-3 text-[11px] text-[#8B949E]">
                                                    {project.githubData.stars !== undefined && (
                                                        <span>⭐ {project.githubData.stars} stars</span>
                                                    )}
                                                    {project.githubData.forks !== undefined && (
                                                        <span>🍴 {project.githubData.forks} forks</span>
                                                    )}
                                                    {project.githubData.languages?.length > 0 && (
                                                        <span>Languages: {project.githubData.languages.slice(0, 3).join(", ")}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Save button */}
                                    <div className="flex justify-end mt-4">
                                        <button
                                            type="submit"
                                            disabled={settingsSaving}
                                            className="flex items-center gap-2 bg-[#007ACC] hover:bg-[#0062A3] disabled:opacity-60 text-white text-xs px-4 py-2 rounded font-semibold transition-colors"
                                        >
                                            {settingsSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                            {settingsSaving ? "Saving…" : "Save Changes"}
                                        </button>
                                    </div>
                                </form>

                                {/* ── Danger Zone ── */}
                                <section className="bg-[#0B111B] border border-[#F85149]/25 rounded overflow-hidden">
                                    <div className="px-4 py-3 border-b border-[#F85149]/20 flex items-center gap-2">
                                        <AlertCircle size={13} className="text-[#F85149]" />
                                        <span className="text-[11px] font-bold text-[#F85149] uppercase tracking-wider">Danger Zone</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-[#E6EDF3] mb-1">Delete this project</p>
                                                <p className="text-[11px] text-[#8B949E] leading-relaxed">
                                                    Permanently removes the project, workspace, and all associated data. This cannot be undone.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleDeleteProject}
                                                disabled={deleteProjectLoading}
                                                className="shrink-0 flex items-center gap-1.5 bg-[#F85149]/10 hover:bg-[#F85149]/20 border border-[#F85149]/30 text-[#F85149] text-xs px-3 py-1.5 rounded font-semibold transition-all"
                                            >
                                                {deleteProjectLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                Delete Project
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create PR Modal ── */}
            {showCreatePR && (
                <CreatePRModal
                    projectId={id}
                    branches={branches}
                    defaultBranch={defaultBranch}
                    currentUser={user}
                    onClose={() => setShowCreatePR(false)}
                    onCreated={(pr) => {
                        setPullRequests(prev => [pr, ...prev]);
                        setOpenCount(c => c + 1);
                    }}
                />
            )}

            {/* ── Confirm Dialog ── */}
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmLabel={confirmDialog.confirmLabel}
                    confirmClass={confirmDialog.confirmClass}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}