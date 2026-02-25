require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./db/schema');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize DB on startup
initSchema();

// Routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/relationships', require('./routes/relationships'));
app.use('/api/controversies', require('./routes/controversies'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/vet', require('./routes/vet'));
app.use('/api/sponsorships', require('./routes/sponsorships'));

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '0.1.0' }));

// Export for Vercel serverless
module.exports = app;

// Run locally
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`BrandSync API running on http://localhost:${PORT}`));
}
