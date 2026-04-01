'use client'

import { Lead, LeadSequenceSummary } from '@/types'
import StatusBadge from './StatusBadge'
import { format, parseISO } from 'date-fns'
import { Phone, Mail, Car, AlertTriangle, GitBranch, MessageSquare } from 'lucide-react'
import { TIER_COLORS, TIER_LABELS } from '@/lib/sequences/tierClassifier'

const STALE_LEAD_DAYS = 548

function isStale(createdAt: string): boolean {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return days > STALE_LEAD_DAYS
}

interface Props {
  leads: Lead[]
  sequenceMap?: Record<string, LeadSequenceSummary>
  onRowClick?: (lead: Lead) => void
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === '1') return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
  return phone
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

function formatShortDate(iso: string) {
  try { return format(parseISO(iso), 'MMM d') } catch { return '' }
}

export default function LeadsTable({ leads, sequenceMap = {}, onRowClick }: Props) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Car className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No leads yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Interest</th>
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Contact</th>
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sequence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map((lead) => {
            const seq = sequenceMap[lead.id]
            const tier = lead.lead_tier
            const tierStyle = tier ? TIER_COLORS[tier] : null

            return (
              <tr key={lead.id} onClick={() => onRowClick?.(lead)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </span>
                    {tier && tierStyle && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.ring}`}>
                        {TIER_LABELS[tier]}
                      </span>
                    )}
                    {isStale(lead.created_at) && (
                      <span title="Lead is older than 18 months — verify consent before contacting"
                        className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
                        <AlertTriangle className="h-3 w-3" /> Stale
                      </span>
                    )}
                    {lead.status === 'responded' && !lead.ai_paused && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                        <MessageSquare className="h-3 w-3" /> Replied — AI responding
                      </span>
                    )}
                  </div>
                  {lead.lead_source && (
                    <div className="text-xs text-gray-400 mt-0.5">{lead.lead_source}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      {formatPhone(lead.phone)}
                    </span>
                    {lead.email && (
                      <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        {lead.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-700">{lead.vehicle_interest || '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-gray-600">{formatDate(lead.last_contact_date)}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-6 py-4">
                  {seq ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs text-purple-700 font-medium">
                        <GitBranch className="h-3 w-3" />
                        Touch {seq.touches_sent} of {seq.total_touches}
                      </div>
                      {seq.next_touch_at && (
                        <div className="text-xs text-gray-400">
                          Next: {formatShortDate(seq.next_touch_at)} · {seq.next_touch_channel?.toUpperCase()}
                          {lead.sequence_paused && <span className="ml-1 text-amber-500">paused</span>}
                        </div>
                      )}
                      {!seq.next_touch_at && (
                        <div className="text-xs text-gray-400">Sequence complete</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
