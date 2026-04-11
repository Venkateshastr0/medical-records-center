import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  doctor_id: string
  doctor_name: string
  appointment_date: string
  duration_minutes: number
  appointment_type: string
  status: string
  notes: string
  created_at: string
}

interface AppointmentSearchFilter {
  patient_id?: string
  doctor_id?: string
  start_date?: string
  end_date?: string
  status?: string
  appointment_type?: string
  limit?: number
  offset?: number
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<AppointmentSearchFilter>({})
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading, error } = useQuery<Appointment[]>({
    queryKey: ['appointments', filter, currentPage],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_appointments', {
        filter: { ...filter, patient_name: searchTerm },
        page: currentPage,
        limit: 20
      })
      return response.data || []
    }
  })

  const { data: patients } = useQuery<any[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_patients', { limit: 1000 })
      return response.data || []
    }
  })

  const { data: doctors } = useQuery<any[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_users', { role: 'doctor' })
      return response.data || []
    }
  })

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await window.__TAURI__.invoke('delete_appointment', { id: appointmentId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
    }
  })

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleFilter = (newFilter: Partial<AppointmentSearchFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
    setCurrentPage(1)
  }

  const handleDelete = (appointmentId: string) => {
    if (confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      deleteAppointmentMutation.mutate(appointmentId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'status-active'
      case 'COMPLETED':
        return 'status-completed'
      case 'CANCELLED':
        return 'status-cancelled'
      case 'NO_SHOW':
        return 'status-pending'
      case 'RESCHEDULED':
        return 'status-inactive'
      default:
        return 'status-inactive'
    }
  }

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'bg-blue-100 text-blue-800'
      case 'FOLLOW_UP':
        return 'bg-green-100 text-green-800'
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800'
      case 'SURGERY':
        return 'bg-purple-100 text-purple-800'
      case 'LAB_TEST':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Appointments
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage patient appointments and scheduling
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar View
              </button>
              <button className="btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Schedule Appointment
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="form-label">Search Appointments</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by patient name or notes..."
                      className="form-input pl-10"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Patient Filter */}
                <div>
                  <label className="form-label">Patient</label>
                  <select
                    className="form-input"
                    value={filter.patient_id || ''}
                    onChange={(e) => handleFilter({ patient_id: e.target.value })}
                  >
                    <option value="">All Patients</option>
                    {patients?.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={filter.status || ''}
                    onChange={(e) => handleFilter({ status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_SHOW">No Show</option>
                    <option value="RESCHEDULED">Rescheduled</option>
                  </select>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filter.start_date || ''}
                    onChange={(e) => handleFilter({ start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filter.end_date || ''}
                    onChange={(e) => handleFilter({ end_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Doctor</label>
                  <select
                    className="form-input"
                    value={filter.doctor_id || ''}
                    onChange={(e) => handleFilter({ doctor_id: e.target.value })}
                  >
                    <option value="">All Doctors</option>
                    {doctors?.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="card">
            <div className="card-body">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="spinner"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400">
                    Error loading appointments. Please try again.
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Patient</th>
                        <th className="table-header-cell">Doctor</th>
                        <th className="table-header-cell">Date & Time</th>
                        <th className="table-header-cell">Duration</th>
                        <th className="table-header-cell">Type</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Notes</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {appointments?.map((appointment) => (
                        <tr key={appointment.id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4 text-primary-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {appointment.patient_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4 text-success-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {appointment.doctor_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(appointment.appointment_date)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(appointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {appointment.duration_minutes} min
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getAppointmentTypeColor(appointment.appointment_type)}`}>
                              {appointment.appointment_type}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="max-w-xs truncate">
                              {appointment.notes || 'No notes'}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center space-x-2">
                              <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => handleDelete(appointment.id)}
                                disabled={deleteAppointmentMutation.isPending}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {appointments?.length || 0} appointments
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={appointments?.length < 20}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
