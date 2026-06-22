import React from 'react';
import { Upload, CheckCircle, X, Plus, Loader2 } from 'lucide-react';

export default function ProfileSettings({ user, formState, uploadState }) {
  const {
    profileName, setProfileName,
    profileBio, setProfileBio,
    profileTech, setProfileTech,
    newTag, setNewTag,
    profileSaving,
    handleAddTag, handleRemoveTag,
    handleSaveProfile
  } = formState;

  const {
    avatarPreview,
    fileInputRef,
    handleFileChange,
    handleRemovePhoto
  } = uploadState;

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-text-primary">Profile Details</h2>
        <p className="text-xs text-text-secondary mt-0.5">Customize your personal visual card, bio, and technology stacks.</p>
      </div>

      {/* Avatar Uploader widget */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-border-subtle bg-surface">
        <div className="relative">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-info flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border border-border-subtle flex items-center justify-center text-text-primary hover:text-primary transition-colors shadow-md"
          >
            <Upload size={12} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="text-center sm:text-left space-y-1">
          <h4 className="font-bold text-sm text-text-primary">Profile Photo</h4>
          <p className="text-xs text-text-muted">Accepts JPG, PNG, GIF files. Maximum file size is 2MB.</p>
          <div className="flex gap-2.5 pt-1 justify-center sm:justify-start">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition"
            >
              Upload Photo
            </button>
            {avatarPreview && (
              <button 
                type="button" 
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-secondary text-xs font-bold transition"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Full Name</label>
          <input 
            type="text" 
            value={profileName} 
            onChange={(e) => setProfileName(e.target.value)} 
            className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Registered Email Address</label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="w-full h-10 px-3.5 rounded-xl border border-border-subtle bg-hover-bg text-text-muted text-sm opacity-60 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Short Bio / Headline</label>
        <textarea 
          rows={3} 
          value={profileBio} 
          onChange={(e) => setProfileBio(e.target.value)} 
          placeholder="Say something about yourself..."
          className="w-full p-3.5 rounded-xl border border-border-subtle bg-surface text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm"
        />
      </div>

      {/* Tech tags */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Technology Stack Tags</label>
        <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-border-subtle bg-surface min-h-[50px]">
          {profileTech.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-primary-soft/15 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5 select-none animate-in scale-in-95">
              {tag} 
              <X size={11} className="cursor-pointer opacity-70 hover:opacity-100 hover:text-error transition" onClick={() => handleRemoveTag(tag)} />
            </span>
          ))}
          
          <div className="flex items-center gap-1 min-w-[120px]">
            <input 
              type="text" 
              placeholder="Add tag..." 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="bg-transparent text-xs text-text-primary focus:outline-none w-20 flex-1 px-1 py-0.5 placeholder:text-text-muted/60"
            />
            <button 
              type="button" 
              onClick={handleAddTag}
              className="p-1 rounded-md bg-hover-bg text-text-primary hover:text-primary transition"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <button 
          type="submit" 
          disabled={profileSaving}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-primary/10"
        >
          {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Save Profile
        </button>
      </div>
    </form>
  );
}
