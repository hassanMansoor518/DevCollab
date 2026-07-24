import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f16f.up.railway.app");

export function useSettingsForm(user, authUser, setAuthUser) {
  // Keeps track of unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // States for subtabs: Profile
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileTech, setProfileTech] = useState(user?.techStack || []);
  const [newTag, setNewTag] = useState('');
  const [profileSaving, setProfileSaving] = useState(false); // separate from upload saving, but maybe we can rename it. We'll reuse it or just pass it in ProfileSettings

  // Password / Security States
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurPass, setShowCurPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Very Weak', color: 'bg-error' });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows · Chrome', location: 'Current Session', active: true },
    { id: 2, device: 'iPhone · Safari', location: 'London, UK · Last active 2 days ago', active: false },
  ]);

  // Notifications toggles
  const [notifWorkspace, setNotifWorkspace] = useState(user?.notifications?.workspaceUpdates ?? true);
  const [notifDMs, setNotifDMs] = useState(user?.notifications?.directMessages ?? true);
  const [notifMentions, setNotifMentions] = useState(user?.notifications?.mentions ?? true);
  const [notifEmail, setNotifEmail] = useState(user?.notifications?.emailDigest ?? false);
  const [notifPush, setNotifPush] = useState(user?.notifications?.pushNotifications ?? true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Appearance states
  const [compactMode, setCompactMode] = useState(user?.appearance?.compactMode ?? false);
  const [animations, setAnimations] = useState(user?.appearance?.animations ?? true);
  const [appSaving, setAppSaving] = useState(false);

  // Connected accounts (UI states)
  const [connectedGithub, setConnectedGithub] = useState(true);
  const [connectedLinkedin, setConnectedLinkedin] = useState(false);

  // AI settings
  const [openaiKey, setOpenaiKey] = useState(user?.aiSettings?.openaiKey ?? '');
  const [geminiKey, setGeminiKey] = useState(user?.aiSettings?.geminiKey ?? '');
  const [defaultModel, setDefaultModel] = useState(user?.aiSettings?.defaultModel ?? 'Gemini 1.5 Flash');
  const [aiContext, setAiContext] = useState(user?.aiSettings?.contextAware ?? true);
  const [aiSummarize, setAiSummarize] = useState(user?.aiSettings?.autoSummarize ?? false);
  const [aiSaving, setAiSaving] = useState(false);

  // Calculate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, label: 'None', color: 'bg-border-strong' });
      return;
    }
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'Very Weak';
    let color = 'bg-error';
    if (score === 2) {
      label = 'Weak';
      color = 'bg-warning';
    } else if (score === 3) {
      label = 'Moderate';
      color = 'bg-info';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-success';
    }
    setPasswordStrength({ score, label, color });
  }, [newPassword]);

  // Check dirty states
  useEffect(() => {
    const isProfileDirty = 
      profileName !== (user?.fullName || '') ||
      profileBio !== (user?.bio || '') ||
      JSON.stringify(profileTech) !== JSON.stringify(user?.techStack || []);

    const isSecurityDirty = 
      curPassword !== '' ||
      newPassword !== '' ||
      confirmPassword !== '';

    const isNotifDirty =
      notifWorkspace !== (user?.notifications?.workspaceUpdates ?? true) ||
      notifDMs !== (user?.notifications?.directMessages ?? true) ||
      notifMentions !== (user?.notifications?.mentions ?? true) ||
      notifEmail !== (user?.notifications?.emailDigest ?? false) ||
      notifPush !== (user?.notifications?.pushNotifications ?? true);

    const isAppDirty =
      compactMode !== (user?.appearance?.compactMode ?? false) ||
      animations !== (user?.appearance?.animations ?? true);

    const isAiDirty =
      openaiKey !== (user?.aiSettings?.openaiKey ?? '') ||
      geminiKey !== (user?.aiSettings?.geminiKey ?? '') ||
      defaultModel !== (user?.aiSettings?.defaultModel ?? 'GPT-4o (Recommended)') ||
      aiContext !== (user?.aiSettings?.contextAware ?? true) ||
      aiSummarize !== (user?.aiSettings?.autoSummarize ?? false);

    setIsDirty(isProfileDirty || isSecurityDirty || isNotifDirty || isAppDirty || isAiDirty);
  }, [
    profileName, profileBio, profileTech, curPassword, newPassword, confirmPassword,
    notifWorkspace, notifDMs, notifMentions, notifEmail, notifPush,
    compactMode, animations, openaiKey, geminiKey, defaultModel, aiContext, aiSummarize,
    user
  ]);

  const resetFormState = () => {
    setCurPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (user) {
      setProfileName(user.fullName || '');
      setProfileBio(user.bio || '');
      setProfileTech(user.techStack || []);
      setNotifWorkspace(user.notifications?.workspaceUpdates ?? true);
      setNotifDMs(user.notifications?.directMessages ?? true);
      setNotifMentions(user.notifications?.mentions ?? true);
      setNotifEmail(user.notifications?.emailDigest ?? false);
      setNotifPush(user.notifications?.pushNotifications ?? true);
      setCompactMode(user.appearance?.compactMode ?? false);
      setAnimations(user.appearance?.animations ?? true);
      setOpenaiKey(user.aiSettings?.openaiKey ?? '');
      setGeminiKey(user.aiSettings?.geminiKey ?? '');
      setDefaultModel(user.aiSettings?.defaultModel ?? 'Gemini 1.5 Flash');
      setAiContext(user.aiSettings?.contextAware ?? true);
      setAiSummarize(user.aiSettings?.autoSummarize ?? false);
    }
    setIsDirty(false);
  };

  // Sync profile fields if user object changes
  useEffect(() => {
    resetFormState();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setProfileSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        fullName: profileName,
        bio: profileBio,
        techStack: profileTech
      }, { withCredentials: true });

      toast.success("Profile settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!curPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    try {
      setSecuritySaving(true);
      await axios.put(`${API_URL}/api/auth/user/update-password`, {
        currentPassword: curPassword,
        newPassword
      }, { withCredentials: true });

      toast.success("Password changed successfully!");
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update password. Verify current password.");
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      setNotifSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        notifications: {
          workspaceUpdates: notifWorkspace,
          directMessages: notifDMs,
          mentions: notifMentions,
          emailDigest: notifEmail,
          pushNotifications: notifPush
        }
      }, { withCredentials: true });

      toast.success("Notification settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notifications.");
    } finally {
      setNotifSaving(false);
    }
  };

  const handleSaveAppearance = async (e) => {
    e.preventDefault();
    try {
      setAppSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        appearance: {
          compactMode,
          animations
        }
      }, { withCredentials: true });

      toast.success("Appearance settings updated successfully!");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update appearance.");
    } finally {
      setAppSaving(false);
    }
  };

  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    try {
      setAiSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        aiSettings: {
          openaiKey,
          geminiKey,
          defaultModel,
          contextAware: aiContext,
          autoSummarize: aiSummarize
        }
      }, { withCredentials: true });

      toast.success("AI assistant configuration saved successfully!");
      localStorage.setItem('openai_api_key', openaiKey);
      localStorage.setItem('gemini_api_key', geminiKey);
      
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save AI configuration.");
    } finally {
      setAiSaving(false);
    }
  };

  const handleRevokeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success("Session revoked successfully.");
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (profileTech.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setProfileTech(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    setProfileTech(prev => prev.filter(t => t !== tag));
  };

  return {
    isDirty,
    resetFormState,

    // Profile
    profileName, setProfileName,
    profileBio, setProfileBio,
    profileTech, setProfileTech,
    newTag, setNewTag,
    profileSaving,
    handleAddTag, handleRemoveTag,
    handleSaveProfile,

    // Security
    curPassword, setCurPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showCurPass, setShowCurPass,
    showNewPass, setShowNewPass,
    showConfirmPass, setShowConfirmPass,
    passwordStrength,
    securitySaving,
    sessions, handleRevokeSession,
    handleSavePassword,

    // Account
    connectedGithub, setConnectedGithub,
    connectedLinkedin, setConnectedLinkedin,

    // Notifications
    notifWorkspace, setNotifWorkspace,
    notifDMs, setNotifDMs,
    notifMentions, setNotifMentions,
    notifEmail, setNotifEmail,
    notifPush, setNotifPush,
    notifSaving,
    handleSaveNotifications,

    // Appearance
    compactMode, setCompactMode,
    animations, setAnimations,
    appSaving,
    handleSaveAppearance,

    // AI
    openaiKey, setOpenaiKey,
    geminiKey, setGeminiKey,
    defaultModel, setDefaultModel,
    aiContext, setAiContext,
    aiSummarize, setAiSummarize,
    aiSaving,
    handleSaveAISettings,
  };
}
