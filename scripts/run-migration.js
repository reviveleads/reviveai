#!/usr/bin/env node
/**
 * Run pending DB migrations against the Supabase project.
 * Usage: node scripts/run-migration.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=')
    if (key) acc[key.trim()] = rest.join('=').trim()
    return acc
  }, {})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!PROJECT_REF) {
  console.error('Could not parse project ref from SUPABASE_URL:', SUPABASE_URL)
  process.exit(1)
}

// SQL to run
const SQL = `
ALTER TABLE dealership_settings
  ADD COLUMN IF NOT EXISTS avg_deal_value integer DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS avg_lead_cost integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS monthly_plan_cost integer DEFAULT 1500;
`

async function run() {
  console.log('Running migration against project:', PROJECT_REF)
  console.log('SQL:', SQL.trim())

  // Try Supabase Management API (requires PAT, not service role key — expected to fail)
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: SQL }),
  })
  const mgmtBody = await mgmtRes.json()

  if (mgmtRes.ok) {
    console.log('✅ Migration applied via Management API')
    return
  }

  console.log('Management API response:', mgmtRes.status, JSON.stringify(mgmtBody))
  console.log('')
  console.log('⚠️  Cannot run migration automatically (Management API requires a Personal Access Token).')
  console.log('')
  console.log('Run this SQL manually in the Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql')
  console.log('')
  console.log(SQL.trim())
  process.exit(1)
}

run().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
