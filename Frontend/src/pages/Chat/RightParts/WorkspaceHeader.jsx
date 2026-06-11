import React, { useEffect, useState } from "react";
import axios from "axios";

import AddMemberModal from "../../../component/AddMemberModal.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { jwtDecode } from "jwt-decode";
import {
    Settings,
    Users,
    Hash,
    Search,
    Plus,
    Pencil,
    ShieldCheck,
    MessageCircle,
    Shield,
    ShieldOff,
    Trash2
} from "lucide-react";

function WorkspaceHeader({ workspace }) {
    const [authUser] = useAuth();
    console.log("AUTH USER FULL", authUser);

    const authToken = typeof authUser === "string" ? authUser : authUser?.token;
    let decodedUser = null;

    if (authToken) {
        try {
            decodedUser = jwtDecode(authToken);
        } catch (err) {
            console.warn("WorkspaceHeader: invalid auth token", err);
            decodedUser = null;
        }
    }

    if (!decodedUser && typeof authUser === "object") {
        decodedUser = authUser?.user || authUser;
    }

    const currentUserId = decodedUser?.id || decodedUser?._id;
    const { setSelectedWorkspace, setSelectedConversation } = useConversation();
    const [showMembers, setShowMembers] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [membersState, setMembersState] = useState(workspace?.members || []);
    const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
    const [nameInput, setNameInput] = useState(workspace?.name || "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState("");
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState("");
    const [availableUsers, setAvailableUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");
    const [adminsState, setAdminsState] = useState(workspace?.admins || []);

    const adminIds = new Set(
        (adminsState || []).map(
            (admin) => admin._id?.toString() || admin.toString()
        )
    );

    const firstMemberId =
        workspace?.members?.[0]?._id?.toString?.() ||
        workspace?.members?.[0]?.toString?.();

    const isWorkspaceAdmin =
        adminIds.has(currentUserId?.toString()) ||
        (
            !adminIds.size &&
            firstMemberId === currentUserId?.toString()
        );

    console.log("FULL WORKSPACE", workspace);
    console.log("ADMINS", workspace?.admins);
    console.log("adminsState", adminsState);
    console.log("CURRENT USER", currentUserId);
    console.log("ADMIN IDS", [...adminIds]);
    console.log("IS ADMIN", isWorkspaceAdmin);
    useEffect(() => {
        setMembersState(workspace?.members || []);
        setAdminsState(workspace?.admins || []);
        setWorkspaceName(workspace?.name || "");
        setNameInput(workspace?.name || "");
    }, [workspace]);

    useEffect(() => {
        if (!showMembers) return;
        setDrawerVisible(true);
    }, [showMembers]);

    const closeDrawer = () => {
        setDrawerVisible(false);
        setTimeout(() => setShowMembers(false), 280);
    };

    useEffect(() => {
        if (!showAddMemberModal) return;

        const fetchAvailableUsers = async () => {
            setUsersLoading(true);
            setUsersError("");

            try {
                const res = await axios.get("/api/auth/alluser", { withCredentials: true });
                const allUsers = res.data || [];
                const existingIds = new Set(
                    (workspace?.members || []).map((member) => member._id?.toString() || member.toString())
                );
                const filtered = allUsers.filter((user) => !existingIds.has(user._id.toString()));
                setAvailableUsers(filtered);
            } catch (err) {
                console.error("Failed to load users", err);
                setUsersError("Could not load users. Please try again.");
            } finally {
                setUsersLoading(false);
            }
        };

        fetchAvailableUsers();
    }, [showAddMemberModal, workspace]);

    if (!workspace) return null;

    // Filter members if there's search text
    const filteredMembers = (membersState || []).filter(member => {
        const name = member?.fullName || member?.email || "";
        return name.toLowerCase().includes(memberSearch.toLowerCase());
    }) || [];

    const handleAddMembers = async (ids) => {
        if (!ids.length) return;
        if (!isWorkspaceAdmin) {
            alert("Only workspace admins can add members.");
            return;
        }

        try {
            setUsersLoading(true);
            await Promise.all(
                ids.map((userId) =>
                    axios.post(
                        `/api/workspace/${workspace._id}/add-member`,
                        { userId },
                        { withCredentials: true }
                    )
                )
            );

            const updated = await axios.get(`/api/workspace/${workspace._id}`, { withCredentials: true });
            setMembersState(updated.data.members || []);
            setSelectedWorkspace(updated.data);
            setShowAddMemberModal(false);
        } catch (err) {
            console.error("Add members failed", err);
            alert("Unable to add selected members. Please try again.");
        } finally {
            setUsersLoading(false);
        }
    };

    const saveWorkspaceName = async () => {
        if (!isWorkspaceAdmin) {
            setRenameError("Only workspace admins can rename this workspace.");
            return;
        }
        const trimmedName = nameInput.trim();
        if (!trimmedName) {
            setRenameError("Workspace name cannot be empty.");
            return;
        }
        if (trimmedName === workspaceName) {
            setIsEditingName(false);
            return;
        }

        try {
            setRenameLoading(true);
            setRenameError("");
            const res = await axios.put(
                `/api/workspace/${workspace._id}`,
                { name: trimmedName },
                { withCredentials: true }
            );
            setWorkspaceName(res.data.name);
            setNameInput(res.data.name);
            setSelectedWorkspace(res.data);
            setIsEditingName(false);
        } catch (err) {
            console.error("Rename failed", err);
            setRenameError("Could not rename workspace. Try again.");
        } finally {
            setRenameLoading(false);
        }
    };

    const handleMessageMember = async (memberId) => {
        if (!memberId) return;

        try {
            const res = await axios.get(`/api/conversation/get-or-create/${memberId}`, { withCredentials: true });
            setSelectedConversation(res.data);
            setSelectedWorkspace(null);
            setShowMembers(false);

        } catch (err) {
            console.error("Open message failed", err);
            alert("Unable to open chat. Please try again.");
        }
    };

    const existingMemberIds = new Set((membersState || []).map((member) => member._id?.toString() || member.toString()));
    const candidateCount = availableUsers.filter((user) => !existingMemberIds.has(user._id.toString())).length;

    const handleLeaveWorkspace = async () => {
        if (!currentUserId || !workspace?._id) return;

        if (!confirm('Leave this workspace? You can rejoin only if invited again.')) return;

        try {
            setLeaveLoading(true);
            setLeaveError("");
            await axios.delete(`/api/workspace/${workspace._id}/member/${currentUserId}`, { withCredentials: true });
            setSelectedWorkspace(null);
            setShowMembers(false);
        } catch (err) {
            console.error("Leave workspace failed", err);
            setLeaveError(err.response?.data?.message || "Could not leave workspace.");
        } finally {
            setLeaveLoading(false);
        }
    };

    const toggleAdmin = async (memberId, shouldBeAdmin) => {
        if (!isWorkspaceAdmin) return;
        try {
            const res = await axios.patch(
                `/api/workspace/${workspace._id}/admin/${memberId}`,
                { isAdmin: shouldBeAdmin },
                { withCredentials: true }
            );
            setMembersState(res.data.members || []);
            setAdminsState(res.data.admins || []);
            setSelectedWorkspace(res.data);

        } catch (err) {
            console.error("Update admin failed", err);
            alert(err.response?.data?.message || "Could not update admin rights.");
        }
    };

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
                            {workspaceName}
                        </h1>
                        <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                            <Users size={10} />
                            {workspace.members?.length} members · Click to view
                        </span>
                        {isWorkspaceAdmin && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                                <ShieldCheck size={10} />
                                Admin
                            </span>
                        )}
                    </div>
                </div>

                {/* SaaS Top Bar Actions (Right) */}
                <div className="flex items-center gap-1.5">
                    <div className="h-4 w-[1px] bg-border-subtle mx-1" />
                    <button
                        onClick={() => setShowMembers(true)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200"
                        title="View members"
                    >
                        <Users size={16} />
                    </button>
                    <button
                        onClick={() => setShowMembers(true)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200" title="Workspace settings">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Members Drawer */}
            {showMembers && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/10 dark:bg-black/40 backdrop-blur-sm transition-colors">
                    <div
                        className="absolute inset-0"
                        onClick={closeDrawer}
                    />
                    <aside className={`relative z-10 flex h-screen w-full max-w-[420px] flex-col overflow-hidden bg-surface shadow-2xl border-l border-border-subtle transition-transform duration-300 ease-out sm:w-full ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="sticky top-0 z-20 border-b border-border-subtle bg-surface/95 px-5 py-4 backdrop-blur-xl">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Workspace members</p>
                                    <h3 className="text-lg font-semibold text-text-primary">{workspaceName}</h3>
                                </div>
                                <button
                                    onClick={closeDrawer}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-surface/95 text-text-muted transition hover:border-primary hover:text-text-primary hover:bg-surface"
                                    aria-label="Close members drawer"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="mt-4">
                                <div className="relative flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-3 py-3 shadow-sm">
                                    <Search className="h-4 w-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                                    <span>{filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}</span>
                                    <span>{workspace.members?.length} members</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
                            {/* WORKSPACE PROFILE CARD */}
                            <div className="rounded-3xl border border-border-default bg-surface p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-info/5 opacity-50 pointer-events-none" />
                                
                                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-tr from-primary to-info text-white shadow-lg shadow-primary/20 mb-4 transition-transform group-hover:scale-105">
                                    <Hash size={32} />
                                </div>
                                
                                <div className="w-full relative z-10">
                                    {isEditingName ? (
                                        <div className="space-y-4 bg-background p-4 rounded-2xl border border-border-subtle">
                                            <div className="space-y-2 text-left">
                                                <label className="text-xs uppercase tracking-[0.2em] font-bold text-text-secondary">Rename Workspace</label>
                                                <input
                                                    type="text"
                                                    value={nameInput}
                                                    onChange={(e) => setNameInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveWorkspaceName();
                                                        if (e.key === "Escape") {
                                                            setIsEditingName(false);
                                                            setNameInput(workspaceName);
                                                            setRenameError("");
                                                        }
                                                    }}
                                                    className="w-full rounded-xl border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={saveWorkspaceName}
                                                    disabled={renameLoading}
                                                    className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
                                                >
                                                    {renameLoading ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingName(false);
                                                        setNameInput(workspaceName);
                                                        setRenameError("");
                                                    }}
                                                    className="flex-1 rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-bold text-text-primary transition hover:bg-hover-bg"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            {renameError && (
                                                <p className="text-xs text-rose-600 font-medium">{renameError}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <h2 className="text-2xl font-black text-text-primary tracking-tight mb-1">{workspaceName}</h2>
                                            <p className="text-sm font-medium text-text-muted mb-4 flex items-center gap-1.5"><Users size={14} /> {workspace.members?.length} active members</p>
                                            
                                            {isWorkspaceAdmin && (
                                                <button
                                                    onClick={() => setIsEditingName(true)}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-background border border-border-subtle px-4 py-2 text-xs font-bold text-text-secondary hover:bg-border-subtle hover:text-text-primary transition shadow-sm"
                                                >
                                                    <Pencil size={14} /> Edit Workspace Name
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 w-full grid grid-cols-2 gap-3 relative z-10">
                                    <div className="rounded-2xl border border-border-subtle bg-background p-3.5 flex flex-col items-center justify-center transition hover:border-border-default hover:bg-surface">
                                        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1.5">Status</span>
                                        <span className="text-xs font-bold text-success flex items-center gap-1.5 bg-success-soft px-2 py-0.5 rounded-md border border-success/20"><ShieldCheck size={12}/> Active</span>
                                    </div>
                                    <div className="rounded-2xl border border-border-subtle bg-background p-3.5 flex flex-col items-center justify-center transition hover:border-border-default hover:bg-surface">
                                        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1.5">Admins</span>
                                        <span className="text-xs font-bold text-primary flex items-center gap-1.5 bg-primary-soft px-2 py-0.5 rounded-md border border-primary/20"><Shield size={12} /> {Math.max(adminIds.size, 1)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Directory</h4>
                                </div>
                                {filteredMembers.length === 0 ? (
                                    <div className="rounded-3xl border border-border-subtle bg-card p-6 text-center text-sm text-text-muted">
                                        No members found for "{memberSearch}".
                                    </div>
                                ) : (
                                    filteredMembers.map((member, idx) => {
                                        const name = member?.fullName || member?.email || "Unknown Member";
                                        const initial = name.charAt(0).toUpperCase();
                                        const memberId = member._id?.toString();
                                        const memberIsAdmin = adminIds.has(memberId) || (!adminIds.size && memberId === firstMemberId);

                                        return (
                                            <div
                                                key={member._id || idx}
                                                className="flex flex-col gap-3 rounded-3xl border border-border-subtle bg-white p-4 shadow-sm transition hover:border-primary hover:bg-hover-bg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-info text-white font-semibold">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                                                        {member?.email && (
                                                            <p className="text-[11px] text-text-secondary truncate">{member.email}</p>
                                                        )}
                                                        {memberIsAdmin && (
                                                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-[10px] font-semibold text-primary">
                                                                <ShieldCheck size={10} />
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ">
                                                    {member._id?.toString() !== currentUserId?.toString() && (
                                                        <button
                                                            onClick={() => handleMessageMember(member._id)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-info-soft border border-info/20 px-3 py-2 text-[11px] font-bold text-info hover:bg-info hover:text-white transition"
                                                        >
                                                            <MessageCircle size={14} />
                                                            Message
                                                        </button>
                                                    )}
                                                    {isWorkspaceAdmin && memberId !== currentUserId?.toString() && (
                                                        <>
                                                            <button
                                                                onClick={() => toggleAdmin(memberId, !memberIsAdmin)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-[11px] font-bold text-text-secondary transition hover:border-primary hover:text-primary hover:bg-primary-soft"
                                                            >
                                                                {memberIsAdmin ? (
                                                                    <>
                                                                        <ShieldOff size={14} />
                                                                        Revoke Admin
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Shield size={14} />
                                                                        Make Admin
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm('Remove this member from workspace?')) return;
                                                                    try {
                                                                        const res = await axios.delete(`/api/workspace/${workspace._id}/member/${member._id}`, { withCredentials: true });
                                                                        setMembersState(res.data.members || []);
                                                                        setSelectedWorkspace(res.data);
                                                                    } catch (err) {
                                                                        console.error('Remove member failed', err);
                                                                        alert(err.response?.data?.message || 'Could not remove member.');
                                                                    }
                                                                }}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-error/20 bg-error-soft px-3 py-2 text-[11px] font-bold text-error transition hover:bg-error hover:text-white"
                                                                title="Remove from workspace"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="sticky bottom-0 z-20 border-t border-border-subtle bg-surface/95 px-5 py-4 backdrop-blur-xl">
                            <div className="grid gap-3">
                                {isWorkspaceAdmin ? (
                                    <>
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                                        >
                                            <Plus size={16} />
                                            Invite members
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Delete this workspace? This action is irreversible.')) return;
                                                try {
                                                    await axios.delete(`/api/workspace/${workspace._id}`, { withCredentials: true });
                                                    alert('Workspace deleted');
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error('Delete workspace failed', err);
                                                    alert(err.response?.data?.message || 'Could not delete workspace.');
                                                }
                                            }}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                        >
                                            <Trash2 size={16} />
                                            Delete workspace
                                        </button>
                                    </>
                                ) : (
                                    <div className="rounded-3xl border border-border-subtle bg-hover-bg p-4 text-sm text-text-secondary">
                                        Only workspace admins can manage workspace members and settings.
                                    </div>
                                )}
                                <button
                                    onClick={handleLeaveWorkspace}
                                    disabled={leaveLoading || (isWorkspaceAdmin && workspace.admins?.length <= 1)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                                        <path d="M10.5 3.75a.75.75 0 0 1 0 1.5H6.81l3.47 3.47a.75.75 0 0 1-1.06 1.06L5.25 6.31a.75.75 0 0 1 0-1.06l3.97-3.97a.75.75 0 0 1 1.06 0l3.47 3.47a.75.75 0 0 1-1.06 1.06L6.81 5.25H10.5Zm3 16.5a.75.75 0 0 1-.75-.75V14.5H7.25a.75.75 0 0 1 0-1.5H12.75V5.25a.75.75 0 0 1 1.5 0V14.5h4.25a.75.75 0 0 1 0 1.5H14.25v4.25a.75.75 0 0 1-.75.75Z" fill="currentColor" />
                                    </svg>
                                    {leaveLoading ? 'Leaving...' : 'Leave workspace'}
                                </button>
                                {leaveError && (
                                    <p className="text-xs text-rose-600">{leaveError}</p>
                                )}
                                {isWorkspaceAdmin && workspace.admins?.length <= 1 && (
                                    <p className="text-xs text-text-secondary">Assign another admin before leaving or delete workspace.</p>
                                )}

                            </div>
                        </div>
                    </aside>
                </div>
            )}
            {showAddMemberModal && isWorkspaceAdmin && (
                <AddMemberModal
                    allUsers={availableUsers}
                    onClose={() => setShowAddMemberModal(false)}
                    onAddMembers={handleAddMembers}
                    title="Invite to workspace"
                    subtitle="Search and select users to add to this workspace."
                    buttonText={usersLoading ? "Adding..." : "Add selected"}
                />
            )}
        </>
    );
}

export default WorkspaceHeader;
