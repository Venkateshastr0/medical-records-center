const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const apiKey = process.env.TWILIO_API_KEY || 'SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const apiSecret = process.env.TWILIO_API_SECRET || 'your_api_secret';

// Initialize Twilio client
const client = twilio(accountSid, authToken);
const videoClient = twilio(apiKey, apiSecret, { accountSid });

class TwilioService {
  // Send SMS appointment reminder
  async sendAppointmentReminder(patientPhone, patientName, appointmentTime, doctorName) {
    try {
      const message = await client.messages.create({
        body: `Hi ${patientName}, this is a reminder for your appointment with Dr. ${doctorName} on ${appointmentTime}. Please arrive 15 minutes early.`,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: patientPhone
      });
      
      console.log('Appointment reminder sent:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send prescription ready notification
  async sendPrescriptionReady(patientPhone, patientName, prescriptionId) {
    try {
      const message = await client.messages.create({
        body: `Hi ${patientName}, your prescription #${prescriptionId} is ready for pickup at the pharmacy.`,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: patientPhone
      });
      
      console.log('Prescription ready notification sent:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending prescription notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send emergency alert to medical staff
  async sendEmergencyAlert(staffPhone, patientName, emergencyType, location) {
    try {
      const message = await client.messages.create({
        body: `🚨 EMERGENCY: Patient ${patientName} - ${emergencyType} at ${location}. Immediate response required.`,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: staffPhone
      });
      
      console.log('Emergency alert sent:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Create video room for telemedicine consultation
  async createVideoRoom(roomName, consultationType = 'consultation') {
    try {
      const room = await videoClient.video.rooms.create({
        uniqueName: roomName,
        type: consultationType === 'group' ? 'group' : 'peer-to-peer',
        recordParticipantsOnConnect: true,
        statusCallback: 'https://your-domain.com/api/twilio/status',
        statusCallbackMethod: 'POST'
      });
      
      console.log('Video room created:', room.sid);
      return { 
        success: true, 
        roomId: room.sid, 
        roomName: room.uniqueName 
      };
    } catch (error) {
      console.error('Error creating video room:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate video access token for patient/doctor
  async generateVideoToken(roomName, identity, role = 'participant') {
    try {
      const token = videoClient.video.tokens.create({
        identity: identity,
        room: roomName,
        grant: {
          room: {
            roomSid: roomName,
            role: role === 'host' ? 'host' : 'participant'
          }
        }
      });
      
      return { success: true, token: token.jwt };
    } catch (error) {
      console.error('Error generating video token:', error);
      return { success: false, error: error.message };
    }
  }

  // Make voice call to patient
  async makeVoiceCall(patientPhone, doctorPhone, callerId) {
    try {
      const call = await client.calls.create({
        url: `http://your-domain.com/api/twilio/call-handler?doctor=${doctorPhone}`,
        to: patientPhone,
        from: callerId || process.env.TWILIO_PHONE_NUMBER,
        method: 'GET',
        statusCallback: 'https://your-domain.com/api/twilio/call-status',
        statusCallbackMethod: 'POST'
      });
      
      console.log('Voice call initiated:', call.sid);
      return { success: true, callSid: call.sid };
    } catch (error) {
      console.error('Error making voice call:', error);
      return { success: false, error: error.message };
    }
  }

  // Send medication reminder
  async sendMedicationReminder(patientPhone, patientName, medicationName, dosage, time) {
    try {
      const message = await client.messages.create({
        body: `Hi ${patientName}, this is a reminder to take ${medicationName} (${dosage}) at ${time}.`,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: patientPhone
      });
      
      console.log('Medication reminder sent:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending medication reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send lab results notification
  async sendLabResultsNotification(patientPhone, patientName, testName, result) {
    try {
      const message = await client.messages.create({
        body: `Hi ${patientName}, your ${testName} results are ready. ${result}`,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: patientPhone
      });
      
      console.log('Lab results notification sent:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending lab results notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TwilioService();
