import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AppointmentTrendsData {
  day: string
  scheduled: number
  completed: number
  cancelled: number
}

interface AppointmentTrendsChartProps {
  data: AppointmentTrendsData[]
}

export default function AppointmentTrendsChart({ data }: AppointmentTrendsChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb'
            }}
            labelStyle={{ color: '#f9fafb' }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          <Bar 
            dataKey="scheduled" 
            fill="#3b82f6" 
            name="Scheduled"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="completed" 
            fill="#22c55e" 
            name="Completed"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="cancelled" 
            fill="#ef4444" 
            name="Cancelled"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
