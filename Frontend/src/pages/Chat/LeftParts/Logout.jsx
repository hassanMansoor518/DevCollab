import React from 'react'
import { FaSearch } from "react-icons/fa";
import { BiLogOutCircle } from "react-icons/bi";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useState } from 'react';
export default function Logout() {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

 const  handleLogout = async () => {
    setLoading(true);

    try{
    const res = await axios.post("http://localhost:3001/api/auth/user/logout", {
      withCredentials: true,
    });
    Cookies.remove("token");
    localStorage.removeItem("ChatApp");
    setLoading(false);
    toast.success("Logout Successfully");
    window.location.reload();

     console.log(res.data)
    navigate('/')
  }
  catch(error){
        console.log("Error in Logout", error);
        toast.error("Error in logging out");
  }

 }
   
return (
  <div className="px-4 py-4">
    <div
      onClick={handleLogout}
      className="
        flex items-center gap-3
        text-gray-400 hover:text-white
        hover:bg-[#111827]
        px-3 py-2 rounded-lg
        cursor-pointer transition duration-200
      "
    >
      <BiLogOutCircle size={20} />
      <span className="text-sm">Logout</span>
    </div>
  </div>
);

 }

