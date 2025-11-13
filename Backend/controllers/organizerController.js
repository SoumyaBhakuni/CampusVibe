import db from '../models/index.js';
import { sendPaymentRejectedEmail } from '../utils/mailer.js';
import { Op } from 'sequelize';

// =================================================================
// ✅ 1. GET MY EVENTS
// =================================================================
export const getMyEvents = async (req, res) => {
  const organizerId = req.user.id;
  try {
    const events = await db.Event.findAll({
      where: { organizerId: organizerId },
      order: [['startTime', 'DESC']],
    });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// =================================================================
// ✅ 2. GET PENDING SUB-EVENT REQUESTS (for Main Organizer)
// =================================================================
export const getPendingSubEventRequests = async (req, res) => {
  const mainOrganizerId = req.user.id;
  try {
    const mainEvents = await db.Event.findAll({ 
      where: { organizerId: mainOrganizerId, parentId: null } 
    });
    const mainEventIds = mainEvents.map(e => e.id);

    const requests = await db.EventRequest.findAll({
      where: {
        parentFestId: mainEventIds,
        status: 'Pending_Main_Organizer',
      }
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 3. APPROVE SUB-EVENT REQUEST (Main Organizer Step 2)
// =================================================================
export const approveSubEventRequest = async (req, res) => {
  const { requestId } = req.params;
  // (In a real app, we'd also check if req.user is the owner of the parent fest)
  try {
    const request = await db.EventRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = 'Approved';
    await request.save();
    // (Add logic to email the Sub-Organizer that they are fully approved)
    res.status(200).json({ message: 'Sub-event request approved.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 4. REJECT SUB-EVENT REQUEST (Main Organizer)
// =================================================================
export const rejectSubEventRequest = async (req, res) => {
  const { requestId } = req.params;
  const t = await db.sequelize.transaction();
  try {
    // (Add logic to ensure req.user is the Main Organizer)
    const request = await db.EventRequest.findByPk(requestId, { transaction: t });
    if (!request) {
      await t.rollback();
      return res.status(404).json({ message: 'Request not found.' });
    }
    
    request.status = 'Rejected';
    await request.save({ transaction: t });

    // Find the user who was created and revoke their access
    const userToRevoke = await db.User.findOne({ where: { email: request.requestorEmail }, transaction: t });
    if (userToRevoke) {
      userToRevoke.role = 'Guest';
      await userToRevoke.save({ transaction: t });
    }
    
    await t.commit();
    // (Add logic to email the Sub-Organizer about the rejection)
    res.status(200).json({ message: 'Sub-event request rejected and user access revoked.' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};

// =================================================================
// ✅ 5. GET PENDING PAYMENT VERIFICATIONS
// =================================================================
export const getPendingVerifications = async (req, res) => {
  const { eventId } = req.params;
  // (Add check to ensure req.user owns this eventId)
  try {
    // Get all Teams for this event
    const teams = await db.Team.findAll({ 
      where: { eventId, paymentStatus: 'Pending' } 
    });
    // Get all Individuals for this event
    const individuals = await db.EventMember.findAll({
      where: { eventId, teamId: null, paymentStatus: 'Pending', role: 'Participant' }
    });
    res.status(200).json({ teams, individuals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 6. VERIFY A PAYMENT (Organizer Button)
// =================================================================
export const verifyPayment = async (req, res) => {
  const { type, id } = req.body; // e.g., type: 'Team', id: 12
  // (Add check to ensure req.user owns this event)
  try {
    let record;
    if (type === 'Team') {
      record = await db.Team.findByPk(id);
    } else {
      record = await db.EventMember.findByPk(id);
    }
    
    if (!record) return res.status(404).json({ message: 'Record not found' });
    
    record.paymentStatus = 'Verified';
    await record.save();
    // (Add logic to send "Payment Verified" email)
    res.status(200).json({ message: 'Payment verified.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 7. REJECT A PAYMENT (Organizer Button)
// =================================================================
export const rejectPayment = async (req, res) => {
  const { type, id, reason } = req.body; 
  try {
    let record;
    let studentEmail;
    let eventName;
    
    if (type === 'Team') {
      record = await db.Team.findByPk(id, { 
        include: [
          db.Event, 
          { model: db.Student, as: 'TeamLeader', include: [db.Course] }
        ] 
      });
      studentEmail = record.TeamLeader.email;
      eventName = record.Event.eventName;
    } else {
      record = await db.EventMember.findByPk(id, { 
        include: [
          db.Event, 
          { model: db.Student, include: [db.Course] }
        ] 
      });
      studentEmail = record.Student.email;
      eventName = record.Event.eventName;
    }
    
    if (!record) return res.status(404).json({ message: 'Record not found' });

    // We don't just reject, we delete the fraudulent registration
    await record.destroy(); // This will cascade delete members if it's a Team
    
    await sendPaymentRejectedEmail(studentEmail, eventName, reason);
    
    res.status(200).json({ message: 'Payment rejected and registration deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 8. GET TEAM (Get internal organizing team)
// =================================================================
export const getEventTeam = async (req, res) => {
  const { eventId } = req.params;
  try {
    const teamMembers = await db.EventMember.findAll({
      where: {
        eventId,
        role: { [Op.or]: ['Student Organiser', 'Committee Member', 'Employee Organiser'] }
      },
      include: [db.Student, db.Employee]
    });
    res.status(200).json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =================================================================
// ✅ 9. BUILD TEAM (Add Student/Employee Organiser)
// =================================================================
export const addTeamMember = async (req, res) => {
  const { eventId } = req.params;
  const { memberId, memberType, role } = req.body; // e.g., "S123", "Student", "Student Organiser"
  
  if (!['Student Organiser', 'Committee Member', 'Employee Organiser'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  
  try {
    // Check if member already exists
    const existing = await db.EventMember.findOne({ where: { eventId, memberId, role } });
    if (existing) {
      return res.status(400).json({ message: 'This person is already on your team with this role.' });
    }
    
    const newMember = await db.EventMember.create({
      eventId,
      memberId,
      memberType,
      role,
      paymentStatus: 'N/A' // Internal team members don't pay
    });
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =================================================================
// ✅ 10. REMOVE TEAM MEMBER
// =================================================================
export const removeTeamMember = async (req, res) => {
  const { eventId, memberId } = req.params;
  // (In a real app, memberId would be the 'EventMember' PK, not the studentId)
  try {
    await db.EventMember.destroy({
      where: {
        eventId,
        id: memberId // Assuming the frontend sends the EventMember ID
      }
    });
    res.status(200).json({ message: 'Team member removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =================================================================
// ✅ 11. UPDATE LEADERBOARD
// =================================================================
export const updateLeaderboard = async (req, res) => {
  const { eventId } = req.params;
  const { scores, showMarks } = req.body; // scores: [{ competitorId, competitorType, marks }]
  
  const t = await db.sequelize.transaction();
  try {
    // 1. Update the event's "show marks" toggle
    await db.Event.update({ showLeaderboardMarks: showMarks }, { where: { id: eventId }, transaction: t });

    // 2. Update all scores
    const scorePromises = scores.map(s => 
      db.Leaderboard.upsert({ // 'upsert' will create or update
        eventId,
        competitorId: s.competitorId,
        competitorType: s.competitorType,
        marks: s.marks
      }, { transaction: t })
    );
    await Promise.all(scorePromises);
    
    // (A real implementation would re-calculate ranks here)

    await t.commit();
    res.status(200).json({ message: 'Leaderboard updated.' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};