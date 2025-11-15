// Backend/models/TimeTable.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
const TimeTable = sequelize.define('TimeTable', { // This is the "Group"
  timeTableId: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // MODIFIED
  courseId: { type: DataTypes.STRING, allowNull: false }, // MODIFIED to STRING (FK)
  year: { type: DataTypes.INTEGER, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: false },
}, {
  uniqueKeys: {
    unique_timetable: {
      fields: ['courseId', 'year', 'section']
    }
  }
});
export default TimeTable;