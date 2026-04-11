import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const DEMO_USERS = [
  { username: 'venkatesh', password: 'Hentailover0714', label: 'Admin View', role: 'admin' },
  { username: 'doctor_demo', password: 'password123', label: 'Doctor View', role: 'doctor' },
  { username: 'nurse_demo', password: 'password123', label: 'Nurse View', role: 'nurse' },
  { username: 'pharmacy_demo', password: 'password123', label: 'Pharmacy View', role: 'pharmacist' },
]

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  role: z.enum(['doctor', 'nurse', 'pharmacist'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<any>({
    resolver: zodResolver(isSignUp ? registerSchema : loginSchema),
    defaultValues: { rememberMe: false },
  })

  const password = watch("password", "");

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++; // Bonus for length
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score >= 5) return { score: 100, label: 'Strong', color: '#059669' };
    if (score >= 4) return { score: 75, label: 'Good', color: '#10b981' };
    if (score >= 3) return { score: 50, label: 'Fair', color: '#f59e0b' };
    return { score: 25, label: 'Weak', color: '#ef4444' };
  };

  const strength = isSignUp ? getPasswordStrength(password) : null;

  const fillDemo = (username: string, password: string) => {
    setValue('username', username)
    setValue('password', password)
  }

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      if (isSignUp) {
        // Registration flow
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: data.email.split('@')[0], // Generate username from email
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            mobile: data.mobile,
            role: data.role,
          }),
        })

        const result = await response.json()
        if (response.ok) {
          setSuccess("Account created! You'll be notified once approved.")
          setTimeout(() => {
            setIsSignUp(false)
            reset()
          }, 3000)
        } else {
          setError(result.error || 'Registration failed')
        }
      } else {
        // Login flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: data.username,
            password: data.password,
          }),
        })

        const result = await response.json()
        if (response.ok) {
          if (result.user.is_approved === 0) {
            setError('Access denied. Awaiting administrator approval.')
            return
          }
          localStorage.setItem('user', JSON.stringify(result.user))
          localStorage.setItem('token', result.token)
          router.push('/dashboard')
        } else {
          setError(result.error || 'Login failed')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Medical Records Center — Secure Login</title>
        <meta name="description" content="Sign in to Medical Records Center Management System" />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .login-page * { box-sizing: border-box; }
        .login-page {
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background-color: #f5f7f8;
        }
        .login-card {
          max-width: 1100px;
          width: 100%;
          background: #ffffff;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          border-radius: 0.75rem;
          overflow: hidden;
          display: flex;
          flex-direction: row;
          min-height: 700px;
        }
        .login-hero {
          display: none;
          width: 50%;
          position: relative;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          color: white;
          background: #3c83f6;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 20;
        }
        .login-hero.is-signup { transform: translateX(100%); }
        @media (min-width: 768px) { .login-hero { display: flex; } }
        .hero-bg {
          position: absolute; inset: 0; opacity: 0.2;
          background-image: url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80');
          background-size: cover; background-position: center;
        }
        .hero-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #3c83f6 0%, rgba(60,131,246,0.8) 50%, #1d4ed8 100%);
        }
        .hero-content { position: relative; z-index: 10; }
        .hero-logo {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem;
        }
        .hero-logo-icon {
          padding: 0.5rem; background: white; border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-logo-icon svg { color: #3c83f6; width: 28px; height: 28px; }
        .hero-title {
          font-size: 2.25rem; font-weight: 800; line-height: 1.25; margin-bottom: 1.5rem;
        }
        .hero-subtitle {
          color: #bfdbfe; font-size: 1.125rem; line-height: 1.6;
        }
        .hero-footer { position: relative; z-index: 10; }
        .hero-badges { display: flex; gap: 1.5rem; align-items: center; }
        .badge-item {
          display: flex; align-items: center; gap: 0.375rem;
          border: 1px solid rgba(255,255,255,0.3); border-radius: 0.25rem;
          padding: 0.375rem 0.75rem; background: rgba(255,255,255,0.1);
          font-size: 0.75rem; font-weight: 600;
        }
        .badge-item svg { width: 14px; height: 14px; }
        .login-form-side {
          flex: 1; padding: 4rem; display: flex; flex-direction: column; justify-content: center;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          z-index: 10;
        }
        .login-form-side.is-signup { transform: translateX(-100%); }
        .form-heading { margin-bottom: 2.5rem; }
        .form-heading h2 {
          font-size: 1.875rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;
        }
        .form-heading p { color: #64748b; margin: 0; }
        .input-group { margin-bottom: 1.5rem; }
        .input-label {
          display: block; font-size: 0.875rem; font-weight: 600;
          color: #334155; margin-bottom: 0.5rem;
        }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .input-icon svg { width: 20px; height: 20px; }
        .text-input {
          width: 100%; padding: 0.875rem 1rem 0.875rem 3rem;
          background: #f5f7f8; border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; color: #0f172a; font-family: inherit;
          outline: none; transition: all 0.15s;
        }
        .text-input:focus { border-color: #3c83f6; box-shadow: 0 0 0 4px rgba(60,131,246,0.12); background: white; }
        .text-input::placeholder { color: #94a3b8; }
        .input-error { color: #ef4444; font-size: 0.75rem; margin-top: 0.375rem; }
        .password-toggle {
          position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0;
          display: flex; transition: color 0.15s;
        }
        .password-toggle:hover { color: #475569; }
        .password-toggle svg { width: 20px; height: 20px; }
        .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .forgot-link { font-size: 0.875rem; font-weight: 500; color: #3c83f6; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; }
        .remember-row { display: flex; align-items: center; margin-bottom: 1.5rem; }
        .remember-row input { width: 16px; height: 16px; accent-color: #3c83f6; }
        .remember-row label { margin-left: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #475569; cursor: pointer; }
        .submit-btn {
          width: 100%; padding: 1rem; background: #3c83f6; color: white;
          border: none; border-radius: 0.5rem; font-size: 0.9375rem; font-weight: 700;
          cursor: pointer; font-family: inherit; display: flex; align-items: center;
          justify-content: center; gap: 0.5rem;
          box-shadow: 0 8px 24px rgba(60,131,246,0.3); transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); box-shadow: 0 12px 32px rgba(60,131,246,0.4); }
        .submit-btn:disabled { opacity: 0.75; cursor: not-allowed; }
        .submit-btn svg { width: 18px; height: 18px; transition: transform 0.2s; }
        .submit-btn:hover:not(:disabled) svg { transform: translateX(3px); }
        .divider { position: relative; margin: 1.5rem 0; }
        .divider::before { content: ''; position: absolute; inset: 0; top: 50%; height: 1px; background: #e2e8f0; }
        .divider span {
          position: relative; background: white; padding: 0 0.75rem;
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
          color: #94a3b8; display: block; width: fit-content; margin: 0 auto;
        }
        .demo-section { text-align: center; }
        .demo-label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.75rem; }
        .demo-buttons { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
        .demo-btn {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 99px; padding: 0.35rem 0.875rem;
          font-size: 0.75rem; font-weight: 600; color: #3c83f6; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .demo-btn:hover { background: #eff6ff; border-color: #3c83f6; }
        .error-box {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem;
          padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.625rem;
          color: #dc2626; font-size: 0.875rem; margin-bottom: 1.25rem;
        }
        .success-box {
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem;
          padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.625rem;
          color: #16a34a; font-size: 0.875rem; margin-bottom: 1.25rem;
        }
        .error-box svg, .success-box svg { width: 16px; height: 16px; flex-shrink: 0; }
        .strength-meter {
          height: 4px; border-radius: 2px; background: #e2e8f0;
          margin-top: 0.5rem; overflow: hidden; position: relative;
        }
        .strength-bar { height: 100%; transition: all 0.3s ease; }
        .strength-label { font-size: 11px; font-weight: 600; margin-top: 4px; display: block; text-align: right; }
        .spinner-sm {
          width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .secondary-btn {
          width: 100%; padding: 0.875rem; background: transparent; color: #3c83f6;
          border: 2px solid #3c83f6; border-radius: 0.5rem; font-size: 0.9375rem; font-weight: 700;
          cursor: pointer; font-family: inherit; display: flex; align-items: center;
          justify-content: center; gap: 0.5rem; margin-top: 1rem;
          transition: all 0.2s;
        }
        .secondary-btn:hover { background: rgba(60,131,246,0.05); transform: translateY(-1px); }
        .secondary-btn svg { width: 18px; height: 18px; transition: transform 0.2s; }
        .secondary-btn:hover svg { transform: translateX(-3px); }
        .security-badges {
          display: flex; justify-content: center; gap: 1.5rem; margin-top: 2rem;
        }
        .sec-badge {
          display: flex; align-items: center; gap: 0.375rem;
          color: #94a3b8; font-size: 0.7rem; font-weight: 600;
        }
        .sec-badge svg { width: 16px; height: 16px; }
      ` }} />

      <div className="login-page">
        <div className="login-card">
          {/* Left: Hero */}
          <div className={`login-hero ${isSignUp ? 'is-signup' : ''}`}>
            <div className="hero-bg" />
            <div className="hero-gradient" />
            <div className="hero-content">
              <div className="hero-logo">
                <div className="hero-logo-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
                  </svg>
                </div>
                <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>AegisChart</span>
              </div>
              <h1 className="hero-title">Enterprise Patient Care & Data Management</h1>
              <p className="hero-subtitle">Securely access the centralized dashboard for clinical records, scheduling, and diagnostic reporting.</p>
            </div>
            <div className="hero-footer">
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: '0.625rem' }}>Certified Security</div>
              <div className="hero-badges">
                <div className="badge-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  HIPAA COMPLIANT
                </div>
                <div className="badge-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  256-BIT AES
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className={`login-form-side ${isSignUp ? 'is-signup' : ''}`}>
            <div className="form-heading">
              <h2>{isSignUp ? 'Create Account' : 'System Login'}</h2>
              <p>{isSignUp ? 'Join the AegisChart network today.' : 'Welcome back, please enter your credentials.'}</p>
            </div>

            {error && (
              <div className="error-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {isSignUp ? (
                <>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">First Name</label>
                      <input type="text" className="text-input" style={{ paddingLeft: '1rem' }} {...register('firstName')} />
                      {errors.firstName && <p className="input-error">{(errors.firstName as any).message}</p>}
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Last Name</label>
                      <input type="text" className="text-input" style={{ paddingLeft: '1rem' }} {...register('lastName')} />
                      {errors.lastName && <p className="input-error">{(errors.lastName as any).message}</p>}
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input type="email" className="text-input" style={{ paddingLeft: '1rem' }} {...register('email')} />
                    {errors.email && <p className="input-error">{(errors.email as any).message}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Mobile Number</label>
                    <input type="tel" className="text-input" style={{ paddingLeft: '1rem' }} {...register('mobile')} />
                    {errors.mobile && <p className="input-error">{(errors.mobile as any).message}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Your Role</label>
                    <select className="text-input" style={{ paddingLeft: '1rem', appearance: 'auto' }} {...register('role')}>
                      <option value="">Select your role...</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="pharmacist">Pharmacist</option>
                    </select>
                    {errors.role && <p className="input-error">{(errors.role as any).message}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <input type="password" className="text-input" style={{ paddingLeft: '1rem' }} {...register('password')} />
                    {strength && (
                      <>
                        <div className="strength-meter">
                          <div className="strength-bar" style={{ width: `${strength.score}%`, backgroundColor: strength.color }} />
                        </div>
                        <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                      </>
                    )}
                    {errors.password && <p className="input-error">{(errors.password as any).message}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <input type="password" className="text-input" style={{ paddingLeft: '1rem' }} {...register('confirmPassword')} />
                    {errors.confirmPassword && <p className="input-error">{(errors.confirmPassword as any).message}</p>}
                  </div>
                </>
              ) : (
                <>
                  {/* Username */}
                  <div className="input-group">
                    <label className="input-label">Staff ID or Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className="text-input"
                        placeholder="e.g. staff_12345"
                        autoComplete="username"
                        {...register('username')}
                      />
                    </div>
                    {errors.username && <p className="input-error">{(errors.username as any).message}</p>}
                  </div>

                  {/* Password */}
                  <div className="input-group">
                    <div className="label-row">
                      <label className="input-label" style={{ margin: 0 }}>Password</label>
                      <a href="#" className="forgot-link">Forgot password?</a>
                    </div>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="text-input"
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        style={{ paddingRight: '3rem' }}
                        {...register('password')}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="input-error">{(errors.password as any).message}</p>}
                  </div>

                  <div className="remember-row">
                    <input type="checkbox" id="rememberMe" {...register('rememberMe')} />
                    <label htmlFor="rememberMe">Remember this workstation</label>
                  </div>
                </>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <><div className="spinner-sm" /> Processing...</>
                ) : (
                  <>
                    {isSignUp ? 'Apply for Account' : 'Sign In'}
                    {!isSignUp && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              <button type="button" className="secondary-btn" onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={isSignUp ? "M10 19l-7-7m0 0l7-7m-7 7h18" : "M14 5l7 7m0 0l-7 7m7-7H3"} />
                </svg>
                {isSignUp ? 'Back to Login' : 'Sign Up'}
              </button>
            </form>

            <div className="divider"><span>Authorized Personnel Only</span></div>

            <div className="demo-section">
              <p className="demo-label">Quick Demo Access</p>
              <div className="demo-buttons">
                {DEMO_USERS.map(u => (
                  <button key={u.username} className="demo-btn" onClick={() => fillDemo(u.username, u.password)}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="security-badges">
              <div className="sec-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                HIPAA
              </div>
              <div className="sec-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                256-BIT AES
              </div>
              <div className="sec-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                SOC 2
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
