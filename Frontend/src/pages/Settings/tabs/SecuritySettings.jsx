import React from 'react';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function SecuritySettings({ formState }) {
  const {
    curPassword, setCurPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showCurPass, setShowCurPass,
    showNewPass, setShowNewPass,
    showConfirmPass, setShowConfirmPass,
    passwordStrength,
    securitySaving,
    sessions, handleRevokeSession,
    handleSavePassword
  } = formState;

  return (
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
          // Since icon functions aren't serialized nicely in state, we can map them here or let them be. 
          // We can import Monitor/Smartphone dynamically if needed, but since they were in Settings.jsx, we need them here.
          // Wait, they are not imported in this component. Let's import them.
          return (
            <div key={s.id} className="p-4 rounded-2xl border border-border-subtle bg-surface flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-soft/10 text-primary rounded-xl">
                  {/* Mock icons for now based on device string if icon is not properly serialized */}
                  <span className="font-bold text-lg">{s.device.includes('iPhone') ? '📱' : '💻'}</span>
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
  );
}
