import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [editingVitals, setEditingVitals] = useState(false)
  const [vitalsForm, setVitalsForm] = useState<any>({})

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      setUser(JSON.parse(u))
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }
  }, [user])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      let url = '/api/appointments'
      if (user?.role === 'doctor') {
        url += `?doctor_id=${user.id}`
      }
      
      const res = await fetch(url)
      const { data } = await res.json()
      setAppointments(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'rgba(59,130,246,0.1)'
      case 'Completed': return 'rgba(34,197,94,0.1)'
      case 'Cancelled': return 'rgba(239,68,68,0.1)'
      default: return 'var(--surface-3)'
    }
  }

  const handleVitalsUpdate = async () => {
    if (!selectedAppt) return
    
    try {
      const response = await fetch(`/api/appointments/vitals?appointmentId=${selectedAppt.appointment_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triage_vitals: vitalsForm })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedAppt(prev => ({ 
          ...prev, 
          triage_vitals: data.triage_vitals 
        }))
        setEditingVitals(false)
        // Update appointments list
        setAppointments(prev => prev.map((appt: any) => 
          appt.appointment_id === selectedAppt.appointment_id 
            ? { ...appt, triage_vitals: data.triage_vitals }
            : appt
        ))
      } else {
        const error = await response.json()
        alert('Failed to update vitals: ' + error.error)
      }
    } catch (error) {
      alert('Failed to update vitals: ' + error.message)
    }
  }

  const startEditingVitals = () => {
    if (selectedAppt?.triage_vitals) {
      setVitalsForm(selectedAppt.triage_vitals)
    } else {
      setVitalsForm({})
    }
    setEditingVitals(true)
  }

  const handleVitalChange = (field: string, value: string) => {
    setVitalsForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrescriptionTransmitted = () => {
    // Refresh the appointments list to show updated queue
    fetchAppointments();
  }

  return (
    <>
      <Head>
        <title>Appointments - AegisChart</title>
      </Head>
      <Layout>
        <div style={{ padding: '2rem 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                {user?.role === 'doctor' ? 'My Clinical Queue' : 'Appointments'}
              </h1>
              <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                {user?.role === 'doctor' ? 'Today\'s sequenced patient pipeline triage' : 'Manage system appointments'}
              </p>
            </div>
            {user?.role !== 'doctor' && (
              <button 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                onClick={() => router.push('/appointments/add')}
              >
                <span className="material-symbols-outlined">add</span>
                Schedule Appointment
              </button>
            )}
          </div>

          <div className="card">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading queue...</div>
            ) : appointments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No appointments scheduled for today.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'hsl(var(--surface-2))', borderBottom: '1px solid hsl(var(--border))' }}>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>QUEUE #</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>PATIENT</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>DOCTOR</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>TIME</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>TYPE</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>STATUS</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt: any, i: number) => (
                        <tr key={appt.id} style={{ 
                            borderBottom: '1px solid hsl(var(--border) / 0.5)', 
                            background: selectedAppt?.id === appt.id ? 'hsl(var(--surface-2))' : 'transparent',
                            transition: 'background 0.2s', cursor: 'pointer' 
                          }}
                          onClick={() => setSelectedAppt(selectedAppt?.id === appt.id ? null : appt)}
                          className="hover-row"
                        >
                          <td style={{ padding: '1rem', fontWeight: 800, color: 'hsl(var(--brand))' }}>
                            #{appt.queue_number || (i+1)}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{appt.patient_name}</td>
                          <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{appt.doctor_name}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            {new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', background: 'hsl(var(--surface-3))', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                              {appt.appointment_type}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', fontWeight: 700,
                              background: getStatusColor(appt.status), 
                              padding: '0.2rem 0.6rem', borderRadius: '4px' 
                            }}>
                              {appt.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: 'none' }}>
                                <span className="material-symbols-outlined">{selectedAppt?.id === appt.id ? 'expand_less' : 'expand_more'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>

          {selectedAppt && (
              <div className="card animate-slide-up" style={{ marginTop: '1.5rem', border: '1px solid hsl(var(--brand)/0.3)', background: 'linear-gradient(to right, hsl(var(--surface-1)), hsl(var(--surface-2)))' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="card-title" style={{ color: 'hsl(var(--brand))' }}>Triage Reading: {selectedAppt.patient_name}</span>
                      {user?.role === 'doctor' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!editingVitals ? (
                            <button 
                              className="btn-ghost" 
                              onClick={startEditingVitals}
                              style={{ 
                                padding: '0.5rem 1rem', 
                                fontSize: '0.75rem',
                                background: 'hsl(var(--brand)/0.1)',
                                color: 'hsl(var(--brand))',
                                border: '1px solid hsl(var(--brand)/0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }}>edit</span>
                              Update Vitals
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn-ghost" 
                                onClick={() => setEditingVitals(false)}
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.75rem',
                                  background: 'hsl(var(--surface-3))',
                                  color: 'hsl(var(--text-muted))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                              <button 
                                className="btn-primary" 
                                onClick={handleVitalsUpdate}
                                style={{ 
                                  padding: '0.5rem 1rem', 
                                  fontSize: '0.75rem',
                                  background: 'hsl(var(--brand))',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Save Vitals
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  <div className="card-body">
                      {editingVitals && user?.role === 'doctor' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div className="vital-input">
                            <label className="vital-label">Blood Pressure</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 120/80"
                              value={vitalsForm.bp || ''}
                              onChange={(e) => handleVitalChange('bp', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                          <div className="vital-input">
                            <label className="vital-label">Blood Sugar (mg/dL)</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 95"
                              value={vitalsForm.sugar || ''}
                              onChange={(e) => handleVitalChange('sugar', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                          <div className="vital-input">
                            <label className="vital-label">Weight (kg)</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 70"
                              value={vitalsForm.weight || ''}
                              onChange={(e) => handleVitalChange('weight', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                          <div className="vital-input">
                            <label className="vital-label">Height (cm)</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 175"
                              value={vitalsForm.height || ''}
                              onChange={(e) => handleVitalChange('height', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                          <div className="vital-input">
                            <label className="vital-label">Temperature (°F)</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 98.6"
                              value={vitalsForm.temp || ''}
                              onChange={(e) => handleVitalChange('temp', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                          <div className="vital-input">
                            <label className="vital-label">Heart Rate (bpm)</label>
                            <input 
                              type="text" 
                              placeholder="e.g., 72"
                              value={vitalsForm.heart_rate || ''}
                              onChange={(e) => handleVitalChange('heart_rate', e.target.value)}
                              className="vital-input-field"
                            />
                          </div>
                        </div>
                      ) : selectedAppt.triage_vitals ? (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                             <div className="vital-box">
                                 <span className="vital-label">Blood Pressure</span>
                                 <span className="vital-value">{selectedAppt.triage_vitals.bp || '--'}</span>
                             </div>
                             <div className="vital-box">
                                 <span className="vital-label">Blood Sugar</span>
                                 <span className="vital-value">{selectedAppt.triage_vitals.sugar ? `${selectedAppt.triage_vitals.sugar} mg/dL` : '--'}</span>
                             </div>
                             <div className="vital-box">
                                 <span className="vital-label">Weight</span>
                                 <span className="vital-value">{selectedAppt.triage_vitals.weight ? `${selectedAppt.triage_vitals.weight} kg` : '--'}</span>
                             </div>
                             <div className="vital-box">
                                 <span className="vital-label">Height</span>
                                 <span className="vital-value">{selectedAppt.triage_vitals.height ? `${selectedAppt.triage_vitals.height} cm` : '--'}</span>
                             </div>
                             <div className="vital-box">
                                 <span className="vital-label">Temperature</span>
                                 <span className="vital-value">{selectedAppt.triage_vitals.temp ? `${selectedAppt.triage_vitals.temp}°F` : '--'}</span>
                             </div>
                             {selectedAppt.triage_vitals.heart_rate && (
                               <div className="vital-box">
                                   <span className="vital-label">Heart Rate</span>
                                   <span className="vital-value">{selectedAppt.triage_vitals.heart_rate} bpm</span>
                               </div>
                             )}
                         </div>
                      ) : (
                          <div style={{ color: 'hsl(var(--text-muted))', padding: '1rem 0' }}>
                            Nurse triage has not been completed for this patient yet.
                            {user?.role === 'doctor' && (
                              <div style={{ marginTop: '1rem' }}>
                                <button 
                                  className="btn-ghost" 
                                  onClick={startEditingVitals}
                                  style={{ 
                                    padding: '0.5rem 1rem', 
                                    fontSize: '0.75rem',
                                    background: 'hsl(var(--brand)/0.1)',
                                    color: 'hsl(var(--brand))',
                                    border: '1px solid hsl(var(--brand)/0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', marginRight: '0.25rem', verticalAlign: 'middle' }}>add</span>
                                  Record Vitals
                                </button>
                              </div>
                            )}
                          </div>
                      )}
                  </div>
              </div>
          )}

          <style>{`
            .hover-row:hover { background: hsl(var(--surface-2)) !important; }
            .vital-box {
                background: hsl(var(--surface-3));
                padding: 1rem;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                border: 1px solid hsl(var(--border)/0.5);
            }
            .vital-input {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .vital-input-field {
                background: hsl(var(--surface-2));
                border: 1px solid hsl(var(--border)/0.5);
                border-radius: 8px;
                padding: 0.75rem;
                color: hsl(var(--text-primary));
                font-size: 0.9rem;
                font-weight: 600;
                transition: border-color 0.2s;
            }
            .vital-input-field:focus { 
                outline: none; 
                border-color: hsl(var(--brand) / 0.5); 
                background: hsl(var(--surface-3)); 
            }
            .vital-label { 
                font-size: 0.75rem; 
                color: hsl(var(--text-muted)); 
                font-weight: 700; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
            }
            .vital-value { 
                font-size: 1.25rem; 
                font-weight: 800; 
                color: hsl(var(--text-primary)); 
            }
            .animate-slide-up {
                animation: slideUpTriage 0.2s ease-out;
            }
            @keyframes slideUpTriage {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </Layout>
    </>
  )
}
