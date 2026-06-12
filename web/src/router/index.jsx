import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homeForRole } from '../hooks/useAuth';
import BottomNav from '../components/shared/BottomNav';

import LoginPage from '../pages/LoginPage';

// Guard
import GuardHomePage from '../pages/guard/GuardHomePage';
import NewVisitorPage from '../pages/guard/NewVisitorPage';
import VisitorDetailPage from '../pages/guard/VisitorDetailPage';
import LogDeliveryPage from '../pages/guard/LogDeliveryPage';
import MarkExitPage from '../pages/guard/MarkExitPage';
import ResidentsPage from '../pages/guard/ResidentsPage';

// Resident
import ResidentHomePage from '../pages/resident/ResidentHomePage';
import ApprovalPage from '../pages/resident/ApprovalPage';
import InviteVisitorPage from '../pages/resident/InviteVisitorPage';
import FamilyManagementPage from '../pages/resident/FamilyManagementPage';
import NotificationSettingsPage from '../pages/resident/NotificationSettingsPage';

// Visitor (public)
import VisitorFormPage from '../pages/visitor/VisitorFormPage';
import ConfirmationPage from '../pages/visitor/ConfirmationPage';

// Admin
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import GuardsPage from '../pages/admin/GuardsPage';
import FlatsPage from '../pages/admin/FlatsPage';
import RemovalLogsPage from '../pages/admin/RemovalLogsPage';

// Subdomain → section mapping (guard.* / app.* / admin.* / visit.*).
// Path-based routes (/guard, /resident, /admin, /visit) are the fallback and always work.
const SUBDOMAIN_HOME = { guard: '/guard', app: '/resident', admin: '/admin', visit: '/visit' };

function subdomainHome() {
  const sub = window.location.hostname.split('.')[0];
  return SUBDOMAIN_HOME[sub] || null;
}

// Role guard: must be logged in with one of the allowed roles.
// Wrong role → redirect to their own area. No session → login.
function RequireRole({ roles, children }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <CenterMessage text="Loading..." />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(role)) return <Navigate to={homeForRole(role)} replace />;
  return children;
}

function CenterMessage({ text }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>{text}</div>;
}

// Mobile-app shells with bottom navigation
function GuardShell() {
  return (
    <div className="app-shell has-bottom-nav">
      <Outlet />
      <BottomNav variant="guard" />
    </div>
  );
}

function ResidentShell() {
  return (
    <div className="app-shell has-bottom-nav">
      <Outlet />
      <BottomNav variant="resident" />
    </div>
  );
}

// Root: subdomain redirect first, then role-based redirect
function RootRedirect() {
  const { session, role, loading } = useAuth();
  const subHome = subdomainHome();

  if (subHome) return <Navigate to={subHome} replace />;
  if (loading) return <CenterMessage text="Loading..." />;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(role)} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Guard app */}
      <Route path="/guard" element={<RequireRole roles={['guard']}><GuardShell /></RequireRole>}>
        <Route index element={<GuardHomePage />} />
        <Route path="new-visitor" element={<NewVisitorPage />} />
        <Route path="visitor/:visitorId" element={<VisitorDetailPage />} />
        <Route path="delivery" element={<LogDeliveryPage />} />
        <Route path="exit" element={<MarkExitPage />} />
        <Route path="residents" element={<ResidentsPage />} />
      </Route>

      {/* Resident app */}
      <Route path="/resident" element={<RequireRole roles={['family_head', 'member']}><ResidentShell /></RequireRole>}>
        <Route index element={<ResidentHomePage />} />
        <Route path="approval/:visitorId" element={<ApprovalPage />} />
        <Route path="invite" element={<InviteVisitorPage />} />
        <Route path="family" element={<FamilyManagementPage />} />
        <Route path="settings" element={<NotificationSettingsPage />} />
      </Route>

      {/* Public visitor form — /visit/* plus the legacy /visitor/* paths the
          backend generates links with (do not break already-sent invites) */}
      <Route path="/visit/form/:token" element={<VisitorFormPage />} />
      <Route path="/visit/confirmation" element={<ConfirmationPage />} />
      <Route path="/visitor/form/:token" element={<VisitorFormPage />} />
      <Route path="/visitor/confirmation" element={<ConfirmationPage />} />

      {/* Admin (desktop layout) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<RequireRole roles={['admin', 'chairman']}><Outlet /></RequireRole>}>
        <Route index element={<DashboardPage />} />
        <Route path="guards" element={<GuardsPage />} />
        <Route path="flats" element={<FlatsPage />} />
        <Route path="removal-logs" element={<RemovalLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
