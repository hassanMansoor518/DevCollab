import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Home from "../Home/Home";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import { useAuth } from "../context/AuthProvider";

function AppRoutes() {
  const [authUser, setAuthUser] = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        authUser ? <Home /> : <Navigate to="/login" />
      } />
      <Route
        path="/login"
        element={authUser ? <Navigate to={"/"} /> : <Login />} />
      <Route
        path="/signup"
        element={authUser ? <Navigate to="/" /> : <Signup />}
      /> 

    

    </Routes>
  );
}

export default AppRoutes;

