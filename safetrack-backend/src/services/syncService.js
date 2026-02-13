const { supabase } = require("../config/supabaseClient");

/**
 * Syncs Vans and Drivers from Google Sheet data.
 * Splits a single row into 'profiles' (Driver) and 'vans' tables.
 */
const syncVansAndDriversFromSheet = async (sheetRows) => {
  const results = { created: 0, updated: 0, errors: [] };

  for (const row of sheetRows) {
    try {
      // 1. Extract data based on your Google Sheet columns
      const driverName = row["Driver Name"] || row["driver_name"];
      const driverPhone = String(row["Driver Phone"] || row["driver_phone"]);
      const plateNumber = row["Van Plate"] || row["plate_number"];
      const schoolId = row["school_id"];

      if (!driverPhone || !plateNumber) {
        throw new Error("Missing Driver Phone or Van Plate");
      }

      // 2. UPSERT the Driver into 'profiles'
      // We use phone_number as the unique key to prevent duplicate driver accounts
      const { data: driver, error: driverErr } = await supabase
        .from("profiles")
        .upsert(
          {
            full_name: driverName,
            phone_number: driverPhone,
            role: "DRIVER",
            school_id: schoolId,
            updated_at: new Date(),
          },
          { onConflict: "phone_number" }
        )
        .select()
        .single();

      if (driverErr) throw driverErr;

      // 3. UPSERT the Van and link it to the Driver's UUID
      const { error: vanErr } = await supabase
        .from("vans")
        .upsert(
          {
            plate_number: plateNumber,
            driver_id: driver.id, // The Foreign Key link
            school_id: schoolId,
            route_name: row["Route Name"] || row["route_name"],
            capacity: parseInt(row["Capacity"]) || 14,
            model: row["Model"] || null,
            status: "active",
            updated_at: new Date(),
          },
          { onConflict: "plate_number" }
        );

      if (vanErr) throw vanErr;

      results.updated++;
    } catch (err) {
      console.error(`Error syncing van ${row["Van Plate"]}:`, err.message);
      results.errors.push({ plate: row["Van Plate"], error: err.message });
    }
  }

  return results;
};

/**
 * Assigns a student to a van by plate number
 */
async function assignStudentToVan(student_name, school_id, plate_number) {
  // 1. Get van ID from plate
  const { data: vanData, error: vanError } = await supabase
    .from("vans")
    .select("id")
    .eq("plate_number", plate_number)
    .eq("school_id", school_id)
    .single();

  if (vanError || !vanData) throw new Error("Van not found");

  // 2. Update student with assigned_van_id
  const { error: studentError } = await supabase
    .from("students")
    .update({ assigned_van_id: vanData.id })
    .eq("name", student_name)
    .eq("school_id", school_id);

  if (studentError) throw new Error(studentError.message);

  return true;
}

module.exports = {
  syncVansAndDriversFromSheet,
  assignStudentToVan
};