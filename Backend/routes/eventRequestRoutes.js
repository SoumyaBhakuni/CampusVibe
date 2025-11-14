import express from 'express';
import { createEventRequest } from '../controllers/eventRequestController.js';

const router = express.Router();

// This is a PUBLIC route, so no 'protect' middleware is needed.
router.post('/', createEventRequest);

export default router;