import express from 'express';
import { 
  studentController, 
  employeeController, 
  departmentController, 
  courseController, 
  subjectController,
  timeTableController,
  timeTableEntryController,
  resourceController
} from '../controllers/academicAdminController.js';
import { protect, isAcademicAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes in this file
router.use(protect, isAcademicAdmin);

// Student Routes (Full CRUD)
router.get('/students', studentController.getAll);
router.post('/students', studentController.create);
router.put('/students/:id', studentController.update);
router.delete('/students/:id', studentController.delete);

// Employee Routes (Full CRUD)
router.get('/employees', employeeController.getAll);
router.post('/employees', employeeController.create);
router.put('/employees/:id', employeeController.update);
router.delete('/employees/:id', employeeController.delete);

// Department Routes (Full CRUD)
router.get('/departments', departmentController.getAll);
router.post('/departments', departmentController.create);
router.put('/departments/:id', departmentController.update);
router.delete('/departments/:id', departmentController.delete);

// Course Routes (Full CRUD)
router.get('/courses', courseController.getAll);
router.post('/courses', courseController.create);
router.put('/courses/:id', courseController.update);
router.delete('/courses/:id', courseController.delete);

// Subject Routes (Full CRUD)
router.get('/subjects', subjectController.getAll);
router.post('/subjects', subjectController.create);
router.put('/subjects/:id', subjectController.update);
router.delete('/subjects/:id', subjectController.delete);

// TimeTable Routes (The Group - Full CRUD)
router.get('/timetables', timeTableController.getAll);
router.post('/timetables', timeTableController.create);
router.put('/timetables/:id', timeTableController.update);
router.delete('/timetables/:id', timeTableController.delete);

// TimeTableEntry Routes (The Slot - Full CRUD)
router.get('/timetable-entries', timeTableEntryController.getAll);
router.post('/timetable-entries', timeTableEntryController.create);
router.put('/timetable-entries/:id', timeTableEntryController.update);
router.delete('/timetable-entries/:id', timeTableEntryController.delete);

// Resource Routes (The Master List - Full CRUD)
router.get('/resources', resourceController.getAll);
router.post('/resources', resourceController.create);
router.put('/resources/:id', resourceController.update);
router.delete('/resources/:id', resourceController.delete);

export default router;