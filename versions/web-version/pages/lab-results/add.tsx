import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  UserIcon,
  BeakerIcon,
  CalendarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface LabResultFormData {
  patient_id: string
  doctor_id: string
  test_name: string
  test_category: string
  test_date: string
  result_date: string
  result_value: string
  unit: string
  reference_range: string
  abnormal_flag: string
  status: string
  interpretation: string
  notes: string
}

export default function AddLabResultPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<LabResultFormData>({
    patient_id: '',
    doctor_id: '',
    test_name: '',
    test_category: 'Blood Work',
    test_date: new Date().toISOString().split('T')[0],
    result_date: new Date().toISOString().split('T')[0],
    result_value: '',
    unit: '',
    reference_range: '',
    abnormal_flag: 'NORMAL',
    status: 'COMPLETED',
    interpretation: '',
    notes: ''
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

  const testCategories = [
    'Blood Work',
    'Urinalysis',
    'Imaging',
    'Pathology',
    'Cardiology',
    'Pulmonary',
    'Gastroenterology',
    'Endocrinology',
    'Neurology',
    'Genetic Testing'
  ]

  const commonTests = {
    'Blood Work': [
      'Complete Blood Count (CBC)',
      'Comprehensive Metabolic Panel (CMP)',
      'Lipid Panel',
      'Hemoglobin A1c',
      'Thyroid Panel',
      'Liver Function Tests',
      'Kidney Function Tests',
      'Electrolyte Panel'
    ],
    'Urinalysis': [
      'Complete Urinalysis',
      'Urine Culture',
      'Pregnancy Test',
      'Drug Screen',
      'Microalbumin/Creatinine Ratio'
    ],
    'Imaging': [
      'Chest X-Ray',
      'Abdominal X-Ray',
      'CT Scan',
      'MRI',
      'Ultrasound',
      'Mammogram'
    ],
    'Cardiology': [
      'ECG/EKG',
      'Echocardiogram',
      'Stress Test',
      'Holter Monitor',
      'Cardiac Catheterization'
    ]
  }

  const abnormalFlags = [
    { value: 'NORMAL', label: 'Normal', color: 'bg-green-100 text-green-800' },
    { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-800' },
    { value: 'LOW', label: 'Low', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 'BORDERLINE', label: 'Borderline', color: 'bg-orange-100 text-orange-800' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      test_category: e.target.value,
      test_name: '' // Reset test name when category changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await window.__TAURI__.invoke('create_lab_result', {
        lab_result: formData
      })

      if (response.success) {
        router.push('/lab-results')
      } else {
        alert('Error creating lab result: ' + response.message)
      }
    } catch (error) {
      alert('Error creating lab result. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/lab-results')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <button
              onClick={() => router.push('/lab-results')}
              className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Add Lab Result
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter laboratory test results for a patient
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card">
            <div className="card-body">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Test Information
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
                    <label className="form-label">Test Category *</label>
                    <select
                      name="test_category"
                      required
                      className="form-input"
                      value={formData.test_category}
                      onChange={handleCategoryChange}
                    >
                      {testCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Test Name *</label>
                    <select
                      name="test_name"
                      required
                      className="form-input"
                      value={formData.test_name}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Test</option>
                      {commonTests[formData.test_category as keyof typeof commonTests]?.map((test) => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Test Date *</label>
                    <input
                      type="date"
                      name="test_date"
                      required
                      className="form-input"
                      value={formData.test_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Result Date *</label>
                    <input
                      type="date"
                      name="result_date"
                      required
                      className="form-input"
                      value={formData.result_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Test Results
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Result Value *</label>
                    <input
                      type="text"
                      name="result_value"
                      required
                      className="form-input"
                      value={formData.result_value}
                      onChange={handleInputChange}
                      placeholder="e.g., 120/80, 5.2, Positive, Negative"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      className="form-input"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., mg/dL, mmHg, cells/μL"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Reference Range</label>
                    <input
                      type="text"
                      name="reference_range"
                      className="form-input"
                      value={formData.reference_range}
                      onChange={handleInputChange}
                      placeholder="e.g., 70-100 mg/dL, <120/80 mmHg"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Abnormal Flag</label>
                    <select
                      name="abnormal_flag"
                      className="form-input"
                      value={formData.abnormal_flag}
                      onChange={handleInputChange}
                    >
                      {abnormalFlags.map((flag) => (
                        <option key={flag.value} value={flag.value}>
                          {flag.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-input"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="PENDING">Pending</option>
                      <option value="REVIEW">Under Review</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clinical Interpretation */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Clinical Interpretation
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Interpretation</label>
                    <textarea
                      name="interpretation"
                      rows={4}
                      className="form-input"
                      value={formData.interpretation}
                      onChange={handleInputChange}
                      placeholder="Clinical interpretation of the test results..."
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      name="notes"
                      rows={4}
                      className="form-input"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes or observations..."
                    />
                  </div>
                </div>
              </div>

              {/* Result Summary */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  Result Summary
                </h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <BeakerIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.test_name || 'Test not specified'}
                    </span>
                    <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded ${
                      abnormalFlags.find(f => f.value === formData.abnormal_flag)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {abnormalFlags.find(f => f.value === formData.abnormal_flag)?.label || 'Normal'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Result:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.result_value || 'Not specified'}
                        {formData.unit && ` ${formData.unit}`}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reference Range:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.reference_range || 'Not specified'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Test Date:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.test_date ? new Date(formData.test_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Result Date:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.result_date ? new Date(formData.result_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {patients.find(p => p.id === formData.patient_id)?.name || 'Not selected'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {doctors.find(d => d.id === formData.doctor_id)?.name || 'Not selected'}
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
                      Adding Lab Result...
                    </div>
                  ) : (
                    'Add Lab Result'
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
