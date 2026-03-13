import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeTable(table, query = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    let q = supabase.from(table).select(query.select || '*')
    if (query.order) q = q.order(query.order, { ascending: query.ascending ?? false })
    if (query.filter) q = q.eq(query.filter.col, query.filter.val)
    const { data: rows, error: err } = await q
    if (err) setError(err)
    else setData(rows || [])
    setLoading(false)
  }, [table, query.select, query.order, query.ascending, query.filter?.col, query.filter?.val])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetch()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetch, table])

  return { data, loading, error, refetch: fetch }
}
