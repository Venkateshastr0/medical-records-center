import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

interface Prescription {
  id: string
  patient_id: string
  patient_name: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  duration: string
  instructions: string
  prescription_date: string
  status: string
  doctor_name: string
}

interface GroupedPrescription {
  id: string
  patientId: string
  patientName: string
  doctor: string
  status: string
  date: number
  ids: string[]
  meds: any[]
}

export default function PharmacyPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [completedPrescriptions, setCompletedPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [packingId, setPackingId] = useState<string | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)
  
  const [filterSel, setFilterSel] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    setMounted(true)
    fetchPrescriptions()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  const DAY = 86400000;
  const now = Date.now();
  const isOld = (date: number) => (now - date) > DAY;

  const fetchPrescriptions = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/prescriptions?auto_clear_old=true&_t=${Date.now()}`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to fetch prescriptions')
      const data = await res.json()
      setPrescriptions(
        data.map((p: any) => ({
          ...p,
          patient_name: p.patient_name || `Patient ${p.patient_id?.slice(0, 4) || 'N/A'}`,
          prescription_date: p.prescription_date || new Date().toISOString()
        }))
      )
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  const printRx = (group: GroupedPrescription) => {
    setPrintingId(group.id)
    const win = window.open('', '', 'width=680,height=760')
    if (!win) return
    
    const tot = total(group.meds);
    const rows = group.meds.map(m => `<tr><td>${m.name}</td><td>${m.freq}</td><td>${m.dosage}</td><td>${m.route}</td><td>${m.instr}</td><td style="text-align:right">₹${m.price.toFixed(2)}</td></tr>`).join('');

    win.document.write(`<html><head><title>Prescription — ${group.patientName}</title>
    <style>body{font-family:Arial,sans-serif;padding:28px;font-size:13px;color:#111}
    h2{font-size:18px;margin-bottom:2px}.sub{color:#555;font-size:13px;margin-bottom:16px}
    .meta{display:flex;gap:32px;margin-bottom:20px;font-size:13px}
    .meta b{display:block;margin-bottom:2px;color:#333}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:1px solid #ccc;padding:6px 4px}
    td{padding:8px 4px;border-bottom:1px solid #eee;vertical-align:top}
    .total{text-align:right;margin-top:12px;font-size:14px;font-weight:bold}
    .footer{margin-top:28px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:12px}
    </style></head><body>
    <h2>Medical Prescription</h2>
    <div class="sub">Generated on ${new Date().toLocaleString('en-IN')}</div>
    <div class="meta">
      <div><b>Patient</b>${group.patientName}</div>
      <div><b>Patient ID</b>${group.patientId}</div>
      <div><b>Doctor</b>${group.doctor}</div>
      <div><b>Date</b>${new Date(group.date).toLocaleDateString('en-IN')}</div>
    </div>
    <table>
      <thead><tr><th>Medication</th><th>Freq</th><th>Dosage</th><th>Route</th><th>Instructions</th><th style="text-align:right">MRP</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total">Total: ₹${tot.toFixed(2)}</div>
    <div class="footer">This is a computer-generated prescription. Follow instructions carefully.</div>
    </body></html>`);
    win.document.close(); win.print(); win.onafterprint=()=>win.close();
    setPrintingId(null)
  }

  const fulfillPrescription = async (group: GroupedPrescription) => {
    setPackingId(group.id)
    try {
      await Promise.all(group.ids.map(id => fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'Completed' })
      })))
      
      setPrescriptions(prev => prev.filter(p => !group.ids.includes(p.id)))
      const completed = prescriptions.filter(p => group.ids.includes(p.id))
      setCompletedPrescriptions(prev => [...prev, ...completed])
      
      showToast('Bill saved for ' + group.patientName)
      setOpenId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPackingId(null)
    }
  }

  const clearRx = async (group: GroupedPrescription) => {
    if (!confirm('Clear this old prescription?')) return
    try {
      await Promise.all(group.ids.map(id => fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'Discontinued' })
      })))
      setPrescriptions(prev => prev.filter(p => !group.ids.includes(p.id)))
      setOpenId(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const initials = (name: string) => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const getBadge = (p: GroupedPrescription) => {
    if(p.status === 'Discontinued') return <span className="custom-badge custom-disc">Discontinued</span>;
    if(isOld(p.date)) return <span className="custom-badge custom-old">Old</span>;
    return <span className="custom-badge custom-active">Active</span>;
  }
  const total = (meds: any[]) => meds.reduce((s,m) => s + m.price, 0)
  const fmt = (n: number) => '₹' + n.toFixed(2)

  if (!mounted) return null

  // Group prescriptions by patient and date roughly
  const groupedObj = prescriptions.reduce((acc: any, p: Prescription) => {
    const key = p.patient_id + '_' + new Date(p.prescription_date).toISOString().split('T')[0];
    if (!acc[key]) {
      acc[key] = {
        id: p.id,
        patientId: p.patient_id,
        patientName: p.patient_name,
        doctor: p.doctor_name || 'Unknown Doctor',
        date: new Date(p.prescription_date).getTime(),
        status: p.status,
        ids: [p.id],
        meds: []
      };
    } else {
      acc[key].ids.push(p.id);
    }
    // Hash based mock price for UI consistency
    const mockPrice = 10 + (p.medication_name.length * 5);
    acc[key].meds.push({
      id: p.id,
      name: p.medication_name,
      dosage: p.dosage,
      freq: p.frequency,
      route: p.route,
      instr: p.instructions || '',
      price: mockPrice
    });
    return acc;
  }, {});

  const groupedRx: GroupedPrescription[] = Object.values(groupedObj);

  const filteredRx = groupedRx.filter(p => {
    if(filterSel === 'all') return true;
    if(filterSel === 'active') return p.status === 'Active' && !isOld(p.date);
    if(filterSel === 'old') return p.status === 'Active' && isOld(p.date);
    if(filterSel === 'disc') return p.status === 'Discontinued';
    return true;
  }).sort((a,b) => b.date - a.date);

  const statActive = groupedRx.filter(p => p.status === 'Active' && !isOld(p.date)).length;
  const statDone = completedPrescriptions.length > 0 ? new Set(completedPrescriptions.map(p => p.patient_id)).size : 0;
  const statOld = groupedRx.filter(p => p.status === 'Active' && isOld(p.date)).length;

  return (
    <Layout title="Pharmacy" subtitle="Prescription Queue">
      <style>{`
        .pharma-page { padding: 1.5rem; max-width: 900px; margin: 0 auto; font-family: var(--font-sans); color: #f3f4f6; }
        .pharma-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .pharma-page-title { font-size: 20px; font-weight: 500; color: #f9fafb; }
        .pharma-page-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }
        .pharma-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem; }
        .pharma-stat { background: #1f2937; border-radius: 8px; padding: 14px 16px; border: 1px solid #374151; }
        .pharma-stat-label { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
        .pharma-stat-num { font-size: 22px; font-weight: 500; color: #f3f4f6; }
        .pharma-stat-num.pharma-blue { color: #60a5fa; }
        .pharma-stat-num.pharma-green { color: #4ade80; }
        .pharma-stat-num.pharma-amber { color: #fbbf24; }
        .pharma-section-head { font-size: 13px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
        .pharma-rx-card { background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color .15s; }
        .pharma-rx-card:hover { border-color: #4b5563; }
        .pharma-rx-card.open { border-color: #3b82f6; }
        .pharma-rx-top { display: flex; justify-content: space-between; align-items: center; }
        .pharma-rx-left { display: flex; align-items: center; gap: 12px; }
        .pharma-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1e3a8a; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 500; color: #bfdbfe; flex-shrink: 0; }
        .pharma-patient-name { font-size: 15px; font-weight: 500; color: #f3f4f6; }
        .pharma-patient-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .pharma-rx-right { display: flex; align-items: center; gap: 8px; }
        .custom-badge { padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 500; }
        .custom-active { background: #064e3b; color: #34d399; }
        .custom-old { background: #78350f; color: #fbbf24; }
        .custom-disc { background: #374151; color: #9ca3af; }
        .pharma-chevron { font-size: 16px; color: #9ca3af; transition: transform .2s; display: inline-block; }
        .pharma-chevron.up { transform: rotate(180deg); }
        .pharma-drawer { overflow: hidden; max-height: 0; transition: max-height .3s ease; }
        .pharma-drawer.open { max-height: 800px; }
        .pharma-drawer-inner { border-top: 1px solid #374151; margin-top: 12px; padding-top: 12px; }
        .pharma-drawer-doc { font-size: 12px; color: #9ca3af; margin-bottom: 12px; }
        .pharma-med-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        .pharma-med-table th { text-align: left; font-size: 11px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; padding: 6px 8px; border-bottom: 1px solid #374151; }
        .pharma-med-table td { padding: 8px 8px; border-bottom: 1px solid #374151; vertical-align: top; color: #d1d5db; }
        .pharma-med-table tr:last-child td { border-bottom: none; }
        .pharma-med-name { font-weight: 500; font-size: 13px; color: #f3f4f6; }
        .pharma-med-dose { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .pharma-freq-pill { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 11px; background: #374151; color: #d1d5db; }
        .pharma-price { font-weight: 500; text-align: right; color: #f3f4f6; }
        .pharma-total-row { display: flex; justify-content: flex-end; padding: 10px 8px 0; border-top: 1px solid #374151; margin-top: 2px; }
        .pharma-total-label { font-size: 13px; color: #9ca3af; margin-right: 16px; }
        .pharma-total-amount { font-size: 16px; font-weight: 500; color: #f3f4f6; }
        .pharma-drawer-footer { display: flex; gap: 8px; padding-top: 14px; border-top: 1px solid #374151; margin-top: 14px; justify-content: flex-end; }
        .pharma-btn { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; transition: background .12s; }
        .pharma-btn:hover { background: #374151; }
        .pharma-btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .pharma-btn.primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
        .pharma-btn.success { background: #16a34a; border-color: #16a34a; color: #fff; }
        .pharma-btn.success:hover { background: #15803d; border-color: #15803d; }
        .pharma-topbtn { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; transition: background .12s; }
        .pharma-topbtn:hover { background: #374151; }
        .pharma-filter-sel { padding: 6px 10px; border-radius: 6px; font-size: 13px; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; cursor: pointer; outline: none; }
        .pharma-saved-toast { position: fixed; bottom: 20px; right: 20px; background: #16a34a; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 13px; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .pharma-saved-toast.show { opacity: 1; }
        .pharma-empty { text-align: center; padding: 2rem; color: #9ca3af; font-size: 14px; }
      `}</style>
      
      <div className="pharma-page">
        <div className="pharma-topbar">
          <div>
            <div className="pharma-page-title">Pharmacy</div>
            <div className="pharma-page-sub">Prescription queue</div>
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <select className="pharma-filter-sel" value={filterSel} onChange={(e) => {setFilterSel(e.target.value); setOpenId(null);}}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="old">Old (&gt;24h)</option>
              <option value="disc">Discontinued</option>
            </select>
            <button className="pharma-topbtn" onClick={fetchPrescriptions}>↻ Refresh</button>
            <button className="pharma-topbtn" style={{background:'#185FA5', borderColor:'#185FA5', color:'#fff'}} onClick={() => router.push('/pharmacy/inventory')}>Inventory</button>
          </div>
        </div>

        {error && (
          <div style={{marginBottom: '1rem', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px'}}>
            {error}
          </div>
        )}

        <div className="pharma-stats">
          <div className="pharma-stat">
            <div className="pharma-stat-label">Active prescriptions</div>
            <div className="pharma-stat-num pharma-blue">{statActive}</div>
          </div>
          <div className="pharma-stat">
            <div className="pharma-stat-label">Completed today</div>
            <div className="pharma-stat-num pharma-green">{statDone}</div>
          </div>
          <div className="pharma-stat">
            <div className="pharma-stat-label">Old (&gt;24h)</div>
            <div className="pharma-stat-num pharma-amber">{statOld}</div>
          </div>
        </div>

        <div className="pharma-section-head">Prescription queue</div>
        
        <div>
          {loading ? (
            <div className="pharma-empty">Loading prescriptions...</div>
          ) : filteredRx.length === 0 ? (
            <div className="pharma-empty">No prescriptions found.</div>
          ) : (
            filteredRx.map(p => {
              const isOpen = openId === p.id;
              const tot = total(p.meds);
              
              return (
                <div key={p.id} className={`pharma-rx-card ${isOpen ? 'open' : ''}`}>
                  <div className="pharma-rx-top" onClick={() => setOpenId(isOpen ? null : p.id)}>
                    <div className="pharma-rx-left">
                      <div className="pharma-avatar">{initials(p.patientName)}</div>
                      <div>
                        <div className="pharma-patient-name">{p.patientName}</div>
                        <div className="pharma-patient-meta">{p.patientId} &nbsp;·&nbsp; {p.doctor}</div>
                      </div>
                    </div>
                    <div className="pharma-rx-right">
                      {getBadge(p)}
                      <span style={{fontSize:'13px', color:'#666'}}>{fmt(tot)}</span>
                      <span className={`pharma-chevron ${isOpen ? 'up' : ''}`}>&#8964;</span>
                    </div>
                  </div>
                  
                  <div className={`pharma-drawer ${isOpen ? 'open' : ''}`}>
                    <div className="pharma-drawer-inner">
                      <div className="pharma-drawer-doc">Prescribed by <strong>{p.doctor}</strong> &nbsp;·&nbsp; {new Date(p.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</div>
                      <table className="pharma-med-table">
                        <thead>
                          <tr>
                            <th style={{width:'32%'}}>Medication</th>
                            <th style={{width:'13%'}}>Freq</th>
                            <th style={{width:'12%'}}>Dosage</th>
                            <th style={{width:'30%'}}>Instructions</th>
                            <th style={{width:'13%', textAlign:'right'}}>MRP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.meds.map(m => (
                            <tr key={m.id}>
                              <td><div className="pharma-med-name">{m.name}</div><div className="pharma-med-dose">{m.route}</div></td>
                              <td><span className="pharma-freq-pill">{m.freq}</span></td>
                              <td style={{fontSize:'13px'}}>{m.dosage}</td>
                              <td style={{fontSize:'12px', color:'#666'}}>{m.instr}</td>
                              <td className="pharma-price">{fmt(m.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="pharma-total-row">
                        <span className="pharma-total-label">Total bill</span>
                        <span className="pharma-total-amount">{fmt(tot)}</span>
                      </div>
                      <div className="pharma-drawer-footer">
                        {p.status === 'Active' && isOld(p.date) && (
                          <button className="pharma-btn" style={{color:'#A32D2D', borderColor:'#A32D2D'}} onClick={() => clearRx(p)}>Clear old</button>
                        )}
                        <button className="pharma-btn" onClick={() => printRx(p)}>Print</button>
                        {p.status === 'Active' && (
                          <button 
                            className="pharma-btn success" 
                            disabled={packingId === p.id}
                            onClick={() => fulfillPrescription(p)}
                          >
                            {packingId === p.id ? 'Saving...' : 'Save bill'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className={`pharma-saved-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </Layout>
  )
}