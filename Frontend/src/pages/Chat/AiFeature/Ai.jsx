import React from "react";
import DashboardLeftSide from "../../Dashboard/DashboardLeftSide.jsx";
import AIAssistant from "../AiFeature/AIAssistant.jsx";

function Ai() {
    return (
        <div className="h-screen flex w-full bg-gray-900 text-gray-100 overflow-hidden">
            {/* Sidebar */}
            <DashboardLeftSide />

            {/* Main AI Panel */}
            <div className="flex-1 max-w-10xl">
                <AIAssistant />
            </div>
        </div>
    );
}

export default Ai;