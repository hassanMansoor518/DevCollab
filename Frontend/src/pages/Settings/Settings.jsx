import React, { useState } from 'react';
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import {
    User, Mail, Shield, Bell, Palette, Bot, AlertTriangle,
    Upload, CheckCircle, Github, Linkedin, Monitor, Smartphone,
    Key, LogOut, Trash2
} from 'lucide-react';

const X = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

function Toggle({ title, desc, defaultChecked = true }) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className="flex items-center justify-between p-5 rounded-2xl border border-border-subtle bg-surface hover:border-primary/30 transition-colors">
            <div className="flex flex-col pr-4">
                <span className="text-sm font-semibold text-text-primary">{title}</span>
                <span className="text-xs text-text-muted mt-0.5">{desc}</span>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                onClick={() => setChecked(c => !c)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'bg-primary' : 'bg-border-strong'}`}
            >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function ProfileTab({ user }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Profile Settings</h2>
                <p className="text-sm text-text-secondary mt-1">Manage your public profile information.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border border-border-subtle bg-card shadow-sm">
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-info flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/20">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border-subtle flex items-center justify-center text-text-primary hover:text-primary transition-colors shadow-sm">
                        <Upload size={13} />
                    </button>
                </div>
                <div>
                    <h4 className="font-semibold text-text-primary">Profile Photo</h4>
                    <p className="text-xs text-text-muted mt-1 mb-3">Upload a photo. Minimum 200×200px.</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">Upload</button>
                        <button className="px-4 py-2 rounded-xl bg-hover-bg text-text-primary text-sm font-semibold hover:bg-border-subtle transition-colors">Remove</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
                    <input type="text" defaultValue={user?.fullName || ''} className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-hover-bg text-text-muted opacity-70 cursor-not-allowed" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Bio</label>
                <textarea rows={3} defaultValue="Full-stack developer building awesome tools." className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tech Stack</label>
                <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'MongoDB'].map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-lg bg-primary-soft text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5">{tag} <X size={11} className="cursor-pointer opacity-60 hover:opacity-100" /></span>
                    ))}
                    <button className="px-3 py-1 rounded-lg bg-hover-bg text-text-secondary text-xs font-bold border border-dashed border-border-default hover:text-text-primary transition-colors">+ Add Tag</button>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
                <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 flex items-center gap-2">
                    <CheckCircle size={15} /> Save Changes
                </button>
            </div>
        </div>
    );
}

function AccountTab({ user }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Account Security</h2>
                <p className="text-sm text-text-secondary mt-1">Manage your credentials and connected services.</p>
            </div>
            <div className="space-y-3">
                {[
                    { label: 'Email Address', sub: user?.email || 'user@example.com', btn: 'Change Email' },
                    { label: 'Password', sub: 'Last changed 3 months ago', btn: 'Update Password' },
                    { label: 'Two-Factor Authentication', sub: 'Add an extra layer of security', btn: 'Manage 2FA', badge: 'Enabled' },
                ].map(item => (
                    <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border-subtle bg-card gap-4">
                        <div>
                            <h4 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                {item.label}
                                {item.badge && <span className="px-2 py-0.5 rounded-md bg-success-soft text-success text-[10px] uppercase font-bold border border-success/20">{item.badge}</span>}
                            </h4>
                            <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
                        </div>
                        <button className="shrink-0 px-4 py-2 rounded-xl bg-hover-bg text-text-primary text-sm font-semibold hover:bg-border-subtle transition-colors">{item.btn}</button>
                    </div>
                ))}
            </div>
            <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">Connected Accounts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border-subtle bg-card flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-hover-bg rounded-lg text-text-primary"><Github size={17} /></div><span className="text-sm font-semibold text-text-primary">GitHub</span></div>
                        <button className="text-xs font-bold text-text-muted hover:text-error transition-colors">Disconnect</button>
                    </div>
                    <div className="p-4 rounded-xl border border-border-subtle bg-card flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 bg-[#0077b5]/10 rounded-lg text-[#0077b5]"><Linkedin size={17} /></div><span className="text-sm font-semibold text-text-primary">LinkedIn</span></div>
                        <button className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Connect</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotificationsTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Notifications</h2>
                <p className="text-sm text-text-secondary mt-1">Control how and when you receive alerts.</p>
            </div>
            <div className="space-y-3">
                <Toggle title="Workspace Updates" desc="Get notified when members join or settings change." />
                <Toggle title="Direct Messages" desc="Receive notifications for direct messages." />
                <Toggle title="Mentions" desc="Get alerted when someone @-mentions you." />
                <Toggle title="Email Digest" desc="Daily email summary of missed activity." defaultChecked={false} />
                <Toggle title="Push Notifications" desc="Enable browser push notifications." />
            </div>
        </div>
    );
}

function AppearanceTab() {
    const [theme, setTheme] = useState('dark');
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Appearance</h2>
                <p className="text-sm text-text-secondary mt-1">Customize the look and feel of DevCollab.</p>
            </div>
            <div className="space-y-4">
                <p className="text-sm font-semibold text-text-primary">Theme</p>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'dark', label: 'Dark', bg: 'bg-[#0f172a]', stripe: 'bg-white/10' },
                        { id: 'light', label: 'Light', bg: 'bg-gray-100', stripe: 'bg-black/10' },
                        { id: 'system', label: 'System', bg: 'bg-gradient-to-br from-[#0f172a] to-gray-100', stripe: 'bg-white/5' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTheme(t.id)} className="group">
                            <div className={`h-20 rounded-xl border-2 ${theme === t.id ? 'border-primary shadow-md shadow-primary/15' : 'border-border-subtle group-hover:border-primary/40'} ${t.bg} p-2 mb-2 flex flex-col gap-1.5 relative transition-colors`}>
                                <div className={`w-1/2 h-2 ${t.stripe} rounded`} />
                                <div className={`w-3/4 h-2 ${t.stripe} rounded`} />
                                {theme === t.id && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><CheckCircle size={9} className="text-white" /></div>}
                            </div>
                            <p className={`text-center text-xs font-semibold transition-colors ${theme === t.id ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>{t.label}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Options</p>
                <Toggle title="Compact Mode" desc="Reduce spacing to fit more content on screen." defaultChecked={false} />
                <Toggle title="Animations" desc="Enable smooth UI transitions and micro-animations." />
            </div>
        </div>
    );
}

function PrivacyTab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Privacy & Security</h2>
                <p className="text-sm text-text-secondary mt-1">Manage visibility and active sessions.</p>
            </div>
            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Visibility</p>
                <Toggle title="Public Profile" desc="Allow anyone to view your profile and tech stack." />
                <Toggle title="Show Online Status" desc="Let others know when you are active." />
            </div>
            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Active Sessions</p>
                <div className="p-4 rounded-2xl border border-border-subtle bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-soft text-primary rounded-xl"><Monitor size={18} /></div>
                        <div>
                            <p className="text-sm font-bold text-text-primary">Windows · Chrome</p>
                            <p className="text-xs text-text-muted mt-0.5">Current session</p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-success-soft text-success text-xs font-bold border border-success/20">Active</span>
                </div>
                <div className="p-4 rounded-2xl border border-border-subtle bg-card flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-hover-bg text-text-muted rounded-xl"><Smartphone size={18} /></div>
                        <div>
                            <p className="text-sm font-bold text-text-primary">iPhone · Safari</p>
                            <p className="text-xs text-text-muted mt-0.5">Last active 2 days ago</p>
                        </div>
                    </div>
                    <button className="text-xs font-bold text-text-muted hover:text-error transition-colors">Revoke</button>
                </div>
            </div>
        </div>
    );
}

function AITab() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-2"><Bot className="text-primary" size={26} /> AI Assistant</h2>
                <p className="text-sm text-text-secondary mt-1">Configure API keys and AI model preferences.</p>
            </div>
            <div className="p-5 rounded-2xl border border-primary/25 bg-primary-soft/10 relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                <p className="text-sm font-bold text-text-primary relative z-10">API Keys</p>
                {[
                    { label: 'OpenAI API Key', placeholder: 'sk-...' },
                    { label: 'Gemini API Key', placeholder: 'AIza...' },
                ].map(k => (
                    <div key={k.label} className="space-y-2 relative z-10">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{k.label}</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                            <input type="password" placeholder={k.placeholder} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm" />
                        </div>
                    </div>
                ))}
                <div className="space-y-2 relative z-10">
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Default Model</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-card text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm">
                        <option>GPT-4o (Recommended)</option>
                        <option>GPT-3.5 Turbo</option>
                        <option>Gemini 1.5 Pro</option>
                    </select>
                </div>
            </div>
            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Preferences</p>
                <Toggle title="Context-Aware Responses" desc="Allow AI to read workspace chat context for better answers." />
                <Toggle title="Auto-Summarize Threads" desc="Generate summaries for long unread message threads." defaultChecked={false} />
            </div>
            <div className="flex justify-end pt-2 border-t border-border-subtle">
                <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 flex items-center gap-2">
                    <CheckCircle size={15} /> Save AI Settings
                </button>
            </div>
        </div>
    );
}

function DangerTab() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-error">Danger Zone</h2>
                <p className="text-sm text-text-secondary mt-1">These actions are irreversible. Proceed with extreme caution.</p>
            </div>
            <div className="rounded-2xl border border-error/30 bg-error-soft/10 overflow-hidden divide-y divide-error/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-error-soft/20 transition-colors">
                    <div>
                        <h4 className="font-bold text-text-primary text-sm flex items-center gap-2"><LogOut size={15} className="text-error" /> Logout All Devices</h4>
                        <p className="text-xs text-text-muted mt-1">End all active sessions across every device.</p>
                    </div>
                    <button className="shrink-0 px-4 py-2 rounded-xl border border-border-subtle bg-card text-text-primary text-sm font-semibold hover:bg-hover-bg transition-colors">Log Out All</button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-error-soft/20 transition-colors">
                    <div>
                        <h4 className="font-bold text-error text-sm flex items-center gap-2"><Trash2 size={15} /> Delete Account</h4>
                        <p className="text-xs text-text-muted mt-1">Permanently delete your account, workspaces, and all data. Cannot be undone.</p>
                    </div>
                    <button className="shrink-0 px-4 py-2 rounded-xl bg-error text-white text-sm font-bold hover:bg-red-600 transition-colors">Delete Account</button>
                </div>
            </div>
        </div>
    );
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const authUser = JSON.parse(localStorage.getItem('ChatApp') || '{}');
    const user = authUser?.user;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileTab user={user} />;
            case 'account': return <AccountTab user={user} />;
            case 'notifications': return <NotificationsTab />;
            case 'appearance': return <AppearanceTab />;
            case 'privacy': return <PrivacyTab />;
            case 'ai': return <AITab />;
            case 'danger': return <DangerTab />;
            default: return <ProfileTab user={user} />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-text-primary">
            <DashboardLeftSide />

            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 bg-background">
                <div className="max-w-[1400px] w-full mx-auto">
                    <DashboardHeader user={user} />

                    <div className="mt-6 sm:mt-8 mb-6">
                        <p className="text-[10px] sm:text-xs text-primary font-bold tracking-widest mb-1">DEVCOLLAB • USER SETTINGS</p>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary">Settings</h1>
                        <p className="text-text-secondary text-xs sm:text-sm mt-1">Manage your profile, security, and preferences.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pb-10">
                        {/* LEFT TABS NAV */}
                        <aside className="w-full md:w-56 lg:w-60 shrink-0">
                            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none pb-2 md:pb-0">
                                <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mb-2">User Settings</p>
                                {TABS.slice(0, 5).map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'}`}>
                                        <tab.icon size={16} className={activeTab === tab.id ? 'text-white/90' : ''} />
                                        {tab.label}
                                    </button>
                                ))}
                                <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mt-4 mb-2">Advanced</p>
                                {TABS.slice(5).map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? tab.danger ? 'bg-error-soft text-error' : 'bg-primary text-white shadow-md shadow-primary/20' : tab.danger ? 'text-error hover:bg-error-soft/50' : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'}`}>
                                        <tab.icon size={16} className={activeTab === tab.id && !tab.danger ? 'text-white/90' : tab.danger ? 'text-error' : ''} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* CONTENT */}
                        <main className="flex-1 min-w-0 bg-card rounded-2xl border border-border-subtle p-6 md:p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                {renderContent()}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
