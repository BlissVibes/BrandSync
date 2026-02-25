// Vercel serverless entry point
// Wraps the Express app as a serverless function
const app = require('../server/index');
module.exports = app;
