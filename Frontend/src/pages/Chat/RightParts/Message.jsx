import React from "react";
import { FiCpu } from "react-icons/fi";
import useConversation from "../../../zustand/useConversation.js";

function Message({ message }) {
  const { selectedConversation, selectedWorkspace } = useConversation();
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));

  // ✅ Check if senderId is populated object or plain string
  const senderIdStr =
    typeof message.senderId === "object"
      ? message.senderId?._id?.toString()
      : message.senderId?.toString();

  const itsMe = senderIdStr === authUser.user._id.toString();

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // ✅ Get sender name — works for both DM and workspace
  let senderName = "User";

  if (itsMe) {
    senderName = "You";
  } else if (typeof message.senderId === "object" && message.senderId?.fullName) {
    // ✅ Workspace: senderId is populated with fullName
    senderName = message.senderId.fullName;
  } else if (selectedConversation) {
    // ✅ DM: find from conversation members
    const otherUser = selectedConversation.members?.find(
      (member) =>
        (member._id || member).toString() !== authUser.user._id.toString()
    );
    senderName = otherUser?.fullName || "User";
  }

  /* ================= AI MESSAGE ================= */
  if (message.isAI) {
    return (
      <div className="flex gap-4 px-8 py-4">
        <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center shadow-lg">
          <FiCpu size={16} className="text-white" />
        </div>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 w-full max-w-3xl shadow-xl">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
          <p className="text-xs text-gray-500 mt-4">{formattedTime}</p>
        </div>
      </div>
    );
  }

  /* ================= NORMAL MESSAGE ================= */
  return (
    <div className={`flex px-8 py-3 ${itsMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-4 max-w-3xl ${itsMe ? "flex-row-reverse text-right" : ""}`}>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-semibold">
          {/* ✅ Show initials in avatar */}
          {senderName !== "You"
            ? senderName.charAt(0).toUpperCase()
            : authUser.user.fullName?.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col">
          <div className={`flex items-center gap-3 ${itsMe ? "justify-end" : ""}`}>
            <p className="text-sm font-semibold text-gray-200">
              {senderName}
            </p>
            <span className="text-xs text-gray-500">{formattedTime}</span>
          </div>

          <div
            className={`mt-1 px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              itsMe ? "bg-blue-600 text-white" : "bg-[#1f2937] text-gray-300"
            }`}
          >
            {message.message}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;