app.delete('/debtors/:id', async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing debtor ID' });
  }

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
