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
    const totalDebtors = parseInt(summary.total_debtors, 10) || 0;
    const totalAmount = parseFloat(summary.total_amount) || 0;
    const totalPaid = parseFloat(summary.total_paid) || 0;
    const totalUnpaid = totalAmount - totalPaid > 0 ? totalAmount - totalPaid : 0;

    res.json({
      total_debtors: totalDebtors,
      total_amount: totalAmount,
      total_paid: totalPaid,
      total_unpaid: totalUnpaid,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
