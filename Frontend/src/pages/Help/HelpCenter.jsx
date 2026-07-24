import React, { useState, useEffect } from 'react';
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import { useAuth } from "../../context/AuthProvider";
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Search, Book, Hash, MessageSquare, Bot, Settings, Mail, 
  ChevronDown, ChevronUp, Github, LayoutGrid, Activity, 
  X, CheckCircle, Clock, AlertCircle, Sparkles, Send, FilterX 
} from 'lucide-react';

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f16f.up.railway.app");

const QUICK_ACTIONS = [
  { id: 'getting-started', icon: Book,          title: 'Getting Started',    desc: 'Learn the basics and set up your profile.' },
  { id: 'workspaces',      icon: Hash,          title: 'Workspaces',         desc: 'Manage teams, roles, and permissions.' },
  { id: 'chat',            icon: MessageSquare, title: 'Chat & Messaging',   desc: 'Channels, DMs, and communication tools.' },
  { id: 'projects',        icon: LayoutGrid,    title: 'Projects',           desc: 'Task tracking and agile boards.' },
  { id: 'ai',              icon: Bot,           title: 'AI Assistant',       desc: 'Use AI to write code and summarize chats.' },
  { id: 'settings',        icon: Settings,      title: 'Account Settings',   desc: 'Security, billing, and preferences.' },
];

const ARTICLES = [
  { 
    title: 'How to create a workspace', 
    category: 'workspaces', 
    content: `A workspace is the central hub for your team's communication, projects, and AI integrations.

### Step-by-Step Guide:
1. Navigate to the **Dashboard** page using the left sidebar.
2. Under the **Workspaces** section in the sidebar, click the **+ New** button.
3. In the popup dialog, enter a **Workspace Name** (e.g. *Frontend Team* or *Marketing*).
4. Click **Create Workspace**.
5. Once created, you will be redirected to the workspace. You can now invite members and start collaborating!` 
  },
  { 
    title: 'Invite team members', 
    category: 'workspaces', 
    content: `Collaboration is key. You can invite your developers and team members directly using their email.

### Step-by-Step Guide:
1. Select the workspace you want to invite members to.
2. In the top header area of the chat workspace, click the **Invite** button.
3. Enter the email address of the team member you wish to invite.
4. Click the **Send Invitation** button.
5. The invited member will receive an email invitation to sign up and join your workspace!` 
  },
  { 
    title: 'Manage permissions', 
    category: 'workspaces', 
    content: `Control who has access to write messages, create projects, or manage settings inside a workspace.

### Available Roles:
* **Owner**: Full control over the workspace, including deletion, renaming, and billing settings.
* **Admin**: Can manage channels, invite members, and configure settings.
* **Member**: Standard access to chat, write messages, and participate in projects.

### Changing Permissions:
1. Open the Workspace settings by clicking the **Settings** gear icon in the active workspace header.
2. Go to **Permissions / Members** tab.
3. Select the member whose role you want to update.
4. Choose the appropriate role from the dropdown menu and click **Save Changes**.` 
  },
  { 
    title: 'Use AI assistant', 
    category: 'ai', 
    content: `DevCollab AI is built to help you write code, summarize discussions, and analyze repositories.

### In Chat:
* Type \`@ai\` followed by your query in any chat input (e.g., \`@ai write a react hook for local storage\`).
* The AI will process your query and reply directly in the chat.

### Dedicated AI Assistant Panel:
1. Click the **AI Assistant** tab in the main sidebar.
2. Use the dedicated full-screen interface to discuss coding problems or paste script snippets for review.
3. Select files from the project context panel to include them in the conversation.` 
  },
  { 
    title: 'Connect GitHub', 
    category: 'projects', 
    content: `Integrate your repository commits and branches directly into DevCollab to track project history.

### Step-by-Step Guide:
1. Navigate to the **Projects** dashboard from the left sidebar.
2. Click **Create Project** or edit an existing one.
3. Provide your GitHub Repository Owner/Name (e.g., \`octocat/hello-world\`).
4. Click **Sync Repo**.
5. You will see a live commit feed and be able to run AI code audits and analysis on your codebase!` 
  },
  { 
    title: 'Manage notifications', 
    category: 'settings', 
    content: `Stay updated with important updates without getting overwhelmed.

### Step-by-Step Guide:
1. Navigate to the **Settings** page from the sidebar.
2. Go to the **Notifications** tab.
3. Toggle settings for:
   * **Direct Messages**: Push notifications and sound alerts.
   * **Workspace Messages**: Mentions-only or all messages.
   * **Email Digest**: Daily summary of activities.
4. Settings are auto-saved. You can mute specific chats directly from the active chat's settings drawer.` 
  },
];

const FAQS = [
  { q: 'How do I create a workspace?', a: "Click the '+ New' button in the left sidebar under Workspaces. Enter a name and you're ready to go.", category: 'workspaces' },
  { q: 'How do I invite members?',     a: "Inside your workspace, click 'Invite' in the header or go to Workspace Settings > Permissions to add members by email.", category: 'workspaces' },
  { q: 'How do I reset my password?',  a: "Go to Account Settings → Security and click 'Reset Password' to receive a recovery link via email.", category: 'settings' },
  { q: 'How do I use AI Assistant?',   a: "Type '@ai' in any chat input or use the dedicated AI panel on the right sidebar to start interacting with DevCollab AI.", category: 'ai' },
  { q: 'How do I leave a workspace?',  a: "Open the Workspace Details drawer, scroll to the 'Danger Zone' at the bottom, and select 'Leave Workspace'.", category: 'workspaces' },
  { q: 'How do I check system health?', a: "Check the Live System Status panel on the right side of the Help Center. All services are tracked in real-time.", category: 'getting-started' },
];

const STATUS = [
  { name: 'API Status',    color: 'bg-success' },
  { name: 'Chat Service',  color: 'bg-success' },
  { name: 'AI Service',    color: 'bg-success' },
  { name: 'Database',      color: 'bg-success' },
];

export default function HelpCenter() {
  const [authData] = useAuth();
  const user = authData?.user;

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Modal States
  const [activeArticle, setActiveArticle] = useState(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Tickets list
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Support Form Fields
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical Issue');
  const [ticketMessage, setTicketMessage] = useState('');

  // Fetch Tickets on Mount
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await axios.get(`${API_URL}/api/support`, { withCredentials: true });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Filter Logic
  const filteredArticles = ARTICLES.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = FAQS.filter(f => {
    const matchesSearch = f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? f.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    setOpenFaq(null); // Close active FAQ accordion on filter change
  };

  const handleArticleClick = (title) => {
    const article = ARTICLES.find(art => art.title === title);
    if (article) {
      setActiveArticle(article);
    }
  };

  // Support Ticket Submit Handler
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setSubmittingTicket(true);
      const res = await axios.post(`${API_URL}/api/support`, {
        name: user?.fullName || 'User',
        email: user?.email || 'email@example.com',
        subject: ticketSubject,
        category: ticketCategory,
        message: ticketMessage
      }, { withCredentials: true });

      toast.success("Support ticket submitted successfully!");
      
      // Update UI list
      if (res.data.ticket) {
        setTickets(prev => [res.data.ticket, ...prev]);
      }

      // Reset & close
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('Technical Issue');
      setIsSupportModalOpen(false);
    } catch (err) {
      console.error("Error submitting support ticket:", err);
      toast.error(err.response?.data?.error || "Failed to submit support ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      <DashboardLeftSide />

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 bg-background">
        <div className="max-w-[1400px] w-full mx-auto space-y-6">
          <DashboardHeader user={user} />

          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-card shadow-sm p-6 sm:p-10 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs text-primary font-bold tracking-widest mb-2 uppercase">DEVCOLLAB • HELP CENTER</p>
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

          {/* QUICK ACTIONS / CATEGORIES */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary">Browse Categories</h2>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold transition"
                >
                  <FilterX size={14} /> Clear Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((a) => {
                const isActive = selectedCategory === a.id;
                return (
                  <div 
                    key={a.id} 
                    onClick={() => handleCategoryClick(a.id)}
                    className={`group p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'border-primary bg-primary-soft/15 shadow-md shadow-primary/5' 
                        : 'border-border-subtle bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 ${
                      isActive ? 'bg-primary text-white scale-110' : 'bg-primary-soft text-primary group-hover:scale-110'
                    }`}>
                      <a.icon size={20} />
                    </div>
                    <h3 className={`text-sm font-bold mb-1 transition-colors ${isActive ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>{a.title}</h3>
                    <p className="text-xs text-text-muted leading-relaxed">{a.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: FAQs + Community */}
            <div className="lg:col-span-2 space-y-6">
              {/* FAQs */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-text-primary">
                    {selectedCategory ? `${QUICK_ACTIONS.find(c => c.id === selectedCategory)?.title} FAQs` : 'Frequently Asked Questions'}
                  </h2>
                </div>

                <div className="space-y-2">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-10 text-text-muted text-sm bg-card rounded-2xl border border-border-subtle">
                      No matching FAQs found.
                    </div>
                  ) : filteredFaqs.map((faq, idx) => (
                    <div key={idx} className="rounded-2xl border border-border-subtle bg-card overflow-hidden transition-all duration-200">
                      <button 
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-hover-bg transition-colors"
                      >
                        <span className="font-semibold text-text-primary pr-4 text-sm">{faq.q}</span>
                        {openFaq === idx
                          ? <ChevronUp size={16} className="shrink-0 text-primary" />
                          : <ChevronDown size={16} className="shrink-0 text-text-muted" />}
                      </button>
                      <div className={`px-5 text-text-secondary text-sm leading-relaxed transition-all duration-300 ${
                        openFaq === idx ? 'pb-5 opacity-100 max-h-[300px]' : 'max-h-0 overflow-hidden opacity-0 py-0'
                      }`}>
                        <div className="pt-2 border-t border-border-subtle/50 text-text-secondary">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Community */}
              <section>
                <h2 className="text-base font-bold text-text-primary mb-4">Join the Community</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => window.open("https://discord.gg/devcollab", "_blank")}
                    className="p-5 rounded-2xl border border-border-subtle bg-card hover:bg-hover-bg cursor-pointer transition-all flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-[#5865F2]/10 text-[#5865F2] rounded-xl group-hover:scale-115 transition-transform">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">Discord Server</h4>
                      <p className="text-xs text-text-muted mt-0.5">Chat and collaborate live</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => window.open("https://github.com/hassanMansoor518/AI-Powered-Chat-Application", "_blank")}
                    className="p-5 rounded-2xl border border-border-subtle bg-card hover:bg-hover-bg cursor-pointer transition-all flex items-center gap-4 group"
                  >
                    <div className="p-3 bg-text-primary/5 text-text-primary rounded-xl group-hover:scale-115 transition-transform">
                      <Github size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">GitHub Repository</h4>
                      <p className="text-xs text-text-muted mt-0.5">Report bugs & suggestions</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT: Articles, Status, Support */}
            <div className="space-y-6">
              {/* Popular Articles */}
              <section className="p-5 rounded-2xl border border-border-subtle bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Popular Articles</p>
                <ul className="space-y-3">
                  {filteredArticles.map((a, i) => (
                    <li key={i}>
                      <button 
                        onClick={() => handleArticleClick(a.title)}
                        className="w-full text-left text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-2.5 group"
                      >
                        <div className="p-1.5 rounded-md bg-surface border border-border-subtle group-hover:border-primary/30 group-hover:text-primary shrink-0 transition-colors">
                          <Book size={12} className="text-text-muted group-hover:text-primary" />
                        </div>
                        <span className="truncate">{a.title}</span>
                      </button>
                    </li>
                  ))}
                  {filteredArticles.length === 0 && (
                    <li className="text-xs text-text-muted py-2">No articles match the current filter.</li>
                  )}
                </ul>
              </section>

              {/* System Status */}
              <section className="p-5 rounded-2xl border border-border-subtle bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-1.5">
                  <Activity size={12} className="text-success" /> System Status
                </p>
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

              {/* Contact Support */}
              <section className="p-5 rounded-2xl border border-primary/20 bg-primary-soft/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                <h3 className="text-sm font-bold text-primary mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary animate-pulse" /> Still need help?
                </h3>
                <p className="text-xs text-primary/70 mb-4 leading-relaxed">Can't find what you're looking for? Submit a ticket directly to our development team.</p>
                <button 
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
                >
                  Contact Support
                </button>
              </section>
            </div>
          </div>

          {/* MY SUPPORT TICKETS SECTION */}
          <section className="mt-8 border-t border-border-subtle/50 pt-8 pb-10">
            <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Mail size={18} className="text-primary" /> Your Support Tickets
            </h2>

            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-10 bg-card rounded-2xl border border-border-subtle">
                <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
                <p className="text-xs text-text-muted">Loading your tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-sm bg-card rounded-2xl border border-border-subtle flex flex-col items-center justify-center gap-2">
                <Mail size={28} className="text-text-muted opacity-50" />
                <p className="font-semibold text-text-secondary">No tickets submitted yet</p>
                <p className="text-xs max-w-sm text-text-muted">Submit a ticket using the button on the right if you run into any issues.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.map((ticket) => {
                  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
                  return (
                    <div key={ticket._id} className="p-5 rounded-2xl border border-border-subtle bg-card space-y-3 shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-primary-soft/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {ticket.category}
                        </span>
                        
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isResolved ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {isResolved ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {ticket.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-text-primary leading-snug">{ticket.subject}</h4>
                        <p className="text-xs text-text-muted mt-1 font-medium">
                          Submitted: {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-xs text-text-secondary bg-surface p-3 rounded-xl border border-border-subtle/50 leading-relaxed max-h-[120px] overflow-y-auto">
                        {ticket.message}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ARTICLE VIEWER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border-subtle shadow-popover flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-soft/15 px-2.5 py-1 rounded-md">
                  {QUICK_ACTIONS.find(c => c.id === activeArticle.category)?.title || 'Category'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-text-primary mt-2">{activeArticle.title}</h2>
              </div>
              <button 
                onClick={() => setActiveArticle(null)}
                className="text-text-muted hover:text-text-primary p-2 rounded-xl hover:bg-hover-bg transition"
              >
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm text-text-secondary leading-relaxed">
              {activeArticle.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-sm font-bold text-text-primary pt-3 pb-1 border-b border-border-subtle/30">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-base font-bold text-text-primary pt-4 pb-2 border-b border-border-subtle">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                  return (
                    <ul key={index} className="list-disc pl-5 space-y-1.5 my-2">
                      {paragraph.split('\n').map((li, idx) => (
                        <li key={idx} className="text-xs text-text-muted leading-relaxed">
                          {li.replace(/^\* |^- /, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.match(/^\d+\./)) {
                  return (
                    <ol key={index} className="list-decimal pl-5 space-y-1.5 my-2">
                      {paragraph.split('\n').map((li, idx) => (
                        <li key={idx} className="text-xs text-text-muted leading-relaxed">
                          {li.replace(/^\d+\.\s*/, '')}
                        </li>
                      ))}
                    </ol>
                  );
                }
                return <p key={index} className="whitespace-pre-line">{paragraph}</p>;
              })}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-subtle flex justify-end bg-surface/50">
              <button 
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold rounded-xl transition"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET FORM MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border-subtle shadow-popover flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary">Contact Support</h2>
                <p className="text-xs text-text-muted mt-0.5">Submit a ticket and our development team will review it.</p>
              </div>
              <button 
                onClick={() => setIsSupportModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-2 rounded-xl hover:bg-hover-bg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSupportSubmit}>
              <div className="p-6 space-y-4">
                {/* Prefilled Fields (read-only reference) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={user?.fullName || ''} 
                      disabled 
                      className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-surface text-text-muted text-xs cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Your Email</label>
                    <input 
                      type="text" 
                      value={user?.email || ''} 
                      disabled 
                      className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-surface text-text-muted text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Issue Category</label>
                  <select 
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Billing">Billing</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Bug Report">Bug Report</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Subject</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cannot connect GitHub repository"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/60"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Message Description</label>
                  <textarea 
                    placeholder="Describe your issue in detail. Please provide steps to reproduce if it's a bug."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full p-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/60 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-3 bg-surface/50">
                <button 
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-2 bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingTicket}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
                >
                  {submittingTicket ? (
                    <>
                      <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
