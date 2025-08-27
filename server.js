const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_for_prod';

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
app.use(limiter);

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Failed to open database:', err);
        process.exit(1);
    }
    initializeDatabase();
});

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            studentId TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            course TEXT NOT NULL,
            year TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            filetype TEXT,
            course TEXT,
            year TEXT,
            semester TEXT,
            description TEXT,
            uploaderId INTEGER,
            size TEXT,
            uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(uploaderId) REFERENCES users(id)
        )`);

        // Insert demo user if not exists
        db.get(`SELECT id FROM users WHERE username = ?`, ['student123'], (err, row) => {
            if (!row) {
                const hashed = bcrypt.hashSync('password123', 10);
                db.run(`INSERT INTO users (username, password, name, studentId, email, course, year)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    ['student123', hashed, 'John Doe', 'STU2024001', 'john.doe@uni.edu', 'Computer Science', '2024']);
                console.log('Demo user created: student123 / password123');
            }
        });
    });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Accept common document types and images
        const allowed = /\.(pdf|docx?|pptx?|txt|zip|rar|jpg|jpeg|png|gif)$/i;
        if (allowed.test(file.originalname)) cb(null, true);
        else cb(new Error('Unsupported file type'), false);
    }
});

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid Authorization header' });
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Invalid or expired token' });
        // load user
        db.get(`SELECT id, username, name, email, course, year, studentId FROM users WHERE id = ?`, [payload.id], (err2, user) => {
            if (err2 || !user) return res.status(401).json({ error: 'User not found' });
            req.user = user;
            next();
        });
    });
}

// Validation middleware snippets
const validateLogin = [
    body('username').notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
];

const validateRegister = [
    body('username').isLength({ min: 3 }).withMessage('Username at least 3 chars'),
    body('password').isLength({ min: 6 }).withMessage('Password at least 6 chars'),
    body('name').notEmpty().withMessage('Name required'),
    body('studentId').notEmpty().withMessage('Student ID required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('course').notEmpty().withMessage('Course required'),
    body('year').notEmpty().withMessage('Year required')
];

const validateUpload = [
    body('courseName').notEmpty().withMessage('Course name is required'),
    body('year').notEmpty().withMessage('Year is required'),
    body('semester').notEmpty().withMessage('Semester is required')
];

// Routes

// Register
app.post('/api/register', validateRegister, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, name, studentId, email, course, year } = req.body;
    const hashed = bcrypt.hashSync(password, 10);

    const stmt = `INSERT INTO users (username, password, name, studentId, email, course, year)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(stmt, [username, hashed, name, studentId, email, course, year], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username / email / studentId already exists' });
            return res.status(500).json({ error: 'Database error' });
        }
        const userId = this.lastID;
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: userId, username, name, studentId, email, course, year }
        });
    });
});

// Login
app.post('/api/login', validateLogin, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                studentId: user.studentId,
                email: user.email,
                course: user.course,
                year: user.year
            }
        });
    });
});

// Public materials (view only)
app.get('/api/public/materials', (req, res) => {
    db.all(`SELECT id, title, filetype, course, year, semester, size, uploadDate FROM materials ORDER BY uploadDate DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch materials' });
        res.json(rows);
    });
});

// Authenticated materials (view full details)
app.get('/api/materials', authenticateToken, (req, res) => {
    db.all(`SELECT m.id, m.title, m.filename, m.filetype, m.course, m.year, m.semester, m.description, m.size, m.uploadDate, u.username as uploader
            FROM materials m LEFT JOIN users u ON m.uploaderId = u.id
            ORDER BY m.uploadDate DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch materials' });
        res.json(rows);
    });
});

// Upload (authenticated)
app.post('/api/upload', authenticateToken, upload.single('file'), validateUpload, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // delete uploaded file if validation fails
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { courseName, year, semester, description } = req.body;
    const file = req.file;
    const title = file.originalname;
    const filename = file.filename;
    const filepath = file.path;
    const filetype = path.extname(file.originalname).replace('.', '');
    const size = `${(file.size / 1024).toFixed(2)} KB`;
    const uploaderId = req.user.id;

    const stmt = `INSERT INTO materials (title, filename, filepath, filetype, course, year, semester, description, uploaderId, size)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(stmt, [title, filename, filepath, filetype, courseName, year, semester, description || '', uploaderId, size], function (err) {
        if (err) {
            // cleanup file on error
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            return res.status(500).json({ error: 'Failed to save material' });
        }
        res.json({
            id: this.lastID,
            title, filetype, course: courseName, year, semester, description, size, uploadDate: new Date()
        });
    });
});

// Download (requires authentication)
app.get('/api/download/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    db.get(`SELECT filepath, filename FROM materials WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Material not found' });
        const fullPath = path.resolve(row.filepath);
        if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File missing on server' });
        res.download(fullPath, row.filename, (err2) => {
            if (err2) console.error('Download error:', err2);
        });
    });
});

// Public download (no auth required)
app.get('/api/public/download/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT filepath, filename FROM materials WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('DB error on public download:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Material not found in database' });
        }

        const fullPath = path.resolve(row.filepath);
        if (!fs.existsSync(fullPath)) {
            console.error('File missing on server:', fullPath);
            return res.status(404).json({ error: 'File missing on server' });
        }

        res.download(fullPath, row.filename, (dlErr) => {
            if (dlErr) {
                console.error('Download stream error:', dlErr);
            }
        });
    });
});

// User profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const u = req.user;
    res.json({ id: u.id, username: u.username, name: u.name, email: u.email, course: u.course, year: u.year, studentId: u.studentId });
});

// Test download route (simple)
app.get('/test-download', (req, res) => {
    res.send('Download test OK');
});

// Serve home page at root
app.get('/', (req, res) => {
    const homePath = path.join(__dirname, 'public', 'home.html');
    if (fs.existsSync(homePath)) return res.sendFile(homePath);
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    res.send('Student Portal - Place your public/index.html or public/home.html in the public folder.');
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message || 'Server error' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});
