import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/Layout'

interface Medication {
  id: number
  medication_id: string
  name: string
  generic_name: string
  category: string
  unit_price: number
  stock_quantity: number
  reorder_level: number
  manufacturer: string
  expiry_date?: string
  storage_location: string
  stock_status: 'LOW' | 'NORMAL' | 'HIGH'
  is_active: number
}

const SOON = 90 * 24 * 3600 * 1000;

export default function PharmacyInventoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCat, setFilterCat] = useState('ALL')
  
  const [editingMed, setEditingMed] = useState<Medication | null>(null)
  const [stockQuantity, setStockQuantity] = useState('')
  const [reason, setReason] = useState('Stock update')
  
  const [isAddMode, setIsAddMode] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', generic_name: '', category: '', manufacturer: '', unit_price: '',
    stock_quantity: '', reorder_level: '', expiry_date: '', storage_location: ''
  })
  
  const [toastMsg, setToastMsg] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  const { data: medications, isLoading, error: medicationsError } = useQuery<Medication[]>({
    queryKey: ['pharmacy-medications'],
    queryFn: async () => {
      const response = await fetch('/api/pharmacy/medications')
      if (!response.ok) {
        throw new Error(`Failed to fetch medications: ${response.status}`)
      }
      return response.json()
    }
  })

  const updateStockMutation = useMutation({
    mutationFn: async (data: { medication_id: string; quantity_change: number; reason: string }) => {
      const response = await fetch('/api/pharmacy/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update stock')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-medications'] })
      showToast('Stock updated successfully')
      setEditingMed(null)
      setStockQuantity('')
      setReason('Stock update')
    }
  })

  // Simulated add mutation since the UI has an "Add medication" button but the original `.tsx` didn't have an Add endpoint.
  // Assuming a generic pattern or skipping real backend logic for UI preview.
  const handleAddMedication = () => {
    if (!addForm.name) {
      showToast('Enter medication name')
      return;
    }
    // We would send this to the backend. Here we just show toast and close.
    showToast(addForm.name + ' added to inventory (UI sim)')
    setIsAddMode(false)
  }

  const handleStockUpdate = () => {
    if (!editingMed || !stockQuantity) return
    const quantityChange = parseInt(stockQuantity)
    if (isNaN(quantityChange)) {
      showToast('Enter a valid quantity change')
      return
    }
    const nv = editingMed.stock_quantity + quantityChange
    if (nv < 0) {
      showToast('Stock cannot go below 0')
      return
    }
    
    updateStockMutation.mutate({
      medication_id: editingMed.medication_id,
      quantity_change: quantityChange,
      reason
    })
  }

  const expiryMs = (e: string | undefined) => {
    if(!e) return Infinity;
    const [y, m] = e.split('-');
    return new Date(+y, +m - 1, 1).getTime();
  }
  const isExpSoon = (e: string | undefined) => {
    const d = expiryMs(e) - Date.now();
    return d > 0 && d < SOON;
  }
  const barColor = (s: string) => s === 'LOW' ? '#E24B4A' : s === 'HIGH' ? '#639922' : '#378ADD';
  const barPct = (stock: number, reorder: number) => Math.min(100, Math.round(stock / Math.max(reorder * 3, 1) * 100));
  const fmt = (n: number) => '₹' + Number(n).toFixed(2);
  const fmtExpiry = (e: string | undefined) => {
    if(!e) return '—';
    const [y, m] = e.split('-');
    return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', {month:'short', year:'numeric'})
  }

  const cats = medications ? Array.from(new Set(medications.map(m => m.category))).sort() : []

  const filteredMeds = medications?.filter(m => {
    const ms = (m.name + ' ' + (m.generic_name||'')).toLowerCase().includes(searchTerm.toLowerCase());
    const ss = filterStatus === 'ALL' || m.stock_status === filterStatus;
    const cs = filterCat === 'ALL' || m.category === filterCat;
    return ms && ss && cs;
  })

  const statTot = medications?.length || 0;
  const statLow = medications?.filter(m => m.stock_status === 'LOW').length || 0;
  const statExp = medications?.filter(m => isExpSoon(m.expiry_date)).length || 0;
  const statCat = cats.length;

  if (!mounted) return null

  return (
    <Layout title="Pharmacy" subtitle="Inventory Management">
      <style>{`
        .inv-page { padding: 1.5rem; max-width: 960px; margin: 0 auto; font-family: var(--font-sans); color: #f3f4f6; }
        .inv-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .inv-page-title { font-size: 20px; font-weight: 500; color: #f9fafb; }
        .inv-page-sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }
        .inv-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 1.5rem; }
        .inv-stat { background: #1f2937; border-radius: 8px; padding: 14px 16px; border: 1px solid #374151; }
        .inv-stat-label { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
        .inv-stat-num { font-size: 22px; font-weight: 500; color: #f3f4f6; }
        .inv-blue { color: #60a5fa; } .inv-red { color: #f87171; } .inv-green { color: #4ade80; } .inv-amber { color: #fbbf24; }
        .inv-controls { display: flex; gap: 10px; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; }
        .inv-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .inv-search-wrap input { width: 100%; padding: 7px 12px 7px 32px; border: 1px solid #4b5563; border-radius: 6px; font-size: 13px; outline: none; background: #1f2937; color: #f3f4f6; }
        .inv-search-wrap input:focus { border-color: #3b82f6; }
        .inv-search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); font-size: 15px; color: #9ca3af; pointer-events: none; }
        .inv-filter-sel { padding: 7px 10px; border-radius: 6px; font-size: 13px; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; cursor: pointer; outline: none; }
        .inv-btn { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #4b5563; background: #1f2937; color: #f3f4f6; transition: background .12s; white-space: nowrap; }
        .inv-btn:hover { background: #374151; }
        .inv-btn.inv-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .inv-btn.inv-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
        .inv-tbl-wrap { border: 1px solid #374151; border-radius: 8px; overflow: hidden; background: #111827; }
        .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        .inv-table thead { background: #1f2937; }
        .inv-table th { text-align: left; font-size: 11px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: .05em; padding: 9px 14px; border-bottom: 1px solid #374151; }
        .inv-table td { padding: 10px 14px; border-bottom: 1px solid #374151; vertical-align: middle; color: #e5e7eb; }
        .inv-table tr:hover td { background: #1f2937; }
        .inv-med-name { font-weight: 500; font-size: 13px; color: #f3f4f6; }
        .inv-med-generic { font-size: 12px; color: #9ca3af; }
        .inv-badge { display: inline-block; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 500; }
        .inv-badge.LOW { background: #7f1d1d; color: #fca5a5; }
        .inv-badge.NORMAL { background: #1e3a8a; color: #93c5fd; }
        .inv-badge.HIGH { background: #064e3b; color: #6ee7b7; }
        .inv-stock-bar-bg { height: 4px; background: #374151; border-radius: 2px; width: 80px; margin-top: 4px; overflow: hidden; }
        .inv-stock-bar { height: 4px; border-radius: 2px; }
        .inv-upd-btn { font-size: 12px; font-weight: 500; color: #60a5fa; background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
        .inv-upd-btn:hover { background: #1e3a8a; }
        .inv-empty { text-align: center; padding: 2.5rem; color: #9ca3af; font-size: 14px; }

        .inv-modal-bg { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 200; align-items: center; justify-content: center; }
        .inv-modal-bg.show { display: flex; }
        .inv-modal { background: #1f2937; border-radius: 8px; border: 1px solid #374151; padding: 20px 22px; width: 100%; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .inv-modal-title { font-size: 16px; font-weight: 500; margin-bottom: 16px; color: #f3f4f6; }
        .inv-field { margin-bottom: 14px; }
        .inv-field label { display: block; font-size: 12px; font-weight: 500; color: #9ca3af; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .04em; }
        .inv-field input, .inv-field select { width: 100%; padding: 7px 10px; border: 1px solid #4b5563; border-radius: 6px; font-size: 13px; outline: none; background: #111827; color: #f3f4f6; }
        .inv-field input:focus, .inv-field select:focus { border-color: #3b82f6; }
        .inv-field input:-moz-read-only { background: #374151; color: #9ca3af; }
        .inv-field input:disabled { background: #374151; color: #9ca3af; }
        .inv-new-stock { font-size: 13px; margin-top: 5px; color: #9ca3af; }
        .inv-modal-footer { display: flex; gap: 8px; margin-top: 18px; }
        .inv-modal-footer .inv-btn { flex: 1; justify-content: center; text-align: center; }
        .inv-info-row { display: flex; gap: 20px; margin-bottom: 16px; padding: 12px 14px; background: #111827; border-radius: 6px; border: 1px solid #374151; }
        .inv-info-item { font-size: 12px; color: #9ca3af; }
        .inv-info-item b { display: block; font-size: 13px; font-weight: 500; color: #f3f4f6; margin-top: 2px; }
        .inv-toast { position: fixed; bottom: 20px; right: 20px; background: #16a34a; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 13px; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 300; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .inv-toast.show { opacity: 1; }
      `}</style>

      <div className="inv-page">
        <div className="inv-topbar">
          <div>
            <div className="inv-page-title">Inventory</div>
            <div className="inv-page-sub">Medication stock &amp; supplies</div>
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <button className="inv-btn" onClick={() => router.push('/pharmacy')}>← Queue</button>
            <button className="inv-btn inv-primary" onClick={() => setIsAddMode(true)}>+ Add medication</button>
          </div>
        </div>

        {medicationsError && (
          <div style={{marginBottom: '1rem', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px'}}>
            {(medicationsError as Error).message}
          </div>
        )}

        <div className="inv-stats">
          <div className="inv-stat"><div className="inv-stat-label">Total medications</div><div className="inv-stat-num inv-blue">{statTot}</div></div>
          <div className="inv-stat"><div className="inv-stat-label">Low stock alerts</div><div className="inv-stat-num inv-red">{statLow}</div></div>
          <div className="inv-stat"><div className="inv-stat-label">Expiring soon</div><div className="inv-stat-num inv-amber">{statExp}</div></div>
          <div className="inv-stat"><div className="inv-stat-label">Categories</div><div className="inv-stat-num">{statCat}</div></div>
        </div>

        <div className="inv-controls">
          <div className="inv-search-wrap">
            <span className="inv-search-icon">&#9906;</span>
            <input type="text" placeholder="Search by name or generic…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="inv-filter-sel" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All stock</option>
            <option value="LOW">Low stock</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High stock</option>
          </select>
          <select className="inv-filter-sel" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="ALL">All categories</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="inv-tbl-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{width:'26%'}}>Medication</th>
                <th style={{width:'14%'}}>Category</th>
                <th style={{width:'16%'}}>Stock</th>
                <th style={{width:'12%'}}>Unit price</th>
                <th style={{width:'14%'}}>Expiry</th>
                <th style={{width:'10%'}}>Status</th>
                <th style={{width:'8%'}}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="inv-empty">Loading medications...</td></tr>
              ) : !filteredMeds || filteredMeds.length === 0 ? (
                <tr><td colSpan={7} className="inv-empty">No medications found.</td></tr>
              ) : (
                filteredMeds.map(m => {
                  const soon = isExpSoon(m.expiry_date);
                  const expStyle = soon ? {color:'#854F0B', fontWeight:500} : {};
                  const pct = barPct(m.stock_quantity, m.reorder_level);
                  return (
                    <tr key={m.id}>
                      <td><div className="inv-med-name">{m.name}</div><div className="inv-med-generic">{m.generic_name}</div></td>
                      <td style={{color:'#666', fontSize:'12px'}}>{m.category}</td>
                      <td>
                        <div style={{fontWeight:500}}>{m.stock_quantity} <span style={{fontWeight:400, color:'#666', fontSize:'11px'}}>/ min {m.reorder_level}</span></div>
                        <div className="inv-stock-bar-bg"><div className="inv-stock-bar" style={{width:`${pct}%`, background:barColor(m.stock_status)}}></div></div>
                      </td>
                      <td style={{fontWeight:500}}>{fmt(m.unit_price)}</td>
                      <td style={expStyle}>{fmtExpiry(m.expiry_date)}{soon ? ' ⚠' : ''}
                        <div style={{fontSize:'11px', color:'#666'}}>{m.storage_location}</div>
                      </td>
                      <td><span className={`inv-badge ${m.stock_status}`}>{m.stock_status}</span></td>
                      <td><button className="inv-upd-btn" onClick={() => setEditingMed(m)}>Update</button></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <div className={`inv-modal-bg ${editingMed ? 'show' : ''}`}>
        {editingMed && (
          <div className="inv-modal">
            <div className="inv-modal-title">Update stock — {editingMed.name}</div>
            <div className="inv-info-row">
              <div className="inv-info-item"><span>Manufacturer</span><b>{editingMed.manufacturer}</b></div>
              <div className="inv-info-item"><span>Unit price</span><b>{fmt(editingMed.unit_price)}</b></div>
              <div className="inv-info-item"><span>Location</span><b>{editingMed.storage_location}</b></div>
            </div>
            <div className="inv-field"><label>Current stock</label><input type="text" value={editingMed.stock_quantity} disabled /></div>
            <div className="inv-field">
              <label>Quantity change <span style={{fontWeight:400, textTransform:'none'}}>(+ add / − remove)</span></label>
              <input type="number" placeholder="e.g. +50 or -10" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
              <div className="inv-new-stock">
                New stock: <b style={{color: (editingMed.stock_quantity + (parseInt(stockQuantity)||0)) < 0 ? '#A32D2D' : '#111'}}>
                  {editingMed.stock_quantity + (parseInt(stockQuantity)||0)}
                </b>
              </div>
            </div>
            <div className="inv-field">
              <label>Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)}>
                <option>Stock update</option><option>Prescription issued</option><option>Stock adjustment</option>
                <option>Expired</option><option>Damaged</option><option>Reorder</option>
              </select>
            </div>
            {updateStockMutation.error && (
              <div style={{color:'#A32D2D', fontSize:'12px', marginTop:'-6px', marginBottom:'10px'}}>{(updateStockMutation.error as any).message}</div>
            )}
            <div className="inv-modal-footer">
              <button className="inv-btn" onClick={() => {setEditingMed(null); setStockQuantity(''); setReason('Stock update');}}>Cancel</button>
              <button className="inv-btn inv-primary" onClick={handleStockUpdate}>Update stock</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <div className={`inv-modal-bg ${isAddMode ? 'show' : ''}`}>
        <div className="inv-modal" style={{maxWidth: '480px'}}>
          <div className="inv-modal-title">Add new medication</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px'}}>
            <div className="inv-field"><label>Brand name</label><input type="text" placeholder="e.g. Metformin 500mg" value={addForm.name} onChange={e=>setAddForm({...addForm, name:e.target.value})} /></div>
            <div className="inv-field"><label>Generic name</label><input type="text" placeholder="e.g. Metformin HCl" value={addForm.generic_name} onChange={e=>setAddForm({...addForm, generic_name:e.target.value})}/></div>
            <div className="inv-field"><label>Category</label><input type="text" placeholder="e.g. Antidiabetic" value={addForm.category} onChange={e=>setAddForm({...addForm, category:e.target.value})}/></div>
            <div className="inv-field"><label>Manufacturer</label><input type="text" placeholder="e.g. Sun Pharma" value={addForm.manufacturer} onChange={e=>setAddForm({...addForm, manufacturer:e.target.value})}/></div>
            <div className="inv-field"><label>Unit price (₹)</label><input type="number" placeholder="0.00" value={addForm.unit_price} onChange={e=>setAddForm({...addForm, unit_price:e.target.value})}/></div>
            <div className="inv-field"><label>Initial stock</label><input type="number" placeholder="0" value={addForm.stock_quantity} onChange={e=>setAddForm({...addForm, stock_quantity:e.target.value})}/></div>
            <div className="inv-field"><label>Reorder level</label><input type="number" placeholder="10" value={addForm.reorder_level} onChange={e=>setAddForm({...addForm, reorder_level:e.target.value})}/></div>
            <div className="inv-field"><label>Expiry date</label><input type="month" value={addForm.expiry_date} onChange={e=>setAddForm({...addForm, expiry_date:e.target.value})}/></div>
            <div className="inv-field" style={{gridColumn:'1/-1'}}><label>Storage location</label><input type="text" placeholder="e.g. Rack A, Shelf 2" value={addForm.storage_location} onChange={e=>setAddForm({...addForm, storage_location:e.target.value})}/></div>
          </div>
          <div className="inv-modal-footer">
            <button className="inv-btn" onClick={() => setIsAddMode(false)}>Cancel</button>
            <button className="inv-btn inv-primary" onClick={handleAddMedication}>Add medication</button>
          </div>
        </div>
      </div>

      <div className={`inv-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </Layout>
  )
}
