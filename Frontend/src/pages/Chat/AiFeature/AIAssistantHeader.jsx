import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Folder, Cpu, Users } from "lucide-react";
import Notification from "./../../../component/Notification.jsx";
import { useNavigate } from "react-router-dom";
import useProjectStore from "../../../zustand/useProjectStore";

export default function AiAssistantHeader({ user }) {
    const [mode, setMode] = useState("ai");
    const [open, setOpen] = useState(false);

    const dropdownRef = useRef();
    const navigate = useNavigate();

    const { projects, selectedProject, setSelectedProject, fetchProjects, loading } = useProjectStore();

    useEffect(() => {
        console.log("AIAssistantHeader mounted, fetching projects...");
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        console.log("Projects updated in store:", projects);
    }, [projects]);

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
            <div className="flex items-center justify-between">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-6 w-1/2">

                    {/* MODE SWITCH + DROPDOWN */}
                    <div className="relative flex items-center gap-4 h-12">

                        {/* MODE SWITCH */}
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-md">

                            {/* Team Mode */}
                            <button
                                onClick={
                                    () => {
                                        setMode("team");
                                        navigate("/chat");
                                    }
                                }
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all
                  ${mode === "team"
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/10"
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
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                                        : "text-gray-400 hover:text-white hover:bg-white/10"
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
                  bg-white/5 backdrop-blur-md
                  border border-white/10
                  text-sm text-white
                  hover:bg-white/10 transition-all
                "
                            >
                                <Folder size={16} className="text-blue-400" />
                                {selectedProject ? selectedProject.projectName : "Select Project"}
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${open ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {/* DROPDOWN MENU */}
                            {open && (
                                <div className="absolute mt-2 w-[200px] max-h-[300px] bg-[#0f172a] border border-white/10 rounded-xl shadow-xl overflow-y-auto z-50">
                                    {projects.length === 0 && (
                                        <div className="px-4 py-2 text-xs text-gray-500">No projects found</div>
                                    )}
                                    {projects.map((project) => (
                                        <div
                                            key={project._id}
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setOpen(false);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-white/10 transition
                        ${selectedProject?._id === project._id
                                                    ? "bg-blue-600/20 text-blue-400"
                                                    : "text-gray-300"
                                                }`}
                                        >
                                            <Folder size={14} />
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
                    <div className="bg-green-900/40 text-green-400 text-xs px-3 py-1 rounded-full border border-green-700">
                        ● GITHUB CONNECTED
                    </div>

                    <Notification currentUserId={user?._id} />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-gray-400">Lead Developer</p>
            </div>
            <div className="w-8 h-8 bg-[#1E293B] rounded-lg flex items-center justify-center font-bold">
              {user?.fullName?.[0]}
            </div>
          </div>
                </div>
            </div>
        </>
    );
}