import React, { useState } from "react";
import { Phone, Video, Search, Settings, Users, Hash, X, Plus } from "lucide-react";

function WorkspaceHeader({ workspace }) {
    const [showMembers, setShowMembers] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");

    if (!workspace) return null;

    // Filter members if there's search text
    const filteredMembers = workspace.members?.filter(member => {
        const name = member?.fullName || member?.email || "";
        return name.toLowerCase().includes(memberSearch.toLowerCase());
    }) || [];

    return (
        <>
            {/* Header Bar */}
            <div
                className="relative flex items-center justify-between h-[70px] px-6 bg-surface border-b border-border-subtle shadow-sm select-none z-10"
            >
                {/* Channel Details (Left) */}
                <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                    onClick={() => setShowMembers(true)}
                >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-soft text-primary font-bold text-lg shadow-sm">
                        <Hash size={18} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-text-primary tracking-wide leading-tight">
                            {workspace.name}
                        </h1>
                        <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                            <Users size={10} />
                            {workspace.members?.length} members · Click to view
                        </span>
                    </div>
                </div>

                {/* SaaS Top Bar Actions (Right) */}
                <div className="flex items-center gap-1.5">
                    <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Start voice call">
                        <Phone size={16} />
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Start video call">
                        <Video size={16} />
                    </button>
                    <div className="h-4 w-[1px] bg-border-subtle mx-1" />
                    <button 
                        onClick={() => setShowMembers(true)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" 
                        title="View members"
                    >
                        <Users size={16} />
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Workspace settings">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Members Modal */}
            {showMembers && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowMembers(false)} // close on outside click
                >
                    <div
                        className="bg-card border border-border-subtle rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transform scale-100 transition-all"
                        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                            <div>
                                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                                    <Hash size={16} className="text-primary" />
                                    {workspace.name} Members
                                </h2>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {workspace.members?.length} registered members
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMembers(false)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Search members input */}
                        <div className="px-4 py-2 border-b border-border-subtle bg-sidebar">
                            <input 
                                type="text"
                                placeholder="Search members..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="w-full bg-input-bg border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition"
                            />
                        </div>

                        {/* Members List */}
                        <div className="px-4 py-2 overflow-y-auto flex-1 scrollbar-thin">
                            {filteredMembers.length === 0 && (
                                <div className="text-center py-8">
                                    <Users className="mx-auto text-text-disabled mb-2" size={24} />
                                    <p className="text-text-muted text-xs">
                                        No members found matching "{memberSearch}"
                                    </p>
                                </div>
                            )}
                            {filteredMembers.map((member, idx) => {
                                const name = member?.fullName || member?.email || "Unknown Member";
                                const initial = name.charAt(0).toUpperCase();
                                
                                return (
                                    <div
                                        key={member._id || idx}
                                        className="flex items-center gap-3 px-3 py-2.5 my-1 rounded-xl hover:bg-hover-bg transition-colors"
                                    >
                                        {/* Avatar with initial fallback */}
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-info flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                            {initial}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-text-primary block truncate">
                                                {name}
                                            </span>
                                            {member?.email && (
                                                <span className="text-[10px] text-text-muted block truncate">
                                                    {member.email}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Action visual button */}
                                        <button className="h-7 px-2.5 rounded-lg border border-border-subtle text-[11px] font-semibold text-text-secondary hover:bg-surface hover:text-primary transition">
                                            Message
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-border-subtle bg-sidebar flex items-center justify-between">
                            <button
                                onClick={() => {
                                    // Visual mock for adding members
                                    alert("Invite features are integrated in the project team dashboard!");
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition"
                            >
                                <Plus size={14} />
                                Invite Member
                            </button>
                            <button
                                onClick={() => setShowMembers(false)}
                                className="px-4 py-1.5 rounded-xl bg-hover-bg hover:bg-active-bg text-text-secondary transition text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default WorkspaceHeader;