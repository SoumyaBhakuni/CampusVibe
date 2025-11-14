import { Routes, Route } from "react-router-dom";
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
import AcademicDashboard from "./pages/AcademicDashboard"; // <-- 1. IMPORT (Create this file)

function App() {
  // 2. DEFINE NEW ROLES
  const ORGANIZER_ROLES = ['EventAdmin', 'Organizer', 'SubOrganizer'];
  const EVENT_ADMIN_ONLY = ['EventAdmin'];
  const ACADEMIC_ADMIN_ONLY = ['AcademicAdmin'];

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/request-event" element={<EventRequestForm />} />
          <Route path="/clubs" element={<ClubListPage />} />
          <Route path="/clubs/:id" element={<ClubDashboard />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/:id" element={<EventDashboard />} />
          <Route path="/events/:id/register" element={<RegisterForEvent />} />

          {/* --- Protected Routes --- */}
          <Route 
            path="/change-password" 
            element={<ProtectedRoute element={<ChangePassword />} />} 
          />

          {/* 3. UPDATE ROLE for Event Admin */}
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute element={<AdminDashboard />} requiredRole={EVENT_ADMIN_ONLY} />} 
          />

          {/* 4. ADD NEW ROUTE for Academic Admin */}
          <Route 
            path="/academic/dashboard" 
            element={<ProtectedRoute element={<AcademicDashboard />} requiredRole={ACADEMIC_ADMIN_ONLY} />} 
          />
          
          {/* 5. UPDATE ROLES for Organizer */}
          <Route 
            path="/organizer/dashboard" 
            element={<ProtectedRoute element={<OrganizerDashboard />} requiredRole={ORGANIZER_ROLES} />} 
          />
          <Route 
            path="/addevent" 
            element={<ProtectedRoute element={<Addevent />} requiredRole={ORGANIZER_ROLES} />} 
          />
          <Route 
            path="/resources/:eventId"
            element={<ProtectedRoute element={<NeedResources />} requiredRole={ORGANIZER_ROLES} />} 
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;