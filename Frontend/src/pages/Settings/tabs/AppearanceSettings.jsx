import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

export default function AppearanceSettings({ formState }) {
  const { theme, setTheme } = useTheme();
  
  const {
    compactMode, setCompactMode,
    animations, setAnimations,
    appSaving,
    handleSaveAppearance
  } = formState;

  return (
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
  );
}
