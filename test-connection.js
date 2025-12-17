const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');

mongoose.connect('mongodb://localhost:27017/nft-ticketing', {
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Connected');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FAILED! MongoDB Not Connected');
    console.error('Error:', err.message);
    console.log('\nTroubleshooting:');
    console.log('1. Is MongoDB running? Run: Get-Service MongoDB');
    console.log('2. Try starting manually: mongod --dbpath C:\\data\\db');
    console.log('3. Check .env has: MONGODB_URI=mongodb://localhost:27017/nft-ticketing');
    process.exit(1);
  });