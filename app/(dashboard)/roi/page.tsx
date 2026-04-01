'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, Calendar, DollarSign, BarChart2,
  Download, Loader2, ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface ROIData {
  settings: { avg_deal_value: number; avg_lead_cost: number; monthly_plan_cost: number }
  stats: {
    reactivated_this_month: number
    appointments_this_month: number
    estimated_revenue: number
    lead_investment: number
    roi_multiple: number
  }
  timeline: { week: string; contacted: number; responded: number; appointed: number }[]
  reactivated_leads: { id: string; name: string; vehicle: string | null; status: string; reactivated_at: string | null }[]
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US')
}

function fmtWeek(iso: string) {
  try { return format(parseISO(iso), 'MMM d') } catch { return iso }
}

const STATUS_LABELS: Record<string, string> = {
  responded: 'Responded',
  appointed: 'Appointed',
  contacted: 'Contacted',
  pending: 'Pending',
  converted: 'Converted',
}

const STATUS_COLORS: Record<string, string> = {
  responded: 'bg-green-100 text-green-700',
  appointed: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  pending: 'bg-gray-100 text-gray-600',
  converted: 'bg-emerald-100 text-emerald-700',
}

export default function ROIPage() {
  const [data, setData] = useState<ROIData | null>(null)
  const [loading, setLoading] = useState(true)
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch('/api/roi')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) return null

  const { stats, timeline, reactivated_leads } = data

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ROI Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{monthName} — month to date</p>
        </div>
        <a
          href="/api/roi/export"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export Report
        </a>
      </div>

      {/* Hero stat */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-blue-200" />
          <span className="text-sm font-medium text-blue-200 uppercase tracking-wide">Leads Reactivated This Month</span>
        </div>
        <div className="text-6xl font-bold">{stats.reactivated_this_month}</div>
        <p className="text-blue-200 text-sm mt-2">leads that responded after going dark</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="h-5 w-5 text-green-600" />}
          label="Appointments Booked"
          value={String(stats.appointments_this_month)}
          bg="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          label="Estimated Revenue"
          value={fmtMoney(stats.estimated_revenue)}
          sub={`${stats.appointments_this_month} appts × ${fmtMoney(data.settings.avg_deal_value)}`}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-amber-600" />}
          label="Lead Investment"
          value={fmtMoney(stats.lead_investment)}
          sub={`${stats.reactivated_this_month} leads × ${fmtMoney(data.settings.avg_lead_cost)}`}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<BarChart2 className="h-5 w-5 text-purple-600" />}
          label="ROI Multiple"
          value={`${stats.roi_multiple}×`}
          sub={`vs ${fmtMoney(data.settings.monthly_plan_cost)}/mo plan`}
          bg="bg-purple-50"
          highlight
        />
      </div>

      {/* Timeline chart */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity — Last 90 Days</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={timeline} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="week" tickFormatter={fmtWeek} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              labelFormatter={(label: unknown) => fmtWeek(String(label))}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area type="monotone" dataKey="contacted" stroke="#3b82f6" strokeWidth={2} fill="url(#cGrad)" dot={false} />
            <Area type="monotone" dataKey="responded" stroke="#10b981" strokeWidth={2} fill="url(#rGrad)" dot={false} />
            <Area type="monotone" dataKey="appointed" stroke="#8b5cf6" strokeWidth={2} fill="url(#aGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Reactivated leads table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Reactivated This Month</h2>
          <span className="text-xs text-gray-400">{reactivated_leads.length} leads</span>
        </div>
        {reactivated_leads.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No leads reactivated yet this month. Sequences are working in the background.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Reactivated</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reactivated_leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-3 text-gray-600">{lead.vehicle || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {lead.reactivated_at
                      ? format(new Date(lead.reactivated_at), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <a href={`/leads/${lead.id}`} className="text-blue-600 hover:text-blue-700">
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, bg, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  bg: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border ${highlight ? 'border-purple-200' : 'border-gray-200'} bg-white shadow-sm p-5`}>
      <div className={`inline-flex rounded-lg p-2 ${bg} mb-3`}>{icon}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
