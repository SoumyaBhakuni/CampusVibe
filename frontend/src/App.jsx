import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider"; // Correctly imports from new context folder
import ProtectedRoute from "./components/ProtectedRoute"; // Correctly imports our gatekeeper
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// --- Import All Pages (Using the correct filenames from your 'pages' folder) ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Addevent from "./pages/Addevent";
import NeedResources from "./pages/NeedResources";

// --- Corrected Imports (to match your new files) ---
import EventListPage from "./pages/EventListPage";         // The page that lists all events
import EventDashboard from "./pages/EventDashboard";       // The page for a *specific* event
import ClubListPage from "./pages/ClubListPage";         // The page that lists all clubs
import ClubDashboard from "./pages/ClubDashboard";       // The page for a *specific* club
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ChangePassword from "./pages/ChangePassword";
import EventRequestForm from "./pages/EventRequestForm";
import RegisterForEvent from "./pages/RegisterForEvent";
import NotFound from "./pages/NotFound";

/**
 * This is the main App component.
 * It wraps the entire application in the AuthProvider and Router.
 */
function App() {
  // Define roles for clarity in our routes
  const ORGANIZER_ROLES = ['Admin', 'Organizer', 'SubOrganizer'];
  const ADMIN_ONLY = ['Admin'];

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="min-h-screen"> {/* This maintains your original layout */}
          <Routes>
            {/* --- Public Routes (Public Lane) --- */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/request-event" element={<EventRequestForm />} />

            {/* --- Corrected Club Routes --- */}
            <Route path="/clubs" element={<ClubListPage />} /> 
            <Route path="/clubs/:id" element={<ClubDashboard />} /> 

            {/* --- Corrected Event Routes --- */}
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/:id" element={<EventDashboard />} />
            <Route path="/events/:id/register" element={<RegisterForEvent />} />


            {/* --- Protected Routes (Admin & Organizer Lanes) --- */}
            
            {/* Must be logged in (any role) */}
            <Route 
              path="/change-password" 
              element={<ProtectedRoute element={<ChangePassword />} />} 
            />

            {/* Must be 'Admin' */}
            <Route 
              path="/admin/dashboard" 
              element={<ProtectedRoute element={<AdminDashboard />} requiredRole={ADMIN_ONLY} />} 
            />
            
            {/* Must be 'Organizer', 'SubOrganizer', or 'Admin' */}
            <Route 
              path="/organizer/dashboard" 
              element={<ProtectedRoute element={<OrganizerDashboard />} requiredRole={ORGANIZER_ROLES} />} 
            />
            <Route 
              path="/addevent" 
              element={<ProtectedRoute element={<Addevent />} requiredRole={ORGANIZER_ROLES} />} 
            />
            <Route 
              path="/resources/:eventId" // Route is now dynamic
              element={<ProtectedRoute element={<NeedResources />} requiredRole={ORGANIZER_ROLES} />} 
            />
            
            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;