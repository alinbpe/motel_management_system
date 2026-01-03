<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0f172a" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/ui/Layout';
import { DbSetup } from './components/DbSetup';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cabins from './pages/Cabins';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Profile from './pages/Profile';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

// Login Route Wrapper (Redirect to dashboard if already logged in)
const LoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    if (currentUser) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

// Inner component to use Data Context hooks
const AppRoutes = () => {
    const { dbError } = useData();

    if (dbError === 'MISSING_TABLES') {
        return <DbSetup />;
    }

    return (
        <MemoryRouter>
          <Routes>
            <Route path="/login" element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/cabins" element={
              <ProtectedRoute>
                <Cabins />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            
            <Route path="/logs" element={
              <ProtectedRoute>
                <Logs />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MemoryRouter>
    );
}

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
