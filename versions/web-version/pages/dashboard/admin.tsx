import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  BabyIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface Birth {
  id: number
  birth_id: string
  mother_name: string
  birth_date: string
  newborn_gender: string
  birth_weight: string
  delivery_type: string
}

interface Death {
  id: number
  death_id: string
  patient_id: string
  death_date: string
  cause_of_death: string
  manner_of_death: string
}

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  last_login: string
}

interface AuditLog {
  id: string
  user_id: string
  username: string
  action: string
  resource_type: string
  resource_id: string
  ip_address: string
  timestamp: string
  details: string
}

interface SystemStats {
  total_users: number
  total_patients: number
  total_appointments: number
  active_sessions: number
  system_health: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAudit, setGeneratingAudit] = useState(false)
  const [auditMessage, setAuditMessage] = useState('')
  const [births, setBirths] = useState<Birth[]>([])
  const [deaths, setDeaths] = useState<Death[]>([])
  const [birthsCount, setBirthsCount] = useState(0)
  const [deathsCount, setDeathsCount] = useState(0)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.role !== 'admin') {
        router.push('/unauthorized')
      }
    } else {
      router.push('/login')
    }
    setLoading(false)
  }, [router])

  // Mock data for demonstration
  useEffect(() => {
    // Mock users
    setUsers([
      { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User', role: 'admin', is_active: true, last_login: new Date().toISOString() },
      { id: 2, username: 'doctor', first_name: 'Doctor', last_name: 'Smith', role: 'doctor', is_active: true, last_login: new Date().toISOString() },
      { id: 3, username: 'nurse', first_name: 'Nurse', last_name: 'Johnson', role: 'nurse', is_active: true, last_login: new Date().toISOString() },
      { id: 4, username: 'receptionist', first_name: 'Receptionist', last_name: 'Wilson', role: 'receptionist', is_active: true, last_login: new Date().toISOString() },
      { id: 5, username: 'pharmacy', first_name: 'Pharmacy', last_name: 'Tech', role: 'pharmacy', is_active: true, last_login: new Date().toISOString() },
    ])

    // Mock audit logs
    setAuditLogs([
      { id: '1', user_id: '1', username: 'admin', action: 'LOGIN', resource_type: 'system', resource_id: '1', ip_address: '192.168.1.100', timestamp: new Date().toISOString(), details: 'User login successful' },
      { id: '2', user_id: '2', username: 'doctor', action: 'VIEW_PATIENT', resource_type: 'patient', resource_id: '101', ip_address: '192.168.1.101', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Viewed patient record' },
      { id: '3', user_id: '3', username: 'nurse', action: 'UPDATE_VITALS', resource_type: 'patient', resource_id: '102', ip_address: '192.168.1.102', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Updated patient vitals' },
      { id: '4', user_id: '4', username: 'receptionist', action: 'CREATE_APPOINTMENT', resource_type: 'appointment', resource_id: '201', ip_address: '192.168.1.103', timestamp: new Date(Date.now() - 10800000).toISOString(), details: 'Created new appointment' },
      { id: '5', user_id: '5', username: 'pharmacy', action: 'DISPENSE_MEDICATION', resource_type: 'prescription', resource_id: '301', ip_address: '192.168.1.104', timestamp: new Date(Date.now() - 14400000).toISOString(), details: 'Dispensed medication' },
    ])

    // Mock system stats
    setStats({
      total_users: 5,
      total_patients: 150,
      total_appointments: 45,
      active_sessions: 12,
      system_health: 'HEALTHY'
    })
  }, [])

  // Fetch births and deaths data
  useEffect(() => {
    const fetchBirthsDeaths = async () => {
      try {
        // Fetch births
        const birthsRes = await fetch('/api/births?limit=10')
        if (birthsRes.ok) {
          const birthsData = await birthsRes.json()
          setBirths(birthsData.data || [])
          setBirthsCount(birthsData.total || 0)
        }

        // Fetch deaths
        const deathsRes = await fetch('/api/deaths?limit=10')
        if (deathsRes.ok) {
          const deathsData = await deathsRes.json()
          setDeaths(deathsData.data || [])
          setDeathsCount(deathsData.total || 0)
        }
      } catch (error) {
        console.error('Error fetching births/deaths:', error)
      }
    }

    fetchBirthsDeaths()
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const generateAudit = async () => {
    setGeneratingAudit(true)
    setAuditMessage('')
    
    try {
      // Simulate audit generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a comprehensive audit report
      const auditReport = {
        generatedAt: new Date().toISOString(),
        generatedBy: user?.username || 'admin',
        summary: {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.is_active).length,
          totalAuditLogs: auditLogs.length,
          systemHealth: stats?.system_health || 'UNKNOWN'
        },
        userActivity: users.map(u => ({
          username: u.username,
          role: u.role,
          lastLogin: u.last_login,
          isActive: u.is_active
        })),
        recentAuditLogs: auditLogs.slice(0, 10),
        securityStatus: {
          failedLogins: 0,
          suspiciousActivities: 0,
          complianceStatus: 'COMPLIANT'
        }
      }
      
      // Convert to JSON and create downloadable file
      const auditData = JSON.stringify(auditReport, null, 2)
      const blob = new Blob([auditData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setAuditMessage('Audit report generated and downloaded successfully!')
    } catch (error) {
      console.error('Error generating audit:', error)
      setAuditMessage('Error generating audit report. Please try again.')
    } finally {
      setGeneratingAudit(false)
    }
  }

  const exportAuditLogs = () => {
    const csvContent = [
      ['ID', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Timestamp', 'Details'].join(','),
      ...auditLogs.map(log => [
        log.id,
        log.username,
        log.action,
        log.resource_type,
        log.resource_id,
        log.ip_address,
        log.timestamp,
        `"${log.details}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">System administration and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.first_name} {user?.last_name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'users', label: 'Users', icon: UsersIcon },
            { id: 'audit', label: 'Audit Logs', icon: DocumentTextIcon },
            { id: 'security', label: 'Security', icon: ShieldCheckIcon },
            { id: 'settings', label: 'Settings', icon: CogIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <UsersIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_patients || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_appointments || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.active_sessions || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={generateAudit}
                  disabled={generatingAudit}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  {generatingAudit ? 'Generating...' : 'Generate Audit Report'}
                </button>
                
                <button
                  onClick={() => router.push('/users')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Manage Users
                </button>
                
                <button
                  onClick={() => router.push('/security')}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Security Dashboard
                </button>
              </div>
              
              {auditMessage && (
                <div className={`mt-4 p-3 rounded-lg ${auditMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {auditMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</div>
                        <div className="text-sm text-gray-500">{u.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.last_login).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Deactivate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={exportAuditLogs}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={generateAudit}
                    disabled={generatingAudit}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    {generatingAudit ? 'Generating...' : 'Generate Full Audit'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.resource_type} ({log.resource_id})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">System Health</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {stats?.system_health || 'HEALTHY'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed Login Attempts (24h)</span>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="text-sm font-medium text-gray-900">{stats?.active_sessions || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm text-gray-600">HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm text-gray-600">Audit Logging Enabled</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm text-gray-600">Data Encryption Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                  <p className="text-sm text-gray-500">Automatically log out inactive users</p>
                </div>
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Audit Log Retention</p>
                  <p className="text-sm text-gray-500">How long to keep audit logs</p>
                </div>
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Forever</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require 2FA for admin users</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200">
                  <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
