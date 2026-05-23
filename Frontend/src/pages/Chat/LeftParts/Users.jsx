import React, { useEffect, useState } from "react";
import axios from "axios";
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
      setAllUsers(res.data); 
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
          <p className="text-text-muted text-xs px-6 py-2">
            {searchQuery ? "No matching contacts found" : "No active users found"}
          </p>
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
