'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Send, Edit2, Check, Loader2, AlertCircle, CheckCircle2, Users, ExternalLink,
} from 'lucide-react'
import { VehicleNews } from '@/types'

interface MatchedLead {
  id: string
  first_name: string
  last_name: string
  vehicle_interest: string | null
  phone: string
  status: string
  opted_out: boolean
}

type MatchType = 'same_brand' | 'competitor'
type SendStatus = 'generating' | 'ready' | 'editing' | 'sending' | 'sent' | 'error'

interface LeadEntry {
  lead: MatchedLead
  message: string
  editDraft: string
  sendStatus: SendStatus
  errorMsg?: string
  matchType: MatchType
  segmentName?: string
}

interface Props {
  article: VehicleNews | null
  onClose: () => void
}

export default function ArticleUseModal({ article, onClose }: Props) {
  const [entries, setEntries] = useState<LeadEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [salespersonName, setSalespersonName] = useState('Jake')
  const [sendAllProgress, setSendAllProgress] = useState<{ done: number; total: number } | null>(null)

  const cleanUrl = article?.url.replace(/#_b=[^&]*/g, '') ?? ''
  const articleType = article?.article_type ?? 'news'

  const loadLeadsAndGenerate = useCallback(async () => {
    if (!article) return
    setLoading(true)
    setEntries([])

    try {
      const res = await fetch(
        `/api/articles/match?brand=${encodeURIComponent(article.brand ?? '')}&article_type=${encodeURIComponent(articleType)}`
      )
      const { same_brand_leads, competitor_leads, salesperson_name } = await res.json()
      setSalespersonName(salesperson_name || 'Jake')

      const allLeads: Array<MatchedLead & { matchType: MatchType; segmentName?: string }> = [
        ...(same_brand_leads ?? []).map((l: MatchedLead) => ({ ...l, matchType: 'same_brand' as MatchType })),
        ...(competitor_leads ?? []).map((l: MatchedLead & { segment_name: string }) => ({
          ...l,
          matchType: 'competitor' as MatchType,
          segmentName: l.segment_name,
        })),
      ]

      if (!allLeads.length) { setLoading(false); return }

      const initial: LeadEntry[] = allLeads.map(l => ({
        lead: l,
        message: '',
        editDraft: '',
        sendStatus: l.opted_out ? 'ready' : 'generating',
        matchType: l.matchType,
        segmentName: l.segmentName,
      }))
      setEntries(initial)
      setLoading(false)

      // Generate messages for non-opted-out leads in parallel batches of 5
      const eligible = initial.filter(e => !e.lead.opted_out)
      const BATCH = 5
      for (let i = 0; i < eligible.length; i += BATCH) {
        const batch = eligible.slice(i, i + BATCH)
        await Promise.all(
          batch.map(async (entry) => {
            try {
              const r = await fetch('/api/articles/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lead_id: entry.lead.id,
                  article_headline: article.headline,
                  article_url: cleanUrl,
                  article_summary: article.summary,
                  article_type: articleType,
                  is_competitor: entry.matchType === 'competitor',
                }),
              })
              const data = await r.json()
              setEntries(prev =>
                prev.map(e =>
                  e.lead.id === entry.lead.id
                    ? { ...e, message: data.message ?? '', editDraft: data.message ?? '', sendStatus: r.ok ? 'ready' : 'error', errorMsg: r.ok ? undefined : (data.error ?? 'Generation failed') }
                    : e
                )
              )
            } catch {
              setEntries(prev =>
                prev.map(e =>
                  e.lead.id === entry.lead.id ? { ...e, sendStatus: 'error', errorMsg: 'Network error' } : e
                )
              )
            }
          })
        )
      }
    } catch {
      setLoading(false)
    }
  }, [article, cleanUrl, articleType])

  useEffect(() => {
    if (article) loadLeadsAndGenerate()
    else setEntries([])
  }, [article, loadLeadsAndGenerate])

  function setEntry(leadId: string, patch: Partial<LeadEntry>) {
    setEntries(prev => prev.map(e => e.lead.id === leadId ? { ...e, ...patch } : e))
  }

  async function sendOne(leadId: string) {
    const entry = entries.find(e => e.lead.id === leadId)
    if (!entry || entry.lead.opted_out) return
    const msg = entry.sendStatus === 'editing' ? entry.editDraft : entry.message
    if (!msg.trim()) return

    setEntry(leadId, { sendStatus: 'sending' })
    try {
      const res = await fetch(`/api/leads/${leadId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (res.ok) {
        setEntry(leadId, { sendStatus: 'sent', message: msg })
      } else {
        setEntry(leadId, { sendStatus: 'error', errorMsg: data.error ?? 'Send failed' })
      }
    } catch {
      setEntry(leadId, { sendStatus: 'error', errorMsg: 'Network error' })
    }
  }

  async function sendAll() {
    const toSend = entries.filter(
      e => !e.lead.opted_out && (e.sendStatus === 'ready' || e.sendStatus === 'error') && e.message
    )
    if (!toSend.length) return

    setSendingAll(true)
    setSendAllProgress({ done: 0, total: toSend.length })

    for (let i = 0; i < toSend.length; i++) {
      await sendOne(toSend[i].lead.id)
      setSendAllProgress({ done: i + 1, total: toSend.length })
    }

    setSendingAll(false)
    setSendAllProgress(null)
  }

  if (!article) return null

  const sameBrandEntries = entries.filter(e => e.matchType === 'same_brand')
  const competitorEntries = entries.filter(e => e.matchType === 'competitor')
  const totalLeads = entries.length
  const readyCount = entries.filter(e => e.sendStatus === 'ready' && !e.lead.opted_out).length
  const sentCount = entries.filter(e => e.sendStatus === 'sent').length
  const generatingCount = entries.filter(e => e.sendStatus === 'generating').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{article.source}</p>
                {articleType === 'deal' && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide">Deal</span>
                )}
                {articleType === 'new_model' && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">New Model</span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-gray-900 leading-snug">{article.headline}</h2>
              {article.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>}
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1.5"
                onClick={e => e.stopPropagation()}
              >
                View article <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats row + Send All */}
          {!loading && totalLeads > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {totalLeads} matching lead{totalLeads !== 1 ? 's' : ''}
                  {generatingCount > 0 && <span className="text-blue-500 ml-1">— generating {generatingCount}…</span>}
                  {sentCount > 0 && <span className="text-green-600 ml-1">· {sentCount} sent</span>}
                </span>
              </div>
              <button
                onClick={sendAll}
                disabled={sendingAll || readyCount === 0}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sendingAll && sendAllProgress
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending {sendAllProgress.done}/{sendAllProgress.total}</>
                  : <><Send className="h-3.5 w-3.5" /> Send to All ({readyCount})</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            </div>
          )}

          {!loading && totalLeads === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              No leads found with matching vehicle interest for {article.brand}.
            </div>
          )}

          {/* Same-brand leads */}
          {sameBrandEntries.length > 0 && (
            <>
              {competitorEntries.length > 0 && (
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-1">
                  {article.brand} leads
                </p>
              )}
              {sameBrandEntries.map(entry => (
                <LeadRow
                  key={entry.lead.id}
                  entry={entry}
                  salespersonName={salespersonName}
                  onEdit={() => setEntry(entry.lead.id, { sendStatus: 'editing', editDraft: entry.message })}
                  onCancelEdit={() => setEntry(entry.lead.id, { sendStatus: 'ready' })}
                  onSaveEdit={(msg) => setEntry(entry.lead.id, { sendStatus: 'ready', message: msg, editDraft: msg })}
                  onDraftChange={(d) => setEntry(entry.lead.id, { editDraft: d })}
                  onSend={() => sendOne(entry.lead.id)}
                />
              ))}
            </>
          )}

          {/* Competitor leads — only shown for deal articles */}
          {competitorEntries.length > 0 && (
            <>
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide pb-1">
                  Competitor leads — worth comparing
                </p>
              </div>
              {competitorEntries.map(entry => (
                <LeadRow
                  key={entry.lead.id}
                  entry={entry}
                  salespersonName={salespersonName}
                  onEdit={() => setEntry(entry.lead.id, { sendStatus: 'editing', editDraft: entry.message })}
                  onCancelEdit={() => setEntry(entry.lead.id, { sendStatus: 'ready' })}
                  onSaveEdit={(msg) => setEntry(entry.lead.id, { sendStatus: 'ready', message: msg, editDraft: msg })}
                  onDraftChange={(d) => setEntry(entry.lead.id, { editDraft: d })}
                  onSend={() => sendOne(entry.lead.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LeadRow({
  entry, salespersonName, onEdit, onCancelEdit, onSaveEdit, onDraftChange, onSend,
}: {
  entry: LeadEntry
  salespersonName: string
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (msg: string) => void
  onDraftChange: (d: string) => void
  onSend: () => void
}) {
  const { lead, message, editDraft, sendStatus, errorMsg, matchType, segmentName } = entry
  const isOptedOut = lead.opted_out
  const isCompetitor = matchType === 'competitor'

  return (
    <div className={`rounded-xl border px-4 py-3 ${isOptedOut ? 'border-gray-100 bg-gray-50 opacity-60' : isCompetitor ? 'border-amber-100 bg-amber-50/30' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{lead.first_name} {lead.last_name}</p>
            {isOptedOut && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 uppercase tracking-wide">Opted Out</span>
            )}
            {lead.vehicle_interest && (
              <span className="text-xs text-gray-400">
                {isCompetitor ? `Also interested in ${lead.vehicle_interest}` : lead.vehicle_interest}
              </span>
            )}
            {isCompetitor && segmentName && (
              <span className="text-[10px] text-amber-600 font-medium">{segmentName}</span>
            )}
          </div>

          {/* Message area */}
          {!isOptedOut && (
            <div className="mt-2">
              {sendStatus === 'generating' && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating message…
                </div>
              )}

              {sendStatus === 'error' && !message && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorMsg ?? 'Failed to generate'}
                </div>
              )}

              {sendStatus === 'editing' ? (
                <div className="space-y-2">
                  <textarea
                    value={editDraft}
                    onChange={e => onDraftChange(e.target.value)}
                    rows={3}
                    className="w-full text-xs text-gray-700 border border-blue-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSaveEdit(editDraft)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Check className="h-3.5 w-3.5" /> Done
                    </button>
                    <button onClick={onCancelEdit} className="text-xs text-gray-400 hover:text-gray-600">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                message && sendStatus !== 'generating' && (
                  <p className={`text-xs leading-relaxed ${sendStatus === 'sent' ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                    {message}
                  </p>
                )
              )}

              {sendStatus === 'sent' && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                </div>
              )}

              {sendStatus === 'error' && message && (
                <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isOptedOut && sendStatus !== 'sent' && (
          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
            {sendStatus === 'ready' && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Edit message"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            {(sendStatus === 'ready' || sendStatus === 'error') && message && (
              <button
                onClick={onSend}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Send className="h-3 w-3" /> Send
              </button>
            )}
            {sendStatus === 'sending' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
