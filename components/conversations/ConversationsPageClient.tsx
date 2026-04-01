'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConversationRow } from '@/app/(dashboard)/conversations/page'
import { format, parseISO } from 'date-fns'
import { MessageSquare, Mail, ArrowUpRight, ArrowDownLeft, Search, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

function formatDate(s: string) {
  try { return format(parseISO(s), 'MMM d, yyyy · h:mm a') } catch { return s }
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return phone
}

export default function ConversationsPageClient({ rows }: { rows: ConversationRow[] }) {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'email'>('all')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all')

  const filtered = rows.filter(r => {
    if (channelFilter !== 'all' && r.channel !== channelFilter) return false
    if (directionFilter !== 'all' && r.direction !== directionFilter) return false
    const q = search.toLowerCase()
    if (q && !`${r.lead_first_name} ${r.lead_last_name} ${r.message} ${r.lead_vehicle_interest ?? ''}`.toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-sm text-gray-500 mt-1">{rows.length} total messages</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages or leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {(['all', 'sms', 'email'] as const).map(v => (
            <button key={v} onClick={() => setChannelFilter(v)}
              className={clsx('rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                channelFilter === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900')}>
              {v === 'all' ? 'All Channels' : v.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {(['all', 'outbound', 'inbound'] as const).map(v => (
            <button key={v} onClick={() => setDirectionFilter(v)}
              className={clsx('rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                directionFilter === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900')}>
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Direction</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No conversations yet
                </td>
              </tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <Link href={`/conversations/${row.lead_id}`} className="block">
                    <div className="font-medium text-gray-900">{row.lead_first_name} {row.lead_last_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatPhone(row.lead_phone)}</div>
                    {row.lead_vehicle_interest && (
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{row.lead_vehicle_interest}</div>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/conversations/${row.lead_id}`} className="block">
                    {row.channel === 'sms' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                        <MessageSquare className="h-3 w-3" /> SMS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
                        <Mail className="h-3 w-3" /> Email
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/conversations/${row.lead_id}`} className="block">
                    {row.direction === 'outbound' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" /> Outbound
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" /> Inbound
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4 max-w-sm">
                  <Link href={`/conversations/${row.lead_id}`} className="block">
                    <p className="text-gray-700 line-clamp-2 leading-snug">{row.message}</p>
                  </Link>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                  <Link href={`/conversations/${row.lead_id}`} className="flex items-center justify-between gap-2">
                    {formatDate(row.sent_at)}
                    <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-500">
            Showing {filtered.length} of {rows.length} messages
          </div>
        )}
      </div>
    </div>
  )
}
