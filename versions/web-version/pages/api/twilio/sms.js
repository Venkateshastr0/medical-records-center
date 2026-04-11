import { NextApiRequest, NextApiResponse } from 'next';
const twilioService = require('../../../lib/twilio');

export default async function handler(req, res) {
  try {
    const { type, recipient, message, patientName, appointmentTime, doctorName, prescriptionId, emergencyType, location, medicationName, dosage, time, testName, result } = req.body;
    
    let response;
    
    switch (type) {
      case 'appointment_reminder':
        response = await twilioService.sendAppointmentReminder(
          recipient, 
          patientName, 
          appointmentTime, 
          doctorName
        );
        break;
        
      case 'prescription_ready':
        response = await twilioService.sendPrescriptionReady(
          recipient, 
          patientName, 
          prescriptionId
        );
        break;
        
      case 'emergency_alert':
        response = await twilioService.sendEmergencyAlert(
          recipient, 
          patientName, 
          emergencyType, 
          location
        );
        break;
        
      case 'medication_reminder':
        response = await twilioService.sendMedicationReminder(
          recipient, 
          patientName, 
          medicationName, 
          dosage, 
          time
        );
        break;
        
      case 'lab_results':
        response = await twilioService.sendLabResultsNotification(
          recipient, 
          patientName, 
          testName, 
          result
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid SMS type' });
    }
    
    if (response.success) {
      res.status(200).json({ 
        success: true, 
        messageId: response.messageId || response.callSid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: response.error 
      });
    }
    
  } catch (error) {
    console.error('Twilio SMS API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
