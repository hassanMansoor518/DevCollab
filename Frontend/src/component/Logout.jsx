import React, { useState } from "react";
import { BiLogOutCircle } from "react-icons/bi";
import { LogOut, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f60e.up.railway.app");

export default function Logout({ collapsed, variant = "default" }) {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {
        setLoading(true);

        try {
            const res = await axios.post(
                `${API_URL}/api/auth/user/logout`,
                {},
                {
                    withCredentials: true,
                }
            );

            Cookies.remove("token");
            localStorage.removeItem("ChatApp");

            toast.success("Logout Successfully");

            console.log(res.data);

            navigate("/");

            setTimeout(() => {
                window.location.reload();
            }, 300);
        } catch (error) {
            console.log("Error in Logout", error);
            toast.error("Error in logging out");
        } finally {
            setLoading(false);
        }
    };

    if (variant === "activitybar") {
        return (
            <button
                onClick={handleLogout}
                disabled={loading}
                title="Logout"
                className="relative w-full py-2 flex flex-col items-center justify-center gap-1 text-[#8B949E] hover:text-[#F85149] hover:bg-[#F85149]/10 transition-colors group cursor-pointer"
            >
                {loading ? (
                    <Loader2 size={18} className="animate-spin text-[#F85149]" />
                ) : (
                    <LogOut size={18} strokeWidth={1.75} className="group-hover:translate-x-0.5 transition-transform" />
                )}
                <span className="text-[9px] font-medium leading-none tracking-tight text-center text-[#6E7681] group-hover:text-[#F85149]">
                    Logout
                </span>
            </button>
        );
    }

    return (
        <div className="pt-1">
            <button
                onClick={handleLogout}
                disabled={loading}
                title={collapsed ? "Logout" : undefined}
                className={`group relative flex w-full items-center rounded text-xs font-medium text-[#8B949E] transition-colors hover:bg-[#F85149]/10 hover:text-[#F85149] disabled:opacity-50 select-none ${
                    collapsed ? "h-9 justify-center px-0" : "h-9 px-2.5 gap-2.5"
                }`}
            >
                <div className="flex items-center justify-center shrink-0">
                    {loading ? (
                        <Loader2 size={16} className="animate-spin text-[#F85149]" />
                    ) : (
                        <BiLogOutCircle size={16} className="transition-transform group-hover:scale-105" />
                    )}
                </div>

                {!collapsed && (
                    <span className="truncate">
                        {loading ? "Logging out..." : "Logout"}
                    </span>
                )}
            </button>
        </div>
    );
}
