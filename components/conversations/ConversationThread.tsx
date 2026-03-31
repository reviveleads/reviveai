import Link from 'next/link'
import { Lead, Conversation } from '@/types'
import StatusBadge from '@/components/leads/StatusBadge'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Phone, Mail, Car, MessageSquare, Zap } from 'lucide-react'
import { clsx } from 'clsx'

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  return phone
}

function formatTime(s: string) {
  try { return format(parseISO(s), 'MMM d · h:mm a') } catch { return s }
}

export default function ConversationThread({
  lead,
  messages,
}: {
  lead: Lead
  messages: Conversation[]
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Back + header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <Link
          href="/conversations"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {lead.first_name[0]}{lead.last_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lead.first_name} {lead.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {formatPhone(lead.phone)}
                </span>
                {lead.email && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {lead.email}
                  </span>
                )}
                {lead.vehicle_interest && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Car className="h-3.5 w-3.5 text-gray-400" />
                    {lead.vehicle_interest}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {lead.lead_source && (
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                {lead.lead_source}
              </span>
            )}
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Messages will appear here after the campaign sends</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg, i) => {
              const isOutbound = msg.direction === 'outbound'
              const showDateSep =
                i === 0 ||
                format(parseISO(messages[i - 1].sent_at), 'yyyy-MM-dd') !==
                format(parseISO(msg.sent_at), 'yyyy-MM-dd')

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">
                        {format(parseISO(msg.sent_at), 'EEEE, MMMM d')}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  <div className={clsx('flex items-end gap-2', isOutbound ? 'justify-end' : 'justify-start')}>
                    {/* Lead avatar (inbound) */}
                    {!isOutbound && (
                      <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mb-1">
                        {lead.first_name[0]}
                      </div>
                    )}

                    <div className={clsx('flex flex-col gap-1', isOutbound ? 'items-end' : 'items-start')}>
                      {/* Channel badge on first msg of a run */}
                      <div className={clsx(
                        'max-w-sm rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isOutbound
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      )}>
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {msg.channel === 'sms' ? (
                          <MessageSquare className="h-3 w-3 text-gray-300" />
                        ) : (
                          <Mail className="h-3 w-3 text-gray-300" />
                        )}
                        <span className="text-[11px] text-gray-400">{formatTime(msg.sent_at)}</span>
                        {isOutbound && (
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            · <Zap className="h-2.5 w-2.5 text-blue-400" /> AI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI avatar (outbound) */}
                    {isOutbound && (
                      <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mb-1">
                        <Zap className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-8 py-3">
        <p className="text-xs text-gray-400 text-center">
          {messages.length} message{messages.length !== 1 ? 's' : ''} ·{' '}
          {messages.filter(m => m.direction === 'outbound').length} sent ·{' '}
          {messages.filter(m => m.direction === 'inbound').length} received
        </p>
      </div>
    </div>
  )
}
