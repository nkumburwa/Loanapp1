require('dotenv').config(); // Banza usome .env

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool ukoresheje DATABASE_URL muri .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon/PostgreSQL cloud requires SSL
  }
});

app.use(bodyParser.json());

// ================= Routes =================

// GET all debtors
app.get('/debtors', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, amount, paid, status FROM debtors ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new debtor
app.post('/debtors', async (req, res) => {
  const { name, amount, paid = 0 } = req.body;
  if (!name || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const status = paid >= amount ? 'paid' : 'unpaid';

  try {
    const insertQuery = `INSERT INTO debtors (name, amount, paid, status) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(insertQuery, [name, amount, paid, status]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update debtor
app.put('/debtors/:id', async (req, res) => {
  const id = req.params.id;
  const { name, amount, paid = 0, status } = req.body;

  if (!name || !amount || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const updateQuery = `UPDATE debtors SET name = $1, amount = $2, paid = $3, status = $4 WHERE id = $5`;
    await pool.query(updateQuery, [name, amount, paid, status, id]);
    res.json({ message: 'Debtor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE debtor
app.delete('/debtors/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query('DELETE FROM debtors WHERE id = $1', [id]);

    if (result.rowCount > 0) {
      res.json({ message: 'Debtor deleted successfully' });
    } else {
      res.status(404).json({ error: 'Debtor not found or already deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET summary
app.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_debtors, 
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(paid), 0) AS total_paid 
      FROM debtors
    `);

    const summary = result.rows[0];
    const totalUnpaid = summary.total_amount - summary.total_paid;

    res.json({
      total_debtors: parseInt(summary.total_debtors),
      total_amount: parseFloat(summary.total_amount),
      total_paid: parseFloat(summary.total_paid),
      total_unpaid: totalUnpaid > 0 ? totalUnpaid : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Start server =================
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
