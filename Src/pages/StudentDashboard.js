import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

const StudentDashboard = () => {
  // Sample data - will be replaced with API data
  const attendanceStats = {
    totalClasses: 45,
    attended: 38,
    percentage: 84,
    status: 'Good',
  };

  const recentAttendance = [
    { date: '2024-03-20', course: 'Computer Science', status: 'Present' },
    { date: '2024-03-19', course: 'Mathematics', status: 'Present' },
    { date: '2024-03-18', course: 'Physics', status: 'Absent' },
    { date: '2024-03-17', course: 'Chemistry', status: 'Present' },
    { date: '2024-03-16', course: 'Biology', status: 'Late' },
  ];

  const upcomingClasses = [
    { time: '09:00 AM', course: 'Computer Science', venue: 'Room 101' },
    { time: '11:00 AM', course: 'Mathematics', venue: 'Room 205' },
    { time: '02:00 PM', course: 'Physics Lab', venue: 'Lab 3' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Student Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Attendance Summary Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Attendance Overview</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <Typography variant="h2" color="primary">
                  {attendanceStats.percentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Attendance
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={attendanceStats.percentage} 
                sx={{ height: 10, borderRadius: 5, mb: 2 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Attended</Typography>
                  <Typography variant="h6">{attendanceStats.attended}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="h6">{attendanceStats.totalClasses}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">38</Typography>
                <Typography variant="body2">Present</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Warning color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">5</Typography>
                <Typography variant="body2">Absent</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">84%</Typography>
                <Typography variant="body2">Percentage</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CalendarToday color="action" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5">2</Typography>
                <Typography variant="body2">Late</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<QrCodeScanner />}
                  href="/student/scan"
                >
                  Scan QR Code
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<CalendarToday />}
                  href="/student/timetable"
                >
                  View Timetable
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Attendance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Attendance</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAttendance.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.course}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.status} 
                          size="small"
                          color={getStatusColor(row.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Upcoming Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Today's Classes</Typography>
            {upcomingClasses.map((cls, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1 }}>
                  <Grid container alignItems="center">
                    <Grid item xs={3}>
                      <Chip label={cls.time} size="small" color="primary" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">{cls.course}</Typography>
                      <Typography variant="body2" color="text.secondary">{cls.venue}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Button size="small" variant="text">Details</Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
