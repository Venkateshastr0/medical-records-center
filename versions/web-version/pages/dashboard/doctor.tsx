import { useState } from 'react'
import Layout from '../../components/Layout'
import TelemedicineConsultation from '../../components/TelemedicineConsultation'
import Head from 'next/head'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'

export default function DoctorDashboard() {
  const router = useRouter()
  const [showTelemedicine, setShowTelemedicine] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Get today's appointments
  const { data: appointments } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      return data.appointments;
    }
  });

  // Get patients
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      return data.patients;
    }
  });

  // Get medical records
  const { data: medicalRecords } = useQuery({
    queryKey: ['medical-records'],
    queryFn: async () => {
      const response = await fetch('/api/medical-records');
      if (!response.ok) throw new Error('Failed to fetch medical records');
      const data = await response.json();
      return data.records;
    }
  });

  const startVideoConsultation = (patient) => {
    setSelectedPatient(patient);
    setShowTelemedicine(true);
  };

  const endConsultation = () => {
    setShowTelemedicine(false);
    setSelectedPatient(null);
  };

  const sendAppointmentReminder = async (appointment) => {
    try {
      const response = await fetch('/api/twilio/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'appointment_reminder',
          recipient: appointment.phone,
          patientName: `${appointment.first_name} ${appointment.last_name}`,
          appointmentTime: new Date(appointment.appointment_date).toLocaleString(),
          doctorName: 'Dr. Smith' // TODO: Get actual doctor name
        })
      });
      
      if (response.ok) {
        alert('Appointment reminder sent successfully!');
      }
    } catch (error) {
      alert('Failed to send reminder');
    }
  };

  const sendEmergencyAlert = async (patient) => {
    try {
      const response = await fetch('/api/twilio/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'emergency_alert',
          recipient: '+1234567890', // TODO: Get emergency contact
          patientName: `${patient.first_name} ${patient.last_name}`,
          emergencyType: 'Critical Condition',
          location: 'Emergency Room'
        })
      });
      
      if (response.ok) {
        alert('Emergency alert sent to medical staff!');
      }
    } catch (error) {
      alert('Failed to send emergency alert');
    }
  };

  if (showTelemedicine && selectedPatient) {
    const roomName = `consultation-${Date.now()}`;
    const userName = 'Dr. Smith'; // TODO: Get actual user name
    
    return (
      <TelemedicineConsultation
        roomName={roomName}
        userName={userName}
        userRole="doctor"
        onConsultationEnd={endConsultation}
      />
    );
  }

  const todayStats = {
    totalAppointments: appointments?.length || 0,
    completedAppointments: appointments?.filter(a => a.status === 'Completed').length || 0,
    pendingRecords: medicalRecords?.filter(r => r.status === 'pending').length || 0,
    totalPatients: patients?.length || 0
  };

  return (
    <>
      <Head>
        <title>Doctor Dashboard - Medical Records Center</title>
      </Head>

      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-gray-600 mt-2">Patient care and telemedicine management</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="material-symbols-outlined text-blue-600">calendar_today</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.completedAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="material-symbols-outlined text-purple-600">medical_information</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Records</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.pendingRecords}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-full">
                  <span className="material-symbols-outlined text-orange-600">groups</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.totalPatients}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
              <span className="material-symbols-outlined mr-2">video_call</span>
              Start Video Consultation
            </button>
            
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center">
              <span className="material-symbols-outlined mr-2">add_chart</span>
              Add Medical Record
            </button>
            
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center">
              <span className="material-symbols-outlined mr-2">medication</span>
              Write Prescription
            </button>
            
            <button className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center">
              <span className="material-symbols-outlined mr-2">emergency</span>
              Emergency Alert
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Appointments</h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments?.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.first_name} {appointment.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.appointment_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => startVideoConsultation(appointment)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Video Call
                          </button>
                          <button 
                            onClick={() => sendAppointmentReminder(appointment)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Remind
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {patients?.slice(0, 5).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-gray-600">ID: {patient.patient_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startVideoConsultation(patient)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Video Call
                      </button>
                      <button 
                        onClick={() => sendEmergencyAlert(patient)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Emergency
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
