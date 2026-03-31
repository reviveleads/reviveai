'use client'

import { useState } from 'react'
import { Lead, LeadStats, LeadSequenceSummary } from '@/types'
import StatsBar from '@/components/leads/StatsBar'
import LeadsTable from '@/components/leads/LeadsTable'
import UploadModal from '@/components/leads/UploadModal'
import LeadSlideOver from '@/components/leads/LeadSlideOver'
import { Upload, Zap, CheckCircle2, XCircle, Loader2, ShieldCheck, X, Clock, AlertTriangle } from 'lucide-react'
import SalesAmmoWidget from '@/components/dashboard/SalesAmmoWidget'

interface Props {
  initialLeads: Lead[]
  stats: LeadStats
  initialSequenceMap: Record<string, LeadSequenceSummary>
}

type CampaignState = 'idle' | 'launching' | 'done'

interface CampaignResult {
  total: number
  succeeded: number
  failed: number
  held?: number
  skipped_fresh?: number
  skipped_tcpa?: number
  sequences_active?: number
}

function recomputeStats(leads: Lead[], prevStats: LeadStats): LeadStats {
  return {
    total: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    responded: leads.filter(l => l.status === 'responded').length,
    appointed: leads.filter(l => l.status === 'appointed').length,
    dead: leads.filter(l => l.status === 'dead').length,
    opted_out: leads.filter(l => l.opted_out === true).length,
    sequences_active: prevStats.sequences_active,
  }
}

export default function LeadsDashboard({ initialLeads, stats: initialStats, initialSequenceMap }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [stats, setStats] = useState<LeadStats>(initialStats)
  const [sequenceMap, setSequenceMap] = useState<Record<string, LeadSequenceSummary>>(initialSequenceMap)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [campaignState, setCampaignState] = useState<CampaignState>('idle')
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  const pendingCount = leads.filter(l => l.status === 'pending' && !l.opted_out).length

  function handleLeadsAdded(newLeads: Lead[], skippedFresh = 0) {
    const updated = [...newLeads, ...leads]
    setLeads(updated)
    setStats(recomputeStats(updated, stats))
  }

  async function handleLaunchCampaign() {
    setShowConsentModal(false)
    setConsentChecked(false)
    setCampaignState('launching')
    setCampaignResult(null)

    try {
      const res = await fetch('/api/campaigns/launch', { method: 'POST' })
      const data = await res.json()

      setCampaignResult({
        total: data.total ?? 0,
        succeeded: data.succeeded ?? 0,
        failed: data.failed ?? 0,
        held: data.held ?? 0,
        skipped_fresh: data.skipped_fresh ?? 0,
        skipped_tcpa: data.skipped_tcpa ?? 0,
        sequences_active: data.sequences_active,
      })

      setLeads(prev =>
        prev.map(l => (l.status === 'pending' && !l.opted_out) ? { ...l, status: 'contacted' as const } : l)
      )
      setStats(prev => ({
        ...prev,
        pending: 0,
        contacted: prev.contacted + prev.pending,
        sequences_active: data.sequences_active ?? prev.sequences_active,
      }))

      // Refresh sequence map after launch
      try {
        const seqRes = await fetch('/api/sequences/active')
        const seqData = await seqRes.json()
        setStats(prev => ({ ...prev, sequences_active: seqData.sequences_active ?? prev.sequences_active }))
      } catch { /* non-blocking */ }

    } catch {
      setCampaignResult({ total: 0, succeeded: 0, failed: pendingCount })
    } finally {
      setCampaignState('done')
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and reactivate dormant leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Upload Leads
          </button>
          <button
            onClick={() => { setConsentChecked(false); setShowConsentModal(true) }}
            disabled={campaignState === 'launching' || pendingCount === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {campaignState === 'launching' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Launching...</>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Launch Campaign
                {pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold">
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Campaign result banner */}
      {campaignState === 'done' && campaignResult && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl border px-5 py-4 ${
          campaignResult.failed === 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
        }`}>
          {campaignResult.failed === 0
            ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className={`text-sm font-semibold ${campaignResult.failed === 0 ? 'text-green-800' : 'text-amber-800'}`}>
              Campaign launched — {campaignResult.succeeded} of {campaignResult.total} messages sent
            </p>
            {(campaignResult.held ?? 0) > 0 && (
              <p className="text-sm text-blue-600 mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {campaignResult.held} message{campaignResult.held !== 1 ? 's' : ''} held — outside quiet hours. Will send at 9am ET.
              </p>
            )}
            {(campaignResult.skipped_fresh ?? 0) > 0 && (
              <p className="text-sm text-amber-700 mt-0.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {campaignResult.skipped_fresh} lead{campaignResult.skipped_fresh !== 1 ? 's' : ''} skipped — last contact less than 30 days ago (still in CRM pipeline)
              </p>
            )}
            {(campaignResult.skipped_tcpa ?? 0) > 0 && (
              <p className="text-sm text-red-600 mt-0.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {campaignResult.skipped_tcpa} lead{campaignResult.skipped_tcpa !== 1 ? 's' : ''} skipped — older than 18 months (TCPA limit)
              </p>
            )}
            {campaignResult.failed > 0 && (
              <p className="text-sm text-amber-600 mt-0.5">
                {campaignResult.failed} failed — check Twilio credentials and phone numbers
              </p>
            )}
          </div>
          <button onClick={() => { setCampaignState('idle'); setCampaignResult(null) }}
            className="text-xs text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Main content + intel sidebar */}
      <div className="mt-6 flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <LeadsTable leads={leads} sequenceMap={sequenceMap} onRowClick={lead => setSelectedLeadId(lead.id)} />
        </div>
        <div className="w-80 flex-shrink-0">
          <SalesAmmoWidget />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onLeadsAdded={handleLeadsAdded} />

      {/* Lead slide-over */}
      <LeadSlideOver
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={updated => {
          setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
        }}
      />

      {/* TCPA Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConsentModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">TCPA Compliance Confirmation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Required before sending any campaign</p>
                </div>
              </div>
              <button onClick={() => setShowConsentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-5 text-sm text-amber-800">
              You are about to send messages to <strong>{pendingCount} lead{pendingCount !== 1 ? 's' : ''}</strong>.
              Leads contacted less than 30 days ago will be skipped automatically.
              Messages will only be sent during quiet hours (9am–8pm ET).
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I confirm that all leads in this campaign provided <strong>express written consent</strong> to
                be contacted by my dealership via SMS and email, as required by the TCPA.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchCampaign}
                disabled={!consentChecked}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="h-4 w-4" />
                Launch {pendingCount} Lead{pendingCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
