import { create } from "zustand";
import axios from "axios";
import Cookies from "js-cookie";

const useProjectStore = create((set, get) => ({
  projects: [],
  selectedProject: JSON.parse(localStorage.getItem("selectedProject")) || null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      // Robust token retrieval
      const authUser = JSON.parse(localStorage.getItem("ChatApp"));
      const token = authUser?.token || localStorage.getItem("token") || Cookies.get("token");

      console.log("Attempting to fetch projects. Token found:", token ? "Yes" : "No");

      if (!token) {
        console.warn("No token found in localStorage (ChatApp/token) or Cookies.");
        set({ loading: false });
        return;
      }

      const res = await axios.get("/api/project", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Projects fetched:", res.data);

      set({ projects: res.data || [], loading: false });

      // If selectedProject is set but not in the fresh list, or just to sync data
      const currentSelected = get().selectedProject;
      if (currentSelected) {
        const updatedSelected = res.data.find(p => p._id === currentSelected._id);
        if (updatedSelected) {
          set({ selectedProject: updatedSelected });
          localStorage.setItem("selectedProject", JSON.stringify(updatedSelected));
        } else {
          // Fix project leakage: clear project if it doesn't belong to current user
          set({ selectedProject: null });
          localStorage.removeItem("selectedProject");
        }
      } else if (res.data.length > 0) {
        // Optionally auto-select first one if none selected
        // set({ selectedProject: res.data[0] });
        // localStorage.setItem("selectedProject", JSON.stringify(res.data[0]));
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  setSelectedProject: (project) => {
    set({ selectedProject: project });
    if (project) {
      localStorage.setItem("selectedProject", JSON.stringify(project));
    } else {
      localStorage.removeItem("selectedProject");
    }
  },

  indexProject: async (projectId) => {
    set({ loading: true });
    try {
      const res = await axios.post(`/api/project/${projectId}/index`);

      // Update the project in the list
      const projects = get().projects.map(p =>
        p._id === projectId ? { ...p, projectStructure: res.data.structure, indexedCodeSummary: res.data.summary } : p
      );

      set({ projects, loading: false });

      // Update selectedProject if it's the one being indexed
      if (get().selectedProject?._id === projectId) {
        const updated = projects.find(p => p._id === projectId);
        set({ selectedProject: updated });
        localStorage.setItem("selectedProject", JSON.stringify(updated));
      }

      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));

export default useProjectStore;
