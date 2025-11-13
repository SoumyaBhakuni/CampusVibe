import { Op } from 'sequelize';
import db from '../models/index.js';
import { 
  sendCertificateEmail, 
  sendFinalReportEmail,
  sendAccessWarningEmail // This import will now work
} from '../utils/mailer.js';

// =================================================================
// ✅ 1. THE MAIN OFF-BOARDING SCRIPT
// =================================================================
export const runOffboardingScript = async () => {
  console.log('Running daily off-boarding script...');
  const t = await db.sequelize.transaction();

  try {
    const usersToRevoke = await db.User.findAll({
      where: {
        role: { [Op.ne]: 'Guest' },
        accessExpiryDate: { [Op.lte]: new Date() }
      },
      transaction: t
    });

    if (usersToRevoke.length === 0) {
      console.log('No users to revoke today.');
      await t.commit();
      return;
    }

    for (const user of usersToRevoke) {
      console.log(`Processing off-boarding for user: ${user.email}`);
      const events = await db.Event.findAll({
        where: { organizerId: user.id },
        transaction: t
      });

      for (const event of events) {
        console.log(`-- Archiving event: ${event.eventName}`);

        const allMembers = await db.EventMember.findAll({
          where: { eventId: event.id }, // Get ALL members
          include: [
            { model: db.Student, include: [db.Course] }, 
            db.Employee, 
            db.Team
          ],
          transaction: t
        });
        
        const attendedMembers = allMembers.filter(m => m.checkedIn);

        // 4. Send Certificates (only to *attended* members)
        for (const member of attendedMembers) {
          if (member.memberType === 'Student') {
            const student = member.Student;
            const paymentOK = !event.isPaidEvent || 
                              (member.teamId && member.Team.paymentStatus === 'Verified') || 
                              (!member.teamId && member.paymentStatus === 'Verified');

            if (student && paymentOK) {
              let certType = null;
              if (member.role === 'Participant') certType = 'Certificate of Participation';
              if (member.role === 'Committee Member') certType = 'Certificate of Appreciation';
              if (member.role === 'Student Organiser') certType = 'Certificate of Leadership';

              if (certType) {
                // ✅ UN-COMMENTED
                await sendCertificateEmail(student.email, student.name, certType, event.eventName);
              }
            }
          }
        }

        // 5. Send Final Report (to Admin & Organizer)
        const reportData = { eventName: event.eventName, participants: allMembers.length };
        // ✅ UN-COMMENTED
        await sendFinalReportEmail(user.email, event.eventName, reportData);
        await sendFinalReportEmail(process.env.ADMIN_EMAIL, event.eventName, reportData); // Send to Admin
        
        // 6. Archive Permanent Stats
        const archive = await db.EventArchive.create({
          originalEventId: event.id,
          eventName: event.eventName,
          organizerName: user.email,
          date: event.startTime,
          venue: event.venue,
          participantCount: attendedMembers.length,
        }, { transaction: t });
        
        // 7. Archive Permanent Proof (using *attended* members)
        for (const member of attendedMembers) {
          const archiveData = { eventArchiveId: archive.id };
          if (member.memberType === 'Student') {
            const studentData = { ...archiveData, studentId: member.memberId };
            if (member.role === 'Participant') {
              await db.ParticipatedEvent.create(studentData, { transaction: t });
            }
            if (member.role === 'Committee Member') {
              await db.CommitteeEvent.create(studentData, { transaction: t });
            }
            if (member.role === 'Student Organiser') {
              await db.OrganizedEvent.create(studentData, { transaction: t });
            }
          } else if (member.memberType === 'Employee' && member.role === 'Employee Organiser') {
            await db.EmployeeOrganizedEvent.create({ ...archiveData, employeeId: member.memberId }, { transaction: t });
          }
        }
        
        // 8. PURGE all temporary event data
        await event.destroy({ transaction: t });
        console.log(`-- Event ${event.eventName} purged.`);
      }

      // 9. REVOKE User Access
      user.role = 'Guest';
      user.eventCreationLimit = 0;
      await user.save({ transaction: t });
      console.log(`User ${user.email} role set to "Guest".`);
    }

    await t.commit();
    console.log('Off-boarding script completed successfully.');

  } catch (error) {
    await t.rollback();
    console.error('Error during off-boarding script:', error);
  }
};

// =================================================================
// ✅ 2. THE EXPIRY WARNING SCRIPT
// =================================================================
export const sendExpiryWarning = async () => {
  console.log('Running daily expiry warning script...');
  try {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    
    const usersToExpire = await db.User.findAll({
      where: {
        role: { [Op.ne]: 'Guest' },
        accessExpiryDate: {
          [Op.lte]: soon,
          [Op.gt]: new Date() 
        }
      }
    });

    for (const user of usersToExpire) {
      console.log(`Sending expiry warning to ${user.email}`);
      // ✅ UN-COMMENTED
      await sendAccessWarningEmail(user.email, user.accessExpiryDate);
    }
    
  } catch (error) {
    console.error('Error sending expiry warnings:', error);
  }
};