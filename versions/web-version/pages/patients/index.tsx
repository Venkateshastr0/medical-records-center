import { useState, useMemo } from 'react'
import Layout from '../../components/Layout'
import Link from 'next/link'
import Head from 'next/head'
import { useQuery } from '@tanstack/react-query'

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

const PAGE_SIZE = 10

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  Active: { bg: 'rgba(34,197,94,0.12)', dot: '#22c55e', text: '#16a34a', label: 'Active' },
  Scheduled: { bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6', text: '#1d4ed8', label: 'Scheduled' },
  Inactive: { bg: 'rgba(148,163,184,0.18)', dot: '#94a3b8', text: '#475569', label: 'Inactive' },
  Urgent: { bg: 'rgba(239,68,68,0.12)', dot: '#ef4444', text: '#dc2626', label: 'Urgent' },
  Default: { bg: 'rgba(148,163,184,0.12)', dot: '#94a3b8', text: '#94a3b8', label: 'Unknown' },
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: remotePatients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ['patients', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      
      const response = await fetch(`/api/patients?${params}`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      
      const data = await response.json();
      return data.patients;
    }
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
  }

  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1) }
  const handleStatus = (v: string) => { setStatusFilter(v); setCurrentPage(1) }

  // The following useMemo hooks are replaced by the useQuery logic
  // We need to define `paged` and `filtered` based on `remotePatients` for the existing JSX to work.
  // Assuming `remotePatients` already contains the filtered and paged data from the backend.
  // If the backend returns ALL data and we need to filter/page on frontend, then the useMemo would be needed.
  // Given the `queryFn` sends `filter`, `page`, `limit`, it implies the backend handles this.
  // So, `paged` will just be `remotePatients` and `filtered.length` will be the total count if provided by backend,
  // or `remotePatients.length` if backend only sends current page.
  // For now, let's assume `remotePatients` is the current page's data.
  const filtered = remotePatients || [] // For total count display, this might need to be total_count from API
  const paged = remotePatients || [] // This is the data for the current page

  // This calculation needs to be adjusted if the backend provides total count
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const SUMMARY_CARDS = [
    { label: 'Total Patients', value: '1,284', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    { label: 'Active Records', value: '852', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    { label: 'Pending Checkups', value: '12', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  ]

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
          <Link href="/patients/add" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </Link>
        </div>

        {/* Search + Filter bar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
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
        <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
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
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="spinner" />
                        <p>Loading patient records...</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
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
                ) : paged.map(p => {
                  const s = STATUS_STYLES[p.status || 'Active'] || STATUS_STYLES.Default
                  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(215 15% 55%)' }}>
                          #{p.id.slice(0, 8)}
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
                          background: s.bg, color: s.text, fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                          {s.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/patients/${p.id}`}
                          id={`view-${p.id}`}
                          title="View details"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0.375rem', borderRadius: '6px', color: 'hsl(var(--text-muted))',
                            transition: 'all 0.15s', textDecoration: 'none', marginRight: '0.25rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--brand))')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
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
          }}
            className="patients-pagination"
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} patients
            </p>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                    background: n === currentPage ? 'hsl(var(--brand))' : 'transparent',
                    color: n === currentPage ? 'white' : 'hsl(var(--text-muted))',
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {SUMMARY_CARDS.map((c, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                background: c.bg, color: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-muted))' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--text-primary))', lineHeight: 1.2, letterSpacing: '-0.03em' }}>
                  {c.value}
                </div>
              </div>
            </div>
          ))}
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
          .patients-pagination {
            flex-direction: column !important;
          }
          @media (min-width: 640px) {
            .patients-pagination { flex-direction: row !important; }
          }
        `}</style>
      </Layout>
    </>
  )
}
