import Anthropic from '@anthropic-ai/sdk'
import { Conversation } from '@/types'
import { buildEmailUnsubscribeFooterHtml } from '@/lib/compliance/optOut'
import { AIMessageContext } from '@/lib/intel/vehicleSearch'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are [salesperson name], a real car salesperson texting a customer from your personal cell phone. This is not a marketing message. This is not automated. You remembered this customer and decided to text them yourself.

You are a real person. Act like it.

HOW TO WRITE:
- Text like a real human on their phone. Short. Casual. Natural contractions.
- First touch: 2 sentences max. No more. Ever.
- Follow-ups: conversational. Respond directly to what they said, like a real exchange.
- Sign off with just your first name. Nothing else. No dashes, no titles, no company name.
- Under 160 characters for SMS including your name.
- Always reference something specific — their exact vehicle, how long it's been, their trade-in situation. Never be generic.
- If you have a real news article link, frame it like a friend sharing something: "saw this, figured you'd want to see it". URL goes inline in the sentence.
- If there's no real hook, just be human. A genuine low-pressure message is better than a fake one.

NEVER DO ANY OF THESE:
- No exclamation points. Not one. Not ever.
- No emojis unless the customer used one first.
- Never say: "I wanted to reach out", "just checking in", "hope this finds you well", "don't hesitate", "excited to offer", "great news", "amazing deal", "limited time", "act now", "as per", "touch base", "circle back", "following up", "feel free to", "valued customer", "our team", "moving forward", "at your earliest convenience"
- Never mention AI, automation, bots, or software.
- Never fabricate urgency, deals, or promotions that aren't real. If you don't have a real incentive to reference, don't invent one.
- Never use a seasonal hook unless the background context confirms it's currently relevant based on today's date.
- Never sound like a mass text or a company communication. This is person-to-person.

TONE BY SITUATION:
- No response yet: curious and low-key, never desperate. One shot, not a follow-up barrage.
- They respond positively: match their energy, move naturally toward next step.
- They're hesitant: be human first. No pitch. Just acknowledge it.
- They say not interested: respect it, leave the door open, one gracious exit. Done.
- They ask something specific: answer like a knowledgeable friend. Direct and honest.

EXAMPLES:
Good first touch: "Hey Sarah, saw you were looking at the Silverado LTZ a few months back. Still thinking about it?"
Good first touch with hook: "Hey Mike, that Sierra you were looking at has $4,500 cash back right now. Worth knowing if you're still on the fence."
Good follow-up: "Yeah the LTZ is a solid truck. You still in the same spot on budget or has anything changed?"
Good news share: "Hey David, saw this dropped today on the '26 F-150 — big refresh from what you were looking at. [url] Figured you'd want to see it."
Bad: "Hi Sarah! I wanted to reach out because we have some amazing deals on the Silverado LTZ that I think you'll love!"
Bad: "Just following up on your recent inquiry. We have great deals this month. Don't hesitate to reach out!"
Bad: "That's great to hear! I'd be happy to help you find the perfect financing option that meets your needs!"`

export async function generateFirstTouchSMS(
  firstName: string,
  vehicleInterest: string,
  salespersonName = 'Jake',
  vehicleIntel?: string | null,
  lead?: { trade_in_make?: string | null; trade_in_model?: string | null; trade_in_year?: number | null; trade_in_mileage?: number | null; budget_notes?: string | null; created_at?: string },
  aiContext?: AIMessageContext
): Promise<string> {
  const contextBlock = aiContext?.contextBlock ?? buildFallbackContext(firstName, vehicleInterest, salespersonName, vehicleIntel, lead)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `BACKGROUND CONTEXT (use 1-2 signals, never all):\n${contextBlock}\n\nWrite the first ever text from ${salespersonName} to ${firstName}.\n\nRequirements:\n- 2-3 sentences max. Hard limit.\n- Under 160 characters including sign-off.\n- Sign as "- ${salespersonName}"\n- No quotes around message. Just the text.`,
    }],
  })

  return (response.content[0].type === 'text' ? response.content[0].text : '').trim()
}

export async function generateFollowUpEmail(
  firstName: string,
  vehicleInterest: string,
  leadId = '',
  salespersonName = 'Jake',
  dealershipName = 'the dealership',
  vehicleIntel?: string | null,
  lead?: { trade_in_make?: string | null; trade_in_model?: string | null; trade_in_year?: number | null; trade_in_mileage?: number | null; budget_notes?: string | null; created_at?: string },
  aiContext?: AIMessageContext
): Promise<{ subject: string; html: string; text: string }> {
  const contextBlock = aiContext?.contextBlock ?? buildFallbackContext(firstName, vehicleInterest, salespersonName, vehicleIntel, lead)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `BACKGROUND CONTEXT (use 1-2 signals naturally):\n${contextBlock}\n\nWrite a follow-up email from ${salespersonName} to ${firstName} who didn't respond to an initial text about the ${vehicleInterest}.\n\nFormat:\n- First line: "Subject: [subject]"\n- Blank line\n- Email body\n\nRequirements:\n- Subject: under 50 chars, punchy, real friend energy not marketing\n- Body: 2-3 short paragraphs, conversational, no formal language\n- Weave in 1-2 context signals naturally — don't list them\n- End with a real question or specific offer, not "feel free to contact us"\n- Sign as "${salespersonName} @ ${dealershipName}"`,
    }],
  })

  const raw = (response.content[0].type === 'text' ? response.content[0].text : '').trim()
  const lines = raw.split('\n')
  const subjectLine = lines[0].replace(/^Subject:\s*/i, '').trim()
  const bodyText = lines.slice(2).join('\n').trim()

  const html = buildEmailHtml(subjectLine, bodyText, salespersonName, dealershipName, leadId)
  return { subject: subjectLine, html, text: bodyText }
}

export async function generateConversationReply(
  firstName: string,
  vehicleInterest: string,
  history: Conversation[],
  inboundMessage: string,
  salespersonName = 'Jake',
  vehicleIntel?: string | null,
  lead?: { trade_in_make?: string | null; trade_in_model?: string | null; trade_in_year?: number | null; trade_in_mileage?: number | null; budget_notes?: string | null; created_at?: string },
  aiContext?: AIMessageContext
): Promise<string> {
  const contextBlock = aiContext?.contextBlock ?? buildFallbackContext(firstName, vehicleInterest, salespersonName, vehicleIntel, lead)

  const messages: Anthropic.Messages.MessageParam[] = []
  for (const msg of history) {
    messages.push({ role: msg.direction === 'outbound' ? 'assistant' : 'user', content: msg.message })
  }
  messages.push({ role: 'user', content: inboundMessage })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: `${SYSTEM_PROMPT}\n\nBACKGROUND CONTEXT:\n${contextBlock}\n\nKeep reply under 160 characters. Sign as "- ${salespersonName}".`,
    messages,
  })

  return (response.content[0].type === 'text' ? response.content[0].text : '').trim()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildFallbackContext(
  firstName: string,
  vehicleInterest: string,
  salespersonName: string,
  vehicleIntel?: string | null,
  lead?: { trade_in_make?: string | null; trade_in_model?: string | null; trade_in_year?: number | null; trade_in_mileage?: number | null; budget_notes?: string | null; created_at?: string }
): string {
  const lines = [
    `Salesperson: ${salespersonName}`,
    `Customer: ${firstName}`,
    `Vehicle of interest: ${vehicleInterest}`,
  ]
  if (lead?.trade_in_make && lead.trade_in_model) {
    lines.push(`Trade-in: ${[lead.trade_in_year, lead.trade_in_make, lead.trade_in_model].filter(Boolean).join(' ')}`)
  }
  if (lead?.budget_notes) lines.push(`Budget notes: ${lead.budget_notes}`)
  if (vehicleIntel) lines.push(`Market context: ${vehicleIntel}`)
  return lines.join('\n')
}

function buildEmailHtml(
  subject: string,
  bodyText: string,
  salespersonName: string,
  dealershipName: string,
  leadId: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1d4ed8; padding: 32px 40px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.3px; }
    .header p { color: #bfdbfe; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 36px 40px; color: #374151; line-height: 1.7; font-size: 15px; }
    .body p { margin: 0 0 18px; }
    .cta { display: inline-block; background: #1d4ed8; color: white; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 40px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${dealershipName}</h1>
      <p>A note from ${salespersonName}</p>
    </div>
    <div class="body">
      ${bodyText.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}
      <a href="mailto:sales@dealership.com" class="cta">Reply to This Email</a>
    </div>
    <div class="footer">
      ${leadId ? buildEmailUnsubscribeFooterHtml(leadId) : '<p>To unsubscribe, reply STOP to any SMS from our dealership.</p>'}
    </div>
  </div>
</body>
</html>`
}
