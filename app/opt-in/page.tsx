import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Request Information — Sample Lead Form',
  description: 'Sample dealership lead capture form with SMS consent.',
}

export default function OptInPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
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

      {/* Page */}
      <main className="mx-auto max-w-lg px-4 sm:px-6 pt-32 pb-24">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Sample Lead Form</p>
          <h1 className="text-3xl font-black tracking-tight mb-3">Request Vehicle Information</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Fill out the form below and a team member will be in touch shortly.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 sm:p-8">
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  First Name <span className="text-[#8B0000]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Last Name <span className="text-[#8B0000]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Smith"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Phone Number <span className="text-[#8B0000]">*</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 000-1234"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@email.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Vehicle of Interest
              </label>
              <input
                type="text"
                placeholder="e.g. 2025 Chevy Silverado"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000] transition-colors"
              />
            </div>

            {/* SMS consent */}
            <p className="text-xs text-gray-500 leading-relaxed pt-1">
              By submitting this form, you agree to receive automated SMS messages from your dealership
              regarding your vehicle inquiry. Message and data rates may apply. Message frequency varies.
              Reply STOP to opt out. View our{' '}
              <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/terms" className="underline hover:text-gray-400 transition-colors">
                Terms of Service
              </Link>.
            </p>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#8B0000] px-6 py-4 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors"
            >
              Submit Request
            </button>

          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-700">
          This is a sample form demonstrating SMS consent best practices for{' '}
          <Link href="/" className="hover:text-gray-500 transition-colors">ReviveAI</Link>.
        </p>
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
