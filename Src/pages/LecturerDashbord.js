import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  QrCodeScanner,
  Add,
  Edit,
  Delete,
  Visibility,
  Download,
  People,
  Class,
} from '@mui/icons-material';

const LecturerDashboard = () => {
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [qrCode, setQrCode] = useState('');

  const courses = [
    { id: 1, name: 'Computer Science 101', code: 'CS101', students: 45 },
    { id: 2, name: 'Data Structures', code: 'CS201', students: 38 },
    { id: 3, name: 'Database Systems', code: 'CS301', students: 42 },
  ];

  const todayAttendance = [
    { student: 'John Doe', regNo: 'SC1001', time: '09:05 AM', status: 'Present' },
    { student: 'Jane Smith', regNo: 'SC1002', time: '09:10 AM', status: 'Late' },
    { student: 'Mike Johnson', regNo: 'SC1003', time: 'Absent', status: 'Absent' },
    { student: 'Sarah Williams', regNo: 'SC1004', time: '09:00 AM', status: 'Present' },
  ];

  const generateQRCode = () => {
    const sessionId = `LEC-${Date.now()}-${selectedCourse}`;
    setQrCode(`https://attendance.ke/session/${sessionId}`);
    setOpenQRDialog(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Lecturer Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<QrCodeScanner />}
                  onClick={() => {
                    setSelectedCourse(courses[0].id);
                    generateQRCode();
                  }}
                  sx={{ py: 1.5 }}
                >
                  Start QR Attendance
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  href="/lecturer/classes"
                  sx={{ py: 1.5 }}
                >
                  Manage Classes
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Download />}
                  href="/lecturer/reports"
                  sx={{ py: 1.5 }}
                >
                  Generate Reports
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Courses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Courses</Typography>
              <Button startIcon={<Add />} size="small">Add Course</Button>
            </Box>
            {courses.map((course) => (
              <Card key={course.id} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1 }}>
                  <Grid container alignItems="center">
                    <Grid item xs={8}>
                      <Typography variant="body1">{course.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.code} • {course.students} students
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      <IconButton size="small" onClick={() => setSelectedCourse(course.id)}>
                        <QrCodeScanner />
                      </IconButton>
                      <IconButton size="small" href={`/lecturer/course/${course.id}`}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        {/* Today's Attendance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Today's Attendance</Typography>
            <TextField
              select
              label="Select Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </TextField>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Reg No</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAttendance.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.student}</TableCell>
                      <TableCell>{row.regNo}</TableCell>
                      <TableCell>{row.time}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.status} 
                          size="small"
                          color={row.status === 'Present' ? 'success' : 
                                 row.status === 'Late' ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Class color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h5">3</Typography>
                  <Typography variant="body2">Courses</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <People color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h5">125</Typography>
                  <Typography variant="body2">Total Students</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">92%</Typography>
                  <Typography variant="body2">Avg. Attendance</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main">8</Typography>
                  <Typography variant="body2">Pending Actions</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR Code for Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body2" gutterBottom>
              Scan this QR code to mark attendance
            </Typography>
            <Box sx={{ 
              width: 200, 
              height: 200, 
              bgcolor: '#f5f5f5',
              mx: 'auto',
              my: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="caption" color="text.secondary">
                [QR Code Image]
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Session ID: LEC-{Date.now()}-{selectedCourse}
            </Typography>
            <TextField
              fullWidth
              value={qrCode}
              InputProps={{ readOnly: true }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => navigator.clipboard.writeText(qrCode)}>
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LecturerDashboard;
