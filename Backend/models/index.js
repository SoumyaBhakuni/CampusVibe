// Backend/models/index.js
import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize'; // <-- Import DataTypes for explicit FK definitions

// Import all models
import Student from './Student.js';
import Employee from './Employee.js';
import Department from './Department.js';
import Course from './Course.js';
import Subject from './Subject.js';
import TimeTable from './TimeTable.js';
import TimeTableEntry from './TimeTableEntry.js';
import Club from './Club.js';
import Resource from './Resource.js';
import User from './User.js';
import EventRequest from './EventRequest.js';
import Event from './Event.js';
import EventRequirement from './EventRequirement.js';
import Team from './Team.js';
import EventMember from './EventMember.js';
import Leaderboard from './Leaderboard.js';
import EventArchive from './EventArchive.js';
import ParticipatedEvent from './ParticipatedEvent.js';
import CommitteeEvent from './CommitteeEvent.js';
import OrganizedEvent from './OrganizedEvent.js';
import EmployeeOrganizedEvent from './EmployeeOrganizedEvent.js';

// Create an object to hold all models
const db = {
  sequelize,
  Student,
  Employee,
  Department,
  Course,
  Subject,
  TimeTable,
  TimeTableEntry,
  Club,
  Resource,
  User,
  EventRequest,
  Event,
  EventRequirement,
  Team,
  EventMember,
  Leaderboard,
  EventArchive,
  ParticipatedEvent,
  CommitteeEvent,
  OrganizedEvent,
  EmployeeOrganizedEvent,
};

// --- (Step 1) DEFINE ALL MODEL ASSOCIATIONS ---

// --- Zone 1: Academic Core Associations (UPDATED FOR STRING IDs) ---
// Department/Employee
Department.hasMany(Employee, { foreignKey: { name: 'departmentId', type: DataTypes.STRING } });
Employee.belongsTo(Department, { foreignKey: { name: 'departmentId', type: DataTypes.STRING } });
Department.hasMany(Course, { foreignKey: { name: 'departmentId', type: DataTypes.STRING } });
Course.belongsTo(Department, { foreignKey: { name: 'departmentId', type: DataTypes.STRING } });

// Department/Employee Head
Employee.hasOne(Department, { as: 'HeadedDepartment', foreignKey: 'headEmployeeId' });
Department.belongsTo(Employee, { as: 'Head', foreignKey: 'headEmployeeId' });

// Course/Student/Subject/TimeTable
Course.hasMany(Student, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });
Student.belongsTo(Course, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });

Course.hasMany(Subject, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });
Subject.belongsTo(Course, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });

Course.hasOne(TimeTable, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });
TimeTable.belongsTo(Course, { foreignKey: { name: 'courseId', type: DataTypes.STRING } });

// TimeTable/TimeTableEntry
TimeTable.hasMany(TimeTableEntry, { foreignKey: { name: 'timeTableId', type: DataTypes.STRING }, onDelete: 'CASCADE' });
TimeTableEntry.belongsTo(TimeTable, { foreignKey: { name: 'timeTableId', type: DataTypes.STRING } });

// Subject/TimeTableEntry
Subject.hasMany(TimeTableEntry, { foreignKey: { name: 'subjectId', type: DataTypes.STRING } });
TimeTableEntry.belongsTo(Subject, { foreignKey: { name: 'subjectId', type: DataTypes.STRING } });

// Employee/TimeTableEntry
Employee.hasMany(TimeTableEntry, { foreignKey: 'employeeId' });
TimeTableEntry.belongsTo(Employee, { foreignKey: 'employeeId' });

// Resource/Employee
Employee.hasMany(Resource, { foreignKey: 'inchargeEmployeeId' });
Resource.belongsTo(Employee, { as: 'Incharge', foreignKey: 'inchargeEmployeeId' });


// --- Zone 2: Event Layer Associations (UPDATED FOR STRING IDs) ---
// Club/Event
Club.hasMany(Event, { foreignKey: { name: 'clubId', type: DataTypes.STRING }, allowNull: true, defaultValue: null });
Event.belongsTo(Club, { foreignKey: { name: 'clubId', type: DataTypes.STRING } });

// Event/EventRequirement/Resource
Event.hasMany(EventRequirement, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventRequirement.belongsTo(Event, { foreignKey: 'eventId' });

Resource.hasMany(EventRequirement, { foreignKey: { name: 'resourceId', type: DataTypes.STRING } });
EventRequirement.belongsTo(Resource, { foreignKey: { name: 'resourceId', type: DataTypes.STRING } });


// --- Other Event/User/Team/Member Associations (Unchanged) ---
User.hasMany(Event, { foreignKey: 'organizerId' });
Event.belongsTo(User, { as: 'Organizer', foreignKey: 'organizerId' });
Event.hasMany(Event, { as: 'SubEvents', foreignKey: 'parentId', onDelete: 'CASCADE' });
Event.belongsTo(Event, { as: 'ParentEvent', foreignKey: 'parentId' });
Event.hasMany(EventRequest, { foreignKey: 'parentFestId' });
EventRequest.belongsTo(Event, { as: 'ParentFest', foreignKey: 'parentFestId' });
Event.hasMany(Team, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Team.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(Leaderboard, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Leaderboard.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(EventMember, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventMember.belongsTo(Event, { foreignKey: 'eventId' });
Team.hasMany(EventMember, { foreignKey: 'teamId', onDelete: 'SET NULL', allowNull: true });
EventMember.belongsTo(Team, { foreignKey: 'teamId' });
Student.hasMany(Team, { as: 'LedTeams', foreignKey: 'teamLeaderStudentId' });
Team.belongsTo(Student, { as: 'TeamLeader', foreignKey: 'teamLeaderStudentId' });
Student.hasMany(EventMember, { foreignKey: 'memberId', constraints: false, scope: { memberType: 'Student' } });
EventMember.belongsTo(Student, { foreignKey: 'memberId', constraints: false });
Employee.hasMany(EventMember, { foreignKey: 'memberId', constraints: false, scope: { memberType: 'Employee' } });
EventMember.belongsTo(Employee, { foreignKey: 'memberId', constraints: false });

// --- Zone 3: Archive Layer Associations (Unchanged) ---
EventArchive.hasMany(ParticipatedEvent, { foreignKey: 'eventArchiveId', onDelete: 'CASCADE' });
EventArchive.hasMany(CommitteeEvent, { foreignKey: 'eventArchiveId', onDelete: 'CASCADE' });
EventArchive.hasMany(OrganizedEvent, { foreignKey: 'eventArchiveId', onDelete: 'CASCADE' });
EventArchive.hasMany(EmployeeOrganizedEvent, { foreignKey: 'eventArchiveId', onDelete: 'CASCADE' });
ParticipatedEvent.belongsTo(EventArchive, { foreignKey: 'eventArchiveId' });
CommitteeEvent.belongsTo(EventArchive, { foreignKey: 'eventArchiveId' });
OrganizedEvent.belongsTo(EventArchive, { foreignKey: 'eventArchiveId' });
EmployeeOrganizedEvent.belongsTo(EventArchive, { foreignKey: 'eventArchiveId' });

// Note: The Student/Employee IDs referenced by the archive tables are already strings (studentId, employeeId), so their FKs are implicitly strings.

// Export all models and sequelize instance
export default db;