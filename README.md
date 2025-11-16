You are absolutely right. That's a critical security consideration. The README.md should be a technical overview and setup guide for you and your team, not a public-facing invitation for anyone to create admin accounts on your platform.

Here is the updated README.md file. It includes all the project details but removes the "Database Seeding" section. This keeps your setup process private.

After the README.md, I will provide a separate set of private instructions for you (the owner) on how to use the seedAdmins.js file one time to create your own accounts.

README.md (Updated Version)

🎓 CampusVibe - A Full-Stack University Event Management Platform

"CampusVibe" is a full-stack, role-based University Event Management Platform built from the ground up. It serves as a central, unified solution for managing the entire lifecycle of all campus events, from an initial public request to organize, to automated cleanup and data archival after an event's access period expires.

This project's architecture is designed for scalability and security, featuring a 3-Zone Database Model to separate permanent academic data from temporary event data, and a 5-Role Security Model to ensure a strict separation of duties for all users.

🏛️ Core Architecture

The platform is built on two foundational concepts:

1. The 3-Zone Database Architecture

The system's 21 database tables are intelligently separated into three distinct zones:

    Zone 1: Academic Core (Permanent Data)

        Tables: Student, Employee, Department, Course, Subject, TimeTable, TimeTableEntry, Resource, Club.

        Purpose: The university's foundational "bedrock" data. This zone is managed exclusively by the AcademicAdmin and is treated as read-only by the rest of the event system.

    Zone 2: Event Layer (Temporary Data)

        Tables: User, EventRequest, Event, EventRequirement, Team, EventMember, Leaderboard.

        Purpose: The "live" operational workspace for all active events. This data is designed to be purged after an event's lifecycle ends, ensuring the database remains clean. The Event table's onDelete: 'CASCADE' association automatically cleans up all related participants, teams, and scores.

    Zone 3: Archive Layer (Permanent Proof)

        Tables: EventArchive, ParticipatedEvent, CommitteeEvent, OrganizedEvent, EmployeeOrganizedEvent.

        Purpose: The permanent "paper trail." The automated cleanup script distills the live Event Layer into these simplified, permanent records for posterity before purging Zone 2.

2. The 5-Role Security Model

Access is governed by a 5-role security model to ensure the principle of least privilege:

    Public User: (Unauthenticated) Can browse events and clubs, and submit a request to become an organizer.

    Organizer / SubOrganizer: (Temporary Role) Can manage only their own events from the OrganizerDashboard. Forced to change their password on first login.

    EventAdmin: (Permanent Role) Manages the Event Layer: all users, all events, all requests, and all clubs from the AdminDashboard.

    AcademicAdmin: (Permanent Role) Manages the Academic Core: all students, employees, courses, and timetables from the AcademicDashboard. Has no access to the event layer.

    Guest: (Expired State) The "expired" state for an organizer. The protect middleware blocks this role from all API access, automatically revoking their privileges.

✨ Key Features & Workflows

    Full-Stack Architecture: React (Vite) frontend with a Node.js/Express backend and PostgreSQL (Neon) database.

    Role-Based Dashboards: Separate, secure dashboards for Organizers, Event Admins, and Academic Admins.

    Secure Auth Workflow: New organizers are created by an admin, receive a temporary password, and are force-redirected to ChangePassword.jsx on their first login.

    4-Scenario Registration: A single public form handles all 4 registration types: Individual (Free/Paid) and Team (Free/Paid).

    Payment Verification: Organizers can view uploaded payment screenshots and "Verify" or "Reject" pending registrations.

    Automated Resource Requests: Organizers request resources from a "shopping cart" UI. The system automatically finds the faculty-in-charge for each item and sends them a consolidated email.

    Academic Conflict Reporting: After an event, the organizer can "Send Attendance." The system cross-references the checkedIn participants with the university's TimeTable and automatically emails all affected faculty with a list of the specific students who missed their class.

    Automated Lifecycle Management (Cron Job): A node-cron job runs daily:

        Warns: Sends warning emails to organizers whose access expires in 7 days.

        Archives: Copies key data from expired events into the permanent Archive Layer.

        Purges: Deletes all temporary Event Layer data (EventMember, Team, etc.) associated with the expired event.

        Revokes: Sets the organizer's User.role to "Guest," automatically revoking their access.

💻 Technology Stack

Category	Technology
Backend	Node.js, Express.js
Frontend	React 19 (with Vite)
Database	PostgreSQL (hosted on Neon)
ORM	Sequelize
Routing	React Router 7
Authentication	JSON Web Tokens (JWT) & bcryptjs
State Management	React Context API (AuthProvider.jsx)
File Uploads	Multer
Email	Nodemailer
Scheduled Jobs	node-cron
Styling	Tailwind CSS

🚀 Getting Started (Developer Setup)

Follow these instructions to get a local copy of the project up and running.

Prerequisites

    Node.js (v18 or later)

    PostgreSQL Database: A running PostgreSQL instance. A free tier from Neon is highly recommended as the project is pre-configured for its SSL requirements.

    Gmail Account (for Email): A Gmail account with an "App Password" is required for Nodemailer to send emails.

1. Backend Setup

    Clone the repository:
    Bash

git clone https://github.com/your-username/campusvibe.git
cd campusvibe/Backend

Install dependencies:
Bash

npm install

Create your .env file: Create a file named .env in the Backend directory and add the following variables:
Code snippet

# Get this from your Neon (or other PostgreSQL) database
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# A strong, random string for signing tokens
JWT_SECRET="your_jwt_secret_key"

# Your Gmail email and a 16-character Google App Password
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="yourgoogleapppassword" 

# The email address that receives a copy of final reports
ADMIN_EMAIL="admin@your-university.edu"

# Port for the backend server
PORT=5000

Run the Backend Server:
Bash

    node server.js

    Your backend should now be running on http://localhost:5000. The server will automatically connect to your database and sync all 21 models.

2. Frontend Setup

    Open a new terminal window.

    Navigate to the frontend directory:
    Bash

cd campusvibe/frontend

Install dependencies:
Bash

npm install

Run the Frontend Dev Server:
Bash

    npm run dev

    Your frontend is now running (usually on http://localhost:5173) and is connected to your backend. The application is now running, but the database has no users or data.
