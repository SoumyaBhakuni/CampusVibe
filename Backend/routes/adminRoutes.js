import express from 'express';
import { 
  getPendingAdminRequests, 
  approveEventRequest, 
  rejectEventRequest,
  clubController,
  resourceController // <-- Make sure this is imported
} from '../controllers/adminController.js';
// 1. CHANGE THIS IMPORT
import { protect, isEventAdmin, checkPasswordChange } from '../middleware/authMiddleware.js';

const router = express.Router();

// 2. CHANGE THIS MIDDLEWARE
router.use(protect, checkPasswordChange, isEventAdmin);

// --- Event Request Routes ---
router.get('/requests', getPendingAdminRequests);
router.post('/requests/:requestId/approve', approveEventRequest);
router.post('/requests/:requestId/reject', rejectEventRequest);

// --- Club Management Routes ---
router.post('/clubs', clubController.create);
router.get('/clubs', clubController.getAll);
// (You would add router.put('/clubs/:id', clubController.update) etc. here)

// --- Resource Management Routes ---
router.post('/resources', resourceController.create);
router.get('/resources', resourceController.getAll);
// (You would add router.put('/resources/:id', resourceController.update) etc. here)

export default router;