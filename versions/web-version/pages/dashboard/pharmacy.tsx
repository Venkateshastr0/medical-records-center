import { useState } from 'react'
import Layout from '../../components/Layout'
import Head from 'next/head'
import { useQuery } from '@tanstack/react-query'

export default function PharmacyDashboard() {
  const [searchTerm, setSearchTerm] = useState('')

  // Get pending prescriptions
  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions', 'pending'],
    queryFn: async () => {
      const response = await fetch('/api/prescriptions?status=pending');
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      const data = await response.json();
      return data.prescriptions;
    }
  });

  // Get inventory data
  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      return data.items;
    }
  });

  // Get today's dispensed count
  const { data: todayStats } = useQuery({
    queryKey: ['pharmacy-stats', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/pharmacy/stats?period=today');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const stats = {
    pendingPrescriptions: prescriptions?.length || 0,
    lowStock: inventory?.filter(item => item.stock_level <= item.reorder_level).length || 0,
    dispensedToday: todayStats?.dispensedToday || 0,
    criticalItems: inventory?.filter(item => item.stock_level <= item.critical_level).length || 0
  };

  return (
    <>
      <Head>
        <title>Pharmacy Dashboard - Medical Records Center</title>
      </Head>

      <Layout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management</h1>
            <p className="text-gray-600 mt-2">Prescription processing and inventory management</p>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow flex items-center gap-5">
              <div className="p-4 bg-amber-100 rounded-xl">
                <span className="material-symbols-outlined text-amber-600 text-2xl">pending_actions</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Prescriptions</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingPrescriptions}</h3>
                <p className="text-xs text-green-500 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span> +5% from yesterday
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow flex items-center gap-5">
              <div className="p-4 bg-red-100 rounded-xl">
                <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Low on Stock</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.lowStock}</h3>
                <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">priority_high</span> {stats.criticalItems} critical items
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow flex items-center gap-5">
              <div className="p-4 bg-blue-100 rounded-xl">
                <span className="material-symbols-outlined text-blue-600 text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Dispensed Today</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.dispensedToday}</h3>
                <p className="text-xs text-green-500 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_up</span> +12% vs average
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Area: Billing and Queue */}
            <div className="xl:col-span-3 space-y-8">
              {/* External Patient Billing Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">External Patient Billing</h2>
                    <p className="text-sm text-gray-500">Manual data entry for referred patients and external service billing.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-lg">calculate</span>
                      Calculate
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
                      <span className="material-symbols-outlined text-lg">sync</span>
                      Sync System
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-r border-gray-200">Patient Name</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-r border-gray-200">Referring Hospital</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-r border-gray-200">Medication/Service</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right border-r border-gray-200 w-24">Qty</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right border-r border-gray-200 w-32">Unit Price ($)</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right w-32">Total ($)</th>
                          <th className="px-4 py-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="p-0 border-r border-gray-100">
                            <input className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 px-6 py-3 text-sm text-gray-900" type="text" placeholder="Enter patient name" />
                          </td>
                          <td className="p-0 border-r border-gray-100">
                            <input className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 px-6 py-3 text-sm text-gray-900" type="text" placeholder="Hospital name" />
                          </td>
                          <td className="p-0 border-r border-gray-100">
                            <input className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 px-6 py-3 text-sm text-gray-900" type="text" placeholder="Medication or service" />
                          </td>
                          <td className="p-0 border-r border-gray-100">
                            <input className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 px-6 py-3 text-sm text-gray-900 text-right" type="number" placeholder="0" />
                          </td>
                          <td className="p-0 border-r border-gray-100">
                            <input className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/30 px-6 py-3 text-sm text-gray-900 text-right font-medium" type="number" step="0.01" placeholder="0.00" />
                          </td>
                          <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right bg-gray-50">0.00</td>
                          <td className="px-4 py-3 text-center">
                            <button className="text-gray-400 hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td className="px-6 py-4" colSpan="5">
                            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors">
                              <span className="material-symbols-outlined text-lg">add_circle</span>
                              Add New Transaction Row
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</div>
                            <div className="text-xl font-bold text-blue-600">$0.00</div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Prescription Queue */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Pending Prescription Queue</h2>
                  <button className="text-blue-600 text-sm font-bold hover:underline">Manage All Queue</button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Patient</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Medication</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Urgency</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {prescriptions?.slice(0, 5).map((prescription) => (
                        <tr key={prescription.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{prescription.patient_name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{prescription.medication}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              prescription.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                              prescription.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {prescription.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {prescription.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                              Process
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar: Quick Actions & Alerts */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <span className="material-symbols-outlined">add_circle</span>
                    New Prescription
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <span className="material-symbols-outlined">inventory_2</span>
                    Update Stock
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <span className="material-symbols-outlined">search</span>
                    Drug Interaction Check
                  </button>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Low Stock Alerts</h3>
                <div className="space-y-3">
                  {inventory?.filter(item => item.stock_level <= item.reorder_level).slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">Stock: {item.stock_level} / {item.reorder_level}</p>
                      </div>
                      <span className="material-symbols-outlined text-red-500">warning</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
