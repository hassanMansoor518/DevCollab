import React, { useState } from "react";
import { Check, Search, UserPlus, X } from "lucide-react";

export default function InviteModal({ users, onClose, onInvite }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const toggle = (user) => {
    if (selected.find((u) => u._id === user._id)) {
      setSelected(selected.filter((u) => u._id !== user._id));
    } else {
      setSelected([...selected, user]);
    }
  };

  const clearSelected = () => setSelected([]);

  const send = () => {
    selected.forEach((u) => onInvite(u));
    setSelected([]);
    onClose();
  };

  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      !query ||
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
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

      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-border-subtle bg-card shadow-[0_20px_80px_-30px_rgba(15,23,42,0.45)]">
        <div className="border-b border-border-subtle bg-surface px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[70%]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Invite members</p>
              <h2 className="mt-3 text-xl font-semibold text-text-primary">Add collaborators to your team</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Select users below and send professional invitations to join your workspace.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-text-secondary transition hover:bg-surface hover:text-text-primary"
              aria-label="Close invite modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 border-b border-border-subtle px-6 py-5 bg-surface">
          <div className="rounded-2xl border border-border-default bg-input-bg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 text-text-secondary">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {selected.map((user) => (
                <div key={user._id} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm text-text-primary">
                  <span>{user.fullName}</span>
                  <button
                    type="button"
                    onClick={() => toggle(user)}
                    className="rounded-full bg-primary/20 p-1 text-primary transition hover:bg-primary/30"
                    aria-label={`Remove ${user.fullName}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={clearSelected}
                className="text-sm font-semibold text-primary transition hover:text-primary-hover"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 text-sm text-text-secondary">
            <div>
              <p className="font-semibold text-text-primary">{filteredUsers.length} available</p>
              <p>Invite the right members for your project.</p>
            </div>
            {selected.length > 0 && <div className="text-sm font-medium text-primary">{selected.length} selected</div>}
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto p-4">
          {filteredUsers.length === 0 ? (
            <div className="rounded-3xl border border-border-subtle bg-muted/40 px-4 py-10 text-center text-sm text-text-secondary">
              No matching users found. Try a different search term.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selected.some((u) => u._id === user._id);

              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => toggle(user)}
                  className={`flex w-full items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left transition ${
                    isSelected ? "border-primary/25 bg-primary/10" : "border-border-subtle bg-surface"
                  } hover:border-primary/30 hover:bg-primary/5`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold bg-primary-soft text-primary shrink-0">
                      {user.fullName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{user.fullName}</p>
                      <p className="truncate text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    isSelected ? "border-primary bg-primary/15" : "border-border-subtle bg-surface"
                  }`}>
                    {isSelected ? <Check size={14} /> : <UserPlus size={14} />}
                    {isSelected ? "Selected" : "Invite"}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-3 border-t border-border-subtle bg-surface px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Ready to invite</p>
            <p className="text-xs text-text-secondary">Your selected team members will receive a workspace invitation.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-hover-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={selected.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary-hover"
            >
              {selected.length > 0 ? `Send ${selected.length} invite${selected.length > 1 ? "s" : ""}` : "Select members"}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}