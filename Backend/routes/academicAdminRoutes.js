import express from 'express';
import { 
  studentController, 
  employeeController, 
  departmentController, 
  courseController, 
  subjectController 
} from '../controllers/academicAdminController.js';
import { protect, isAcademicAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes in this file
router.use(protect, isAcademicAdmin);

// Student Routes
router.get('/students', studentController.getAll);
router.post('/students', studentController.create);

// Employee Routes
router.get('/employees', employeeController.getAll);
router.post('/employees', employeeController.create);

// Department Routes
router.get('/departments', departmentController.getAll);
router.post('/departments', departmentController.create);

// Course Routes
router.get('/courses', courseController.getAll);
router.post('/courses', courseController.create);

// Subject Routes
router.get('/subjects', subjectController.getAll);
router.post('/subjects', subjectController.create);

export default router;