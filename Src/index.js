// index.js - Complete Node.js Backend for Attendance System
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Pool } = require('pg'); // PostgreSQL
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Configuration (PostgreSQL)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'attendance_system',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    client.release();
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ===================== MIDDLEWARE =====================

// Authentication middleware
const authenticateToken = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Check role permissions if specified
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    });
  };
};

// Role-specific middleware
const isAdmin = authenticateToken(['admin']);
const isLecturer = authenticateToken(['lecturer']);
const isStudent = authenticateToken(['student']);
const isLecturerOrAdmin = authenticateToken(['lecturer', 'admin']);
const isStudentOrLecturer = authenticateToken(['student', 'lecturer']);

// ===================== DATABASE HELPER FUNCTIONS =====================

// Initialize database tables
const initializeDatabase = async () => {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      registration_number VARCHAR(50) UNIQUE,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
      department VARCHAR(100),
      phone_number VARCHAR(20),
      profile_picture VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Courses table
    `CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      course_code VARCHAR(20) UNIQUE NOT NULL,
      course_name VARCHAR(100) NOT NULL,
      department VARCHAR(100),
      credit_hours INTEGER DEFAULT 3,
      lecturer_id INTEGER REFERENCES users(id),
      semester VARCHAR(20),
      academic_year VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Enrollments table
    `CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active',
      UNIQUE(student_id, course_id)
    )`,

    // Attendance sessions table
    `CREATE TABLE IF NOT EXISTS attendance_sessions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id),
      lecturer_id INTEGER REFERENCES users(id),
      session_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME,
      qr_code_data TEXT,
      qr_code_expiry TIMESTAMP,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      radius INTEGER DEFAULT 100,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Attendance records table
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES attendance_sessions(id),
      student_id INTEGER REFERENCES users(id),
      marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')),
      marked_by VARCHAR(20) DEFAULT 'system',
      ip_address VARCHAR(45),
      device_info TEXT,
      location_data JSONB,
      UNIQUE(session_id, student_id)
    )`,

    // Departments table
    `CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      department_code VARCHAR(20) UNIQUE NOT NULL,
      department_name VARCHAR(100) NOT NULL,
      faculty VARCHAR(100),
      head_of_department INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Timetable table
    `CREATE TABLE IF NOT EXISTS timetable (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id),
      day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      venue VARCHAR(100),
      academic_year VARCHAR(20),
      semester VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Create indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_users_registration ON users(registration_number)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON attendance_sessions(session_date)`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`
  ];

  try {
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Call initialization
initializeDatabase();

// ===================== AUTHENTICATION ROUTES =====================

// Register new user (Admin only)
app.post('/api/auth/register', isAdmin, async (req, res) => {
  try {
    const {
      registration_number,
      email,
      password,
      first_name,
      last_name,
      role,
      department,
      phone_number
    } = req.body;

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR registration_number = $2',
      [email, registration_number]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (
        registration_number, email, password, first_name, last_name, 
        role, department, phone_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        registration_number,
        email,
        hashedPassword,
        first_name,
        last_name,
        role,
        department,
        phone_number
      ]
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser.rows[0];

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    // Find user by email or registration number
    const user = await pool.query(
      `SELECT * FROM users WHERE 
        (email = $1 OR registration_number = $1) 
        AND role = $2 AND is_active = TRUE`,
      [identifier, role]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role,
        registration_number: user.rows[0].registration_number
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.rows[0];

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken([]), async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, registration_number, email, first_name, last_name, role, department, phone_number, profile_picture, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== STUDENT ROUTES =====================

// Get student dashboard data
app.get('/api/student/dashboard', isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get attendance summary
    const attendanceSummary = await pool.query(`
      SELECT 
        COUNT(DISTINCT ar.session_id) as total_sessions,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as attended,
        ROUND(
          (SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT ar.session_id), 0)
        ), 2) as attendance_percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1
    `, [studentId]);

    // Get recent attendance
    const recentAttendance = await pool.query(`
      SELECT 
        ar.marked_at as date,
        c.course_name as course,
        ar.status,
        TO_CHAR(ar.marked_at, 'HH24:MI') as time
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE ar.student_id = $1
      ORDER BY ar.marked_at DESC
      LIMIT 10
    `, [studentId]);

    // Get today's classes
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay() || 7; // Convert to 1-7 (Mon-Sun)
    
    const todaysClasses = await pool.query(`
      SELECT 
        t.start_time as time,
        c.course_name as course,
        t.venue,
        u.first_name || ' ' || u.last_name as lecturer
      FROM timetable t
      JOIN courses c ON t.course_id = c.id
      JOIN users u ON c.lecturer_id = u.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE t.day_of_week = $1 
        AND e.student_id = $2
        AND e.status = 'active'
      ORDER BY t.start_time
    `, [dayOfWeek, studentId]);

    // Get courses enrolled
    const enrolledCourses = await pool.query(`
      SELECT 
        c.id,
        c.course_code,
        c.course_name,
        c.credit_hours,
        u.first_name || ' ' || u.last_name as lecturer
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      JOIN users u ON c.lecturer_id = u.id
      WHERE e.student_id = $1 AND e.status = 'active'
    `, [studentId]);

    res.json({
      attendanceSummary: attendanceSummary.rows[0],
      recentAttendance: recentAttendance.rows,
      todaysClasses: todaysClasses.rows,
      enrolledCourses: enrolledCourses.rows
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance via QR code
app.post('/api/student/mark-attendance', isStudent, async (req, res) => {
  try {
    const { qr_data, latitude, longitude } = req.body;
    const studentId = req.user.id;

    // Parse QR data (should contain session_id:timestamp:signature)
    const [sessionId, timestamp, signature] = qr_data.split(':');

    // Validate session exists and is active
    const session = await pool.query(`
      SELECT * FROM attendance_sessions 
      WHERE id = $1 AND status = 'active' 
      AND qr_code_expiry > NOW()
    `, [sessionId]);

    if (session.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }

    // Check if student is enrolled in the course
    const enrollment = await pool.query(`
      SELECT * FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND c.id = $2
    `, [studentId, session.rows[0].course_id]);

    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Check if attendance already marked
    const existingAttendance = await pool.query(
      'SELECT * FROM attendance_records WHERE session_id = $1 AND student_id = $2',
      [sessionId, studentId]
    );

    if (existingAttendance.rows.length > 0) {
      return res.status(400).json({ error: 'Attendance already marked' });
    }

    // Calculate status (present/late)
    const sessionStart = new Date(`${session.rows[0].session_date}T${session.rows[0].start_time}`);
    const now = new Date();
    const minutesLate = (now - sessionStart) / (1000 * 60);
    const status = minutesLate > 15 ? 'late' : 'present';

    // Insert attendance record
    const attendanceRecord = await pool.query(`
      INSERT INTO attendance_records (
        session_id, student_id, status, marked_at,
        ip_address, location_data
      ) VALUES ($1, $2, $3, NOW(), $4, $5)
      RETURNING *
    `, [
      sessionId,
      studentId,
      status,
      req.ip,
      JSON.stringify({ latitude, longitude })
    ]);

    res.json({
      message: 'Attendance marked successfully',
      attendance: attendanceRecord.rows[0],
      status
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== LECTURER ROUTES =====================

// Get lecturer dashboard data
app.get('/api/lecturer/dashboard', isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;

    // Get lecturer's courses
    const courses = await pool.query(`
      SELECT 
        c.id,
        c.course_code,
        c.course_name,
        COUNT(DISTINCT e.student_id) as student_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.lecturer_id = $1
      GROUP BY c.id, c.course_code, c.course_name
    `, [lecturerId]);

    // Get today's attendance sessions
    const today = new Date().toISOString().split('T')[0];
    const todaysSessions = await pool.query(`
      SELECT 
        s.id,
        s.session_date,
        s.start_time,
        s.end_time,
        c.course_name,
        COUNT(ar.id) as attendance_count
      FROM attendance_sessions s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE s.lecturer_id = $1 AND s.session_date = $2
      GROUP BY s.id, s.session_date, s.start_time, s.end_time, c.course_name
      ORDER BY s.start_time
    `, [lecturerId, today]);

    // Get overall statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT s.id) as total_sessions
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      LEFT JOIN attendance_sessions s ON c.id = s.course_id
      WHERE c.lecturer_id = $1
    `, [lecturerId]);

    res.json({
      courses: courses.rows,
      todaysSessions: todaysSessions.rows,
      statistics: stats.rows[0]
    });
  } catch (error) {
    console.error('Lecturer dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create attendance session with QR code
app.post('/api/lecturer/create-session', isLecturer, async (req, res) => {
  try {
    const { course_id, session_date, start_time, end_time, latitude, longitude, radius } = req.body;
    const lecturerId = req.user.id;

    // Generate unique session data for QR code
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const timestamp = Date.now();
    const signature = require('crypto')
      .createHmac('sha256', JWT_SECRET)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex');
    
    const qrData = `${sessionId}:${timestamp}:${signature}`;

    // Generate QR code image
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Set expiry time (e.g., 30 minutes from now)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 30);

    // Insert session into database
    const session = await pool.query(`
      INSERT INTO attendance_sessions (
        course_id, lecturer_id, session_date, start_time, end_time,
        qr_code_data, qr_code_expiry, latitude, longitude, radius
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      course_id,
      lecturerId,
      session_date,
      start_time,
      end_time,
      qrData,
      expiryTime,
      latitude,
      longitude,
      radius || 100
    ]);

    res.json({
      message: 'Attendance session created',
      session: session.rows[0],
      qr_code_url: qrCodeUrl,
      qr_data: qrData
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session attendance
app.get('/api/lecturer/session/:sessionId/attendance', isLecturer, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const attendance = await pool.query(`
      SELECT 
        ar.id,
        u.registration_number,
        u.first_name,
        u.last_name,
        ar.status,
        TO_CHAR(ar.marked_at, 'HH24:MI:SS') as marked_time,
        ar.device_info
      FROM attendance_records ar
      JOIN users u ON ar.student_id = u.id
      WHERE ar.session_id = $1
      ORDER BY ar.marked_at
    `, [sessionId]);

    res.json(attendance.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually mark attendance
app.post('/api/lecturer/manual-attendance', isLecturer, async (req, res) => {
  try {
    const { session_id, student_id, status } = req.body;

    // Check if already marked
    const existing = await pool.query(
      'SELECT * FROM attendance_records WHERE session_id = $1 AND student_id = $2',
      [session_id, student_id]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await pool.query(
        'UPDATE attendance_records SET status = $1, marked_at = NOW() WHERE id = $2',
        [status, existing.rows[0].id]
      );
    } else {
      // Insert new
      await pool.query(`
        INSERT INTO attendance_records (session_id, student_id, status, marked_by)
        VALUES ($1, $2, $3, 'manual')
      `, [session_id, student_id, status]);
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== ADMIN ROUTES =====================

// Get admin dashboard data
app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
  try {
    // Get overall statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = TRUE) as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'lecturer' AND is_active = TRUE) as total_lecturers,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(DISTINCT department) FROM users WHERE department IS NOT NULL) as total_departments,
        (SELECT COUNT(*) FROM attendance_sessions WHERE session_date = CURRENT_DATE) as today_sessions,
        (SELECT ROUND(AVG(attendance_percentage), 2) FROM (
          SELECT 
            c.id,
            ROUND(
              (COUNT(CASE WHEN ar.status = 'present' THEN 1 END) * 100.0 / 
              NULLIF(COUNT(ar.id), 0)
            ), 2) as attendance_percentage
          FROM courses c
          LEFT JOIN attendance_sessions s ON c.id = s.course_id
          LEFT JOIN attendance_records ar ON s.id = ar.session_id
          GROUP BY c.id
        ) subquery) as avg_attendance
    `);

    // Get recent activities
    const activities = await pool.query(`
      SELECT 
        'New Registration' as type,
        COUNT(*) as count,
        'medium' as priority
      FROM users 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'Pending Approvals',
        COUNT(*) as count,
        'high' as priority
      FROM users 
      WHERE is_active = FALSE
      
      UNION ALL
      
      SELECT 
        'System Logs',
        (SELECT COUNT(*) FROM (
          SELECT * FROM attendance_records 
          WHERE marked_at >= CURRENT_DATE - INTERVAL '1 day'
          LIMIT 100
        ) sub) as count,
        'low' as priority
      ORDER BY priority DESC
    `);

    // Get department-wise statistics
    const departmentStats = await pool.query(`
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as student_count,
        COUNT(DISTINCT c.id) as course_count,
        ROUND(AVG(
          CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END
        ) * 100, 2) as attendance_percentage
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN attendance_sessions s ON c.id = s.course_id
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE u.role = 'student' AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY student_count DESC
      LIMIT 10
    `);

    // Get attendance trend (last 6 months)
    const attendanceTrend = await pool.query(`
      SELECT 
        TO_CHAR(s.session_date, 'Mon') as month,
        EXTRACT(MONTH FROM s.session_date) as month_num,
        ROUND(
          (COUNT(CASE WHEN ar.status = 'present' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(ar.id), 0)
        ), 2) as attendance_rate
      FROM attendance_sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE s.session_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(s.session_date, 'Mon'), EXTRACT(MONTH FROM s.session_date)
      ORDER BY MIN(s.session_date)
    `);

    res.json({
      statistics: stats.rows[0],
      activities: activities.rows,
      departmentStats: departmentStats.rows,
      attendanceTrend: attendanceTrend.rows
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, registration_number, email, first_name, last_name, 
        role, department, phone_number, profile_picture, 
        is_active, created_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1 ${role ? 'AND role = $1' : ''}`;
    const countParams = role ? [role] : [];
    const totalCount = await pool.query(countQuery, countParams);

    res.json({
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount.rows[0].count),
        totalPages: Math.ceil(totalCount.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Course management
app.post('/api/admin/courses', isAdmin, async (req, res) => {
  try {
    const {
      course_code,
      course_name,
      department,
      credit_hours,
      lecturer_id,
      semester,
      academic_year
    } = req.body;

    const course = await pool.query(`
      INSERT INTO courses (
        course_code, course_name, department, credit_hours,
        lecturer_id, semester, academic_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      course_code,
      course_name,
      department,
      credit_hours,
      lecturer_id,
      semester,
      academic_year
    ]);

    res.status(201).json({
      message: 'Course created successfully',
      course: course.rows[0]
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll student in course
app.post('/api/admin/enrollments', isAdmin, async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    const enrollment = await pool.query(`
      INSERT INTO enrollments (student_id, course_id)
      VALUES ($1, $2)
      ON CONFLICT (student_id, course_id) 
      DO UPDATE SET status = 'active', enrollment_date = CURRENT_TIMESTAMP
      RETURNING *
    `, [student_id, course_id]);

    res.json({
      message: 'Student enrolled successfully',
      enrollment: enrollment.rows[0]
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== REPORTING ROUTES =====================

// Generate attendance report
app.get('/api/reports/attendance', isLecturerOrAdmin, async (req, res) => {
  try {
    const { course_id, start_date, end_date, format = 'json' } = req.query;

    const report = await pool.query(`
      SELECT 
        u.registration_number,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
        ROUND(
          (COUNT(CASE WHEN ar.status = 'present' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT s.id), 0)
        ), 2) as attendance_percentage
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN attendance_sessions s ON c.id = s.course_id
        AND s.session_date BETWEEN $1 AND $2
      LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.student_id = u.id
      WHERE c.id = $3 AND u.role = 'student'
      GROUP BY u.id, u.registration_number, u.first_name, u.last_name
      ORDER BY u.registration_number
    `, [start_date || '2024-01-01', end_date || '2024-12-31', course_id]);

    if (format === 'excel') {
      // Generate Excel report
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      // Add headers
      worksheet.columns = [
        { header: 'Reg No', key: 'registration_number', width: 15 },
        { header: 'First Name', key: 'first_name', width: 15 },
        { header: 'Last Name', key: 'last_name', width: 15 },
        { header: 'Total Sessions', key: 'total_sessions', width: 15 },
        { header: 'Present', key: 'present', width: 10 },
        { header: 'Absent', key: 'absent', width: 10 },
        { header: 'Late', key: 'late', width: 10 },
        { header: 'Percentage', key: 'attendance_percentage', width: 15 }
      ];

      // Add data
      worksheet.addRows(report.rows);

      // Set response headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json(report.rows);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== COMMON ROUTES =====================

// Get courses (common for all roles)
app.get('/api/courses', authenticateToken([]), async (req, res) => {
  try {
    const { department, semester, lecturer_id } = req.query;

    let query = `
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as lecturer_name,
        COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.lecturer_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      query += ` AND c.department = $${paramCount}`;
      params.push(department);
    }

    if (semester) {
      paramCount++;
      query += ` AND c.semester = $${paramCount}`;
      params.push(semester);
    }

    if (lecturer_id) {
      paramCount++;
      query += ` AND c.lecturer_id = $${paramCount}`;
      params.push(lecturer_id);
    }

    query += ` GROUP BY c.id, u.first_name, u.last_name ORDER BY c.course_code`;

    const courses = await pool.query(query, params);
    res.json(courses.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get departments
app.get('/api/departments', authenticateToken([]), async (req, res) => {
  try {
    const departments = await pool.query(`
      SELECT DISTINCT department 
      FROM users 
      WHERE department IS NOT NULL 
      ORDER BY department
    `);
    res.json(departments.rows.map(d => d.department));
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
app.put('/api/profile', authenticateToken([]), upload.single('profile_picture'), async (req, res) => {
  try {
    const { first_name, last_name, phone_number } = req.body;
    const userId = req.user.id;

    const updateData = {
      first_name,
      last_name,
      phone_number,
      updated_at: new Date()
    };

    if (req.file) {
      updateData.profile_picture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await pool.query(`
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone_number = COALESCE($3, phone_number),
        profile_picture = COALESCE($4, profile_picture),
        updated_at = $5
      WHERE id = $6
      RETURNING id, registration_number, email, first_name, last_name, 
                role, department, phone_number, profile_picture
    `, [
      updateData.first_name,
      updateData.last_name,
      updateData.phone_number,
      updateData.profile_picture,
      updateData.updated_at,
      userId
    ]);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
app.post('/api/change-password', authenticateToken([]), async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Get current password
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.rows[0].password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== FILE SERVING =====================

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ===================== ERROR HANDLING =====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===================== SERVER START =====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   • POST /api/auth/login - User login`);
  console.log(`   • GET  /api/auth/me - Get current user`);
  console.log(`   • GET  /api/student/dashboard - Student dashboard`);
  console.log(`   • POST /api/student/mark-attendance - Mark attendance via QR`);
  console.log(`   • GET  /api/lecturer/dashboard - Lecturer dashboard`);
  console.log(`   • POST /api/lecturer/create-session - Create attendance session`);
  console.log(`   • GET  /api/admin/dashboard - Admin dashboard`);
  console.log(`   • GET  /api/admin/users - User management`);
  console.log(`   • GET  /api/reports/attendance - Generate reports`);
});

module.exports = app;
