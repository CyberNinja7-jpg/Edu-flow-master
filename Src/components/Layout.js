import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CalendarToday,
  Assessment,
  People,
  School,
  Settings,
  ExitToApp,
  QrCodeScanner,
  History,
  BarChart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const Layout = ({ children, role }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  // Role-specific navigation items
  const getNavItems = () => {
    const common = [
      { text: 'Dashboard', icon: <Dashboard />, path: 'dashboard' },
    ];

    if (role === 'student') {
      return [
        ...common,
        { text: 'My Attendance', icon: <Assessment />, path: 'attendance' },
        { text: 'Timetable', icon: <CalendarToday />, path: 'timetable' },
        { text: 'QR Scan', icon: <QrCodeScanner />, path: 'scan' },
      ];
    } else if (role === 'lecturer') {
      return [
        ...common,
        { text: 'Take Attendance', icon: <QrCodeScanner />, path: 'take-attendance' },
        { text: 'My Classes', icon: <People />, path: 'classes' },
        { text: 'Reports', icon: <BarChart />, path: 'reports' },
        { text: 'History', icon: <History />, path: 'history' },
      ];
    } else if (role === 'admin') {
      return [
        ...common,
        { text: 'Students', icon: <School />, path: 'students' },
        { text: 'Lecturers', icon: <People />, path: 'lecturers' },
        { text: 'Courses', icon: <School />, path: 'courses' },
        { text: 'Reports', icon: <Assessment />, path: 'reports' },
        { text: 'Settings', icon: <Settings />, path: 'settings' },
      ];
    }
    return common;
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">
          {role === 'student' ? 'Student Portal' : 
           role === 'lecturer' ? 'Lecturer Portal' : 
           'Admin Portal'}
        </Typography>
        <Typography variant="body2">
          Kenyan Attendance System
        </Typography>
      </Box>
      <Divider />
      <List>
        {getNavItems().map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Attendance System
          </Typography>
          
          <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {role === 'student' ? 'S' : role === 'lecturer' ? 'L' : 'A'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('profile')}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
              Logout
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
