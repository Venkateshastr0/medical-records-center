import { useState, useEffect } from 'react'
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
  quantity: string
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

type MedicationType = 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'UNKNOWN'
type FrequencyMode = 'time-based' | 'interval-based'

interface MedicationMetadata {
  type: MedicationType
  defaultRoute: string
  supportsIntervalFrequency: boolean
}

export default function AddPrescriptionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMedications, setShowMedications] = useState(false)
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patient_id: '',
    doctor_id: '',
    medication_name: '',
    dosage: '',
    quantity: '',
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

  const [quantityEdited, setQuantityEdited] = useState(false)
  const [frequencyEdited, setFrequencyEdited] = useState(false)
  const [durationEdited, setDurationEdited] = useState(false)
  const [medicationType, setMedicationType] = useState<MedicationType>('TABLET' as MedicationType)
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>('time-based')
  const [intervalHours, setIntervalHours] = useState('')

  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const pRes = await fetch('/api/patients?limit=100');
        const pData = await pRes.json();
        if (pData.data) {
          setPatients(pData.data.map((p: any) => ({
            id: p.patient_id || p.id,
            name: `${p.first_name} ${p.last_name}`
          })));
        }

        const dRes = await fetch('/api/doctors');
        const dData = await dRes.json();
        if (dData.data) {
          setDoctors(dData.data);
        }
      } catch (err) {
        console.error('Failed to fetch patients/doctors', err);
      }
    };
    fetchSelectOptions();
  }, [])

  const medicationMetadata: Record<string, MedicationMetadata> = {
    'amoxicillin': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'lisinopril': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'metformin': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'atorvastatin': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'amlodipine': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'metoprolol': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'omeprazole': { type: 'CAPSULE', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'losartan': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'gabapentin': { type: 'CAPSULE', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'sertraline': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'azithromycin': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'ibuprofen': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'hydrochlorothiazide': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'albuterol': { type: 'INHALER', defaultRoute: 'INHALATION', supportsIntervalFrequency: false },
    'levothyroxine': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'pantoprazole': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'citalopram': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'trazodone': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'montelukast': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'fluticasone': { type: 'INHALER', defaultRoute: 'INHALATION', supportsIntervalFrequency: false },
    'meloxicam': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'insulin': { type: 'INJECTION', defaultRoute: 'SC', supportsIntervalFrequency: true },
    'morphine': { type: 'INJECTION', defaultRoute: 'IV', supportsIntervalFrequency: true },
    'fentanyl': { type: 'INJECTION', defaultRoute: 'IV', supportsIntervalFrequency: true },
    'heparin': { type: 'INJECTION', defaultRoute: 'SC', supportsIntervalFrequency: true },
    'warfarin': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'acetaminophen': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'prednisone': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'hydrocortisone': { type: 'TABLET', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'syrup': { type: 'SYRUP', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'liquid': { type: 'SYRUP', defaultRoute: 'ORAL', supportsIntervalFrequency: false },
    'solution': { type: 'SYRUP', defaultRoute: 'ORAL', supportsIntervalFrequency: false }
  }

  const detectMedicationType = (medicationName: string): MedicationType => {
    const name = medicationName.toLowerCase()
    
    if (name.includes('syrup') || name.includes('liquid') || name.includes('solution')) {
      return 'SYRUP'
    }
    if (name.includes('inhaler') || name.includes('inhalation') || name.includes('puffer')) {
      return 'INHALER'
    }
    if (name.includes('injection') || name.includes('inject') || name.includes('iv') || name.includes('im') || name.includes('sc')) {
      return 'INJECTION'
    }
    if (name.includes('capsule') || name.includes('cap')) {
      return 'CAPSULE'
    }
    
    for (const [key, metadata] of Object.entries(medicationMetadata)) {
      if (name.includes(key)) {
        return metadata.type as MedicationType
      }
    }
    
    return 'TABLET'
  }

  const getDosesPerDay = (frequency: string): number => {
    if (!frequency) return 0
    
    const timeOptions = ['Morning', 'Afternoon', 'Night']
    const selectedTimes = frequency.split(', ').filter(Boolean)
    
    if (frequencyMode === 'time-based') {
      return selectedTimes.length
    } else {
      const hours = parseInt(intervalHours)
      if (hours && hours > 0) {
        return Math.round(24 / hours)
      }
    }
    
    return 0
  }

  const parseDuration = (duration: string): number => {
    if (!duration) return 0
    
    const numericMatch = duration.match(/^(\d+)/)
    if (numericMatch) {
      const value = parseInt(numericMatch[1])
      const unit = duration.toLowerCase()
      
      if (unit.includes('week')) return value * 7
      if (unit.includes('month')) return value * 30
      if (unit.includes('year')) return value * 365
      return value
    }
    
    return 0
  }

  const calculateQuantity = (frequency: string, duration: string): string => {
    const dosesPerDay = getDosesPerDay(frequency)
    const durationDays = parseDuration(duration)
    
    if (dosesPerDay > 0 && durationDays > 0) {
      return (dosesPerDay * durationDays).toString()
    }
    
    return ''
  }

  const calculateDuration = (frequency: string, quantity: string): string => {
    const dosesPerDay = getDosesPerDay(frequency)
    const quantityNum = parseInt(quantity)
    
    if (dosesPerDay > 0 && quantityNum > 0) {
      const days = Math.round(quantityNum / dosesPerDay)
      return `${days} days`
    }
    
    return ''
  }

  const normalizeDuration = (duration: string): string => {
    const numericMatch = duration.match(/^(\d+)$/)
    if (numericMatch) {
      return `${numericMatch[1]} days`
    }
    return duration
  }

  useEffect(() => {
    if (frequencyEdited && formData.duration && !quantityEdited) {
      const calculatedQuantity = calculateQuantity(formData.frequency, formData.duration)
      if (calculatedQuantity) {
        setFormData(prev => ({ ...prev, quantity: calculatedQuantity }))
      }
    }
  }, [formData.frequency, formData.duration, frequencyEdited, durationEdited])

  useEffect(() => {
    if (frequencyEdited && formData.quantity && !durationEdited) {
      const calculatedDuration = calculateDuration(formData.frequency, formData.quantity)
      if (calculatedDuration) {
        setFormData(prev => ({ ...prev, duration: calculatedDuration }))
      }
    }
  }, [formData.frequency, formData.quantity, frequencyEdited, quantityEdited])

  useEffect(() => {
    const detectedType = detectMedicationType(formData.medication_name)
    setMedicationType(detectedType)
    
    const medName = formData.medication_name.toLowerCase()
    for (const [key, metadata] of Object.entries(medicationMetadata)) {
      if (medName.includes(key)) {
        setFormData(prev => ({ ...prev, route: metadata.defaultRoute }))
        break
      }
    }
  }, [formData.medication_name])

  useEffect(() => {
    if (formData.route === 'IV' || formData.route === 'IM' || formData.route === 'SC') {
      setFrequencyMode('interval-based')
    } else {
      setFrequencyMode('time-based')
    }
  }, [formData.route])

  const commonMedications = [
    'Amoxicillin 500mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Atorvastatin 20mg',
    'Amlodipine 5mg', 'Metoprolol 25mg', 'Omeprazole 20mg', 'Losartan 50mg',
    'Gabapentin 300mg', 'Sertraline 50mg', 'Azithromycin 250mg', 'Ibuprofen 400mg',
    'Hydrochlorothiazide 25mg', 'Albuterol 90mcg Inhaler', 'Levothyroxine 50mcg',
    'Pantoprazole 40mg', 'Citalopram 20mg', 'Trazodone 50mg', 'Montelukast 10mg',
    'Fluticasone 50mcg', 'Amoxicillin/Clavulanate 875mg/125mg', 'Meloxicam 15mg',
    'Insulin 100U/mL', 'Morphine 10mg/mL', 'Fentanyl 25mcg/hour', 'Heparin 5000U',
    'Acetaminophen 500mg', 'Prednisone 5mg', 'Hydrocortisone 10mg', 'Warfarin 5mg'
  ].sort()

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
    
    if (name === 'quantity') {
      setQuantityEdited(true)
      setFrequencyEdited(false)
      setDurationEdited(false)
    } else if (name === 'frequency') {
      setFrequencyEdited(true)
      setQuantityEdited(false)
      setDurationEdited(false)
    } else if (name === 'duration') {
      const normalizedDuration = normalizeDuration(value)
      setDurationEdited(true)
      setFrequencyEdited(false)
      setQuantityEdited(false)
      setFormData(prev => ({ 
        ...prev, 
        duration: normalizedDuration
      }))
      return
    } else if (name === 'route') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        frequency: ''
      }))
      return
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'refills' ? parseInt(value) || 0 : value 
    }))
  }

  const handleIntervalHoursChange = (value: string) => {
    setIntervalHours(value)
    const hours = parseInt(value)
    if (hours && hours > 0) {
      const frequencyText = `Every ${hours} hours`
      setFormData(prev => ({ ...prev, frequency: frequencyText }))
      setFrequencyEdited(true)
    }
  }

  const timeOptions = ['Morning', 'Afternoon', 'Night']
  const selectedTimes = formData.frequency ? formData.frequency.split(', ').filter(Boolean) : []

  const handleTimeToggle = (time: string) => {
    let newTimes = [...selectedTimes]
    if (newTimes.includes(time)) {
      newTimes = newTimes.filter(t => t !== time)
    } else {
      newTimes.push(time)
    }
    newTimes = timeOptions.filter(t => newTimes.includes(t))
    setFormData(prev => ({ ...prev, frequency: newTimes.join(', ') }))
    setFrequencyEdited(true)
    setQuantityEdited(false)
    setDurationEdited(false)
  }

  const frequencyPresets = [
    { label: 'OD', description: 'Once Daily', times: ['Morning'] },
    { label: 'BD', description: 'Twice Daily', times: ['Morning', 'Night'] },
    { label: 'TDS', description: 'Three Times Daily', times: ['Morning', 'Afternoon', 'Night'] }
  ]

  const handlePresetClick = (preset: typeof frequencyPresets[0]) => {
    setFormData(prev => ({ ...prev, frequency: preset.times.join(', ') }))
    setFrequencyEdited(true)
    setQuantityEdited(false)
    setDurationEdited(false)
  }

  const validateForm = (): boolean => {
    if (!formData.patient_id || !formData.doctor_id || !formData.medication_name || !formData.dosage) {
      alert('Please fill in all required fields')
      return false
    }
    
    if (medicationType !== 'SYRUP' && !formData.quantity) {
      alert('Quantity is required for solid medications')
      return false
    }
    
    if (!formData.frequency) {
      alert('Frequency is required')
      return false
    }
    
    if (!formData.duration) {
      alert('Duration is required')
      return false
    }
    
    if ((formData.route === 'IV' || formData.route === 'IM' || formData.route === 'SC') && frequencyMode === 'time-based') {
      alert('Time-based frequency is not compatible with IV/IM/SC routes. Please use interval-based frequency.')
      return false
    }
    
    if (frequencyMode === 'interval-based' && (!intervalHours || parseInt(intervalHours) < 1 || parseInt(intervalHours) > 24)) {
      alert('Please enter a valid interval between 1 and 24 hours')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          medication_name: formData.medication_name,
          dosage: formData.dosage,
          quantity: formData.quantity,
          frequency: formData.frequency,
          route: formData.route,
          duration: formData.duration,
          instructions: formData.notes,
          medications_json: JSON.stringify([{
             name: formData.medication_name,
             dosage: formData.dosage,
             quantity: formData.quantity,
             freq: formData.frequency,
             dur: formData.duration,
             route: formData.route
          }])
        })
      });

      if (response.ok) {
        router.push('/prescriptions')
      } else {
        const errData = await response.json();
        alert('Error creating prescription: ' + (errData.error || 'Unknown error'))
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
          <form onSubmit={handleSubmit} className="card !overflow-visible">
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
                    <div className="relative">
                      <input
                        type="text"
                        name="medication_name"
                        required
                        autoComplete="off"
                        className="form-input"
                        value={formData.medication_name}
                        onChange={handleInputChange}
                        onFocus={() => setShowMedications(true)}
                        onBlur={() => setTimeout(() => setShowMedications(false), 250)}
                        placeholder="Enter medication name..."
                      />
                      {showMedications && (
                        <ul className="absolute z-50 left-0 top-full w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-auto shadow-xl slide-down-anim">
                          {commonMedications
                            .filter(med => med.toLowerCase().includes(formData.medication_name.toLowerCase()))
                            .map(med => (
                              <li
                                key={med}
                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, medication_name: med }))
                                  setShowMedications(false)
                                }}
                              >
                                {med}
                              </li>
                            ))}
                          {commonMedications.filter(med => med.toLowerCase().includes(formData.medication_name.toLowerCase())).length === 0 && (
                            <li className="px-4 py-3 text-sm text-gray-500 italic">No exact matches (will save as custom)</li>
                          )}
                        </ul>
                      )}
                    </div>
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
                    
                    {(medicationType as MedicationType) !== 'SYRUP' && (
                      <div>
                        <label className="form-label">
                          Quantity {(medicationType as MedicationType) === 'TABLET' || (medicationType as MedicationType) === 'CAPSULE' ? '(total units)' : '(total containers)'} *
                        </label>
                        <input
                          type="text"
                          name="quantity"
                          required={(medicationType as MedicationType) !== 'SYRUP'}
                          className="form-input"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder={(medicationType as MedicationType) === 'TABLET' || (medicationType as MedicationType) === 'CAPSULE' ? 'e.g., 21 tablets' : 'e.g., 2 bottles'}
                          disabled={(medicationType as MedicationType) === 'SYRUP'}
                        />
                        {(medicationType as MedicationType) === 'SYRUP' && (
                          <p className="text-xs text-gray-500 mt-1">Quantity is not applicable for liquid medications</p>
                        )}
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <label className="form-label">Frequency *</label>
                      
                      {frequencyMode === 'time-based' ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-4">
                            {timeOptions.map((time) => (
                              <div key={time} className="checkbox-wrapper-53">
                                <label className="container">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedTimes.includes(time)}
                                    onChange={() => handleTimeToggle(time)}
                                  />
                                  <div className="checkmark"></div>
                                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{time}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-500">Quick presets:</span>
                            {frequencyPresets.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                className="px-3 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                                title={preset.description}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={intervalHours}
                              onChange={(e) => handleIntervalHoursChange(e.target.value)}
                              className="form-input w-24"
                              placeholder="6"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">hours interval</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {intervalHours ? `Approximately ${Math.round(24 / parseInt(intervalHours))} doses per day` : 'Enter hours between doses'}
                          </p>
                        </div>
                      )}
                      
                      {formData.frequency && (
                        <p className="text-xs text-gray-500 mt-2">
                          Current: {formData.frequency} ({getDosesPerDay(formData.frequency)} doses/day)
                        </p>
                      )}
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
                      <p className="text-xs text-gray-500 mt-1">
                        Detected medication type: <span className="font-medium">{medicationType as MedicationType}</span>
                      </p>
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
                        placeholder="e.g., 7, 7 days, 2 weeks, 1 month"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter number or full duration (e.g., "7" becomes "7 days")</p>
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
                    
                    {(medicationType as MedicationType) !== 'SYRUP' && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.quantity || 'Not specified'}
                        </span>
                      </div>
                    )}
                    
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
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Medication Type:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {medicationType as MedicationType}
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
      <style>{`
        .slide-down-anim {
          animation: slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: scaleY(0.9) translateY(-4px); }
          to { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        
        .checkbox-wrapper-53 input[type="checkbox"] {
          visibility: hidden;
          display: none;
        }

        .checkbox-wrapper-53 .container {
          display: flex;
          align-items: center;
          position: relative;
          cursor: pointer;
          font-size: 16px;
          user-select: none;
        }

        .checkbox-wrapper-53 .checkmark {
          position: relative;
          top: 0;
          left: 0;
          height: 1.3em;
          width: 1.3em;
          background-color: #ccc;
          border-radius: 100%;
          background: #e8e8e8;
          box-shadow: 3px 3px 5px #c5c5c5,
                      -3px -3px 5px #ffffff;
          transition: all 0.3s ease;
        }

        .checkbox-wrapper-53 .container input:checked ~ .checkmark {
          box-shadow: inset 3px 3px 5px #c5c5c5,
                      inset -3px -3px 5px #ffffff;
          background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
        }

        .checkbox-wrapper-53 .checkmark:after {
          content: "";
          position: absolute;
          opacity: 0;
        }

        .checkbox-wrapper-53 .container input:checked ~ .checkmark:after {
          opacity: 1;
        }

        .checkbox-wrapper-53 .container .checkmark:after {
          left: 0.45em;
          top: 0.25em;
          width: 0.25em;
          height: 0.5em;
          border: solid #4a5568;
          border-width: 0 0.15em 0.15em 0;
          transform: rotate(45deg);
          transition: all 250ms;
        }
        
        @media (prefers-color-scheme: dark) {
          .checkbox-wrapper-53 .checkmark {
            background: #2d3748;
            box-shadow: 3px 3px 5px #1a202c,
                        -3px -3px 5px #4a5568;
          }
          
          .checkbox-wrapper-53 .container input:checked ~ .checkmark {
            box-shadow: inset 3px 3px 5px #1a202c,
                        inset -3px -3px 5px #4a5568;
            background: linear-gradient(145deg, #2d3748, #1a202c);
          }
          
          .checkbox-wrapper-53 .container .checkmark:after {
            border-color: #e2e8f0;
          }
        }
      `}</style>
    </div>
  )
}
