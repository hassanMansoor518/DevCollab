import React, { useEffect } from "react";
import AIAssistantHeader from "../AiFeature/AIAssistantHeader.jsx";
import { useAuth } from "../../../context/AuthProvider.jsx";
import TypeSendAi from "./TypeSendAi.jsx";
import AIMessages from "./AIMessages.jsx";
import useAIMessages from "../../../context/useAIMessages.js";
import useProjectStore from "../../../zustand/useProjectStore.js";
import { Lightbulb, Bug, Rocket, RotateCcw } from "lucide-react";


export default function AIAssistant() {
  const [authUser] = useAuth();
  const { aiMessages, fetchHistory, clearMessages } = useAIMessages();
  const { selectedProject } = useProjectStore();

  const hasMessages = aiMessages.length > 0;
  
 const User = JSON.parse(localStorage.getItem("ChatApp"));
   const user = User?.user;
   const token =User?.token;

  // 👉 FETCH HISTORY ON MOUNT / PROJECT CHANGE
  useEffect(() => {
    if (selectedProject?._id) {
      fetchHistory(selectedProject._id);
    } else {
      clearMessages();
    }
  }, [selectedProject?._id, fetchHistory, clearMessages]);

  return (
    <div className="flex flex-col max-w-10xl h-screen bg-[#0B1220] text-text-primary overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="shrink-0 px-6 py-4 border-b border-border-subtle backdrop-blur-xl sticky top-0 z-50">
       <AIAssistantHeader user={user} />
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 overflow-y-auto px-30 py-4">

        {/* 👉 EMPTY STATE (Cards + Intro) */}
        {!hasMessages && (
          <div className="flex flex-col items-center text-center py-10">

            <h1 className="text-5xl font-bold mb-4">
              Your{" "}
              <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                intelligent coding assistant
              </span>
            </h1>

            <p className="text-text-secondary max-w-xl mb-10">
              Leverage AI to refactor, debug, and improve your code with smart insights.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">

              <Card
                icon={<Lightbulb size={24} />}
                title="Explain Code"
                desc="Deconstruct complex logic into plain English explanations."
                iconColor="text-cyan-400"
                bgColor="bg-cyan-400/10"
              />

              <Card
                icon={<Bug size={24} />}
                title="Detect Bugs"
                desc="Find issues, bugs and performance problems."
                iconColor="text-purple-400"
                bgColor="bg-purple-400/10"
              />

              <Card
                icon={<Rocket size={24} />}
                title="Improve Code"
                desc="Optimize performance and clean architecture."
                iconColor="text-blue-400"
                bgColor="bg-blue-400/10"
              />

            </div>
          </div>
        )}

        {/* 👉 CHAT STATE */}
        {hasMessages && <AIMessages />}

      </div>

      {/* ================= INPUT ================= */}
      <div className="shrink-0">
        <TypeSendAi isAiPage={true} />
      </div>
    </div>
  );
}

/* ================= CARD ================= */
function Card({ icon, title, desc, iconColor, bgColor }) {
  return (
    <div className="bg-card border border-border-subtle rounded-2xl px-8 py-6 text-left hover:bg-hover-bg transition">

      <div className={`p-4 rounded-xl ${bgColor} ${iconColor} mb-4 w-fit`}>
        {icon}
      </div>

      <h3 className="text-xl font-bold mb-4">{title}</h3>

      <p className="text-text-secondary text-sm">{desc}</p>
    </div>
  );
}