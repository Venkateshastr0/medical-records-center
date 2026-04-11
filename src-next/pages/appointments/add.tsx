import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

interface AppointmentFormData {
  patient_id: string
  doctor_id: string
  appointment_date: string
  duration_minutes: number
  appointment_type: string
  status: string
  notes: string
  priority: string
  extra_data: Record<string, any>
}

export default function AddAppointmentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    duration_minutes: 30,
    appointment_type: 'Consultation',
    status: 'SCHEDULED',
    notes: '',
    priority: 'LOW',
    extra_data: {}
  })

  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        // Fetch patients
        const pRes = await fetch('/api/patients?limit=100');
        const pData = await pRes.json();
        if (pData.data) {
          setPatients(pData.data.map((p: any) => ({
            id: p.patient_id || p.id,
            name: `${p.first_name} ${p.last_name}`
          })));
        }

        // Fetch doctors - Fixed API endpoint
        const dRes = await fetch('/api/doctors');
        const dData = await dRes.json();
        
        if (dData.data && dData.data.length > 0) {
          setDoctors(dData.data);
          
          // Try to find demo doctor (John Smith)
          const demoDoctor = dData.data.find((d: any) => d.first_name === 'John' && d.last_name === 'Smith');
          
          if (demoDoctor) {
            setFormData(prev => ({ ...prev, doctor_id: String(demoDoctor.id) }));
          } else if (dData.data.length > 0) {
            // If no demo doctor, select the first available doctor
            setFormData(prev => ({ ...prev, doctor_id: String(dData.data[0].id) }));
          }
        } else {
          // If API fails or no doctors, add demo doctor as fallback
          const demoDoctors = [
            {
              id: 'demo-1',
              name: 'Dr. John Smith',
              first_name: 'John',
              last_name: 'Smith',
              email: 'john.smith@hospital.com'
            },
            {
              id: 'demo-2', 
              name: 'Dr. Sarah Johnson',
              first_name: 'Sarah',
              last_name: 'Johnson',
              email: 'sarah.johnson@hospital.com'
            },
            {
              id: 'demo-3',
              name: 'Dr. Michael Chen', 
              first_name: 'Michael',
              last_name: 'Chen',
              email: 'michael.chen@hospital.com'
            }
          ];
          
          setDoctors(demoDoctors);
          setFormData(prev => ({ ...prev, doctor_id: 'demo-1' })); // Set John Smith as default
        }
      } catch (err) {
        console.error('Failed to fetch patients/doctors, using demo data:', err);
        
        // Fallback demo data if API fails completely
        const demoDoctors = [
          {
            id: 'demo-1',
            name: 'Dr. John Smith',
            first_name: 'John', 
            last_name: 'Smith',
            email: 'john.smith@hospital.com'
          },
          {
            id: 'demo-2',
            name: 'Dr. Sarah Johnson',
            first_name: 'Sarah',
            last_name: 'Johnson', 
            email: 'sarah.johnson@hospital.com'
          },
          {
            id: 'demo-3',
            name: 'Dr. Michael Chen',
            first_name: 'Michael',
            last_name: 'Chen',
            email: 'michael.chen@hospital.com'
          }
        ];
        
        setDoctors(demoDoctors);
        setFormData(prev => ({ ...prev, doctor_id: 'demo-1' })); // Set John Smith as default
        
        // Also add demo patients if needed
        const demoPatients = [
          {
            id: 'demo-patient-1',
            name: 'Alice Johnson'
          },
          {
            id: 'demo-patient-2', 
            name: 'Bob Williams'
          }
        ];
        
        if (patients.length === 0) {
          setPatients(demoPatients);
        }
      }
    };
    
    fetchSelectOptions();
  }, [])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    
    // Handle extra_data fields
    if (name.startsWith('extra_')) {
      const fieldName = name.replace('extra_', '')
      setFormData(prev => ({ 
        ...prev, 
        extra_data: {
          ...prev.extra_data,
          [fieldName]: value
        }
      }))
    } else {
      // Handle regular form fields
      setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'duration_minutes' ? parseInt(value) || 0 : value 
      }))
    }
  }

  const selectType = (val: string, dur: number) => {
    // Clear extra_data when changing appointment type
    setFormData(prev => ({ 
      ...prev, 
      appointment_type: val, 
      duration_minutes: dur,
      extra_data: {}
    }))
  }

  const selectPrio = (val: string) => {
    setFormData(prev => ({ ...prev, priority: val }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setError('')

    if(!formData.patient_id) return setError('Please select a patient.')
    if(!formData.doctor_id) return setError('Please select a doctor.')
    if(!formData.appointment_date) return setError('Please set the date and time.')
    
    // Validate context-specific fields
    const typeRules = {
      'Consultation': ['reason_for_visit'],
      'Follow-up': ['previous_visit_id'],
      'Urgent Care': ['urgency_description'],
      'Vaccination': ['vaccine_name', 'dose_number'],
      'Procedure': ['procedure_name']
    }
    
    const requiredFields = typeRules[formData.appointment_type] || []
    for (const field of requiredFields) {
      if (!formData.extra_data[field] || formData.extra_data[field].toString().trim() === '') {
        return setError(`${field.replace('_', ' ')} is required for ${formData.appointment_type} appointments.`)
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/appointments')
      } else {
        const data = await response.json();
        setError('Error creating appointment: ' + (data.error || 'Unknown error'))
        setIsSubmitting(false)
      }
    } catch (error) {
      setError('Error creating appointment. Please try again.')
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setFormData({
      patient_id: '', doctor_id: '', appointment_date: '', duration_minutes: 30,
      appointment_type: 'Consultation', status: 'SCHEDULED', notes: '', priority: 'LOW', extra_data: {}
    })
    setError('')
  }

  const pSel = patients.find(p => p.id === formData.patient_id)
  const dSel = doctors.find(d => String(d.id) === formData.doctor_id)

  return (
    <Layout title="Schedule Appointment" subtitle="Book a new patient appointment">
      <style>{`
        .appt-page { padding: 1.5rem; max-width: 820px; margin: 0 auto; font-family: var(--font-sans); color: #f3f4f6; }
        .appt-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .appt-page-title { font-size: 20px; font-weight: 500; color: #f9fafb; }
        .appt-page-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }
        .appt-section { border: 1px solid #374151; border-radius: 8px; margin-bottom: 14px; overflow: hidden; background: #111827; }
        .appt-sec-head { padding: 11px 16px; background: #1f2937; border-bottom: 1px solid #374151; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; color:#f3f4f6; }
        .appt-sec-body { padding: 16px; display: grid; gap: 14px; }
        .appt-g2 { grid-template-columns: 1fr 1fr; }
        .appt-g1 { grid-template-columns: 1fr; }
        @media (max-width: 600px) { .appt-g2 { grid-template-columns: 1fr; } .appt-type-grid { grid-template-columns: 1fr 1fr; } .appt-prio-row { grid-template-columns: 1fr 1fr; } }
        .appt-field label { display: block; font-size: 11px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 5px; }
        .appt-field input, .appt-field select, .appt-field textarea { width: 100%; padding: 8px 11px; border: 1px solid #4b5563; border-radius: 6px; font-size: 13px; background: #1f2937; color: #f3f4f6; outline: none; }
        .appt-field input:focus, .appt-field select:focus, .appt-field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
        .appt-field textarea { resize: vertical; min-height: 80px; }
        .appt-err-banner { font-size: 13px; color: #fca5a5; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
        
        .appt-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .appt-type-btn { padding: 11px 6px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #d1d5db; text-align: center; transition: all .12s; line-height: 1.3; }
        .appt-type-btn small { display: block; font-size: 10px; font-weight: 400; color: #9ca3af; margin-top: 3px; }
        .appt-type-btn:hover { background: #374151; }
        .appt-type-btn.sel { background: #1e3a8a; border-color: #3b82f6; color: #bfdbfe; }
        .appt-type-btn.sel small { color: #93c5fd; }

        .appt-prio-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .appt-prio-btn { padding: 8px 4px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #d1d5db; text-align: center; transition: all .12s; }
        .appt-prio-btn:hover { background: #374151; }
        .appt-prio-btn.sel-LOW { background: #064e3b; border-color: #10b981; color: #6ee7b7; }
        .appt-prio-btn.sel-NORMAL { background: #1e3a8a; border-color: #3b82f6; color: #93c5fd; }
        .appt-prio-btn.sel-HIGH { background: #78350f; border-color: #f59e0b; color: #fcd34d; }
        .appt-prio-btn.sel-URGENT { background: #7f1d1d; border-color: #ef4444; color: #fca5a5; }

        .appt-sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .appt-sum-card { background: #1f2937; border-radius: 6px; padding: 11px 14px; border: 1px solid #374151; }
        .appt-sum-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #9ca3af; margin-bottom: 4px; }
        .appt-sum-val { font-size: 13px; font-weight: 500; color: #f3f4f6; }

        .appt-form-footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 6px; }
        .appt-btn { padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; transition: background .12s; }
        .appt-btn:hover { background: #374151; }
        .appt-btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .appt-btn.primary:hover { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }
        .appt-btn:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
      
      <div className="appt-page">
        <div className="appt-topbar">
          <div>
            <div className="appt-page-title">Schedule appointment</div>
            <div className="appt-page-sub">Book a new patient appointment</div>
          </div>
        </div>

        {error && <div className="appt-err-banner" style={{display:'block'}}>{error}</div>}

        <div className="appt-section">
          <div className="appt-sec-head">📅 Appointment details</div>
          <div className="appt-sec-body appt-g2">
            <div className="appt-field">
              <label>Patient *</label>
              <select name="patient_id" value={formData.patient_id} onChange={handleInputChange}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="appt-field">
              <label>Doctor *</label>
              <select name="doctor_id" value={formData.doctor_id} onChange={handleInputChange}>
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name || `${d.first_name} ${d.last_name}`}</option>)}
              </select>
            </div>
            <div className="appt-field">
              <label>Date &amp; time *</label>
              <input type="datetime-local" name="appointment_date" value={formData.appointment_date} onChange={handleInputChange} />
            </div>
            <div className="appt-field">
              <label>Duration</label>
              <select name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange}>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
            <div className="appt-field" style={{gridColumn:'1/-1'}}>
              <label>Appointment type *</label>
              <div className="appt-type-grid">
                {[
                  {val: 'Consultation', dur: 30, lbl: 'Consultation'},
                  {val: 'Follow-up', dur: 20, lbl: 'Follow-up'},
                  {val: 'Urgent Care', dur: 60, lbl: 'Urgent Care'},
                  {val: 'Procedure', dur: 120, lbl: 'Procedure'},
                  {val: 'Vaccination', dur: 15, lbl: 'Vaccination'},
                ].map(t => (
                  <div key={t.val} className={`appt-type-btn ${formData.appointment_type === t.val ? 'sel' : ''}`} onClick={() => selectType(t.val, t.dur)}>
                    {t.lbl}<small>{t.dur} min</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="appt-field" style={{gridColumn:'1/-1'}}>
              <label>Priority</label>
              <div className="appt-prio-row">
                {[
                  {val: 'LOW', lbl: 'Low'},
                  {val: 'NORMAL', lbl: 'Normal'},
                  {val: 'HIGH', lbl: 'High'},
                  {val: 'URGENT', lbl: 'Urgent'}
                ].map(p => (
                  <div key={p.val} className={`appt-prio-btn ${formData.priority === p.val ? 'sel-' + p.val : ''}`} onClick={() => selectPrio(p.val)}>
                    {p.lbl}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Context-Specific Fields */}
        <div className="appt-section">
          <div className="appt-sec-head">� {formData.appointment_type} Details</div>
          <div className="appt-sec-body appt-g1">
            {formData.appointment_type === 'Consultation' && (
              <>
                <div className="appt-field">
                  <label>Reason for visit *</label>
                  <textarea 
                    name="extra_reason_for_visit" 
                    placeholder="Describe the reason for this consultation…" 
                    rows={3} 
                    value={formData.extra_data.reason_for_visit || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="appt-field">
                  <label>Additional notes</label>
                  <textarea 
                    name="extra_notes" 
                    placeholder="Any additional information…" 
                    rows={2} 
                    value={formData.extra_data.notes || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              </>
            )}
            
            {formData.appointment_type === 'Follow-up' && (
              <>
                <div className="appt-field">
                  <label>Previous visit ID *</label>
                  <input 
                    type="number" 
                    name="extra_previous_visit_id" 
                    placeholder="Enter previous appointment ID" 
                    value={formData.extra_data.previous_visit_id || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="appt-field">
                  <label>Progress notes</label>
                  <textarea 
                    name="extra_progress_notes" 
                    placeholder="How has the patient progressed?" 
                    rows={3} 
                    value={formData.extra_data.progress_notes || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              </>
            )}
            
            {formData.appointment_type === 'Urgent Care' && (
              <>
                <div className="appt-field">
                  <label>Urgency description *</label>
                  <textarea 
                    name="extra_urgency_description" 
                    placeholder="Describe the urgent medical concern…" 
                    rows={3} 
                    value={formData.extra_data.urgency_description || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="appt-field">
                  <label>Severity level</label>
                  <select name="extra_severity_level" value={formData.extra_data.severity_level || ''} onChange={handleInputChange}>
                    <option value="">Select severity</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </>
            )}
            
            {formData.appointment_type === 'Vaccination' && (
              <>
                <div className="appt-g2">
                  <div className="appt-field">
                    <label>Vaccine name *</label>
                    <input 
                      type="text" 
                      name="extra_vaccine_name" 
                      placeholder="e.g., COVID-19, Flu, MMR" 
                      value={formData.extra_data.vaccine_name || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="appt-field">
                    <label>Dose number *</label>
                    <select name="extra_dose_number" value={formData.extra_data.dose_number || ''} onChange={handleInputChange}>
                      <option value="">Select dose</option>
                      <option value="1">1st dose</option>
                      <option value="2">2nd dose</option>
                      <option value="3">3rd dose</option>
                      <option value="4">Booster</option>
                    </select>
                  </div>
                </div>
                <div className="appt-field">
                  <label>Additional notes</label>
                  <textarea 
                    name="extra_notes" 
                    placeholder="Allergies, previous reactions, etc." 
                    rows={2} 
                    value={formData.extra_data.notes || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              </>
            )}
            
            {formData.appointment_type === 'Procedure' && (
              <>
                <div className="appt-field">
                  <label>Procedure name *</label>
                  <input 
                    type="text" 
                    name="extra_procedure_name" 
                    placeholder="e.g., Colonoscopy, Biopsy, ECG" 
                    value={formData.extra_data.procedure_name || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="appt-field">
                  <label>Preparation instructions</label>
                  <textarea 
                    name="extra_preparation_instructions" 
                    placeholder="Fasting requirements, medication adjustments…" 
                    rows={3} 
                    value={formData.extra_data.preparation_instructions || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="appt-section">
          <div className="appt-sec-head">📝 Additional information</div>
          <div className="appt-sec-body appt-g1">
            <div className="appt-field">
              <label>Status</label>
              <select name="status" style={{maxWidth:'260px'}} value={formData.status} onChange={handleInputChange}>
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>
            <div className="appt-field">
              <label>Staff notes</label>
              <textarea name="notes" placeholder="Internal notes for staff…" rows={3} value={formData.notes} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="appt-section">
          <div className="appt-sec-head">✅ Summary</div>
          <div className="appt-sec-body appt-g1">
            <div className="appt-sum-grid">
              <div className="appt-sum-card"><div className="appt-sum-lbl">Patient</div><div className="appt-sum-val">{pSel ? pSel.name : '—'}</div></div>
              <div className="appt-sum-card"><div className="appt-sum-lbl">Doctor</div><div className="appt-sum-val">{dSel ? (dSel.name || `${dSel.first_name} ${dSel.last_name}`) : '—'}</div></div>
              <div className="appt-sum-card"><div className="appt-sum-lbl">Date &amp; time</div><div className="appt-sum-val">{formData.appointment_date ? new Date(formData.appointment_date).toLocaleString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div></div>
              <div className="appt-sum-card"><div className="appt-sum-lbl">Duration</div><div className="appt-sum-val">{formData.duration_minutes ? formData.duration_minutes + ' minutes' : '—'}</div></div>
              <div className="appt-sum-card"><div className="appt-sum-lbl">Type</div><div className="appt-sum-val">{formData.appointment_type}</div></div>
              <div className="appt-sum-card"><div className="appt-sum-lbl">Priority</div><div className="appt-sum-val">{formData.priority.charAt(0) + formData.priority.slice(1).toLowerCase()}</div></div>
              {formData.appointment_type === 'Consultation' && formData.extra_data.reason_for_visit && (
                <div className="appt-sum-card" style={{gridColumn: '1/-1'}}><div className="appt-sum-lbl">Reason</div><div className="appt-sum-val">{formData.extra_data.reason_for_visit}</div></div>
              )}
              {formData.appointment_type === 'Follow-up' && formData.extra_data.previous_visit_id && (
                <div className="appt-sum-card"><div className="appt-sum-lbl">Previous Visit</div><div className="appt-sum-val">#{formData.extra_data.previous_visit_id}</div></div>
              )}
              {formData.appointment_type === 'Urgent Care' && formData.extra_data.urgency_description && (
                <div className="appt-sum-card" style={{gridColumn: '1/-1'}}><div className="appt-sum-lbl">Urgency</div><div className="appt-sum-val">{formData.extra_data.urgency_description}</div></div>
              )}
              {formData.appointment_type === 'Vaccination' && (
                <>
                  {formData.extra_data.vaccine_name && (
                    <div className="appt-sum-card"><div className="appt-sum-lbl">Vaccine</div><div className="appt-sum-val">{formData.extra_data.vaccine_name}</div></div>
                  )}
                  {formData.extra_data.dose_number && (
                    <div className="appt-sum-card"><div className="appt-sum-lbl">Dose</div><div className="appt-sum-val">{formData.extra_data.dose_number}</div></div>
                  )}
                </>
              )}
              {formData.appointment_type === 'Procedure' && formData.extra_data.procedure_name && (
                <div className="appt-sum-card" style={{gridColumn: '1/-1'}}><div className="appt-sum-lbl">Procedure</div><div className="appt-sum-val">{formData.extra_data.procedure_name}</div></div>
              )}
            </div>
          </div>
        </div>

        <div className="appt-form-footer">
          <button className="appt-btn" onClick={clearForm}>Clear</button>
          <button className="appt-btn primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Scheduling…' : 'Schedule appointment'}</button>
        </div>
      </div>
    </Layout>
  )
}
