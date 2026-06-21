import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users as UsersIcon } from "lucide-react";
import User from "./User";

function Users({ searchQuery = "" }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;

  // Fetch all active users
  const fetchUsers = async () => {
    try {
      // Standardized to Vite relative proxy to prevent cross-origin issues
      const res = await axios.get(`/api/invite/team/active/${user._id}`);
      // Deduplicate by _id to avoid React duplicate-key warnings
      const unique = Array.from(
        new Map(res.data.map((u) => [u._id, u])).values()
      );
      setAllUsers(unique);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchUsers();
    }
  }, [user?._id]);

  // Real-time search query filtering
  const filteredUsers = allUsers.filter((u) => {
    const fullName = u?.fullName || "";
    const email = u?.email || "";
    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="mt-6">
      {/* Section Title */}
      <h2 className="px-6 mb-2.5 text-[11px] font-bold tracking-wider uppercase text-text-muted">
        Direct Messages
      </h2>

      {/* Users List */}
      <div className="flex flex-col gap-1 px-2 overflow-y-auto max-h-[50vh] scrollbar-thin">
        {loading && (
          <div className="space-y-2 px-4 py-2">
            <div className="h-8 w-full bg-hover-bg rounded-lg animate-pulse" />
            <div className="h-8 w-full bg-hover-bg rounded-lg animate-pulse" />
            <div className="h-8 w-full bg-hover-bg rounded-lg animate-pulse" />
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-muted text-text-muted">
              <UsersIcon size={15} />
            </div>
            <p className="text-xs font-medium text-text-muted">
              {searchQuery ? "No contacts match your search" : "No direct messages yet"}
            </p>
            {!searchQuery && (
              <p className="text-[11px] text-text-disabled leading-relaxed">
                Accept an invite to start a conversation.
              </p>
            )}
          </div>
        )}

        {!loading && Array.isArray(filteredUsers) &&
          filteredUsers.map((userItem, index) => (
            <User key={userItem._id || index} user={userItem} />
          ))
        }
      </div>
    </div>
  );
}

export default Users;
