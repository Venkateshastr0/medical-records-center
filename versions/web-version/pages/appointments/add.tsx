import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface AppointmentFormData {
  patient_id: string
  doctor_id: string
  appointment_date: string
  duration_minutes: number
  appointment_type: string
  status: string
  notes: string
  reason: string
  priority: string
}

export default function AddAppointmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    duration_minutes: 30,
    appointment_type: 'CONSULTATION',
    status: 'SCHEDULED',
    notes: '',
    reason: '',
    priority: 'NORMAL'
  })

  // Mock data - in real app, these would come from API
  const patients = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Robert Johnson' }
  ]

  const doctors = [
    { id: '1', name: 'Dr. Sarah Wilson' },
    { id: '2', name: 'Dr. Michael Brown' },
    { id: '3', name: 'Dr. Emily Davis' }
  ]

  const appointmentTypes = [
    { value: 'CONSULTATION', label: 'Consultation', duration: 30 },
    { value: 'FOLLOW_UP', label: 'Follow-up', duration: 20 },
    { value: 'EMERGENCY', label: 'Emergency', duration: 60 },
    { value: 'SURGERY', label: 'Surgery', duration: 120 },
    { value: 'LAB_TEST', label: 'Lab Test', duration: 15 },
    { value: 'IMAGING', label: 'Imaging', duration: 45 },
    { value: 'VACCINATION', label: 'Vaccination', duration: 15 }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'duration_minutes' ? parseInt(value) || 0 : value 
    }))
  }

  const handleAppointmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = appointmentTypes.find(type => type.value === e.target.value)
    setFormData(prev => ({ 
      ...prev, 
      appointment_type: e.target.value,
      duration_minutes: selectedType?.duration || 30
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await window.__TAURI__.invoke('create_appointment', {
        appointment: formData
      })

      if (response.success) {
        router.push('/appointments')
      } else {
        alert('Error creating appointment: ' + response.message)
      }
    } catch (error) {
      alert('Error creating appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/appointments')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'NORMAL': return 'bg-green-100 text-green-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <button
              onClick={() => router.push('/appointments')}
              className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Schedule Appointment
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Book a new patient appointment
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Appointment Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Patient *</label>
                    <select
                      name="patient_id"
                      required
                      className="form-input"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Doctor *</label>
                    <select
                      name="doctor_id"
                      required
                      className="form-input"
                      value={formData.doctor_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Appointment Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="appointment_date"
                      required
                      className="form-input"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Duration (minutes)</label>
                    <select
                      name="duration_minutes"
                      className="form-input"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Appointment Type *</label>
                    <select
                      name="appointment_type"
                      required
                      className="form-input"
                      value={formData.appointment_type}
                      onChange={handleAppointmentTypeChange}
                    >
                      {appointmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} ({type.duration} min)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      name="priority"
                      className="form-input"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Appointment Reason */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Appointment Reason
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Reason for Visit *</label>
                    <textarea
                      name="reason"
                      rows={3}
                      required
                      className="form-input"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="Describe the reason for this appointment..."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Additional Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-input"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PENDING">Pending</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      name="notes"
                      rows={4}
                      className="form-input"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes or special requirements..."
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Summary */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Appointment Summary
                </h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Patient:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {patients.find(p => p.id === formData.patient_id)?.name || 'Not selected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Doctor:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {doctors.find(d => d.id === formData.doctor_id)?.name || 'Not selected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {formData.appointment_date ? new Date(formData.appointment_date).toLocaleString() : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {formData.duration_minutes} minutes
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {appointmentTypes.find(t => t.value === formData.appointment_type)?.label}
                    </span>
                    <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="card-footer">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="spinner mr-2"></div>
                      Scheduling Appointment...
                    </div>
                  ) : (
                    'Schedule Appointment'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
