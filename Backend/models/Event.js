import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventName: { type: DataTypes.STRING, allowNull: false },
  eventDesc: { type: DataTypes.TEXT, allowNull: true },
  startTime: { type: DataTypes.DATE, allowNull: false }, // Updated
  endTime: { type: DataTypes.DATE, allowNull: false },   // Updated
  venue: { type: DataTypes.STRING, allowNull: false },
  
  // --- NEW FIELDS & FOREIGN KEYS FROM OUR ERD ---
  organizerId: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
  parentId: { type: DataTypes.INTEGER, allowNull: true },    // FK to Event (self)
  clubId: { type: DataTypes.STRING, allowNull: true },      // FK to Club (MODIFIED to STRING)
    
  contactDetails: { type: DataTypes.JSON, allowNull: true },
  registrationSchema: { type: DataTypes.JSON, allowNull: true },
  paymentQRCodes: { type: DataTypes.JSON, allowNull: true },
  
  registrationType: { type: DataTypes.STRING }, // 'Individual' or 'Team'
  isPaidEvent: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasLeaderboard: { type: DataTypes.BOOLEAN, defaultValue: false },
  showLeaderboardMarks: { type: DataTypes.BOOLEAN, defaultValue: false },
  registrationLocked: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default Event;