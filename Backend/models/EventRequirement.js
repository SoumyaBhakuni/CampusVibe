import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EventRequirement = sequelize.define('EventRequirement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventId: { type: DataTypes.INTEGER, allowNull: false },     // FK to Event
  resourceId: { type: DataTypes.STRING, allowNull: false },  // FK to Resource (MODIFIED to STRING)
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending', // Pending, Approved, Rejected
  },
});

export default EventRequirement;