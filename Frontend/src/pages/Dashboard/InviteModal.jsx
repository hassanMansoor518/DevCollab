import React, { useState } from "react";
import { FiX, FiUserPlus, FiSearch } from "react-icons/fi";

export default function InviteModal({ users, onClose, onInvite }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const toggle = (user) => {
    if (selected.find(u => u._id === user._id)) {
      setSelected(selected.filter(u => u._id !== user._id));
    } else {
      setSelected([...selected, user]);
    }
  };

  const send = () => {
    selected.forEach(u => onInvite(u));
    setSelected([]);
    onClose();
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="
      fixed inset-0
      bg-black/60
      backdrop-blur-md
      flex items-center justify-center
      z-50
      p-4
    ">

      <div className="
        w-full max-w-md
        bg-[#111827]
        border border-white/[0.05]
        rounded-2xl
        overflow-hidden
      ">

        {/* HEADER */}
        <div className="
          flex items-center justify-between
          px-4 py-3
          border-b border-white/[0.05]
        ">

          <h2 className="text-sm font-medium flex items-center gap-2">
            <FiUserPlus />
            Invite members
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX />
          </button>

        </div>

        {/* SEARCH */}
        <div className="p-3 border-b border-white/[0.05]">
          <div className="
            flex items-center gap-2
            bg-white/[0.03]
            px-3 py-2
            rounded-xl
          ">
            <FiSearch className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="
                bg-transparent
                outline-none
                text-sm
                w-full
                placeholder:text-gray-500
              "
            />
          </div>
        </div>

        {/* USERS */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">

          {filteredUsers.map(user => {
            const isSelected = selected.find(u => u._id === user._id);

            return (
              <div
                key={user._id}
                onClick={() => toggle(user)}
                className={`
                  flex items-center justify-between
                  p-2 rounded-xl
                  cursor-pointer
                  transition
                  hover:bg-white/[0.03]
                  ${isSelected ? "bg-white/[0.05]" : ""}
                `}
              >

                <div className="flex items-center gap-3">

                  <img
                    src={`https://i.pravatar.cc/40?u=${user._id}`}
                    className="w-8 h-8 rounded-full"
                  />

                  <div>
                    <p className="text-sm text-white">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>

                </div>

                <div className={`
                  text-xs px-2 py-1 rounded-lg
                  ${isSelected
                    ? "bg-blue-500 text-white"
                    : "text-gray-400"
                  }
                `}>
                  {isSelected ? "Added" : "Add"}
                </div>

              </div>
            );
          })}

        </div>

        {/* FOOTER */}
        <div className="
          flex justify-between items-center
          p-3
          border-t border-white/[0.05]
        ">

          <p className="text-xs text-gray-500">
            {selected.length} selected
          </p>

          <button
            onClick={send}
            className="
              bg-blue-600
              hover:bg-blue-500
              text-xs
              px-4 py-2
              rounded-xl
              transition
            "
          >
            Send invites
          </button>

        </div>

      </div>

    </div>
  );
}