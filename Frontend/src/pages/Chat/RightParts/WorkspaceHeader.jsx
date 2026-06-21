import React, { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import AddMemberModal from "../../../component/AddMemberModal.jsx";
import useConversation from "../../../zustand/useConversation.js";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";
import {
    Settings, Users, Hash, Search, Plus, Pencil, ShieldCheck,
    MessageCircle, Shield, ShieldOff, Trash2, ChevronRight,
    Activity, Bell, LogOut, X, Camera, MoreVertical, ArrowLeft, ChevronLeft
} from "lucide-react";

import {
    useWorkspace, useUpdateWorkspaceName, useGetAvailableUsers,
    useAddMembers, useToggleAdmin, useRemoveMember,
    useTransferOwnership, useLeaveWorkspace, useDeleteWorkspace,
    useUpdateWorkspaceSettings, useWorkspaceActivities
} from "../../../hooks/useWorkspace.js";

function WorkspaceHeader({ workspace: initialWorkspace }) {
    const [authUser] = useAuth();
    const authToken = typeof authUser === "string" ? authUser : authUser?.token;
    let decodedUser = null;

    if (authToken) {
        try { decodedUser = jwtDecode(authToken); } catch (err) { }
    }
    if (!decodedUser && typeof authUser === "object") {
        decodedUser = authUser?.user || authUser;
    }

    const currentUserId = decodedUser?.id || decodedUser?._id;
    const { setSelectedWorkspace, setSelectedConversation } = useConversation();

    const { data: liveWorkspace, isLoading: isWorkspaceLoading } = useWorkspace(initialWorkspace?._id);
    const workspace = liveWorkspace || initialWorkspace;

    const updateNameMutation = useUpdateWorkspaceName();
    const updateSettingsMutation = useUpdateWorkspaceSettings();
    const addMembersMutation = useAddMembers();
    const toggleAdminMutation = useToggleAdmin();
    const removeMemberMutation = useRemoveMember();
    const leaveWorkspaceMutation = useLeaveWorkspace();
    const deleteWorkspaceMutation = useDeleteWorkspace();
    const transferOwnershipMutation = useTransferOwnership();
    const { data: allUsers = [] } = useGetAvailableUsers(workspace?._id);

    // --- Local UI State ---
    const [showMembers, setShowMembers] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeView, setActiveView] = useState("main"); // main, settings, permissions, activity, notifications
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [nameInput, setNameInput] = useState(workspace?.name || "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    // --- Activity Logs Query ---
    const { data: activities = [], isLoading: activitiesLoading } = useWorkspaceActivities(activeView === 'activity' ? workspace?._id : null);

    const adminIds = new Set((workspace?.admins || []).map(a => a._id?.toString() || a.toString()));
    const isWorkspaceOwner = workspace?.owner?.toString() === currentUserId?.toString();
    const firstMemberId = workspace?.members?.[0]?._id?.toString?.() || workspace?.members?.[0]?.toString?.();
    const isWorkspaceAdmin = isWorkspaceOwner || adminIds.has(currentUserId?.toString()) || (!adminIds.size && firstMemberId === currentUserId?.toString());

    if (!workspace) return null;

    const filteredMembers = (workspace?.members || []).filter(member => {
        const name = member?.fullName || member?.email || "";
        return name.toLowerCase().includes(memberSearch.toLowerCase());
    }) || [];

    const closeDrawer = () => {
        setDrawerVisible(false);
        setTimeout(() => {
            setShowMembers(false);
            setActiveView("main");
        }, 280);
    };

    const handleAddMembers = (ids) => {
        if (!ids.length || !isWorkspaceAdmin) return;
        addMembersMutation.mutate({ workspaceId: workspace._id, userIds: ids }, {
            onSuccess: (updatedWs) => {
                setSelectedWorkspace(updatedWs);
                setShowAddMemberModal(false);
            }
        });
    };

    const saveWorkspaceName = () => {
        const trimmedName = nameInput.trim();
        if (!trimmedName || trimmedName === workspace.name) return setIsEditingName(false);
        updateNameMutation.mutate({ workspaceId: workspace._id, name: trimmedName }, {
            onSuccess: (updatedWs) => {
                setSelectedWorkspace(updatedWs);
                setIsEditingName(false);
            }
        });
    };

    const toggleSetting = (key, value) => {
        if (!isWorkspaceAdmin) return;
        updateSettingsMutation.mutate({
            workspaceId: workspace._id,
            settings: { [key]: value }
        }, {
            onSuccess: (updatedWs) => setSelectedWorkspace(updatedWs)
        });
    };

    const handleMessageMember = async (memberId) => {
        if (!memberId) return;
        try {
            const res = await axios.get(`/api/conversation/get-or-create/${memberId}`, { withCredentials: true });
            setSelectedConversation(res.data);
            setSelectedWorkspace(null);
            setShowMembers(false);
        } catch (err) {
            toast.error("Unable to open chat.");
        }
    };

    const existingMemberIds = new Set((workspace.members || []).map((m) => m._id?.toString() || m.toString()));
    const availableUsers = allUsers.filter((user) => !existingMemberIds.has(user._id.toString()));

    const renderMainView = () => (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-8 animate-in slide-in-from-left-4 fade-in">
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="relative group cursor-pointer mb-4">
                    <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-primary text-white shadow-sm overflow-hidden text-4xl font-bold">
                        {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>
                <h3 className="text-[24px] font-semibold text-text-primary mb-1">{workspace.name}</h3>
                <p className="text-[13px] text-text-muted font-medium">
                    {workspace.members?.length} Members • {Math.max(adminIds.size, 1)} Admin{adminIds.size !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="px-4 py-2">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-hover-bg transition-colors rounded-lg" onClick={() => setActiveView("settings")}>
                        <div className="flex items-center gap-3"><Settings size={18} className="text-text-muted" /><span className="text-[14px] font-medium text-text-primary">Workspace Settings</span></div><ChevronRight size={16} className="text-text-muted" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-hover-bg transition-colors rounded-lg" onClick={() => setActiveView("permissions")}>
                        <div className="flex items-center gap-3"><Shield size={18} className="text-text-muted" /><span className="text-[14px] font-medium text-text-primary">Permissions</span></div><ChevronRight size={16} className="text-text-muted" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-hover-bg transition-colors rounded-lg" onClick={() => setActiveView("activity")}>
                        <div className="flex items-center gap-3"><Activity size={18} className="text-text-muted" /><span className="text-[14px] font-medium text-text-primary">Activity Logs</span></div><ChevronRight size={16} className="text-text-muted" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-hover-bg transition-colors rounded-lg" onClick={() => setActiveView("notifications")}>
                        <div className="flex items-center gap-3"><Bell size={18} className="text-text-muted" /><span className="text-[14px] font-medium text-text-primary">Notifications</span></div><ChevronRight size={16} className="text-text-muted" />
                    </div>
                </div>
            </div>

            <div className="h-[1px] bg-border-subtle w-full my-4"></div>

            <div className="px-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[16px] font-semibold text-text-primary">Members ({workspace.members?.length})</h4>
                    {(isWorkspaceAdmin || workspace.settings?.allowMemberInvites) && (
                        <button onClick={() => setShowAddMemberModal(true)} className="flex items-center gap-1 text-[14px] font-medium text-primary hover:text-primary-hover transition-colors">
                            <Plus size={16} /> Invite
                        </button>
                    )}
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full rounded-md bg-hover-bg py-2 pl-9 pr-3 text-sm text-text-primary outline-none border border-transparent focus:border-border-default focus:bg-surface transition-colors placeholder:text-text-muted"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    {filteredMembers.map((member, idx) => {
                        const name = member?.fullName || member?.email || "Unknown Member";
                        const memberId = member._id?.toString();
                        const memberIsAdmin = adminIds.has(memberId) || (!adminIds.size && memberId === firstMemberId);
                        const memberIsOwner = workspace?.owner?.toString() === memberId;
                        const isCurrentUser = memberId === currentUserId?.toString();
                        const isMenuOpen = openMenuId === memberId;

                        return (
                            <div key={memberId || idx} className="group flex items-center justify-between px-2 h-[64px] rounded-lg hover:bg-hover-bg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm shadow-sm overflow-hidden">
                                        {member?.avatar ? (
                                            <img
                                                src={member.avatar}
                                                alt={name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            name.charAt(0).toUpperCase()
                                        )}
                                        <div className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full bg-success border-2 border-surface"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-medium text-text-primary leading-tight">
                                            {name} {isCurrentUser && <span className="text-text-muted font-normal">(You)</span>}
                                        </span>
                                        <span className="text-[13px] text-text-muted leading-tight mt-0.5">{member?.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {memberIsOwner ? (
                                        <span className="text-[12px] font-medium text-primary bg-primary-soft px-2.5 py-1 rounded-full border border-primary/20">Owner</span>
                                    ) : memberIsAdmin ? (
                                        <span className="text-[12px] font-medium text-primary bg-primary-soft px-2.5 py-1 rounded-full border border-primary/20">Admin</span>
                                    ) : (
                                        <span className="text-[12px] font-medium text-text-muted bg-hover-bg px-2.5 py-1 rounded-full border border-border-default">Member</span>
                                    )}

                                    <div className="relative flex items-center">
                                        {(!isCurrentUser || isWorkspaceAdmin) && (
                                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : memberId); }} className={`p-1.5 rounded-md transition-colors ${isMenuOpen ? 'bg-active-bg text-text-primary' : 'text-text-muted hover:bg-hover-bg opacity-0 group-hover:opacity-100 focus:opacity-100'}`}>
                                                <MoreVertical size={16} />
                                            </button>
                                        )}
                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border-default bg-surface shadow-[var(--shadow-popover)] py-1 z-50 animate-in fade-in zoom-in-95">
                                                {!isCurrentUser && (
                                                    <button onClick={() => { handleMessageMember(memberId); setOpenMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[14px] text-text-primary hover:bg-hover-bg transition-colors">
                                                        <MessageCircle size={16} className="text-text-muted" /> Message
                                                    </button>
                                                )}
                                                {isWorkspaceAdmin && !isCurrentUser && (
                                                    <>
                                                        <button onClick={() => { toggleAdminMutation.mutate({ workspaceId: workspace._id, memberId, isAdmin: !memberIsAdmin }); setOpenMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[14px] text-text-primary hover:bg-hover-bg transition-colors">
                                                            {memberIsAdmin ? <ShieldOff size={16} className="text-text-muted" /> : <Shield size={16} className="text-text-muted" />}
                                                            {memberIsAdmin ? "Revoke Admin" : "Make Admin"}
                                                        </button>
                                                        <div className="h-[1px] bg-border-subtle w-full my-1"></div>
                                                        <button onClick={() => { if (confirm('Remove this member?')) removeMemberMutation.mutate({ workspaceId: workspace._id, memberId }); setOpenMenuId(null); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[14px] text-error hover:bg-error-soft transition-colors">
                                                            <Trash2 size={16} /> Remove Member
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 mb-4 mx-6 border border-border-default rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-hover-bg border-b border-border-default">
                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-text-muted">Danger Zone</h4>
                </div>
                <div className="flex flex-col bg-surface">
                    {isWorkspaceOwner && (
                        <button onClick={() => {
                            const newOwnerId = prompt("Enter the User ID of the new owner to transfer ownership:");
                            if (newOwnerId) transferOwnershipMutation.mutate({ workspaceId: workspace._id, newOwnerId });
                        }} className="flex items-center justify-between px-4 py-3.5 hover:bg-hover-bg transition-colors text-left w-full border-b border-border-default group">
                            <span className="text-[14px] font-medium text-text-primary">{transferOwnershipMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}</span>
                            <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}

                    <button onClick={() => {
                        if (confirm("Are you sure you want to leave this workspace?")) {
                            leaveWorkspaceMutation.mutate({ workspaceId: workspace._id, userId: currentUserId }, {
                                onSuccess: () => { setSelectedWorkspace(null); setShowMembers(false); }
                            });
                        }
                    }} disabled={leaveWorkspaceMutation.isPending || (isWorkspaceOwner && workspace.members.length > 1)} className="flex items-center justify-between px-4 py-3.5 hover:bg-hover-bg transition-colors text-left w-full disabled:opacity-50 disabled:cursor-not-allowed border-b border-border-default group">
                        <div className="flex flex-col">
                            <span className="text-[14px] font-medium text-text-primary">{leaveWorkspaceMutation.isPending ? 'Leaving...' : 'Leave Workspace'}</span>
                            {isWorkspaceOwner && workspace.members.length > 1 && <span className="text-[12px] text-text-muted mt-0.5">Transfer ownership first</span>}
                        </div>
                        <LogOut size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {isWorkspaceOwner && (
                        <button onClick={() => {
                            if (confirm('Delete this workspace? This action is irreversible.')) {
                                deleteWorkspaceMutation.mutate(workspace._id, {
                                    onSuccess: () => window.location.reload()
                                });
                            }
                        }} className="flex items-center justify-between px-4 py-3.5 hover:bg-error-soft transition-colors text-left w-full group">
                            <span className="text-[14px] font-medium text-error">{deleteWorkspaceMutation.isPending ? 'Deleting...' : 'Delete Workspace'}</span>
                            <Trash2 size={16} className="text-error opacity-70 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSettingsView = () => (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 animate-in slide-in-from-right-4 fade-in">
            <h3 className="text-[16px] font-semibold text-text-primary mb-6">General Settings</h3>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-text-primary">Workspace Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            disabled={!isWorkspaceAdmin}
                            className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-[14px] text-text-primary outline-none focus:border-primary disabled:opacity-50"
                        />
                        {isWorkspaceAdmin && (
                            <button onClick={saveWorkspaceName} disabled={updateNameMutation.isPending || nameInput === workspace.name} className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                {updateNameMutation.isPending ? "Saving..." : "Save"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-text-primary">Message Retention</label>
                    <select
                        disabled={!isWorkspaceAdmin || updateSettingsMutation.isPending}
                        value={workspace.settings?.messageRetentionDays || 0}
                        onChange={(e) => toggleSetting('messageRetentionDays', parseInt(e.target.value))}
                        className="w-full rounded-md border border-border-default bg-input-bg px-3 py-2 text-[14px] text-text-primary outline-none focus:border-primary disabled:opacity-50"
                    >
                        <option value={0}>Keep forever</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={365}>1 Year</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderPermissionsView = () => (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 animate-in slide-in-from-right-4 fade-in">
            <h3 className="text-[16px] font-semibold text-text-primary mb-6">Access & Permissions</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border-default bg-surface">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-text-primary">Allow Member Invites</span>
                        <span className="text-[12px] text-text-muted mt-0.5">Let any member invite new users to the workspace</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" disabled={!isWorkspaceAdmin || updateSettingsMutation.isPending} checked={workspace.settings?.allowMemberInvites || false} onChange={(e) => toggleSetting('allowMemberInvites', e.target.checked)} />
                        <div className="w-9 h-5 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50"></div>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderActivityLogs = () => (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 animate-in slide-in-from-right-4 fade-in">
            <h3 className="text-[16px] font-semibold text-text-primary mb-6">Activity Logs</h3>
            {activitiesLoading ? (
                <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary"></span></div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-[13px]">No recent activity found.</div>
            ) : (
                <div className="flex flex-col gap-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-subtle before:to-transparent">
                    {activities.map((log) => (
                        <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-surface bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-[2px]"></div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border-subtle bg-surface shadow-[var(--shadow-soft)]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-medium text-text-primary">{log.title}</span>
                                    <span className="text-[11px] text-text-muted">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNotifications = () => (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 animate-in slide-in-from-right-4 fade-in">
            <h3 className="text-[16px] font-semibold text-text-primary mb-6">Notification Preferences</h3>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border-default bg-surface">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-text-primary">Mute Workspace</span>
                        <span className="text-[12px] text-text-muted mt-0.5">Disable all push notifications for this workspace</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border-default bg-surface">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-text-primary">Mentions Only</span>
                        <span className="text-[12px] text-text-muted mt-0.5">Only notify me when I am directly mentioned</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <header className="relative flex items-center justify-between h-[60px] sm:h-[70px] w-full px-3 sm:px-6 bg-surface border-b border-border-subtle shadow-[var(--shadow-soft)] select-none z-10">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* BACK BUTTON */}
                    <button
                        className="p-2 mr-1 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition shrink-0"
                        onClick={() => setSelectedWorkspace(null)}
                        aria-label="Back to contacts"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-85 transition-opacity min-w-0" onClick={() => { setShowMembers(true); setDrawerVisible(true); }}>
                        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-soft text-primary font-bold text-lg shadow-sm shrink-0">
                            <Hash size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <h1 className="text-sm font-bold text-text-primary tracking-wide leading-tight truncate">
                                    {workspace.name}
                                </h1>
                                {isWorkspaceAdmin && (
                                    <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary border border-primary/20">
                                        <ShieldCheck size={10} />
                                        Admin
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-text-muted font-medium flex items-center gap-1 mt-0.5 min-w-0">
                                <Users size={10} className="shrink-0" />
                                <span className="truncate">{workspace.members?.length} members · Click to view</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="hidden sm:block h-5 w-[1px] bg-border-subtle mx-1" />
                    <button onClick={() => { setShowMembers(true); setDrawerVisible(true); }} className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200">
                        <Users size={18} />
                    </button>
                    <button onClick={() => { setShowMembers(true); setDrawerVisible(true); setActiveView("settings"); }} className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-hover-bg hover:text-text-primary transition-all duration-200">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {showMembers && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[999] flex justify-end bg-black/45 backdrop-blur-[8px] transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="absolute inset-0" onClick={closeDrawer} />
                    {openMenuId && <div className="absolute inset-0 z-40" onClick={() => setOpenMenuId(null)} />}

                    <aside className={`relative z-50 flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-surface shadow-[var(--shadow-popover)] transition-transform duration-300 ease-out sm:w-[420px] ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-surface px-6 py-4">
                            <div className="flex items-center gap-3">
                                {activeView !== "main" && (
                                    <button onClick={() => setActiveView("main")} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-hover-bg">
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <h2 className="text-[16px] font-semibold text-text-primary">
                                    {activeView === "main" ? "Workspace Details" :
                                        activeView === "settings" ? "Settings" :
                                            activeView === "permissions" ? "Permissions" :
                                                activeView === "activity" ? "Activity Logs" : "Notifications"}
                                </h2>
                            </div>
                            <button onClick={closeDrawer} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-hover-bg">
                                <X size={20} />
                            </button>
                        </div>

                        {isWorkspaceLoading && !liveWorkspace ? (
                            <div className="flex-1 flex justify-center items-center">
                                <span className="loading loading-spinner text-primary"></span>
                            </div>
                        ) : (
                            <>
                                {activeView === "main" && renderMainView()}
                                {activeView === "settings" && renderSettingsView()}
                                {activeView === "permissions" && renderPermissionsView()}
                                {activeView === "activity" && renderActivityLogs()}
                                {activeView === "notifications" && renderNotifications()}
                            </>
                        )}
                    </aside>
                </div>,
                document.body
            )}

            {showAddMemberModal && (
                <AddMemberModal
                    allUsers={availableUsers}
                    onClose={() => setShowAddMemberModal(false)}
                    onAddMembers={handleAddMembers}
                    title="Invite to workspace"
                    subtitle="Search and select users to add to this workspace."
                    buttonText={addMembersMutation.isPending ? "Adding..." : "Add selected"}
                />
            )}


        </>

    );
}

export default WorkspaceHeader;
