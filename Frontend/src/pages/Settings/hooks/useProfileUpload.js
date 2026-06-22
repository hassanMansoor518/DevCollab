import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://ai-powered-chat-application-production.up.railway.app");

export function useProfileUpload(user, authUser, setAuthUser) {
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      try {
        setProfileSaving(true);
        const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
          avatar: base64String
        }, { withCredentials: true });
        
        toast.success("Profile photo updated successfully!");
        const updated = { ...authUser, user: res.data.user };
        localStorage.setItem("ChatApp", JSON.stringify(updated));
        setAuthUser(updated);
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile photo.");
      } finally {
        setProfileSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!avatarPreview) return;
    try {
      setProfileSaving(true);
      const res = await axios.put(`${API_URL}/api/auth/user/update-profile`, {
        avatar: null
      }, { withCredentials: true });
      
      setAvatarPreview(null);
      toast.success("Profile photo removed.");
      const updated = { ...authUser, user: res.data.user };
      localStorage.setItem("ChatApp", JSON.stringify(updated));
      setAuthUser(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove profile photo.");
    } finally {
      setProfileSaving(false);
    }
  };

  return {
    avatarPreview,
    setAvatarPreview,
    profileSaving,
    setProfileSaving,
    fileInputRef,
    handleFileChange,
    handleRemovePhoto
  };
}
