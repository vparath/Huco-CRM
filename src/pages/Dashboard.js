import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { formatDistanceToNow } from 'date-fns'

const STAGE_LABELS = {
  prospect: 'Prospect',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  verbal_commit: 'Verbal Commit',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

const STAGE_BADGE = {
  prospect: 'badge-gray',
  proposal: 'badge-amber',
  negotiation: 'badge-blue',
  verbal_commit: 'badge-green',
  closed_won: 'badge-green',
  closed_lost: 'badge-red',
}

export default function Dashboard() {
  const { data: deals, loading: dealsLoading } = useRealtimeTable('deals', { order: 'amount' })
  const { data: activities } = useRealtimeTable('activities', { order: 'created_at' })
  const { data: partners } = useRealtimeTable('partner_engagements', { order: 'last_touch' })

  const openDeals = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount), 0)
  const closedWon = deals.filter(d => d.stage === 'closed_won')
  const winRate = deals.length > 0
    ? Math.round((closedWon.length / deals.filter(d => ['closed_won','closed_lost'].includes(d.stage)).length || 0) * 100)
    : 0
  const avgDeal = openDeals.length > 0
    ? Math.round(pipelineValue / openDeals.length)
    : 0

  const topDeals = [...openDeals].sort((a,b) => b.amount - a.amount).slice(0, 5)
  const recentActivities = [...activities].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  const needsAttentionPartners = partners.filter(p => p.status === 'needs_attention')

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Pipeline Value</div>
          <div className="metric-value">${(pipelineValue / 1000000).toFixed(1)}M</div>
          <div className="metric-delta">{openDeals.length} open deals</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Open Deals</div>
          <div className="metric-value">{openDeals.length}</div>
          <div className="metric-delta">across all stages</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Win Rate</div>
          <div className="metric-value">{winRate}%</div>
          <div className="metric-delta">{closedWon.length} closed won</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Deal Size</div>
          <div className="metric-value">${Math.round(avgDeal / 1000)}K</div>
          <div className="metric-delta">open pipeline</div>
        </div>
      </div>

      {needsAttentionPartners.length > 0 && (
        <div style={{ background: 'var(--amber-light)', border: '0.5px solid var(--amber)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#633806' }}>
          ⚠ {needsAttentionPartners.length} partner engagement{needsAttentionPartners.length > 1 ? 's' : ''} need attention: {needsAttentionPartners.map(p => p.partner_name).join(', ')}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Deals</div>
          </div>
          {dealsLoading ? (
            <div className="loading">Loading...</div>
          ) : topDeals.length === 0 ? (
            <div className="empty-state">No deals yet</div>
          ) : (
            topDeals.map(deal => (
              <div key={deal.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{deal.name}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{deal.company}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--blue)', width: 80, textAlign: 'right' }}>
                  ${(deal.amount / 1000).toFixed(0)}K
                </div>
                <span className={`badge ${STAGE_BADGE[deal.stage]}`}>{STAGE_LABELS[deal.stage]}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
          </div>
          {recentActivities.length === 0 ? (
            <div className="empty-state">No activity logged yet</div>
          ) : (
            recentActivities.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.type === 'partner' ? 'var(--green)' : act.due_date && new Date(act.due_date) < new Date() ? 'var(--amber)' : 'var(--blue)', marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{act.title}</div>
                  {act.description && <div style={{ color: 'var(--text-secondary)' }}>{act.description}</div>}
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
