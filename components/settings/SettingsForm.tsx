'use client'

import { Component, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  Loader2, CheckCircle2, Save, Building2, Phone, User, Mail,
  AlertTriangle, Tag, Plus, Trash2, Car, Calendar,
  Link, Eye, EyeOff, Copy, RefreshCw, CheckCheck, Zap,
  TrendingUp, Ban, Upload, X,
} from 'lucide-react'
import { DealerIncentive, DoNotContactEntry } from '@/types'

class SectionErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[Settings/${this.props.label}] render error:`, err, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-sm text-red-700">
          <p className="font-medium">Could not load {this.props.label}</p>
          <p className="text-xs text-red-500 mt-1">Reload the page to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}

interface DealershipSettings {
  dealership_name: string
  salesperson_name: string
  salesperson_phone: string
  salesperson_email: string
  brands_we_sell: string
  avg_deal_value: string
  avg_lead_cost: string
  monthly_plan_cost: string
  sales_manager_email: string
  gm_email: string
  additional_emails: string
}

const DEFAULT: DealershipSettings = {
  dealership_name: '',
  salesperson_name: '',
  salesperson_phone: '',
  salesperson_email: '',
  brands_we_sell: '',
  avg_deal_value: '2500',
  avg_lead_cost: '400',
  monthly_plan_cost: '1500',
  sales_manager_email: '',
  gm_email: '',
  additional_emails: '',
}

const ALL_BRANDS = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevy',
  'Chrysler', 'Dodge', 'Ford', 'GMC', 'Genesis', 'Honda', 'Hyundai',
  'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln',
  'Mazda', 'Mercedes', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Rivian',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
]

export default function SettingsForm() {
  const [fields, setFields] = useState<DealershipSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (!data || typeof data !== 'object' || data.error) return
        setFields({
          dealership_name: data.dealership_name ?? '',
          salesperson_name: data.salesperson_name ?? '',
          salesperson_phone: data.salesperson_phone ?? '',
          salesperson_email: data.salesperson_email ?? '',
          brands_we_sell: data.brands_we_sell ?? '',
          avg_deal_value: String(data.avg_deal_value ?? 2500),
          avg_lead_cost: String(data.avg_lead_cost ?? 400),
          monthly_plan_cost: String(data.monthly_plan_cost ?? 1500),
          sales_manager_email: data.sales_manager_email ?? '',
          gm_email: data.gm_email ?? '',
          additional_emails: data.additional_emails ?? '',
        })
      })
      .catch(() => { /* network failure — keep defaults */ })
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof DealershipSettings>(key: K, value: DealershipSettings[K]) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function toggleBrand(brand: string) {
    const current = fields.brands_we_sell
      ? fields.brands_we_sell.split(',').map(b => b.trim()).filter(Boolean)
      : []
    const updated = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand]
    set('brands_we_sell', updated.join(','))
  }

  const selectedBrands = fields.brands_we_sell
    ? fields.brands_we_sell.split(',').map(b => b.trim()).filter(Boolean)
    : []

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? `Save failed (${res.status})`)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setSaveError('Network error — could not reach the server')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your dealership and AI messaging defaults</p>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        {/* Dealership info */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Dealership Info</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <FormField label="Dealership Name" hint="Used in AI messages and email sign-offs" icon={<Building2 className="h-4 w-4 text-gray-400" />}>
              <input type="text" value={fields.dealership_name} onChange={e => set('dealership_name', e.target.value)} placeholder="e.g. Downtown Auto Group" className="field-input" />
            </FormField>
          </div>
        </section>

        {/* Brands we sell */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Brands We Sell</h2>
            <span className="text-xs text-gray-400 ml-1">Used to filter news feed</span>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {ALL_BRANDS.map(brand => {
                const selected = selectedBrands.includes(brand)
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {brand}
                  </button>
                )
              })}
            </div>
            {selectedBrands.length > 0 && (
              <p className="text-xs text-gray-400 mt-3">
                {selectedBrands.length} brand{selectedBrands.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </section>

        {/* AI messaging */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Salesperson</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <FormField label="Name" hint="The AI signs off messages with this name" icon={<User className="h-4 w-4 text-gray-400" />}>
              <input type="text" value={fields.salesperson_name} onChange={e => set('salesperson_name', e.target.value)} placeholder="e.g. Mike" className="field-input" />
            </FormField>
            <FormField label="Phone" hint="Shown in follow-up context; not used for sending" icon={<Phone className="h-4 w-4 text-gray-400" />}>
              <input type="tel" value={fields.salesperson_phone} onChange={e => set('salesperson_phone', e.target.value)} placeholder="e.g. (555) 000-1234" className="field-input" />
            </FormField>
            <FormField label="Email" hint="Used as reply-to for outbound emails" icon={<Mail className="h-4 w-4 text-gray-400" />}>
              <input type="email" value={fields.salesperson_email} onChange={e => set('salesperson_email', e.target.value)} placeholder="mike@yourdealership.com" className="field-input" />
            </FormField>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Notifications</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <FormField label="Sales Manager Email *" hint="Receives instant hot lead alerts when a dead lead responds" icon={<Mail className="h-4 w-4 text-gray-400" />}>
              <input type="email" value={fields.sales_manager_email} onChange={e => set('sales_manager_email', e.target.value)} placeholder="salesmanager@dealership.com" className="field-input" />
            </FormField>
            <FormField label="GM / Owner Email" hint="Receives the monthly ROI report. Falls back to Sales Manager Email if blank." icon={<Mail className="h-4 w-4 text-gray-400" />}>
              <input type="email" value={fields.gm_email} onChange={e => set('gm_email', e.target.value)} placeholder="gm@dealership.com" className="field-input" />
            </FormField>
            <FormField label="Additional Notification Emails" hint="Up to 3 extra emails that also receive hot lead alerts, comma-separated" icon={<Mail className="h-4 w-4 text-gray-400" />}>
              <input type="text" value={fields.additional_emails} onChange={e => set('additional_emails', e.target.value)} placeholder="email1@dealer.com, email2@dealer.com" className="field-input" />
            </FormField>
          </div>
        </section>

        {/* Business Metrics */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Business Metrics</h2>
            <span className="text-xs text-gray-400 ml-1">Powers ROI calculations</span>
          </div>
          <div className="px-6 py-5 space-y-4">
            <FormField label="Average Deal Gross" hint="Front-end gross per deal — used to estimate revenue recovered" icon={<span className="text-sm text-gray-400">$</span>}>
              <input type="number" min="0" step="100" value={fields.avg_deal_value} onChange={e => set('avg_deal_value', e.target.value)} placeholder="2500" className="field-input" />
            </FormField>
            <FormField label="Average Cost Per Lead" hint="What you paid per lead originally — used to calculate lead investment" icon={<span className="text-sm text-gray-400">$</span>}>
              <input type="number" min="0" step="50" value={fields.avg_lead_cost} onChange={e => set('avg_lead_cost', e.target.value)} placeholder="400" className="field-input" />
            </FormField>
            <FormField label="Monthly Plan Cost" hint="Your ReviveAI subscription cost — used for ROI multiple" icon={<span className="text-sm text-gray-400">$</span>}>
              <input type="number" min="0" step="100" value={fields.monthly_plan_cost} onChange={e => set('monthly_plan_cost', e.target.value)} placeholder="1500" className="field-input" />
            </FormField>
          </div>
        </section>

        {/* Save */}
        <div className="space-y-3">
          {saveError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span><span className="font-medium">Settings did not save.</span> {saveError}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Current Deals — separate section, own API */}
      <div className="mt-8">
        <SectionErrorBoundary label="Current Deals">
          <IncentivesSection />
        </SectionErrorBoundary>
      </div>

      {/* Integrations — webhook key, own API */}
      <div className="mt-8">
        <SectionErrorBoundary label="Integrations">
          <IntegrationsSection />
        </SectionErrorBoundary>
      </div>

      {/* Do Not Contact */}
      <div className="mt-8">
        <SectionErrorBoundary label="Do Not Contact">
          <DoNotContactSection />
        </SectionErrorBoundary>
      </div>

      {/* Monthly Report */}
      <div className="mt-8">
        <SectionErrorBoundary label="Monthly Report">
          <MonthlyReportSection />
        </SectionErrorBoundary>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 14px;
          color: #111827;
          outline: none;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px #eff6ff;
        }
        .field-input::placeholder { color: #9ca3af; }
      `}</style>
    </div>
  )
}

// ── Incentives section ────────────────────────────────────────────────────────

function IncentivesSection() {
  const [incentives, setIncentives] = useState<DealerIncentive[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vehicle_model: '', deal_description: '', expires_at: '', deal_scope: 'all_new' as 'all_new' | 'all_used' | 'specific' })

  useEffect(() => { loadIncentives() }, [])

  async function loadIncentives() {
    setLoading(true)
    try {
      const res = await fetch('/api/incentives')
      const data = await res.json()
      setIncentives(Array.isArray(data) ? data : [])
    } catch {
      setIncentives([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.deal_description.trim()) return
    if (form.deal_scope === 'specific' && !form.vehicle_model.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch('/api/incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error ?? `Save failed (${res.status})${data.code ? ` — code: ${data.code}` : ''}${data.details ? ` — ${data.details}` : ''}`)
        return
      }
      setForm({ vehicle_model: '', deal_description: '', expires_at: '', deal_scope: 'all_new' })
      setShowForm(false)
      setAddError(null)
      await loadIncentives()
    } catch (err: any) {
      setAddError('Network error — ' + err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/incentives/${id}`, { method: 'DELETE' })
    setIncentives(prev => prev.filter(i => i.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const active = incentives.filter(i => !i.expires_at || i.expires_at >= today)
  const expired = incentives.filter(i => i.expires_at && i.expires_at < today)

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Current Deals</h2>
          {active.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {active.length} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Deal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-gray-100 bg-blue-50 space-y-3">
          {/* Scope selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Applies to</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'all_new', label: 'All new vehicles' },
                { value: 'all_used', label: 'All used vehicles' },
                { value: 'specific', label: 'Specific vehicle' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, deal_scope: opt.value, vehicle_model: '' }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    form.deal_scope === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle model — only when Specific */}
          {form.deal_scope === 'specific' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Model</label>
              <input
                type="text"
                value={form.vehicle_model}
                onChange={e => { const v = e.target.value; setForm(f => ({ ...f, vehicle_model: v })) }}
                placeholder="e.g. 2024 GMC Sierra"
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Deal description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deal Description</label>
            <input
              type="text"
              value={form.deal_description}
              onChange={e => { const v = e.target.value; setForm(f => ({ ...f, deal_description: v })) }}
              placeholder="e.g. $4,500 cash back through end of month"
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => { const v = e.target.value; setForm(f => ({ ...f, expires_at: v })) }}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: form.expires_at ? '#111827' : '#9ca3af', background: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {addError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-500" />
              {addError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save Deal
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setAddError(null) }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : active.length === 0 && expired.length === 0 ? (
          <div className="px-6 py-6 text-center text-sm text-gray-400">
            No deals yet. Add one to inject it into AI messages for matching vehicles.
          </div>
        ) : (
          <>
            {active.map(inc => (
              <DealRow key={inc.id} incentive={inc} onDelete={() => handleDelete(inc.id)} expired={false} />
            ))}
            {expired.map(inc => (
              <DealRow key={inc.id} incentive={inc} onDelete={() => handleDelete(inc.id)} expired />
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 13px;
          color: #111827;
          outline: none;
          background: white;
        }
        .field-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px #eff6ff; }
        .field-input::placeholder { color: #9ca3af; }
      `}</style>
    </section>
  )
}

const SCOPE_LABELS: Record<string, string> = {
  all_new: 'All new vehicles',
  all_used: 'All used vehicles',
  specific: '',
}

const SCOPE_COLORS: Record<string, string> = {
  all_new: 'bg-blue-50 text-blue-700 ring-blue-200',
  all_used: 'bg-purple-50 text-purple-700 ring-purple-200',
  specific: '',
}

function DealRow({ incentive, onDelete, expired }: {
  incentive: DealerIncentive
  onDelete: () => void
  expired: boolean
}) {
  const scope = incentive.deal_scope ?? 'specific'
  const scopeLabel = SCOPE_LABELS[scope]
  const scopeColor = SCOPE_COLORS[scope]

  const title = scope === 'specific' && incentive.vehicle_model
    ? incentive.vehicle_model
    : scopeLabel || 'All vehicles'

  return (
    <div className={`flex items-start gap-3 px-6 py-3 ${expired ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
          {scope !== 'specific' && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${scopeColor}`}>
              {scopeLabel}
            </span>
          )}
          {expired && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">expired</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{incentive.deal_description}</p>
        {incentive.expires_at && (
          <p className={`text-xs mt-0.5 flex items-center gap-1 ${expired ? 'text-red-400' : 'text-amber-600'}`}>
            <Calendar className="h-3 w-3" />
            {expired ? 'Expired ' : 'Expires '}{new Date(incentive.expires_at + 'T12:00:00').toLocaleDateString()}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function FormField({ label, hint, icon, children }: {
  label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Integrations section ──────────────────────────────────────────────────────

function IntegrationsSection() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  // Initialise to a relative URL to match SSR output, then set the full URL
  // in useEffect to avoid a hydration mismatch that crashes the page on mobile.
  const [webhookUrl, setWebhookUrl] = useState('/api/webhooks/leads')

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/leads`)
    fetch('/api/settings/webhook')
      .then(r => r.json())
      .then(d => { setApiKey(d.webhook_api_key) })
      .finally(() => setLoading(false))
  }, [])

  async function handleRegenerate() {
    setRegenerating(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/settings/webhook', { method: 'POST' })
      const d = await res.json()
      if (res.ok) setApiKey(d.webhook_api_key)
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopy(type: 'url' | 'key') {
    const text = type === 'url' ? webhookUrl : (apiKey ?? '')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for mobile browsers where clipboard API is unavailable
      const el = document.createElement('textarea')
      el.value = text
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleTest() {
    if (!apiKey) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/webhooks/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          first_name: 'Test',
          last_name: 'Lead',
          phone: '0000000000',
          vehicle_interest: 'Test Vehicle',
          source: 'webhook_test',
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, msg: d.duplicate ? 'Connection OK (duplicate lead detected)' : 'Connection OK — test lead received' })
      } else {
        setTestResult({ ok: false, msg: d.error ?? `Error ${res.status}` })
      }
    } catch {
      setTestResult({ ok: false, msg: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Zap className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700">Integrations</h2>
        <span className="text-xs text-gray-400 ml-1">Receive leads from LeadsBridge, Zapier, and ADF sources</span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Webhook URL */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Link className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Webhook URL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 truncate">
              {webhookUrl}
            </div>
            <button
              type="button"
              onClick={() => handleCopy('url')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied === 'url' ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'url' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Accepts POST requests in JSON or ADF/XML format</p>
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-gray-700">API Key</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-mono">x-api-key</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
            </div>
          ) : apiKey ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 truncate">
                  {showKey ? apiKey : '•'.repeat(32)}
                </div>
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
                  title={showKey ? 'Hide key' : 'Reveal key'}
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('key')}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {copied === 'key' ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'key' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No API key yet — generate one to start receiving leads.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {apiKey ? 'Regenerate Key' : 'Generate Key'}
          </button>

          {apiKey && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Test Webhook
            </button>
          )}
        </div>

        {testResult && (
          <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            testResult.ok
              ? 'bg-green-50 border border-green-100 text-green-700'
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            {testResult.ok
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
            {testResult.msg}
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Security notice</p>
          <p className="text-xs text-amber-700">
            Treat your API key like a password. Regenerating will immediately invalidate the old key — update any connected services before regenerating.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Do Not Contact section ────────────────────────────────────────────────────

function DoNotContactSection() {
  const [entries, setEntries] = useState<DoNotContactEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phone: '', email: '', reason: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/do-not-contact')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.phone.trim() && !form.email.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch('/api/do-not-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error); return }
      setForm({ phone: '', email: '', reason: '' })
      setShowForm(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/do-not-contact/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').slice(1) // skip header
      const batch = lines
        .map(l => l.trim().split(','))
        .filter(cols => cols[0]?.trim() || cols[1]?.trim())
        .map(cols => ({ phone: cols[0]?.trim() || undefined, email: cols[1]?.trim() || undefined, reason: cols[2]?.trim() || 'CSV import' }))
      if (batch.length === 0) return
      await fetch('/api/do-not-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      await load()
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Do Not Contact</h2>
          {entries.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {entries.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="px-6 py-4 border-b border-gray-100 bg-red-50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => { const v = e.target.value; setForm(f => ({ ...f, phone: v })) }}
                placeholder="e.g. +15551234567"
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { const v = e.target.value; setForm(f => ({ ...f, email: v })) }}
                placeholder="e.g. noreply@example.com"
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.reason}
              onChange={e => { const v = e.target.value; setForm(f => ({ ...f, reason: v })) }}
              placeholder="e.g. Requested removal, litigation hold"
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', background: 'white', outline: 'none', boxSizing: 'border-box' as const }}
            />
          </div>
          {addError && (
            <p className="text-xs text-red-600">{addError}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={adding}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add to List
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-400">CSV format: phone,email,reason (one per line, header row skipped)</p>
        </form>
      )}

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-6 text-center text-sm text-gray-400">No entries. Leads matching this list will never be contacted.</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 px-6 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.phone && <span className="text-sm text-gray-700 font-mono">{entry.phone}</span>}
                  {entry.email && <span className="text-sm text-gray-700">{entry.email}</span>}
                </div>
                {entry.reason && <p className="text-xs text-gray-400 mt-0.5">{entry.reason}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(entry.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

// ── Monthly Report section ────────────────────────────────────────────────────

function MonthlyReportSection() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleSendTest() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/cron/monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-test-report': '1' },
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: `Report sent to ${data.to}` })
      } else {
        setResult({ ok: false, msg: data.error ?? `Error ${res.status}` })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700">Monthly GM Report</h2>
        <span className="text-xs text-gray-400 ml-1">Sent automatically on the 1st of each month</span>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-gray-600">
          An HTML email report is sent to your salesperson email on the 1st of every month with last month's reactivation results, appointments booked, and estimated revenue recovered.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSendTest}
            disabled={sending}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Send Test Report
          </button>
        </div>
        {result && (
          <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
            {result.msg}
          </div>
        )}
      </div>
    </section>
  )
}
