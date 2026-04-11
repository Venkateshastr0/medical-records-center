import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [currentView, setCurrentView] = useState('home')
  
  // Photo Logic State
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showCrop, setShowCrop] = useState(false)
  const [rawImage, setRawImage] = useState<string | null>(null)
  
  // Crop Positioning State
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem('user')
    const initialUser = storedUser ? JSON.parse(storedUser) : {
      firstName: 'Venkatesh',
      lastName: 'M',
      role: 'admin',
      email: 'astroieant997@gmail.com',
      medicalId: 'MRC-ADMIN-001',
      department: 'Administrator Dashboard',
      joiningDate: '2022-03-14',
      phone: '+91 9922008184'
    }
    setUser(initialUser)
    setFormData(initialUser)
  }, [])

  const saveProfileData = async (updatedUser: any) => {
    // Optimistic update
    setUser(updatedUser)
    setFormData(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))

    // Server-side persist
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            profilePhoto: updatedUser.profilePhoto,
            phone: updatedUser.phone,
            department: updatedUser.department
          })
        });
        
        if (!response.ok) {
          console.error('Failed to persist profile update to database');
        } else {
          const res = await response.json();
          // Update local state with exact data from database if needed
          if (res.user) {
             const userToSave = { ...updatedUser, ...res.user };
             setUser(userToSave);
             localStorage.setItem('user', JSON.stringify(userToSave));
          }
        }
      } catch (err) {
        console.error('Error saving profile to database:', err);
      }
    }
  }

  // --- CAMERA LOGIC ---
  const startCamera = () => {
    setShowCamera(true)
    setShowPhotoMenu(false)
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showCamera && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          alert("Camera access denied or unavailable.");
          setShowCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context?.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg')
      
      setRawImage(dataUrl)
      setShowCamera(false) // This will trigger cleanup in useEffect
      setShowCrop(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
  }

  const stopCamera = () => {
    setShowCamera(false)
  }

  // --- GALLERY LOGIC ---
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setRawImage(reader.result as string)
        setShowPhotoMenu(false)
        setShowCrop(true)
        setZoom(1)
        setOffset({ x: 0, y: 0 })
      }
      reader.readAsDataURL(file)
    }
  }

  // --- CROP LOGIC ---
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y })
  }

  const applyCrop = () => {
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx || !rawImage) return

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)
      
      // Calculate drawn size based on zoom and original image aspect
      const aspect = img.width / img.height
      let drawW, drawH
      if (aspect > 1) {
        drawH = size * zoom
        drawW = drawH * aspect
      } else {
        drawW = size * zoom
        drawH = drawW / aspect
      }

      // Center it plus offset
      const dx = (size - drawW) / 2 + offset.x
      const dy = (size - drawH) / 2 + offset.y
      
      ctx.drawImage(img, dx, dy, drawW, drawH)
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.8)
      
      const updated = { ...user, profilePhoto: croppedBase64 }
      saveProfileData(updated)
      setShowCrop(false)
      setRawImage(null)
    }
    img.src = rawImage
  }

  if (!mounted || !formData || !user) return null

  const initials = `${user.firstName?.[0] || 'S'}${user.lastName?.[0] || 'A'}`.toUpperCase()

  return (
    <Layout title="Account Settings" subtitle="Personal and professional identity management.">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </Head>

      <div className="page-wrapper" onClick={() => setShowPhotoMenu(false)}>
        
        {/* IDENTITY BLOCK */}
        <div className="identity-block">
          <button className="id-back-btn" onClick={(e) => { 
            e.stopPropagation()
            if (currentView === 'home') router.push('/dashboard')
            else { setIsEditing(false); setCurrentView('home'); }
          }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className="id-banner"></div>
          
          <div className="id-main">
            <div className="avatar-root">
              <div className="id-avatar" onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(!showPhotoMenu); }}>
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="avatar-img" />
                ) : (
                  initials
                )}
                <div className="avatar-overlay">
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
              </div>

              {showPhotoMenu && (
                <div className="photo-popover" onClick={e => e.stopPropagation()}>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => { handleFile(e); setShowPhotoMenu(false); }} />
                  <button className="photo-opt" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <span className="material-symbols-outlined">gallery_thumbnail</span> Gallery Pick
                  </button>
                  <button className="photo-opt" onClick={(e) => { e.stopPropagation(); startCamera(); }}>
                    <span className="material-symbols-outlined">camera_front</span> Camera Shot
                  </button>
                  {user.profilePhoto && (
                    <button className="photo-opt text-red" onClick={() => { saveProfileData({...user, profilePhoto: null}); setShowPhotoMenu(false); }}>
                      <span className="material-symbols-outlined">delete_forever</span> Reset Avatar
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="id-info">
              <div className="id-name">Dr. {user?.firstName} {user?.lastName}</div>
              <div className="id-meta">
                <span className="badge badge-purple">{user?.role}</span>
                <span className="id-dept">{user?.department}</span>
              </div>
            </div>
          </div>

          <div className="id-stats">
            <div className="id-stat"><div className="id-stat-val">847</div><div className="id-stat-label">Logins</div></div>
            <div className="id-stat"><div className="id-stat-val">3.2y</div><div className="id-stat-label">Tenure</div></div>
          </div>
        </div>

        {/* VIEWS (HOME / PERSONAL / etc) */}
        {currentView === 'home' && (
          <div className="options-grid">
            <div className="option-card" style={{'--card-accent': 'var(--brand)'} as any} onClick={() => setCurrentView('personal')}>
              <div className="option-icon" style={{background: 'hsl(210,100%,56%,0.1)', color: 'hsl(210,100%,70%)'}}><span className="material-symbols-outlined">person</span></div>
              <div><div className="option-label">Personal Info</div><div className="option-sub">Name, contact details</div></div>
              <span className="material-symbols-outlined option-chevron">chevron_right</span>
            </div>
            <div className="option-card" style={{'--card-accent': 'hsl(250,100%,65%)'} as any} onClick={() => setCurrentView('role')}>
              <div className="option-icon" style={{background: 'hsl(250,100%,65%,0.12)', color: 'hsl(250,100%,78%)'}}><span className="material-symbols-outlined">badge</span></div>
              <div><div className="option-label">Role & Dept</div><div className="option-sub">Organisation position</div></div>
              <span className="material-symbols-outlined option-chevron">chevron_right</span>
            </div>
            <div className="option-card" style={{'--card-accent': 'hsl(0,72%,58%)', gridColumn: '1/-1'} as any} onClick={() => setCurrentView('security')}>
              <div className="option-icon" style={{background: 'hsl(0,72%,58%,0.1)', color: 'hsl(0,72%,68%)'}}><span className="material-symbols-outlined">lock</span></div>
              <div><div className="option-label">Security Settings</div><div className="option-sub">Password, 2FA, Safety</div></div>
              <span className="material-symbols-outlined option-chevron">chevron_right</span>
            </div>
          </div>
        )}

        {currentView === 'personal' && (
          <div className="section-card">
            <div className="section-head">
               <div className="section-head-left">
                  <div className="sh-icon"><span className="material-symbols-outlined">person</span></div>
                  <div><div className="sh-title">Personal Information</div><div className="sh-sub">Manage identity details</div></div>
               </div>
               {!isEditing && <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>Edit Profile</button>}
            </div>
            <div className="section-body">
              {isEditing && (
                <div className="save-bar visible" style={{marginBottom: '1.5rem'}}>
                  <div className="save-bar-text">Editing profile data...</div>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => { saveProfileData(formData); setIsEditing(false); }}>Save Changes</button>
                  </div>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group"><label className="form-label">First Name</label><input className={`form-input ${isEditing ? 'editable' : ''}`} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} readOnly={!isEditing} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className={`form-input ${isEditing ? 'editable' : ''}`} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} readOnly={!isEditing} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className={`form-input ${isEditing ? 'editable' : ''}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} readOnly={!isEditing} /></div>
                <div className="form-group"><label className="form-label">Phone/Mobile</label><input className={`form-input ${isEditing ? 'editable' : ''}`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} readOnly={!isEditing} /></div>
                <div className="form-group"><label className="form-label">Department</label><input className={`form-input ${isEditing ? 'editable' : ''}`} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} readOnly={!isEditing} /></div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'security' && (
           <div className="section-card"><div className="section-body" style={{textAlign:'center', color:'var(--tm)', padding:'3rem'}}>Advanced security features are currently restricted by administrator.</div></div>
        )}

        {/* --- CAMERA OVERLAY --- */}
        {showCamera && (
          <div className="portal-overlay">
            <div className="tool-modal" onClick={e => e.stopPropagation()}>
              <div className="tool-header"><h3>Live Camera</h3><button className="close-btn-round" onClick={stopCamera}><span className="material-symbols-outlined">close</span></button></div>
              <div className="camera-view-container"><video ref={videoRef} autoPlay playsInline className="p-video" /></div>
              <div className="tool-footer"><button className="btn-capture" onClick={capturePhoto}><div className="shutter"></div></button></div>
            </div>
          </div>
        )}

        {/* --- CROP OVERLAY --- */}
        {showCrop && (
          <div className="portal-overlay">
            <div className="tool-modal" onClick={e => e.stopPropagation()}>
              <div className="tool-header"><h3>Adjust Photo</h3><button className="close-btn-round" onClick={() => setShowCrop(false)}><span className="material-symbols-outlined">close</span></button></div>
              <div className="crop-area-wrap">
                <div className="crop-box" 
                     onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
                     onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={() => setIsDragging(false)}>
                  <img src={rawImage!} className="crop-img-preview" 
                       style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
                  <div className="crop-vignette"></div>
                  <div className="crop-grid"></div>
                </div>
              </div>
              <div className="crop-controls">
                <span className="material-symbols-outlined" style={{fontSize: '14px'}}>zoom_out</span>
                <input type="range" min="0.5" max="3" step="0.01" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="zoom-slider" />
                <span className="material-symbols-outlined" style={{fontSize: '14px'}}>zoom_in</span>
              </div>
              <div className="tool-footer" style={{flexDirection:'row', gap:'1rem'}}>
                 <button className="btn btn-ghost" onClick={() => setShowCrop(false)}>Discard</button>
                 <button className="btn btn-primary" onClick={applyCrop} style={{flex: 1}}>Save Profile Photo</button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} hidden />
      </div>

      <style jsx>{`
        .page-wrapper {
          --s0: hsl(222,28%,8%); --s1: hsl(222,24%,11%); --s2: hsl(222,20%,14%); --s3: hsl(222,18%,18%); --bd: hsl(222,18%,22%);
          --tp: hsl(210,20%,96%); --ts: hsl(215,15%,60%); --tm: hsl(215,12%,40%); --brand: hsl(210,100%,56%);
          font-family: 'Inter', sans-serif; width: 100%; color: var(--tp);
        }
        
        /* Identity */
        .identity-block { background: var(--s1); border: 1px solid var(--bd); border-radius: 12px; overflow: hidden; margin-bottom: 1rem; position: relative; }
        .id-back-btn { position: absolute; top: 12px; left: 12px; z-index: 50; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0,0,0,0.4); color: white; opacity: 0.6; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .id-back-btn:hover { opacity: 1; background: rgba(0,0,0,0.7); }
        .id-banner { height: 64px; background: linear-gradient(135deg, hsl(222,40%,15%), hsl(240,35%,18%)); position: relative; }
        .id-main { padding: 0 1.25rem 1.25rem; display: flex; align-items: flex-end; gap: 1rem; margin-top: -26px; position: relative; z-index: 10; }
        
        /* Avatar */
        .avatar-root { position: relative; }
        .id-avatar { width: 62px; height: 62px; border-radius: 14px; background: linear-gradient(135deg, var(--brand), hsl(250,100%,65%)); border: 3px solid var(--s1); box-shadow: 0 8px 24px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 800; cursor: pointer; overflow: hidden; position: relative; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; }
        .id-avatar:hover .avatar-overlay { opacity: 1; }
        
        .photo-popover { position: absolute; top: calc(100% + 10px); left: 0; background: var(--s2); border: 1px solid var(--bd); border-radius: 12px; padding: 6px; z-index: 1000; min-width: 170px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); animation: slideIn 0.2s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .photo-opt { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; background: transparent; color: var(--tp); font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: 8px; text-align: left; }
        .photo-opt:hover { background: var(--s3); }
        .text-red { color: #f87171 !important; }

        /* Portal Modals */
        .portal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .tool-modal { background: var(--s1); border: 1px solid var(--bd); border-radius: 24px; width: 100%; max-width: 480px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.8); }
        .tool-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--bd); display: flex; align-items: center; justify-content: space-between; }
        .tool-header h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; color: var(--ts); margin: 0; }
        .close-btn-round { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--s2); color: var(--ts); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .camera-view-container { background: #000; aspect-ratio: 1; overflow: hidden; position: relative; }
        .p-video { width: 100%; height: 100%; object-fit: cover; }
        
        .tool-footer { padding: 1.5rem; display: flex; justify-content: center; background: var(--s1); border-top: 1px solid var(--bd); }
        .btn-capture { width: 64px; height: 64px; border-radius: 50%; border: 4px solid white; background: transparent; padding: 4px; cursor: pointer; transition: 0.2s; }
        .btn-capture:active { transform: scale(0.9); }
        .shutter { width: 100%; height: 100%; border-radius: 50%; background: white; }

        /* Adjustment / Crop UI */
        .crop-area-wrap { background: #050505; aspect-ratio: 1; overflow: hidden; position: relative; }
        .crop-box { width: 100%; height: 100%; position: relative; cursor: move; }
        .crop-img-preview { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
        .crop-vignette { position: absolute; inset: 0; border: 40px solid rgba(0,0,0,0.7); pointer-events: none; }
        .crop-grid { position: absolute; inset: 40px; border: 1px solid rgba(255,255,255,0.3); pointer-events: none; box-shadow: 0 0 0 1000px rgba(0,0,0,0.3); }
        .crop-controls { padding: 1rem 1.5rem; background: var(--s2); display: flex; align-items: center; gap: 1rem; color: var(--ts); }
        .zoom-slider { flex: 1; accent-color: var(--brand); height: 4px; cursor: pointer; }

        /* Rest of UI */
        .id-info { padding-bottom: 15px; }
        .id-name { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em; margin-bottom: 4px; }
        .id-meta { display: flex; align-items: center; gap: 10px; }
        .badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; color: var(--ts); border: 1px solid var(--bd); }
        .id-stats { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--bd); }
        .id-stat { padding: 15px; border-right: 1px solid var(--bd); text-align: center; }
        .id-stat:last-child { border-right: none; }
        .id-stat-val { font-size: 1.2rem; font-weight: 800; color: var(--tp); }
        .id-stat-label { font-size: 0.6rem; text-transform: uppercase; color: var(--tm); font-weight: 700; margin-top: 2px; }

        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
        .option-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s; position: relative; overflow: hidden; }
        .option-card:hover { border-color: var(--brand); background: var(--s2); }
        .option-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .option-label { font-weight: 700; font-size: 0.9rem; color: var(--tp); }
        .option-sub { font-size: 0.75rem; color: var(--tm); margin-top: 2px; }

        .section-card { background: var(--s1); border: 1px solid var(--bd); border-radius: 16px; overflow: hidden; }
        .section-head { padding: 1.25rem; border-bottom: 1px solid var(--bd); background: var(--s2); display: flex; justify-content: space-between; align-items: center; }
        .sh-title { font-weight: 800; font-size: 0.9rem; }
        .sh-sub { font-size: 0.7rem; color: var(--tm); }
        .section-body { padding: 1.5rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--tm); margin-bottom: 8px; display: block; }
        .form-input { width: 100%; background: var(--s2); border: 1px solid var(--bd); border-radius: 10px; padding: 10px 14px; color: var(--tp); font-size: 0.85rem; outline: none; transition: 0.2s; }
        .form-input.editable { border-color: var(--brand); background: var(--s3); }
        
        .btn { padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; border: none; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .btn-primary { background: var(--brand); color: white; }
        .btn-ghost { background: var(--s2); color: var(--ts); border: 1px solid var(--bd); }
      `}</style>
    </Layout>
  )
}
