import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="icon-button relative overflow-hidden"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun
        size={16}
        className={`absolute transition ${isDark ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
      />
      <Moon
        size={16}
        className={`absolute transition ${isDark ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
      />
    </button>
  );
}
