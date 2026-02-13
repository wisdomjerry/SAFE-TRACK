// src/services/permissionService.js
const { supabase } = require("../config/supabaseClient");

const permissionService = {
  fetchRolePermissions: async () => {
    // Fetches all roles and their associated permission strings
    const { data, error } = await supabase
      .from("role_permissions")
      .select("*")
      .order("role");

    if (error) throw error;
    return data;
  },

  updatePermissions: async (roleId, newPermissions) => {
    const { data, error } = await supabase
      .from("role_permissions")
      .update({ permissions: newPermissions })
      .eq("id", roleId);

    if (error) throw error;
    return data;
  }
};

module.exports = permissionService;