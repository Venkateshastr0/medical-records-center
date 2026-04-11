import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, EyeIcon, BeakerIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface Prescription {
  id: string
  patient_id: string
  patient_name: string
  doctor_id: string
  doctor_name: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  duration: string
  refills: number
  status: string
  prescribed_date: string
}

export default function PrescriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ['prescriptions', filter, currentPage],
    queryFn: async () => {
      const response = await window.__TAURI__.invoke('get_prescriptions', {
        filter: { ...filter, medication_name: searchTerm },
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

  const deletePrescriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await window.__TAURI__.invoke('delete_prescription', { id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prescriptions'])
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'status-active'
      case 'COMPLETED': return 'status-completed'
      case 'EXPIRED': return 'status-inactive'
      case 'CANCELLED': return 'status-cancelled'
      default: return 'status-inactive'
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
                Prescriptions
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage patient medications and prescriptions
              </p>
            </div>
            <button className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Prescription
            </button>
          </div>

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Search Medications</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by medication or patient..."
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
                  <label className="form-label">Status</label>
                  <select className="form-input">
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Prescriptions Table */}
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
                        <th className="table-header-cell">Medication</th>
                        <th className="table-header-cell">Dosage</th>
                        <th className="table-header-cell">Frequency</th>
                        <th className="table-header-cell">Duration</th>
                        <th className="table-header-cell">Refills</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {prescriptions?.map((prescription) => (
                        <tr key={prescription.id} className="table-row">
                          <td className="table-cell">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                              {prescription.patient_name}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <BeakerIcon className="h-4 w-4 text-primary-600 mr-2" />
                              {prescription.medication_name}
                            </div>
                          </td>
                          <td className="table-cell">{prescription.dosage}</td>
                          <td className="table-cell">{prescription.frequency}</td>
                          <td className="table-cell">{prescription.duration}</td>
                          <td className="table-cell">{prescription.refills}</td>
                          <td className="table-cell">
                            <span className={getStatusColor(prescription.status)}>
                              {prescription.status}
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
        </div>
      </div>
    </div>
  )
}
