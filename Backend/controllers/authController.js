import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../models/index.js'; // ✅ CORRECTED: Default import
import { sendWelcomeEmail } from '../utils/mailer.js';

const User = db.User; // Get the User model from the db object

// This function now includes the user's role in the token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// =================================================================
// ✅ 1. LOGIN USER
// =================================================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 1. Check if user is a "Guest"
    if (user.role === 'Guest') {
      return res.status(403).json({ message: 'Access has been revoked. Please contact an admin.' });
    }

    // 2. Check if access has expired
    if (user.accessExpiryDate && new Date() > new Date(user.accessExpiryDate)) {
      user.role = 'Guest';
      await user.save();
      return res.status(403).json({ message: 'Your access has expired. Please contact an admin.' });
    }

    res.json({
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      eventCreationLimit: user.eventCreationLimit, // <-- ADDED THIS LINE
      token: generateToken(user.id, user.role),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =================================================================
// ✅ 2. CREATE ORGANIZER (Internal Helper Function)
// =================================================================
export const createOrganizerUser = async ({ email, role, eventCreationLimit, accessExpiryDate }) => {
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    throw new Error(`User with email ${email} already exists.`);
  }

  const randomPassword = crypto.randomBytes(8).toString('hex');

  const user = await User.create({
    email,
    password: randomPassword,
    role: role || 'Organizer',
    eventCreationLimit: eventCreationLimit || 1,
    accessExpiryDate: accessExpiryDate || null,
    mustChangePassword: true,
  });

  // Send the welcome email with the password
  await sendWelcomeEmail(user.email, randomPassword);

  return { user, randomPassword };
};

// =================================================================
// ✅ 3. CHANGE PASSWORD
// =================================================================
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // From 'protect' middleware

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the old password is correct
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    user.password = newPassword; // The beforeSave hook will hash it
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};