'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

interface FormState {
  name: string
  dealership: string
  email: string
  phone: string
  dormant_leads: string
}

const EMPTY: FormState = {
  name: '',
  dealership: '',
  email: '',
  phone: '',
  dormant_leads: '',
}

export default function DemoForm() {
  const [fields, setFields] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = fields.phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.')
      return
    }
    if (!fields.name || !fields.dealership || !fields.email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#8B0000]/20 ring-1 ring-[#8B0000]/40">
          <CheckCircle2 className="h-8 w-8 text-[#8B0000]" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">We'll be in touch.</h3>
        <p className="text-gray-400 max-w-sm">
          Thanks, {fields.name.split(' ')[0]}. We'll reach out to {fields.dealership} within one business day to set up your demo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Your Name *</label>
          <input
            type="text"
            value={fields.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Mike Johnson"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Dealership Name *</label>
          <input
            type="text"
            value={fields.dealership}
            onChange={e => set('dealership', e.target.value)}
            placeholder="Downtown Auto Group"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Work Email *</label>
          <input
            type="email"
            value={fields.email}
            onChange={e => set('email', e.target.value)}
            placeholder="mike@yourdealership.com"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Phone *</label>
          <input
            type="tel"
            value={fields.phone}
            onChange={e => { set('phone', e.target.value); setPhoneError(null) }}
            placeholder="(555) 000-1234"
            required
            className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors ${phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#8B0000] focus:ring-[#8B0000]'}`}
          />
          {phoneError && <p className="mt-1.5 text-xs text-red-400">{phoneError}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
          Approx. dormant leads in your CRM
        </label>
        <select
          value={fields.dormant_leads}
          onChange={e => set('dormant_leads', e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-3 text-sm text-white focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
        >
          <option value="" className="text-gray-500">Select a range</option>
          <option value="under-100">Under 100</option>
          <option value="100-500">100 – 500</option>
          <option value="500-1000">500 – 1,000</option>
          <option value="1000-5000">1,000 – 5,000</option>
          <option value="5000+">5,000+</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !fields.name || !fields.dealership || !fields.email || !fields.phone}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-6 py-4 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
        ) : (
          <>Request a Demo <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="text-center text-xs text-gray-600">
        No commitment. We'll respond within one business day.
      </p>
    </form>
  )
}
