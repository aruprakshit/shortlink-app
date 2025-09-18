const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// --- Database Connection ---
const pool = new Pool();

const connectWithRetry = (retries = 5) => {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      if (retries === 0) {
        console.error('Max retries reached. Exiting.');
        return process.exit(1);
      }
      console.log(`Retrying connection in 5 seconds... (${retries} retries left)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.log('✅ Successfully connected to the database!');
      // --- Server ---
      app.listen(port, () => {
        console.log(`🚀 Backend server listening on port ${port}`);
      });
      release(); // Release the client back to the pool
      // Create the table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS links (
          id SERIAL PRIMARY KEY,
          short_code VARCHAR(10) UNIQUE NOT NULL,
          long_url TEXT NOT NULL
        );
      `;
      client.query(createTableQuery)
        .then(() => {
          console.log('✅ "links" table is ready.');
        })
        .catch(dbErr => {
          console.error('Error creating table:', dbErr.stack);
          process.exit(1);
        });
    }
  });
};

// Start the connection process
connectWithRetry();

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.status(200).send('Backend is running');
});

// --- API Endpoints ---

// Function to generate a random short code
const generateShortCode = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// GET /links - Retrieve all links
app.get('/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching links:', err.stack);
    res.status(500).send('Server error');
  }
});

// POST /links - Create a new short link
app.post('/links', async (req, res) => {
  const { long_url } = req.body;
  if (!long_url) {
    return res.status(400).send('long_url is required');
  }

  const short_code = generateShortCode();

  try {
    const result = await pool.query(
      'INSERT INTO links (short_code, long_url) VALUES ($1, $2) RETURNING *',
      [short_code, long_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating link:', err.stack);
    res.status(500).send('Server error');
  }
});

// GET /:short_code - Redirect to the original URL
app.get('/:short_code', async (req, res) => {
  const { short_code } = req.params;
  try {
    const result = await pool.query('SELECT long_url FROM links WHERE short_code = $1', [short_code]);
    if (result.rows.length > 0) {
      res.redirect(result.rows[0].long_url);
    } else {
      res.status(404).send('Short link not found');
    }
  } catch (err) {
    console.error('Error redirecting:', err.stack);
    res.status(500).send('Server error');
  }
});
