import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, dealership, email, phone, dormant_leads } = await req.json()

    if (!name || !dealership || !email) {
      return NextResponse.json({ error: 'Name, dealership, and email are required.' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'ReviveAI Demo Requests <onboarding@resend.dev>',
      to: ['hello@reviveleads.net'],
      subject: `Demo Request — ${dealership}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
          <h2 style="margin: 0 0 24px; font-size: 20px; color: #111;">New Demo Request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Dealership</td><td style="padding: 8px 0; font-weight: 600;">${dealership}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;">${phone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Dormant leads</td><td style="padding: 8px 0;">${dormant_leads || '—'}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[demo] error:', err?.message)
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
  }
}
