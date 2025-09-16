const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

// --- Database Connection ---
// The PostgreSQL client will automatically use these environment variables
// to connect to the database. This is perfect for Kubernetes.
// - PGHOST
// - PGUSER
// - PGPASSWORD
// - PGDATABASE
// - PGPORT
const pool = new Pool();

pool.on('connect', () => {
  console.log('Connected to the database!');
  // Create the table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(10) UNIQUE NOT NULL,
      long_url TEXT NOT NULL
    );
  `;
  pool.query(createTableQuery)
    .then(() => {
      console.log('"links" table is ready.');
      // --- Server ---
      app.listen(port, () => {
        console.log(`Backend server listening on port ${port}`);
      });
    })
    .catch(err => console.error('Error creating table:', err.stack));
});

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.status(200).send('Backend is running');
});
