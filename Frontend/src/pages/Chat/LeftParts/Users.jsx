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
        px-6 mb-2
        text-[11px] 
        font-semibold 
        tracking-widest 
        uppercase 
        text-gray-500
      ">
        Direct Messages
      </h2>

      {/* Users List */}
      <div className="flex flex-col gap-1 px-2 overflow-y-auto max-h-[65vh]">
        {loading && <p className="text-gray-400 text-sm px-2">Loading users...</p>}

        {!loading && allUsers.length === 0 && (
          <p className="text-gray-400 text-sm px-2">No active users found</p>
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
