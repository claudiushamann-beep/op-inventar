import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SiebePage } from '@/pages/SiebePage';
import { SiebDetailPage } from '@/pages/SiebDetailPage';
import { AenderungenPage } from '@/pages/AenderungenPage';
import { UsersPage } from '@/pages/UsersPage';
import { InstrumentePage } from '@/pages/InstrumentePage';
import { HerstellerPage } from '@/pages/HerstellerPage';
import { FachabteilungenPage } from '@/pages/FachabteilungenPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/siebe"
        element={
          <PrivateRoute>
            <Layout>
              <SiebePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/siebe/:id"
        element={
          <PrivateRoute>
            <Layout>
              <SiebDetailPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/instrumente"
        element={
          <PrivateRoute>
            <Layout>
              <InstrumentePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/fachabteilungen"
        element={
          <PrivateRoute>
            <Layout>
              <FachabteilungenPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/hersteller"
        element={
          <PrivateRoute>
            <Layout>
              <HerstellerPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/aenderungen"
        element={
          <PrivateRoute>
            <Layout>
              <AenderungenPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <Layout>
              <UsersPage />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
