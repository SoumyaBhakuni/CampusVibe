import db from './models/index.js';
import dotenv from 'dotenv';

dotenv.config(); // Make sure environment variables are loaded

const createAdmins = async () => {
  console.log('Attempting to connect to database...');
  try {
    // Test connection and sync models
    await db.sequelize.authenticate();
    console.log('Database connection successful.');
    
    // --- IMPORTANT: Change these details ---
    const eventAdminEmail = 'event.admin@your-university.edu';
    const academicAdminEmail = 'academic.admin@your-university.edu';
    const adminPassword = 'SuperStrongPassword123!';
    // ----------------------------------------

    // Create Event Admin
    const [eventAdmin, eventCreated] = await db.User.findOrCreate({
      where: { email: eventAdminEmail },
      defaults: {
        password: adminPassword,
        role: 'EventAdmin',
        accessExpiryDate: null, // Permanent access
        eventCreationLimit: 0,
        mustChangePassword: false
      }
    });

    if (eventCreated) {
      console.log(`✅ Created EventAdmin: ${eventAdmin.email}`);
    } else {
      console.log(`ℹ️ EventAdmin already exists: ${eventAdmin.email}`);
    }

    // Create Academic Admin
    const [academicAdmin, academicCreated] = await db.User.findOrCreate({
      where: { email: academicAdminEmail },
      defaults: {
        password: adminPassword,
        role: 'AcademicAdmin',
        accessExpiryDate: null, // Permanent access
        eventCreationLimit: 0,
        mustChangePassword: false
      }
    });

    if (academicCreated) {
      console.log(`✅ Created AcademicAdmin: ${academicAdmin.email}`);
    } else {
      console.log(`ℹ️ AcademicAdmin already exists: ${academicAdmin.email}`);
    }

    console.log('Admin seeding complete.');

  } catch (error) {
    console.error('❌ Error creating admins:', error.message);
  } finally {
    // Close the database connection
    await db.sequelize.close();
  }
};

createAdmins();