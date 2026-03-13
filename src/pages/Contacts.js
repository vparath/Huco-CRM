import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const AVATAR_COLORS = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#FBEAF0', color: '#72243E' },
  { bg: '#EAF3DE', color: '#27500A' },
  { bg: '#EEEDFE', color: '#3C3489' },
]

function colorFor(name) {
  const i = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
}

export default function Contacts() {
  const { profile } = useAuth()
  const { data: contacts, loading } = useRealtimeTable('contacts', { order: 'full_name', ascending: true })
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ full_name: '', role: '', company: '', email: '', phone: '', tags: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditContact(null)
    setForm({ full_name: '', role: '', company: '', email: '', phone: '', tags: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(c) {
    setEditContact(c)
    setForm({ full_name: c.full_name, role: c.role || '', company: c.company || '', email: c.email || '', phone: c.phone || '', tags: (c.tags || []).join(', '), notes: c.notes || '' })
    setShowModal(true)
  }

  async function saveContact() {
    setSaving(true)
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }
    if (editContact) {
      await supabase.from('contacts').update(payload).eq('id', editContact.id)
    } else {
      await supabase.from('contacts').insert({ ...payload, created_by: profile.id })
    }
    setSaving(false)
    setShowModal(false)
  }

  const filtered = contacts.filter(c =>
    !search || [c.full_name, c.company, c.role, c.email].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="loading">Loading contacts...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openNew}>+ Add Contact</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}>No contacts found</div>}
        {filtered.map(c => {
          const col = colorFor(c.full_name)
          return (
            <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEdit(c)}>
              <div className="avatar lg" style={{ background: col.bg, color: col.color, marginBottom: 10 }}>{initials(c.full_name)}</div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{c.full_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.role}{c.company ? ` — ${c.company}` : ''}</div>
              {c.email && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{c.email}</div>}
              {c.phone && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{c.phone}</div>}
              {c.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                  {c.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{t}</span>)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editContact ? 'Edit Contact' : 'New Contact'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Role / Title</label>
                <input className="form-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="Decision Maker, Champion, Partner" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveContact} disabled={saving || !form.full_name}>
                {saving ? 'Saving...' : editContact ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
