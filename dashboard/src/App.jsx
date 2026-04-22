import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AgentDetailPage from './pages/AgentDetailPage';
import PayloadPage from './pages/PayloadPage';
import TasksPage from './pages/TasksPage';
import NetworkPage from './pages/NetworkPage';
import DataPage from './pages/DataPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('bytecode_token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Sidebar>{children}</Sidebar>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agents" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agents/:id" 
          element={
            <ProtectedRoute>
              <AgentDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payloads" 
          element={
            <ProtectedRoute>
              <PayloadPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/network" 
          element={
            <ProtectedRoute>
              <NetworkPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/data" 
          element={
            <ProtectedRoute>
              <DataPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
