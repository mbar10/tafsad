import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Dashboard from './components/dashboard/Dashboard';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppContent = () => {
  const { isAuthenticated, handleLogout, handleSort, handleUpdateColumn, handleUpdatePunishment } = useAuth();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard
              onLogout={handleLogout}
              onSort={handleSort}
              onUpdateColumn={handleUpdateColumn}
              onUpdatePunishment={handleUpdatePunishment}
            />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App; 