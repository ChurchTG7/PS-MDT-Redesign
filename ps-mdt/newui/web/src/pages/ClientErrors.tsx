import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { fetchNui } from '../utils/nui'
import ErrorBoundary from '../components/ErrorBoundary'

type ClientError = {
  id: number
  text: string
  time: string
}

export default function ClientErrorsPage() {
  const [rows, setRows] = useState<ClientError[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (p = page, pp = perPage, s = search) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchNui<{ rows: ClientError[]; total: number }>('getClientErrors', {
        page: p,
        perPage: pp,
        search: s,
      })
      if (res && res.success) {
        const data = res.data as any
        setRows(data.rows || [])
        setTotal(data.total || 0)
      } else {
        setError(res?.error || 'Failed to fetch logs')
      }
    } catch (err) {
      setError('Network error while fetching logs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Load on mount
    load(1, perPage, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    setPage(1)
    await load(1, perPage, search)
  }

  const handlePerPageChange = async (val: number) => {
    setPerPage(val)
    setPage(1)
    await load(1, val, search)
  }

  const handlePageChange = async (newPage: number) => {
    setPage(newPage)
    await load(newPage, perPage, search)
  }

  const formatDate = (iso?: string) => {
    if (!iso) return '-' 
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  return (
    <ErrorBoundary fullScreen={false} scopeName="Client Errors">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
          <Button variant="primary" onClick={handleSearch} disabled={isLoading}>
            <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-search'}`} />
            Search
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm opacity-70">Per Page</div>
            <select value={perPage} onChange={(e) => handlePerPageChange(parseInt(e.target.value, 10))} className="bg-[rgba(10,16,30,0.6)] border rounded p-1">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <Card>
          {error && (
            <div className="p-2 bg-red-600/10 border border-red-600/20 rounded">{error}</div>
          )}

          <div className="w-full overflow-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="text-sm text-[#c3cfdc]">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-sm text-[#9aa7bd]">No logs found</td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-2 py-2 text-sm">{r.id}</td>
                    <td className="px-2 py-2 text-sm">{formatDate(r.time)}</td>
                    <td className="px-2 py-2 text-sm break-words">{r.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-[#9aa7bd]">Showing {rows.length} of {total} total</div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
              <div className="px-3 py-1 rounded bg-[rgba(15,23,42,0.5)]">Page {page}</div>
              <Button variant="secondary" onClick={() => handlePageChange(Math.min(Math.ceil(total / perPage) || 1, page + 1))} disabled={page >= Math.ceil(total / perPage)}>Next</Button>
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
