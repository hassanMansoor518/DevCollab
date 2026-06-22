import React, { useState, useEffect } from 'react';
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import { useAuth } from '../../context/AuthProvider';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Mail, Key, Bell, Palette, Bot, AlertTriangle, Info, LogOut, Trash2
} from 'lucide-react';

// Hooks
import { useSettingsForm } from './hooks/useSettingsForm';
import { useProfileUpload } from './hooks/useProfileUpload';

// Tabs
import ProfileSettings from './tabs/ProfileSettings';
import AccountSettings from './tabs/AccountSettings';
import SecuritySettings from './tabs/SecuritySettings';
import NotificationSettings from './tabs/NotificationSettings';
import AppearanceSettings from './tabs/AppearanceSettings';
import AiSettings from './tabs/AiSettings';
import DangerSettings from './tabs/DangerSettings';

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
  const user = authUser?.user;

  // Active Tab loaded from localStorage if exists, default to 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('active_settings_tab') || 'profile';
  });

  const [pendingTab, setPendingTab] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutDevicesModal, setShowLogoutDevicesModal] = useState(false);

  // Custom Hooks for State Management
  const formState = useSettingsForm(user, authUser, setAuthUser);
  const uploadState = useProfileUpload(user, authUser, setAuthUser);
  const { isDirty, resetFormState } = formState;

  // Save active tab in local storage
  useEffect(() => {
    localStorage.setItem('active_settings_tab', activeTab);
  }, [activeTab]);

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
    resetFormState();
    setShowUnsavedModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
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
                {activeTab === 'profile' && <ProfileSettings user={user} formState={formState} uploadState={uploadState} />}
                {activeTab === 'account' && <AccountSettings formState={formState} />}
                {activeTab === 'security' && <SecuritySettings formState={formState} />}
                {activeTab === 'notifications' && <NotificationSettings formState={formState} />}
                {activeTab === 'appearance' && <AppearanceSettings formState={formState} />}
                {activeTab === 'ai' && <AiSettings formState={formState} />}
                {activeTab === 'danger' && <DangerSettings onShowLogoutModal={() => setShowLogoutDevicesModal(true)} onShowDeleteModal={() => setShowDeleteModal(true)} />}
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
