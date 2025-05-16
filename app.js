require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const Student = require('./models/Student');
const GiftedStudent = require('./models/GiftedStudent');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Admin authentication middleware
function isAdmin(req, res, next) {
  if (req.session.admin) return next();
  return res.redirect('/admin');
}

// Routes

// Home page
app.get('/', (req, res) => {
  res.render('home');
});

// Student Registration
app.get('/student/register', (req, res) => {
  res.render('student-register', { error: null });
});

app.post('/student/register', async (req, res) => {
  try {
    const { name, registerNumber, year, department, gender, email } = req.body;
    const student = new Student({ name, registerNumber, year, department, gender, email });
    await student.save();
    res.render('registration-success', { student });
  } catch (err) {
    console.error('Registration error:', err);
    let errorMessage = 'Registration failed. Please try again.';
    if (err.code === 11000) {
      errorMessage = 'Registration number or email already exists!';
    } else if (err.errors) {
      const firstError = Object.values(err.errors)[0];
      errorMessage = firstError.message;
    }
    res.render('student-register', { error: errorMessage, formData: req.body });
  }
});

// Admin Login Page
app.get('/admin', (req, res) => {
  res.render('admin-login', { error: null });
});

// Admin Login Handler
app.post('/admin/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  } else {
    return res.render('admin-login', { error: 'Invalid username or password' });
  }
});

// Admin Dashboard - Protected Route
app.get('/admin/dashboard', isAdmin, async (req, res) => {
  const total = await Student.countDocuments();
  const boys = await Student.countDocuments({ gender: 'Male' });
  const girls = await Student.countDocuments({ gender: 'Female' });
  const gifted = await GiftedStudent.find().populate('studentId');
  res.render('admin-dashboard', { total, boys, girls, gifted });
});

// Generate Gifted Students (selects 5 boys and 5 girls randomly)
app.post('/admin/generate-gift', isAdmin, async (req, res) => {
  const alreadyGiftedIds = (await GiftedStudent.find()).map(g => g.studentId);
  const boys = await Student.aggregate([
    { $match: { gender: 'Male', _id: { $nin: alreadyGiftedIds } } },
    { $sample: { size: 5 } }
  ]);
  const girls = await Student.aggregate([
    { $match: { gender: 'Female', _id: { $nin: alreadyGiftedIds } } },
    { $sample: { size: 5 } }
  ]);
  const selected = [...boys, ...girls];
  await GiftedStudent.insertMany(selected.map(s => ({ studentId: s._id })));
  res.json(selected);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
