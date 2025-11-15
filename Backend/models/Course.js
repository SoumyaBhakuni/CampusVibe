// Backend/models/Course.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const Course = sequelize.define('Course', { // This is the Program (e.g., B.Tech)
  courseId: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // MODIFIED
  courseName: { type: DataTypes.STRING, allowNull: false, unique: true },
  departmentId: { type: DataTypes.STRING, allowNull: false }, // MODIFIED to STRING (FK)
});
export default Course;