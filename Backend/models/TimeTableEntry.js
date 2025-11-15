// Backend/models/TimeTableEntry.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const TimeTableEntry = sequelize.define('TimeTableEntry', { // This is the "Schedule"
  entryId: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // MODIFIED
  timeTableId: { type: DataTypes.STRING, allowNull: false }, // MODIFIED to STRING (FK)
  subjectId: { type: DataTypes.STRING, allowNull: false }, // MODIFIED to STRING (FK)
  employeeId: { type: DataTypes.STRING, allowNull: false },  // FK to Employee
  day: { type: DataTypes.STRING, allowNull: false },
  timeSlot: { type: DataTypes.STRING, allowNull: false },
  roomNo: { type: DataTypes.STRING },
});
export default TimeTableEntry;