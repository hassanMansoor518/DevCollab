import React from 'react';
import { Loader2, CheckCircle, Bot, Key } from 'lucide-react';

export default function AiSettings({ formState }) {
  const {
    openaiKey, setOpenaiKey,
    geminiKey, setGeminiKey,
    defaultModel, setDefaultModel,
    aiContext, setAiContext,
    aiSummarize, setAiSummarize,
    aiSaving,
    handleSaveAISettings
  } = formState;

  return (
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
              <option value="Gemini 1.5 Flash">Gemini 1.5 Flash (Recommended)</option>
              <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
              <option value="GPT-4o (Recommended)">GPT-4o (requires OpenAI key)</option>
              <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
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
  );
}
