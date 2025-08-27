const fs = require('fs');
const path = require('path');

console.log('🗄️  Resetting database...');

// Remove existing database file
const dbPath = './database.sqlite';
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Removed existing database file');
} else {
    console.log('ℹ️  No existing database file found');
}

console.log('🔄 Database reset complete!');
console.log('📋 Next steps:');
console.log('1. Start the server: npm run dev');
console.log('2. The database will be created automatically with proper tables');
console.log('3. Default user will be created: student123 / password123');
