// Backend/controllers/academicAdminController.js
import db from '../models/index.js';

// =================================================================
// ✅ ENHANCED GENERIC CRUD CONTROLLER FACTORY
//    (Now correctly handles custom STRING primary keys)
// =================================================================
const createCrudController = (modelName) => {
  const Model = db[modelName];
  // Determine the primary key name (e.g., 'studentId', 'departmentId', 'id')
  const primaryKey = Model.primaryKeyAttributes[0];

  return {
    create: async (req, res) => {
      try {
        // Find if the record exists using its PK (if available in body)
        if (req.body[primaryKey]) {
            const existingItem = await Model.findByPk(req.body[primaryKey]);
            if (existingItem) {
              // If exists, return a conflict message as client should use PUT
              return res.status(400).json({ message: `${modelName} with ID ${req.body[primaryKey]} already exists. Use PUT to update.` });
            }
        }
        
        // Default to create
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
    // PUT /:id route
    update: async (req, res) => {
      try {
        // Use the primary key and the ID from the URL params for the lookup
        const [updated] = await Model.update(req.body, { where: { [primaryKey]: req.params.id } });
        if (updated) {
          // Find the updated item to return to the frontend
          const updatedItem = await Model.findByPk(req.params.id);
          res.status(200).json(updatedItem);
        } else {
          // If no row was updated, check if it was a valid ID
          const item = await Model.findByPk(req.params.id);
          if (item) {
             res.status(200).json(item);
          } else {
             res.status(404).json({ message: `${modelName} not found or no changes applied` });
          }
        }
      } catch (error) {
        res.status(500).json({ message: `Error updating ${modelName}`, error: error.message });
      }
    },
    // DELETE /:id route
    delete: async (req, res) => {
      try {
        // Use the primary key and the ID from the URL params for deletion
        const deleted = await Model.destroy({ where: { [primaryKey]: req.params.id } });
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
// ✅ EXPORT ALL ACADEMIC CRUD CONTROLLERS (8 Entities)
// =================================================================
export const studentController = createCrudController('Student');
export const employeeController = createCrudController('Employee');
export const departmentController = createCrudController('Department');
export const courseController = createCrudController('Course');
export const subjectController = createCrudController('Subject');
export const timeTableController = createCrudController('TimeTable');
export const timeTableEntryController = createCrudController('TimeTableEntry');
export const resourceController = createCrudController('Resource');