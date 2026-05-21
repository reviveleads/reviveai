import Telnyx from 'telnyx'
import { createAdminClient } from '@/lib/supabase/server'

function getClient() {
  return new Telnyx({ apiKey: process.env.TELNYX_API_KEY! })
}

export async function sendSMS(
  to: string,
  body: string,
  dealershipId: string
): Promise<string> {
  if (!dealershipId) {
    throw new Error('sendSMS: dealershipId is required — refusing to send without a dealership sender identity')
  }

  const supabase = createAdminClient()

  const { data: dealer, error } = await supabase
    .from('dealership_settings')
    .select('telnyx_phone_number, telnyx_messaging_profile_id, messaging_enabled, dealership_name')
    .eq('dealership_id', dealershipId)
    .single()

  if (error || !dealer) {
    throw new Error(`sendSMS: no dealership_settings found for dealership_id ${dealershipId}`)
  }

  if (!dealer.messaging_enabled) {
    throw new Error(`sendSMS: messaging disabled for ${dealer.dealership_name ?? dealershipId} — brand/campaign not approved yet`)
  }

  if (!dealer.telnyx_phone_number || !dealer.telnyx_messaging_profile_id) {
    throw new Error(`sendSMS: missing Telnyx number or messaging profile for ${dealer.dealership_name ?? dealershipId}`)
  }

  const client = getClient()

  const { data: message } = await client.messages.send({
    from: dealer.telnyx_phone_number,
    to,
    text: body,
    messaging_profile_id: dealer.telnyx_messaging_profile_id,
  })

  if (!message?.id) {
    throw new Error('sendSMS: Telnyx did not return a message id')
  }

  return message.id
}