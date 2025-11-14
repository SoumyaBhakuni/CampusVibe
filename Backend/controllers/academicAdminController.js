// Backend/controllers/academicAdminController.js
import db from '../models/index.js';

// =================================================================
// ✅ GENERIC CRUD CONTROLLER FACTORY
// =================================================================
const createCrudController = (modelName) => {
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
// ✅ EXPORT ALL ACADEMIC CRUD CONTROLLERS
// =================================================================
export const studentController = createCrudController('Student');
export const employeeController = createCrudController('Employee');
export const departmentController = createCrudController('Department');
export const courseController = createCrudController('Course');
export const subjectController = createCrudController('Subject');
// (TimeTable/TimeTableEntry need custom logic, not simple CRUD)