
import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import EmailLogs from "./pages/EmailLogs";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
import Dashboard from "./pages/Dashboard";
import Visitors from "./pages/Visitors";
import AddVisitor from "./pages/AddVisitor";
import Employees from "./pages/Employees";
import VisitorDetails from "./pages/VisitorDetails";
import VisitorPass from "./pages/VisitorPass";
import VerifyVisitor from "./pages/VerifyVisitor";
import QRScannerPage from "./pages/QRScannerPage";
import ActivityLogs from "./pages/ActivityLogs";
import DashboardLayout from "./components/DashboardLayout";
import Blacklist from "./pages/Blacklist";
import Appointments from "./pages/Appointments";  
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";  

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Checking your session...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : children;
};

// Temporary page for remaining modules
const ComingSoon = () => {
  const location = useLocation();

  const titles = {
    "/appointments": "Appointment Management",
    "/blacklist": "Blacklist Management",
    "/reports": "Reports & Analytics",
    "/notifications": "Notifications",
    "/settings": "System Settings",
  };

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">🚧</div>
      <h2>{titles[location.pathname] || "Page Coming Soon"}</h2>
      <p>This module is under development.</p>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Application */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Visitor Management */}
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/visitors/add" element={<AddVisitor />} />
        <Route path="/visitors/:id/pass" element={<VisitorPass />} />
        <Route path="/verify-visitor/:token" element={<VerifyVisitor />} />
        <Route path="/visitors/:id" element={<VisitorDetails />} />
<Route path="/activity-logs" element={<ActivityLogs />} />
        {/* Employee Management */}
        <Route path="/employees" element={<Employees />} />
<Route path="/qr-scanner" element={<QRScannerPage />} />
        {/* Other Modules */}
        <Route path="/appointments" element={<Appointments />} />
      <Route path="/blacklist" element={<Blacklist />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/email-logs" element={<EmailLogs />} />
      </Route>

      {/* Unknown Routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
