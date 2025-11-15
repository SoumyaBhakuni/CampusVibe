import db from './models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'timetableData.json');

const importTimetableData = async () => {
  console.log('--- Starting Timetable Data Import ---');

  try {
    // 1. Read Data File
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const timetableSlots = JSON.parse(rawData);

    if (timetableSlots.length === 0) {
      console.log('No data found in timetableData.json. Exiting.');
      return;
    }

    // 2. Connect and Start Transaction
    await db.sequelize.authenticate();
    const t = await db.sequelize.transaction();
    console.log(`Processing ${timetableSlots.length} timetable slots...`);

    for (const slot of timetableSlots) {
      try {
        // --- A. Find or Create TimeTable Group ---
        const [timeTable, created] = await db.TimeTable.findOrCreate({
          where: {
            courseId: slot.courseId,
            year: slot.year,
            section: slot.section,
          },
          defaults: {
            courseId: slot.courseId,
            year: slot.year,
            section: slot.section,
          },
          transaction: t,
        });

        // --- B. Find Subject ID from Subject Code ---
        const subject = await db.Subject.findOne({
          where: { subjectCode: slot.subjectCode },
          attributes: ['subjectId'],
          transaction: t,
        });

        if (!subject) {
          console.error(`Skipping slot: Subject Code ${slot.subjectCode} not found in DB.`);
          continue; // Skip this slot and move to the next
        }

        // --- C. Create the TimeTable Entry Slot ---
        const [entry, entryCreated] = await db.TimeTableEntry.findOrCreate({
            where: {
                timeTableId: timeTable.timeTableId,
                subjectId: subject.subjectId,
                day: slot.day,
                timeSlot: slot.timeSlot,
            },
            defaults: {
                timeTableId: timeTable.timeTableId,
                subjectId: subject.subjectId,
                employeeId: slot.employeeId,
                day: slot.day,
                timeSlot: slot.timeSlot,
                roomNo: slot.roomNo,
            },
            transaction: t,
        });
        
        if (entryCreated) {
            // console.log(`  + Added entry for ${slot.subjectCode} on ${slot.day}`);
        } else {
            console.log(`  * Entry for ${slot.subjectCode} on ${slot.day} already exists. Skipping.`);
        }

      } catch (innerError) {
        console.error(`--- Error processing slot: ${slot.subjectCode} ---`, innerError.message);
        throw innerError; // Re-throw to trigger transaction rollback
      }
    }

    // 3. Commit Transaction
    await t.commit();
    console.log('✅ Timetable import completed successfully! Changes committed to DB.');

  } catch (error) {
    // 4. Rollback on Failure
    if (t && !t.finished) await t.rollback();
    console.error('❌ FATAL ERROR during import. Transaction rolled back:', error.message);
  } finally {
    await db.sequelize.close();
  }
};

importTimetableData();