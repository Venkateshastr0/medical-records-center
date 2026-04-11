import { NextApiRequest, NextApiResponse } from 'next';
const twilioService = require('../../../lib/twilio');

export default async function handler(req, res) {
  try {
    const { action, roomName, identity, role, consultationType } = req.body;
    
    switch (req.method) {
      case 'POST':
        switch (action) {
          case 'create_room':
            const roomResponse = await twilioService.createVideoRoom(
              roomName, 
              consultationType
            );
            
            if (roomResponse.success) {
              res.status(200).json({
                success: true,
                roomId: roomResponse.roomId,
                roomName: roomResponse.roomName
              });
            } else {
              res.status(500).json({
                success: false,
                error: roomResponse.error
              });
            }
            break;
            
          case 'generate_token':
            const tokenResponse = await twilioService.generateVideoToken(
              roomName, 
              identity, 
              role
            );
            
            if (tokenResponse.success) {
              res.status(200).json({
                success: true,
                token: tokenResponse.token
              });
            } else {
              res.status(500).json({
                success: false,
                error: tokenResponse.error
              });
            }
            break;
            
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }
        break;
        
      case 'GET':
        // Get room status
        if (req.query.roomName) {
          // This would typically query Twilio API for room status
          // For now, return mock status
          res.status(200).json({
            roomName: req.query.roomName,
            status: 'active',
            participants: 0
          });
        } else {
          res.status(400).json({ error: 'Room name required' });
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Twilio Video API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
