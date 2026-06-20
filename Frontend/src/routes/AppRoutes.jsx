import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Chat from "../pages/Chat/Chat";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import DevCollabLanding from "../pages/Home/DevCollabLanding";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProjectsDashboard from "../pages/Project/ProjectsDashboard";
import ReportsOverview from "../pages/Report/ReportDashboard";
import { useAuth } from "../context/AuthProvider";
import ProjectCommit from "../pages/Project/ProjectCommit";
import Ai from "../pages/Chat/AiFeature/Ai.jsx";
import HelpCenter from "../pages/Help/HelpCenter.jsx";
import Settings from "../pages/Settings/Settings.jsx";

function AppRoutes() {
  const [authUser, setAuthUser] = useAuth();
  return (
    <Routes>

      <Route path="/" element={<DevCollabLanding />} />

      <Route
        path="/login"
        element={authUser ? <Navigate to={"/dashboard"} /> : <Login />} />
      <Route
        path="/signup"
        element={authUser ? <Navigate to="/dashboard" /> : <Signup />}
      />


      <Route path="/dashboard" element={
        authUser ? <Dashboard /> : <Navigate to="/" />
      } />

      <Route path="/project" element={<ProjectsDashboard />} />
      <Route path="/project/:id" element={<ProjectCommit />} />


      <Route path="/chat" element={
        authUser ? <Chat /> : <Navigate to="/" />
      } />


      <Route path="/AIAssistant" element={
        authUser ? <Ai /> : <Navigate to="/" />
      } />

      <Route path="/report" element={
        authUser ? <ReportsOverview /> : <Navigate to="/" />
      } />

      <Route path="/help" element={
        authUser ? <HelpCenter /> : <Navigate to="/" />
      } />

      <Route path="/settings" element={
        authUser ? <Settings /> : <Navigate to="/" />
      } />
    </Routes>
  );
}

export default AppRoutes;

