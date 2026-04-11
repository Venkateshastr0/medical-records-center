import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  UserIcon,
  BeakerIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface PrescriptionFormData {
  patient_id: string
  doctor_id: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  duration: string
  refills: number
  status: string
  notes: string
  prescribed_date: string
  indications: string
  contraindications: string
}

export default function AddPrescriptionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patient_id: '',
    doctor_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    route: 'ORAL',
    duration: '',
    refills: 0,
    status: 'ACTIVE',
    notes: '',
    prescribed_date: new Date().toISOString().split('T')[0],
    indications: '',
    contraindications: ''
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

  const commonMedications = [
    'Amoxicillin 500mg',
    'Lisinopril 10mg',
    'Metformin 500mg',
    'Atorvastatin 20mg',
    'Amlodipine 5mg',
    'Metoprolol 25mg',
    'Omeprazole 20mg',
    'Losartan 50mg',
    'Gabapentin 300mg',
    'Sertraline 50mg'
  ]

  const frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ]

  const routes = [
    { value: 'ORAL', label: 'Oral (by mouth)' },
    { value: 'IV', label: 'Intravenous (IV)' },
    { value: 'IM', label: 'Intramuscular (IM)' },
    { value: 'SC', label: 'Subcutaneous (SC)' },
    { value: 'TOPICAL', label: 'Topical' },
    { value: 'INHALATION', label: 'Inhalation' },
    { value: 'NASAL', label: 'Nasal' },
    { value: 'OPHTHALMIC', label: 'Ophthalmic (eye)' },
    { value: 'OTIC', label: 'Otic (ear)' },
    { value: 'RECTAL', label: 'Rectal' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'refills' ? parseInt(value) || 0 : value 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await window.__TAURI__.invoke('create_prescription', {
        prescription: formData
      })

      if (response.success) {
        router.push('/prescriptions')
      } else {
        alert('Error creating prescription: ' + response.message)
      }
    } catch (error) {
      alert('Error creating prescription. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/prescriptions')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <button
              onClick={() => router.push('/prescriptions')}
              className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Add Prescription
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create a new prescription for a patient
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Prescription Details
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
                    <label className="form-label">Prescribed Date</label>
                    <input
                      type="date"
                      name="prescribed_date"
                      className="form-input"
                      value={formData.prescribed_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-input"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medication Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Medication Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Medication Name *</label>
                    <input
                      type="text"
                      name="medication_name"
                      required
                      list="medications"
                      className="form-input"
                      value={formData.medication_name}
                      onChange={handleInputChange}
                      placeholder="Enter medication name..."
                    />
                    <datalist id="medications">
                      {commonMedications.map((med) => (
                        <option key={med} value={med} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Dosage *</label>
                      <input
                        type="text"
                        name="dosage"
                        required
                        className="form-input"
                        value={formData.dosage}
                        onChange={handleInputChange}
                        placeholder="e.g., 500mg, 1 tablet, 5ml"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Frequency *</label>
                      <select
                        name="frequency"
                        required
                        className="form-input"
                        value={formData.frequency}
                        onChange={handleInputChange}
                      >
                        <option value="">Select frequency</option>
                        {frequencies.map((freq) => (
                          <option key={freq} value={freq}>
                            {freq}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">Route *</label>
                      <select
                        name="route"
                        required
                        className="form-input"
                        value={formData.route}
                        onChange={handleInputChange}
                      >
                        {routes.map((route) => (
                          <option key={route.value} value={route.value}>
                            {route.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">Duration *</label>
                      <input
                        type="text"
                        name="duration"
                        required
                        className="form-input"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="e.g., 7 days, 2 weeks, 1 month"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Refills</label>
                      <input
                        type="number"
                        name="refills"
                        min="0"
                        max="12"
                        className="form-input"
                        value={formData.refills}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Clinical Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Indications</label>
                    <textarea
                      name="indications"
                      rows={3}
                      className="form-input"
                      value={formData.indications}
                      onChange={handleInputChange}
                      placeholder="Reason for prescribing this medication..."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Contraindications</label>
                    <textarea
                      name="contraindications"
                      rows={3}
                      className="form-input"
                      value={formData.contraindications}
                      onChange={handleInputChange}
                      placeholder="Any contraindications or warnings..."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Additional Information
                </h2>
                
                <div>
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    name="notes"
                    rows={4}
                    className="form-input"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional instructions or notes..."
                  />
                </div>
              </div>

              {/* Prescription Summary */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Prescription Summary
                </h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <BeakerIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.medication_name || 'Medication not specified'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.dosage || 'Not specified'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.frequency || 'Not specified'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Route:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {routes.find(r => r.value === formData.route)?.label || 'Not specified'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.duration || 'Not specified'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Refills:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.refills}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {patients.find(p => p.id === formData.patient_id)?.name || 'Not selected'}
                      </span>
                    </div>
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
                      Creating Prescription...
                    </div>
                  ) : (
                    'Create Prescription'
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
