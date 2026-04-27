import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Head from 'next/head'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

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

interface PrescriptionRx {
  drug: string
  detail: string
  cat: string
  status: string
  accent: string
  isNew: boolean
}

interface PrescriptionSession {
  id: number
  date: string
  isNew: boolean
  rxs: PrescriptionRx[]
}

export default function PatientDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const [activeView, setActiveView] = useState<'overview' | 'clinical-encounters' | 'prescriptions' | 'labs'>('overview')
  const [activeRange, setActiveRange] = useState<'1M' | '3M' | '6M'>('1M')
  const [rxCatFilter, setRxCatFilter] = useState('All')
  const [rxStatusFilter, setRxStatusFilter] = useState('All')
  const [rxSearch, setRxSearch] = useState('')
  const [labCatFilter, setLabCatFilter] = useState('All')
  const [labStatusFilter, setLabStatusFilter] = useState('All')
  const [labSearch, setLabSearch] = useState('')

  const { data: result, isLoading, error } = useQuery<any>({
    queryKey: ['patient', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/patients/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch patient details (${response.status}): ${text.substring(0, 100)}`);
      }
      return response.json();
    },
    enabled: !!id
  })

  const patient = result?.patient;

  // Clinical encounters query - moved to top level to follow React hooks rules
  const { data: encounters, isLoading: encountersLoading, error: encountersError } = useQuery({
    queryKey: ['patient-encounters', id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/patients/${id}/encounters`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch encounters (${response.status})`);
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching encounters:', err);
        // Return mock data for now
        return [
          {
            id: '1',
            visit_date: '2026-04-02',
            chief_complaint: 'Routine diabetes follow-up',
            assessment: 'Blood sugar levels slightly elevated. Continue current medication regimen.',
            diagnosis: 'Type 2 diabetes, uncontrolled',
            treatment_plan: 'Continue Metformin 500mg twice daily. Dietary counseling provided.',
            doctor_name: 'Dr. Ramesh Iyer',
            status: 'COMPLETED'
          },
          {
            id: '2', 
            visit_date: '2026-03-15',
            chief_complaint: 'Headache and fatigue',
            assessment: 'Patient reports increased stress. Blood pressure elevated.',
            diagnosis: 'Hypertension',
            treatment_plan: 'Started Amlodipine 5mg once daily. Lifestyle modifications discussed.',
            doctor_name: 'Dr. Sarah Chen',
            status: 'COMPLETED'
          }
        ];
      }
    },
    enabled: !!id
  });

  // Real prescription data for web version
  const { data: prescriptionsData, isLoading: prescriptionsLoading, error: prescriptionsError } = useQuery<PrescriptionSession[]>({
    queryKey: ['patient-prescriptions', id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/prescriptions?patient_id=${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch prescriptions (${response.status})`);
        }
        const prescriptions = await response.json();
        
        // Group prescriptions by date to create sessions
        const prescriptionsByDate: Record<string, PrescriptionSession> = prescriptions.reduce((acc, prescription: any) => {
          const date = new Date(prescription.prescription_date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          if (!acc[date]) {
            acc[date] = {
              id: Date.now() + Math.random(), // unique session id
              date: date,
              isNew: false,
              rxs: []
            };
          }
          
          acc[date].rxs.push({
            drug: prescription.medication_name,
            detail: `${prescription.dosage} · ${prescription.frequency} · ${prescription.duration}`,
            cat: 'Prescription', // You might want to categorize this based on medication
            status: prescription.status || 'Active',
            accent: '#378ADD',
            isNew: false
          });
          
          return acc;
        }, {});
        
        // Convert to array and mark the latest as new
        const sessions = Object.values(prescriptionsByDate);
        if (sessions.length > 0) {
          sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          sessions[0].isNew = true;
          sessions[0].rxs.forEach((rx) => rx.isNew = true);
        }
        
        return sessions;
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        // Return empty array on error
        return [];
      }
    },
    enabled: !!id
  });

  // Mock lab results data for web version
  const { data: labResultsData, isLoading: labResultsLoading, error: labResultsError } = useQuery({
    queryKey: ['patient-lab-results', id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mock lab results data with file attachments
      return [
        {
          id: '1',
          patient_id: id,
          doctor_id: 'doc1',
          test_name: 'Complete Blood Count',
          test_category: 'Blood Work',
          test_date: '2026-04-03',
          result_date: '2026-04-03',
          result_value: 'Hemoglobin 14.2 g/dL',
          unit: 'g/dL',
          reference_range: '12.0-15.5 g/dL',
          status: 'COMPLETED',
          abnormal_flag: 'NORMAL',
          interpretation: 'Normal CBC results',
          file_path: 'uploads/lab_results/cbc_result.pdf',
          file_name: 'CBC_Result_John_Doe.pdf',
          file_size: 2048576,
          mime_type: 'application/pdf',
          created_at: '2026-04-03T10:00:00Z',
          updated_at: '2026-04-03T10:00:00Z'
        },
        {
          id: '2',
          patient_id: id,
          doctor_id: 'doc2',
          test_name: 'Lipid Panel',
          test_category: 'Blood Work',
          test_date: '2026-04-01',
          result_date: '2026-04-01',
          result_value: 'LDL 98 mg/dL',
          unit: 'mg/dL',
          reference_range: '<100 mg/dL',
          status: 'COMPLETED',
          abnormal_flag: 'NORMAL',
          interpretation: 'Normal lipid levels',
          file_path: 'uploads/lab_results/lipid_panel.pdf',
          file_name: 'Lipid_Panel_John_Doe.pdf',
          file_size: 1536000,
          mime_type: 'application/pdf',
          created_at: '2026-04-01T14:30:00Z',
          updated_at: '2026-04-01T14:30:00Z'
        },
        {
          id: '3',
          patient_id: id,
          doctor_id: 'doc1',
          test_name: 'Chest X-Ray',
          test_category: 'Imaging',
          test_date: '2026-03-28',
          result_date: '2026-03-28',
          result_value: 'Normal',
          unit: null,
          reference_range: 'No abnormalities',
          status: 'COMPLETED',
          abnormal_flag: 'NORMAL',
          interpretation: 'Clear lung fields, no acute findings',
          file_path: 'uploads/lab_results/chest_xray.jpg',
          file_name: 'Chest_XRay_John_Doe.jpg',
          file_size: 3145728,
          mime_type: 'image/jpeg',
          created_at: '2026-03-28T09:15:00Z',
          updated_at: '2026-03-28T09:15:00Z'
        },
        {
          id: '4',
          patient_id: id,
          doctor_id: 'doc3',
          test_name: 'HbA1c',
          test_category: 'Blood Work',
          test_date: '2026-03-25',
          result_date: '2026-03-25',
          result_value: '7.8%',
          unit: '%',
          reference_range: '4.0-5.6%',
          status: 'COMPLETED',
          abnormal_flag: 'HIGH',
          interpretation: 'Elevated HbA1c indicating poor glycemic control',
          file_path: 'uploads/lab_results/hba1c_result.pdf',
          file_name: 'HbA1c_Result_John_Doe.pdf',
          file_size: 1024000,
          mime_type: 'application/pdf',
          created_at: '2026-03-25T16:45:00Z',
          updated_at: '2026-03-25T16:45:00Z'
        }
      ];
    },
    enabled: !!id
  });

  // Calculate age helper
  const getAge = (dob: string) => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  };

  const chartData = useMemo(() => {
    const data1M = [
      { name: 'Week 1', sugar: 182, bp: 138, temp: 98.6 },
      { name: 'Week 2', sugar: 195, bp: 134, temp: 99.0 },
      { name: 'Week 3', sugar: 178, bp: 130, temp: 98.4 },
      { name: 'Week 4', sugar: 185, bp: 132, temp: 99.2 },
      { name: 'Week 5', sugar: 172, bp: 126, temp: 98.8 },
      { name: 'Week 6', sugar: 169, bp: 122, temp: 97.8 },
      { name: 'Week 7', sugar: 158, bp: 124, temp: 98.4 },
      { name: 'Week 8', sugar: 161, bp: 118, temp: 98.0 },
    ];
    const data3M = [
      { name: 'Jan', sugar: 195, bp: 140, temp: 99.2 },
      { name: 'Feb', sugar: 188, bp: 136, temp: 98.8 },
      { name: 'Mar', sugar: 182, bp: 134, temp: 98.6 },
      { name: 'Apr', sugar: 178, bp: 130, temp: 99.0 },
      { name: 'May', sugar: 172, bp: 128, temp: 98.4 },
      { name: 'Jun', sugar: 165, bp: 124, temp: 97.8 },
    ];
    const data6M = [
      { name: 'Oct', sugar: 210, bp: 145, temp: 99.4 },
      { name: 'Nov', sugar: 202, bp: 140, temp: 99.0 },
      { name: 'Dec', sugar: 195, bp: 136, temp: 98.6 },
      { name: 'Jan', sugar: 190, bp: 134, temp: 98.8 },
      { name: 'Feb', sugar: 182, bp: 130, temp: 98.4 },
      { name: 'Mar', sugar: 175, bp: 126, temp: 98.0 },
    ];
    return activeRange === '1M' ? data1M : activeRange === '3M' ? data3M : data6M;
  }, [activeRange]);

  
  const mockLabResults = [
    {
      id: 14, date: '3 Apr 2026', isLatest: true,
      labs: [
        { name: 'HbA1c panel', lab: 'Apollo Diagnostics', val: '7.8%', cat: 'Metabolic', result: 'High', trend: 'up', thumbBg: '#FAEEDA', thumbAcc: '#BA7517', pdfCol: '#633806', isNew: true },
        { name: 'Lipid profile', lab: 'Apollo Diagnostics', val: 'LDL 98', cat: 'Lipid', result: 'Normal', trend: 'dn', thumbBg: '#E1F5EE', thumbAcc: '#1D9E75', pdfCol: '#085041', isNew: true },
        { name: 'Kidney function test', lab: 'Apollo Diagnostics', val: 'Cr 1.4', cat: 'Renal', result: 'Danger', trend: 'up', thumbBg: '#FCEBEB', thumbAcc: '#E24B4A', pdfCol: '#791F1F', isNew: true },
      ]
    },
    {
      id: 13, date: '19 Mar 2026', isLatest: false,
      labs: [
        { name: 'Fasting blood sugar', lab: 'Thyrocare', val: '148 mg/dL', cat: 'Metabolic', result: 'High', trend: 'dn', thumbBg: '#FAEEDA', thumbAcc: '#BA7517', pdfCol: '#633806', isNew: false },
        { name: 'Urine routine', lab: 'Thyrocare', val: 'Normal', cat: 'Renal', result: 'Normal', trend: 'eq', thumbBg: '#E1F5EE', thumbAcc: '#1D9E75', pdfCol: '#085041', isNew: false },
      ]
    }
  ];

  const initials = patient ? `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase() : '';
  const fullName = patient ? `${patient.first_name} ${patient.last_name}` : '';

  
  const renderOverviewContent = () => (
    <>
      <div className="main-inner">
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
            Overview
          </button>
          <button 
            className={`tab-btn ${activeView === 'clinical-encounters' ? 'active' : ''}`}
            onClick={() => setActiveView('clinical-encounters')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Clinical Encounters
          </button>
          <button 
            className={`tab-btn ${activeView === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveView('prescriptions')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Prescriptions
          </button>
          <button 
            className={`tab-btn ${activeView === 'labs' ? 'active' : ''}`}
            onClick={() => setActiveView('labs')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            Lab Results
          </button>
        </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Vitals over time</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Blood sugar · Blood pressure · Temperature</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="chart-legend">
                  <span className="leg-item"><span className="leg-sq" style={{ background: '#378ADD' }}></span>Sugar (mg/dL)</span>
                  <span className="leg-item"><span className="leg-sq" style={{ borderTop: '2px dashed #D85A30', background: 'none' }}></span>BP sys</span>
                  <span className="leg-item"><span className="leg-sq" style={{ background: '#1D9E75' }}></span>Temp (°F)</span>
                </div>
                <div className="range-btns">
                  <button className={`rbtn ${activeRange === '1M' ? 'active' : ''}`} onClick={() => setActiveRange('1M')}>1M</button>
                  <button className={`rbtn ${activeRange === '3M' ? 'active' : ''}`} onClick={() => setActiveRange('3M')}>3M</button>
                  <button className={`rbtn ${activeRange === '6M' ? 'active' : ''}`} onClick={() => setActiveRange('6M')}>6M</button>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 16px 16px', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} stroke="var(--color-border-secondary)" />
                  <YAxis type="number" domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} stroke="var(--color-border-secondary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-secondary)' }} 
                    itemStyle={{ fontSize: 12, fontWeight: 500 }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-tertiary)" />
                  <Line type="monotone" dataKey="sugar" stroke="#378ADD" strokeWidth={2} dot={{ r: 3, fill: '#378ADD' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="bp" stroke="#D85A30" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#D85A30' }} />
                  <Line type="monotone" dataKey="temp" stroke="#1D9E75" strokeWidth={2} dot={{ r: 3, fill: '#1D9E75' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card-head" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="card-title">Prescriptions</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Last session</div>
                </div>
                <button onClick={() => setActiveView('prescriptions')} className="view-all-btn">View all ↗</button>
              </div>
              <div className="docs-list">
                {prescriptionsData && prescriptionsData.length > 0 && prescriptionsData[0].rxs.map((rx, idx) => (
                  <div key={idx} className="doc-list-item">
                    <div className="doc-list-thumb">
                      <div className="dl-line" style={{ width: '80%' }}></div>
                      <div className="dl-short" style={{ width: '60%' }}></div>
                      <div className="dl-line" style={{ width: '70%' }}></div>
                      <span className="pdf-icon">Rx</span>
                    </div>
                    <div className="doc-list-body">
                      <div className="doc-list-name">{rx.drug}</div>
                      <div className="doc-list-sub">Dr. Ramesh Iyer · Session #{prescriptionsData[0].id}</div>
                      <span className="doc-badge doc-badge-rx">Prescription</span>
                    </div>
                    <div className="doc-list-ts">{prescriptionsData[0].date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="card-title">Lab results</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>This session</div>
                </div>
                <button onClick={() => setActiveView('labs')} className="view-all-btn">View all ↗</button>
              </div>
              <div className="docs-list">
                {mockLabResults[0].labs.map((lab, idx) => (
                  <div key={idx} className="doc-list-item">
                    <div className="doc-list-thumb" style={{ background: lab.thumbBg }}>
                      <div className="dl-line" style={{ width: '80%', background: lab.thumbAcc, opacity: 0.5 }}></div>
                      <div className="dl-short" style={{ width: '60%', background: lab.thumbAcc, opacity: 0.3 }}></div>
                      <div className="dl-line" style={{ width: '70%', background: lab.thumbAcc, opacity: 0.5 }}></div>
                      <span className="pdf-icon" style={{ color: lab.pdfCol }}>PDF</span>
                    </div>
                    <div className="doc-list-body">
                      <div className="doc-list-name">{lab.name}</div>
                      <div className="doc-list-sub">{lab.lab} · {lab.val}</div>
                      <span style={{
                        display: 'inline-flex', fontSize: '10px', padding: '2px 6px', borderRadius: '99px',
                        background: lab.result === 'Normal' ? '#E1F5EE' : (lab.result === 'Danger' ? '#FCEBEB' : '#FAEEDA'),
                        color: lab.result === 'Normal' ? '#085041' : (lab.result === 'Danger' ? '#791F1F' : '#633806'),
                        marginTop: '4px'
                      }}>{lab.result}</span>
                    </div>
                    <div className="doc-list-ts">{mockLabResults[0].date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </>
  );

  const renderPrescriptions = () => {
    let htmlContent = [];
    let totalShown = 0;

    const prescriptions = prescriptionsData || [];

    prescriptions.forEach(sess => {
      const filteredRxs = sess.rxs.filter(rx => {
        if (rxCatFilter !== 'All' && rx.cat !== rxCatFilter) return false;
        if (rxStatusFilter !== 'All' && rx.status !== rxStatusFilter) return false;
        if (rxSearch && !rx.drug.toLowerCase().includes(rxSearch.toLowerCase())) return false;
        return true;
      });
      if (filteredRxs.length === 0) return;
      totalShown += filteredRxs.length;

      htmlContent.push(
        <div key={sess.id} className="session-block">
          <div className="session-header">
            <div className="session-line"></div>
            <div className="session-label">
              <span className="session-badge">Session #{sess.id}</span>
              <span className="session-date">{sess.date}</span>
              {sess.isNew && <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '99px', background: 'var(--color-background-success)', color: 'var(--color-text-success)' }}>Latest</span>}
            </div>
            <div className="session-line"></div>
          </div>
          <div className="rx-grid">
            {filteredRxs.map((rx, idx) => (
              <div key={idx} className="rx-card">
                <div className="rx-thumb">
                  <div className="rx-thumb-line" style={{ width: '85%' }}></div>
                  <div className="rx-thumb-short" style={{ width: '65%' }}></div>
                  <div className="rx-thumb-accent" style={{ width: '75%', background: rx.accent, opacity: 0.35 }}></div>
                  <div className="rx-thumb-short" style={{ width: '55%' }}></div>
                  <div className="rx-thumb-line" style={{ width: '70%' }}></div>
                  <span className="rx-mark">Rx</span>
                  {rx.isNew && <span className="rx-new-badge">New</span>}
                </div>
                <div className="rx-body">
                  <div className="rx-drug">{rx.drug}</div>
                  <div className="rx-detail">{rx.detail}</div>
                  <div className="rx-footer">
                    <span className={rx.status === 'Active' ? 'rx-status-active' : 'rx-status-completed'}>{rx.status}</span>
                    <span className="rx-cat">{rx.cat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })

    return (
      <div className="page view-container">
        <div className="topbar">
          <span className="crumb">
            <a onClick={() => router.push('/patients')} style={{ cursor: 'pointer' }}>Patients</a><span className="crumb-sep">/</span>
            <a onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>{fullName}</a><span className="crumb-sep">/</span>
            <span style={{ color: 'var(--color-text-primary)' }}>Prescriptions</span>
          </span>
        </div>

        <div className="page-head">
          <div className="ph-left">
            <div className="avatar ph-avatar">{initials}</div>
            <div>
              <div className="ph-name">{fullName}</div>
              <div className="ph-sub">Prescription history · All sessions</div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-chip"><div className="sc-n">14</div><div className="sc-l">Sessions</div></div>
            <div className="stat-chip"><div className="sc-n">31</div><div className="sc-l">Prescriptions</div></div>
            <div className="stat-chip"><div className="sc-n">3</div><div className="sc-l">Active now</div></div>
          </div>
        </div>

        <div className="filters">
          <div className="search-wrap">
            <svg className="search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
            <input type="text" placeholder="Search drug name..." value={rxSearch} onChange={(e) => setRxSearch(e.target.value)} />
          </div>
          <div className="fbtns">
            {['All', 'Diabetes', 'Hypertension', 'Cardiac', 'Supplement'].map(cat => (
              <button key={cat} className={`fbtn ${rxCatFilter === cat ? 'on' : ''}`} onClick={() => setRxCatFilter(cat)}>{cat}</button>
            ))}
          </div>
          <div className="fbtns">
            {['All', 'Active', 'Completed', 'Modified'].map(st => (
              <button key={st} className={`fbtn ${rxStatusFilter === st ? 'on' : ''}`} onClick={() => setRxStatusFilter(st)}>{st === 'All' ? 'All status' : st}</button>
            ))}
          </div>
        </div>

        <div className="timeline">
          {prescriptionsLoading ? (
            <div className="empty">Loading prescriptions...</div>
          ) : prescriptionsError ? (
            <div className="empty" style={{ color: 'red' }}>Error loading prescriptions</div>
          ) : !prescriptionsData?.length ? (
            <div className="empty">No prescriptions found for this patient.</div>
          ) : totalShown > 0 ? (
            <>{htmlContent}</>
          ) : (
            <div className="empty">No prescriptions match your filters.</div>
          )}
        </div>
      </div>
    );
  };

  const renderClinicalEncounters = () => {

    return (
      <div className="page view-container">
        <div className="topbar">
          <span className="crumb">
            <a onClick={() => router.push('/patients')} style={{ cursor: 'pointer' }}>Patients</a><span className="crumb-sep">/</span>
            <a onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>{fullName}</a><span className="crumb-sep">/</span>
            <span style={{ color: 'var(--color-text-primary)' }}>Clinical Encounters</span>
          </span>
        </div>

        <div className="page-head">
          <div className="ph-left">
            <div className="avatar ph-avatar" style={{ background: '#F0F9FF', color: '#0369A1' }}>{initials}</div>
            <div>
              <div className="ph-name">{fullName}</div>
              <div className="ph-sub">Clinical encounter history · All visits</div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-chip"><div className="sc-n">{encounters?.length || 0}</div><div className="sc-l">Total Visits</div></div>
            <div className="stat-chip"><div className="sc-n">{encounters?.filter((e: any) => e.status === 'COMPLETED').length || 0}</div><div className="sc-l">Completed</div></div>
            <div className="stat-chip"><div className="sc-n">{encounters?.filter((e: any) => new Date(e.visit_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0}</div><div className="sc-l">Last 30 Days</div></div>
          </div>
        </div>

        <div className="encounters-list">
          {encountersLoading ? (
            <div className="empty">Loading clinical encounters...</div>
          ) : encountersError ? (
            <div className="empty" style={{ color: 'red' }}>Error loading encounters</div>
          ) : !encounters?.length ? (
            <div className="empty">No clinical encounters found.</div>
          ) : (
            encounters.map((encounter: any) => (
              <div key={encounter.id} className="encounter-card">
                <div className="encounter-header">
                  <div className="encounter-date">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {new Date(encounter.visit_date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="encounter-doctor">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {encounter.doctor_name}
                  </div>
                  <span className={`status-badge ${encounter.status.toLowerCase()}`}>
                    {encounter.status}
                  </span>
                </div>
                <div className="encounter-content">
                  <div className="encounter-section">
                    <h4>Chief Complaint</h4>
                    <p>{encounter.chief_complaint}</p>
                  </div>
                  <div className="encounter-section">
                    <h4>Assessment</h4>
                    <p>{encounter.assessment}</p>
                  </div>
                  <div className="encounter-section">
                    <h4>Diagnosis</h4>
                    <p>{encounter.diagnosis}</p>
                  </div>
                  <div className="encounter-section">
                    <h4>Treatment Plan</h4>
                    <p>{encounter.treatment_plan}</p>
                  </div>
                </div>
                <div className="encounter-actions">
                  <button className="btn btn-sm btn-secondary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    Export
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderLabResults = () => {
    let htmlContent = [];
    let total = 0, sessCount = 0, abn = 0, norm = 0;

    // Group lab results by test_date (sessions)
    const labResultsByDate = labResultsData?.reduce((acc: any, lab: any) => {
      const date = lab.test_date;
      if (!acc[date]) {
        acc[date] = {
          id: date,
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          labs: []
        };
      }
      acc[date].labs.push(lab);
      return acc;
    }, {}) || {};

    Object.values(labResultsByDate).forEach((sess: any) => {
      const filteredLabs = sess.labs.filter((l: any) => {
        if (labCatFilter !== 'All' && l.test_category !== labCatFilter) return false;
        const isAbnormal = l.abnormal_flag === 'HIGH' || l.abnormal_flag === 'LOW' || l.abnormal_flag === 'CRITICAL';
        if (labStatusFilter === 'Normal' && isAbnormal) return false;
        if (labStatusFilter === 'Abnormal' && !isAbnormal) return false;
        if (labSearch && !l.test_name.toLowerCase().includes(labSearch.toLowerCase())) return false;
        return true;
      });
      if (filteredLabs.length === 0) return;
      
      total += filteredLabs.length;
      sessCount++;
      filteredLabs.forEach((l: any) => {
        const isAbnormal = l.abnormal_flag === 'HIGH' || l.abnormal_flag === 'LOW' || l.abnormal_flag === 'CRITICAL';
        if (isAbnormal) abn++; else norm++;
      });

      const isLatest = sess.date === (Object.values(labResultsByDate)[0] as any)?.date;

      htmlContent.push(
        <div key={sess.id} className="sess-block">
          <div className="sess-header">
            <div className="sess-line"></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
              <span className="sess-badge">Session {sess.date}</span>
              {isLatest && <span style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '99px', background: '#E1F5EE', color: '#085041' }}>Latest</span>}
            </div>
            <div className="sess-line"></div>
          </div>
          <div className="lab-grid">
            {filteredLabs.map((l: any, idx: number) => {
              const isAbnormal = l.abnormal_flag === 'HIGH' || l.abnormal_flag === 'LOW' || l.abnormal_flag === 'CRITICAL';
              const resultColor = isAbnormal ? '#E24B4A' : '#1D9E75';
              const thumbBg = isAbnormal ? '#FCEBEB' : '#E1F5EE';
              
              return (
                <div key={idx} className="lab-card">
                  <div className="lab-thumb" style={{ background: thumbBg }}>
                    <div className="tl tl-solid" style={{ width: '85%', background: resultColor, opacity: 0.3 }}></div>
                    <div className="tl tl-faint" style={{ width: '70%' }}></div>
                    <div className="tl tl-solid" style={{ width: '90%', background: resultColor, opacity: 0.2 }}></div>
                    <div className="tl tl-faint" style={{ width: '55%' }}></div>
                    <span className="pdf-lbl" style={{ color: resultColor }}>
                      {l.file_name ? 'FILE' : 'PDF'}
                    </span>
                  </div>
                  <div className="lab-body">
                    <div className="lab-name">{l.test_name}</div>
                    <div className="lab-lab">{l.test_category}</div>
                    <div className="lab-val" style={{ color: resultColor }}>
                      {l.result_value} {l.unit}
                    </div>
                    <div className="lab-footer">
                      <span className={`badge ${isAbnormal ? 'b-danger' : 'b-normal'}`}>
                        {isAbnormal ? 'Abnormal' : 'Normal'}
                      </span>
                      <span className="lab-cat">{l.test_category}</span>
                    </div>
                    {l.file_name && (
                      <div className="lab-file-actions" style={{ marginTop: '8px' }}>
                        <button
                          onClick={() => {
                            // Mock file download for web version
                            alert(`Download ${l.file_name} (${(l.file_size! / 1024 / 1024).toFixed(2)} MB)\n\nWeb version demo: File download would be triggered here.`);
                          }}
                          style={{
                            fontSize: '11px',
                            color: '#378ADD',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Download {l.file_name}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="page view-container">
        <div className="topbar">
          <span className="crumb">
            <a onClick={() => router.push('/patients')} style={{ cursor: 'pointer' }}>Patients</a><span className="crumb-sep">/</span>
            <a onClick={() => setActiveView('overview')} style={{ cursor: 'pointer' }}>{fullName}</a><span className="crumb-sep">/</span>
            <span style={{ color: 'var(--color-text-primary)' }}>Lab results</span>
          </span>
        </div>

        <div className="page-head">
          <div className="ph-left">
            <div className="avatar ph-avatar" style={{ background: '#E1F5EE', color: '#085041' }}>{initials}</div>
            <div>
              <div className="ph-name">{fullName}</div>
              <div className="ph-sub">Lab results history · All sessions</div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-chip"><div className="sc-n">{total}</div><div className="sc-l">Reports</div></div>
            <div className="stat-chip"><div className="sc-n">{sessCount}</div><div className="sc-l">Sessions</div></div>
            <div className="stat-chip"><div className="sc-n">{abn}</div><div className="sc-l">Abnormal</div></div>
            <div className="stat-chip"><div className="sc-n">{norm}</div><div className="sc-l">Normal</div></div>
          </div>
        </div>

        <div className="filters">
          <div className="search-wrap srch-wrap">
            <svg className="search-ico srch-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
            <input type="text" placeholder="Search test name..." value={labSearch} onChange={(e) => setLabSearch(e.target.value)} />
          </div>
          <div className="fbtns">
            {['All', 'Metabolic', 'Lipid', 'Renal', 'Haematology', 'Thyroid', 'Vitamin'].map(cat => (
              <button key={cat} className={`fbtn ${labCatFilter === cat ? 'on' : ''}`} onClick={() => setLabCatFilter(cat)}>{cat}</button>
            ))}
          </div>
          <div className="fbtns">
            {['All', 'Normal', 'Abnormal'].map(st => (
              <button key={st} className={`fbtn ${labStatusFilter === st ? 'on' : ''}`} onClick={() => setLabStatusFilter(st)}>{st === 'All' ? 'All results' : st}</button>
            ))}
          </div>
        </div>

        <div className="timeline">
          {labResultsLoading ? (
            <div className="empty">Loading lab results...</div>
          ) : labResultsError ? (
            <div className="empty" style={{ color: 'red' }}>Error loading lab results</div>
          ) : !labResultsData?.length ? (
            <div className="empty">No lab results found for this patient.</div>
          ) : total > 0 ? (
            <>{htmlContent}</>
          ) : (
            <div className="empty">No lab results match your filters.</div>
          )}
        </div>
      </div>
    );
  };

  const renderContentOrError = () => {
    if (isLoading) return <div className="empty" style={{ padding: '40px', textAlign: 'center' }}>Loading patient data...</div>;
    if (error) return <div className="empty" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error instanceof Error ? error.message : 'Unknown error fetching patient details.'}</div>;
    if (!patient) return <div className="empty" style={{ padding: '40px', textAlign: 'center' }}>Patient not found in database.</div>;

    if (activeView === 'overview') return renderOverviewContent();
    if (activeView === 'clinical-encounters') return renderClinicalEncounters();
    if (activeView === 'prescriptions') return renderPrescriptions();
    if (activeView === 'labs') return renderLabResults();
    
    return renderOverviewContent(); // Default fallback
  };

  return (
    <Layout title={patient ? fullName : "Patient Details"}>
      <Head>
        <title>{patient ? `${fullName} — AegisChart` : 'Patient Details'}</title>
      </Head>
      <div className="patient-detail-page">
        <div className="shell">
          <div className="topbar">
            <button className="back-btn" onClick={() => router.push('/patients')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Patients
            </button>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>/ {patient ? fullName : 'Details'}</span>
            {patient && <span className="apt"><span className="dot"></span>{patient.status || 'Active'}</span>}
          </div>
          
          {patient && activeView === 'overview' && (
            <div className="sidebar">
              <div className="avatar-section">
                <div className="avatar">{initials}</div>
                <div>
                  <div className="pt-name">{fullName}</div>
                  <div className="pt-id">#{String(patient.id).substring(0,8)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span className="vital-badge vb-ok">BP stable</span>
                  <span className="vital-badge vb-warn">Sugar elevated</span>
                </div>
              </div>

              <div className="info-section">
                <div className="sec-label">Personal</div>
                <div className="info-row"><span className="info-key">Age</span><span className="info-val">{getAge(patient.date_of_birth)} years</span></div>
                <div className="info-row"><span className="info-key">Date of birth</span><span className="info-val">{patient.date_of_birth}</span></div>
                <div className="info-row"><span className="info-key">Gender</span><span className="info-val">{patient.gender}</span></div>
                <div className="info-row"><span className="info-key">Blood type</span><span className="info-val"><span className="blood-badge">{patient.blood_type || 'O+'}</span></span></div>
              </div>

              <div className="info-section">
                <div className="sec-label">Contact</div>
                <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{patient.phone}</span></div>
                <div className="info-row"><span className="info-key">Email</span><span className="info-val" style={{ fontSize: '11px' }}>{patient.email}</span></div>
                <div className="info-row"><span className="info-key">City</span><span className="info-val">{patient.city}</span></div>
                <div className="info-row"><span className="info-key">Country</span><span className="info-val">{patient.country}</span></div>
              </div>

              <div className="info-section">
                <div className="sec-label">Medical</div>
                <div className="info-row"><span className="info-key">Insurance</span><span className="info-val">{patient.insurance_provider}</span></div>
                <div className="info-row"><span className="info-key">Policy no.</span><span className="info-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{patient.insurance_policy_number}</span></div>
                <div style={{ marginTop: '6px' }}>
                  <div className="info-key" style={{ marginBottom: '5px' }}>Allergies</div>
                  {(patient.allergies ? String(patient.allergies).split(',') : ['Penicillin']).map((a: string, i: number) => (
                    <span key={i} className="allergy-tag">{a.trim()}</span>
                  ))}
                </div>
              </div>

              <div className="info-section">
                <div className="sec-label">Emergency contact</div>
                <div className="info-row"><span className="info-key">Name</span><span className="info-val">{patient.emergency_contact_name}</span></div>
                <div className="info-row"><span className="info-key">Phone</span><span className="info-val">{patient.emergency_contact_phone}</span></div>
              </div>

              <div className="info-section" style={{ borderBottom: 'none' }}>
                <div className="sec-label">Medical history</div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{patient.medical_history || 'Type 2 diabetes (2019), hypertension (2021). Prior appendectomy (2015). Family history of cardiac disease.'}</p>
              </div>
            </div>
          )}
          
          <div className="main" style={{ gridColumn: (patient && activeView === 'overview') ? '2' : '1 / -1' }}>
            {renderContentOrError()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .patient-detail-page {
          --color-background-primary: hsl(var(--surface-1));
          --color-background-secondary: hsl(var(--surface-2));
          --color-background-tertiary: hsl(var(--background));
          --color-border-primary: hsl(var(--border));
          --color-border-secondary: hsl(var(--border) / 0.5);
          --color-border-tertiary: hsl(var(--border) / 0.3);
          --color-text-primary: hsl(var(--text-primary));
          --color-text-secondary: hsl(var(--text-secondary));
          --color-text-tertiary: hsl(var(--text-muted));
          --color-background-success: rgba(34, 197, 94, 0.12);
          --color-text-success: #16a34a;
          --font-sans: inherit;
          --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
          --border-radius-md: 6px;
          --border-radius-lg: 10px;
          padding: 1rem 0;
        }

        /* Overview View Styles */
        .shell { display: grid; grid-template-columns: 280px 1fr; min-height: 900px; background: var(--color-background-tertiary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; }
        .sidebar { background: var(--color-background-primary); border-right: 0.5px solid var(--color-border-tertiary); display: flex; flex-direction: column; overflow-y: auto; }
        .main { display: flex; flex-direction: column; gap: 0; overflow-y: auto; }
        .topbar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); grid-column: 1 / -1; }
        .back-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--color-text-secondary); cursor: pointer; padding: 5px 10px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: transparent; }
        .back-btn:hover { background: var(--color-background-secondary); }
        .apt { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 99px; background: var(--color-background-success); color: var(--color-text-success); margin-left: auto; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-success); }
        .avatar-section { padding: 20px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .avatar { width: 68px; height: 68px; border-radius: 50%; background: #E6F1FB; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 500; color: #185FA5; flex-shrink: 0; }
        .pt-name { font-size: 15px; font-weight: 500; color: var(--color-text-primary); text-align: center; }
        .pt-id { font-size: 11px; color: var(--color-text-tertiary); text-align: center; font-family: var(--font-mono); }
        .info-section { padding: 14px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .sec-label { font-size: 10px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-tertiary); margin-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; gap: 8px; }
        .info-key { font-size: 12px; color: var(--color-text-secondary); }
        .info-val { font-size: 12px; font-weight: 500; color: var(--color-text-primary); text-align: right; }
        .blood-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; background: #FCEBEB; color: #791F1F; }
        .allergy-tag { display: inline-block; font-size: 11px; padding: 2px 7px; border-radius: 99px; background: #FAEEDA; color: #633806; margin: 2px 2px 0 0; }
        .vital-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; border-radius: var(--border-radius-md); font-weight: 500; }
        .vb-ok { background: #EAF3DE; color: #27500A; }
        .vb-warn { background: #FAEEDA; color: #633806; }
        .main-inner { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); }
        .card-title { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .chart-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: var(--color-text-secondary); }
        .leg-item { display: flex; align-items: center; gap: 4px; }
        .leg-sq { width: 10px; height: 3px; border-radius: 2px; }
        .range-btns { display: flex; gap: 4px; }
        .rbtn { font-size: 11px; padding: 3px 8px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
        .rbtn.active { background: var(--color-background-secondary); color: var(--color-text-primary); border-color: var(--color-border-primary); }
        .view-all-btn { font-size: 11px; padding: 4px 10px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .docs-list { display: flex; flex-direction: column; gap: 0; }
        .doc-list-item { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 0.5px solid var(--color-border-tertiary); cursor: pointer; }
        .doc-list-item:hover { background: var(--color-background-secondary); }
        .doc-list-thumb { width: 44px; height: 56px; border-radius: var(--border-radius-md); background: var(--color-background-secondary); border: 0.5px solid var(--color-border-secondary); display: flex; flex-direction: column; gap: 3px; padding: 6px; flex-shrink: 0; overflow: hidden; position: relative; }
        .pdf-icon { position: absolute; bottom: 4px; right: 4px; font-size: 9px; font-weight: 500; color: var(--color-text-tertiary); font-family: var(--font-mono); }
        .dl-line { height: 3px; border-radius: 1px; background: var(--color-border-secondary); }
        .dl-short { height: 3px; border-radius: 1px; background: var(--color-border-tertiary); }
        .doc-list-body { flex: 1; min-width: 0; }
        .doc-list-name { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
        .doc-list-sub { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }
        .doc-list-ts { font-size: 11px; color: var(--color-text-tertiary); white-space: nowrap; flex-shrink: 0; }
        .doc-badge { display: inline-flex; font-size: 10px; padding: 2px 6px; border-radius: 99px; margin-top: 4px; }
        .doc-badge-rx { background: #E6F1FB; color: #0C447C; }

        /* Child Views (Prescriptions / Labs) */
        .view-container { background: var(--color-background-tertiary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; }
        .crumb { font-size: 12px; color: var(--color-text-tertiary); display: flex; align-items: center; gap: 5px; }
        .crumb a { color: var(--color-text-secondary); text-decoration: none; }
        .crumb a:hover { color: var(--color-text-primary); }
        .crumb-sep { color: var(--color-border-secondary); }
        .page-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; background: var(--color-background-primary); border-bottom: 0.5px solid var(--color-border-tertiary); flex-wrap: wrap; gap: 10px; }
        .ph-left { display: flex; align-items: center; gap: 12px; }
        .ph-avatar { width: 40px; height: 40px; font-size: 13px; }
        .ph-name { font-size: 15px; font-weight: 500; color: var(--color-text-primary); }
        .ph-sub { font-size: 12px; color: var(--color-text-tertiary); margin-top: 1px; }
        .stats-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .stat-chip { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 6px 12px; text-align: center; }
        .sc-n { font-size: 16px; font-weight: 500; color: var(--color-text-primary); }
        .sc-l { font-size: 11px; color: var(--color-text-tertiary); margin-top: 1px; }
        .filters { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: var(--color-background-primary); border-bottom: 0.5px solid var(--color-border-tertiary); flex-wrap: wrap; }
        .search-wrap { position: relative; flex: 1; min-width: 180px; }
        .search-wrap input { width: 100%; padding: 6px 10px 6px 30px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-secondary); font-size: 12px; color: var(--color-text-primary); outline: none; }
        .search-wrap input:focus { border-color: var(--color-border-primary); }
        .search-ico { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); pointer-events: none; }
        .fbtns { display: flex; gap: 4px; flex-wrap: wrap; }
        .fbtn { font-size: 11px; padding: 5px 10px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
        .fbtn.on { background: var(--color-background-secondary); color: var(--color-text-primary); border-color: var(--color-border-primary); }
        .timeline { padding: 18px; display: flex; flex-direction: column; gap: 24px; }
        .session-block { margin-bottom: 0; }
        .session-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .session-line { flex: 1; height: 0.5px; background: var(--color-border-tertiary); }
        .session-label { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .session-badge { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 99px; background: var(--color-background-secondary); color: var(--color-text-secondary); border: 0.5px solid var(--color-border-secondary); }
        .session-date { font-size: 11px; color: var(--color-text-tertiary); }
        .rx-grid, .lab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .rx-card, .lab-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; cursor: pointer; transition: border-color .15s; }
        .rx-card:hover, .lab-card:hover { border-color: var(--color-border-secondary); }
        .rx-thumb, .lab-thumb { width: 100%; height: 120px; background: var(--color-background-secondary); border-bottom: 0.5px solid var(--color-border-tertiary); display: flex; flex-direction: column; padding: 12px 14px; gap: 5px; position: relative; overflow: hidden; }
        .rx-thumb-line { height: 4px; border-radius: 2px; background: var(--color-border-secondary); }
        .rx-thumb-short { height: 4px; border-radius: 2px; background: var(--color-border-tertiary); }
        .rx-thumb-accent { height: 4px; border-radius: 2px; }
        .rx-mark { position: absolute; bottom: 10px; right: 12px; font-size: 22px; font-weight: 500; color: var(--color-border-secondary); font-family: var(--font-serif); line-height: 1; }
        .rx-new-badge, .new-lbl { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 99px; background: #EAF3DE; color: #27500A; }
        .rx-body, .lab-body { padding: 10px 12px; }
        .rx-drug, .lab-name { font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 2px; }
        .rx-detail, .lab-lab { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 6px; }
        .rx-footer, .lab-footer { display: flex; align-items: center; justify-content: space-between; }
        .rx-cat, .lab-cat { display: inline-flex; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 99px; background: #E6F1FB; color: #0C447C; }
        .rx-status-active { display: inline-flex; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 99px; background: #EAF3DE; color: #27500A; }
        .rx-status-completed { display: inline-flex; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 99px; background: var(--color-background-secondary); color: var(--color-text-tertiary); }
        
        .tl { height: 4px; border-radius: 2px; }
        .tl-solid { background: var(--color-border-secondary); }
        .tl-faint { background: var(--color-border-tertiary); }
        .pdf-lbl { position: absolute; bottom: 9px; right: 11px; font-size: 10px; font-weight: 500; letter-spacing: .04em; font-family: var(--font-mono); }
        .lab-val { font-size: 12px; font-weight: 500; margin-bottom: 6px; }
        .badge { display: inline-flex; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 99px; }
        .b-normal { background: #E1F5EE; color: #085041; }
        .b-high { background: #FAEEDA; color: #633806; }
        .b-danger { background: #FCEBEB; color: #791F1F; }
        .lab-cat { background: var(--color-background-secondary); color: var(--color-text-secondary); }
        
        /* Tab Navigation */
        .tab-nav {
          display: flex;
          gap: 0;
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          margin-bottom: 14px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          border-right: 0.5px solid var(--color-border-tertiary);
          flex: 1;
          justify-content: center;
        }
        .tab-btn:last-child {
          border-right: none;
        }
        .tab-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .tab-btn.active {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          border-bottom: 2px solid hsl(var(--brand));
        }
        .tab-btn svg {
          flex-shrink: 0;
        }

        /* Clinical Encounters Styles */
        .encounters-list {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .encounter-card {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .encounter-card:hover {
          border-color: var(--color-border-secondary);
        }
        .encounter-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--color-background-secondary);
          border-bottom: 0.5px solid var(--color-border-tertiary);
        }
        .encounter-date, .encounter-doctor {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .status-badge {
          display: inline-flex;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 99px;
          margin-left: auto;
        }
        .status-badge.completed {
          background: #E1F5EE;
          color: #085041;
        }
        .status-badge.active {
          background: #E6F1FB;
          color: #0C447C;
        }
        .status-badge.pending {
          background: #FAEEDA;
          color: #633806;
        }
        .encounter-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .encounter-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .encounter-section p {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        .encounter-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-background-secondary);
          border-top: 0.5px solid var(--color-border-tertiary);
        }
        .btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          border-radius: var(--border-radius-md);
          border: 0.5px solid var(--color-border-secondary);
          background: transparent;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:hover {
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }
        .btn.btn-primary {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }
        .btn.btn-primary:hover {
          background: hsl(var(--brand) / 0.9);
        }
        .btn.btn-sm {
          padding: 4px 8px;
          font-size: 10px;
        }
        .btn.btn-secondary {
          background: var(--color-background-primary);
          color: var(--color-text-secondary);
        }
        .btn.btn-secondary:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }

        .empty { padding: 32px; text-align: center; color: var(--color-text-tertiary); font-size: 13px; }
      `}</style>
    </Layout>
  )
}
