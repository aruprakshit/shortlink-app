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
    .then(() => console.log('"links" table is ready.'))
    .catch(err => console.error('Error creating table:', err.stack));
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});


// --- API Endpoints ---

// Generate a random short code
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Endpoint to create a new short link
app.post('/links', async (req, res) => {
  const { long_url } = req.body;
  if (!long_url) {
    return res.status(400).json({ error: 'long_url is required' });
  }

  const short_code = generateShortCode();

  try {
    const result = await pool.query(
      'INSERT INTO links(short_code, long_url) VALUES($1, $2) RETURNING *',
      [short_code, long_url]
    );
    console.log(`URL shortened: ${result.rows[0].long_url} -> ${result.rows[0].short_code}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting link:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get all links (for debugging/demo)
app.get('/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching links:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Server ---
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
