import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import { useAuth } from '../../context/AuthProvider';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Mail, Shield, Bell, Palette, Bot, AlertTriangle,
  Upload, CheckCircle, Github, Linkedin, Monitor, Smartphone,
  Key, LogOut, Trash2, X, Plus, Sparkles, Loader2, Eye, EyeOff,
  HelpCircle, Settings as SettingsIcon, Info, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://ai-powered-chat-application-production.up.railway.app");

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, desc: 'Public avatar, name, and bio details' },
  { id: 'account', label: 'Account & Integrations', icon: Mail, desc: 'Login emails and third-party integrations' },
  { id: 'security', label: 'Security & Password', icon: Key, desc: 'Credentials and active browser sessions' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Control alerts and sound settings' },
  { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Customize themes and layouts' },
  { id: 'ai', label: 'AI Assistant', icon: Bot, desc: 'Configure LLMs and OpenAI keys' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true, desc: 'Irreversible account-level actions' },
];

export default function Settings() {
  const [authUser, setAuthUser] = useAuth();
  const { theme, setTheme } = useTheme();
  const user = authUser?.user;

  // Active Tab loaded from localStorage if exists, default to 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('active_settings_tab') || 'profile';
  });

  // Keep track of unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // States for subtabs: Profile
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileTech, setProfileTech] = useState(user?.techStack || []);
  const [newTag, setNewTag] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password / Security States
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Very Weak', color: 'bg-error' });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows · Chrome', location: 'Current Session', active: true, icon: Monitor },
    { id: 2, device: 'iPhone · Safari', location: 'London, UK · Last active 2 days ago', active: false, icon: Smartphone },
  ]);

  // Notifications toggles
  const [notifWorkspace, setNotifWorkspace] = useState(user?.notifications?.workspaceUpdates ?? true);
  const [notifDMs, setNotifDMs] = useState(user?.notifications?.directMessages ?? true);
  const [notifMentions, setNotifMentions] = useState(user?.notifications?.mentions ?? true);
  const [notifEmail, setNotifEmail] = useState(user?.notifications?.emailDigest ?? false);
  const [notifPush, setNotifPush] = useState(user?.notifications?.pushNotifications ?? true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Appearance states
  const [compactMode, setCompactMode] = useState(user?.appearance?.compactMode ?? false);
  const [animations, setAnimations] = useState(user?.appearance?.animations ?? true);
  const [appSaving, setAppSaving] = useState(false);

  // Connected accounts (UI states)
  const [connectedGithub, setConnectedGithub] = useState(true);
  const [connectedLinkedin, setConnectedLinkedin] = useState(false);

  // AI settings
  const [openaiKey, setOpenaiKey] = useState(user?.aiSettings?.openaiKey ?? '');
  const [geminiKey, setGeminiKey] = useState(user?.aiSettings?.geminiKey ?? '');
  const [defaultModel, setDefaultModel] = useState(user?.aiSettings?.defaultModel ?? 'GPT-4o (Recommended)');
  const [aiContext, setAiContext] = useState(user?.aiSettings?.contextAware ?? true);
  const [aiSummarize, setAiSummarize] = useState(user?.aiSettings?.autoSummarize ?? false);
  const [aiSaving, setAiSaving] = useState(false);

  // Destructive Actions Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutDevicesModal, setShowLogoutDevicesModal] = useState(false);

  // Save active tab in local storage
  useEffect(() => {
    localStorage.setItem('active_settings_tab', activeTab);
  }, [activeTab]);

  // Sync profile fields if user object changes
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfileBio(user.bio || '');
      setProfileTech(user.techStack || []);
      setAvatarPreview(user.avatar || null);
      
      setNotifWorkspace(user.notifications?.workspaceUpdates ?? true);
      setNotifDMs(user.notifications?.directMessages ?? true);
      setNotifMentions(user.notifications?.mentions ?? true);
      setNotifEmail(user.notifications?.emailDigest ?? false);
      setNotifPush(user.notifications?.pushNotifications ?? true);

      setCompactMode(user.appearance?.compactMode ?? false);
      setAnimations(user.appearance?.animations ?? true);

      setOpenaiKey(user.aiSettings?.openaiKey ?? '');
      setGeminiKey(user.aiSettings?.geminiKey ?? '');
      setDefaultModel(user.aiSettings?.defaultModel ?? 'GPT-4o (Recommended)');
      setAiContext(user.aiSettings?.contextAware ?? true);
      setAiSummarize(user.aiSettings?.autoSummarize ?? false);
    }
  }, [user]);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, label: 'None', color: 'bg-border-strong' });
      return;
    }
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'Very Weak';
    let color = 'bg-error';
    if (score === 2) {
      label = 'Weak';
      color = 'bg-warning';
    } else if (score === 3) {
      label = 'Moderate';
      color = 'bg-info';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-success';
    }
    setPasswordStrength({ score, label, color });
  }, [newPassword]);

  // Check dirty states
  useEffect(() => {
    const isProfileDirty = 
      profileName !== (user?.fullName || '') ||
      profileBio !== (user?.bio || '') ||
      JSON.stringify(profileTech) !== JSON.stringify(user?.techStack || []);

    const isSecurityDirty = 
      curPassword !== '' ||
      newPassword !== '' ||
      confirmPassword !== '';

    const isNotifDirty =
      notifWorkspace !== (user?.notifications?.workspaceUpdates ?? true) ||
      notifDMs !== (user?.notifications?.directMessages ?? true) ||
      notifMentions !== (user?.notifications?.mentions ?? true) ||
      notifEmail !== (user?.notifications?.emailDigest ?? false) ||
      notifPush !== (user?.notifications?.pushNotifications ?? true);

    const isAppDirty =
      compactMode !== (user?.appearance?.compactMode ?? false) ||
      animations !== (user?.appearance?.animations ?? true);

    const isAiDirty =
      openaiKey !== (user?.aiSettings?.openaiKey ?? '') ||
      geminiKey !== (user?.aiSettings?.geminiKey ?? '') ||
      defaultModel !== (user?.aiSettings?.defaultModel ?? 'GPT-4o (Recommended)') ||
      aiContext !== (user?.aiSettings?.contextAware ?? true) ||
      aiSummarize !== (user?.aiSettings?.autoSummarize ?? false);

    setIsDirty(isProfileDirty || isSecurityDirty || isNotifDirty || isAppDirty || isAiDirty);
  }, [
    profileName, profileBio, profileTech, curPassword, newPassword, confirmPassword,
    notifWorkspace, notifDMs, notifMentions, notifEmail, notifPush,
    compactMode, animations, openaiKey, geminiKey, defaultModel, aiContext, aiSummarize,
    user
  ]);

  // Handle Tab Switch Click
  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return;
    if (isDirty) {
      setPendingTab(tabId);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const confirmTabSwitch = () => {
    // Reset dirty fields
    setCurPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (user) {
      setProfileName(user.fullName || '');
      setProfileBio(user.bio || '');
      setProfileTech(user.techStack || []);
      setAvatarPreview(user.avatar || null);

      setNotifWorkspace(user.notifications?.workspaceUpdates ?? true);
      setNotifDMs(user.notifications?.directMessages ?? true);
      setNotifMentions(user.notifications?.mentions ?? true);
      setNotifEmail(user.notifications?.emailDigest ?? false);
      setNotifPush(user.notifications?.pushNotifications ?? true);

      setCompactMode(user.appearance?.compactMode ?? false);
      setAnimations(user.appearance?.animations ?? true);

      setOpenaiKey(user.aiSettings?.openaiKey ?? '');
      setGeminiKey(user.aiSettings?.geminiKey ?? '');
      setDefaultModel(user.aiSettings?.defaultModel ?? 'GPT-4o (Recommended)');
      setAiContext(user.aiSettings?.contextAware ?? true);
      setAiSummarize(user.aiSettings?.autoSummarize ?? false);
    }
    setIsDirty(false);
    setShowUnsavedModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  // Upload Photo handler (Converts to Base64 and updates profile)
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      try {
        setProfileSaving(true);
        const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
          avatar: base64String
        }, { withCredentials: true });
        
        toast.success("Profile photo updated successfully!");
        const updated = { ...authUser, user: res.data.user };
        localStorage.setItem("ChatApp", JSON.stringify(updated));
        setAuthUser(updated);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile photo.");
      } finally {
        setProfileSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo handler
  const handleRemovePhoto = async () => {
    if (!avatarPreview) return;
    try {
      setProfileSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        avatar: null
      }, { withCredentials: true });
      
      setAvatarPreview(null);
      toast.success("Profile photo removed.");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove profile photo.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setProfileSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        fullName: profileName,
        bio: profileBio,
        techStack: profileTech
      }, { withCredentials: true });

      toast.success("Profile settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!curPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    try {
      setSecuritySaving(true);
      await axios.put(`${API_URL}/api/auth/user/update-password`, {
        currentPassword: curPassword,
        newPassword
      }, { withCredentials: true });

      toast.success("Password changed successfully!");
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update password. Verify current password.");
    } finally {
      setSecuritySaving(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      setNotifSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        notifications: {
          workspaceUpdates: notifWorkspace,
          directMessages: notifDMs,
          mentions: notifMentions,
          emailDigest: notifEmail,
          pushNotifications: notifPush
        }
      }, { withCredentials: true });

      toast.success("Notification settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notifications.");
    } finally {
      setNotifSaving(false);
    }
  };

  // Save Appearance
  const handleSaveAppearance = async (e) => {
    e.preventDefault();
    try {
      setAppSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        appearance: {
          compactMode,
          animations
        }
      }, { withCredentials: true });

      toast.success("Appearance settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update appearance.");
    } finally {
      setAppSaving(false);
    }
  };

  // Save AI Settings
  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    try {
      setAiSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        aiSettings: {
          openaiKey,
          geminiKey,
          defaultModel,
          contextAware: aiContext,
          autoSummarize: aiSummarize
        }
      }, { withCredentials: true });

      toast.success("AI assistant configuration saved successfully!");
      localStorage.setItem('openai_api_key', openaiKey);
      localStorage.setItem('gemini_api_key', geminiKey);
      
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save AI configuration.");
    } finally {
      setAiSaving(false);
    }
  };

  // Revoke active session mock
  const handleRevokeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Session revoked successfully.");
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API_URL}/api/auth/user/delete-account`, { withCredentials: true });
      localStorage.removeItem("ChatApp");
      toast.success("Account permanently deleted.");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account.");
    }
  };

  // Logout all devices handler
  const handleLogoutAllDevices = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/user/logout`, {}, { withCredentials: true });
      localStorage.removeItem("ChatApp");
      toast.success("Logged out from all devices.");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("Failed to logout all devices.");
    }
  };

  // Tech Stack Tags management
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (profileTech.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setProfileTech(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    setProfileTech(prev => prev.filter(t => t !== tag));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      <DashboardLeftSide />

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 bg-background">
        <div className="max-w-[1400px] w-full mx-auto space-y-6">
          <DashboardHeader user={user} />

          {/* PAGE TITLE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
            <div>
              <p className="text-[10px] sm:text-xs text-primary font-bold tracking-widest mb-1 uppercase">DEVCOLLAB • USER SETTINGS</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary">Settings</h1>
              <p className="text-text-secondary text-xs sm:text-sm mt-0.5">Manage your workspace configuration, security, details, and visual styling.</p>
            </div>
            
            {/* Status indicator */}
            {isDirty && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning-soft/20 text-warning text-xs font-semibold border border-warning/20 self-start animate-pulse">
                <Info size={14} /> Unsaved changes in tab
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 pb-12">
            
            {/* TABS SIDEBAR (Desktop/Tablet) */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-none pb-2 lg:pb-0">
                <p className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-text-muted px-3.5 mb-2">Workspace & User</p>
                {TABS.slice(0, 5).map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 w-full text-left relative ${
                        isActive 
                          ? 'bg-primary text-white shadow-md shadow-primary/20' 
                          : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                      }`}
                    >
                      <tab.icon size={16} className={isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'} />
                      <span className="block font-bold leading-none">{tab.label}</span>
                      {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r" />}
                    </button>
                  );
                })}

                <p className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-text-muted px-3.5 mt-5 mb-2">Power Tools</p>
                {TABS.slice(5).map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 w-full text-left relative ${
                        isActive
                          ? tab.danger 
                            ? 'bg-error text-white shadow-md shadow-error/20' 
                            : 'bg-primary text-white shadow-md shadow-primary/20'
                          : tab.danger
                            ? 'text-error hover:bg-error-soft/10'
                            : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                      }`}
                    >
                      <tab.icon size={16} className={isActive ? 'text-white' : tab.danger ? 'text-error' : 'text-text-secondary'} />
                      <span className="font-bold leading-none">{tab.label}</span>
                      {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r" />}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* TAB PANELS */}
            <main className="flex-1 min-w-0 bg-card rounded-3xl border border-border-subtle p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 transition-all duration-300">
                
                {/* 1. PROFILE SETTINGS */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary">Profile Details</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Customize your personal visual card, bio, and technology stacks.</p>
                    </div>

                    {/* Avatar Uploader widget */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-border-subtle bg-surface">
                      <div className="relative">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-info flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border-subtle flex items-center justify-center text-text-primary hover:text-primary transition-colors shadow-md"
                        >
                          <Upload size={12} />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      
                      <div className="text-center sm:text-left space-y-1">
                        <h4 className="font-bold text-sm text-text-primary">Profile Photo</h4>
                        <p className="text-xs text-text-muted">Accepts JPG, PNG, GIF files. Maximum file size is 2MB.</p>
                        <div className="flex gap-2.5 pt-1 justify-center sm:justify-start">
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition"
                          >
                            Upload Photo
                          </button>
                          {avatarPreview && (
                            <button 
                              type="button" 
                              onClick={handleRemovePhoto}
                              className="px-3 py-1.5 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Full Name</label>
                        <input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Registered Email Address</label>
                        <input 
                          type="email" 
                          value={user?.email || ''} 
                          disabled 
                          className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-hover-bg text-text-muted text-sm opacity-60 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Short Bio / Headline</label>
                      <textarea 
                        rows={3} 
                        value={profileBio} 
                        onChange={(e) => setProfileBio(e.target.value)} 
                        placeholder="Say something about yourself..."
                        className="w-full p-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm"
                      />
                    </div>

                    {/* Tech tags */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Technology Stack Tags</label>
                      <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-border-subtle bg-surface min-h-[50px]">
                        {profileTech.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary-soft/15 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5 select-none animate-in scale-in-95">
                            {tag} 
                            <X size={11} className="cursor-pointer opacity-70 hover:opacity-100 hover:text-error transition" onClick={() => handleRemoveTag(tag)} />
                          </span>
                        ))}
                        
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input 
                            type="text" 
                            placeholder="Add tag..." 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            className="bg-transparent text-xs text-text-primary focus:outline-none w-20 flex-1 px-1 py-0.5 placeholder:text-text-muted/60"
                          />
                          <button 
                            type="button" 
                            onClick={handleAddTag}
                            className="p-1 rounded-md bg-hover-bg text-text-primary hover:text-primary transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4 border-t border-border-subtle">
                      <button 
                        type="submit" 
                        disabled={profileSaving}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-primary/10"
                      >
                        {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save Profile
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. ACCOUNT & INTEGRATIONS */}
                {activeTab === 'account' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary">Account Details & Integrations</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Control email addresses, workspace profiles, and third-party SaaS services.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface gap-4">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm">Account Status</h4>
                          <p className="text-xs text-text-muted mt-0.5">Authenticated via credentials provider.</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-success-soft text-success text-[10px] uppercase font-extrabold border border-success/20 self-start sm:self-auto">Verified</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface gap-4">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm">Workspace Membership</h4>
                          <p className="text-xs text-text-muted mt-0.5">Standard workspace workspace context identifier.</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-primary-soft/10 text-primary text-[10px] uppercase font-extrabold border border-primary/20 self-start sm:self-auto">Team Member</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Connected SaaS Accounts</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-border-subtle bg-surface flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-hover-bg rounded-xl text-text-primary">
                              <Github size={18} />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-text-primary">GitHub</span>
                              <span className="block text-[10px] text-success font-semibold">Connected</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setConnectedGithub(prev => !prev);
                              toast.success(connectedGithub ? "GitHub disconnected" : "GitHub connected");
                            }}
                            className={`text-xs font-bold transition-colors ${connectedGithub ? 'text-text-muted hover:text-error' : 'text-primary hover:text-primary-hover'}`}
                          >
                            {connectedGithub ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>

                        <div className="p-4 rounded-2xl border border-border-subtle bg-surface flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#0077b5]/10 rounded-xl text-[#0077b5]">
                              <Linkedin size={18} />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-text-primary">LinkedIn</span>
                              <span className="block text-[10px] text-text-muted">{connectedLinkedin ? 'Connected' : 'Not Connected'}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setConnectedLinkedin(prev => !prev);
                              toast.success(connectedLinkedin ? "LinkedIn disconnected" : "LinkedIn connected");
                            }}
                            className={`text-xs font-bold transition-colors ${connectedLinkedin ? 'text-text-muted hover:text-error' : 'text-primary hover:text-primary-hover'}`}
                          >
                            {connectedLinkedin ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SECURITY & PASSWORD */}
                {activeTab === 'security' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary">Security & Passwords</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Manage authentication passwords, key validation, and revoke sessions.</p>
                    </div>

                    {/* Change Password Form */}
                    <form onSubmit={handleSavePassword} className="space-y-4 p-5 rounded-2xl border border-border-subtle bg-surface relative">
                      <h3 className="text-sm font-bold text-text-primary">Change Password</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showCurPass ? 'text' : 'password'} 
                              value={curPassword} 
                              onChange={(e) => setCurPassword(e.target.value)} 
                              required
                              className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border-subtle bg-card text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowCurPass(prev => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                            >
                              {showCurPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">New Password</label>
                          <div className="relative">
                            <input 
                              type={showNewPass ? 'text' : 'password'} 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)} 
                              required
                              className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border-subtle bg-card text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowNewPass(prev => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                            >
                              {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Password strength meter */}
                        {newPassword && (
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
                              <span>Password Strength</span>
                              <span className="font-extrabold">{passwordStrength.label}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden flex gap-1">
                              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Confirm New Password</label>
                          <div className="relative">
                            <input 
                              type={showConfirmPass ? 'text' : 'password'} 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                              required
                              className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-border-subtle bg-card text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowConfirmPass(prev => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                            >
                              {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          type="submit" 
                          disabled={securitySaving}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-primary/10"
                        >
                          {securitySaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          Update Password
                        </button>
                      </div>
                    </form>

                    {/* Active Browser Sessions */}
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Active Browser Sessions</p>
                      
                      {sessions.map(s => {
                        const SvgIcon = s.icon;
                        return (
                          <div key={s.id} className="p-4 rounded-2xl border border-border-subtle bg-surface flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-primary-soft/10 text-primary rounded-xl">
                                <SvgIcon size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-text-primary">{s.device}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{s.location}</p>
                              </div>
                            </div>
                            
                            {s.active ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-success-soft text-success text-[10px] uppercase font-bold border border-success/20">Current</span>
                            ) : (
                              <button 
                                onClick={() => handleRevokeSession(s.id)}
                                className="text-xs font-bold text-text-muted hover:text-error transition"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <form onSubmit={handleSaveNotifications} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary">Notifications Preferences</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Control how and when you receive system alerts, mentions, and updates.</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Workspace Updates</span>
                          <span className="text-xs text-text-muted mt-0.5">Get notified when members join, push code, or settings change.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifWorkspace}
                          onClick={() => setNotifWorkspace(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifWorkspace ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${notifWorkspace ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Direct Messages</span>
                          <span className="text-xs text-text-muted mt-0.5">Receive audio/visual alerts for incoming direct chat messages.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifDMs}
                          onClick={() => setNotifDMs(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifDMs ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${notifDMs ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Mentions & Reactions</span>
                          <span className="text-xs text-text-muted mt-0.5">Get alerted when someone mentions you using @username.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifMentions}
                          onClick={() => setNotifMentions(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifMentions ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${notifMentions ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Email Digest</span>
                          <span className="text-xs text-text-muted mt-0.5">Daily summary email of activities you missed in your channels.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifEmail}
                          onClick={() => setNotifEmail(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifEmail ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${notifEmail ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Push Notifications</span>
                          <span className="text-xs text-text-muted mt-0.5">Enable browser desktop push notification banners.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifPush}
                          onClick={() => setNotifPush(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifPush ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${notifPush ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4 border-t border-border-subtle">
                      <button 
                        type="submit" 
                        disabled={notifSaving}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-primary/10"
                      >
                        {notifSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save Notifications
                      </button>
                    </div>
                  </form>
                )}

                {/* 5. APPEARANCE */}
                {activeTab === 'appearance' && (
                  <form onSubmit={handleSaveAppearance} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary">Appearance & Layout</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Customize theme styling, color templates, and space density preferences.</p>
                    </div>

                    {/* Theme Cards */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Application Theme</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <button 
                          type="button"
                          onClick={() => { setTheme('dark'); toast.success("Theme changed to Dark"); }}
                          className={`p-4 rounded-2xl border-2 text-left relative transition duration-300 ${
                            theme === 'dark' ? 'border-primary bg-primary/5 shadow-md' : 'border-border-subtle bg-surface hover:border-primary/30'
                          }`}
                        >
                          <div className="h-14 rounded-xl bg-slate-950 p-2 mb-3 flex flex-col gap-1.5 border border-white/5">
                            <div className="w-1/2 h-2 bg-white/10 rounded" />
                            <div className="w-3/4 h-2 bg-white/10 rounded" />
                          </div>
                          <span className="block text-sm font-bold text-text-primary">Dark Mode</span>
                          <span className="block text-[10px] text-text-muted mt-0.5">Default interface theme</span>
                          {theme === 'dark' && <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><CheckCircle size={10} className="text-white" /></div>}
                        </button>

                        <button 
                          type="button"
                          onClick={() => { setTheme('light'); toast.success("Theme changed to Light"); }}
                          className={`p-4 rounded-2xl border-2 text-left relative transition duration-300 ${
                            theme === 'light' ? 'border-primary bg-primary/5 shadow-md' : 'border-border-subtle bg-surface hover:border-primary/30'
                          }`}
                        >
                          <div className="h-14 rounded-xl bg-gray-100 p-2 mb-3 flex flex-col gap-1.5 border border-black/5">
                            <div className="w-1/2 h-2 bg-black/10 rounded" />
                            <div className="w-3/4 h-2 bg-black/10 rounded" />
                          </div>
                          <span className="block text-sm font-bold text-text-primary">Light Mode</span>
                          <span className="block text-[10px] text-text-muted mt-0.5">Bright aesthetic theme</span>
                          {theme === 'light' && <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><CheckCircle size={10} className="text-white" /></div>}
                        </button>

                        <button 
                          type="button"
                          onClick={() => { setTheme('dark'); toast.success("Synced with System Theme"); }}
                          className="p-4 rounded-2xl border-2 border-border-subtle bg-surface hover:border-primary/30 text-left relative transition duration-300"
                        >
                          <div className="h-14 rounded-xl bg-gradient-to-tr from-slate-950 to-gray-150 p-2 mb-3 flex flex-col gap-1.5 border border-border-subtle">
                            <div className="w-1/2 h-2 bg-white/10 rounded" />
                            <div className="w-3/4 h-2 bg-white/10 rounded" />
                          </div>
                          <span className="block text-sm font-bold text-text-primary">System Default</span>
                          <span className="block text-[10px] text-text-muted mt-0.5">Auto sync with system</span>
                        </button>
                      </div>
                    </div>

                    {/* Additional appearance toggles */}
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Layout Density</p>
                      
                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Compact Chat Density</span>
                          <span className="text-xs text-text-muted mt-0.5">Reduce message spacing to maximize vertical chat layout.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          onClick={() => setCompactMode(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${compactMode ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${compactMode ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Enable Micro-Animations</span>
                          <span className="text-xs text-text-muted mt-0.5">Smooth visual physics on buttons, tabs, and navigation links.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          onClick={() => setAnimations(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${animations ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${animations ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4 border-t border-border-subtle">
                      <button 
                        type="submit" 
                        disabled={appSaving}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-primary/10"
                      >
                        {appSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save Appearance
                      </button>
                    </div>
                  </form>
                )}

                {/* 6. AI ASSISTANT SETTINGS */}
                {activeTab === 'ai' && (
                  <form onSubmit={handleSaveAISettings} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
                        <Bot className="text-primary" size={24} /> AI Assistant Configuration
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5">Adjust OpenAI API keys, token filters, and auto-summarizer capabilities.</p>
                    </div>

                    <div className="p-5 rounded-2xl border border-primary/25 bg-primary-soft/10 relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                      <p className="text-sm font-bold text-text-primary relative z-10">Model Access Keys</p>
                      
                      <div className="space-y-3 relative z-10">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">OpenAI API Key</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                            <input 
                              type="password" 
                              placeholder="sk-........................................" 
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono text-xs shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Gemini API Key</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                            <input 
                              type="password" 
                              placeholder="AIzaSy...................................." 
                              value={geminiKey}
                              onChange={(e) => setGeminiKey(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono text-xs shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Default AI Chat Model</label>
                          <select 
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-card text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          >
                            <option value="GPT-4o (Recommended)">GPT-4o (Recommended)</option>
                            <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                            <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">AI Features</p>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Context-Aware AI Answers</span>
                          <span className="text-xs text-text-muted mt-0.5">Let AI read active workspace channels context for responsive suggestions.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={aiContext}
                          onClick={() => setAiContext(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${aiContext ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${aiContext ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm font-semibold text-text-primary">Auto-Summarize Long Threads</span>
                          <span className="text-xs text-text-muted mt-0.5">Generate small summary widgets on long unread conversation channels.</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={aiSummarize}
                          onClick={() => setAiSummarize(c => !c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${aiSummarize ? 'bg-primary' : 'bg-border-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${aiSummarize ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border-subtle">
                      <button 
                        type="submit"
                        disabled={aiSaving}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-primary/10"
                      >
                        {aiSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save AI Configuration
                      </button>
                    </div>
                  </form>
                )}

                {/* 7. DANGER ZONE */}
                {activeTab === 'danger' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div>
                      <h2 className="text-xl font-extrabold text-error">Danger Zone</h2>
                      <p className="text-xs text-text-secondary mt-0.5">Critical operations that mutate account metadata irreversibly. Proceed with caution.</p>
                    </div>

                    <div className="rounded-2xl border border-error/35 bg-error-soft/5 overflow-hidden divide-y divide-error/15">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-error-soft/10 transition-colors">
                        <div>
                          <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                            <LogOut size={16} className="text-error" /> Logout All Sessions
                          </h4>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">Instantly revoke login tokens on all browsers, mobile instances, and active terminals.</p>
                        </div>
                        <button 
                          onClick={() => setShowLogoutDevicesModal(true)}
                          className="shrink-0 px-4 py-2 rounded-xl border border-border-subtle bg-card text-text-primary text-xs font-bold hover:bg-hover-bg transition"
                        >
                          Revoke Sessions
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-error-soft/10 transition-colors">
                        <div>
                          <h4 className="font-bold text-error text-sm flex items-center gap-2">
                            <Trash2 size={16} /> Delete Account Permanently
                          </h4>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">Permanently delete your profile database profile, active workspaces, and all chat records. This cannot be undone.</p>
                        </div>
                        <button 
                          onClick={() => setShowDeleteModal(true)}
                          className="shrink-0 px-4 py-2 rounded-xl bg-error hover:bg-red-600 text-white text-xs font-bold transition"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </main>

          </div>
        </div>
      </div>

      {/* UNSAVED CHANGES MODAL */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border-subtle shadow-popover p-6 space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <div className="p-2.5 bg-warning-soft/20 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-extrabold text-base text-text-primary">Unsaved Changes</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              You have modified settings in this tab. If you switch tabs without saving, these changes will be discarded.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setShowUnsavedModal(false)}
                className="px-3.5 py-2 bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold rounded-xl transition"
              >
                Keep Editing
              </button>
              <button 
                onClick={confirmTabSwitch}
                className="px-3.5 py-2 bg-warning hover:bg-yellow-600 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT ALL DEVICES MODAL */}
      {showLogoutDevicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border-subtle shadow-popover p-6 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="p-2.5 bg-error-soft/20 rounded-xl">
                <LogOut size={20} />
              </div>
              <h3 className="font-extrabold text-base text-text-primary">Logout All Devices</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to end all active sessions across all devices? You will be forced to log in again.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setShowLogoutDevicesModal(false)}
                className="px-3.5 py-2 bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogoutAllDevices}
                className="px-3.5 py-2 bg-error hover:bg-red-600 text-white text-xs font-bold rounded-xl transition"
              >
                Logout All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border-subtle shadow-popover p-6 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="p-2.5 bg-error-soft/20 rounded-xl">
                <Trash2 size={20} />
              </div>
              <h3 className="font-extrabold text-base text-text-primary">Delete Account</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              This action is extremely critical and irreversible. It will wipe your chat logs, workspaces, files, and repositories.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="px-3.5 py-2 bg-error hover:bg-red-600 text-white text-xs font-bold rounded-xl transition"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
