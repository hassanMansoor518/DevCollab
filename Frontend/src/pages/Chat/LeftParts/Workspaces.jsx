import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Hash, Folder } from "lucide-react";
import useConversation from "../../../zustand/useConversation.js";

function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const user = authUser?.user;
    const token = authUser?.token; 

    const { selectedWorkspace, setSelectedWorkspace, setSelectedConversation } = useConversation();

    const fetchWorkspaces = async () => {
        try {
            const res = await axios.get(
                "http://localhost:3001/api/workspace/all-workspace",
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`, 
                    },
                }
            );
            setWorkspaces(res.data);
        } catch (err) {
            console.error("Failed to fetch workspaces:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchWorkspaces();
    }, [user?._id]);

    const handleSelectWorkspace = (ws) => {
        setSelectedWorkspace(ws);
        setSelectedConversation(null);
    };

    return (
        <div className="mt-5">
            <h2 className="px-6 mb-2.5 text-[11px] font-bold tracking-wider uppercase text-text-muted">
                Workspaces
            </h2>
            <div className="flex flex-col gap-1 px-2 overflow-y-auto max-h-[30vh] scrollbar-thin">
                {loading && (
                    <p className="text-text-muted text-xs px-4 py-2 animate-pulse">Loading workspaces...</p>
                )}
                {!loading && workspaces.length === 0 && (
                    <p className="text-text-muted text-xs px-4 py-2">No workspaces found</p>
                )}
                {!loading && workspaces.map((ws, idx) => {
                    const isSelected = selectedWorkspace?._id === ws._id;
                    const workspaceInitial = ws.name ? ws.name.charAt(0).toUpperCase() : "#";

                    return (
                        <motion.div
                            key={ws._id || idx}
                            onClick={() => handleSelectWorkspace(ws)}
                            whileHover={{ x: 4 }}
                            className={`
                                flex items-center gap-3 px-3.5 py-2.5 mx-2 rounded-xl
                                cursor-pointer transition-all duration-300 relative
                                text-sm font-medium
                                ${isSelected 
                                    ? "bg-primary text-white shadow-md shadow-primary/10" 
                                    : "hover:bg-hover-bg text-text-secondary hover:text-text-primary"
                                }
                            `}
                        >
                            {/* Active highlight */}
                            {isSelected && (
                                <span className="absolute left-0 top-1/4 h-1/2 w-1 bg-white rounded-r-md" />
                            )}

                            {/* Workspace Squircle Icon */}
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors
                                ${isSelected 
                                    ? "bg-white/20 text-white" 
                                    : "bg-primary-soft text-primary"
                                }
                            `}>
                                {workspaceInitial}
                            </div>

                            <span className="truncate flex-1">{ws.name}</span>

                            <Hash size={14} className={isSelected ? "text-white/60" : "text-text-muted/65"} />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default Workspaces;