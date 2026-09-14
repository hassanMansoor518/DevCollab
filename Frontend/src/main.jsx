import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from "axios";

const queryClient = new QueryClient();

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f60e.up.railway.app");
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Suppress benign Monaco editor internal cancellation errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      (event.reason.name === "Canceled" ||
        event.reason.message === "Canceled" ||
        event.reason === "Canceled" ||
        event.reason?.type === "cancelation")
    ) {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);