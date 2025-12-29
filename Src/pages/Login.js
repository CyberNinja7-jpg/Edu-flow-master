import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('student');
  const [regNumber, setRegNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate authentication
    if (regNumber && password) {
      switch (role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'lecturer':
          navigate('/lecturer/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          setError('Invalid role selected');
      }
    } else {
      setError('Please fill all fields');
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'admin', label: 'Administrator' },
  ];

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 56, height: 56 }}>
            <SchoolIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" color="primary" gutterBottom>
            Kenyan Attendance System
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Universities, Colleges & KMTCs
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Role</InputLabel>
            <Select
              value={role}
              label="Select Role"
              onChange={(e) => setRole(e.target.value)}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={role === 'student' ? 'Registration Number' : role === 'lecturer' ? 'Staff ID' : 'Admin ID'}
            variant="outlined"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            sx={{ mb: 3 }}
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ py: 1.5 }}
          >
            Sign In
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact your institution's ICT department
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
