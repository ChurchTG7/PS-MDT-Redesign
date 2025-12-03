import React, { useState, useMemo } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { useFetchNui, useRealtimeUpdate } from '../utils/hooks'
import type { PenalCode } from '../types/api'

export default function PenalCodePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Fetch penal codes
  const { data: penalCodes = [], loading, error, refetch } = useFetchNui<PenalCode[]>('getPenalCodes', null)

  // Real-time updates
  useRealtimeUpdate('penalCodeUpdated', () => {
    refetch()
  })

  // Get unique categories from data
  const categories = useMemo(() => {
    if (!penalCodes || penalCodes.length === 0) return ['All']
    const uniqueCategories = Array.from(new Set(penalCodes.map((code: PenalCode) => code.category)))
    return ['All', ...uniqueCategories.sort()]
  }, [penalCodes])

  // Filter codes
  const filteredCodes = useMemo(() => {
    if (!penalCodes) return []
    return penalCodes.filter((code: PenalCode) => {
      if (!code.isActive) return false
      
      const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           code.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || code.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [penalCodes, searchQuery, selectedCategory])

  const getSeverityColor = (classType: string) => {
    switch (classType) {
      case 'felony': return 'danger'
      case 'misdemeanor': return 'warning'
      case 'infraction': return 'info'
      default: return 'default'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0 minutes'
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <Card>
        <div className="space-y-4">
          <Input
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<i className="fa-solid fa-magnifying-glass" />}
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[rgba(56,189,248,0.32)] to-[rgba(30,58,138,0.4)] text-white border border-[rgba(56,189,248,0.5)]'
                    : 'bg-[rgba(15,23,42,0.6)] text-[rgba(255,255,255,0.7)] border border-[rgba(36,72,176,0.2)] hover:border-[rgba(56,189,248,0.3)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Penal Codes List */}
      <Card title="Penal Codes" subtitle={`${filteredCodes.length} codes found`}>
        {loading ? (
                    <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-3xl spinner-theme mr-3" />
            <p className="text-white">Loading penal codes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400 mb-3" />
            <p className="text-red-400 mb-4">Failed to load penal codes</p>
            <Button size="sm" variant="primary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-12">
            <i className="fa-solid fa-search text-3xl text-[rgba(255,255,255,0.3)] mb-3" />
            <p className="text-[rgba(255,255,255,0.5)]">No penal codes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCodes.map((code, idx) => (
              <div
                key={code.id}
                className="p-4 bg-[rgba(11,19,34,0.4)] rounded-xl border border-[rgba(36,72,176,0.15)] hover:border-[rgba(56,189,248,0.3)] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-[#38BDF8]">{code.code}</span>
                      <Badge variant={getSeverityColor(code.class)}>
                        {code.class.toUpperCase()}
                      </Badge>
                      <Badge variant="default">{code.category}</Badge>
                      {code.points && code.points > 0 && (
                        <Badge variant="warning">{code.points} pts</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{code.title}</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[rgba(255,255,255,0.7)] mb-3">{code.description}</p>

                {/* Penalties */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] rounded-lg border border-[rgba(239,68,68,0.2)]">
                    <i className="fa-solid fa-clock text-red-400" />
                    <div>
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">Jail Time</p>
                      <p className="text-sm font-semibold text-white">{formatTime(code.sentence)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(34,197,94,0.1)] rounded-lg border border-[rgba(34,197,94,0.2)]">
                    <i className="fa-solid fa-dollar-sign text-green-400" />
                    <div>
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">Fine</p>
                      <p className="text-sm font-semibold text-white">{formatCurrency(code.fine)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Reference */}
      <Card title="Severity Levels">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[rgba(239,68,68,0.1)] rounded-lg border border-[rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="danger">FELONY</Badge>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">
              Most serious crimes with significant jail time and fines
            </p>
          </div>
          <div className="p-3 bg-[rgba(251,191,36,0.1)] rounded-lg border border-[rgba(251,191,36,0.3)]">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="warning">MISDEMEANOR</Badge>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">
              Lesser crimes with moderate penalties
            </p>
          </div>
          <div className="p-3 bg-[rgba(56,189,248,0.1)] rounded-lg border border-[rgba(56,189,248,0.3)]">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">INFRACTION</Badge>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.6)]">
              Minor violations usually resulting in fines only
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
