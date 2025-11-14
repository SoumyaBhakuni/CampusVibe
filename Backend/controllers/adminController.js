import db from '../models/index.js'; // ✅ CORRECTED: Default import
import { createOrganizerUser } from './authController.js';
import { Op } from 'sequelize';

// =================================================================
// ✅ 1. EVENT REQUEST MANAGEMENT (Unchanged)
// =================================================================
export const getPendingAdminRequests = async (req, res) => {
  try {
    const requests = await db.EventRequest.findAll({
      where: { status: 'Pending_Admin' },
      order: [['createdAt', 'ASC']],
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveEventRequest = async (req, res) => {
  const { requestId } = req.params;
  const { eventCreationLimit, accessExpiryDate } = req.body; 

  try {
    const request = await db.EventRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Event request not found.' });
    }
    if (request.status !== 'Pending_Admin') {
      return res.status(400).json({ message: 'Request is not pending admin approval.' });
    }

    const { user, randomPassword } = await createOrganizerUser({
      email: request.requestorEmail,
      role: request.scope === 'Part of Fest' ? 'SubOrganizer' : 'Organizer',
      eventCreationLimit,
      accessExpiryDate,
    });

    const newStatus = request.scope === 'Part of Fest' ? 'Pending_Main_Organizer' : 'Approved';
    request.status = newStatus;
    await request.save();

    res.status(201).json({
      message: `User created and request status updated to ${newStatus}.`,
      userEmail: user.email,
      tempPassword: randomPassword, 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectEventRequest = async (req, res) => {
  const { requestId } = req.params;
  try {
    const request = await db.EventRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Event request not found.' });
    }
    request.status = 'Rejected';
    await request.save();
    // (Add logic here to send "Your request was rejected" email)
    res.status(200).json({ message: 'Event request has been rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =================================================================
// ✅ 2. GENERIC CRUD CONTROLLER FACTORY (For Event Assets)
// =================================================================
const createCrudController = (modelName) => {
  // ... (Unchanged code)
  const Model = db[modelName];
  return {
    create: async (req, res) => {
      try {
        const item = await Model.create(req.body);
        res.status(201).json(item);
      } catch (error) {
        res.status(500).json({ message: `Error creating ${modelName}`, error: error.message });
      }
    },
    getAll: async (req, res) => {
      try {
        const items = await Model.findAll();
        res.status(200).json(items);
      } catch (error) {
        res.status(500).json({ message: `Error fetching ${modelName}`, error: error.message });
      }
    },
    getById: async (req, res) => {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: `${modelName} not found` });
        res.status(200).json(item);
      } catch (error) {
        res.status(500).json({ message: `Error fetching ${modelName}`, error: error.message });
      }
    },
    update: async (req, res) => {
      try {
        const [updated] = await Model.update(req.body, { where: { id: req.params.id } });
        if (updated) {
          const updatedItem = await Model.findByPk(req.params.id);
          res.status(200).json(updatedItem);
        } else {
          res.status(404).json({ message: `${modelName} not found` });
        }
      } catch (error) {
        res.status(500).json({ message: `Error updating ${modelName}`, error: error.message });
      }
    },
    delete: async (req, res) => {
      try {
        const deleted = await Model.destroy({ where: { id: req.params.id } });
        if (deleted) {
          res.status(200).json({ message: `${modelName} deleted` });
        } else {
          res.status(404).json({ message: `${modelName} not found` });
        }
      } catch (error) {
        res.status(500).json({ message: `Error deleting ${modelName}`, error: error.message });
      }
    },
  };
};

// =================================================================
// ✅ 3. EXPORT EVENT ASSET CRUD CONTROLLERS
// =================================================================
export const resourceController = createCrudController('Resource');
export const clubController = createCrudController('Club');

// =================================================================
// ✅ 4. NEW ADMIN-SPECIFIC FUNCTIONS
// =================================================================

/**
 * GET /api/admin/users
 * Fetches all users that are not Admins
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      where: {
        role: {
          [Op.notIn]: ['EventAdmin', 'AcademicAdmin']
        }
      },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Updates a user's role (e.g., to 'Guest' to revoke access)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Basic validation
    if (!role || !['Organizer', 'SubOrganizer', 'Guest'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    // If we revoke access, also set their limit to 0
    if (role === 'Guest') {
      user.eventCreationLimit = 0;
    }
    
    await user.save();
    
    const updatedUser = user.toJSON();
    delete updatedUser.password;
    
    res.status(200).json(updatedUser);

  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

/**
 * GET /api/admin/events
 * Fetches all events in the system, regardless of organizer
 */
export const getAllEvents = async (req, res) => {
  try {
    const events = await db.Event.findAll({
      include: [
        { model: db.User, as: 'Organizer', attributes: ['email'] },
        { model: db.Club, attributes: ['clubName'] }
      ],
      order: [['startTime', 'DESC']]
    });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all events', error: error.message });
  }
};

/**
 * DELETE /api/admin/events/:id
 * Allows an Admin to delete any event
 */
export const adminDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Since we are behind the isEventAdmin middleware, we don't need
    // to check ownership. We just delete it.
    await event.destroy(); // onDelete: 'CASCADE' will purge all associated data
    
    res.status(200).json({ message: 'Event and all associated data successfully deleted.' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};