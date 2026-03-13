import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STAGES = [
  { id: 'prospect', label: 'Prospect' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'verbal_commit', label: 'Verbal Commit' },
  { id: 'closed_won', label: 'Closed Won' },
]

export default function Deals() {
  const { profile } = useAuth()
  const { data: deals, loading } = useRealtimeTable('deals', { order: 'amount' })
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState(null)
  const [form, setForm] = useState({ name: '', company: '', amount: '', stage: 'prospect', probability: 20, close_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditDeal(null)
    setForm({ name: '', company: '', amount: '', stage: 'prospect', probability: 20, close_date: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(deal) {
    setEditDeal(deal)
    setForm({ name: deal.name, company: deal.company, amount: deal.amount, stage: deal.stage, probability: deal.probability, close_date: deal.close_date || '', notes: deal.notes || '' })
    setShowModal(true)
  }

  async function saveDeal() {
    setSaving(true)
    const payload = { ...form, amount: Number(form.amount), probability: Number(form.probability), owner_id: profile.id }
    if (editDeal) {
      await supabase.from('deals').update(payload).eq('id', editDeal.id)
    } else {
      await supabase.from('deals').insert({ ...payload, created_by: profile.id })
    }
    setSaving(false)
    setShowModal(false)
  }

  async function updateStage(dealId, stage) {
    await supabase.from('deals').update({ stage }).eq('id', dealId)
  }

  if (loading) return <div className="loading">Loading pipeline...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{deals.length} deals · ${(deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((s,d) => s + Number(d.amount), 0) / 1000000).toFixed(1)}M pipeline</div>
        <button className="btn btn-primary" onClick={openNew}>+ New Deal</button>
      </div>

      <div className="pipeline-board">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id)
          const total = stageDeals.reduce((s, d) => s + Number(d.amount), 0)
          return (
            <div key={stage.id} className="pipeline-col">
              <div className="pipeline-col-header">
                {stage.label}
                <span className="pipeline-col-count">{stageDeals.length}</span>
              </div>
              {total > 0 && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>${(total/1000).toFixed(0)}K</div>}
              {stageDeals.sort((a,b) => b.amount - a.amount).map(deal => (
                <div key={deal.id} className="deal-card" onClick={() => openEdit(deal)}>
                  <div className="deal-card-name">{deal.name}</div>
                  <div className="deal-card-company">{deal.company}</div>
                  <div className="deal-card-footer">
                    <span className="deal-card-amount">${(Number(deal.amount)/1000).toFixed(0)}K</span>
                    <span className="deal-card-prob">{deal.probability}%</span>
                  </div>
                  {deal.close_date && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>Close: {deal.close_date}</div>}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editDeal ? 'Edit Deal' : 'New Deal'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Deal Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. NGINX ELA Renewal" />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="e.g. Mashreq Bank" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Amount (USD)</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="500000" />
              </div>
              <div className="form-group">
                <label className="form-label">Probability %</label>
                <input className="form-input" type="number" min="0" max="100" value={form.probability} onChange={e => setForm({...form, probability: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-select" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Close</label>
                <input className="form-input" type="date" value={form.close_date} onChange={e => setForm({...form, close_date: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Key details, next steps..." />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDeal} disabled={saving || !form.name || !form.company}>
                {saving ? 'Saving...' : editDeal ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
