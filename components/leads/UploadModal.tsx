'use client'

import { useState, useRef, useCallback } from 'react'
import { Lead, CSVLeadRow } from '@/types'
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import Papa from 'papaparse'

interface Props {
  open: boolean
  onClose: () => void
  onLeadsAdded: (leads: Lead[], skippedFresh?: number) => void
}

type UploadState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error'

const REQUIRED_COLUMNS = ['first_name', 'last_name', 'phone']
const OPTIONAL_COLUMNS = [
  'email', 'vehicle_interest', 'last_contact_date', 'lead_source', 'notes',
  'trade_in_make', 'trade_in_model', 'trade_in_year', 'trade_in_mileage', 'budget_notes',
]

export default function UploadModal({ open, onClose, onLeadsAdded }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [rows, setRows] = useState<CSVLeadRow[]>([])
  const [skippedFresh, setSkippedFresh] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file')
      return
    }
    setFileName(file.name)
    setState('parsing')
    setError(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parse error: ${results.errors[0].message}`)
          setState('idle')
          return
        }

        const missing = REQUIRED_COLUMNS.filter(
          col => !results.meta.fields?.includes(col)
        )
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(', ')}`)
          setState('idle')
          return
        }

        const allParsed: CSVLeadRow[] = results.data.map(row => ({
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          phone: row.phone || '',
          email: row.email || undefined,
          vehicle_interest: row.vehicle_interest || undefined,
          last_contact_date: row.last_contact_date || undefined,
          lead_source: row.lead_source || undefined,
          notes: row.notes || undefined,
          trade_in_make: row.trade_in_make || undefined,
          trade_in_model: row.trade_in_model || undefined,
          trade_in_year: row.trade_in_year || undefined,
          trade_in_mileage: row.trade_in_mileage || undefined,
          budget_notes: row.budget_notes || undefined,
          consent_source: row.consent_source || undefined,
          consent_date: row.consent_date || undefined,
        }))

        // Filter fresh leads client-side — show warning before upload
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const fresh = allParsed.filter(r => r.last_contact_date && r.last_contact_date >= thirtyDaysAgo)
        const eligible = allParsed.filter(r => !r.last_contact_date || r.last_contact_date < thirtyDaysAgo)

        setSkippedFresh(fresh.length)
        setRows(eligible)
        setState('preview')
      },
      error: (err) => {
        setError(err.message)
        setState('idle')
      }
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUpload = async () => {
    setState('uploading')
    setError(null)

    try {
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: rows }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        setState('error')
        return
      }

      const uploaded = data.count ?? rows.length
      setUploadedCount(uploaded)
      setState('success')
      // Optimistically add leads to UI
      const tempLeads: Lead[] = rows.map((row, i) => ({
        id: `temp-${Date.now()}-${i}`,
        dealership_id: '00000000-0000-0000-0000-000000000001',
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.email || null,
        vehicle_interest: row.vehicle_interest || null,
        last_contact_date: row.last_contact_date || null,
        lead_source: row.lead_source || null,
        lead_source_raw: null,
        status: 'pending' as const,
        opted_out: false,
        consent_source: row.consent_source || null,
        consent_date: row.consent_date || null,
        notes: row.notes || null,
        trade_in_make: row.trade_in_make || null,
        trade_in_model: row.trade_in_model || null,
        trade_in_year: row.trade_in_year ? parseInt(row.trade_in_year) || null : null,
        trade_in_mileage: row.trade_in_mileage ? parseInt(row.trade_in_mileage) || null : null,
        budget_notes: row.budget_notes || null,
        mileage_milestone_triggered: false,
        lead_intent: null,
        lead_tier: null,
        sequence_paused: false,
        ai_paused: false,
        created_at: new Date().toISOString(),
      }))
      onLeadsAdded(tempLeads, skippedFresh)

      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      setError('Network error — please try again')
      setState('error')
    }
  }

  const handleClose = () => {
    setState('idle')
    setRows([])
    setSkippedFresh(0)
    setUploadedCount(0)
    setError(null)
    setFileName(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload Leads</h2>
            <p className="text-sm text-gray-500 mt-0.5">Import leads from a CSV file</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {(state === 'idle' || state === 'parsing') && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-300'}`} />
                <p className="text-sm font-medium text-gray-700">
                  {state === 'parsing' ? 'Parsing file...' : 'Drop your CSV here or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports .csv files</p>
              </div>

              {/* Required columns info */}
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {REQUIRED_COLUMNS.map(col => (
                    <span key={col} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Optional columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONAL_COLUMNS.map(col => (
                    <span key={col} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {state === 'preview' && (
            <div>
              {/* File info */}
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 mb-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{fileName}</p>
                  <p className="text-xs text-blue-600">{rows.length} leads ready to import</p>
                </div>
              </div>

              {/* Fresh leads warning */}
              {skippedFresh > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {skippedFresh} lead{skippedFresh !== 1 ? 's' : ''} skipped
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Last contact date is within the last 30 days — these leads are too recent for reactivation and may still be active in your CRM.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-200">Name</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-200">Phone</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-200">Vehicle</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-500 border-b border-gray-200">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{row.first_name} {row.last_name}</td>
                          <td className="px-3 py-2 text-gray-600">{row.phone}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{row.vehicle_interest || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{row.lead_source || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && (
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    Showing first 50 of {rows.length} leads
                  </div>
                )}
              </div>
            </div>
          )}

          {state === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-700">Uploading {rows.length} leads...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-green-50 p-4 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Upload complete</p>
              <p className="text-sm text-gray-500 mt-1">{uploadedCount} leads added successfully</p>
              {skippedFresh > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {skippedFresh} skipped — contacted within last 30 days
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(state === 'preview' || state === 'error') && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={() => { setState('idle'); setRows([]); setError(null); setFileName(null) }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Choose different file
            </button>
            <button
              onClick={handleUpload}
              disabled={rows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Import {rows.length} Lead{rows.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
