import React from "react";
import Left from "./LeftParts/Left";
import Right from "./RightParts/Right";
import useConversation from "../zustand/useConversation.js";

function Home() {
  const { selectedConversation } = useConversation();

  return (
    <div className="h-screen overflow-hidden bg-gray-900">

      {/* 📱 MOBILE VIEW */}
      <div className="md:hidden h-full">
        {selectedConversation ? <Right /> : <Left />}
      </div>

      {/* 💻 DESKTOP VIEW */}
      <div className="hidden md:flex h-full">
        <Left />
        <div className="flex-1">
          {selectedConversation ? (
            <Right />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Home;


