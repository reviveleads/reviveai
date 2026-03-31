'use client'

import { useState } from 'react'
import { Lead, LeadStatus } from '@/types'
import StatusBadge from '@/components/leads/StatusBadge'
import { format, parseISO } from 'date-fns'
import { Phone, Mail, Search } from 'lucide-react'
import LeadSlideOver from '@/components/leads/LeadSlideOver'
import { clsx } from 'clsx'

const STATUS_FILTERS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Responded', value: 'responded' },
  { label: 'Appointed', value: 'appointed' },
  { label: 'Dead', value: 'dead' },
]

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return phone
}

function formatDate(s: string | null) {
  if (!s) return '—'
  try { return format(parseISO(s), 'MMM d, yyyy') } catch { return s }
}

export default function LeadsPageClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const filtered = leads.filter((l: Lead) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || [l.first_name, l.last_name, l.phone, l.email, l.vehicle_interest, l.lead_source]
      .some(v => v?.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">{leads.length} total leads</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Interest</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Contact</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No leads match your filters
                </td>
              </tr>
            ) : filtered.map((lead: Lead) => (
              <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{lead.first_name} {lead.last_name}</div>
                  {lead.notes && <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{lead.notes}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {formatPhone(lead.phone)}
                    </span>
                    {lead.email && (
                      <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{lead.vehicle_interest || '—'}</td>
                <td className="px-6 py-4 text-gray-600">{formatDate(lead.last_contact_date)}</td>
                <td className="px-6 py-4 text-gray-600">{lead.lead_source || '—'}</td>
                <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-500">
            Showing {filtered.length} of {leads.length} leads
          </div>
        )}
      </div>

      <LeadSlideOver
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={updated => setLeads((prev: Lead[]) => prev.map(l => l.id === updated.id ? updated : l))}
      />
    </div>
  )
}
