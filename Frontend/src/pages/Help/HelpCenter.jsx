import React, { useState } from 'react';
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import { Search, Book, Hash, MessageSquare, Briefcase, Bot, Settings, Mail, MessageCircle, Bug, Lightbulb, Activity, ChevronDown, ChevronUp, Github, LayoutGrid } from 'lucide-react';

const QUICK_ACTIONS = [
    { icon: Book,          title: 'Getting Started',    desc: 'Learn the basics and set up your profile.' },
    { icon: Hash,          title: 'Workspaces',         desc: 'Manage teams, roles, and permissions.' },
    { icon: MessageSquare, title: 'Chat & Messaging',   desc: 'Channels, DMs, and communication tools.' },
    { icon: LayoutGrid,    title: 'Projects',           desc: 'Task tracking and agile boards.' },
    { icon: Bot,           title: 'AI Assistant',       desc: 'Use AI to write code and summarize chats.' },
    { icon: Settings,      title: 'Account Settings',   desc: 'Security, billing, and preferences.' },
];

const ARTICLES = [
    'How to create a workspace',
    'Invite team members',
    'Manage permissions',
    'Use AI assistant',
    'Connect GitHub',
    'Manage notifications',
];

const FAQS = [
    { q: 'How do I create a workspace?', a: "Click the '+ New' button in the left sidebar under Workspaces. Enter a name and you're ready to go." },
    { q: 'How do I invite members?',     a: "Inside your workspace, click 'Invite' in the header or go to Workspace Settings > Permissions to add members by email." },
    { q: 'How do I reset my password?',  a: "Go to Account Settings → Security and click 'Reset Password' to receive a recovery link via email." },
    { q: 'How do I use AI Assistant?',   a: "Type '@ai' in any chat input or use the dedicated AI panel on the right sidebar to start interacting with DevCollab AI." },
    { q: 'How do I leave a workspace?',  a: "Open the Workspace Details drawer, scroll to the 'Danger Zone' at the bottom, and select 'Leave Workspace'." },
];

const STATUS = [
    { name: 'API Status',    color: 'bg-success' },
    { name: 'Chat Service',  color: 'bg-success' },
    { name: 'AI Service',    color: 'bg-success' },
    { name: 'Database',      color: 'bg-success' },
];

export default function HelpCenter() {
    const authUser = JSON.parse(localStorage.getItem('ChatApp') || '{}');
    const user = authUser?.user;

    const [search, setSearch]   = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    const filteredArticles = ARTICLES.filter(a => a.toLowerCase().includes(search.toLowerCase()));
    const filteredFaqs     = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-screen overflow-hidden bg-background text-text-primary">
            <DashboardLeftSide />

            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 bg-background">
                <div className="max-w-[1400px] w-full mx-auto">
                    <DashboardHeader user={user} />

                    {/* HERO */}
                    <section className="mt-6 sm:mt-8 mb-8 relative overflow-hidden rounded-3xl border border-border-subtle bg-card shadow-sm p-6 sm:p-10 text-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[10px] sm:text-xs text-primary font-bold tracking-widest mb-2">DEVCOLLAB • HELP CENTER</p>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary mb-3">How can we help you today?</h1>
                            <p className="text-sm text-text-secondary max-w-xl mx-auto mb-7">Browse our knowledge base, explore categories, or search for guides and FAQs.</p>
                            <div className="relative max-w-xl mx-auto group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search articles, guides, FAQs..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full h-12 pl-11 pr-5 rounded-2xl border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted shadow-sm"
                                />
                            </div>
                        </div>
                    </section>

                    {/* QUICK ACTIONS */}
                    <section className="mb-8">
                        <h2 className="text-base font-bold text-text-primary mb-4">Browse Categories</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {QUICK_ACTIONS.map((a, i) => (
                                <div key={i} className="group p-5 rounded-2xl border border-border-subtle bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 cursor-pointer transition-all duration-300">
                                    <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <a.icon size={20} />
                                    </div>
                                    <h3 className="text-sm font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">{a.title}</h3>
                                    <p className="text-xs text-text-muted leading-relaxed">{a.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* MAIN GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                        {/* LEFT: FAQs + Community */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* FAQs */}
                            <section>
                                <h2 className="text-base font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
                                <div className="space-y-2">
                                    {(search ? filteredFaqs : FAQS).length === 0 ? (
                                        <div className="text-center py-8 text-text-muted text-sm bg-card rounded-2xl border border-border-subtle">No matching FAQs found for "{search}"</div>
                                    ) : (search ? filteredFaqs : FAQS).map((faq, idx) => (
                                        <div key={idx} className="rounded-2xl border border-border-subtle bg-card overflow-hidden">
                                            <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-hover-bg transition-colors">
                                                <span className="font-semibold text-text-primary pr-4 text-sm">{faq.q}</span>
                                                {openFaq === idx
                                                    ? <ChevronUp size={16} className="shrink-0 text-primary" />
                                                    : <ChevronDown size={16} className="shrink-0 text-text-muted" />}
                                            </button>
                                            <div className={`px-5 text-text-secondary text-sm leading-relaxed transition-all duration-300 ${openFaq === idx ? 'pb-5 opacity-100' : 'max-h-0 overflow-hidden opacity-0 py-0'}`}>
                                                {faq.a}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Community */}
                            <section>
                                <h2 className="text-base font-bold text-text-primary mb-4">Join the Community</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl border border-border-subtle bg-card hover:bg-hover-bg cursor-pointer transition-colors flex items-center gap-4 group">
                                        <div className="p-3 bg-[#5865F2]/10 text-[#5865F2] rounded-xl group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-text-primary">Discord Server</h4>
                                            <p className="text-xs text-text-muted mt-0.5">Chat with the community</p>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl border border-border-subtle bg-card hover:bg-hover-bg cursor-pointer transition-colors flex items-center gap-4 group">
                                        <div className="p-3 bg-hover-bg text-text-primary rounded-xl group-hover:scale-110 transition-transform"><Github size={20} /></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-text-primary">GitHub Discussions</h4>
                                            <p className="text-xs text-text-muted mt-0.5">Report bugs & suggest ideas</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: Articles, Status, Support */}
                        <div className="space-y-6">
                            {/* Articles */}
                            <section className="p-5 rounded-2xl border border-border-subtle bg-card">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Popular Articles</p>
                                <ul className="space-y-3">
                                    {(search ? filteredArticles : ARTICLES).map((a, i) => (
                                        <li key={i}>
                                            <button className="w-full text-left text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-2.5 group">
                                                <div className="p-1.5 rounded-md bg-surface border border-border-subtle group-hover:border-primary/30 group-hover:text-primary shrink-0 transition-colors">
                                                    <Book size={12} className="text-text-muted group-hover:text-primary" />
                                                </div>
                                                {a}
                                            </button>
                                        </li>
                                    ))}
                                    {search && filteredArticles.length === 0 && <li className="text-xs text-text-muted">No articles match your search.</li>}
                                </ul>
                            </section>

                            {/* System Status */}
                            <section className="p-5 rounded-2xl border border-border-subtle bg-card">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-1.5"><Activity size={12} className="text-success" /> System Status</p>
                                <ul className="space-y-3">
                                    {STATUS.map(s => (
                                        <li key={s.name} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-text-secondary">{s.name}</span>
                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-text-primary bg-surface px-2 py-1 rounded-md border border-border-subtle">
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} /> Operational
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Contact */}
                            <section className="p-5 rounded-2xl border border-primary/20 bg-primary-soft/10">
                                <h3 className="text-sm font-bold text-primary mb-1">Still need help?</h3>
                                <p className="text-xs text-primary/70 mb-4 leading-relaxed">Can't find what you're looking for? Our support team is here to help.</p>
                                <button className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm">
                                    Contact Support
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
