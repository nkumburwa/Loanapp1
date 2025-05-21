app.post('/debtors', async (req, res) => {
  const { name, amount, paid } = req.body;

  if (!name || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const paidValue = paid !== undefined ? parseFloat(paid) : 0.0;
  const status = paidValue >= amount ? 'paid' : 'unpaid';

  try {
    const insertQuery = `
      INSERT INTO debtors (name, amount, paid, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [name, amount, paidValue, status];
    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
