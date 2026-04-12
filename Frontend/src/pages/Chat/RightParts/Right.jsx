import ChatUser from "./ChatUser";
import Messages from "./Messages";
import Typesend from "./Typesend";

function Right() {
  const selectedConversation = true;

  return (
    <div className="
      h-screen
      w-full md:flex-1
       bg-[#0b1120] text-gray-300
      flex flex-col
    ">
      {selectedConversation ? (
        <>
          <ChatUser />
          

          <div className="flex-1 overflow-y-auto">
            <Messages />
          </div>

          <Typesend />
        </>
      ) : (
        <NoChatSelected />
      )}
    </div>
  );
}

export default Right;
