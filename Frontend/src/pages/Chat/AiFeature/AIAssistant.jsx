import React, { useEffect } from "react";
import AIAssistantHeader from "../AiFeature/AIAssistantHeader.jsx";
import { useAuth } from "../../../context/AuthProvider.jsx";
import TypeSendAi from "./TypeSendAi.jsx";
import AIMessages from "./AIMessages.jsx";
import useAIMessages from "../../../context/useAIMessages.js";
import useProjectStore from "../../../zustand/useProjectStore.js";
import { Lightbulb, Bug, Rocket } from "lucide-react";


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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background text-text-primary">

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-b border-border-subtle bg-background/90 backdrop-blur-xl z-40">
        <AIAssistantHeader user={user} />
      </div>

      {/* ═══════════════ MESSAGES ═══════════════
          • flex-1 min-h-0  → fills all remaining vertical space
          • overflow-y-auto → only this div scrolls; nothing else moves
          • pb-4            → breathing room above input
      */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-3 sm:px-8 md:px-16 lg:px-28 xl:px-32 py-4 pb-6">

          {/* ── EMPTY STATE ── */}
          {!hasMessages && (
            <div className="flex flex-col items-center text-center py-8 sm:py-10">

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                Your{" "}
                <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  intelligent coding assistant
                </span>
              </h1>

              <p className="text-text-secondary text-sm sm:text-base max-w-xl mb-6 sm:mb-10">
                Leverage AI to refactor, debug, and improve your code with smart insights.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-5xl">
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

      {/* ═══════════════ INPUT ═══════════════
          • shrink-0            → never shrinks; always visible
          • border-t + backdrop → visually separated from messages
          • z-10                → always on top
      */}
      <div className="shrink-0 border-border-subtle bg-background/95 backdrop-blur-sm z-10">
        <TypeSendAi isAiPage={true} />
      </div>

    </div>
  );
}

/* ═══════════════ CARD ═══════════════ */
function Card({ icon, title, desc, iconColor, bgColor }) {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 sm:p-6 text-left hover:bg-hover-bg transition shadow-sm">
      <div className={`p-3 rounded-xl ${bgColor} ${iconColor} mb-3 w-fit`}>
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </div>
  );
}