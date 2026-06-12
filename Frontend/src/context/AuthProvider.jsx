import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const chatAppRaw = localStorage.getItem("ChatApp");
  const initialAuth = chatAppRaw ? JSON.parse(chatAppRaw) : (Cookies.get("token") || localStorage.getItem("token") || null);

  const [authUser, setAuthUser] = useState(initialAuth);

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
