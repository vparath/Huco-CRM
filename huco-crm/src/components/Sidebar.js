import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
  { id: 'deals', label: 'Deals & Pipeline', icon: PipelineIcon },
  { id: 'contacts', label: 'Contacts', icon: ContactIcon },
  { id: 'partners', label: 'Partner Engagements', icon: PartnerIcon },
  { id: 'activity', label: 'Activity & Tasks', icon: ActivityIcon },
  { id: 'forecast', label: 'Forecasting', icon: ForecastIcon },
]

export default function Sidebar({ active, onNavigate }) {
  const { profile, isAdmin, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Huco CRM</h1>
        <p>Sales Intelligence</p>
      </div>

      <nav className="nav-group">
        <div className="nav-label">Menu</div>
        {NAV.map(item => (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon />
            {item.label}
          </div>
        ))}
      </nav>

      <nav className="nav-group">
        <div className="nav-label">Tools</div>
        <div
          className={`nav-item ${active === 'ai' ? 'active' : ''}`}
          onClick={() => onNavigate('ai')}
        >
          <AIIcon />
          AI Assistant
        </div>
        {isAdmin && (
          <div
            className={`nav-item ${active === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            <AdminIcon />
            Admin
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{profile?.full_name || 'Loading...'}</div>
            <div className="user-role">{isAdmin ? 'Admin' : 'Member'}</div>
          </div>
        </div>
        <div className="nav-item" onClick={signOut} style={{ color: 'var(--text-tertiary)' }}>
          <SignOutIcon />
          Sign out
        </div>
      </div>
    </div>
  )
}

function GridIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
}
function PipelineIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
}
function ContactIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
}
function PartnerIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h3l2-5 2 10 2-5h3"/></svg>
}
function ActivityIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 8h6M5 11h4"/></svg>
}
function ForecastIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="2,12 5,7 8,9 11,4 14,6"/><line x1="2" y1="14" x2="14" y2="14"/></svg>
}
function AIIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2-2 3-2 3"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg>
}
function AdminIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l1.5 3H13l-2.5 2 1 3.5L8 9l-3.5 1.5 1-3.5L3 5h3.5z"/></svg>
}
function SignOutIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"/></svg>
}
