import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js'; // Use your Neon db.js
import db from './models/index.js'; // Import the new model hub
import cron from 'node-cron';

// --- (Step 1) IMPORT ALL 9 ROUTE FILES ---
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import requirementRoutes from './routes/requirementRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import academicAdminRoutes from './routes/academicAdminRoutes.js'; // <-- 1. ADD THIS IMPORT
import eventRequestRoutes from './routes/eventRequestRoutes.js'; // <-- 1. ADD THIS IMPORT

// --- (Step 2) IMPORT AUTOMATION CONTROLLER ---
import { runOffboardingScript, sendExpiryWarning } from './controllers/automationController.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ⬇️ Needed for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Database connection & sync
(async () => {
  try {
    await connectDB(); // connect to Neon
    
    // -----------------------------------------------------------------
    // ----------------- (Step 3) SYNC DATABASE -----------------
    // All associations are now defined in './models/index.js'
    // -----------------------------------------------------------------
    
    await db.sequelize.sync({ alter : true });
    console.log('✅ Sequelize models synced with Neon DB');
  } catch (err) {
    console.error('❌ DB connection or sync failed:', err.message);
  }
})();

// --- (Step 4) USE ALL 10 ROUTE FILES ---
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic-admin', academicAdminRoutes); // <-- 2. ADD THIS LINE
app.use('/api/organizer', organizerRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/event-requests', eventRequestRoutes); // <-- 2. ADD THIS LINE

// ✅ Default route
app.get('/', (req, res) => {
  res.send('🚀 Backend server running with Neon PostgreSQL!');
});

// --- (Step 5) SETUP AUTOMATION SCRIPT ---
// Runs every day at 1 AM
cron.schedule('0 1 * * *', async () => {
  console.log('--- Running Daily Automation Tasks ---');
  await runOffboardingScript();
  await sendExpiryWarning();
  console.log('--- Daily Tasks Complete ---');
}, {
  timezone: "Asia/Kolkata" // Set to your server's timezone
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));