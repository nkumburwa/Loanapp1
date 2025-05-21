app.put('/debtors/:id', async (req, res) => {
  const id = req.params.id;
  const { name, amount, paid = 0, status } = req.body;

  if (!id || !name || amount === undefined || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `UPDATE debtors SET name = $1, amount = $2, paid = $3, status = $4 WHERE id = $5`,
      [name, amount, paid, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }

    res.json({ message: 'Debtor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
