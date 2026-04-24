import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Revive AI LLC',
  description: 'Terms of Service for Revive AI LLC and the ReviveAI SMS lead reactivation program.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">ReviveAI</span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-32 pb-24">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 24, 2026</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. About Us</h2>
            <p>
              These Terms of Service govern your use of the ReviveAI platform and SMS messaging program operated by{' '}
              <strong className="text-white">Revive AI LLC</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-white/5 bg-[#0d0d0d] p-5 space-y-1">
              <p><span className="text-gray-500">Business:</span> Revive AI LLC</p>
              <p><span className="text-gray-500">Address:</span> 4030 Wake Forest Road, STE 349, Raleigh, NC 27609</p>
              <p><span className="text-gray-500">Phone:</span> <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a></p>
              <p><span className="text-gray-500">Email:</span> <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Program Description</h2>
            <p className="text-gray-400">
              ReviveAI provides an AI-powered lead reactivation service for automotive dealerships. The platform sends
              personalized SMS and email messages to dormant leads on behalf of dealership clients. Messages are designed
              to re-engage prospective vehicle buyers who have previously expressed interest in purchasing a vehicle.
            </p>
            <p className="mt-3 text-gray-400">
              SMS messages are sent via Twilio using registered 10DLC numbers through Revive AI LLC's A2P messaging campaign.
              All outreach is conducted on behalf of the dealership that originally collected the recipient's contact information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. SMS Messaging Terms</h2>
            <div className="rounded-xl border border-[#8B0000]/30 bg-[#0d0000] p-5 space-y-3">
              <div className="flex gap-3">
                <span className="text-[#cc2200] font-bold shrink-0">Program:</span>
                <p className="text-gray-300">Revive AI LLC — AI-powered vehicle lead reactivation via SMS on behalf of automotive dealerships.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#cc2200] font-bold shrink-0">Frequency:</span>
                <p className="text-gray-300">Message frequency varies. You may receive up to 5 messages per reactivation sequence, spread over several weeks. Additional messages may be sent in response to your replies.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#cc2200] font-bold shrink-0">Rates:</span>
                <p className="text-gray-300"><strong className="text-white">Message and data rates may apply.</strong> Contact your mobile carrier for details about your plan.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#cc2200] font-bold shrink-0">Stop:</span>
                <p className="text-gray-300">Reply <strong className="text-white">STOP</strong> to any message to opt out immediately. You will receive one final confirmation, then no further messages will be sent to your number.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#cc2200] font-bold shrink-0">Help:</span>
                <p className="text-gray-300">Reply <strong className="text-white">HELP</strong> for assistance, or contact us at <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a> or <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a>.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Use of the Platform (Dealership Clients)</h2>
            <p className="mb-3 text-gray-400">
              Dealerships using the ReviveAI platform agree to:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Only upload lead data for individuals who have provided consent to be contacted in accordance with TCPA requirements.</li>
              <li>Ensure all contact lists comply with applicable federal and state laws, including the Telephone Consumer Protection Act (TCPA) and CAN-SPAM Act.</li>
              <li>Not use the platform to send unsolicited messages, spam, or messages that violate applicable law.</li>
              <li>Promptly notify Revive AI LLC of any opt-out requests received outside of the platform.</li>
              <li>Maintain accurate records of consent for all contacts uploaded to the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Opt-Out and Do-Not-Contact</h2>
            <p className="text-gray-400">
              Recipients may opt out of SMS messages at any time by replying <strong className="text-white">STOP</strong>.
              Opt-out requests are honored immediately and the number is added to a permanent do-not-contact list.
              This list is maintained across all campaigns on our platform. Opted-out numbers will not receive any
              further messages from Revive AI LLC regardless of which dealership client initiates the campaign.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p className="text-gray-400">
              Revive AI LLC provides the platform on an "as is" basis. We make no warranties regarding uptime,
              deliverability, or campaign results. To the maximum extent permitted by law, Revive AI LLC's liability
              for any claim arising from use of the platform is limited to the amount paid by the client in the
              30 days preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Changes to These Terms</h2>
            <p className="text-gray-400">
              We may update these Terms at any time. Continued use of the platform after changes are posted
              constitutes acceptance of the updated Terms. The date at the top of this page reflects the most
              recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact and Support</h2>
            <p className="text-gray-400 mb-3">
              For questions about these Terms or the SMS messaging program, contact us:
            </p>
            <div className="rounded-xl border border-white/5 bg-[#0d0d0d] p-5 space-y-1">
              <p><span className="text-gray-500">Business:</span> Revive AI LLC</p>
              <p><span className="text-gray-500">Address:</span> 4030 Wake Forest Road, STE 349, Raleigh, NC 27609</p>
              <p><span className="text-gray-500">Phone:</span> <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a></p>
              <p><span className="text-gray-500">Email:</span> <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a></p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080808] py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Business</p>
              <p className="text-xs text-gray-400">Revive AI LLC</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
              <p className="text-xs text-gray-400">4030 Wake Forest Road, STE 349<br />Raleigh, NC 27609</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
              <a href="tel:+19194806656" className="text-xs text-gray-400 hover:text-gray-300 transition-colors">(919) 480-6656</a>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
              <a href="mailto:joe@reviveleads.net" className="text-xs text-gray-400 hover:text-gray-300 transition-colors">joe@reviveleads.net</a>
            </div>
          </div>
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} Revive AI LLC. All rights reserved. &nbsp;·&nbsp;{' '}
            <Link href="/privacy" className="hover:text-gray-500 transition-colors">Privacy Policy</Link>
            {' '}&nbsp;·&nbsp;{' '}
            <Link href="/terms" className="hover:text-gray-500 transition-colors">Terms of Service</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
