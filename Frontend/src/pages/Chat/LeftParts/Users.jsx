import React, { useEffect, useState } from "react";
import axios from "axios";
import User from "./User";

function Users() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;

  // Fetch all active users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/invite/team/active/${user._id}`);
      setAllUsers(res.data); // assuming res.data is an array of users
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

  return (
    <div className="mt-6">
      {/* Section Title */}
      <h2 className="
        px-6 mb-2.5
        text-[11px] 
        font-bold 
        tracking-wider 
        uppercase 
        text-text-muted
      ">
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

        {!loading && allUsers.length === 0 && (
          <p className="text-text-muted text-xs px-6 py-2">No active users found</p>
        )}

        {!loading && Array.isArray(allUsers) &&
          allUsers.map((userItem, index) => (
            <User key={userItem._id || index} user={userItem} />
          ))
        }
      </div>
    </div>
  );
}

export default Users;

