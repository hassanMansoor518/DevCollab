import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Folder, Cpu, Users, Menu } from "lucide-react";
import Notification from "./../../../component/Notification.jsx";
import { useNavigate } from "react-router-dom";
import useProjectStore from "../../../zustand/useProjectStore";
import ThemeToggle from "../../../component/ThemeToggle.jsx";

export default function AiAssistantHeader({ user }) {
    const [mode, setMode] = useState("ai");
    const [open, setOpen] = useState(false);

    const dropdownRef = useRef();
    const navigate = useNavigate();

    const { projects, selectedProject, setSelectedProject, fetchProjects } = useProjectStore();

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">

            {/* ══════════ LEFT SIDE ══════════ */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">

                {/* ── HAMBURGER (mobile only) — opens the sidebar drawer ── */}
                <button
                    className="md:hidden shrink-0 p-2 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition border border-border-default bg-surface shadow-sm"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                    aria-label="Open sidebar"
                >
                    <Menu size={20} />
                </button>

                {/* ── MODE SWITCH (desktop only) ── */}
                <div className="hidden sm:flex items-center gap-2 bg-surface backdrop-blur-md border border-border-default rounded-full p-1 shadow-sm">

                    {/* Team Mode */}
                    <button
                        onClick={() => { setMode("team"); navigate("/chat"); }}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all
                            ${mode === "team"
                                ? "bg-active-bg text-text-primary"
                                : "text-text-secondary hover:text-text-primary hover:bg-hover-bg"
                            }`}
                    >
                        <Users size={14} />
                        Team
                    </button>

                    {/* AI Mode */}
                    <button
                        onClick={() => { setMode("ai"); navigate("/AIAssistant"); }}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all
                            ${mode === "ai"
                                ? "bg-gradient-to-r from-primary to-info text-white shadow-md shadow-primary/20"
                                : "text-text-secondary hover:text-text-primary hover:bg-hover-bg"
                            }`}
                    >
                        <Cpu size={14} />
                        AI
                    </button>
                </div>

                {/* ── PROJECT DROPDOWN ── */}
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl
                            bg-surface backdrop-blur-md border border-border-default
                            text-xs sm:text-sm text-text-primary hover:bg-hover-bg transition-all max-w-[120px] sm:max-w-none"
                    >
                        <Folder size={13} className="text-primary shrink-0" />
                        <span className="truncate max-w-[70px] sm:max-w-[140px]">
                            {selectedProject ? selectedProject.projectName : "Project"}
                        </span>
                        <ChevronDown
                            size={12}
                            className={`transition-transform text-text-muted shrink-0 ${open ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* DROPDOWN MENU */}
                    {open && (
                        <div className="absolute mt-2 w-[220px] max-h-[300px] bg-card border border-border-subtle rounded-xl shadow-popover overflow-y-auto z-50">
                            {projects.length === 0 && (
                                <div className="px-4 py-3 text-xs text-text-muted">No projects found</div>
                            )}
                            {projects.map((project) => (
                                <div
                                    key={project._id}
                                    onClick={() => { setSelectedProject(project); setOpen(false); }}
                                    className={`px-4 py-3 text-sm cursor-pointer flex items-center gap-2 hover:bg-hover-bg transition
                                        ${selectedProject?._id === project._id
                                            ? "bg-primary-soft text-primary font-semibold"
                                            : "text-text-secondary"
                                        }`}
                                >
                                    <Folder size={14} className={selectedProject?._id === project._id ? "text-primary" : "text-text-muted"} />
                                    {project.projectName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════ RIGHT SIDE ══════════ */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <ThemeToggle />

                {/* GitHub badge — lg+ only, hidden on mobile/tablet */}
                <div className="badge badge-success px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs hidden lg:flex whitespace-nowrap">
                    <span className="mr-1">●</span>CONNECTED
                </div>

                <Notification currentUserId={user?._id} />

                {/* User avatar — hidden on mobile */}
                <div className="hidden sm:flex items-center gap-3 pl-3 sm:pl-4 border-l border-border-subtle">
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-semibold text-text-primary whitespace-nowrap">{user?.fullName}</p>
                        <p className="text-xs text-text-muted">Lead Developer</p>
                    </div>
                    <div className="w-9 h-9 bg-primary-soft text-primary rounded-lg flex items-center justify-center font-bold shrink-0">
                        {user?.fullName?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}