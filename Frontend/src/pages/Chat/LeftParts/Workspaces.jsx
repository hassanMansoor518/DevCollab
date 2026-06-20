import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import useConversation from "../../../zustand/useConversation.js";

function Workspaces({ searchQuery = "" }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [creating, setCreating] = useState(false);
    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const user = authUser?.user;
    const token = authUser?.token; 

    const { selectedWorkspace, setSelectedWorkspace, setSelectedConversation } = useConversation();

    const fetchWorkspaces = async () => {
        try {
            // Standardized to Vite relative proxy to prevent cross-origin issues
            const res = await axios.get(
                "/api/workspace/all-workspace",
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

    // Filter workspaces based on search query
    const filteredWorkspaces = workspaces.filter((ws) => {
        const name = ws?.name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="mt-5">
            <div className="flex items-center justify-between px-3 mb-2.5">
                <h2 className="text-[11px] font-bold tracking-wider uppercase text-text-muted">Workspaces</h2>
                <button onClick={() => setShowCreateModal(true)} className="text-xs text-primary font-semibold">+ New</button>
            </div>

            {showCreateModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/30 backdrop-blur-[8px] transition-all duration-300">
                    <div className="absolute inset-0" onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); }} />
                    <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold mb-2 text-text-primary">Create Workspace</h3>
                        <p className="text-sm text-text-muted mb-4">Create a workspace for team discussions — add a name and optionally invite members.</p>

                        <label className="text-xs text-text-muted font-semibold">Workspace name</label>
                        <input autoFocus value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} onKeyDown={(e) => {
                            if (e.key === 'Escape') { setShowCreateModal(false); setNewWorkspaceName(''); }
                        }} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border border-border-subtle bg-input-bg text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. Frontend Team" />

                        <div className="flex items-center justify-end gap-2 mt-2">
                            <button onClick={() => { setShowCreateModal(false); setNewWorkspaceName(''); }} className="px-4 py-2 rounded-xl bg-hover-bg text-text-primary text-sm font-semibold hover:bg-border-subtle transition-colors">Cancel</button>
                            <button onClick={async () => {
                                if (!newWorkspaceName.trim()) return alert('Please enter a name');
                                setCreating(true);
                                try {
                                    await axios.post('/api/workspace', { name: newWorkspaceName.trim() }, { withCredentials: true });
                                    fetchWorkspaces();
                                    setShowCreateModal(false);
                                    setNewWorkspaceName('');
                                } catch (err) {
                                    console.error('Create workspace failed', err);
                                    alert('Failed to create workspace');
                                } finally {
                                    setCreating(false);
                                }
                            }} disabled={creating || !newWorkspaceName.trim()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            <div className="flex flex-col gap-1 px-2 overflow-y-auto max-h-[30vh] scrollbar-thin">
                {loading && (
                    <p className="text-text-muted text-xs px-4 py-2 animate-pulse">Loading workspaces...</p>
                )}
                {!loading && filteredWorkspaces.length === 0 && (
                    <p className="text-text-muted text-xs px-4 py-2">
                        {searchQuery ? "No matching workspaces found" : "No workspaces found"}
                    </p>
                )}
                {!loading && filteredWorkspaces.map((ws, idx) => {
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