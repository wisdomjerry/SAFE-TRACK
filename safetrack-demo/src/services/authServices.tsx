import axios from "../api/axios";

// This frontend service triggers the backend logic you created
const authService = {
  
  // --- 1. AUTHENTICATION PILLAR ---
  async login(phone_number: string, pin: string, role: string) {
    // We map to the unified backend endpoints we set up earlier
    const roleEndpoints: Record<string, string> = {
      DRIVER: "/api/drivers/login",
      PARENT: "/api/parents/login",
      SCHOOL_ADMIN: "/api/school/login",
      SUPER_ADMIN: "/api/admin/login",
    };

    const response = await axios.post(roleEndpoints[role], { phone_number, pin });
    return response.data; // Returns { success, token, data }
  },

  // --- 2. INPUT PILLAR (Registration) ---
  async registerSchool(formData: any) {
    // Connects to your school registration endpoint
    const response = await axios.post("/api/school/register", formData);
    return response.data;
  },

  // --- 3. FETCH PILLAR (Dashboard Data) ---
  async getDashboardData(role: string) {
    const roleEndpoints: Record<string, string> = {
      PARENT: "/api/parents/children",
      DRIVER: "/api/drivers/dashboard",
      SCHOOL_ADMIN: "/api/school/dashboard",
      SUPER_ADMIN: "/api/admin/stats",
    };

    const response = await axios.get(roleEndpoints[role]);
    return response.data; // Returns the children or driver stats
  }
};

export default authService;