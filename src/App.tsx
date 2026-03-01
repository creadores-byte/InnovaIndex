import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Availability from './pages/Availability';
import Scheduling from './pages/Scheduling';
import UserManagement from './pages/UserManagement';
import CompanyManagement from './pages/CompanyManagement';
import './index.css';

import Dashboard from './pages/Dashboard';


const Unauthorized = () => (
  <div className="fade-in">
    <h1>No Autorizado</h1>
    <p>No tienes permisos para acceder a esta sección.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />

              {/* Mentor Availability Routes */}
              <Route element={<ProtectedRoute allowedRoles={['MENTOR', 'COACH', 'ADVISOR', 'ADMIN']} />}>
                <Route path="/availability" element={<Availability />} />
              </Route>

              {/* Scheduling Routes */}
              <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />}>
                <Route path="/scheduling" element={<Scheduling />} />
              </Route>

              {/* User Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}> {/* Modified allowedRoles */}
                <Route path="/users" element={<UserManagement />} />
                <Route path="/companies" element={<CompanyManagement />} /> {/* Added CompanyManagement route */}
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
