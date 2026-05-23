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
    Plus,
    Pencil,
    ShieldCheck,
    MessageCircle,
    Shield,
    ShieldOff,
    Trash2,
    X
} from "lucide-react";

function WorkspaceHeader({ workspace }) {
    const [authUser] = useAuth();
    console.log("AUTH USER FULL", authUser);
    const decodedUser = authUser ? jwtDecode(authUser) : null;

    const currentUserId = decodedUser?.id;
    const { setSelectedWorkspace, setSelectedConversation } = useConversation();
    const [showMembers, setShowMembers] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [membersState, setMembersState] = useState(workspace?.members || []);
    const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
    const [nameInput, setNameInput] = useState(workspace?.name || "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [renameLoading, setRenameLoading] = useState(false);
    const [renameError, setRenameError] = useState("");
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

            {/* Workspace drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 flex h-screen w-full max-w-[420px] transform transition-transform duration-300 ease-in-out ${showMembers ? "translate-x-0" : "translate-x-full"} sm:w-[420px]`}
                aria-hidden={!showMembers}
            >
                <div className="flex h-full w-full flex-col bg-surface border-l border-border-subtle shadow-2xl">
                    <div className="sticky top-0 z-20 border-b border-border-subtle bg-white/95 backdrop-blur-sm px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-soft text-primary text-xl font-bold shadow-sm">
                                    <Hash size={22} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-1">Workspace</p>
                                    <h2 className="text-lg font-semibold text-text-primary truncate">{workspaceName}</h2>
                                    <p className="text-xs text-text-muted mt-1">{workspace.members?.length} members</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMembers(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-white text-text-muted hover:bg-hover-bg hover:text-text-primary transition"
                                aria-label="Close workspace drawer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {isWorkspaceAdmin && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-[11px] font-semibold text-primary">
                                    <ShieldCheck size={12} />
                                    Admin
                                </span>
                            )}
                            <button
                                onClick={() => setShowAddMemberModal(true)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-text-primary hover:bg-hover-bg transition"
                            >
                                <Plus size={14} />
                                Add member
                            </button>
                        </div>
                    </div>

                    <div className="sticky top-[72px] z-10 border-b border-border-subtle bg-white/95 px-5 py-4">
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="w-full rounded-3xl border border-border-subtle bg-input-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3 text-xs text-text-secondary">
                                <span>{filteredMembers.length} result{filteredMembers.length !== 1 ? "s" : ""}</span>
                                <span>{isWorkspaceAdmin ? `${candidateCount} candidates available` : "Admin only"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        <div className="grid gap-4">
                            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-white p-4 shadow-sm">
                                <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary mb-3">Workspace details</p>
                                <div className="grid gap-3">
                                    <div className="rounded-3xl bg-surface px-4 py-3">
                                        <p className="text-sm font-semibold text-text-primary">Workspace name</p>
                                        <p className="text-xs text-text-muted mt-1 truncate">{workspaceName}</p>
                                    </div>
                                    <div className="rounded-3xl bg-surface px-4 py-3">
                                        <p className="text-sm font-semibold text-text-primary">Members</p>
                                        <p className="text-xs text-text-muted mt-1">{workspace.members?.length} team members</p>
                                    </div>
                                    <div className="rounded-3xl bg-surface px-4 py-3">
                                        <p className="text-sm font-semibold text-text-primary">Admins</p>
                                        <p className="text-xs text-text-muted mt-1">{Math.max(adminIds.size, 1)} workspace admin{Math.max(adminIds.size, 1) !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                            </div>
                            {renameError && <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600">{renameError}</div>}
                            <div className="rounded-3xl border border-border-subtle bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">Workspace name</p>
                                        <p className="text-xs text-text-muted mt-1 truncate">{workspaceName}</p>
                                    </div>
                                    {isWorkspaceAdmin && (
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border-subtle bg-surface px-3 text-xs font-semibold text-text-secondary hover:bg-hover-bg transition"
                                        >
                                            <Pencil size={14} />
                                            Rename
                                        </button>
                                    )}
                                </div>
                                {isEditingName && (
                                    <div className="mt-4 space-y-3">
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveWorkspaceName();
                                                if (e.key === "Escape") {
                                                    setIsEditingName(false);
                                                    setNameInput(workspaceName);
                                                }
                                            }}
                                            className="w-full rounded-3xl border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={saveWorkspaceName}
                                                disabled={renameLoading}
                                                className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {renameLoading ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingName(false);
                                                    setNameInput(workspaceName);
                                                }}
                                                className="rounded-2xl border border-border-subtle bg-white px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover-bg transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {filteredMembers.length === 0 ? (
                            <div className="rounded-3xl border border-border-subtle bg-surface p-6 text-center text-sm text-text-muted">
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
                                        className="flex items-center gap-3 rounded-3xl border border-border-subtle bg-white p-4 shadow-sm transition hover:border-primary hover:bg-hover-bg"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-info text-white font-semibold text-sm">
                                            {initial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                                                {memberIsAdmin && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                        <ShieldCheck size={10} />
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            {member?.email && (
                                                <p className="text-xs text-text-secondary truncate">{member.email}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {member._id?.toString() !== currentUserId?.toString() && (
                                                <button
                                                    onClick={() => handleMessageMember(member._id)}
                                                    className="inline-flex items-center gap-2 justify-center rounded-2xl border border-border-subtle bg-surface px-3 py-2 text-[11px] font-semibold text-text-secondary hover:bg-hover-bg transition"
                                                >
                                                    <MessageCircle size={14} />
                                                    Message
                                                </button>
                                            )}
                                            {isWorkspaceAdmin && memberId !== currentUserId?.toString() && (
                                                <>
                                                    <button
                                                        onClick={() => toggleAdmin(memberId, !memberIsAdmin)}
                                                        className="inline-flex items-center gap-2 justify-center rounded-2xl border border-border-subtle bg-surface px-3 py-2 text-[11px] font-semibold text-text-secondary hover:bg-hover-bg transition"
                                                    >
                                                        {memberIsAdmin ? (
                                                            <>
                                                                <ShieldOff size={14} />
                                                                Remove admin
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield size={14} />
                                                                Make admin
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
                                                        className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                                                    >
                                                        <Trash2 size={14} />
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="sticky bottom-0 z-20 border-t border-border-subtle bg-white/95 px-5 py-4">
                        {isWorkspaceAdmin ? (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                                >
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
                                    className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition"
                                >
                                    Delete workspace
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-border-subtle bg-hover-bg px-4 py-3 text-sm text-text-secondary">
                                Only workspace admins can invite members, rename, remove members, or delete this workspace.
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
