import db from '../models/index.js'; // ✅ CORRECTED: Default import
import { sendRegistrationEmail } from '../utils/mailer.js';

export const registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const formData = req.body;
  const t = await db.sequelize.transaction();
  
  try {
    const event = await db.Event.findByPk(eventId);
    if (!event || event.registrationLocked) {
      await t.rollback();
      return res.status(403).json({ message: 'Registration for this event is closed.' });
    }

    const paymentScreenshotPath = req.file ? `/uploads/${req.file.filename}` : null;

    // --- NEW VALIDATION BLOCK ---
    if (event.isPaidEvent) {
      if (!formData.transactionId) {
        await t.rollback();
        return res.status(400).json({ message: 'Transaction ID is required for paid events.' });
      }
      if (!paymentScreenshotPath) {
        await t.rollback();
        return res.status(400).json({ message: 'Payment screenshot is required for paid events.' });
      }
    }
    // --- END VALIDATION BLOCK ---

    // Path A & B: Individual Registration
    if (event.registrationType === 'Individual') {
      const { studentId, ...customFormData } = formData;

      // --- NEW VALIDATION ---
      if (!studentId) {
        await t.rollback();
        return res.status(400).json({ message: 'Student ID is required.' });
      }
      // --- END VALIDATION ---

      const student = await db.Student.findByPk(studentId);
      if (!student) {
        await t.rollback();
        return res.status(400).json({ message: `Student with ID ${studentId} not found.` });
      }

      const newMember = await db.EventMember.create({
        eventId,
        memberId: studentId,
        memberType: 'Student',
        role: 'Participant',
        teamId: null,
        paymentStatus: event.isPaidEvent ? 'Pending' : 'N/A',
        transactionId: event.isPaidEvent ? formData.transactionId : null,
        paymentScreenshotPath: event.isPaidEvent ? paymentScreenshotPath : null,
      }, { transaction: t });

      await t.commit();
      await sendRegistrationEmail(student.email, event.eventName, newMember.paymentStatus);
      res.status(201).json({ 
        message: `Registration ${event.isPaidEvent ? 'pending verification' : 'successful'}.`,
        data: newMember 
      });

    // Path C & D: Team Registration
    } else if (event.registrationType === 'Team') {
      const { teamName, teamLeaderStudentId, teamMemberStudentIds, ...customFormData } = formData;
      
      // --- NEW VALIDATION ---
      if (!teamName || !teamLeaderStudentId) {
        await t.rollback();
        return res.status(400).json({ message: 'Team Name and Team Leader ID are required.' });
      }
      // --- END VALIDATION ---

      const leader = await db.Student.findByPk(teamLeaderStudentId);
      if (!leader) {
        await t.rollback();
        return res.status(400).json({ message: `Team Leader Student ID ${teamLeaderStudentId} not found.` });
      }

      const newTeam = await db.Team.create({
        eventId,
        teamName,
        teamLeaderStudentId,
        customFormData: customFormData || {},
        paymentStatus: event.isPaidEvent ? 'Pending' : 'N/A',
        transactionId: event.isPaidEvent ? formData.transactionId : null,
        paymentScreenshotPath: event.isPaidEvent ? paymentScreenshotPath : null,
      }, { transaction: t });

      // Add all members
      const allStudentIds = [teamLeaderStudentId, ...(teamMemberStudentIds || [])];
      const memberPromises = allStudentIds.map(studentId => 
        db.EventMember.create({
          eventId,
          memberId: studentId,
          memberType: 'Student',
          role: 'Participant',
          teamId: newTeam.teamId,
        }, { transaction: t })
      );
      await Promise.all(memberPromises);
      
      await t.commit();
      await sendRegistrationEmail(leader.email, event.eventName, newTeam.paymentStatus);
      res.status(201).json({ 
        message: `Team registration ${event.isPaidEvent ? 'pending verification' : 'successful'}.`,
        data: newTeam
      });
    }

  } catch (error) {
    await t.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error processing registration' });
  }
};