import { Resend } from 'resend'

function getClient() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<string> {
  const resend = getClient()
  const { data, error } = await resend.emails.send({
    from: 'ReviveAI Dealership <noreply@reviveai.com>',
    to,
    subject,
    html,
    text,
  })

  if (error) throw new Error(error.message)
  return data?.id ?? ''
}
