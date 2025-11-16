import express from 'express';
import { 
  getPendingAdminRequests, 
  approveEventRequest, 
  rejectEventRequest,
  clubController,
  getAllUsers,
  updateUserRole,
  getAllEvents,
  adminDeleteEvent
} from '../controllers/adminController.js';
import { protect, isEventAdmin, checkPasswordChange } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, checkPasswordChange, isEventAdmin);

// --- Event Request Routes ---
router.get('/requests', getPendingAdminRequests);
router.post('/requests/:requestId/approve', approveEventRequest);
router.post('/requests/:requestId/reject', rejectEventRequest);

// --- User Management Routes ---
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole); 

// --- Event Management Routes ---
router.get('/events', getAllEvents);
router.delete('/events/:id', adminDeleteEvent);

// --- Club Management Routes ---
router.post('/clubs', clubController.create);
router.get('/clubs', clubController.getAll);
router.delete('/clubs/:id', clubController.delete); // FINAL CLUB DELETE ROUTE

// --- Resource Management Routes ---
// ALL RESOURCE ROUTES ARE REMOVED FROM HERE.

export default router;