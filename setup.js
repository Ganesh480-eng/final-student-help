const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Student Portal Backend...\n');

// Create necessary directories
const directories = ['public', 'uploads'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
});

// Create .env file if it doesn't exist
const envContent = `# Server Configuration
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
`;

if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file');
} else {
    console.log('ℹ️  .env file already exists');
}

// Move frontend files to public directory if they exist in root
const filesToMove = ['index.html', 'index.css', 'script.js'];
filesToMove.forEach(file => {
    const rootPath = path.join(__dirname, file);
    const publicPath = path.join(__dirname, 'public', file);
    
    if (fs.existsSync(rootPath) && !fs.existsSync(publicPath)) {
        fs.copyFileSync(rootPath, publicPath);
        console.log(`✅ Moved ${file} to public/ directory`);
    }
});

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
} catch (error) {
    console.error('❌ Failed to install dependencies');
    console.error('Please run "npm install" manually');
}

console.log('\n🎉 Setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Start the server: npm run dev');
console.log('2. Open http://localhost:3000 in your browser');
console.log('3. Login with: student123 / password123');
console.log('\n📚 For more information, see SETUP.md');
