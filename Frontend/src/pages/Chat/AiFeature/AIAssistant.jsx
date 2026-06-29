import React, { useEffect, useRef } from "react";
import AIAssistantHeader from "../AiFeature/AIAssistantHeader.jsx";
import { useAuth } from "../../../context/AuthProvider.jsx";
import TypeSendAi from "./TypeSendAi.jsx";
import AIMessages from "./AIMessages.jsx";
import useAIMessages from "../../../context/useAIMessages.js";
import useProjectStore from "../../../zustand/useProjectStore.js";
import { Lightbulb, Bug, Rocket, Sparkles } from "lucide-react";


export default function AIAssistant() {
  const [authUser] = useAuth();
  const { aiMessages, fetchHistory, clearMessages } = useAIMessages();
  const { selectedProject } = useProjectStore();

  const hasMessages = aiMessages.length > 0;

  const User = JSON.parse(localStorage.getItem("ChatApp"));
  const user = User?.user;

  // Fetch history on mount / project change
  useEffect(() => {
    if (selectedProject?._id) {
      fetchHistory(selectedProject._id);
    } else {
      clearMessages();
    }
  }, [selectedProject?._id, fetchHistory, clearMessages]);

  return (
    /*
     * KEY LAYOUT RULES
     * ─────────────────
     * • flex flex-col          → stack header / messages / input vertically
     * • flex-1 min-h-0         → take remaining height from Ai.jsx; min-h-0 lets
     *                            the browser actually shrink the flex child so that
     *                            overflow-y-auto on the messages div works correctly
     * • overflow-hidden        → clip children; scrolling lives only in the messages div
     */
    <div className="flex flex-col flex-1 min-h-0 md:overflow-hidden overflow-y-auto bg-background text-text-primary">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-b border-border-subtle bg-background/90 backdrop-blur-xl z-40 md:sticky md:top-0">
        <AIAssistantHeader user={user} />
      </div>

      {/* ═══════════════ MESSAGES ═══════════════ */}
      <div className="flex-1 min-h-0 md:overflow-y-auto overflow-visible overflow-x-hidden">
        <div className="px-3 sm:px-8 md:px-16 lg:px-28 xl:px-32 py-4 pb-6">

          {/* ── EMPTY STATE ── */}
          {!hasMessages && (
            <div className="flex flex-col items-center text-center">

              {/* ── Heading & Subtitle ── */}
              <div className="pt-6 sm:pt-10 pb-5 sm:pb-8 flex flex-col items-center">
                {/* Mobile: small sparkle icon instead of huge heading */}
                <div className="sm:hidden w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Sparkles size={22} className="text-blue-400" />
                </div>

                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
                  Your{" "}
                  <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    intelligent{" "}
                    <span className="hidden sm:inline">coding </span>assistant
                  </span>
                </h1>

                <p className="text-text-secondary text-xs sm:text-base max-w-xs sm:max-w-xl leading-relaxed">
                  <span className="sm:hidden">Refactor, debug and improve your code with AI.</span>
                  <span className="hidden sm:inline">Leverage AI to refactor, debug, and improve your code with smart insights.</span>
                </p>
              </div>

              {/* ── MOBILE: Horizontal Swipeable Carousel ── */}
              <div className="sm:hidden w-full">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3 text-left px-1">
                  Suggestions
                </p>
                <div
                  className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <MobileCard
                    icon={<Lightbulb size={16} />}
                    title="Explain Code"
                    desc="Deconstruct complex logic"
                    iconColor="text-cyan-400"
                    bgColor="bg-cyan-500/10"
                    borderColor="border-cyan-500/20"
                  />
                  <MobileCard
                    icon={<Bug size={16} />}
                    title="Detect Bugs"
                    desc="Find issues & performance problems"
                    iconColor="text-purple-400"
                    bgColor="bg-purple-500/10"
                    borderColor="border-purple-500/20"
                  />
                  <MobileCard
                    icon={<Rocket size={16} />}
                    title="Improve Code"
                    desc="Optimize & clean architecture"
                    iconColor="text-blue-400"
                    bgColor="bg-blue-500/10"
                    borderColor="border-blue-500/20"
                  />
                </div>
                {/* Swipe hint dots */}
                <div className="flex justify-center gap-1.5 mt-2">
                  <span className="w-4 h-1 rounded-full bg-primary/60" />
                  <span className="w-1.5 h-1 rounded-full bg-border-strong" />
                  <span className="w-1.5 h-1 rounded-full bg-border-strong" />
                </div>
              </div>

              {/* ── DESKTOP: 3-Column Grid ── */}
              <div className="hidden sm:grid grid-cols-3 gap-4 w-full max-w-5xl">
                <Card
                  icon={<Lightbulb size={22} />}
                  title="Explain Code"
                  desc="Deconstruct complex logic into plain English explanations."
                  iconColor="text-cyan-500 dark:text-cyan-400"
                  bgColor="bg-cyan-500/10"
                />
                <Card
                  icon={<Bug size={22} />}
                  title="Detect Bugs"
                  desc="Find issues, bugs and performance problems."
                  iconColor="text-purple-500 dark:text-purple-400"
                  bgColor="bg-purple-500/10"
                />
                <Card
                  icon={<Rocket size={22} />}
                  title="Improve Code"
                  desc="Optimize performance and clean architecture."
                  iconColor="text-blue-500 dark:text-blue-400"
                  bgColor="bg-blue-500/10"
                />
              </div>

            </div>
          )}

          {/* ── CHAT MESSAGES ── */}
          {hasMessages && <AIMessages />}

        </div>
      </div>

      {/* ═══════════════ INPUT ═══════════════ */}
      <div className="shrink-0 border-border-subtle bg-background/95 backdrop-blur-sm z-10 sticky bottom-0">
        <TypeSendAi isAiPage={true} />
      </div>

    </div>
  );
}

/* ═══════════════ MOBILE CARD (Swipeable) ═══════════════ */
function MobileCard({ icon, title, desc, iconColor, bgColor, borderColor }) {
  return (
    <div
      className={`snap-start shrink-0 w-[160px] bg-card border ${borderColor} rounded-2xl p-3.5 text-left hover:bg-hover-bg active:scale-95 transition-all duration-150 cursor-pointer`}
    >
      <div className={`p-2 rounded-xl ${bgColor} ${iconColor} mb-2.5 w-fit`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-1 text-text-primary">{title}</h3>
      <p className="text-text-muted text-[11px] leading-relaxed">{desc}</p>
    </div>
  );
}

/* ═══════════════ DESKTOP CARD ═══════════════ */
function Card({ icon, title, desc, iconColor, bgColor }) {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 sm:p-6 text-left hover:bg-hover-bg transition shadow-sm cursor-pointer">
      <div className={`p-3 rounded-xl ${bgColor} ${iconColor} mb-3 w-fit`}>
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
