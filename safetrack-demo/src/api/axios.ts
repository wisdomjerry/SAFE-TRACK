import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://safe-track-8a62.onrender.com",
});

// Automatically attach token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 1. Clear storage immediately to prevent infinite loops
      localStorage.removeItem("authToken");

      // 2. Show the toast
      toast.error("Session expired. Please login again.", {
        id: "session-expired", // Prevents multiple toasts if many requests fail at once
        duration: 3000,
      });

      // 3. Wait 2 seconds so the user can see the message, then redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
    return Promise.reject(error);
  },
);
export default api;
