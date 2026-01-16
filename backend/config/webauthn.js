const webauthnConfig = {
  rpName: 'HackCrypt Attendance',
  rpID: 'localhost', // Change to your domain in production
  origin: 'http://localhost:5173', // Change to your frontend URL in production
  timeout: 60000,
};

module.exports = webauthnConfig;