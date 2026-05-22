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
      bg-black/40 dark:bg-black/60
      backdrop-blur-md
      flex items-center justify-center
      z-50
      p-4
    ">

      <div className="
        w-full max-w-md
        bg-surface
        border border-border-subtle
        rounded-2xl
        overflow-hidden
      ">

        {/* HEADER */}
        <div className="
          flex items-center justify-between
          px-4 py-3
          border-b border-border-subtle
        ">

          <h2 className="text-sm font-medium flex items-center gap-2">
            <FiUserPlus />
            Invite members
          </h2>

          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <FiX />
          </button>

        </div>

        {/* SEARCH */}
        <div className="p-3 border-b border-border-subtle">
          <div className="
            flex items-center gap-2
            bg-input-bg
            px-3 py-2
            rounded-xl
          ">
            <FiSearch className="text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="
                bg-transparent
                outline-none
                text-sm
                w-full
                text-text-primary
                placeholder:text-text-muted
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
                  hover:bg-hover-bg
                  ${isSelected ? "bg-hover-bg/80 dark:bg-hover-bg" : ""}
                `}
              >

                <div className="flex items-center gap-3">

                  <img
                    src={`https://i.pravatar.cc/40?u=${user._id}`}
                    className="w-8 h-8 rounded-full"
                  />

                  <div>
                    <p className="text-sm text-text-primary">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {user.email}
                    </p>
                  </div>

                </div>

                <div className={`
                  text-xs px-2 py-1 rounded-lg
                  ${isSelected
                    ? "bg-blue-600 text-white"
                    : "text-text-secondary"
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
          border-t border-border-subtle
        ">

          <p className="text-xs text-text-secondary">
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