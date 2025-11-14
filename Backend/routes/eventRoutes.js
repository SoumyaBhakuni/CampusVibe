import express from 'express';
import { 
  addEvent, 
  getEvents, 
  getEventById, 
  deleteEvent, 
  getEventLeaderboard,
  updateEvent // <-- 1. IMPORTED NEW FUNCTION
} from '../controllers/eventController.js';
import { protect, isOrganizer, checkPasswordChange } from '../middleware/authMiddleware.js';
import { uploadEventWizard } from '../utils/fileUploads.js'; // <-- This is re-used

const router = express.Router();

// --- PUBLIC ROUTES (for "Public User" lane) ---

router.get('/', getEvents);
router.get('/:id', getEventById);
router.get('/:id/leaderboard', getEventLeaderboard);

// --- PROTECTED ROUTES (for "Organizer" & "Admin" lanes) ---

// ✅ POST to create a new event (the "Add Event" wizard)
router.post(
  '/',
  protect,
  checkPasswordChange,
  isOrganizer,
  uploadEventWizard, 
  addEvent
);

// --- 2. ADDED NEW PUT ROUTE FOR EDITING ---
// ✅ PUT to update an existing event
router.put(
  '/:id',
  protect,
  checkPasswordChange,
  isOrganizer,
  uploadEventWizard, // Re-use the same upload handler
  updateEvent
);

// ✅ DELETE an event (Manual Deletion)
router.delete(
  '/:id',
  protect,
  checkPasswordChange,
  isOrganizer,
  deleteEvent
);

export default router;