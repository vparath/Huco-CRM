import { useState } from 'react'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Deals from './pages/Deals'
import Contacts from './pages/Contacts'
import { Partners, Activity, Forecast, Admin, AIAssistant } from './pages/OtherPages'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  deals: 'Deals & Pipeline',
  contacts: 'Contacts',
  partners: 'Partner Engagements',
  activity: 'Activity & Tasks',
  forecast: 'Forecasting',
  ai: 'AI Assistant',
  admin: 'Admin',
}

function CRMApp() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)', fontSize: 14 }}>
        Loading Huco CRM...
      </div>
    )
  }

  if (!user) return <Login />

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'deals': return <Deals />
      case 'contacts': return <Contacts />
      case 'partners': return <Partners />
      case 'activity': return <Activity />
      case 'forecast': return <Forecast />
      case 'ai': return <AIAssistant />
      case 'admin': return <Admin />
      default: return <Dashboard />
    }
  }

  return (
    <div className="crm-layout">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{PAGE_TITLES[page]}</div>
        </div>
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CRMApp />
    </AuthProvider>
  )
}
