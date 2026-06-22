import React from 'react';
import { LogOut, Trash2 } from 'lucide-react';

export default function DangerSettings({ onShowLogoutModal, onShowDeleteModal }) {
  return (
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
            onClick={onShowLogoutModal}
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
            onClick={onShowDeleteModal}
            className="shrink-0 px-4 py-2 rounded-xl bg-error hover:bg-red-600 text-white text-xs font-bold transition"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
