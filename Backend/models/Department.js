// Backend/models/Department.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const Department = sequelize.define('Department', {
  departmentId: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // MODIFIED
  departmentName: { type: DataTypes.STRING, allowNull: false, unique: true },
  headEmployeeId: { type: DataTypes.STRING, allowNull: true }, // FK to Employee (already STRING)
});
export default Department;