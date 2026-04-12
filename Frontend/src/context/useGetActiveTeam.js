import { useState, useEffect } from "react";
import axios from "axios";

export default function useGetActiveTeam(currentUserId) {
  const [activeTeam, setActiveTeam] = useState([]);

  const fetchActiveTeam = async () => {
    if (!currentUserId) return;
    try {
      const res = await axios.get(`/api/team/active/${currentUserId}`);
      setActiveTeam(res.data);
    } catch (err) {
      console.error("Error fetching active team:", err);
    }
  };

  useEffect(() => {
    fetchActiveTeam();
  }, [currentUserId]);

  return [activeTeam, fetchActiveTeam];
}
