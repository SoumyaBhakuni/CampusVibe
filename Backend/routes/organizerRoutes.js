import express from 'express';
import {
  getPendingSubEventRequests,
  approveSubEventRequest,
  rejectSubEventRequest,
  getPendingVerifications,
  verifyPayment,
  rejectPayment,
  addTeamMember,          // <-- This was missing
  updateLeaderboard,      // <-- This was missing
  getMyEvents,
  getEventTeam,           // <-- This is new
  removeTeamMember        // <-- This is new
} from '../controllers/organizerController.js';
import { resourceController } from '../controllers/adminController.js';
import { protect, isOrganizer, checkPasswordChange } from '../middleware/authMiddleware.js';

const router = express.Router();

// This line is a MASTER middleware for all routes in this file
router.use(protect, checkPasswordChange, isOrganizer);

// --- Get Events & Resources ---
router.get('/my-events', getMyEvents);
router.get('/resources', resourceController.getAll);

// --- Sub-Event Approval (for Main Organizers) ---
router.get('/requests/pending', getPendingSubEventRequests);
router.post('/requests/:requestId/approve', approveSubEventRequest);
router.post('/requests/:requestId/reject', rejectSubEventRequest);

// --- Payment Verification ---
router.get('/event/:eventId/verifications', getPendingVerifications);
router.post('/verify-payment', verifyPayment);
router.post('/reject-payment', rejectPayment);

// --- Team Management ---
router.get('/event/:eventId/team', getEventTeam); // <-- NEW: To get the current team
router.post('/event/:eventId/team', addTeamMember); // <-- NEW: To add a member
router.delete('/event/:eventId/team/:memberId', removeTeamMember); // <-- NEW: To remove a member

// --- Leaderboard Management ---
router.put('/event/:eventId/leaderboard', updateLeaderboard); // <-- NEW

export default router;