import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const chatAppRaw = localStorage.getItem("ChatApp");
  const initialAuth = chatAppRaw ? JSON.parse(chatAppRaw) : (Cookies.get("token") || localStorage.getItem("token") || null);

  const [authUser, setAuthUser] = useState(initialAuth);

  useEffect(() => {
    const user = authUser?.user;
    const density = user?.appearance?.layoutDensity || "comfortable";
    document.documentElement.setAttribute("data-density", density);
  }, [authUser]);

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
