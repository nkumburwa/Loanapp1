require('dotenv').config(); // Banza usome .env

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// PostgreSQL connection pool ukoresheje DATABASE_URL muri .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon/PostgreSQL cloud requires SSL
  }
});

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
  if (!name || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let status;
  if (paid == 0) {
    status = 'unpaid';
  } else if (paid > 0 && paid < amount) {
    status = 'partial';
  } else {
    status = 'paid';
  }

  try {
    const insertQuery = `INSERT INTO debtors (name, amount, paid, status) VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(insertQuery, [name, amount, paid, status]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update paid only + status logic
app.put('/debtors/:id', async (req, res) => {
  const id = req.params.id;
  const { paid } = req.body;

  if (paid === undefined) {
    return res.status(400).json({ error: 'Paid field is required.' });
  }

  try {
    // Fata amount ya debtor uri kuvugurura
    const existing = await pool.query('SELECT amount FROM debtors WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }

    const amount = parseFloat(existing.rows[0].amount);

    // Reba status hashingiwe kuri paid vs amount
    let newStatus;
    if (paid == 0) {
      newStatus = 'unpaid';
    } else if (paid > 0 && paid < amount) {
      newStatus = 'partial';
    } else {
      newStatus = 'paid';
    }

    // Update paid na status gusa
    const updateQuery = `UPDATE debtors SET paid = $1, status = $2 WHERE id = $3`;
    await pool.query(updateQuery, [paid, newStatus, id]);

    res.json({ message: 'Paid updated successfully', paid, status: newStatus });
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

// GET summary with status breakdown
app.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_debtors, 
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(paid), 0) AS total_paid,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS fully_paid,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) AS partially_paid,
        COUNT(CASE WHEN status = 'unpaid' THEN 1 END) AS unpaid
      FROM debtors
    `);

    const summary = result.rows[0];
    const totalUnpaid = summary.total_amount - summary.total_paid;

    res.json({
      total_debtors: parseInt(summary.total_debtors),
      total_amount: parseFloat(summary.total_amount),
      total_paid: parseFloat(summary.total_paid),
      total_unpaid: totalUnpaid > 0 ? totalUnpaid : 0,
      fully_paid: parseInt(summary.fully_paid),
      partially_paid: parseInt(summary.partially_paid),
      unpaid: parseInt(summary.unpaid)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Start server =================
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
