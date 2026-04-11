import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Head from 'next/head'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

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
  status?: string
  created_at: string
  updated_at: string
}

const TABS = ['Medical History', 'Appointments', 'Prescriptions', 'Lab Results'] as const
type Tab = typeof TABS[number]

export default function PatientDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [activeTab, setActiveTab] = useState<Tab>('Prescriptions')

  const { data: patient, isLoading, error } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (typeof window === 'undefined' || !window.__TAURI__) return null as any
      const response: any = await window.__TAURI__.invoke('get_patient', { id })
      return response.data
    },
    enabled: !!id
  })

  // Calculate age helper
  const getAge = (dob: string) => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  if (isLoading) return <Layout title="Loading..."><div className="empty-state"><div className="spinner" /></div></Layout>
  if (error || !patient) return <Layout title="Error"><div className="empty-state"><p>Patient not found or error loading data.</p></div></Layout>

  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase()

  const summaryCards = [
    {
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      iconBg: 'rgba(239,68,68,0.12)', iconColor: '#ef4444',
      label: 'Allergies', value: patient.allergies || 'None',
    },
    {
      icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v10m0 0l-3-3m3 3l3-3',
      iconBg: 'rgba(59,130,246,0.12)', iconColor: '#3b82f6',
      label: 'Blood Type', value: patient.blood_type || 'N/A',
    },
    {
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b',
      label: 'Registered', value: new Date(patient.created_at).toLocaleDateString(),
    },
  ]

  return (
    <>
      <Head>
        <title>{patient.first_name} {patient.last_name} — Patient Details — AegisChart</title>
        <meta name="description" content={`Patient details for ${patient.first_name} ${patient.last_name}`} />
      </Head>
      <Layout title="Patient Details" subtitle={`ID: #${patient.id}`}>

        {/* Back button */}
        <button
          onClick={() => router.push('/patients')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--text-muted))', fontSize: '0.875rem', fontWeight: 500,
            padding: '0.5rem 0', marginBottom: '1.5rem', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--text-primary))')}
          onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Patients
        </button>

        {/* Patient Profile Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between' }} className="profile-row">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                {/* Avatar */}
                <div style={{
                  width: '80px', height: '80px', flexShrink: 0, borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, hsl(210 100% 56%), hsl(250 100% 65%))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 800, color: 'white',
                  boxShadow: '0 8px 24px rgba(60,131,246,0.35)',
                }}>
                  {initials}
                </div>
                {/* Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                      {patient.first_name} {patient.last_name}
                    </h1>
                    <span style={{
                      padding: '0.15rem 0.625rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: 'rgba(34,197,94,0.12)', color: '#16a34a',
                    }}>
                      {patient.status || 'Active'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                    Patient ID: #{patient.id}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {patient.date_of_birth} ({getAge(patient.date_of_birth)} yrs)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {patient.phone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {patient.email}
                    </div>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
                <button className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Record
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Quick Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {summaryCards.map((c, i) => (
            <div key={i} className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.125rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '0.625rem', flexShrink: 0,
                  background: c.iconBg, color: c.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{c.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginTop: '0.25rem', lineHeight: 1.4 }}>{c.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + Content */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Tabs nav */}
          <div style={{
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--surface-2))',
            padding: '0 1.25rem',
            display: 'flex', overflowX: 'auto', gap: 0,
          }}>
            {TABS.map(tab => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1rem 1.25rem', background: 'none', border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  fontSize: '0.875rem', fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  borderBottom: `2px solid ${activeTab === tab ? 'hsl(var(--brand))' : 'transparent'}`,
                  transition: 'all 0.15s', marginBottom: '-1px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card-body">
            {activeTab === 'Prescriptions' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                    Current Medications
                  </h3>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print List
                    </button>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Prescription
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {(patient as any).medications?.map((med: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem', borderRadius: '0.75rem',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface-2))',
                    }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'hsl(var(--text-primary))' }}>{med.name}</span>
                          <span style={{
                            padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                            background: 'hsl(var(--surface-3))', color: 'hsl(var(--text-muted))',
                          }}>{med.dose}</span>
                        </div>
                        <p style={{ margin: '0.375rem 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                          {med.instructions}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right', paddingLeft: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Refills</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{med.refills}</div>
                      </div>
                      <button style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem',
                        color: 'hsl(var(--text-muted))', borderRadius: '6px', transition: 'all 0.15s',
                        display: 'flex', flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Discontinued */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-muted))', marginBottom: '0.875rem' }}>
                    Recently Discontinued
                  </div>
                  {(patient as any).discontinuedMeds?.map((med: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.875rem', borderRadius: '0.75rem',
                      border: '1px solid hsl(var(--border))',
                      opacity: 0.45, filter: 'grayscale(1)',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: 'hsl(var(--surface-3))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'hsl(var(--text-muted))',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'hsl(var(--text-primary))' }}>{med.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>{med.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'Medical History' && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  Medical History
                </h3>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem'
                }}>
                  {[
                    { label: 'Blood Type', value: patient.blood_type || 'N/A', color: '#3b82f6' },
                    { label: 'Allergies', value: patient.allergies || 'None', color: '#ef4444' },
                    { label: 'Address', value: patient.address || 'N/A', color: '#f59e0b' },
                    { label: 'Emergency Contact', value: `${patient.emergency_contact_name || 'N/A'} — ${patient.emergency_contact_phone || 'N/A'}`, color: '#22c55e' },
                    { label: 'Insurance', value: `${patient.insurance_provider || 'N/A'} (${patient.insurance_policy_number || 'N/A'})`, color: '#a855f7' },
                    { label: 'Last Updated', value: new Date(patient.updated_at).toLocaleDateString(), color: '#06b6d4' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '1rem', borderRadius: '0.75rem',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface-2))',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.375rem' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--text-primary))', lineHeight: 1.4 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Appointments' && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>No upcoming appointments</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Schedule a new appointment to get started</p>
                <button className="btn btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Appointment
                </button>
              </div>
            )}

            {activeTab === 'Lab Results' && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontWeight: 600 }}>No lab results on file</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Lab results will appear here once available</p>
              </div>
            )}
          </div>
        </div>

        <style>{`
          .profile-row {
            flex-direction: column;
          }
          @media (min-width: 768px) {
            .profile-row { flex-direction: row; align-items: flex-end; }
          }
        `}</style>
      </Layout>
    </>
  )
}
