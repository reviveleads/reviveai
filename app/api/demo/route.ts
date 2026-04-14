import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, dealership, email, phone, dormant_leads } = await req.json()

    if (!name || !dealership || !email) {
      return NextResponse.json({ error: 'Name, dealership, and email are required.' }, { status: 400 })
    }

    await Promise.all([
      // Notification to Joe
      resend.emails.send({
        from: 'Revive AI <onboarding@resend.dev>',
        to: ['joe@reviveleads.net'],
        subject: `New Demo Request — ${dealership}`,
        text: [
          `Name: ${name}`,
          `Dealership: ${dealership}`,
          `Phone: ${phone || '—'}`,
          `Email: ${email}`,
          dormant_leads ? `Dormant leads: ${dormant_leads}` : '',
        ].filter(Boolean).join('\n'),
      }),

      // Confirmation to submitter
      resend.emails.send({
        from: 'Revive AI <onboarding@resend.dev>',
        to: [email],
        subject: 'We got your request — Revive AI',
        text: `Hey ${name.split(' ')[0]}, got your info. I'll be in touch within 24 hours.\n\n- Joe, Revive AI | joe@reviveleads.net`,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[demo] error:', err?.message)
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
  }
}
