import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AgentDetailPage from './pages/AgentDetailPage';
import AgentsPage from './pages/AgentsPage';
import PayloadPage from './pages/PayloadPage';
import TasksPage from './pages/TasksPage';
import NetworkPage from './pages/NetworkPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';

/* ── Error boundary — shows message instead of blank screen ── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, fontFamily: '"Geist", system-ui, sans-serif' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Page Error</div>
          <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 500, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error.message}
          </div>
          <button onClick={() => this.setState({ error: null })}
            style={{ marginTop: 8, padding: '7px 16px', background: '#3b82f6', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Protected Route ── */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('bytecode_token');
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Sidebar>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Sidebar>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/agents"  element={<ProtectedRoute><AgentsPage /></ProtectedRoute>} />
        <Route path="/agents/:id" element={<ProtectedRoute><AgentDetailPage /></ProtectedRoute>} />
        <Route path="/payloads" element={<ProtectedRoute><PayloadPage /></ProtectedRoute>} />
        <Route path="/tasks"   element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><NetworkPage /></ProtectedRoute>} />
        <Route path="/data"    element={<ProtectedRoute><DataPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
