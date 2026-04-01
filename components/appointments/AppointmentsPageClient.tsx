'use client'

import { AppointmentRow } from '@/app/(dashboard)/appointments/page'
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'
import { Calendar, Phone, Car, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return phone
}

function getTimingLabel(scheduledAt: string) {
  try {
    const date = parseISO(scheduledAt)
    if (isPast(date) && !isToday(date)) return { label: 'Past', classes: 'bg-gray-100 text-gray-500' }
    if (isToday(date)) return { label: 'Today', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' }
    if (isTomorrow(date)) return { label: 'Tomorrow', classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' }
    return { label: 'Upcoming', classes: 'bg-green-50 text-green-700 ring-1 ring-green-200' }
  } catch {
    return { label: 'Upcoming', classes: 'bg-green-50 text-green-700' }
  }
}

function formatScheduled(s: string) {
  try {
    const d = parseISO(s)
    return { date: format(d, 'EEE, MMM d, yyyy'), time: format(d, 'h:mm a') }
  } catch { return { date: s, time: '' } }
}

export default function AppointmentsPageClient({ rows }: { rows: AppointmentRow[] }) {
  const upcoming = rows.filter(r => !isPast(parseISO(r.scheduled_at)) || isToday(parseISO(r.scheduled_at)))
  const past = rows.filter(r => isPast(parseISO(r.scheduled_at)) && !isToday(parseISO(r.scheduled_at)))

  if (rows.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">No appointments scheduled yet</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No appointments yet</p>
          <p className="text-sm text-gray-500 mt-1">Appointments will appear here once AI conversations lead to bookings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">{rows.length} total · {upcoming.length} upcoming</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Salesperson Notified</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{rows.filter(r => r.salesperson_notified).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timing</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salesperson</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(row => {
              const timing = getTimingLabel(row.scheduled_at)
              const { date, time } = formatScheduled(row.scheduled_at)
              return (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{row.lead_first_name} {row.lead_last_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                      <Phone className="h-3 w-3" />
                      {formatPhone(row.lead_phone)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 max-w-[200px]">
                    {row.lead_vehicle_interest || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{date}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', timing.classes)}>
                      {timing.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {row.salesperson_notified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Notified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px]">
                    <span className="line-clamp-2">{row.notes || '—'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-500">
          {rows.length} appointment{rows.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
