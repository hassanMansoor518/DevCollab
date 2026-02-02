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
    // navigate('/login')
  }
  catch(error){
        console.log("Error in Logout", error);
        toast.error("Error in logging out");
  }

 }
   
  return (
        <>
      <hr />
      <div className=" h-[10vh] bg-transparent">
        <div
        >
          <BiLogOutCircle
            onClick={() => handleLogout()}
         
            className="text-5xl text-white hover:bg-slate-700 duration-300 cursor-pointer rounded-full p-2 ml-2 mt-1"
           
          />
        </div>
      </div>
    </>
  )
 }

