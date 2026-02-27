import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Auth & Public Pages
import Login from "./pages/Login";
import SchoolRegistration from "./pages/SchoolRegistration";
import ResetPin from "./pages/ResetPin";


// Dashboards
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import SchoolsPage from "./pages/SchoolsPage";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";
import ChildHistory from "./pages/ChildHistory";
import PermissionsPage from "./pages/PermissionsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import StudentChecklist from "./pages/StudentChecklist";
import VansRoutesPage from "./pages/VansRoutesPage";
import ReportsPage from "./pages/ReportsPage";
import DriversPage from "./pages/DriversPage";
import StudentsPage from "./pages/StudentsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminNotifications from "./components/AdminNotifications";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import DashboardLayout, { ProtectedRoute } from "./components/DashboardLayout";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import ProfilePage from "./pages/ProfilePage";

const PageNotFound = () => (
  <div className="flex items-center justify-center h-screen text-gray-600">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p>Page Not Found</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-school" element={<SchoolRegistration />} />
        <Route path="/reset-pin" element={<ResetPin />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/security" element={<Security />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* SCHOOL ADMIN ROUTES */}
        <Route
          element={
            <ProtectedRoute
              allowedRole="SCHOOL_ADMIN"
              userRole={localStorage.getItem("userRole")}
            />
          }
        >
          <Route path="/school" element={<DashboardLayout role="SCHOOL_ADMIN" />}>
            <Route index element={<SchoolAdminDashboard />} />
            <Route path="dashboard" element={<SchoolAdminDashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="routes" element={<VansRoutesPage />} />
            <Route path="accountsettings" element={<AccountSettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* SUPER ADMIN ROUTES */}
        <Route path="/admin" element={<DashboardLayout role="SUPER_ADMIN" />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* REMOVED LEADING SLASHES BELOW */}
          <Route path="accountsettings" element={<AccountSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* DRIVER ROUTES */}
        <Route path="/driver" element={<DashboardLayout role="DRIVER" />}>
          <Route index element={<DriverDashboard />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="students" element={<StudentChecklist />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="accountsettings" element={<AccountSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* PARENT ROUTES */}
        <Route path="/parent" element={<DashboardLayout role="PARENT" />}>
          <Route index element={<ParentDashboard />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="history/:studentId" element={<ChildHistory />} />
          <Route path="accountsettings" element={<AccountSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 404 ROUTE */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}