'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Lead, Conversation, LeadStatus, CampaignSequence } from '@/types'
import { TIER_COLORS, TIER_LABELS } from '@/lib/sequences/tierClassifier'
import StatusBadge from './StatusBadge'
import { format, parseISO } from 'date-fns'
import {
  X, Phone, Mail, Car, MapPin, Calendar, FileText,
  Edit2, Check, XCircle, Send, Loader2, Zap, MessageSquare, ExternalLink,
  GitBranch, Pause, Play, ChevronRight, User, AlertTriangle
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

interface Props {
  leadId: string | null
  onClose: () => void
  onLeadUpdated: (lead: Lead) => void
}

const STATUS_OPTIONS: LeadStatus[] = ['pending', 'contacted', 'responded', 'appointed', 'dead']

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return p
}

function formatTime(s: string) {
  try { return format(parseISO(s), 'MMM d · h:mm a') } catch { return s }
}

type EditableFields = Pick<Lead, 'first_name' | 'last_name' | 'phone' | 'email' |
  'vehicle_interest' | 'last_contact_date' | 'lead_source' | 'notes'>

export default function LeadSlideOver({ leadId, onClose, onLeadUpdated }: Props) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sequences, setSequences] = useState<CampaignSequence[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editFields, setEditFields] = useState<EditableFields | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [pausingSequence, setPausingSequence] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  const fetchData = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${id}`)
      const data = await res.json()
      setLead(data.lead)
      setConversations(data.conversations)
      setSequences(data.sequences ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (leadId) {
      setEditing(false)
      setEditFields(null)
      setMessageSent(false)
      setSendingMessage(false)
      setMessageError(null)
      setPausingSequence(false)
      setReplyText('')
      fetchData(leadId)
    } else {
      setLead(null)
      setConversations([])
      setSequences([])
    }
  }, [leadId, fetchData])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleStatusChange(status: LeadStatus) {
    if (!lead) return
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const updated = await res.json()
    setLead(updated)
    onLeadUpdated(updated)
  }

  function startEditing() {
    if (!lead) return
    setEditFields({
      first_name: lead.first_name,
      last_name: lead.last_name,
      phone: lead.phone,
      email: lead.email ?? '',
      vehicle_interest: lead.vehicle_interest ?? '',
      last_contact_date: lead.last_contact_date ?? '',
      lead_source: lead.lead_source ?? '',
      notes: lead.notes ?? '',
    })
    setEditing(true)
  }

  async function handleSaveEdit() {
    if (!lead || !editFields) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      })
      const updated = await res.json()
      setLead(updated)
      onLeadUpdated(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendAIMessage() {
    if (!lead) return
    setSendingMessage(true)
    setMessageError(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setMessageError(data.error ?? `Error ${res.status}`)
        return
      }
      setMessageSent(true)
      await fetchData(lead.id)
      setTimeout(() => setMessageSent(false), 3000)
    } catch {
      setMessageError('Network error — please try again')
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleSendManual() {
    if (!lead || !replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim(), sent_by: 'manual' }),
      })
      if (res.ok) {
        setReplyText('')
        await fetchData(lead.id)
      }
    } finally {
      setSendingReply(false)
    }
  }

  async function handleToggleAIPause() {
    if (!lead) return
    setTogglingAI(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: !lead.ai_paused }),
      })
      const updated = await res.json()
      setLead(updated)
      onLeadUpdated(updated)
    } finally {
      setTogglingAI(false)
    }
  }

  async function handleTogglePause() {
    if (!lead) return
    setPausingSequence(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence_paused: !lead.sequence_paused }),
      })
      const updated = await res.json()
      setLead(updated)
      onLeadUpdated(updated)
    } finally {
      setPausingSequence(false)
    }
  }

  const isOpen = leadId !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {loading || !lead ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {lead.first_name[0]}{lead.last_name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">{formatPhone(lead.phone)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Full View
                </Link>
                <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Lead info */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead Info</h3>
                  {!editing ? (
                    <button onClick={startEditing} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </button>
                      <button onClick={handleSaveEdit} disabled={saving}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Status row */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={clsx(
                          'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                          lead.status === s
                            ? 'ring-2 ring-offset-1 ring-blue-400'
                            : 'opacity-60 hover:opacity-100'
                        )}
                      >
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {editing && editFields ? (
                    <>
                      <Field label="First Name">
                        <input value={editFields.first_name} onChange={e => setEditFields(f => f ? {...f, first_name: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Last Name">
                        <input value={editFields.last_name} onChange={e => setEditFields(f => f ? {...f, last_name: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Phone">
                        <input value={editFields.phone} onChange={e => setEditFields(f => f ? {...f, phone: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Email">
                        <input value={editFields.email ?? ''} onChange={e => setEditFields(f => f ? {...f, email: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Vehicle Interest" className="col-span-2">
                        <input value={editFields.vehicle_interest ?? ''} onChange={e => setEditFields(f => f ? {...f, vehicle_interest: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Lead Source">
                        <input value={editFields.lead_source ?? ''} onChange={e => setEditFields(f => f ? {...f, lead_source: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Last Contact Date">
                        <input type="date" value={editFields.last_contact_date ?? ''} onChange={e => setEditFields(f => f ? {...f, last_contact_date: e.target.value} : f)}
                          className="input-field" />
                      </Field>
                      <Field label="Notes" className="col-span-2">
                        <textarea value={editFields.notes ?? ''} onChange={e => setEditFields(f => f ? {...f, notes: e.target.value} : f)}
                          rows={2} className="input-field resize-none" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={formatPhone(lead.phone)} />
                      <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email || '—'} />
                      <InfoRow icon={<Car className="h-3.5 w-3.5" />} label="Vehicle" value={lead.vehicle_interest || '—'} className="col-span-2" />
                      <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Source" value={lead.lead_source || '—'} />
                      <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Last Contact" value={lead.last_contact_date ? format(parseISO(lead.last_contact_date), 'MMM d, yyyy') : '—'} />
                      {lead.notes && (
                        <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Notes" value={lead.notes} className="col-span-2" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sequence panel */}
              {sequences.length > 0 && (
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3.5 w-3.5 text-purple-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sequence</h3>
                      {lead?.lead_tier && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TIER_COLORS[lead.lead_tier].bg} ${TIER_COLORS[lead.lead_tier].text} ${TIER_COLORS[lead.lead_tier].ring}`}>
                          {TIER_LABELS[lead.lead_tier]}
                        </span>
                      )}
                      {lead?.sequence_paused && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          Paused
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleTogglePause}
                      disabled={pausingSequence}
                      className={clsx(
                        'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                        lead?.sequence_paused
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      )}
                    >
                      {pausingSequence ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : lead?.sequence_paused ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <Pause className="h-3 w-3" />
                      )}
                      {lead?.sequence_paused ? 'Resume' : 'Pause'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {sequences.map(touch => {
                      const isPast = touch.status === 'sent'
                      const isFailed = touch.status === 'failed'
                      const isSkipped = touch.status === 'skipped'
                      const isPending = touch.status === 'pending'
                      let dotColor = 'bg-gray-200'
                      if (isPast) dotColor = 'bg-blue-500'
                      if (isFailed) dotColor = 'bg-red-400'
                      if (isSkipped) dotColor = 'bg-gray-300'
                      return (
                        <div key={touch.id} className={clsx('flex items-center gap-2.5 py-1', (isSkipped || isFailed) && 'opacity-40')}>
                          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                          <span className={clsx('text-xs', isPast ? 'text-gray-400' : 'text-gray-700')}>
                            Touch {touch.touch_number} · {touch.channel.toUpperCase()}
                          </span>
                          <ChevronRight className="h-3 w-3 text-gray-200 flex-shrink-0" />
                          <span className="text-xs text-gray-400 ml-auto">
                            {isPast && touch.sent_at
                              ? format(parseISO(touch.sent_at), 'MMM d')
                              : isPending
                              ? format(parseISO(touch.scheduled_for), 'MMM d')
                              : touch.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Chat thread */}
              <div className="px-6 py-5">
                {/* Thread header: title + AI toggle */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Conversation · {conversations.length} messages
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* AI Auto-Reply toggle */}
                    <button
                      onClick={handleToggleAIPause}
                      disabled={togglingAI}
                      className={clsx(
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
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
                      AI {lead.ai_paused ? 'OFF' : 'ON'}
                    </button>

                    {/* Send AI Message (only when AI is on) */}
                    {!lead.ai_paused && (
                      <button
                        onClick={handleSendAIMessage}
                        disabled={sendingMessage}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          messageSent
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        )}
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : messageSent ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        {messageSent ? 'Sent!' : sendingMessage ? 'Sending...' : 'Send AI'}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI paused banner */}
                {lead.ai_paused && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-800">AI paused — you&apos;re handling this one manually</p>
                  </div>
                )}

                {messageError && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                    {messageError}
                  </div>
                )}

                {/* Messages */}
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-3">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {conversations.map((msg) => {
                      const isOut = msg.direction === 'outbound'
                      const isManual = msg.sent_by === 'manual'
                      return (
                        <div key={msg.id} className={clsx('flex items-end gap-2', isOut ? 'justify-end' : 'justify-start')}>
                          {!isOut && (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold flex-shrink-0 mb-1">
                              {lead.first_name[0]}
                            </div>
                          )}
                          <div className={clsx('flex flex-col gap-1', isOut ? 'items-end' : 'items-start')}>
                            <div className={clsx(
                              'max-w-[280px] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                              isOut
                                ? isManual
                                  ? 'bg-emerald-600 text-white rounded-br-md'
                                  : 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            )}>
                              {msg.message}
                            </div>
                            <div className="flex items-center gap-1">
                              {msg.channel === 'sms'
                                ? <MessageSquare className="h-2.5 w-2.5 text-gray-300" />
                                : <Mail className="h-2.5 w-2.5 text-gray-300" />}
                              <span className="text-[10px] text-gray-400">{formatTime(msg.sent_at)}</span>
                              {isOut && (
                                isManual
                                  ? <span className="text-[10px] text-gray-400">· <User className="inline h-2.5 w-2.5 text-emerald-500" /> You</span>
                                  : <span className="text-[10px] text-gray-400">· <Zap className="inline h-2.5 w-2.5 text-blue-400" /> AI</span>
                              )}
                            </div>
                          </div>
                          {isOut && (
                            <div className={clsx(
                              'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mb-1',
                              isManual ? 'bg-emerald-600' : 'bg-blue-600'
                            )}>
                              {isManual
                                ? <User className="h-3 w-3 text-white" />
                                : <Zap className="h-3 w-3 text-white" />
                              }
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Manual reply box */}
                {!lead.opted_out && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <textarea
                      ref={replyInputRef}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendManual()
                      }}
                      placeholder="Type a message… (⌘↵ to send)"
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm text-gray-800 resize-none outline-none bg-white placeholder:text-gray-400"
                    />
                    <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50 border-t border-gray-100">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" /> Manual reply · bypasses quiet hours
                      </span>
                      <button
                        onClick={handleSendManual}
                        disabled={sendingReply || !replyText.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 13px;
          color: #111827;
          outline: none;
          background: white;
        }
        .input-field:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 2px #eff6ff;
        }
      `}</style>
    </>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>
        {value}
      </p>
    </div>
  )
}
