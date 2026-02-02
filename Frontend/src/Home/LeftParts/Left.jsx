import React from "react";
import Search from "./Search";
import Users from "./Users";
import Logout from "./Logout";

export default function Left() {
  return (
    <div className="
      flex flex-col justify-between
      h-screen
      w-full md:w-[22vw]
      bg-black text-white
    ">
      {/* Top */}
      <div>
        <h1 className="text-2xl font-bold text-center py-4">ChatApp</h1>
        <Search placeholder="Search..." />
        <Users />
      </div>

      {/* Bottom */}
      <div className="p-4">
        <Logout />
      </div>
    </div>
  );
}

