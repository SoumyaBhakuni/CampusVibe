import { Routes, Route } from "react-router-dom";
// We no longer import AuthProvider or Router from here
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// --- Import All Pages ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import EventListPage from "./pages/EventListPage";
import EventDashboard from "./pages/EventDashboard";
import RegisterForEvent from "./pages/RegisterForEvent";
import ClubListPage from "./pages/ClubListPage";
import ClubDashboard from "./pages/ClubDashboard";
import EventRequestForm from "./pages/EventRequestForm";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ChangePassword from "./pages/ChangePassword";
import Addevent from "./pages/Addevent";
import NeedResources from "./pages/NeedResources";
import NotFound from "./pages/NotFound";

/**
 * This is the main App component.
 * It now ONLY contains the layout and the routes.
 */
function App() {
  const ORGANIZER_ROLES = ['Admin', 'Organizer', 'SubOrganizer'];
  const ADMIN_ONLY = ['Admin'];

  return (
    <> {/* No <Router> or <AuthProvider> wrapper here */}
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* --- Public Routes (Public Lane) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/request-event" element={<EventRequestForm />} />
          <Route path="/clubs" element={<ClubListPage />} />
          <Route path="/clubs/:id" element={<ClubDashboard />} />
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
    </>
  );
}

export default App;