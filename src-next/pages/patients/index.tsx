import { useState, useMemo, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import Link from 'next/link'
import Head from 'next/head'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const demographicsData = [
  { name: '0-18 yrs', value: 15, color: '#3b82f6' },
  { name: '19-35 yrs', value: 30, color: '#22c55e' },
  { name: '36-60 yrs', value: 40, color: '#f59e0b' },
  { name: '60+ yrs', value: 15, color: '#8b5cf6' },
]

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-1))', border: '1px solid hsl(var(--border) / 0.5)',
  borderRadius: '8px', color: 'hsl(var(--text-primary))', fontSize: '0.8rem',
}

// ── Mock Data (replace with real API/Tauri calls) ──────────────────
interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone: string
  email: string
  city: string
  blood_type: string
  status?: 'Active' | 'Scheduled' | 'Inactive' | 'Urgent'
  created_at: string
}

interface PatientsResponse {
  data: Patient[]
  stats: {
    total_patients: number
    total_records: number
    pending_appointments: number
    new_this_month: number
    age_0_18: number
    age_19_35: number
    age_36_60: number
    age_60_plus: number
  }
  total: number
  page: number
  totalPages: number
}

const PAGE_SIZE = 10
const DEBOUNCE_DELAY = 500

// Move outside component — no need for useCallback
function getAge(dob: string): number {
  if (!dob) return 0
  try {
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  } catch { return 0 }
}

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  Active: { bg: 'rgba(34,197,94,0.12)', dot: '#22c55e', text: '#16a34a', label: 'Active' },
  Scheduled: { bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6', text: '#1d4ed8', label: 'Scheduled' },
  Inactive: { bg: 'rgba(148,163,184,0.18)', dot: '#94a3b8', text: '#475569', label: 'Inactive' },
  Urgent: { bg: 'rgba(239,68,68,0.12)', dot: '#ef4444', text: '#dc2626', label: 'Urgent' },
  Default: { bg: 'rgba(148,163,184,0.12)', dot: '#94a3b8', text: '#94a3b8', label: 'Unknown' },
}

export default function PatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const isNonAdmin = !isAdmin

  // Build query parameters object
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      limit: PAGE_SIZE
    }
    
    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim()
    }
    
    if (statusFilter !== 'All') {
      params.status = statusFilter
    }
    
    return params
  }, [debouncedSearchTerm, statusFilter, currentPage])

  const { data: remoteData, isLoading, error, isFetching } = useQuery<PatientsResponse>({
    queryKey: ['patients', queryParams] as const,
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Authentication required')
        }
        
        // Build query string from params
        const queryString = new URLSearchParams(
          Object.entries(queryParams).reduce((acc, [key, value]) => {
            acc[key] = String(value)
            return acc
          }, {} as Record<string, string>)
        ).toString()
        
        const response = await fetch(`/api/patients?${queryString}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to fetch patients (${response.status})`)
        }
        
        const data = await response.json()
        
        // Validate response structure
        return {
          data: Array.isArray(data?.data) ? data.data : [],
          stats: data?.stats || {},
          total: typeof data?.pagination?.total === 'number' ? data.pagination.total : (typeof data?.total === 'number' ? data.total : 0),
          page: typeof data?.pagination?.page === 'number' ? data.pagination.page : (typeof data?.page === 'number' ? data.page : 1),
          totalPages: typeof data?.pagination?.totalPages === 'number' ? data.pagination.totalPages : (typeof data?.totalPages === 'number' ? data.totalPages : 1)
        }
      } catch (err) {
        console.error('Error fetching patients:', err)
        throw err instanceof Error ? err : new Error('Failed to fetch patients')
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
    gcTime: 300000,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication required')) {
        return false
      }
      return failureCount < 2
    }
  })


  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Event handlers - memoized to prevent unnecessary re-renders
  const handleSearch = useCallback((v: string) => {
    setSearchTerm(v)
    setCurrentPage(1)
  }, [])

  const handleStatus = useCallback((v: string) => {
    setStatusFilter(v)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Extract data from response with safe defaults
  const patients = remoteData?.data ?? []
  const stats = remoteData?.stats ?? {}
  const totalPatients = remoteData?.total ?? 0
  const totalPages = remoteData?.totalPages ?? Math.max(1, Math.ceil(totalPatients / PAGE_SIZE))
  
  // Calculate pagination display info
  const paginationInfo = useMemo(() => {
    if (totalPatients === 0) {
      return { start: 0, end: 0 }
    }
    const start = (currentPage - 1) * PAGE_SIZE + 1
    const end = Math.min(currentPage * PAGE_SIZE, totalPatients)
    return { start, end }
  }, [currentPage, totalPatients])

  // Fixed pagination — no duplicate keys
  const pageNumbers = useMemo((): number[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const delta = 2
    const range: number[] = []
    const left = Math.max(2, currentPage - delta)
    const right = Math.min(totalPages - 1, currentPage + delta)

    range.push(1)
    if (left > 2) range.push(-1) // ellipsis sentinel
    for (let p = left; p <= right; p++) range.push(p)
    if (right < totalPages - 1) range.push(-2) // ellipsis sentinel
    range.push(totalPages)

    return range
  }, [totalPages, currentPage])

  // Memoize summary cards to prevent unnecessary re-calculations
  const SUMMARY_CARDS = useMemo(() => [
    { 
      label: 'Total Patients', 
      value: (stats?.total_patients ?? totalPatients).toLocaleString(), 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', 
      bg: 'rgba(59,130,246,0.1)', 
      color: '#3b82f6' 
    },
    { 
      label: 'Active Records', 
      value: (stats?.total_records ?? 0).toLocaleString(), 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 
      bg: 'rgba(34,197,94,0.1)', 
      color: '#22c55e' 
    },
    { 
      label: 'Pending Appts', 
      value: (stats?.pending_appointments ?? 0).toLocaleString(), 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 
      bg: 'rgba(59,130,246,0.1)', 
      color: '#3b82f6' 
    },
    { 
      label: 'New This Month', 
      value: (stats?.new_this_month ?? 0).toLocaleString(), 
      icon: 'M12 4v16m8-8H4', 
      bg: 'rgba(148,163,184,0.1)', 
      color: '#94a3b8' 
    },
  ], [stats, totalPatients])

  // Memoize demographics data to prevent unnecessary re-calculations
  const currentDemographics = useMemo(() => {
    const totalAgeCount = (stats?.age_0_18 ?? 0) + (stats?.age_19_35 ?? 0) + (stats?.age_36_60 ?? 0) + (stats?.age_60_plus ?? 0)
    
    if (totalAgeCount > 0) {
      return [
        { name: '0-18 yrs', value: Math.round((stats.age_0_18 / totalAgeCount) * 100), color: '#3b82f6' },
        { name: '19-35 yrs', value: Math.round((stats.age_19_35 / totalAgeCount) * 100), color: '#22c55e' },
        { name: '36-60 yrs', value: Math.round((stats.age_36_60 / totalAgeCount) * 100), color: '#f59e0b' },
        { name: '60+ yrs', value: Math.round((stats.age_60_plus / totalAgeCount) * 100), color: '#8b5cf6' },
      ]
    }
    
    return demographicsData
  }, [stats])

  return (
    <>
      <Head>
        <title>Patient Management — AegisChart</title>
        <meta name="description" content="Manage and monitor all patient records in AegisChart" />
      </Head>
      <Layout title="Patients" subtitle="Manage and monitor all patient records">

        {/* Header row */}
        <div className="patients-header">
          <div>
            <h1 className="patients-title">Patient Management</h1>
            <p className="patients-subtitle">Manage and monitor all medical center patient records</p>
          </div>
          {mounted && isAdmin && (
            <Link href="/patients/add" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Patient
            </Link>
          )}
        </div>

        <div className="patients-grid">
          {/* Main Content Area (Left) */}
          <div className="patients-main" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Search + Filter bar */}
        <div className="card" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div className="card-body" style={{ padding: '1rem' }}>
            <div className="patients-filter-row">
              <div className="search-wrapper" style={{ flex: 1 }}>
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search patients by name, ID, or contact info..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  id="patient-search"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(['All', 'Active', 'Scheduled', 'Inactive', 'Urgent'] as const).map(s => (
                  <button
                    key={s}
                    id={`filter-${s.toLowerCase()}`}
                    onClick={() => handleStatus(s)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: statusFilter === s ? 'hsl(210 100% 56%)' : 'hsl(222 18% 18%)',
                      color: statusFilter === s ? 'white' : 'hsl(215 15% 60%)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ flexGrow: 1, overflowX: 'auto', minHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ opacity: isFetching && !isLoading ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: isFetching ? 'none' : 'auto' }}>
                {isLoading && !patients.length ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="spinner" />
                        <p>Loading patient records...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ color: '#dc2626' }}>
                        <div className="empty-state-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p style={{ margin: 0, fontWeight: 500 }}>Error loading patients</p>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>
                          {error instanceof Error ? error.message : 'Unknown error occurred'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p style={{ margin: 0, fontWeight: 500 }}>No patients found</p>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : patients.map(p => {
                  const statusStyle = STATUS_STYLES[p.status || 'Active'] || STATUS_STYLES.Default
                  const initials = `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase()
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(215 15% 55%)' }}>
                          {`#${String(p.id).slice(0, 8)}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                            background: `hsl(var(--brand) / 0.12)`, color: 'hsl(var(--brand))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.8rem',
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', fontSize: '0.875rem' }}>
                              {p.first_name} {p.last_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                              {getAge(p.date_of_birth)} years • {p.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>{p.phone}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{p.email}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.25rem 0.625rem', borderRadius: '99px',
                          background: statusStyle.bg, color: statusStyle.text, fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.dot, flexShrink: 0 }} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          id={`view-${p.id}`}
                          title="View details"
                          onClick={() => router.push(`/patients/${p.id}`)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0.375rem', borderRadius: '6px', color: 'hsl(var(--text-muted))',
                            transition: 'all 0.15s', marginRight: '0.25rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--brand))')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {mounted && isAdmin && (
                          <button
                            id={`edit-${p.id}`}
                            title="Edit patient"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '0.375rem', borderRadius: '6px', color: 'hsl(var(--text-muted))',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--brand))')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.25rem', borderTop: '1px solid hsl(var(--border))',
            marginTop: 'auto'
          }}
            className="patients-pagination"
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
              {isFetching && patients.length > 0 
                ? 'Updating...' 
                : totalPatients > 0 
                  ? `Showing ${paginationInfo.start}–${paginationInfo.end} of ${totalPatients} patients`
                  : 'No patients to display'
              }
            </p>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isFetching}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', border: '1px solid hsl(var(--border))',
                  borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                  color: 'hsl(var(--text-muted))', transition: 'all 0.15s',
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {pageNumbers.map((pageNum, i) =>
                pageNum < 0 ? (
                  <span key={pageNum} style={{ color: 'hsl(var(--text-muted))', padding: '0 0.25rem' }}>…</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isFetching}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                      background: pageNum === currentPage ? 'hsl(var(--brand))' : 'transparent',
                      color: pageNum === currentPage ? 'white' : 'hsl(var(--text-muted))',
                    }}
                  >
                    {pageNum}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages || isFetching}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', border: '1px solid hsl(var(--border))',
                  borderRadius: '6px', background: 'transparent', cursor: 'pointer',
                  color: 'hsl(var(--text-muted))', transition: 'all 0.15s',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          </div>
          </div>

          {/* Right Sidebar */}
          <div className="patients-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 2x2 Stats Grid */}
            <div className="card" style={{ padding: '1.25rem', background: 'linear-gradient(145deg, hsl(var(--surface-1)), hsl(var(--surface-2)))', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: '150px', height: '150px', background: 'radial-gradient(circle, hsl(var(--brand)/0.15) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }}></div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--text-primary))', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <span className="pulse-dot" style={{ background: 'hsl(var(--brand))', boxShadow: '0 0 0 0 hsl(var(--brand)/0.4)' }}></span> 
                Patient Overview
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {SUMMARY_CARDS.map((c, i) => (
                  <div key={i} style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'hsl(var(--surface-0)/0.4)', 
                    border: '1px solid hsl(var(--border)/0.5)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    boxShadow: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.02)'
                  }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: c.bg, color: c.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-primary))', lineHeight: 1 }}>{c.value}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demographics Pie Chart */}
            <div className="card">
              <div className="card-header"><span className="card-title">Patient Demographics</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={currentDemographics} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {currentDemographics.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {currentDemographics.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .patients-header {
            display: flex; flex-direction: column; gap: 1rem;
            justify-content: space-between; align-items: flex-start;
            margin-bottom: 1.75rem;
          }
          @media (min-width: 640px) {
            .patients-header { flex-direction: row; align-items: center; }
          }
          .patients-title {
            font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em;
            color: hsl(var(--text-primary)); margin: 0 0 0.25rem;
          }
          .patients-subtitle { font-size: 0.875rem; color: hsl(var(--text-muted)); margin: 0; }
          .patients-filter-row {
            display: flex; flex-direction: column; gap: 0.75rem;
          }
          @media (min-width: 768px) {
            .patients-filter-row { flex-direction: row; align-items: center; }
          }
          .patients-grid {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
          }
          @media (min-width: 1024px) {
            .patients-grid {
              display: grid;
              grid-template-columns: 1fr 340px;
            }
          }
        `}</style>
      </Layout>
    </>
  )
}
