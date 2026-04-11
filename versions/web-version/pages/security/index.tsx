import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ShieldCheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  ServerIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface SecurityStatus {
  active_users: number
  failed_login_attempts: number
  security_alerts: number
  last_security_scan: string
  system_health: string
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
  user_agent: string
}

interface SecurityAlert {
  id: string
  type: string
  severity: string
  message: string
  timestamp: string
  resolved: boolean
}

export default function SecurityPage() {
  const [selectedTab, setSelectedTab] = useState('overview')

  const { data: securityStatus } = useQuery<SecurityStatus>({
    queryKey: ['security-status'],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_security_status')
      return response.data
    }
  })

  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_audit_logs', { limit: 50 })
      return response.data || []
    }
  })

  const { data: securityAlerts } = useQuery<SecurityAlert[]>({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_security_alerts')
      return response.data || []
    }
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'status-active'
      case 'WARNING': return 'status-pending'
      case 'CRITICAL': return 'status-cancelled'
      default: return 'status-inactive'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'text-green-600 bg-green-100'
      case 'LOGIN_FAILED': return 'text-red-600 bg-red-100'
      case 'LOGOUT': return 'text-blue-600 bg-blue-100'
      case 'CREATE': return 'text-green-600 bg-green-100'
      case 'UPDATE': return 'text-yellow-600 bg-yellow-100'
      case 'DELETE': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Security Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Monitor system security, user activity, and compliance
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {['overview', 'alerts', 'audit', 'compliance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === tab
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-lg bg-green-100">
                          <UserIcon className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Active Users
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {securityStatus?.active_users || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-lg bg-red-100">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Failed Logins
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {securityStatus?.failed_login_attempts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-lg bg-yellow-100">
                          <ShieldCheckIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Security Alerts
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {securityStatus?.security_alerts || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-lg bg-blue-100">
                          <ServerIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            System Health
                          </dt>
                          <dd className="text-lg font-semibold">
                            <span className={getHealthColor(securityStatus?.system_health || 'UNKNOWN')}>
                              {securityStatus?.system_health || 'UNKNOWN'}
                            </span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Security Activity
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {auditLogs?.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center space-x-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.username} • {log.action}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {log.resource_type} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {selectedTab === 'alerts' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Alerts
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {securityAlerts?.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.type}
                          </p>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {selectedTab === 'audit' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Audit Logs
                </h3>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">User</th>
                        <th className="table-header-cell">Action</th>
                        <th className="table-header-cell">Resource</th>
                        <th className="table-header-cell">IP Address</th>
                        <th className="table-header-cell">Timestamp</th>
                        <th className="table-header-cell">Details</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {auditLogs?.map((log) => (
                        <tr key={log.id} className="table-row">
                          <td className="table-cell">{log.username}</td>
                          <td className="table-cell">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="table-cell">{log.resource_type}</td>
                          <td className="table-cell">{log.ip_address}</td>
                          <td className="table-cell">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="table-cell">
                            <button className="text-primary-600 hover:text-primary-900">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {selectedTab === 'compliance' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    HIPAA Compliance Status
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Access Control
                        </span>
                      </div>
                      <span className="text-sm text-green-600">Compliant</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Audit Logging
                        </span>
                      </div>
                      <span className="text-sm text-green-600">Compliant</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Data Encryption
                        </span>
                      </div>
                      <span className="text-sm text-green-600">Compliant</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          User Authentication
                        </span>
                      </div>
                      <span className="text-sm text-green-600">Compliant</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Security Recommendations
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <LockClosedIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Enable Multi-Factor Authentication
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Consider implementing MFA for additional security layer
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Review Session Timeout Settings
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current timeout is 24 hours, consider reducing to 8 hours
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Schedule Regular Security Audits
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monthly security audits recommended for compliance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
