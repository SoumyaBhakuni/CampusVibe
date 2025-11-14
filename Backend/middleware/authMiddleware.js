import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// =================================================================
// ✅ 1. "protect" (Refactored)
// This is the base-level authentication.
// It verifies the token and attaches the user to req.
// It ALSO blocks "Guest" (expired) users from all access.
// =================================================================
export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from DB (excluding password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // --- NEW LOGIC (from our workflow) ---
      // 4. Block "Guest" (expired) users
      if (req.user.role === 'Guest') {
        return res.status(403).json({ message: 'Access has been revoked. Please contact an admin.' });
      }

      // 5. Check if access has expired (in case cron job hasn't run)
      if (req.user.accessExpiryDate && new Date() > new Date(req.user.accessExpiryDate)) {
        req.user.role = 'Guest';
        await req.user.save();
        return res.status(403).json({ message: 'Your access has expired.' });
      }
      // --- END OF NEW LOGIC ---

      // 6. User is valid and active, proceed
      next();

    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// =================================================================
// ✅ 2. "isEventAdmin" (Renamed from isAdmin)
// This checks if the user is an EventAdmin.
// =================================================================
export const isEventAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'EventAdmin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Event Admin access only.' });
  }
};

// =================================================================
// ✅ 3. "isOrganizer" (Updated to include EventAdmin)
// This checks if the user is an Organizer OR an EventAdmin.
// =================================================================
export const isOrganizer = (req, res, next) => {
  const userRole = req.user.role;
  if (req.user && (userRole === 'Organizer' || userRole === 'SubOrganizer' || userRole === 'EventAdmin')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Organizer or Admin access required.' });
  }
};

// =================================================================
// ✅ 4. "checkPasswordChange" (Kept as-is)
// =================================================================
export const checkPasswordChange = (req, res, next) => {
  // Check if the user is required to change their password
  if (req.user && req.user.mustChangePassword) {
    
    // Check if the user is trying to access the *one* allowed route
    if (req.path === '/change-password') {
      // Allow them to proceed to the changePassword controller
      next();
    } else {
      // Block them from all other API routes
      res.status(403).json({ 
        message: 'Forbidden: You must change your password before you can proceed.',
        code: 'PASSWORD_CHANGE_REQUIRED' 
      });
    }
  } else {
    // Not required to change password, proceed to any route
    next();
  }
};

// =================================================================
// ✅ 5. "isAcademicAdmin" (NEW)
// This checks if the user is an AcademicAdmin.
// =================================================================
export const isAcademicAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'AcademicAdmin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Academic Admin access only.' });
  }
};
