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
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0'
    },
    secondary: {
      main: '#7C4DFF',
      light: '#B47CFF',
      dark: '#5C35CC'
    },
    error: {
      main: '#E53935'
    },
    success: {
      main: '#43A047'
    },
    warning: {
      main: '#FB8C00'
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 100
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F7FA',
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#546E7A'
          }
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.12)'
            }
          }
        }
      }
    }
  }
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
