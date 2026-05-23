import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    
  const [dark, setDark] = useState(false);

  // INIT THEME
  useEffect(() => {
    const saved = localStorage.getItem("theme");

    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = saved ? saved === "dark" : systemDark;

    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // TOGGLE
  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);

    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center justify-center
        w-10 h-10 rounded-lg
        border border-[var(--color-border)]
        bg-[var(--color-surface)]
        text-[var(--color-text)]
        hover:bg-[var(--color-border)]
        transition-all duration-300
      "
      title="Toggle Theme"
    >
      {dark ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-[var(--color-muted)]" />
      )}
    </button>
  );
}

