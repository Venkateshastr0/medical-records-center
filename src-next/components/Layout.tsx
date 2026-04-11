import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DoctorRxSidebar from './DoctorRxSidebar'

interface NavItem {
    label: string
    href: string
    icon: ReactNode
    badge?: number
    section?: string
}

const nav: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <span className="material-symbols-outlined">dashboard</span>,
    },
    {
        label: 'Patients',
        href: '/patients',
        icon: <span className="material-symbols-outlined">person</span>,
    },
    {
        label: 'Appointments',
        href: '/appointments',
        icon: <span className="material-symbols-outlined">calendar_month</span>,
        badge: 3,
    },
    {
        label: 'Pharmacy',
        href: '/pharmacy',
        icon: <span className="material-symbols-outlined">local_pharmacy</span>,
    },
    {
        label: 'Security',
        href: '/security',
        icon: <span className="material-symbols-outlined">security</span>,
    },
]
interface LayoutProps {
    children: ReactNode
    title?: string
    subtitle?: string
    actions?: ReactNode
    hideSidebar?: boolean
    hideBackButton?: boolean
}

export default function Layout({ children, title = 'Dashboard', subtitle, actions, hideSidebar = false, hideBackButton = false }: LayoutProps) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [user, setUser] = useState<any>({ id: 1, firstName: 'Venkatesh', lastName: 'M', role: 'admin', email: 'astroieant997@gmail.com', medicalId: 'MRC-ADMIN-001' })
    const [rxSidebarOpen, setRxSidebarOpen] = useState(false)
    const [rxSidebarPatient, setRxSidebarPatient] = useState<any>(null)

    useEffect(() => {
        setMounted(true)
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setUser({
                    ...parsed,
                    firstName: parsed.firstName || parsed.first_name || '',
                    lastName: parsed.lastName || parsed.last_name || '',
                })
            } catch (e) {
                console.error('Auth sync error:', e)
            }
        }

        // Auto-close menu on global click (only if clicking outside)
        const closeMenu = (e: MouseEvent) => {
            const container = document.querySelector('.user-menu-container')
            if (container && !container.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        window.addEventListener('click', closeMenu)

        // Listen for prescription sidebar events
        const handleOpenRxSidebar = (e: CustomEvent) => {
            setRxSidebarPatient(e.detail.patient)
            setRxSidebarOpen(true)
        }
        window.addEventListener('open-rx-sidebar', handleOpenRxSidebar as EventListener)

        return () => {
            window.removeEventListener('click', closeMenu)
            window.removeEventListener('open-rx-sidebar', handleOpenRxSidebar as EventListener)
        }
    }, [])

    const fullName = user?.firstName || user?.lastName 
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
        : 'Administrator'
    const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase()

    const handleLogout = () => {
        localStorage.clear()
        router.push('/login')
    }

    // Role-specific navigation filters
    const filteredNav = mounted ? nav.filter(item => {
        if (user.role === 'admin') {
            return ['Dashboard', 'Patients', 'Pharmacy', 'Security'].includes(item.label)
        }
        if (user.role === 'doctor') {
            return ['Dashboard', 'Patients', 'Appointments'].includes(item.label)
        }
        if (user.role === 'nurse') {
            return ['Dashboard', 'Patients', 'Appointments'].includes(item.label)
        }
        if (user.role === 'pharmacist') {
            return ['Dashboard', 'Pharmacy', 'Prescriptions'].includes(item.label)
        }
        if (user.role === 'patient') {
            return ['Dashboard', 'Appointments', 'Prescriptions'].includes(item.label)
        }
        return true // Default fallback
    }) : nav

    return (
        <div className="app-layout">
            {/* Sidebar */}
            {!hideSidebar && (
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
                    {filteredNav.map(item => {
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

                    {/* User Profile Bar (Single Bar with Popover) */}
                    <div className="user-menu-container">
                        {menuOpen && (
                            <div className="user-menu-popover">
                                <Link 
                                    href="/profile" 
                                    className="menu-option"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <span className="material-symbols-outlined">account_circle</span>
                                    <span>My Profile</span>
                                </Link>
                                <button 
                                    className="menu-option text-red"
                                    onClick={handleLogout}
                                >
                                    <span className="material-symbols-outlined">logout</span>
                                    <span>Logout Account</span>
                                </button>
                            </div>
                        )}
                        
                        <button 
                            className={`user-profile-bar-single ${menuOpen ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpen(!menuOpen)
                            }}
                            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                        >
                            <div className="user-avatar-small">
                                {user.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                                ) : (
                                    initials
                                )}
                            </div>
                            {!collapsed && (
                                <div className="user-info-mini">
                                    <div className="user-name-mini">{fullName}</div>
                                    <div className="user-role-mini">{user.role}</div>
                                </div>
                            )}
                            {!collapsed && (
                                <svg 
                                    width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    style={{ marginLeft: 'auto', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
            )}

            {/* Main */}
            <main className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    {hideSidebar && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginRight: '1rem' }}>
                            {!hideBackButton && (
                                <>
                                    <button 
                                        onClick={() => router.back()} 
                                        className="btn btn-ghost" 
                                        style={{ 
                                            padding: '0.4rem 0.6rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        <span style={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.05em' }}>BACK</span>
                                    </button>
                                    <div className="divider-v" />
                                </>
                            )}
                            <Link href="/dashboard" className="sidebar-logo" style={{ border: 'none', padding: 0, gap: '0.75rem' }}>
                                <div className="sidebar-logo-icon" style={{ width: '32px', height: '32px', fontSize: '0.7rem' }}>AC</div>
                                <div className="sidebar-logo-text" style={{ fontSize: '0.9rem' }}>AegisChart</div>
                            </Link>
                        </div>
                    )}
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

                <div className="page-body animate-fade-in" style={{ overflowX: 'auto', minWidth: 0, maxWidth: '100%' }}>
                    {children}
                </div>

            </main>

            {/* Prescription Sidebar */}
            {rxSidebarOpen && (
                <DoctorRxSidebar
                    onClose={() => setRxSidebarOpen(false)}
                    doctorId={user?.id || '1'}
                    initialPatient={rxSidebarPatient}
                    onPrescriptionTransmitted={() => {
                        // Optional: Refresh data or show notification
                        console.log('Prescription transmitted')
                    }}
                />
            )}

            {/* Floating Prescription Button for Doctors */}
            {(user?.role === 'doctor' || user?.role === 'nurse') && !rxSidebarOpen && (
                <button
                    className="btn-rx-quick"
                    onClick={() => {
                        setRxSidebarOpen(true)
                        setRxSidebarPatient(null)
                    }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        zIndex: 1000,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)'
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.6)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
                    }}
                    title="Quick Prescription"
                >
                    <span className="material-symbols-outlined" style={{ 
                        fontSize: '1.8rem', 
                        color: 'white',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}>
                        medication
                    </span>
                </button>
            )}


            <style jsx>{`
                .user-menu-container {
                    position: relative;
                    width: 100%;
                }
                .user-menu-popover {
                    position: absolute;
                    bottom: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: hsl(var(--surface-1));
                    border: 1px solid hsl(var(--border));
                    border-radius: 12px;
                    padding: 0.5rem;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    z-index: 100;
                    animation: slideUp 0.2s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .menu-option {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: hsl(var(--text-primary));
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                    border: none;
                    background: none;
                    width: 100%;
                }
                .menu-option:hover { background: hsl(var(--surface-2)); }
                .menu-option.text-red { color: #f87171; }
                .menu-option.text-red:hover { background: #ef444410; }

                .user-profile-bar-single {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem; /* Tighter gap after icon */
                    height: 52px;
                    padding: 0 0.5rem; /* Reduced padding for left-corner alignment */
                    background: hsl(var(--surface-2));
                    border: 1px solid hsl(var(--border) / 0.5);
                    border-radius: 10px;
                    width: 100%;
                    cursor: pointer;
                }
                .user-profile-bar-single:hover, .user-profile-bar-single.active {
                    background: hsl(var(--surface-3));
                    border-color: hsl(var(--brand) / 0.3);
                }

                .divider-v {
                    width: 1px;
                    height: 24px;
                    background: hsl(var(--border));
                }
                .user-avatar-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: var(--brand-dim); /* Fallback */
                    background: linear-gradient(135deg, hsl(var(--brand)), hsl(250 100% 65%));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: white;
                }
                .user-info-mini {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.2;
                    min-width: 0;
                    text-align: left; /* Ensure left alignment */
                }
                .user-name-mini { 
                    font-size: 0.75rem; 
                    font-weight: 800; 
                    color: hsl(var(--text-primary));
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .user-role-mini { 
                    font-size: 0.62rem; 
                    color: hsl(var(--brand)); 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em;
                    text-align: left;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1.5rem;
                }
                .modal-content {
                    background: hsl(var(--surface-1));
                    border: 1px solid hsl(var(--border));
                    border-radius: 20px;
                    width: 100%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid hsl(var(--border));
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-title { font-size: 1rem; font-weight: 800; tracking-widest; text-transform: uppercase; color: hsl(var(--text-primary)); }
                .close-btn { background: none; border: none; color: hsl(var(--text-muted)); font-size: 1.5rem; cursor: pointer; }
                .modal-body { padding: 1.5rem; }

                .btn-rx-quick {
                    width: 100%;
                    background: linear-gradient(135deg, hsl(var(--brand)), hsl(260 100% 65%));
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem;
                    font-size: 0.72rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    box-shadow: 0 4px 12px hsl(var(--brand) / 0.3);
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .btn-rx-quick:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px hsl(var(--brand) / 0.4);
                    filter: brightness(1.1);
                }
                .btn-rx-quick:active { transform: translateY(0); }
            `}</style>
        </div>
    )
}
