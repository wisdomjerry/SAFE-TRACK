const superAdminService = require("../services/superAdminService");
const permissionService = require("../services/permissionService");
const userService = require("../services/userService");

const getSuperAdminStats = async (req, res) => {
  try {
    // We let the service do all the hard work
    const dashboardData = await superAdminService.getDashboardStats();

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("SuperAdmin Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemReports = async (req, res) => {
  try {
    // Basic logic to fetch some report data
    const { data: schools } = await supabase.from("schools").select("count");
    const { data: students } = await supabase.from("students").select("count");

    res.json({
      success: true,
      data: {
        totalSchools: schools,
        totalStudents: students,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllSchools = async (req, res) => {
  try {
    const schools = await superAdminService.fetchAllSchools();
    res.json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveSchool = async (req, res) => {
  const { id } = req.params;
  try {
    await superAdminService.updateSchoolStatus(id, "Active");
    res.json({ success: true, message: "School approved" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.fetchAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeUser = async (req, res) => {
  const { role, id } = req.params;
  try {
    await userService.deleteUser(role, id);
    res.json({ success: true, message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await permissionService.fetchRolePermissions();
    res.json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRolePermissions = async (req, res) => {
  const { id, permissions } = req.body;
  try {
    await permissionService.updatePermissions(id, permissions);
    res.json({ success: true, message: "Permissions updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

const createSchool = async (req, res) => {
  const { name, admin_email, pin } = req.body;
  try {
    // Note: You'll want to hash the PIN before saving!
    const hashedPin = await bcrypt.hash(pin, 10);
    const { data, error } = await supabase
      .from("schools")
      .insert([{ name, admin_email, pin: hashedPin, status: 'Active' }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSchool = async (req, res) => {
  const { id } = req.params;
  try {
    await superAdminService.deleteSchool(id);
    res.json({ success: true, message: "School deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

const updateSchool = async (req, res) => {
  const { id } = req.params;
  const { name, admin_email, status } = req.body;
  try {
    const { data, error } = await supabase
      .from("schools")
      .update({ name, admin_email, status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuperAdminStats,
  getSystemReports,
  getAllSchools,
  approveSchool,
  getAllUsers,
  removeUser,
  getPermissions,
  updateRolePermissions,
  deleteSchool,
  updateSchool,
  createSchool,
};
