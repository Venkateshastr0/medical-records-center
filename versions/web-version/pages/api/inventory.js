import { NextApiRequest, NextApiResponse } from 'next';
const database = require('../../lib/database');

export default async function handler(req, res) {
  try {
    const db = await database.connect();
    
    switch (req.method) {
      case 'GET':
        // Get inventory items
        const { category: queryCategory, low_stock, search } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (queryCategory) {
          whereClause += ' AND category = ?';
          params.push(queryCategory);
        }
        
        if (low_stock === 'true') {
          whereClause += ' AND stock_level <= reorder_level';
        }
        
        if (search) {
          whereClause += ' AND (name LIKE ? OR generic_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        
        const items = await database.query(`
          SELECT * FROM inventory 
          ${whereClause}
          ORDER BY name ASC
        `, params);
        
        res.status(200).json({ items });
        break;
        
      case 'POST':
        // Add new inventory item
        const {
          name,
          generic_name,
          category: postCategory,
          manufacturer,
          unit_price,
          stock_level: postStockLevel,
          reorder_level,
          critical_level,
          expiry_date,
          batch_number,
          storage_requirements
        } = req.body;
        
        // Validate required fields
        if (!name || !postCategory || !unit_price || postStockLevel === undefined) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await database.run(`
          INSERT INTO inventory (
            name, generic_name, category, manufacturer, unit_price,
            stock_level, reorder_level, critical_level, expiry_date,
            batch_number, storage_requirements
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          name, generic_name, postCategory, manufacturer, unit_price,
          postStockLevel, reorder_level || postStockLevel * 0.2, critical_level || postStockLevel * 0.1,
          expiry_date, batch_number, storage_requirements
        ]);
        
        const newItem = await database.get(
          'SELECT * FROM inventory WHERE id = ?',
          [result.id]
        );
        
        res.status(201).json({ item: newItem });
        break;
        
      case 'PUT':
        // Update inventory stock
        const { id, stock_level: putStockLevel, adjustment_type, adjustment_reason } = req.body;
        
        if (!id || putStockLevel === undefined) {
          return res.status(400).json({ error: 'Item ID and stock level required' });
        }
        
        // Create stock movement record
        if (adjustment_type && adjustment_reason) {
          await database.run(`
            INSERT INTO inventory_movements (
              inventory_id, movement_type, quantity, reason, created_by
            ) VALUES (?, ?, ?, ?, ?)
          `, [id, adjustment_type, putStockLevel, adjustment_reason, 1]); // TODO: Get actual user ID
        }
        
        await database.run(`
          UPDATE inventory 
          SET stock_level = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [putStockLevel, id]);
        
        const updatedItem = await database.get(
          'SELECT * FROM inventory WHERE id = ?',
          [id]
        );
        
        res.status(200).json({ item: updatedItem });
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await database.close();
  }
}
