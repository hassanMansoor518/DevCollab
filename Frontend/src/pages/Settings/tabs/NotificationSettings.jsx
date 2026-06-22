import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

export default function NotificationSettings({ formState }) {
  const {
    notifWorkspace, setNotifWorkspace,
    notifDMs, setNotifDMs,
    notifMentions, setNotifMentions,
    notifEmail, setNotifEmail,
    notifPush, setNotifPush,
    notifSaving,
    handleSaveNotifications
  } = formState;

  return (
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
  );
}
