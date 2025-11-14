import db from '../models/index.js'; // ✅ CORRECTED: Default import
import { sendAttendanceReportEmail } from '../utils/mailer.js';
import { Op } from 'sequelize';

// --- NEW HELPER FUNCTIONS ---

// 1. Helper to get Day of Week
// (Note: This is a simple implementation for single-day events)
const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
};

// 2. Helper to check for time overlap
// timeSlot is "HH:MM-HH:MM" (e.g., "09:00-11:00")
// eventStartTime and eventEndTime are Date objects
const timeSlotOverlap = (timeSlot, eventStartTime, eventEndTime) => {
  try {
    const [startStr, endStr] = timeSlot.split('-');
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    // Create Date objects for the class times on the same day as the event
    const classStart = new Date(eventStartTime);
    classStart.setHours(startHour, startMin, 0, 0);
    
    const classEnd = new Date(eventStartTime);
    classEnd.setHours(endHour, endMin, 0, 0);

    // Standard overlap check: (StartA < EndB) and (EndA > StartB)
    return (classStart < eventEndTime) && (classEnd > eventStartTime);
    
  } catch (error) {
    console.error(`Error parsing time slot: ${timeSlot}`, error);
    return false; // Fail safely
  }
};

// --- END HELPER FUNCTIONS ---


// =================================================================
// ✅ 1. SEND ATTENDANCE REPORT (REFACTORED)
// =================================================================
export const sendAttendanceReport = async (req, res) => {
  const { eventId } = req.params;
  try {
    const event = await db.Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // --- 1. Get Event Time & Day ---
    const eventStartTime = new Date(event.startTime);
    const eventEndTime = new Date(event.endTime);
    // (This simple logic assumes the event is on a single day)
    const eventDay = getDayOfWeek(eventStartTime);

    // 2. Get all *checked in* student attendees
    const attendees = await db.EventMember.findAll({
      where: { eventId, checkedIn: true, memberType: 'Student' },
      include: [{ model: db.Student, include: [db.Course] }]
    });

    if (attendees.length === 0) {
      return res.status(200).json({ message: 'No students were checked in. No reports sent.' });
    }

    // 3. Get the "Generalised Committee List"
    const committee = await db.EventMember.findAll({
      where: {
        eventId,
        memberType: 'Student',
        role: { [Op.or]: ['Student Organiser', 'Committee Member'] }
      },
      include: [{ model: db.Student, include: [db.Course] }]
    });

    // 4. Find all TimeTableEntries that conflict with the event
    const studentGroups = [...new Set(attendees.map(a => 
      `${a.Student.courseId}-${a.Student.year}-${a.Student.section}`
    ))];

    const timeTables = await db.TimeTable.findAll({
      where: {
        [Op.or]: studentGroups.map(g => {
          const [courseId, year, section] = g.split('-');
          return { courseId, year, section };
        })
      }
    });
    
    const timeTableIds = timeTables.map(t => t.timeTableId);

    // --- REFACTORED QUERY ---
    // Now filters by the specific day of the event
    const conflictingEntries = await db.TimeTableEntry.findAll({
      where: {
        timeTableId: timeTableIds,
        day: eventDay // <-- Only check classes on the same day as the event
      },
      include: [
        { model: db.TimeTable, include: [db.Course] },
        { model: db.Employee, attributes: ['email', 'name', 'employeeId'] },
        { model: db.Subject }
      ]
    });
    // --- END REFACTORED QUERY ---

    // 5. Map attendees to their conflicting classes
    const conflictMap = new Map(); // Key: employeeId, Value: { employee, classes: Map }
    
    for (const attendee of attendees) {
      const student = attendee.Student;
      
      const missedClasses = conflictingEntries.filter(entry => 
        // 1. Check if the class is for this student's group
        (entry.TimeTable.courseId === student.courseId &&
        entry.TimeTable.year === student.year &&
        entry.TimeTable.section === student.section) &&
        
        // 2. Check if the class time *actually overlaps* with the event time
        timeSlotOverlap(entry.timeSlot, eventStartTime, eventEndTime)
      );

      for (const entry of missedClasses) {
        const employee = entry.Employee;
        const employeeId = employee.employeeId;

        if (!conflictMap.has(employeeId)) {
          conflictMap.set(employeeId, {
            employee: employee,
            classes: new Map() 
          });
        }
        
        const employeeData = conflictMap.get(employeeId);
        const classKey = `${entry.TimeTable.Course.courseName} ${entry.TimeTable.year} ${entry.TimeTable.section} (${entry.Subject.subjectName}) - Slot: ${entry.timeSlot}`;

        if (!employeeData.classes.has(classKey)) {
          employeeData.classes.set(classKey, {
            entry: entry,
            students: []
          });
        }
        
        employeeData.classes.get(classKey).students.push(student);
      }
    }

    // 6. Send one consolidated email per employee
    const mailPromises = [];
    for (const [employeeId, data] of conflictMap.entries()) {
      mailPromises.push(
        sendAttendanceReportEmail({
          employee: data.employee,
          event,
          classes: data.classes, 
          committeeList: committee, // Pass the correct variable
        })
      );
    }

    if (mailPromises.length === 0) {
       return res.status(200).json({ message: `Attendance report complete. No conflicting classes found for checked-in students.` });
    }

    await Promise.all(mailPromises);

    res.status(200).json({ message: `Attendance report sent to ${mailPromises.length} faculty members.` });

  } catch (error) {
    console.error('Error sending attendance report:', error);
    res.status(500).json({ message: 'Error sending attendance report' });
  }
};