import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const token = Cookies.get("token") || localStorage.getItem("token");

  const [authUser, setAuthUser] = useState(token || null);

  return (
    <AuthContext.Provider value={[authUser, setAuthUser]}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
