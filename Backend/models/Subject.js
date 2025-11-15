// Backend/models/Subject.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const Subject = sequelize.define('Subject', { // This is the Class (e.g., Data Structures)
  subjectId: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // MODIFIED
  subjectName: { type: DataTypes.STRING, allowNull: false },
  subjectCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  courseId: { type: DataTypes.STRING, allowNull: false }, // MODIFIED to STRING (FK)
  year: { type: DataTypes.INTEGER, allowNull: false },
});
export default Subject;