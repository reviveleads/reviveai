'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lead, Conversation, Appointment } from '@/types'
import StatusBadge from './StatusBadge'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Phone, Mail, Car, MapPin, Calendar, FileText,
  MessageSquare, Zap, Mail as MailIcon, CheckCircle2, Clock,
  Send, Loader2, Check, User, AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return p
}

function formatDate(s: string | null) {
  if (!s) return '—'
  try { return format(parseISO(s), 'MMM d, yyyy') } catch { return s }
}

function formatDateTime(s: string) {
  try { return format(parseISO(s), 'MMM d, yyyy · h:mm a') } catch { return s }
}

type TimelineItem =
  | { kind: 'created'; timestamp: string }
  | { kind: 'conversation'; data: Conversation; timestamp: string }
  | { kind: 'appointment'; data: Appointment; timestamp: string }

export default function LeadDetailPage({
  lead: initialLead,
  conversations: initialConversations,
  appointments,
}: {
  lead: Lead
  conversations: Conversation[]
  appointments: Appointment[]
}) {
  const [lead, setLead] = useState(initialLead)
  const [conversations, setConversations] = useState(initialConversations)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [activeTab, setActiveTab] = useState<'thread' | 'timeline'>('thread')
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)

  const timeline: TimelineItem[] = [
    { kind: 'created' as const, timestamp: lead.created_at },
    ...conversations.map(c => ({ kind: 'conversation' as const, data: c, timestamp: c.sent_at })),
    ...appointments.map(a => ({ kind: 'appointment' as const, data: a, timestamp: a.created_at })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  async function handleSendAIMessage() {
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setConversations(prev => [...prev, {
          id: crypto.randomUUID(),
          lead_id: lead.id,
          channel: 'sms',
          direction: 'outbound',
          message: data.message,
          sent_at: new Date().toISOString(),
          sent_by: 'ai',
        }])
        setMessageSent(true)
        setTimeout(() => setMessageSent(false), 3000)
      }
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleSendManual() {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim(), sent_by: 'manual' }),
      })
      const data = await res.json()
      if (res.ok) {
        setConversations(prev => [...prev, {
          id: crypto.randomUUID(),
          lead_id: lead.id,
          channel: 'sms',
          direction: 'outbound',
          message: replyText.trim(),
          sent_at: new Date().toISOString(),
          sent_by: 'manual',
        }])
        // Server sets ai_paused: true when manual, reflect it locally
        setLead(prev => ({ ...prev, ai_paused: true }))
        setReplyText('')
      } else {
        console.error('[manual send]', data.error)
      }
    } finally {
      setSendingReply(false)
    }
  }

  async function handleToggleAIPause() {
    setTogglingAI(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: !lead.ai_paused }),
      })
      const updated = await res.json()
      setLead(updated)
    } finally {
      setTogglingAI(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Back */}
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      {/* Hero header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {lead.first_name[0]}{lead.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h1>
            <StatusBadge status={lead.status} />
            {lead.lead_source && (
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">{lead.lead_source}</span>
            )}
          </div>
          <div className="flex items-center gap-5 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Phone className="h-3.5 w-3.5 text-gray-400" /> {formatPhone(lead.phone)}
            </span>
            {lead.email && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5 text-gray-400" /> {lead.email}
              </span>
            )}
            {lead.vehicle_interest && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Car className="h-3.5 w-3.5 text-gray-400" /> {lead.vehicle_interest}
              </span>
            )}
          </div>
        </div>
        {/* AI message button — only when AI is on */}
        {!lead.ai_paused && (
          <button
            onClick={handleSendAIMessage}
            disabled={sendingMessage}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors shadow-sm flex-shrink-0',
              messageSent
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            )}
          >
            {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : messageSent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {messageSent ? 'Sent!' : sendingMessage ? 'Sending...' : 'Send AI Message'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: info card */}
        <div className="col-span-1 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Lead Details</h3>
            <div className="space-y-3">
              <Detail icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={formatPhone(lead.phone)} />
              <Detail icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email || '—'} />
              <Detail icon={<Car className="h-3.5 w-3.5" />} label="Vehicle" value={lead.vehicle_interest || '—'} />
              <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="Source" value={lead.lead_source || '—'} />
              <Detail icon={<Calendar className="h-3.5 w-3.5" />} label="Last Contact" value={formatDate(lead.last_contact_date)} />
              <Detail icon={<Calendar className="h-3.5 w-3.5" />} label="Lead Created" value={formatDate(lead.created_at)} />
              {lead.notes && <Detail icon={<FileText className="h-3.5 w-3.5" />} label="Notes" value={lead.notes} />}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Messages" value={conversations.length} />
              <Stat label="Sent" value={conversations.filter(c => c.direction === 'outbound').length} />
              <Stat label="Received" value={conversations.filter(c => c.direction === 'inbound').length} />
              <Stat label="Appts" value={appointments.length} />
            </div>
          </div>

          {/* Appointments */}
          {appointments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Appointments</h3>
              <div className="space-y-3">
                {appointments.map(appt => (
                  <div key={appt.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-sm font-medium text-gray-800">{formatDateTime(appt.scheduled_at)}</p>
                    {appt.notes && <p className="text-xs text-gray-500 mt-1">{appt.notes}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                      {appt.salesperson_notified ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Salesperson notified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3 w-3" /> Notification pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: thread + timeline */}
        <div className="col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-5">
            {(['thread', 'timeline'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                )}
              >
                {tab === 'thread' ? `Conversation (${conversations.length})` : `Timeline (${timeline.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'thread' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Thread controls */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {conversations.length} message{conversations.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={handleToggleAIPause}
                  disabled={togglingAI}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                    lead.ai_paused
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  )}
                >
                  {togglingAI ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className={clsx('h-3 w-3', lead.ai_paused ? 'text-gray-400' : 'text-blue-500')} />
                  )}
                  AI Auto-Reply: {lead.ai_paused ? 'OFF' : 'ON'}
                </button>
              </div>

              {/* AI paused banner */}
              {lead.ai_paused && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-800">AI paused — you&apos;re handling this one manually</p>
                </div>
              )}

              {/* Messages */}
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-3">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Send an AI message or type a reply below</p>
                </div>
              ) : (
                <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                  {conversations.map((msg, i) => {
                    const isOut = msg.direction === 'outbound'
                    const isManual = msg.sent_by === 'manual'
                    const showSep = i === 0 || format(parseISO(conversations[i-1].sent_at), 'yyyy-MM-dd') !== format(parseISO(msg.sent_at), 'yyyy-MM-dd')
                    return (
                      <div key={msg.id}>
                        {showSep && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400">{format(parseISO(msg.sent_at), 'EEEE, MMMM d')}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                          </div>
                        )}
                        <div className={clsx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}>
                          {!isOut && (
                            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0 mb-1">
                              {lead.first_name[0]}
                            </div>
                          )}
                          <div className={clsx('flex flex-col gap-1', isOut ? 'items-end' : 'items-start')}>
                            <div className={clsx(
                              'max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                              isOut
                                ? isManual
                                  ? 'bg-emerald-600 text-white rounded-br-md'
                                  : 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            )}>
                              {msg.message}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {msg.channel === 'sms'
                                ? <MessageSquare className="h-3 w-3 text-gray-300" />
                                : <MailIcon className="h-3 w-3 text-gray-300" />}
                              <span className="text-[11px] text-gray-400">{formatDateTime(msg.sent_at)}</span>
                              {isOut && (
                                isManual
                                  ? <span className="text-[11px] text-gray-400">· <User className="inline h-2.5 w-2.5 text-emerald-500" /> You</span>
                                  : <span className="text-[11px] text-gray-400">· <Zap className="inline h-2.5 w-2.5 text-blue-400" /> AI</span>
                              )}
                            </div>
                          </div>
                          {isOut && (
                            <div className={clsx(
                              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1',
                              isManual ? 'bg-emerald-600' : 'bg-blue-600'
                            )}>
                              {isManual
                                ? <User className="h-3.5 w-3.5 text-white" />
                                : <Zap className="h-3.5 w-3.5 text-white" />
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Manual reply box */}
              {!lead.opted_out && (
                <div className="border-t border-gray-100 overflow-hidden rounded-b-xl">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendManual()
                    }}
                    placeholder="Type a reply… (⌘↵ to send)"
                    rows={3}
                    className="w-full px-5 py-4 text-sm text-gray-800 resize-none outline-none bg-white placeholder:text-gray-400"
                  />
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Manual — bypasses quiet hours &amp; AI sequence
                    </span>
                    <button
                      onClick={handleSendManual}
                      disabled={sendingReply || !replyText.trim()}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-5">
                    {timeline.map((item, i) => (
                      <div key={i} className="relative flex items-start gap-4 pl-10">
                        <div className={clsx(
                          'absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-white',
                          item.kind === 'created' ? 'bg-gray-400' :
                          item.kind === 'appointment' ? 'bg-green-500' :
                          item.kind === 'conversation' && item.data.direction === 'inbound' ? 'bg-amber-400' :
                          item.kind === 'conversation' && item.data.sent_by === 'manual' ? 'bg-emerald-500' :
                          'bg-blue-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-800">
                              {item.kind === 'created' && 'Lead created'}
                              {item.kind === 'appointment' && 'Appointment scheduled'}
                              {item.kind === 'conversation' && item.data.direction === 'outbound' && item.data.sent_by === 'manual' && (
                                <span className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-emerald-500" />
                                  You sent {item.data.channel.toUpperCase()}
                                </span>
                              )}
                              {item.kind === 'conversation' && item.data.direction === 'outbound' && item.data.sent_by !== 'manual' && (
                                <span className="flex items-center gap-1.5">
                                  <Zap className="h-3.5 w-3.5 text-blue-500" />
                                  AI sent {item.data.channel.toUpperCase()}
                                </span>
                              )}
                              {item.kind === 'conversation' && item.data.direction === 'inbound' && `Customer replied via ${item.data.channel.toUpperCase()}`}
                            </span>
                            <span className="text-xs text-gray-400">{formatDateTime(item.timestamp)}</span>
                          </div>
                          {item.kind === 'conversation' && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.data.message}</p>
                          )}
                          {item.kind === 'appointment' && item.data.notes && (
                            <p className="text-sm text-gray-500 mt-1">{item.data.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 flex items-center gap-1.5">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <span className="break-all">{value}</span>
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
