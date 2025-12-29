import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  People,
  School,
  Assessment,
  Download,
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  // Sample data for charts
  const attendanceData = [
    { month: 'Jan', attendance: 89 },
    { month: 'Feb', attendance: 92 },
    { month: 'Mar', attendance: 87 },
    { month: 'Apr', attendance: 91 },
    { month: 'May', attendance: 88 },
    { month: 'Jun', attendance: 93 },
  ];

  const departmentStats = [
    { name: 'Computer Science', students: 350, attendance: 91 },
    { name: 'Engineering', students: 420, attendance: 89 },
    { name: 'Medicine', students: 280, attendance: 94 },
    { name: 'Business', students: 310, attendance: 86 },
    { name: 'Education', students: 190, attendance: 92 },
  ];

  const recentActivities = [
    { time: '10:30 AM', action: 'New student registered', user: 'Admin' },
    { time: '09:45 AM', action: 'Attendance report generated', user: 'Lecturer Kim' },
    { time: 'Yesterday', action: 'System backup completed', user: 'System' },
    { time: 'Mar 18', action: 'New course added', user: 'Admin' },
    { time: 'Mar 17', action: 'User permissions updated', user: 'Admin' },
  ];

  const pendingApprovals = [
    { type: 'Student Registration', count: 23, priority: 'High' },
    { type: 'Course Changes', count: 5, priority: 'Medium' },
    { type: 'Leave Requests', count: 12, priority: 'Low' },
    { type: 'System Access', count: 3, priority: 'High' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Administration Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5">2,450</Typography>
                      <Typography variant="body2">Total Students</Typography>
                    </Box>
                  </Box>
                  <Button size="small" sx={{ mt: 1 }}>View All</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <School color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5">85</Typography>
                      <Typography variant="body2">Lecturers</Typography>
                    </Box>
                  </Box>
                  <Button size="small" sx={{ mt: 1 }}>Manage</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment color="success" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5">89%</Typography>
                      <Typography variant="body2">Avg Attendance</Typography>
                    </Box>
                  </Box>
                  <Button size="small" sx={{ mt: 1 }}>Reports</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp color="warning" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h5">12</Typography>
                      <Typography variant="body2">Departments</Typography>
                    </Box>
                  </Box>
                  <Button size="small" sx={{ mt: 1 }}>View</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Attendance Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Attendance Trends</Typography>
              <Button startIcon={<Download />} size="small">Export</Button>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" fill="#1a73e8" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Pending Approvals</Typography>
            {pendingApprovals.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{item.type}</Typography>
                  <Chip 
                    label={item.priority} 
                    size="small"
                    color={item.priority === 'High' ? 'error' : 
                           item.priority === 'Medium' ? 'warning' : 'success'}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    {item.count} pending
                  </Typography>
                  <Button size="small">Review</Button>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Department Performance */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Department Performance</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Students</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentStats.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell align="right">{dept.students}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={dept.attendance} 
                              color={dept.attendance > 90 ? 'success' : dept.attendance > 80 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Typography variant="body2">{dept.attendance}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={dept.attendance > 90 ? 'Excellent' : dept.attendance > 80 ? 'Good' : 'Needs Improvement'} 
                          size="small"
                          color={dept.attendance > 90 ? 'success' : dept.attendance > 80 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small"><Visibility /></IconButton>
                        <IconButton size="small"><Edit /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Activities</Typography>
            {recentActivities.map((activity, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">{activity.action}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    By {activity.user} • {activity.time}
                  </Typography>
                </Box>
                <Button size="small">View</Button>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>System Management</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  sx={{ py: 1.5, mb: 1 }}
                >
                  Add User
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  sx={{ py: 1.5 }}
                >
                  Manage Students
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<School />}
                  sx={{ py: 1.5, mb: 1 }}
                  color="secondary"
                >
                  Add Course
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Assessment />}
                  sx={{ py: 1.5 }}
                >
                  System Reports
                </Button>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>System Status</Typography>
              <Typography variant="body2" color="success.main">● All systems operational</Typography>
              <Typography variant="caption" color="text.secondary">
                Last backup: Today, 02:00 AM
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
