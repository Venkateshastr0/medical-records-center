const database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { medication_id, quantity_change, reason, reference_id } = req.body;

      if (!medication_id || !quantity_change) {
        return res.status(400).json({ error: 'medication_id and quantity_change are required' });
      }

      // Get current stock
      const med = await database.get(
        'SELECT stock_quantity FROM medications WHERE medication_id = ?',
        [medication_id]
      );

      if (!med) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      const previousQuantity = med.stock_quantity;
      const newQuantity = previousQuantity + quantity_change;

      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      // Update stock
      await database.run(
        'UPDATE medications SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE medication_id = ?',
        [newQuantity, medication_id]
      );

      // Log transaction
      const transactionType = quantity_change > 0 ? 'ADD' : 'DEDUCT';
      await database.run(`
        INSERT INTO stock_transactions 
        (medication_id, transaction_type, quantity_change, previous_quantity, new_quantity, reason, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [medication_id, transactionType, Math.abs(quantity_change), previousQuantity, newQuantity, reason || 'Manual adjustment', reference_id, null]);

      res.status(200).json({
        message: 'Stock updated successfully',
        medication_id,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        quantity_change
      });
    } catch (error) {
      console.error('Error updating stock:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: `Failed to update stock: ${error.message}` });
    }
  } else if (req.method === 'GET') {
    try {
      // Get stock transactions (transaction history)
      const { medication_id, limit = 50 } = req.query;

      let query = 'SELECT * FROM stock_transactions';
      let params = [];

      if (medication_id) {
        query += ' WHERE medication_id = ?';
        params.push(medication_id);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const transactions = await database.query(query, params);

      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      res.status(500).json({ error: 'Failed to fetch stock transactions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
