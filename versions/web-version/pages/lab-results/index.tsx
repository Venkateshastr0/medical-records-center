import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, EyeIcon, BeakerIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface LabResult {
  id: string
  patient_id: string
  patient_name: string
  doctor_id: string
  doctor_name: string
  test_name: string
  test_category: string
  test_date: string
  result_date: string
  result_value: string
  unit: string
  reference_range: string
  status: string
  abnormal_flag: string
  interpretation: string
}

export default function LabResultsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: labResults, isLoading } = useQuery<LabResult[]>({
    queryKey: ['lab-results', filter, currentPage],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_lab_results', {
        filter: { ...filter, test_name: searchTerm },
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

  const deleteLabResultMutation = useMutation({
    mutationFn: async (id: string) => {
      return await window.__TAURI__.invoke('delete_lab_result', { id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lab-results'])
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'status-completed'
      case 'PENDING': return 'status-pending'
      case 'CANCELLED': return 'status-cancelled'
      case 'REVIEW': return 'status-active'
      default: return 'status-inactive'
    }
  }

  const getAbnormalFlagColor = (flag: string) => {
    switch (flag) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'LOW': return 'bg-yellow-100 text-yellow-800'
      case 'NORMAL': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
                Laboratory Results
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage patient laboratory test results and interpretations
              </p>
            </div>
            <button className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Lab Result
            </button>
          </div>

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Search Tests</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by test name or patient..."
                      className="form-input pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Patient</label>
                  <select className="form-input">
                    <option value="">All Patients</option>
                    {patients?.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Test Category</label>
                  <select className="form-input">
                    <option value="">All Categories</option>
                    <option value="Blood Work">Blood Work</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Imaging">Imaging</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input">
                    <option value="">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="REVIEW">Under Review</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lab Results Table */}
          <div className="card">
            <div className="card-body">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Patient</th>
                        <th className="table-header-cell">Test Name</th>
                        <th className="table-header-cell">Category</th>
                        <th className="table-header-cell">Test Date</th>
                        <th className="table-header-cell">Result</th>
                        <th className="table-header-cell">Reference Range</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {labResults?.map((result) => (
                        <tr key={result.id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {result.patient_name}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <BeakerIcon className="h-4 w-4 text-primary-600 mr-2" />
                              {result.test_name}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">
                              {result.test_category}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-col">
                              <span>{new Date(result.test_date).toLocaleDateString()}</span>
                              {result.result_date && (
                                <span className="text-xs text-gray-500">
                                  Result: {new Date(result.result_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-col">
                              <span className="font-medium">{result.result_value}</span>
                              {result.unit && (
                                <span className="text-xs text-gray-500">{result.unit}</span>
                              )}
                              {result.abnormal_flag && (
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getAbnormalFlagColor(result.abnormal_flag)}`}>
                                  {result.abnormal_flag}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.reference_range}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={getStatusColor(result.status)}>
                              {result.status}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center space-x-2">
                              <button className="text-primary-600 hover:text-primary-900">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <PencilIcon className="h-4 w-4" />
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
              Showing {labResults?.length || 0} lab results
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">Previous</button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Page 1</span>
              <button className="btn-secondary">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
