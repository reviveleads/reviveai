import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateFirstTouchSMS } from '@/lib/ai/conversation'
import { buildAIContext, AIMessageContext } from '@/lib/intel/vehicleSearch'
import { extractBrand } from '@/lib/intel/intentClassifier'

const DEMO_DEALERSHIP_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  const {
    lead_id,
    article_headline,
    article_url,
    article_summary,
    article_type = 'news',
    is_competitor = false,
  } = await request.json()

  if (!lead_id || !article_headline || !article_url) {
    return NextResponse.json({ error: 'lead_id, article_headline, article_url required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const [{ data: lead }, { data: settings }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', lead_id).single(),
    supabase.from('dealership_settings').select('salesperson_name').eq('dealership_id', DEMO_DEALERSHIP_ID).single(),
  ])

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const salespersonName = settings?.salesperson_name || 'Jake'
  const vehicle = lead.vehicle_interest ?? 'the vehicle'
  const cleanUrl = (article_url as string).replace(/#_b=[^&]*/g, '')
  const brand = extractBrand(vehicle) ?? vehicle

  // Build base context (incentives, trade-in, mileage), strip any existing news lines
  const baseContext = await buildAIContext(supabase, lead, DEMO_DEALERSHIP_ID, salespersonName)

  const contextLines = baseContext.contextBlock
    .split('\n')
    .filter(
      (l) =>
        !l.startsWith('Recent ') &&
        !l.startsWith('Article URL:') &&
        !l.startsWith('If mentioning this') &&
        !l.startsWith('No current') &&
        !l.startsWith('IMPORTANT:')
    )

  // Inject article with tone directive based on article_type and whether this is a competitor lead
  contextLines.push(`Article the dealer selected: "${article_headline}"`)
  if (article_summary) contextLines.push(`Article summary: ${article_summary}`)
  contextLines.push(`Article URL: ${cleanUrl}`)

  let directive: string
  if (is_competitor) {
    const articleBrand = extractBrand(article_headline) ?? brand
    directive =
      `This lead is interested in the ${vehicle} (not a ${articleBrand} vehicle). ` +
      `The article is about a ${articleBrand} deal. Acknowledge their vehicle first, then mention the ${articleBrand} deal as a comparison worth knowing about. ` +
      `Tone example: "I know you were looking at the ${vehicle} but ${articleBrand} just dropped a pretty aggressive deal — might be worth a quick look for comparison."`
  } else if (article_type === 'deal') {
    directive =
      `Lead with the specific deal detail from the article headline. Create natural urgency around expiry if a date is mentioned. Keep it short and specific. ` +
      `Tone example: "Cadillac has 0% for 60 months on the XT6 right now through March 31. Figured you'd want to know since you were looking at one."`
  } else if (article_type === 'new_model') {
    directive =
      `Lead with curiosity about the new model, no pressure. ` +
      `If the article is about a different model than the ${vehicle} they inquired about, bridge it naturally: mention their vehicle and relate it to what ${brand} is doing. ` +
      `Tone example: "${brand} just dropped the new [model] — figured you'd want to see what the brand is up to alongside the ${vehicle} you were checking out."`
  } else {
    directive =
      `Reference this article naturally and include the URL inline. Casual, like sharing something interesting with a friend.`
  }

  contextLines.push(`IMPORTANT: ${directive}`)
  contextLines.push(`Must include the article URL inline in the message.`)

  const enhancedContext: AIMessageContext = {
    ...baseContext,
    contextBlock: contextLines.join('\n'),
    newsArticle: { headline: article_headline, url: cleanUrl },
  }

  const leadContext = {
    trade_in_make: lead.trade_in_make ?? null,
    trade_in_model: lead.trade_in_model ?? null,
    trade_in_year: lead.trade_in_year ?? null,
    trade_in_mileage: lead.trade_in_mileage ?? null,
    budget_notes: lead.budget_notes ?? null,
    created_at: lead.created_at,
  }

  const message = await generateFirstTouchSMS(
    lead.first_name,
    vehicle,
    salespersonName,
    null,
    leadContext,
    enhancedContext
  )

  return NextResponse.json({ message })
}
