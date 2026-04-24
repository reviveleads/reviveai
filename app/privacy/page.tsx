import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Revive AI LLC',
  description: 'Privacy Policy for Revive AI LLC and reviveleads.net',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 24, 2026</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. About Us</h2>
            <p>
              This Privacy Policy applies to <strong className="text-white">Revive AI LLC</strong> ("Revive AI," "we," "our," or "us"),
              the operator of <strong className="text-white">reviveleads.net</strong> and the ReviveAI platform.
            </p>
            <div className="mt-4 rounded-xl border border-white/5 bg-[#0d0d0d] p-5 space-y-1">
              <p><span className="text-gray-500">Business:</span> Revive AI LLC</p>
              <p><span className="text-gray-500">Address:</span> 4030 Wake Forest Road, STE 349, Raleigh, NC 27609</p>
              <p><span className="text-gray-500">Phone:</span> <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a></p>
              <p><span className="text-gray-500">Email:</span> <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. What Data We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li><strong className="text-gray-300">Contact information</strong> — name, email address, phone number, and dealership name provided via our demo request form or by dealership clients uploading lead data.</li>
              <li><strong className="text-gray-300">Lead records</strong> — information about prospective vehicle buyers uploaded by our dealership clients, including name, phone number, email, and vehicle inquiry details.</li>
              <li><strong className="text-gray-300">Communication data</strong> — content of SMS and email messages sent and received through the platform.</li>
              <li><strong className="text-gray-300">Usage data</strong> — pages visited, actions taken within the platform, and browser/device information collected automatically via cookies and server logs.</li>
              <li><strong className="text-gray-300">Consent records</strong> — opt-in timestamps, opt-out requests, and messaging consent status for each lead.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We use collected data to:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Operate and deliver the ReviveAI lead reactivation service.</li>
              <li>Send AI-generated SMS and email outreach messages on behalf of dealership clients to their leads.</li>
              <li>Respond to demo requests and support inquiries.</li>
              <li>Maintain compliance records for TCPA and A2P 10DLC messaging regulations.</li>
              <li>Analyze platform usage to improve our service.</li>
              <li>Honor opt-out requests and maintain do-not-contact lists.</li>
            </ul>
            <p className="mt-3 text-gray-400">
              We do not sell personal data to third parties. We do not use lead data for any purpose beyond the services described above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. SMS Messaging Disclosure</h2>
            <p className="mb-3">
              Revive AI LLC operates an SMS messaging program that sends personalized lead-reactivation messages to
              vehicle-buyer leads on behalf of automotive dealerships. If you receive an SMS from our platform:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Messages are sent on behalf of the dealership that originally collected your contact information.</li>
              <li>Message frequency will vary — typically up to 5 messages per lead reactivation sequence, spread over several weeks.</li>
              <li>
                <strong className="text-gray-300">Message and data rates may apply</strong> depending on your mobile carrier and plan.
              </li>
              <li>
                <strong className="text-gray-300">To opt out:</strong> Reply <strong className="text-white">STOP</strong> to any message at any time. You will receive one final confirmation message, then no further messages will be sent.
              </li>
              <li>
                <strong className="text-gray-300">For help:</strong> Reply <strong className="text-white">HELP</strong> or contact us at <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a> or <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Opt-Out Instructions</h2>
            <p className="mb-3">You can stop receiving SMS messages at any time by:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Replying <strong className="text-white">STOP</strong> to any message from our platform.</li>
              <li>Emailing <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a> with your phone number and a request to be removed.</li>
              <li>Calling <a href="tel:+19194806656" className="text-[#cc2200] hover:underline">(919) 480-6656</a> during business hours.</li>
            </ul>
            <p className="mt-3 text-gray-400">
              Opt-out requests are processed immediately. Your number will be added to our do-not-contact list and will not receive future messages from any campaign on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Sharing</h2>
            <p className="mb-3">We may share data with:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li><strong className="text-gray-300">Twilio</strong> — our SMS/messaging infrastructure provider, for the purpose of delivering messages.</li>
              <li><strong className="text-gray-300">Supabase</strong> — our database provider, for secure storage of platform data.</li>
              <li><strong className="text-gray-300">OpenAI / Anthropic</strong> — AI providers used to generate message content (no personal data beyond vehicle inquiry context is shared).</li>
              <li><strong className="text-gray-300">Dealership clients</strong> — the businesses that own the lead data and use our platform to contact their leads.</li>
              <li><strong className="text-gray-300">Legal authorities</strong> — if required by law or to protect our legal rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Retention</h2>
            <p className="text-gray-400">
              We retain lead and messaging data for as long as a dealership account is active, plus up to 18 months
              thereafter for compliance and auditing purposes. Opt-out records are retained indefinitely to ensure
              do-not-contact status is honored.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-3 text-gray-400">You may request:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Access to personal data we hold about you.</li>
              <li>Correction of inaccurate data.</li>
              <li>Deletion of your data (subject to legal retention requirements).</li>
            </ul>
            <p className="mt-3 text-gray-400">
              To submit a request, contact us at <a href="mailto:joe@reviveleads.net" className="text-[#cc2200] hover:underline">joe@reviveleads.net</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Contact Us</h2>
            <p className="text-gray-400 mb-2">For privacy-related questions or requests:</p>
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
