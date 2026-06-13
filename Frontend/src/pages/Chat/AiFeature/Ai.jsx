import React from "react";
import DashboardLeftSide from "../../Dashboard/DashboardLeftSide.jsx";
import AIAssistant from "../AiFeature/AIAssistant.jsx";

function Ai() {
    return (
        // 100dvh respects mobile browser chrome (address bar)
        <div className="flex bg-background overflow-hidden" style={{ height: "100dvh" }}>
            {/* Sidebar */}
            <DashboardLeftSide />

            {/* Main AI Panel — must be a flex column so AIAssistant can fill height */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <AIAssistant />
            </div>
        </div>
    );
}

export default Ai;