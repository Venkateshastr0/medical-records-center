import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

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

export default function AddPatientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('Draft auto-saved')

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '', last_name: '', date_of_birth: '', gender: '',
    phone: '', email: '', address: '', city: '', state: '', zip_code: '', country: 'India',
    blood_type: '', allergies: '', medical_history: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    insurance_provider: '', insurance_policy_number: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('patientForm')
    if (saved) setFormData(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('patientForm', JSON.stringify(formData))
  }, [formData])

  const handleInputChange = (e: any) => {
    setSaveStatus('Saving…')
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setTimeout(() => setSaveStatus('Draft auto-saved'), 800)
  }

  const validateForm = () => {
    if (!formData.first_name.trim()) return 'First name is required.'
    if (!formData.last_name.trim()) return 'Last name is required.'
    if (!formData.date_of_birth) return 'Date of birth is required.'
    if (!formData.gender) return 'Gender is required.'
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) return 'Invalid email format.'
    if (formData.phone && formData.phone.length < 10) return 'Phone number must be at least 10 digits.'
    return null
  }

  const calculateAge = (dob: string) => {
    if (!dob) return ''
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const clearForm = () => {
    setFormData({
      first_name: '', last_name: '', date_of_birth: '', gender: '',
      phone: '', email: '', address: '', city: '', state: '', zip_code: '', country: 'India',
      blood_type: '', allergies: '', medical_history: '',
      emergency_contact_name: '', emergency_contact_phone: '',
      insurance_provider: '', insurance_policy_number: ''
    })
    setError('')
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (response.ok) {
        localStorage.removeItem('patientForm')
        router.push('/patients')
      } else {
        setError(data.error || 'Failed to create patient')
        setIsSubmitting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Layout title="Add New Patient" subtitle="Register a new patient record">
      <style>{`
        .add-page { padding: 1.5rem; max-width: 820px; margin: 0 auto; font-family: var(--font-sans); color: #f3f4f6; }
        .add-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .add-page-title { font-size: 20px; font-weight: 500; color: #f9fafb; }
        .add-page-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }
        .add-section { border: 1px solid #374151; border-radius: 8px; margin-bottom: 14px; overflow: hidden; background: #111827; }
        .add-sec-head { padding: 11px 16px; background: #1f2937; border-bottom: 1px solid #374151; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; color: #f3f4f6; }
        .add-sec-body { padding: 16px; display: grid; gap: 12px; }
        .add-g2 { grid-template-columns: 1fr 1fr; }
        .add-g1 { grid-template-columns: 1fr; }
        @media (max-width: 600px) { .add-g2 { grid-template-columns: 1fr; } }
        .add-field label { display: block; font-size: 11px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; }
        .add-field input, .add-field select, .add-field textarea { width: 100%; padding: 8px 11px; border: 1px solid #4b5563; border-radius: 6px; font-size: 13px; background: #1f2937; color: #f3f4f6; outline: none; }
        .add-field input:focus, .add-field select:focus, .add-field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
        .add-field textarea { resize: vertical; min-height: 76px; }
        .add-age-hint { font-size: 12px; color: #9ca3af; margin-top: 5px; }
        .add-err-banner { font-size: 13px; color: #fca5a5; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
        .add-form-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 6px; }
        .add-autosave { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 5px; }
        .add-saved-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
        .add-actions { display: flex; gap: 8px; }
        .add-btn { padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; transition: background .12s; }
        .add-btn:hover { background: #374151; }
        .add-btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .add-btn.primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
        .add-btn:disabled { opacity: .5; cursor: not-allowed; }
        .add-required-note { font-size: 12px; color: #9ca3af; margin-bottom: 12px; }
      `}</style>

      <div className="add-page">
        <div className="add-topbar">
          <div>
            <div className="add-page-title">Add new patient</div>
            <div className="add-page-sub">Register a new patient record</div>
          </div>
          <div className="add-required-note">* Required fields</div>
        </div>

        {error && <div className="add-err-banner" style={{display: 'block'}}>{error}</div>}

        {/* Personal */}
        <div className="add-section">
          <div className="add-sec-head">👤 Personal information</div>
          <div className="add-sec-body add-g2">
            <div className="add-field"><label>First name *</label><input name="first_name" placeholder="e.g. Arun" value={formData.first_name} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Last name *</label><input name="last_name" placeholder="e.g. Krishnamurthy" value={formData.last_name} onChange={handleInputChange} /></div>
            <div className="add-field">
              <label>Date of birth *</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
              <div className="add-age-hint">{formData.date_of_birth ? `Age: ${calculateAge(formData.date_of_birth)} years` : ''}</div>
            </div>
            <div className="add-field">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="">Select gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="add-field">
              <label>Blood type</label>
              <select name="blood_type" value={formData.blood_type} onChange={handleInputChange}>
                <option value="">Select</option>
                <option>A+</option><option>B+</option><option>O+</option><option>AB+</option>
                <option>A-</option><option>B-</option><option>O-</option><option>AB-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="add-section">
          <div className="add-sec-head">📞 Contact details</div>
          <div className="add-sec-body add-g2">
            <div className="add-field"><label>Phone</label><input name="phone" placeholder="10-digit mobile" value={formData.phone} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Email</label><input name="email" placeholder="patient@email.com" value={formData.email} onChange={handleInputChange} /></div>
            <div className="add-field" style={{gridColumn: '1 / -1'}}><label>Address</label><input name="address" placeholder="Street address" value={formData.address} onChange={handleInputChange} /></div>
            <div className="add-field"><label>City</label><input name="city" placeholder="Chennai" value={formData.city} onChange={handleInputChange} /></div>
            <div className="add-field"><label>State</label><input name="state" placeholder="Tamil Nadu" value={formData.state} onChange={handleInputChange} /></div>
            <div className="add-field"><label>ZIP code</label><input name="zip_code" placeholder="600001" value={formData.zip_code} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Country</label><input name="country" value={formData.country} onChange={handleInputChange} /></div>
          </div>
        </div>

        {/* Medical */}
        <div className="add-section">
          <div className="add-sec-head">🩺 Medical information</div>
          <div className="add-sec-body add-g1">
            <div className="add-field"><label>Known allergies</label><textarea name="allergies" placeholder="e.g. Penicillin, Sulfa drugs…" rows={2} value={formData.allergies} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Medical history</label><textarea name="medical_history" placeholder="Past diagnoses, surgeries, chronic conditions…" rows={3} value={formData.medical_history} onChange={handleInputChange} /></div>
          </div>
        </div>

        {/* Emergency */}
        <div className="add-section">
          <div className="add-sec-head">🚨 Emergency contact</div>
          <div className="add-sec-body add-g2">
            <div className="add-field"><label>Contact name</label><input name="emergency_contact_name" placeholder="Guardian / spouse name" value={formData.emergency_contact_name} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Contact phone</label><input name="emergency_contact_phone" placeholder="10-digit mobile" value={formData.emergency_contact_phone} onChange={handleInputChange} /></div>
          </div>
        </div>

        {/* Insurance */}
        <div className="add-section">
          <div className="add-sec-head">🛡️ Insurance</div>
          <div className="add-sec-body add-g2">
            <div className="add-field"><label>Insurance provider</label><input name="insurance_provider" placeholder="e.g. Star Health" value={formData.insurance_provider} onChange={handleInputChange} /></div>
            <div className="add-field"><label>Policy number</label><input name="insurance_policy_number" placeholder="e.g. SH-20241234" value={formData.insurance_policy_number} onChange={handleInputChange} /></div>
          </div>
        </div>

        <div className="add-form-footer">
          <div className="add-autosave"><span className="add-saved-dot"></span><span>{saveStatus}</span></div>
          <div className="add-actions">
            <button className="add-btn" onClick={clearForm}>Clear</button>
            <button className="add-btn primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create patient'}</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}