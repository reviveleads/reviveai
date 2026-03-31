'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertTriangle, Copy, CheckCircle2, Printer, FileText, ChevronDown, ChevronUp } from 'lucide-react'

interface Settings {
  dealership_name: string
  legal_business_name: string
  state_of_operation: string
  consent_confirmed: boolean
  dealership_phone: string
}

const CHECKLIST_ITEMS = [
  {
    id: 'consent_language',
    category: 'Website & Forms',
    label: 'Consent language on all lead capture forms',
    detail: 'Every form where you collect phone numbers must have TCPA-compliant opt-in language. See the snippet generator below.',
    critical: true,
  },
  {
    id: 'written_consent',
    category: 'Website & Forms',
    label: 'Express written consent obtained before texting',
    detail: 'TCPA requires "prior express written consent" before sending marketing texts. A checkbox is the most defensible method.',
    critical: true,
  },
  {
    id: 'opt_out_honored',
    category: 'Operations',
    label: 'STOP requests honored immediately',
    detail: 'ReviveAI automatically handles STOP/UNSUBSCRIBE keywords and marks leads as opted out.',
    critical: true,
  },
  {
    id: 'quiet_hours',
    category: 'Operations',
    label: 'Messages sent only between 9am–8pm local time',
    detail: 'ReviveAI enforces 9am–8pm ET quiet hours on all automated messages.',
    critical: true,
  },
  {
    id: 'consent_records',
    category: 'Record Keeping',
    label: 'Consent records stored and retrievable',
    detail: 'Keep records of when and how consent was obtained for each lead. Store IP address, timestamp, and form URL at minimum.',
    critical: true,
  },
  {
    id: 'identity_disclosure',
    category: 'Message Content',
    label: 'Business identity disclosed in first message',
    detail: 'The first text to any lead must identify your business by name.',
    critical: false,
  },
  {
    id: 'opt_out_instructions',
    category: 'Message Content',
    label: '"Reply STOP to opt out" included in messages',
    detail: 'ReviveAI appends TCPA opt-out instructions to every SMS automatically.',
    critical: false,
  },
  {
    id: 'third_party_sharing',
    category: 'Data Practices',
    label: 'No sharing of lead data with third parties',
    detail: 'Ensure your privacy policy reflects actual data handling practices.',
    critical: false,
  },
  {
    id: 'dnd_scrub',
    category: 'Data Practices',
    label: 'Do-Not-Call registry scrub before outreach',
    detail: 'For cold calling, you must scrub against the National DNC Registry. For SMS with consent, TCPA opt-outs are the primary mechanism.',
    critical: false,
  },
  {
    id: 'state_laws',
    category: 'Legal',
    label: 'State-specific laws reviewed (e.g. CCPA in California)',
    detail: 'Several states have laws stricter than federal TCPA. California, Florida, and Texas have notable requirements.',
    critical: false,
  },
]

function generateConsentSnippet(settings: Settings, variant: 'checkbox' | 'paragraph' | 'footer'): string {
  const biz = settings.legal_business_name || settings.dealership_name || '[Your Dealership Name]'
  const phone = settings.dealership_phone || '[your number]'

  if (variant === 'checkbox') {
    return `By checking this box, I consent to receive text messages and emails from ${biz} at the number and email address I provided. Message frequency varies. Message & data rates may apply. Reply STOP to opt out of text messages at any time. Reply HELP for help. View our Privacy Policy and Terms of Service.`
  }

  if (variant === 'paragraph') {
    return `By submitting this form, you agree to receive recurring automated marketing text messages (e.g. cart reminders) at the phone number provided. Consent is not a condition to purchase. Msg & data rates may apply. Msg frequency varies. Reply STOP to cancel. Reply HELP for help. View our Privacy Policy.

This form is operated by ${biz}. Contact us at ${phone} with any questions.`
  }

  if (variant === 'footer') {
    return `You're receiving this message because you previously contacted ${biz} about a vehicle. Reply STOP to opt out of future texts. Msg & data rates may apply.`
  }

  return ''
}

export default function CompliancePage() {
  const [settings, setSettings] = useState<Settings>({
    dealership_name: '',
    legal_business_name: '',
    state_of_operation: '',
    consent_confirmed: false,
    dealership_phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({
          dealership_name: data.dealership_name ?? '',
          legal_business_name: data.legal_business_name ?? '',
          state_of_operation: data.state_of_operation ?? '',
          consent_confirmed: data.consent_confirmed ?? false,
          dealership_phone: data.dealership_phone ?? '',
        })
        if (data.consent_confirmed) {
          setCheckedItems(new Set(['consent_language', 'written_consent']))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function copySnippet(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleExpand(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCheck(id: string) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const criticalItems = CHECKLIST_ITEMS.filter(i => i.critical)
  const standardItems = CHECKLIST_ITEMS.filter(i => !i.critical)
  const criticalDone = criticalItems.filter(i => checkedItems.has(i.id)).length
  const totalDone = CHECKLIST_ITEMS.filter(i => checkedItems.has(i.id)).length

  const snippets = [
    { id: 'checkbox', label: 'Checkbox label (recommended)', variant: 'checkbox' as const },
    { id: 'paragraph', label: 'Form paragraph (longer form)', variant: 'paragraph' as const },
    { id: 'footer', label: 'Follow-up message footer', variant: 'footer' as const },
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="h-6 w-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  const settingsComplete = settings.legal_business_name && settings.state_of_operation

  return (
    <div className="p-8 max-w-3xl print:p-4">
      {/* Header */}
      <div className="mb-8 print:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TCPA Compliance Center</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          Tools and documentation to keep your SMS outreach legally compliant.
        </p>
      </div>

      {/* Settings warning */}
      {!settingsComplete && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Complete your settings first.</strong> Go to{' '}
            <a href="/settings" className="underline">Settings → TCPA Compliance</a>{' '}
            and fill in your Legal Business Name and State of Operation. These are used to generate accurate consent language.
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Compliance Score</h2>
          <span className="text-sm font-medium text-gray-500">{totalDone} / {CHECKLIST_ITEMS.length} items</span>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(totalDone / CHECKLIST_ITEMS.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {Math.round((totalDone / CHECKLIST_ITEMS.length) * 100)}%
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {criticalDone}/{criticalItems.length} critical items complete
            {criticalDone < criticalItems.length && ' — address critical items first'}
          </p>
        </div>
      </div>

      {/* Consent Snippet Generator */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Consent Language Generator</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600">
            Copy these snippets to your website lead forms. They are pre-filled with your business info from Settings.
          </p>
          {snippets.map(({ id, label, variant }) => {
            const text = generateConsentSnippet(settings, variant)
            const isCopied = copiedId === id
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                  <button
                    onClick={() => copySnippet(text, id)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {isCopied ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Copied</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy</>
                    )}
                  </button>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                  {text}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Compliance Checklist */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden print:border-0 print:shadow-none">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">TCPA Compliance Checklist</h2>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Critical items */}
          <div className="px-6 pt-4 pb-2">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Critical — Required by TCPA</p>
            <div className="space-y-1">
              {criticalItems.map(item => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  checked={checkedItems.has(item.id)}
                  expanded={expandedItems.has(item.id)}
                  onToggleCheck={() => toggleCheck(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Standard items */}
          <div className="px-6 pt-4 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Best Practices</p>
            <div className="space-y-1">
              {standardItems.map(item => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  checked={checkedItems.has(item.id)}
                  expanded={expandedItems.has(item.id)}
                  onToggleCheck={() => toggleCheck(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Print footer */}
      <div className="hidden print:block mt-8 text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p>Generated by ReviveAI Compliance Center</p>
        {settings.legal_business_name && <p>Business: {settings.legal_business_name}</p>}
        {settings.state_of_operation && <p>State: {settings.state_of_operation}</p>}
        <p>Date: {new Date().toLocaleDateString()}</p>
        <p className="mt-2 text-gray-300">This checklist is for informational purposes only and does not constitute legal advice. Consult an attorney for TCPA compliance guidance.</p>
      </div>

      {/* Legal disclaimer */}
      <p className="mt-6 text-xs text-gray-400 print:hidden">
        This checklist is for informational purposes only and does not constitute legal advice. Consult a qualified attorney for TCPA compliance guidance specific to your business.
      </p>
    </div>
  )
}

function ChecklistRow({
  item,
  checked,
  expanded,
  onToggleCheck,
  onToggleExpand,
}: {
  item: typeof CHECKLIST_ITEMS[0]
  checked: boolean
  expanded: boolean
  onToggleCheck: () => void
  onToggleExpand: () => void
}) {
  return (
    <div className={`rounded-lg transition-colors ${checked ? 'bg-green-50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0 print:hidden"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${checked ? 'text-green-800 line-through' : 'text-gray-800'} print:no-underline`}>
              {item.label}
            </span>
            <span className="text-xs text-gray-400 hidden print:inline">[{item.category}]</span>
          </div>
        </div>
        <button
          onClick={onToggleExpand}
          className="print:hidden text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {expanded && (
        <div className="px-10 pb-3 text-xs text-gray-600 leading-relaxed print:hidden">
          {item.detail}
        </div>
      )}
    </div>
  )
}
