import { NextApiRequest, NextApiResponse } from 'next';
const twilioService = require('../../../lib/twilio');

export default async function handler(req, res) {
  try {
    const { patientPhone, doctorPhone, callerId } = req.body;
    
    switch (req.method) {
      case 'POST':
        const response = await twilioService.makeVoiceCall(
          patientPhone, 
          doctorPhone, 
          callerId
        );
        
        if (response.success) {
          res.status(200).json({
            success: true,
            callSid: response.callSid
          });
        } else {
          res.status(500).json({
            success: false,
            error: response.error
          });
        }
        break;
        
      case 'GET':
        // Handle TwiML for call handling
        const { doctor, patient } = req.query;
        
        if (doctor && patient) {
          // Generate TwiML response for call routing
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to Dr. ${doctor} for consultation with patient ${patient}.</Say>
  <Dial record="true" recordingStatusCallback="/api/twilio/recording-status">
    <Number>${doctor}</Number>
  </Dial>
  <Say>If the call cannot be completed, please try again later.</Say>
</Response>`;
          
          res.setHeader('Content-Type', 'text/xml');
          res.status(200).send(twiml);
        } else {
          res.status(400).json({ error: 'Doctor and patient numbers required' });
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Twilio Voice API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
