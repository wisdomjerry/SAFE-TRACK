const { supabase } = require("../config/supabaseClient");

const userService = {
  fetchAllUsers: async () => {
    // 1. Fetching from all tables
    // Added 'profiles' for Super Admins so you can see yourself too!
    const [superAdmins, admins, drivers, parents] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email "),
      supabase.from("schools").select("id, name, admin_email"), // Using 'schools' table
      supabase.from("drivers").select("id, full_name, phone_number, schools(name)"),
      supabase
        .from("parents")
        .select("id, full_name, phone_number, created_at, schools(name)"),
    ]);

    // Check for errors
    if (superAdmins.error)
      console.error("SuperAdmin Error:", superAdmins.error.message);
    if (admins.error)
      console.error("Admin/School Error:", admins.error.message);
    if (drivers.error) console.error("Driver Error:", drivers.error.message);

    // 2. Combine with consistent field names (email/identifier)
    const combined = [
      ...(superAdmins.data || []).map((u) => ({
        ...u,
        role: "SUPER_ADMIN",
        identifier: u.email,
        school_name: "System Global"
      })),
      ...(admins.data || []).map((u) => ({
        ...u,
        role: "SCHOOL_ADMIN",
        identifier: u.admin_email,
        full_name: u.name,
        school_name: u.name
      })),
      ...(drivers.data || []).map((u) => ({
        ...u,
        role: "DRIVER",
        identifier: u.phone_number,
        school_name: u.schools?.name || "No School Linked"
      })),
      ...(parents.data || []).map((u) => ({
        ...u,
        role: "PARENT",
        identifier: u.phone_number,
        school_name: u.schools?.name || "No School Linked"
      })),
    ];

    console.log("Counts:", {
      super: superAdmins.data?.length,
      admins: admins.data?.length,
      drivers: drivers.data?.length,
      parents: parents.data?.length,
    });

    return combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  deleteUser: async (role, id) => {
    const tableMap = {
      SUPER_ADMIN: "profiles",
      SCHOOL_ADMIN: "schools",
      DRIVER: "drivers",
      PARENT: "parents",
    };

    const tableName = tableMap[role];
    if (!tableName) throw new Error("Invalid role for deletion");

    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};

module.exports = userService;
