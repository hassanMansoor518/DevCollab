import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountSettings({ formState }) {
  const {
    connectedGithub, setConnectedGithub,
    connectedLinkedin, setConnectedLinkedin
  } = formState;

  return (
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
  );
}
