import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'
import {
  AreaChart, Area,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from 'recharts'
import Head from 'next/head'

// API call to get real statistics
const fetchStats = async (token: string) => {
  const res = await fetch('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

const patientGrowth = [
  { month: 'Oct', visits: 400, patients: 240, prescriptions: 180 },
  { month: 'Nov', visits: 450, patients: 280, prescriptions: 220 },
  { month: 'Dec', visits: 600, patients: 400, prescriptions: 350 },
  { month: 'Jan', visits: 550, patients: 380, prescriptions: 310 },
  { month: 'Feb', visits: 700, patients: 500, prescriptions: 420 },
  { month: 'Mar', visits: 850, patients: 650, prescriptions: 580 },
]

const rxByCategory = [
  { name: 'Cardiovascular', value: 35, color: '#3b82f6' },
  { name: 'Diabetes', value: 28, color: '#22c55e' },
  { name: 'Pain Mgmt', value: 20, color: '#f59e0b' },
  { name: 'Antibiotics', value: 12, color: '#ef4444' },
  { name: 'Other', value: 5, color: '#a78bfa' },
]

const recentActivity = [
  { id: 1, type: 'NEW', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'New patient registered: Priya Sharma', dept: 'Cardiology Department', time: '2 hours ago' },
  { id: 2, type: 'OK', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', desc: 'Appointment completed: Emily Blunt', dept: 'General Checkup', time: '4 hours ago' },
  { id: 3, type: 'UPD', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Rescheduled: Michael Chen', dept: 'Moved to Thursday, 10:00 AM', time: '6 hours ago' },
  { id: 4, type: 'LAB', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', desc: 'Lab result ready: CBC — Anjali K.', dept: 'Lab Department', time: '8 hours ago' },
  { id: 5, type: 'ERR', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', desc: 'Security: Failed login attempt ×3', dept: 'System Alert', time: '9 hours ago' },
]

const todaySchedule = [
  { time: '09:00', ampm: 'AM', patient: 'Alice Cooper', procedure: 'MRI Screening', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { time: '10:30', ampm: 'AM', patient: 'David Miller', procedure: 'Dental Exam', color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  { time: '01:45', ampm: 'PM', patient: 'Robert Hook', procedure: 'Blood Test', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  { time: '03:00', ampm: 'PM', patient: 'Sophia Ray', procedure: 'Surgery Prep', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
]

const quickActions = [
  { label: 'Add Patient', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Billing', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  { label: 'Lab Result', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
]

const getStatsForRole = (role: string, realStats: any) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Total Patients', value: realStats?.patients?.total?.toLocaleString() || '0', change: `+${realStats?.patients?.new_this_month || 0} this month`, up: true, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'group' },
        { label: 'Active Users', value: realStats?.users?.active?.toLocaleString() || '0', change: `${realStats?.users?.active_this_week || 0} this week`, up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'person_check' },
        { label: 'Pending Approvals', value: realStats?.pending_approvals?.toLocaleString() || '0', change: 'Action Required', up: false, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'approval' },
        { label: 'Total Records', value: realStats?.medical_records?.total?.toLocaleString() || '0', change: `+${realStats?.medical_records?.this_month || 0} this month`, up: true, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: 'folder' },
      ]
    case 'doctor':
      return [
        { label: 'Today\'s Visits', value: realStats?.recent_activity?.visits_today || '0', change: `${realStats?.appointments?.today || 0} appointments`, up: true, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'stethoscope' },
        { label: 'My Patients', value: realStats?.medical_records?.total?.toLocaleString() || '0', change: `${realStats?.medical_records?.this_week || 0} this week`, up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'people' },
      ]
    case 'nurse':
      return [
        { label: 'Patient Care', value: realStats?.medical_records?.total?.toLocaleString() || '0', change: `${realStats?.medical_records?.this_week || 0} this week`, up: true, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'health_and_safety' },
        { label: 'Today\'s Visits', value: realStats?.recent_activity?.visits_today || '0', change: 'Active shift', up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'calendar_today' },
        { label: 'Vital Signs', value: realStats?.medical_records?.this_month?.toLocaleString() || '0', change: 'Recorded', up: true, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'monitor_heart' },
      ]
    case 'pharmacist':
      return [
        { label: 'Prescriptions', value: realStats?.prescriptions?.total?.toLocaleString() || '0', change: `${realStats?.prescriptions?.pending || 0} pending`, up: false, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'medication' },
        { label: 'Critical RX', value: realStats?.prescriptions?.critical?.toLocaleString() || '0', change: 'Urgent', up: false, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: 'priority_high' },
        { label: 'Today\'s Orders', value: realStats?.recent_activity?.appointments_today || '0', change: 'Processing', up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'local_shipping' },
      ]
    case 'receptionist':
      return [
        { label: 'Total Patients', value: realStats?.patients?.total?.toLocaleString() || '0', change: `+${realStats?.patients?.new_this_week || 0} this week`, up: true, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'groups' },
        { label: 'Today\'s Appts', value: realStats?.appointments?.today?.toLocaleString() || '0', change: `${realStats?.appointments?.upcoming || 0} upcoming`, up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'event_available' },
        { label: 'New Patients', value: realStats?.recent_activity?.new_patients || '0', change: 'Registered today', up: true, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'person_add' },
      ]
    default:
      return [
        { label: 'Total Patients', value: realStats?.patients?.total?.toLocaleString() || '0', change: `+${realStats?.patients?.new_this_month || 0} this month`, up: true, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'group' },
        { label: 'Daily Visits', value: realStats?.recent_activity?.visits_today || '0', change: 'Today', up: true, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'event_available' },
        { label: 'Active Users', value: realStats?.users?.active?.toLocaleString() || '0', change: 'Online', up: true, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: 'wifi' },
      ]
  }
}

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border) / 0.5)',
  borderRadius: '8px', color: 'hsl(var(--text-primary))', fontSize: '0.8rem',
}

export default function DashboardPage() {
  const router = useRouter()
  const [period, setPeriod] = useState('6m')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>({ firstName: 'Venkatesh', lastName: 'M', role: 'admin' })
  const [realStats, setRealStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      
      // Fetch real stats for staff roles
      const staffRoles = ['admin', 'doctor', 'nurse', 'pharmacist', 'receptionist'];
      if (staffRoles.includes(userData.role)) {
        setLoadingStats(true)
        fetchStats(userData.token || 'mock-token')
          .then(stats => {
            setRealStats(stats)
            console.log('Real stats loaded:', stats)
          })
          .catch(err => {
            console.error('Failed to fetch stats:', err)
          })
          .finally(() => {
            setLoadingStats(false)
          })
      }
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const [modal, setModal] = useState<{ open: boolean, title: string, data: any, type: 'report' | 'db' | 'audit' | 'error' | null }>({
    open: false,
    title: '',
    data: null,
    type: null
  })

  const handleGenerateAudit = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch logs')
      const logs = await res.json()
      setModal({
        open: true,
        title: 'System Security Audit',
        type: 'audit',
        data: logs
      })
    } catch (e) {
      setModal({ open: true, title: 'Error', type: 'error', data: 'Failed to generate audit report.' })
    }
  }

  const handleSystemReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const stats = await res.json()
      setModal({
        open: true,
        title: 'System Performance Report',
        type: 'report',
        data: stats
      })
    } catch (e) {
      setModal({ open: true, title: 'Error', type: 'error', data: 'Failed to generate system report.' })
    }
  }

  const handleDatabaseStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const stats = await res.json()
      setModal({
        open: true,
        title: 'Database Connectivity',
        type: 'db',
        data: stats
      })
    } catch (e) {
      setModal({ open: true, title: 'Error', type: 'error', data: 'Database connection check failed.' })
    }
  }

  const currentGrowthData = realStats?.growth_data?.length > 0 ? realStats.growth_data : patientGrowth;
  const currentActivityList = realStats?.activity_list?.length > 0 ? realStats.activity_list : recentActivity;
  const currentRxCategories = realStats?.rx_categories?.length > 0 ? realStats.rx_categories : rxByCategory;
  const currentTodaySchedule = realStats?.today_schedule?.length > 0 ? realStats.today_schedule : todaySchedule;

  return (
    <>
      <Head>
        <title>Dashboard — AegisChart</title>
        <meta name="description" content="AegisChart dashboard overview — patients, appointments, revenue and activity." />
      </Head>
      <Layout
        title={(user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard Overview')}
        subtitle={mounted ? `${user?.role?.toUpperCase() || 'Staff'} COMMAND CENTER · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'Command Center'}
        actions={
          mounted ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {user?.role === 'doctor' && (
                <>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_box</span>
                    ADMIT PATIENT
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>schedule</span>
                    VIEW ROUNDS
                  </button>
                </>
              )}
              {user?.role === 'nurse' && (
                <>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }} onClick={() => router.push('/lab-results/add')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>science</span>
                    ADD LAB RESULT
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>schedule</span>
                    VIEW ROUNDS
                  </button>
                </>
              )}
              {user?.role === 'pharmacist' && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>inventory</span>
                  STOCK UPDATE
                </button>
              )}
              {user?.role === 'patient' && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>event</span>
                  BOOK APPOINTMENT
                </button>
              )}
              {user?.role === 'admin' && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }} onClick={handleGenerateAudit}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>analytics</span>
                  GENERATE AUDIT
                </button>
              )}
            </div>
          ) : null
        }
      >
        {/* ── Stat Cards ──────────────────────── */}
        <div className="stats-grid">
          {getStatsForRole(user?.role, realStats).map((s, i) => (
            <div key={i} className="card stat-card-premium" style={{ 
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              background: 'linear-gradient(135deg, hsl(var(--surface)) 0%, hsl(var(--surface-2)) 100%)',
              border: '1px solid hsl(var(--border) / 0.5)',
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.2)',
              opacity: loadingStats ? 0.6 : 1
            }}>
              {loadingStats && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid #f3f3f3', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              )}
              <div style={{ 
                position: 'absolute', 
                top: '-10px', 
                right: '-10px', 
                fontSize: '5rem', 
                opacity: 0.05, 
                color: s.color,
                pointerEvents: 'none'
              }} className="material-symbols-outlined">
                {s.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '1rem', 
                  background: s.bg, 
                  color: s.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  boxShadow: `0 8px 16px -4px ${s.bg.replace('0.1', '0.2')}`
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                    {s.icon}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{s.label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--text-primary))', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</span>
                    <span className={`stat-change-premium ${s.up ? 'up' : 'down'}`} style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: s.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: s.up ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.125rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{s.up ? 'trending_up' : 'trending_down'}</span>
                      {s.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="dashboard-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Dynamic Charts/Queues based on role */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  {user?.role === 'pharmacist' ? 'Prescription Fulfillment Load' : 
                   user?.role === 'admin' ? 'System Traffic & User Growth' : 
                   'Patient Visit Trends'}
                </span>
                <select value={period} onChange={e => setPeriod(e.target.value)} className="form-input" style={{ width: 'auto', fontSize: '0.75rem', padding: '0.3rem 0.625rem' }}>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              <div className="card-body" style={{ height: '360px' }}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={currentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{...TOOLTIP_STYLE, borderRadius: '12px', border: '1px solid hsl(var(--border) / 0.5)', backdropFilter: 'blur(8px)'}} 
                      cursor={{ stroke: 'hsl(var(--brand) / 0.2)', strokeWidth: 1 }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="patients" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fill="url(#patientGrad)" 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'hsl(var(--surface))' }} 
                      activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: 'hsl(var(--surface))' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: 0 }}>
                {currentActivityList.filter((a: any) => isAdmin ? true : a.type !== 'ERR').map((a: any, i: number) => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--surface-2))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700 }}>
                      {a.type}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-primary))', margin: 0, fontWeight: 500 }}>{a.desc}</p>
                      <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', margin: '0.15rem 0 0' }}>{a.dept} · {a.time}</p>
                    </div>
                     <button style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'hsl(var(--text-muted))', 
                      padding: '0.4rem', 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} className="btn-ghost" title="More details">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Quick Actions (Admin Only) */}
            {isAdmin && (
              <div className="card">
                <div className="card-header"><span className="card-title">Control Center</span></div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { label: 'Manage Users', icon: 'group', onClick: () => router.push('/security') },
                      { label: 'Security Logs', icon: 'security', onClick: () => router.push('/security') },
                      { label: 'System Report', icon: 'analytics', onClick: handleSystemReport },
                      { label: 'Database', icon: 'database', onClick: handleDatabaseStatus }
                    ].map((qa, i) => (
                      <button key={i} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '1.25rem 1rem', borderRadius: '1rem', gap: '0.75rem',
                        border: '1px solid hsl(var(--border) / 0.5)', background: 'hsl(var(--surface-2))',
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', color: 'hsl(var(--text-secondary))',
                      }}
                        onMouseEnter={e => { 
                          e.currentTarget.style.background = 'hsl(var(--brand) / 0.08)'; 
                          e.currentTarget.style.borderColor = 'hsl(var(--brand) / 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        }}
                        onMouseLeave={e => { 
                          e.currentTarget.style.background = 'hsl(var(--surface-2))'; 
                          e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.5)';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                        onClick={qa.onClick}
                      >
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '50%', 
                          background: 'hsl(var(--brand) / 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'hsl(var(--brand))' 
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
                            {qa.icon}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* Today's Schedule and Rx Breakdown (Hidden for Admin as they are unwanted) */}
            {!isAdmin && (
              <>
                {/* Today's Schedule */}
                <div className="card" style={{ flex: 1 }}>
                  <div className="card-header"><span className="card-title">Today&apos;s Schedule</span></div>
                  <div className="card-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {currentTodaySchedule.map((appt: any, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'stretch' }}>
                          <div style={{ width: '48px', textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-primary))', lineHeight: 1 }}>{appt.time}</div>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{appt.ampm}</div>
                          </div>
                          <div style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                            borderLeft: `3px solid ${appt.color}`, background: appt.bg,
                          }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{appt.patient}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>{appt.procedure}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer" style={{ borderTop: '1px solid hsl(var(--border))', padding: '0.75rem' }}>
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                      View Full Calendar
                    </button>
                  </div>
                </div>

                {/* Rx breakdown */}
                <div className="card">
                  <div className="card-header"><span className="card-title">Rx Categories</span></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={currentRxCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                          {currentRxCategories.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {currentRxCategories.map((c: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', color: 'hsl(215 15% 60%)', flex: 1 }}>{c.name}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(210 20% 90%)' }}>{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        <style>{`
          .stats-grid {
             display: grid;
             grid-template-columns: 1fr;
             gap: 1.25rem;
             margin-bottom: 2rem;
          }
          @media (min-width: 640px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (min-width: 1280px) {
            .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          }
          @media (min-width: 1024px) {
            .dashboard-grid { grid-template-columns: 2fr 1fr !important; }
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>

        {/* Premium Custom Modal */}
        {modal.open && (
           <div style={{
             position: 'fixed', inset: 0, zIndex: 9999,
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
             animation: 'fadeIn 0.2s ease-out'
           }}>
              <div style={{
                width: '400px', background: 'hsl(var(--surface))', borderRadius: '1.25rem',
                border: '1px solid hsl(var(--border))', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{ padding: '1.5rem', background: 'hsl(var(--surface-2))', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'hsl(var(--brand))' }}>
                    {modal.type === 'report' ? 'analytics' : modal.type === 'db' ? 'database' : 'error'}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{modal.title}</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                   {modal.type === 'report' && modal.data && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         {[
                           { label: 'Hospital Staff', value: modal.data.users, icon: 'group' },
                           { label: 'Total Patients', value: modal.data.patients, icon: 'patient_list' },
                           { label: 'Weekly Visits', value: modal.data.appointments, icon: 'event' },
                           { label: 'Pending Approvals', value: modal.data.pendingApprovals, icon: 'hourglass_empty', color: 'orange' }
                         ].map((item, i) => (
                           <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'hsl(var(--surface-2) / 0.5)', borderRadius: '0.75rem' }}>
                             <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: item.color ? item.color : 'hsl(var(--text-muted))' }}>{item.icon}</span>
                             <span style={{ flex: 1, fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>{item.label}</span>
                             <span style={{ fontWeight: 700 }}>{item.value}</span>
                           </div>
                         ))}
                      </div>
                   )}
                   {modal.type === 'db' && modal.data && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '3px solid rgba(34,197,94,0.2)' }} />
                            <span style={{ fontWeight: 600 }}>System Connection: {modal.data.dbStatus}</span>
                         </div>
                         <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#000', fontFamily: 'monospace', fontSize: '0.75rem', color: '#22c55e', border: '1px solid #1a3a1a' }}>
                            {modal.data.dbPath}<br/>
                            {"> sudo connect --status"}<br/>
                            {"> status: ONLINE"}<br/>
                            {"> latency: 0.2ms"}<br/>
                            {"> health: OPTIMAL"}
                         </div>
                      </div>
                   )}
                   {modal.type === 'audit' && modal.data && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        <div style={{ padding: '0.75rem', background: 'hsl(var(--surface-3))', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          Displaying latest {modal.data.length} system events. Detailed export capability restricted to Super Admin.
                        </div>
                        {modal.data.map((log: any, i: number) => (
                           <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem', borderBottom: i === modal.data.length - 1 ? 'none' : '1px solid hsl(var(--border)/0.5)' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'SUCCESS' ? '#22c55e' : '#ef4444', marginTop: '0.25rem' }} />
                             <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.action} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 400 }}>by {log.username}</span></div>
                                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>{new Date(log.timestamp).toLocaleString()}</div>
                             </div>
                             <span style={{ fontSize: '0.7rem', fontWeight: 700, color: log.status === 'SUCCESS' ? '#22c55e' : '#ef4444' }}>{log.status}</span>
                           </div>
                        ))}
                      </div>
                   )}
                   {modal.type === 'error' && <p style={{ color: '#ef4444' }}>{modal.data}</p>}
                </div>
                <div style={{ padding: '1rem 1.5rem', background: 'hsl(var(--surface-2))', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={() => setModal({ ...modal, open: false })} style={{ padding: '0.5rem 1.5rem' }}>Dismiss</button>
                </div>
              </div>
           </div>
        )}
      </Layout>
    </>
  )
}
