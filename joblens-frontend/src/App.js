import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import { ChangePassword, ForgotPassword } from "./pages/auth/ChangePassword";

// Layout
import Layout from "./components/ui/Layout";
import { LoadingPage } from "./components/ui";

// Coordinator Pages
import CoordinatorDashboard from "./pages/coordinator/Dashboard";
import CoordinatorDrives from "./pages/coordinator/Drives";
import CoordinatorStudents from "./pages/coordinator/Students";
import CoordinatorStudentProfile from "./pages/coordinator/StudentProfile";
import RoundsPage from "./pages/coordinator/Rounds";
import PlacementTracker from './pages/coordinator/PlacementTracker';
import { NotifyPage, AuditLogsPage } from "./pages/coordinator/Notify";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentDrives from "./pages/student/Drives";
import StudentProfile from "./pages/student/Profile";
import OffCampusDrives from "./pages/student/OffCampus";
import FeedbackPage from "./pages/student/Feedback";
import AITools from "./pages/student/AITools";

import "./index.css";

// Protected Route
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.isFirstLogin) return <Navigate to="/change-password" replace />;
  if (role && user.role !== role)
    return (
      <Navigate
        to={
          user.role === "coordinator"
            ? "/coordinator/dashboard"
            : "/student/dashboard"
        }
        replace
      />
    );
  return children;
}

// With Layout
function WithLayout({ children }) {
  return <Layout>{children}</Layout>;
}

// App Routes
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage text="Loading JobLens..." />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === "coordinator"
                  ? "/coordinator/dashboard"
                  : "/student/dashboard"
              }
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* COORDINATOR ROUTES */}
      <Route
        path="/coordinator/dashboard"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <CoordinatorDashboard />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
  path="/coordinator/placements"
  element={
    <ProtectedRoute role="coordinator">
      <WithLayout>
        <PlacementTracker />
      </WithLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/coordinator/drives"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <CoordinatorDrives />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/drives/new"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <CoordinatorDrives />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
  path="/coordinator/students"
  element={
    <ProtectedRoute role="coordinator">
      <WithLayout>
        <CoordinatorStudents />
      </WithLayout>
    </ProtectedRoute>
  }
/>
      <Route
  path="/coordinator/students/:studentId"
  element={
    <ProtectedRoute role="coordinator">
      <WithLayout>
        <CoordinatorStudentProfile />
      </WithLayout>
    </ProtectedRoute>
  }
/>

      <Route
        path="/coordinator/rounds"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <RoundsPage />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/offcampus"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <CoordinatorDrives />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/notify"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <NotifyPage />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/audit"
        element={
          <ProtectedRoute role="coordinator">
            <WithLayout>
              <AuditLogsPage />
            </WithLayout>
          </ProtectedRoute>
        }
      />

      {/* STUDENT ROUTES */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <StudentDashboard />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/drives"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <StudentDrives />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/offcampus"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <OffCampusDrives />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <StudentProfile />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/feedback"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <FeedbackPage />
            </WithLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai"
        element={
          <ProtectedRoute role="student">
            <WithLayout>
              <AITools />
            </WithLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              fontSize: "13px",
              fontFamily: "var(--font-body)",
            },
            success: {
              iconTheme: {
                primary: "var(--accent-green)",
                secondary: "var(--bg-primary)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--accent-red)",
                secondary: "var(--bg-primary)",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
