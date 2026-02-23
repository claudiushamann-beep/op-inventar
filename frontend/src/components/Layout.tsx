import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  FolderOpen,
  Build,
  Business,
  Factory,
  Assignment,
  AdminPanelSettings,
  Logout,
  LocalHospital
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Rolle } from '@/types';

const drawerWidth = 240;

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: Rolle[];
  color: string;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', color: '#1976D2' },
  { text: 'Siebe', icon: <FolderOpen />, path: '/siebe', color: '#7C4DFF' },
  { text: 'Instrumente', icon: <Build />, path: '/instrumente', color: '#00897B' },
  { text: 'Fachabteilungen', icon: <Business />, path: '/fachabteilungen', color: '#F4511E' },
  { text: 'Hersteller', icon: <Factory />, path: '/hersteller', color: '#FB8C00' },
  { text: 'Änderungen', icon: <Assignment />, path: '/aenderungen', color: '#E91E63' },
  {
    text: 'Benutzerverwaltung',
    icon: <AdminPanelSettings />,
    path: '/users',
    roles: ['CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'],
    color: '#546E7A'
  }
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.rolle))
  );

  const currentPage = navItems.find(item => item.path === location.pathname);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LocalHospital sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" noWrap fontWeight={700} color="primary.main">
            OP-Inventar
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1, flex: 1 }}>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                  borderRadius: '0 8px 8px 0',
                  mx: 0,
                  ml: 0,
                  mr: 1,
                  '&.Mui-selected': {
                    bgcolor: `${item.color}14`
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: isActive ? item.color : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: { fontSize: 18, color: isActive ? 'white' : item.color }
                    })}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? item.color : 'text.primary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {user?.vorname} {user?.nachname}
        </Typography>
        <br />
        <Typography variant="caption" color="text.disabled">
          {user?.rolle?.replace(/_/g, ' ')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'primary.main',
          borderBottom: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {currentPage?.text || 'OP-Inventar'}
          </Typography>
          <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.4)'
              }}
            >
              {user?.vorname?.[0]}{user?.nachname?.[0]}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.vorname} {user?.nachname}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.rolle?.replace(/_/g, ' ')}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Abmelden
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0,0,0,0.08)'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
