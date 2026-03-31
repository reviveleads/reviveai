const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END']
const OPT_IN_KEYWORDS = ['START', 'UNSTOP', 'YES']

export function isOptOutKeyword(message: string): boolean {
  const normalized = message.trim().toUpperCase()
  return OPT_OUT_KEYWORDS.includes(normalized)
}

export function isOptInKeyword(message: string): boolean {
  const normalized = message.trim().toUpperCase()
  return OPT_IN_KEYWORDS.includes(normalized)
}

export const TCPA_SMS_FOOTER = '\n\nReply STOP to opt out.'

export function addSMSFooter(message: string): string {
  return `${message}${TCPA_SMS_FOOTER}`
}

export function buildUnsubscribeUrl(leadId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const token = Buffer.from(leadId).toString('base64url')
  return `${baseUrl}/api/unsubscribe?id=${leadId}&token=${token}`
}

export function buildEmailUnsubscribeFooterHtml(leadId: string): string {
  const url = buildUnsubscribeUrl(leadId)
  return `
    <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 20px; font-size: 11px; color: #9ca3af; line-height: 1.6;">
      <p>You are receiving this because you previously expressed interest in a vehicle at our dealership.</p>
      <p>To stop receiving messages, <a href="${url}" style="color: #6b7280; text-decoration: underline;">click here to unsubscribe</a> or reply STOP to any SMS.</p>
    </div>`
}
