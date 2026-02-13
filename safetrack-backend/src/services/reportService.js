// src/services/reportService.js
const { supabase } = require("../config/supabaseClient");

const reportService = {
  getSystemGrowth: async () => {
    // This query gets school signups grouped by month
    const { data, error } = await supabase
      .from('schools')
      .select('created_at');

    if (error) throw error;

    // Helper to format data for charts (counts occurrences by month)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growthData = months.map(m => ({ name: m, schools: 0, students: 0 }));

    data.forEach(item => {
      const monthIndex = new Date(item.created_at).getMonth();
      growthData[monthIndex].schools += 1;
    });

    return growthData;
  }
};

module.exports = reportService;