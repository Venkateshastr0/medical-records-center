import { useState, ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavItem {
    label: string
    href: string
    icon: ReactNode
    badge?: number
    section?: string
}

const nav: NavItem[] = [
    {
        section: 'Overview',
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        section: 'Clinical',
        label: 'Patients',
        href: '/patients',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        label: 'Medical Records',
        href: '/medical-records',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        label: 'Appointments',
        href: '/appointments',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        badge: 3,
    },
    {
        label: 'Prescriptions',
        href: '/prescriptions',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        label: 'Lab Results',
        href: '/lab-results',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        ),
        badge: 2,
    },
    {
        section: 'Security',
        label: 'Security',
        href: '/security',
        icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
]

interface LayoutProps {
    children: ReactNode
    title?: string
    subtitle?: string
    actions?: ReactNode
}

export default function Layout({ children, title = 'Dashboard', subtitle, actions }: LayoutProps) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [user, setUser] = useState<{ name: string; role: string }>({ name: 'Admin', role: 'Admin' })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const userData = typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user') || '{"name":"Admin","role":"Admin"}')
            : { name: 'Admin', role: 'Admin' }
        setUser(userData)
    }, [])

    const initials = user.name?.slice(0, 2).toUpperCase() || 'AD'

    const handleLogout = () => {
        localStorage.clear()
        router.push('/login')
    }

    // group nav by section
    const sections: { label?: string; items: NavItem[] }[] = []
    let current: { label?: string; items: NavItem[] } = { items: [] }
    nav.forEach(item => {
        if (item.section) {
            if (current.items.length) sections.push(current)
            current = { label: item.section, items: [item] }
        } else {
            current.items.push(item)
        }
    })
    if (current.items.length) sections.push(current)

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar" style={{ width: collapsed ? '72px' : '260px', transition: 'width 0.2s ease' }}>
                {/* Logo */}
                <Link href="/dashboard" className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                    <div className="sidebar-logo-icon">AC</div>
                    {!collapsed && (
                        <div>
                            <div className="sidebar-logo-text">AegisChart</div>
                            <div className="sidebar-logo-sub">Medical Records</div>
                        </div>
                    )}
                </Link>

                {/* Nav */}
                <nav className="sidebar-nav">
                    {sections.map((section, si) => (
                        <div key={si}>
                            {section.label && !collapsed && (
                                <div className="sidebar-section-label">{section.label}</div>
                            )}
                            {section.items.map(item => {
                                const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.7rem' : undefined }}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <span className="nav-icon" style={{ flexShrink: 0 }}>{item.icon}</span>
                                        {!collapsed && (
                                            <>
                                                <span style={{ flex: 1 }}>{item.label}</span>
                                                {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                                            </>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                    >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                        {!collapsed && <span>Collapse</span>}
                    </button>

                    {/* User */}
                    <div className="user-card" onClick={handleLogout} title="Click to logout">
                        <div className="user-avatar">{initials}</div>
                        {!collapsed && (
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="user-name">{user.name}</div>
                                <div className="user-role">{user.role}</div>
                            </div>
                        )}
                        {!collapsed && (
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                                style={{ color: 'hsl(215 12% 40%)', flexShrink: 0 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    <div style={{ flex: 1 }}>
                        <div className="topbar-title">{title}</div>
                        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
                    </div>

                    {/* Actions */}
                    {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{actions}</div>}

                    {/* Status indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="pulse-dot" />
                        <span style={{ fontSize: '0.72rem', color: 'hsl(215 12% 40%)' }}>System Online</span>
                    </div>
                </header>

                {/* Page content */}
                <div className="page-body animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    )
}
