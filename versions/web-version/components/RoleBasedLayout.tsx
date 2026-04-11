import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface User {
  id: number
  username: string
  role: string
  first_name: string
  last_name: string
}

interface RoleBasedLayoutProps {
  children: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
}

export default function RoleBasedLayout({ children, requiredRole, allowedRoles }: RoleBasedLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      // Check if user has required role
      if (requiredRole && user.role !== requiredRole) {
        router.push('/unauthorized')
        return
      }

      // Check if user is in allowed roles
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized')
        return
      }

      // Redirect to role-specific dashboard
      if (router.pathname === '/dashboard') {
        switch (user.role) {
          case 'receptionist':
            router.push('/dashboard/receptionist')
            break
          case 'doctor':
            router.push('/dashboard/doctor')
            break
          case 'nurse':
            router.push('/dashboard/nurse')
            break
          case 'pharmacy':
            router.push('/dashboard/pharmacy')
            break
          case 'admin':
            router.push('/dashboard/admin')
            break
          default:
            router.push('/dashboard/staff')
        }
      }
    }
  }, [user, loading, router, requiredRole, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return <>{children}</>
}

// Role-based navigation component
export function RoleBasedNav({ user }: { user: User }) {
  const router = useRouter()

  const getNavItems = () => {
    switch (user.role) {
      case 'receptionist':
        return [
          { label: 'Dashboard', href: '/dashboard/receptionist', icon: 'dashboard' },
          { label: 'Patients', href: '/patients', icon: 'people' },
          { label: 'Appointments', href: '/appointments', icon: 'calendar_today' },
          { label: 'Billing', href: '/billing', icon: 'payments' },
        ]
      
      case 'doctor':
        return [
          { label: 'Dashboard', href: '/dashboard/doctor', icon: 'dashboard' },
          { label: 'Patients', href: '/patients', icon: 'people' },
          { label: 'Appointments', href: '/appointments', icon: 'calendar_today' },
          { label: 'Medical Records', href: '/medical-records', icon: 'medical_information' },
          { label: 'Prescriptions', href: '/prescriptions', icon: 'medication' },
          { label: 'Lab Results', href: '/lab-results', icon: 'science' },
        ]
      
      case 'nurse':
        return [
          { label: 'Dashboard', href: '/dashboard/nurse', icon: 'dashboard' },
          { label: 'Patients', href: '/patients', icon: 'people' },
          { label: 'Vitals', href: '/vitals', icon: 'monitor_heart' },
          { label: 'Medications', href: '/medications', icon: 'medication' },
          { label: 'Appointments', href: '/appointments', icon: 'calendar_today' },
        ]
      
      case 'pharmacy':
        return [
          { label: 'Dashboard', href: '/dashboard/pharmacy', icon: 'dashboard' },
          { label: 'Prescriptions', href: '/prescriptions', icon: 'medication' },
          { label: 'Inventory', href: '/inventory', icon: 'inventory' },
          { label: 'Patients', href: '/patients', icon: 'people' },
        ]
      
      case 'admin':
        return [
          { label: 'Dashboard', href: '/dashboard/admin', icon: 'dashboard' },
          { label: 'Users', href: '/users', icon: 'manage_accounts' },
          { label: 'Patients', href: '/patients', icon: 'people' },
          { label: 'Reports', href: '/reports', icon: 'analytics' },
          { label: 'Settings', href: '/settings', icon: 'settings' },
          { label: 'Security', href: '/security', icon: 'security' },
        ]
      
      default:
        return [
          { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
          { label: 'Profile', href: '/profile', icon: 'person' },
        ]
    }
  }

  const navItems = getNavItems()

  return (
    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            router.pathname === item.href
              ? 'bg-blue-100 text-blue-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined mr-3">
            {item.icon}
          </span>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
