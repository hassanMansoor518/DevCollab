import React, { useState, useRef, useEffect } from "react";
import { Folder, Cpu, Users, Menu, Search, ChevronDown } from "lucide-react";
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
            {/* TOP BAR */}
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 mb-4 w-full">

                <div className="flex flex-1 sm:flex-none sm:w-1/2 items-center gap-2 sm:gap-3 min-w-0">
                    {/* MOBILE TOGGLE BUTTON */}
                    <button
                        className="md:hidden p-2 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition shrink-0 border border-border-default bg-surface shadow-sm sm:shadow-none"
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                    >
                        <Menu size={20} />
                    </button>

                    {/* PROJECT DROPDOWN */}
                    <div ref={dropdownRef} className="relative shrink-0">
                        <button
                            onClick={() => setOpen(!open)}
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl
                bg-surface backdrop-blur-md border border-border-default
                text-sm text-text-primary hover:bg-hover-bg transition-all w-[120px] sm:w-[160px]"
                        >
                            <Folder size={14} className="text-primary shrink-0" />
                            <span className="truncate flex-1 text-left">
                                {selectedProject ? selectedProject.projectName : "Select Project"}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform text-text-muted shrink-0 ${open ? "rotate-180" : ""}`}
                            />
                        </button>

                        {/* DROPDOWN MENU */}
                        {open && (
                            <div className="absolute top-full mt-2 left-0 w-[220px] max-h-[300px] bg-card border border-border-subtle rounded-xl shadow-popover overflow-y-auto z-50">
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

                    {/* MODE SWITCH (desktop only) */}
                    <div className="hidden sm:flex items-center gap-1 bg-surface border border-border-default rounded-xl p-1 shadow-sm shrink-0">
                        {/* Team Mode */}
                        <button
                            onClick={() => { setMode("team"); navigate("/chat"); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                ${mode === "team"
                                    ? "bg-hover-bg text-text-primary font-medium"
                                    : "text-text-secondary hover:text-text-primary hover:bg-hover-bg/50"
                                }`}
                        >
                            <Users size={14} />
                            Team
                        </button>

                        {/* AI Mode */}
                        <button
                            onClick={() => { setMode("ai"); navigate("/AIAssistant"); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                ${mode === "ai"
                                    ? "bg-primary-soft text-primary font-medium"
                                    : "text-text-secondary hover:text-text-primary hover:bg-hover-bg/50"
                                }`}
                        >
                            <Cpu size={14} />
                            AI
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center justify-end gap-3 sm:gap-6 shrink-0">
                    <ThemeToggle />

                    {/* STATUS BADGE */}
                    <div className="hidden lg:flex items-center">
                        <div className="badge badge-success px-3 py-1.5 rounded-full whitespace-nowrap">
                            <span className="mr-1">●</span> GITHUB CONNECTED
                        </div>
                    </div>

                    {/* NOTIFICATION */}
                    <Notification currentUserId={user?._id} />

                    {/* USER INFO */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-border-subtle shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-text-primary whitespace-nowrap">
                                {user?.fullName}
                            </p>
                            <p className="text-xs text-text-muted whitespace-nowrap">
                                {user?.email || "Member"}
                            </p>
                        </div>

                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold bg-primary-soft text-primary shrink-0 shadow-sm sm:shadow-none sm:border-0 border border-primary/10 overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.fullName?.[0]?.toUpperCase()
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}