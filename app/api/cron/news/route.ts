import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { scrapeAllFeeds } from '@/lib/intel/rssScraper'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get dealership's active brands
  const { data: settings } = await supabase
    .from('dealership_settings')
    .select('brands_we_sell')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .single()

  const brandsWeSell = settings?.brands_we_sell
    ? settings.brands_we_sell.split(',').map((b: string) => b.trim()).filter(Boolean)
    : []

  if (brandsWeSell.length === 0) {
    return NextResponse.json({ message: 'No brands configured — set brands in Settings first', inserted: 0 })
  }

  const articles = await scrapeAllFeeds(brandsWeSell)

  if (articles.length === 0) {
    return NextResponse.json({ message: 'No relevant articles found', inserted: 0 })
  }

  // Upsert articles, skip duplicates by URL
  const rows = articles.map(a => ({
    dealership_id: DEMO_DEALERSHIP_ID,
    headline: a.headline,
    summary: a.summary,
    url: a.url,
    brand: a.brand,
    image_url: a.image_url,
    source: a.source,
    published_at: a.published_at,
    article_type: a.article_type,
  }))

  // Insert in batches of 50 to stay within limits
  let inserted = 0
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const { error } = await supabase
      .from('vehicle_news')
      .upsert(batch, { onConflict: 'url', ignoreDuplicates: true })
    if (!error) inserted += batch.length
    else console.error('[cron/news] upsert error:', error.message)
  }

  // Delete articles older than 30 days
  await supabase
    .from('vehicle_news')
    .delete()
    .lt('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({
    scraped: articles.length,
    inserted,
    brands: brandsWeSell,
  })
}

// GET — return recent news grouped by brand
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vehicle_news')
    .select('*')
    .eq('dealership_id', DEMO_DEALERSHIP_ID)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
