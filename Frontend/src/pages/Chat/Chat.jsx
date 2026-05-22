import React from "react";
import Left from "./LeftParts/Left.jsx";
import Right from "./RightParts/Right.jsx";
import useConversation from "../../zustand/useConversation.js";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide.jsx";

function Chat() {
    const { selectedConversation } = useConversation();

    return (
        <div className="app-shell">
            <DashboardLeftSide />
            <Left />
            <Right />

        </div>
    );
}

export default Chat;

