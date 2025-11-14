import db from '../models/index.js';
import { Op } from 'sequelize';

// =================================================================
// ✅ 1. ADD EVENT (The new Setup Wizard)
// =================================================================
export const addEvent = async (req, res) => {
  const organizerId = req.user.id;
  const t = await db.sequelize.transaction(); // Start a transaction

  try {
    const organizer = await db.User.findByPk(organizerId, { transaction: t });

    if (organizer.eventCreationLimit <= 0) {
      await t.rollback();
      return res.status(403).json({ message: 'You have reached your event creation limit.' });
    }

    const {
      eventName, eventDesc, startTime, endTime, venue,
      clubId, contactDetails, registrationSchema, registrationType,
      isPaidEvent, hasLeaderboard, parentId, showLeaderboardMarks,
      registrationLocked
    } = req.body;
    
    // --- NEW VALIDATION BLOCK ---
    if (!eventName || !startTime || !endTime || !venue || !contactDetails) {
      await t.rollback();
      return res.status(400).json({
        message: 'Event Name, Start Time, End Time, Venue, and Contact Details are required.'
      });
    }
    // --- END VALIDATION BLOCK ---

    // --- NEW FILE UPLOAD LOGIC ---
    let bannerUrl = null;
    let paymentQRCodes = [];

    if (req.files) {
      if (req.files['banner'] && req.files['banner'][0]) {
        bannerUrl = `/uploads/${req.files['banner'][0].filename}`;
      }
      if (req.files['paymentQRCodes'] && req.files['paymentQRCodes'].length > 0) {
        paymentQRCodes = req.files['paymentQRCodes'].map(file => `/uploads/${file.filename}`);
      }
    }
    // --- END OF NEW FILE UPLOAD LOGIC ---

    const newEvent = await db.Event.create({
      eventName, eventDesc, startTime, endTime, venue, bannerUrl,
      organizerId,
      clubId: clubId || null,
      parentId: parentId || null,
      contactDetails: contactDetails ? JSON.parse(contactDetails) : {},
      registrationSchema: registrationSchema ? JSON.parse(registrationSchema) : {},
      paymentQRCodes: paymentQRCodes,
      registrationType,
      isPaidEvent,
      hasLeaderboard,
      showLeaderboardMarks: showLeaderboardMarks || false,
      registrationLocked: registrationLocked || false, 
    }, { transaction: t });

    // Decrement the organizer's limit
    organizer.eventCreationLimit -= 1;
    await organizer.save({ transaction: t });

    await t.commit(); 
    res.status(201).json(newEvent);

  } catch (error) {
    await t.rollback(); 
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event', error: error.message });
  }
};

// =================================================================
// ✅ 2. GET ALL PUBLIC EVENTS (REFACTORED - CORRECT LOGIC)
// =================================================================
export const getEvents = async (req, res) => {
  try {
    let whereClause = {
      endTime: { [Op.gte]: new Date() } // Only show future events
    };
    
    if (req.query.type === 'Fest') {
      whereClause.parentId = null;
    } else if (req.query.include === 'all') {
      whereClause = {}; // For Admin
    }
    // Default (no query) will now return all events (parent and sub)

    const events = await db.Event.findAll({
      where: whereClause,
      include: [
        { model: db.Club, attributes: ['clubName'] },
        { model: db.User, as: 'Organizer', attributes: ['email'] },
        { model: db.Event, as: 'ParentEvent', attributes: ['eventName'] }
      ],
      order: [['startTime', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// =================================================================
// ✅ 3. GET EVENT BY ID (The "Unified Dashboard")
// =================================================================
export const getEventById = async (req, res) => {
  try {
    const event = await db.Event.findByPk(req.params.id, {
      include: [
        { model: db.Club, attributes: ['clubName', 'clubLogoUrl'] },
        { model: db.User, as: 'Organizer', attributes: ['email'] },
        { model: db.Event, as: 'SubEvents', attributes: ['id', 'eventName', 'startTime'] }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

// =================================================================
// ✅ 4. DELETE EVENT (Manual Deletion)
// =================================================================
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const event = await db.Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (userRole !== 'EventAdmin' && event.organizerId !== userId) {
      return res.status(403).json({ message: 'User not authorized to delete this event' });
    }
    
    await event.destroy(); // 'onDelete: CASCADE' handles the rest

    res.status(200).json({ message: 'Event and all associated data successfully deleted.' });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

// =================================================================
// ✅ 5. GET EVENT LEADERBOARD (NEW FUNCTION)
// =================================================================
export const getEventLeaderboard = async (req, res) => {
  const { id } = req.params;
  try {
    const leaderboard = await db.Leaderboard.findAll({
      where: { eventId: id },
      order: [['rank', 'ASC']],
    });
    
    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found for this event' });
    }
    
    res.status(200).json(leaderboard);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

// =================================================================
// ✅ 6. UPDATE EVENT (NEW FUNCTION)
// =================================================================
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const organizerId = req.user.id;

  try {
    const event = await db.Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // --- CRITICAL OWNERSHIP CHECK ---
    if (event.organizerId !== organizerId) {
      return res.status(403).json({ message: 'User not authorized to update this event' });
    }

    const {
      eventName, eventDesc, startTime, endTime, venue,
      clubId, contactDetails
    } = req.body;

    // --- Update Text/JSON Fields ---
    // Only update fields that are provided in the request
    if (eventName) event.eventName = eventName;
    if (eventDesc) event.eventDesc = eventDesc;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (venue) event.venue = venue;
    if (clubId) event.clubId = clubId;
    if (contactDetails) event.contactDetails = JSON.parse(contactDetails);
    
    // (Note: Core rules like registrationType, isPaidEvent, etc., are NOT editable)

    // --- Update Files (if new ones are uploaded) ---
    if (req.files) {
      if (req.files['banner'] && req.files['banner'][0]) {
        event.bannerUrl = `/uploads/${req.files['banner'][0].filename}`;
      }
      if (req.files['paymentQRCodes'] && req.files['paymentQRCodes'].length > 0) {
        event.paymentQRCodes = req.files['paymentQRCodes'].map(file => `/uploads/${file.filename}`);
      }
    }

    const updatedEvent = await event.save();
    res.status(200).json(updatedEvent);

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};