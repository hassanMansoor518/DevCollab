import React from "react";
import Left from "./LeftParts/Left.jsx";
import Right from "./RightParts/Right.jsx";
import useConversation from "../../zustand/useConversation.js";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide.jsx";

function Chat() {
    const { selectedConversation, selectedWorkspace } = useConversation();

    // On mobile: show Right panel when a conversation/workspace is selected
    const hasSelection = selectedConversation || selectedWorkspace;

    return (
        <div className="app-shell">
            <DashboardLeftSide />

            {/* Chat Left Panel: always visible on lg+; hidden on mobile when chat selected */}
            <div className={`${hasSelection ? "hidden lg:flex" : "flex"} w-full lg:w-auto`}>
                <Left />
            </div>

            {/* Chat Right Panel: full-width on mobile when active, hidden when no selection on mobile */}
            <div className={`${hasSelection ? "flex" : "hidden lg:flex"} flex-1 min-w-0`}>
                <Right />
            </div>
        </div>
    );
}

export default Chat;
