import { NextApiRequest, NextApiResponse } from 'next';
const database = require('../../../lib/database');

export default async function handler(req, res) {
  try {
    const db = await database.connect();
    
    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    if (period === 'today') {
      dateFilter = 'DATE(created_at) = DATE(CURRENT_TIMESTAMP)';
    } else if (period === 'week') {
      dateFilter = 'created_at >= DATE(CURRENT_TIMESTAMP, \'-7 days\')';
    } else if (period === 'month') {
      dateFilter = 'created_at >= DATE(CURRENT_TIMESTAMP, \'-30 days\')';
    }
    
    // Get dispensed prescriptions count
    const dispensedResult = await database.get(`
      SELECT COUNT(*) as dispensedToday 
      FROM prescriptions 
      WHERE status = 'dispensed' AND ${dateFilter}
    `);
    
    // Get pending prescriptions count
    const pendingResult = await database.get(`
      SELECT COUNT(*) as pendingCount 
      FROM prescriptions 
      WHERE status = 'pending'
    `);
    
    // Get low stock items count
    const lowStockResult = await database.get(`
      SELECT COUNT(*) as lowStockCount 
      FROM inventory 
      WHERE stock_level <= reorder_level
    `);
    
    // Get critical items count
    const criticalResult = await database.get(`
      SELECT COUNT(*) as criticalCount 
      FROM inventory 
      WHERE stock_level <= critical_level
    `);
    
    // Get revenue for period
    const revenueResult = await database.get(`
      SELECT SUM(unit_price * quantity) as revenue 
      FROM prescription_dispensaries pd
      JOIN inventory i ON pd.inventory_id = i.id
      WHERE pd.created_at >= DATE(CURRENT_TIMESTAMP, '-${period === 'today' ? '0' : period === 'week' ? '7' : '30'} days')
    `);
    
    const stats = {
      dispensedToday: dispensedResult.dispensedToday || 0,
      pendingCount: pendingResult.pendingCount || 0,
      lowStockCount: lowStockResult.lowStockCount || 0,
      criticalCount: criticalResult.criticalCount || 0,
      revenue: revenueResult.revenue || 0,
      period
    };
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Pharmacy stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await database.close();
  }
}
