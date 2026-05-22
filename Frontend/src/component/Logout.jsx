import React, { useState } from "react";
import { BiLogOutCircle } from "react-icons/bi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function Logout({ collapsed }) {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {
        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:3001/api/auth/user/logout",
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

    return (
        <div className="pt-2">
            <button
                onClick={handleLogout}
                disabled={loading}
                className={`group relative flex w-full items-center overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-error-soft hover:text-error disabled:opacity-60 ${collapsed ? "justify-center" : "justify-start"}`}
            >
                {/* ICON */}
                <div
                    className={`
            flex items-center justify-center shrink-0
            transition-all duration-500
            ${collapsed ? "w-full" : "mr-3"}
          `}
                >
                    {loading ? (
                        <Loader2
                            size={20}
                            className="animate-spin text-error"
                        />
                    ) : (
                        <BiLogOutCircle
                            size={22}
                            className="transition duration-200 group-hover:scale-110"
                        />
                    )}
                </div>

                {/* TEXT */}
                <span
                    className={`
            whitespace-nowrap overflow-hidden
            transition-all duration-500 ease-in-out
            ${collapsed
                            ? "max-w-0 opacity-0 translate-x-[-10px]"
                            : "max-w-[160px] opacity-100 translate-x-0"
                        }
          `}
                >
                    {loading ? "Logging out..." : "Logout"}
                </span>
            </button>
        </div>
    );
}
