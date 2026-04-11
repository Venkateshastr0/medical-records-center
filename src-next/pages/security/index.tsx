import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { 
  ShieldCheckIcon,
  UserIcon,
  UserPlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  KeyIcon,
  DocumentTextIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_approved: number
  is_active: number
  last_login: string
  created_at: string
}

interface AuditLog {
  username: string
  first_name: string
  last_name: string
  action: string
  timestamp: string
  status: string
}

export default function AdminSecurityPage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('users')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check if user is admin
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      if (!token || !userStr) {
        router.push('/login')
        return
      }

      try {
        const user = JSON.parse(userStr)
        if (user.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        setIsAdmin(true)
      } catch (err) {
        console.error('Error parsing user data:', err)
        router.push('/login')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Helper for fetch with auth
  const fetchWithAuth = async (url: string, options: any = {}) => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      console.error('❌ No token found in localStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    console.log('🔐 Making request to:', url);
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    try {
      const response = await fetch(url, { ...options, headers })
      
      if (!response.ok) {
        console.error('❌ API error. Status:', response.status);
        const error = await response.json()
        console.error('❌ Error response:', error);
        throw new Error(error.error || `Request failed with status ${response.status}`)
      }
      
      const data = await response.json();
      console.log('✅ Request successful. Got', Array.isArray(data) ? data.length : 'data');
      return data;
    } catch (err: any) {
      console.error('❌ Fetch error:', err.message);
      throw err;
    }
  }

  // Queries
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => fetchWithAuth('/api/admin/users'),
    retry: 1
  })

  const { data: logs, isLoading: logsLoading, error: logsError } = useQuery<AuditLog[]>({
    queryKey: ['admin-logs'],
    queryFn: () => fetchWithAuth('/api/admin/logs'),
    retry: 1
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ userId, approve }: { userId: number, approve: boolean }) => 
      fetchWithAuth('/api/admin/approve-user', {
        method: 'POST',
        body: JSON.stringify({ userId, approve })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => 
      fetchWithAuth(`/api/admin/delete-user?userId=${userId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] })
    }
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'doctor': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'nurse': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const pendingCount = users?.filter(u => !u.is_approved).length || 0;
  const activeCount = users?.filter(u => u.is_approved).length || 0;
  const totalCount = users?.length || 0;
  const failedCount = logs?.filter(l => l.status !== 'SUCCESS').length || 0;

  return (
    <Layout title="Admin & Security" subtitle="Manage hospital staff, account approvals, and system access logs.">
      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-text-muted">Checking authorization...</p>
          </div>
        </div>
      ) : !isAdmin ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">block</span>
            <div>
              <div className="font-bold">Access Denied</div>
              <div className="text-sm mt-1">You must be an administrator to access this page.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="security-container">
        
        {/* Debug Info */}
        <div className="mb-4 p-3 bg-blue-500/5 border border-blue-200/30 rounded-lg text-xs text-blue-600">
          <div className="font-mono">
            Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'} | 
            Users API: {usersLoading ? '⏳ Loading' : usersError ? '❌ Error' : '✅ OK'}
          </div>
        </div>
        
        <div className="page-header">
          <div>
            <div className="page-title">Admin & Security</div>
            <div className="page-sub">Manage hospital staff, account approvals, and system access logs.</div>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost">
              <span className="material-symbols-outlined">download</span>
              Export
            </button>
            <button className="approval-btn" onClick={() => setSelectedTab('users')}>
              <span className="material-symbols-outlined">pending_actions</span>
              Approvals Required
              <span className="approval-count-pill" id="approval-pill">{pendingCount}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card" style={{ '--accent': 'hsl(210,100%,56%)', '--accent-bg': 'hsl(210,100%,56%,0.1)' } as any}>
            <div className="stat-top">
              <div className="stat-icon"><span className="material-symbols-outlined">group</span></div>
              <span className="stat-badge">LIVE</span>
            </div>
            <div className="stat-num">{totalCount}</div>
            <div className="stat-label">Total Staff</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'hsl(38,95%,55%)', '--accent-bg': 'hsl(38,95%,55%,0.1)' } as any}>
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'hsl(38,95%,55%,0.12)', color: 'hsl(38,95%,55%)' }}><span className="material-symbols-outlined">pending_actions</span></div>
              <span className="stat-badge" style={{ background: 'hsl(38,95%,55%,0.15)', color: 'hsl(38,95%,68%)' }}>Needs review</span>
            </div>
            <div className="stat-num">{pendingCount}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'hsl(152,69%,42%)', '--accent-bg': 'hsl(152,69%,42%,0.1)' } as any}>
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'hsl(152,69%,42%,0.12)', color: 'hsl(152,69%,55%)' }}><span className="material-symbols-outlined">verified_user</span></div>
              <span className="stat-badge" style={{ background: 'hsl(152,69%,42%,0.15)', color: 'hsl(152,69%,62%)' }}>Active</span>
            </div>
            <div className="stat-num">{activeCount}</div>
            <div className="stat-label">Authorized Users</div>
          </div>
          <div className="stat-card" style={{ '--accent': 'hsl(0,72%,58%)', '--accent-bg': 'hsl(0,72%,58%,0.1)' } as any}>
            <div className="stat-top">
              <div className="stat-icon" style={{ background: 'hsl(0,72%,58%,0.12)', color: 'hsl(0,72%,68%)' }}><span className="material-symbols-outlined">lock_person</span></div>
              <span className="stat-badge" style={{ background: 'hsl(0,72%,58%,0.15)', color: 'hsl(0,72%,70%)' }}>Audit</span>
            </div>
            <div className="stat-num">{failedCount}</div>
            <div className="stat-label">Failed Logins</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-bar flex gap-2 mb-5">
          <button className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${selectedTab === 'users' ? 'active-tab bg-surface-3 text-text-primary border border-border' : 'text-text-muted hover:bg-surface-2'}`} onClick={() => setSelectedTab('users')}>
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            User Management
            {pendingCount > 0 && <div className="tab-dot w-[6px] h-[6px] rounded-full bg-orange-500 animate-pulse ml-1"></div>}
          </button>
          <button className={`tab-btn flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${selectedTab === 'logs' ? 'active-tab bg-surface-3 text-text-primary border border-border shadow-sm' : 'text-text-muted hover:bg-surface-2'}`} onClick={() => setSelectedTab('logs')}>
            <span className="material-symbols-outlined text-[18px]">shield_lock</span>
            Security Logs
          </button>
        </div>

        {/* USER MANAGEMENT */}
        {selectedTab === 'users' && (
          <div className="data-card border border-border rounded-xl bg-surface-1 overflow-hidden animate-fade-in">
            {usersError && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-500 text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <div>
                    <div className="font-bold">Failed to load users</div>
                    <div className="text-xs mt-1">{(usersError as any)?.message || 'Unknown error'}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="card-head flex justify-between items-center p-4 border-b border-border bg-surface-2">
              <div className="card-head-left flex items-center gap-3">
                <div className="card-head-icon w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">badge</span></div>
                <div>
                  <div className="card-head-title text-sm font-bold text-text-primary">Hospital Staff Registry</div>
                  <div className="card-head-sub text-xs text-text-muted">{totalCount} members across all departments</div>
                </div>
              </div>
              <div className="search-wrap relative">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
                <input className="search-input bg-surface-3 border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary" type="text" placeholder="Search staff…" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Staff Member</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Role</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Access Control</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Joined</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? <tr><td colSpan={6} className="p-10 text-center"><div className="spinner mx-auto"></div></td></tr> : !users || users.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-text-muted">No staff members found</td></tr> : users?.map((u, i) => {
                    const isPending = !u.is_approved;
                    return (
                      <tr key={u.id} className={`border-b border-border hover:bg-surface-2 transition-colors ${isPending ? 'bg-orange-500/5' : ''}`}>
                        <td className="p-3 flex items-center gap-3">
                           <div className="avatar w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-surface-3 border border-border/50 text-brand">
                             {u.first_name?.[0]}{u.last_name?.[0]}
                           </div>
                           <div>
                             <div className="font-semibold text-sm text-text-primary">{u.first_name} {u.last_name}</div>
                             <div className="text-xs text-text-muted font-mono">{u.email}</div>
                           </div>
                        </td>
                        <td className="p-3">
                           <span className="badge px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border border-brand/20 text-brand bg-brand/10">{u.role}</span>
                        </td>
                        <td className="p-3">
                           <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                             <span className={`text-xs font-bold tracking-wider ${isPending ? 'text-orange-500' : 'text-green-500'}`}>{isPending ? 'PENDING' : 'AUTHORIZED'}</span>
                           </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <label className="toggle relative w-9 h-5 inline-block select-none cursor-pointer">
                               <input type="checkbox" className="peer sr-only" checked={!!u.is_approved} disabled={u.role === 'admin'} onChange={() => approveMutation.mutate({ userId: u.id, approve: !u.is_approved })} />
                               <div className="absolute inset-0 bg-surface-3 border border-border rounded-full peer-checked:bg-green-500/30 peer-checked:border-green-500 transition-all"></div>
                               <div className="absolute top-[2px] left-[2px] w-4 h-4 bg-text-muted rounded-full peer-checked:translate-x-[16px] peer-checked:bg-green-500 transition-all"></div>
                            </label>
                            <span className={`text-[10px] font-black tracking-wider ${u.is_approved ? 'text-green-500' : 'text-text-muted'}`}>{u.is_approved ? 'GRANT' : 'REVOKE'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-text-muted font-mono text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                           <button onClick={() => { if(confirm('Delete user?')) deleteMutation.mutate(u.id); }} disabled={u.role === 'admin'} className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-30 disabled:pointer-events-none">
                             <span className="material-symbols-outlined text-[16px]">delete</span>
                           </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY LOGS */}
        {selectedTab === 'logs' && (
          <div className="data-card border border-border rounded-xl bg-surface-1 overflow-hidden animate-fade-in">
            {logsError && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-500 text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  <div>
                    <div className="font-bold">Failed to load logs</div>
                    <div className="text-xs mt-1">{(logsError as any)?.message || 'Unknown error'}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="card-head flex justify-between items-center p-4 border-b border-border bg-surface-2">
              <div className="card-head-left flex items-center gap-3">
                <div className="card-head-icon w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">history</span></div>
                <div>
                  <div className="card-head-title text-sm font-bold text-text-primary">System Access Logs</div>
                  <div className="card-head-sub text-xs text-text-muted">Real-time authentication & activity trail</div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full text-left">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">User</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Activity</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Result</th>
                    <th className="p-3 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? <tr><td colSpan={4} className="p-10 text-center"><div className="spinner mx-auto"></div></td></tr> : !logs || logs.length === 0 ? <tr><td colSpan={4} className="p-10 text-center text-text-muted">No access logs found</td></tr> : logs?.map((l, i) => {
                    const isSuccess = l.status === 'SUCCESS';
                    return (
                      <tr key={i} className="border-b border-border hover:bg-surface-2 transition-colors">
                        <td className="p-3">
                           <div className="font-semibold text-sm text-text-primary">{l.first_name} {l.last_name}</div>
                           <div className="text-xs text-text-muted font-mono">@{l.username}</div>
                        </td>
                        <td className="p-3">
                           <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(currentColor,0.5)] ${l.action === 'LOGIN' ? 'bg-brand' : 'bg-orange-500'}`}></div>
                             <span className={`text-[11px] font-bold tracking-wider ${l.action === 'LOGIN' ? 'text-brand' : 'text-orange-500'}`}>{l.action}</span>
                           </div>
                        </td>
                        <td className="p-3">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isSuccess ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                             {l.status}
                           </span>
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-text-muted">
                           {new Date(l.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      )}
      
      <style jsx>{`
        .security-container {
          --s1: hsl(var(--surface-1));
          --s2: hsl(var(--surface-2));
          --bd: hsl(var(--border));
        }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; }
        .page-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: hsl(var(--text-primary)); line-height: 1.2; }
        .page-sub { font-size: 0.8rem; color: hsl(var(--text-muted)); margin-top: 0.25rem; }
        .header-actions { display: flex; align-items: center; gap: 0.5rem; }
        .approval-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.45rem 0.875rem; background: hsl(38,95%,55%,0.12);
          border: 1px solid hsl(38,95%,55%,0.35); border-radius: 8px;
          font-size: 0.78rem; font-weight: 700; color: hsl(38,95%,68%);
          cursor: pointer; transition: all 0.15s; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .approval-btn:hover { background: hsl(38,95%,55%,0.2); }
        .approval-count-pill { background: hsl(var(--warning)); color: hsl(30,80%,15%); font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 99px; }
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.875rem; margin-bottom: 1.5rem; }
        .stat-card {
          background: var(--s1); border: 1px solid var(--bd); border-radius: 12px;
          padding: 1rem 1.125rem; position: relative; overflow: hidden;
        }
        .stat-card::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--accent); opacity: 0.7;
        }
        .stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; }
        .stat-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--accent-bg); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .stat-num { font-size: 1.625rem; font-weight: 800; }
        .stat-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: hsl(var(--text-muted)); }
        .stat-badge { font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 99px; background: var(--accent-bg); color: var(--accent); }
      `}</style>
    </Layout>
  )
}