import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('id')
  const token = searchParams.get('token')

  if (!leadId || !token) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    })
  }

  // Verify token = base64url(leadId)
  const expectedToken = Buffer.from(leadId).toString('base64url')
  if (token !== expectedToken) {
    return new NextResponse(unsubscribePage('Invalid or expired unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('leads')
    .update({ opted_out: true, status: 'opted_out' })
    .eq('id', leadId)

  if (error) {
    console.error('[unsubscribe]', error.message)
    return new NextResponse(unsubscribePage('Something went wrong. Please reply STOP to any SMS to unsubscribe.', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    })
  }

  return new NextResponse(unsubscribePage('You have been unsubscribed.', true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 12px; padding: 48px 40px; max-width: 420px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${success ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
    ${success ? '<p style="margin-top:12px;font-size:12px;color:#9ca3af;">You will no longer receive marketing messages from this dealership.</p>' : ''}
  </div>
</body>
</html>`
}
