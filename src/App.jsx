import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';

import Login from './pages/LoginPage';
import Outreach from './pages/OutreachPage';
import KeywordSearchPage from './pages/KeywordSearchPage';
import KeywordMonitor from './pages/KeywordMonitorPage';
import Dashboard from './pages/DashboardPage';
import RegisterAccount from './pages/RegisterAccountPage';
import ManageAccountsPage from './pages/ManageAccountsPage';
import ExportMemberPage from './pages/ExportMemberPage';
import StatsPage from './pages/StatsPage';
import FilterPage from './pages/FilterPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/register-account" element={<ProtectedRoute><RegisterAccount /></ProtectedRoute>} />
          <Route path="/manage-accounts" element={<ProtectedRoute><ManageAccountsPage /></ProtectedRoute>} />
          <Route path="/export-group" element={<ProtectedRoute><ExportMemberPage /></ProtectedRoute>} />
          <Route path="/keyword-searching" element={<ProtectedRoute><KeywordSearchPage /></ProtectedRoute>} />
          <Route path="/keyword-monitor" element={<ProtectedRoute><KeywordMonitor /></ProtectedRoute>} />
          <Route path="/outreach" element={<ProtectedRoute><Outreach /></ProtectedRoute>} />
          <Route path="/outreach/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
          <Route path="/outreach/filter" element={<ProtectedRoute><FilterPage /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
