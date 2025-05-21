app.get('/debtors', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, amount, paid, status FROM debtors ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
