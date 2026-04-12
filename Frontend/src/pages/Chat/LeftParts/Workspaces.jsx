import React, { useEffect, useState } from "react";
import axios from "axios";

function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/workspace/all-workspace");
      console.log("Raw workspaces:", res.data);

      // Filter workspaces where current user is a member
      const userWorkspaces = res.data.filter(ws =>
        ws.members?.includes(user._id)
      );

      setWorkspaces(userWorkspaces);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchWorkspaces();
  }, [user?._id]);

  return (
    <div className="mt-4">
      <h2 className="px-6 mb-2 text-[11px] font-semibold tracking-widest uppercase text-gray-500">
        Workspaces
      </h2>

      <div className="flex flex-col gap-1 px-2 overflow-y-auto max-h-[30vh]">
        {loading && <p className="text-gray-400 text-sm px-2">Loading workspaces...</p>}
        {!loading && workspaces.length === 0 && (
          <p className="text-gray-400 text-sm px-2">No workspaces found</p>
        )}
        {!loading && Array.isArray(workspaces) &&
          workspaces.map((ws, idx) => (
         <div
  key={ws._id || idx}
  
  className={`
    flex items-center gap-2 px-4 py-2 rounded-md
    cursor-pointer transition-colors duration-200
    text-sm text-gray-300
    hover:bg-[#1e293b] hover:text-white
  
  `}
>
  <span className="text-gray-400">#</span>
  <span className="truncate">{ws.name}</span>
</div>
          ))
        }
      </div>
    </div>
  );
}

export default Workspaces;