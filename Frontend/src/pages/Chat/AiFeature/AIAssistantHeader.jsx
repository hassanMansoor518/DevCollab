import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Folder, Cpu, Users } from "lucide-react";
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
            <div className="flex items-center justify-between mb-8">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-6 w-1/2">

                    {/* MODE SWITCH + DROPDOWN */}
                    <div className="relative flex items-center gap-4 h-12">

                        {/* MODE SWITCH */}
                        <div className="flex items-center gap-2 bg-surface backdrop-blur-md border border-border-default rounded-full p-1 shadow-sm">

                            {/* Team Mode */}
                            <button
                                onClick={() => {
                                    setMode("team");
                                    navigate("/chat");
                                }}
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
                                onClick={() => {
                                    setMode("ai");
                                    navigate("/AIAssistant");
                                }}
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

                        {/* PROJECT DROPDOWN */}
                        <div ref={dropdownRef} className="relative ml-3">
                            <button
                                onClick={() => setOpen(!open)}
                                className="
                                    flex items-center gap-2 px-4 py-2 rounded-xl
                                    bg-surface backdrop-blur-md
                                    border border-border-default
                                    text-sm text-text-primary
                                    hover:bg-hover-bg transition-all
                                "
                            >
                                <Folder size={16} className="text-primary" />
                                {selectedProject ? selectedProject.projectName : "Select Project"}
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform text-text-muted ${open ? "rotate-180" : ""}`}
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
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setOpen(false);
                                            }}
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
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-6">
                    <ThemeToggle />
                    
                    <div className="badge badge-success px-3 py-1.5 rounded-full">
                        <span className="mr-1">●</span> GITHUB CONNECTED
                    </div>

                    <Notification currentUserId={user?._id} />

                    <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-text-primary">{user?.fullName}</p>
                            <p className="text-xs text-text-muted">Lead Developer</p>
                        </div>
                        <div className="w-9 h-9 bg-primary-soft text-primary rounded-lg flex items-center justify-center font-bold">
                            {user?.fullName?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}