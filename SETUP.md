# 🚀 Backend Integration Setup Guide

This guide will help you integrate the backend with your frontend to create a fully functional student portal.

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

## 🛠️ Installation Steps

### 1. Install Backend Dependencies

```bash
# Install all required packages
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration
DATABASE_URL=./database.sqlite

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/

# Security Configuration
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Organize Project Structure

Move your frontend files to a `public` folder:

```
student-portal/
├── public/
│   ├── index.html
│   ├── index.css
│   └── script.js (or script-backend.js)
├── server.js
├── package.json
├── .env
├── database.sqlite (will be created automatically)
├── uploads/ (will be created automatically)
└── README.md
```

### 4. Update Frontend Script

Replace your `script.js` with `script-backend.js` or update the script reference in `index.html`:

```html
<script src="script-backend.js"></script>
```

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000
- **API Base URL**: http://localhost:3000/api

## 🔐 Default Login Credentials

- **Username**: `student123`
- **Password**: `password123`

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login |
| POST | `/api/register` | User registration |
| GET | `/api/materials` | Get study materials |
| POST | `/api/upload` | Upload study material |
| GET | `/api/download/:id` | Download study material |
| GET | `/api/profile` | Get user profile |

## 🔧 Configuration Options

### Database Options

**SQLite (Default - Good for development)**
- No additional setup required
- Database file created automatically
- Good for small to medium applications

**PostgreSQL (Recommended for production)**
```bash
npm install pg
```

**MySQL (Alternative for production)**
```bash
npm install mysql2
```

### File Storage Options

**Local Storage (Default)**
- Files stored in `uploads/` directory
- Good for development and small applications

**Cloud Storage (Recommended for production)**
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## 🚀 Deployment Options

### 1. Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

### 2. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### 3. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 4. DigitalOcean App Platform

- Connect your GitHub repository
- Choose Node.js environment
- Set environment variables
- Deploy automatically

## 🔒 Security Considerations

### Production Checklist

- [ ] Change JWT_SECRET to a strong, unique key
- [ ] Use HTTPS in production
- [ ] Set up proper CORS configuration
- [ ] Implement rate limiting
- [ ] Use environment variables for sensitive data
- [ ] Set up proper file upload validation
- [ ] Implement user input sanitization
- [ ] Set up database backups
- [ ] Use a production database (PostgreSQL/MySQL)
- [ ] Set up monitoring and logging

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=your-very-long-and-random-secret-key
DATABASE_URL=postgresql://username:password@host:port/database
CORS_ORIGIN=https://yourdomain.com
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    studentId TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Study Materials Table
```sql
CREATE TABLE study_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    semester TEXT NOT NULL,
    fileType TEXT NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    description TEXT,
    uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    size TEXT NOT NULL,
    userId INTEGER,
    FOREIGN KEY (userId) REFERENCES users (id)
);
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection error**
   ```bash
   # Remove existing database
   rm database.sqlite
   # Restart server
   npm run dev
   ```

3. **File upload errors**
   ```bash
   # Create uploads directory
   mkdir uploads
   # Set proper permissions
   chmod 755 uploads
   ```

4. **CORS errors**
   - Check if frontend and backend are on same port
   - Verify CORS configuration in server.js

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run dev
```

## 📈 Performance Optimization

### For Production

1. **Enable compression**
   ```bash
   npm install compression
   ```

2. **Use Redis for session storage**
   ```bash
   npm install redis express-session
   ```

3. **Implement caching**
   ```bash
   npm install node-cache
   ```

4. **Use CDN for static files**
   - Upload files to AWS S3 or similar
   - Serve through CloudFront

## 🔄 Updates and Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Monitor error logs
- [ ] Backup database regularly
- [ ] Check file storage usage
- [ ] Review security settings

### Backup Strategy

```bash
# Database backup
sqlite3 database.sqlite ".backup backup_$(date +%Y%m%d).sqlite"

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the error logs
3. Verify your configuration
4. Test with the default credentials

## 🎉 Congratulations!

You now have a fully functional student portal with:
- ✅ Real user authentication
- ✅ Secure file uploads
- ✅ Database persistence
- ✅ API endpoints
- ✅ Production-ready setup

Your application is ready for real-world use!
