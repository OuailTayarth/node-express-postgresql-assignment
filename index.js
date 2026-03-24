require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json());

// Endpoint 1: GET /players-scores
// INNER JOIN: return all players with their game titles and scores
app.get('/players-scores', async (req, res) => {
  try {
    const query = `
      SELECT p.name AS player_name, g.title AS game_title, s.score 
      FROM players p
      INNER JOIN scores s ON p.id = s.player_id
      INNER JOIN games g ON s.game_id = g.id;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving players scores' });
  }
});

// Endpoint 2: GET /top-players
// Return top 3 players by highest total score (descending)
app.get('/top-players', async (req, res) => {
  try {
    const query = `
      SELECT p.name AS player_name, SUM(s.score) AS total_score 
      FROM players p
      JOIN scores s ON p.id = s.player_id
      GROUP BY p.id, p.name
      ORDER BY total_score DESC
      LIMIT 3;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving top players' });
  }
});

// Endpoint 3: GET /inactive-players
// LEFT OUTER JOIN: return players who haven't played any games
app.get('/inactive-players', async (req, res) => {
  try {
    const query = `
      SELECT p.*
      FROM players p
      LEFT OUTER JOIN scores s ON p.id = s.player_id
      WHERE s.id IS NULL;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving inactive players' });
  }
});

// Endpoint 4: GET /popular-genres
// GROUP BY + COUNT: return most popular genres by play count
app.get('/popular-genres', async (req, res) => {
  try {
    const query = `
      SELECT g.genre, COUNT(s.id) AS play_count
      FROM games g
      JOIN scores s ON g.id = s.game_id
      GROUP BY g.genre
      ORDER BY play_count DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving popular genres' });
  }
});

// Endpoint 5: GET /recent-players
// Return players who joined in the last 30 days
app.get('/recent-players', async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM players
      WHERE join_date >= CURRENT_DATE - INTERVAL '30 days';
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving recent players' });
  }
});

// Endpoint 6 (Bonus): GET /favorite-games
// Return each player's most-played game (player name + game title)
app.get('/favorite-games', async (req, res) => {
  try {
    // using CTE and row_number to partition by player and order by counts
    const query = `
      WITH RankedGames AS (
        SELECT p.id as player_id, p.name as player_name, g.title as game_title, COUNT(s.id) as play_count,
        ROW_NUMBER() OVER(PARTITION BY p.id ORDER BY COUNT(s.id) DESC) as rn
        FROM players p
        JOIN scores s ON p.id = s.player_id
        JOIN games g ON s.game_id = g.id
        GROUP BY p.id, p.name, g.title
      )
      SELECT player_name, game_title, play_count
      FROM RankedGames
      WHERE rn = 1;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving favorite games' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
