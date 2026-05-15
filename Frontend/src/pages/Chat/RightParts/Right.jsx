import React from "react";
import ChatUser from "./ChatUser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import WorkspaceHeader from "./WorkspaceHeader";
import useConversation from "../../../zustand/useConversation.js";

function NoChatSelected() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <p>No messages yet. Start a conversation or use @ai</p>
    </div>
  );
}

function Right() {
  const { selectedConversation, selectedWorkspace } = useConversation();

  return (
    <div className="h-screen w-full md:flex-1 bg-[#0b1120] text-gray-300 flex flex-col">

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

    </div>
  );
}

export default Right;