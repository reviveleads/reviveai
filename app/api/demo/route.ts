import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, dealership, email, phone, dormant_leads } = await req.json()

    if (!name || !dealership || !email) {
      return NextResponse.json({ error: 'Name, dealership, and email are required.' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]

    await Promise.all([
      // Notification to Joe
      resend.emails.send({
        from: 'Revive AI <joe@reviveleads.net>',
        to: ['joe@reviveleads.net'],
        subject: `New Demo Request — ${dealership}`,
        text: [
          `New demo request from ${name} at ${dealership}.`,
          '',
          `Name: ${name}`,
          `Dealership: ${dealership}`,
          `Phone: ${phone || '—'}`,
          `Email: ${email}`,
          dormant_leads ? `Dormant leads: ${dormant_leads}` : '',
        ].filter(Boolean).join('\n'),
      }),

      // Confirmation to submitter
      resend.emails.send({
        from: 'Joe at Revive AI <joe@reviveleads.net>',
        to: [email],
        subject: 'Got it — talk soon',
        text: `Hey ${firstName},\n\nGot your request for ${dealership}. I'll reach out within 24 hours to set up a quick demo.\n\nIn the meantime you can check out the app at app.reviveleads.net.\n\n- Joe\nRevive AI\njoe@reviveleads.net\n(984) 254-7322`,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[demo] error:', err?.message)
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
  }
}
