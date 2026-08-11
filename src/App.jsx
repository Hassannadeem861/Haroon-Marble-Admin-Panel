import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgentsManagement from './pages/AgentsManagement';
// import SalaryPayments from './pages/SalaryPayments.jsx';
import AdminProfile from './pages/AdminProfile';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoutes.jsx';
import { ScrollToTop } from './components/ScrollToTop';
import './App.css';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* ========== PROTECTED ROUTES ========== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AgentsManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/salary-slip"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <SalaryPayments />
            </AdminLayout>
          </ProtectedRoute>
        }
      /> */}

      {/* ========== REDIRECTS ========== */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminProfile />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
};

const App = () => {
  return (
    <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13.5px' },
        error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        success: { iconTheme: { primary: '#386CFF', secondary: '#fff' } },
      }}
    />
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#386CFF',
          borderRadius: 8,
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Card: {
            borderRadius: 8,
          },
        },
      }}
    >
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </ConfigProvider>
    </>
  );
};

export default App;
