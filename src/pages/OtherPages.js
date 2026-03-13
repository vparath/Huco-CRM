// Partners.js
import { useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STATUS_DOT = { active: 'dot-green', pending: 'dot-amber', needs_attention: 'dot-amber', inactive: 'dot-red' }
const STATUS_LABEL = { active: 'Active', pending: 'Pending', needs_attention: 'Needs Attention', inactive: 'Inactive' }

export function Partners() {
  const { profile } = useAuth()
  const { data: partners, loading } = useRealtimeTable('partner_engagements', { order: 'last_touch' })
  const { data: deals } = useRealtimeTable('deals', { order: 'name', ascending: true })
  const [showModal, setShowModal] = useState(false)
  const [editP, setEditP] = useState(null)
  const [form, setForm] = useState({ partner_name: '', engagement_type: 'co-sell', deal_id: '', status: 'active', contact_name: '', notes: '' })
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditP(null)
    setForm({ partner_name: '', engagement_type: 'co-sell', deal_id: '', status: 'active', contact_name: '', notes: '' })
    setShowModal(true)
  }

  function openEdit(p) {
    setEditP(p)
    setForm({ partner_name: p.partner_name, engagement_type: p.engagement_type, deal_id: p.deal_id || '', status: p.status, contact_name: p.contact_name || '', notes: p.notes || '' })
    setShowModal(true)
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, deal_id: form.deal_id || null, owner_id: profile.id, last_touch: new Date().toISOString() }
    if (editP) {
      await supabase.from('partner_engagements').update(payload).eq('id', editP.id)
    } else {
      await supabase.from('partner_engagements').insert({ ...payload, created_by: profile.id })
    }
    setSaving(false)
    setShowModal(false)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}>+ Log Engagement</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Linked Deal</th>
              <th>Type</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Last Touch</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 24 }}>No partner engagements yet</td></tr>
            )}
            {partners.map(p => {
              const deal = deals.find(d => d.id === p.deal_id)
              return (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(p)}>
                  <td style={{ fontWeight: 500 }}>{p.partner_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{deal ? `${deal.name} — ${deal.company}` : '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.engagement_type}</td>
                  <td><span className={`status-dot ${STATUS_DOT[p.status]}`}></span>{STATUS_LABEL[p.status]}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.contact_name || '—'}</td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(p.last_touch).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editP ? 'Edit Engagement' : 'New Engagement'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Partner Name</label>
              <input className="form-input" value={form.partner_name} onChange={e => setForm({...form, partner_name: e.target.value})} placeholder="Red Hat, VMware, F5..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Engagement Type</label>
                <select className="form-select" value={form.engagement_type} onChange={e => setForm({...form, engagement_type: e.target.value})}>
                  <option value="co-sell">Co-sell</option>
                  <option value="technology">Technology</option>
                  <option value="reseller">Reseller</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="needs_attention">Needs Attention</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Linked Deal</label>
              <select className="form-select" value={form.deal_id} onChange={e => setForm({...form, deal_id: e.target.value})}>
                <option value="">— None —</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.name} — {d.company}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Partner Contact</label>
              <input className="form-input" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} placeholder="e.g. Dan Mitchell" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.partner_name}>
                {saving ? 'Saving...' : editP ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Activity.js
export function Activity() {
  const { profile } = useAuth()
  const { data: activities, loading } = useRealtimeTable('activities', { order: 'due_date' })
  const { data: deals } = useRealtimeTable('deals', { order: 'name', ascending: true })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'follow_up', title: '', description: '', deal_id: '', due_date: '', completed: false })
  const [saving, setSaving] = useState(false)

  const pending = activities.filter(a => !a.completed)
  const done = activities.filter(a => a.completed).slice(0, 8)

  async function save() {
    setSaving(true)
    await supabase.from('activities').insert({
      ...form,
      deal_id: form.deal_id || null,
      due_date: form.due_date || null,
      created_by: profile.id
    })
    setSaving(false)
    setShowModal(false)
    setForm({ type: 'follow_up', title: '', description: '', deal_id: '', due_date: '', completed: false })
  }

  async function toggleComplete(act) {
    await supabase.from('activities').update({
      completed: !act.completed,
      completed_at: !act.completed ? new Date().toISOString() : null
    }).eq('id', act.id)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Activity</button>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header"><div className="card-title">Pending Tasks ({pending.length})</div></div>
          {pending.length === 0 && <div className="empty-state">All caught up!</div>}
          {pending.map(act => {
            const overdue = act.due_date && new Date(act.due_date) < new Date()
            return (
              <div key={act.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                <input type="checkbox" checked={act.completed} onChange={() => toggleComplete(act)} style={{ marginTop: 2, cursor: 'pointer' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: overdue ? 'var(--red)' : 'var(--text)' }}>{act.title}</div>
                  {act.description && <div style={{ color: 'var(--text-secondary)' }}>{act.description}</div>}
                  {act.due_date && <div style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-tertiary)' }}>{overdue ? 'Overdue · ' : 'Due: '}{new Date(act.due_date).toLocaleDateString()}</div>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Recently Completed</div></div>
          {done.length === 0 && <div className="empty-state">Nothing completed yet</div>}
          {done.map(act => (
            <div key={act.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 500, textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{act.title}</div>
                {act.completed_at && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(act.completed_at).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Log Activity</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="partner">Partner</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Follow up on FANR proposal" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Linked Deal</label>
              <select className="form-select" value={form.deal_id} onChange={e => setForm({...form, deal_id: e.target.value})}>
                <option value="">— None —</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.title}>
                {saving ? 'Saving...' : 'Log Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Forecast.js
export function Forecast() {
  const { data: deals, loading } = useRealtimeTable('deals', { order: 'amount' })

  const QUOTA = 1200000
  const open = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const committed = open.filter(d => d.probability >= 70).reduce((s,d) => s + Number(d.amount), 0)
  const bestCase = open.reduce((s,d) => s + Number(d.amount), 0)
  const weightedForecast = open.reduce((s,d) => s + Number(d.amount) * d.probability / 100, 0)
  const coverage = QUOTA > 0 ? (bestCase / QUOTA).toFixed(1) : '—'

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Committed (&ge;70%)</div>
          <div className="metric-value">${(committed/1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Weighted Forecast</div>
          <div className="metric-value">${(weightedForecast/1000).toFixed(0)}K</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Best Case</div>
          <div className="metric-value">${(bestCase/1000000).toFixed(1)}M</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pipeline Coverage</div>
          <div className="metric-value">{coverage}x</div>
          <div className="metric-delta">vs ${(QUOTA/1000).toFixed(0)}K quota</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Deal-level forecast</div></div>
        {open.sort((a,b) => b.amount - a.amount).map(deal => {
          const pct = deal.probability
          const barColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--text-tertiary)'
          return (
            <div key={deal.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{deal.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— {deal.company}</span></span>
                <span style={{ fontWeight: 500 }}>${(Number(deal.amount)/1000).toFixed(0)}K · {pct}%</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 8 }}>
                <div style={{ height: 8, borderRadius: 4, background: barColor, width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--green)', marginRight: 4 }}></span>Committed (70%+)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--amber)', marginRight: 4 }}></span>Upside (40–69%)</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--text-tertiary)', marginRight: 4 }}></span>Pipeline (&lt;40%)</span>
        </div>
      </div>
    </div>
  )
}

// Admin.js
export function Admin() {
  const { isAdmin } = useAuth()
  const { data: profiles, loading } = useRealtimeTable('profiles', { order: 'full_name', ascending: true })
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', password: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  if (!isAdmin) return <div className="empty-state">Access denied. Admin only.</div>

  async function updateRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
  }

  async function createUser() {
    setSaving(true)
    setMsg('')
    const { data, error } = await supabase.auth.admin.createUser({
      email: inviteForm.email,
      password: inviteForm.password,
      email_confirm: true
    })
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        role: inviteForm.role
      })
      setMsg('User created successfully.')
      setShowInvite(false)
      setInviteForm({ email: '', full_name: '', password: '', role: 'member' })
    }
    setSaving(false)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: 16, background: 'var(--blue-light)', border: '0.5px solid rgba(24,95,165,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--blue-dark)' }}>
        Admin panel — only you can see this. Manage users and roles here.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Add User</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0, background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>
                      {p.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    {p.full_name}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.email}</td>
                <td>
                  <span className={`role-badge ${p.role === 'admin' ? 'role-admin' : 'role-member'}`}>
                    {p.role}
                  </span>
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                    value={p.role}
                    onChange={e => updateRole(p.id, e.target.value)}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New User</div>
              <button className="modal-close" onClick={() => setShowInvite(false)}>×</button>
            </div>
            {msg && <div className={msg.startsWith('Error') ? 'error-msg' : 'form-group'} style={msg.startsWith('Error') ? {} : {color:'var(--green)',fontSize:13}}>{msg}</div>}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input className="form-input" type="password" value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createUser} disabled={saving || !inviteForm.email || !inviteForm.full_name || !inviteForm.password}>
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// AIAssistant.js
export function AIAssistant() {
  const { data: deals } = useRealtimeTable('deals', { order: 'amount' })
  const { data: partners } = useRealtimeTable('partner_engagements', { order: 'last_touch' })
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi Vivek. I have full context on your pipeline. What would you like to work on?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const SUGGESTIONS = [
    'Summarize the Mashreq Bank deal status',
    'Draft a follow-up email to FANR',
    'What deals are at risk this quarter?',
    'What should I prioritize this week?',
    'Help me prepare for the Red Hat call',
  ]

  const pipelineContext = deals.map(d =>
    `${d.name} (${d.company}): $${(Number(d.amount)/1000).toFixed(0)}K, ${d.stage}, ${d.probability}% probability${d.notes ? '. Notes: '+d.notes : ''}`
  ).join('\n')

  const partnerContext = partners.map(p =>
    `${p.partner_name} — ${p.engagement_type}, status: ${p.status}${p.contact_name ? ', contact: '+p.contact_name : ''}${p.notes ? '. '+p.notes : ''}`
  ).join('\n')

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const systemPrompt = `You are an AI sales assistant embedded in Huco's CRM. Huco is a technology solutions company in Dubai. The user is Vivek — technical sales and partner engagements.

Current pipeline:
${pipelineContext}

Partner engagements:
${partnerContext}

Be concise, practical, and specific. For email drafts, write complete ready-to-send emails using real names from the data. Never use placeholder brackets.`

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await resp.json()
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Huco AI</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>Powered by Claude · Live pipeline context</span>
        </div>

        <div className="ai-messages" id="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="ai-msg assistant" style={{ color: 'var(--text-tertiary)' }}>Thinking...</div>
          )}
        </div>

        <div style={{ padding: '8px 16px 6px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '0.5px solid var(--border)' }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{ fontSize: 11, padding: '4px 10px', border: '0.5px solid var(--border-md)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-secondary)', background: 'transparent' }}>
              {s}
            </button>
          ))}
        </div>

        <div className="ai-input-area">
          <textarea
            className="ai-input"
            rows={1}
            placeholder="Ask about your pipeline, draft emails, get deal summaries..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
