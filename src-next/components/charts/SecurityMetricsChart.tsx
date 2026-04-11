import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SecurityMetricsData {
  time: string
  login_attempts: number
  failed_logins: number
  security_alerts: number
}

interface SecurityMetricsChartProps {
  data: SecurityMetricsData[]
}

export default function SecurityMetricsChart({ data }: SecurityMetricsChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
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
            dataKey="time" 
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
          <Area 
            type="monotone" 
            dataKey="login_attempts" 
            stackId="1"
            stroke="#3b82f6" 
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Login Attempts"
          />
          <Area 
            type="monotone" 
            dataKey="failed_logins" 
            stackId="1"
            stroke="#ef4444" 
            fill="#ef4444"
            fillOpacity={0.6}
            name="Failed Logins"
          />
          <Area 
            type="monotone" 
            dataKey="security_alerts" 
            stackId="1"
            stroke="#f59e0b" 
            fill="#f59e0b"
            fillOpacity={0.6}
            name="Security Alerts"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
