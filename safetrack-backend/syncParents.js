require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');
const bcrypt = require('bcrypt');

async function syncParents() {
  try {
    // 1️⃣ Fetch all students
    const { data: students, error: studentsErr } = await supabase
      .from('students')
      .select('*');

    if (studentsErr) throw studentsErr;

    for (const student of students) {
      if (!student.parent_phone) continue;

      // 2️⃣ Check if parent already exists
      const { data: existingParent } = await supabase
        .from('parents')
        .select('*')
        .eq('phone_number', student.parent_phone)
        .single();

      let parentId;

      if (existingParent) {
        parentId = existingParent.id;
      } else {
        // 3️⃣ Insert new parent with default PIN
        const defaultPin = '1234';
        const hashedPin = await bcrypt.hash(defaultPin, 10);

        const { data: newParent, error: insertErr } = await supabase
          .from('parents')
          .insert([{
            full_name: student.parent_name || 'Unknown Parent',
            phone_number: student.parent_phone,
            pin: hashedPin,
            school_id: student.school_id
          }])
          .select()
          .single();

        if (insertErr) {
          console.error('Failed to insert parent:', insertErr);
          continue;
        }

        parentId = newParent.id;
      }

      // 4️⃣ Update student with parent_id
      const { error: updateErr } = await supabase
        .from('students')
        .update({ parent_id: parentId })
        .eq('id', student.id);

      if (updateErr) console.error('Failed to update student.parent_id:', updateErr);
    }

    console.log('✅ Parent sync completed!');
  } catch (err) {
    console.error(err);
  }
}

syncParents();
