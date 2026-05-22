import React from "react";
import ChatUser from "./ChatUser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import WorkspaceHeader from "./WorkspaceHeader";
import useConversation from "../../../zustand/useConversation.js";

function NoChatSelected() {
    return (
        <div className="flex-1 flex items-center justify-center bg-[#0B1220] text-text-muted">
            <p>No messages yet. Start a conversation or use @ai</p>
        </div>
    );
}

function Right() {
    const { selectedConversation, selectedWorkspace } = useConversation();

    return (
        <section className="flex h-screen w-full flex-col bg-[#0B1220] text-text-primary md:flex-1">

            {/* Workspace view */}
            {selectedWorkspace && !selectedConversation && (
                <>
                    <WorkspaceHeader workspace={selectedWorkspace} />
                    <div className="flex-1 overflow-y-auto">
                        <Messages />
                    </div>
                    <Typesend />
                </>
            )}

            {/* DM view */}
            {selectedConversation && (
                <>
                    <ChatUser />
                    <div className="flex-1 overflow-y-auto">
                        <Messages />
                    </div>
                    <Typesend />
                </>
            )}

            {/* Nothing selected */}
            {!selectedConversation && !selectedWorkspace && (
                <NoChatSelected />
            )}

        </section>
    );
}

export default Right;
