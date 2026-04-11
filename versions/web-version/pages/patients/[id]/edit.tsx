import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  blood_type: string
  allergies: string
  medical_history: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_provider: string
  insurance_policy_number: string
}

interface PatientFormData {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  blood_type: string
  allergies: string
  medical_history: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_provider: string
  insurance_policy_number: string
}

export default function EditPatientPage() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_patient', { id })
      return response.data
    },
    enabled: !!id
  })

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    insurance_provider: '',
    insurance_policy_number: ''
  })

  // Update form data when patient data is loaded
  useState(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        city: patient.city || '',
        state: patient.state || '',
        zip_code: patient.zip_code || '',
        country: patient.country || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies || '',
        medical_history: patient.medical_history || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_policy_number: patient.insurance_policy_number || ''
      })
    }
  })

  const updatePatientMutation = useMutation({
    mutationFn: async (data: { id: string; patient: PatientFormData }) => {
      return await window.__TAURI__.invoke('update_patient', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patient'])
      queryClient.invalidateQueries(['patients'])
      router.push(`/patients/${id}`)
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePatientMutation.mutateAsync({
        id: id as string,
        patient: formData
      })
    } catch (error) {
      alert('Error updating patient. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/patients/${id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Patient not found or error loading patient data.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Edit Patient: {patient.first_name} {patient.last_name}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Update patient information and medical records
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
              {/* Personal Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      className="form-input"
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      className="form-input"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      required
                      className="form-input"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Gender *</label>
                    <select
                      name="gender"
                      required
                      className="form-input"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-input"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-input"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-input"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">ZIP Code</label>
                    <input
                      type="text"
                      name="zip_code"
                      className="form-input"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      name="country"
                      className="form-input"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Medical Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Blood Type</label>
                    <select
                      name="blood_type"
                      className="form-input"
                      value={formData.blood_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Allergies</label>
                    <textarea
                      name="allergies"
                      rows={3}
                      className="form-input"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      placeholder="Enter any known allergies..."
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Medical History</label>
                    <textarea
                      name="medical_history"
                      rows={4}
                      className="form-input"
                      value={formData.medical_history}
                      onChange={handleInputChange}
                      placeholder="Enter relevant medical history..."
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Emergency Contact
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      className="form-input"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      className="form-input"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Insurance Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Insurance Provider</label>
                    <input
                      type="text"
                      name="insurance_provider"
                      className="form-input"
                      value={formData.insurance_provider}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Policy Number</label>
                    <input
                      type="text"
                      name="insurance_policy_number"
                      className="form-input"
                      value={formData.insurance_policy_number}
                      onChange={handleInputChange}
                    />
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
                      Updating Patient...
                    </div>
                  ) : (
                    'Update Patient'
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
