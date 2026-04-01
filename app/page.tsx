import Link from 'next/link'
import {
  Zap, MessageSquare, Mail, Shield, TrendingUp,
  ArrowRight, CheckCircle, ChevronDown, Car, BarChart2, Clock,
} from 'lucide-react'
import DemoForm from '@/components/landing/DemoForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">ReviveAI</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#demo" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              Demo
            </a>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-[#8B0000]/10 blur-[120px]" />
        </div>

        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B0000]/40 bg-[#8B0000]/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B0000]" />
            <span className="text-xs font-medium uppercase tracking-widest text-[#cc2200]">
              AI-Powered Lead Reactivation
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Your Dead Leads Are Worth{' '}
            <span className="text-[#8B0000]">More Than You Think.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            Revive reactivates dormant dealership leads with AI-powered SMS and email follow-up
            that sounds completely human. No exclamation points. No generic blasts.
            Just conversations that convert.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-8 py-4 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors"
            >
              Request a Demo <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how-it-works"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/10 px-8 py-4 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="border-y border-[#8B0000]/20 bg-[#0a0000] py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '5-touch', label: 'AI sequence per lead' },
              { value: 'SMS + Email', label: 'Multi-channel outreach' },
              { value: '0', label: 'Exclamation points. Ever.' },
              { value: 'TCPA', label: 'Compliant by default' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-[#8B0000] sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem section ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">The Problem</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Your CRM gave up.{' '}
              <span className="text-[#8B0000]">We didn't.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              The average dealership has hundreds of leads sitting cold in their CRM.
              No follow-up. No sequence. No revenue. Just wasted ad spend.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Car className="h-6 w-6 text-[#8B0000]" />,
                title: 'Leads go dark after 30 days',
                body: 'Your CRM flags them "lost" and the salesperson moves on. But that customer still needs a car.',
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-[#8B0000]" />,
                title: 'Generic blasts get ignored',
                body: '"Hey! We have great deals this month!!!" Nobody replies. Nobody buys. Everyone unsubscribes.',
              },
              {
                icon: <BarChart2 className="h-6 w-6 text-[#8B0000]" />,
                title: 'Revenue walks out the door',
                body: 'You paid $200–$400 per lead. Then let them rot. That\'s money you\'ve already spent, going nowhere.',
              },
            ].map(card => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B0000]/10">
                  {card.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">How It Works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Three steps from dead leads to live deals.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload your dormant leads',
                body: 'Drop in a CSV of any leads that went cold — 30 days, 6 months, 2 years. Revive figures out the right approach for each one.',
              },
              {
                step: '02',
                title: 'AI crafts personalized outreach',
                body: 'Each message references what the lead actually inquired about — the make, model, timing. No merge-field junk. Real context.',
              },
              {
                step: '03',
                title: 'You get warm conversations',
                body: 'When someone replies, Revive continues the conversation or hands it to your salesperson — whoever makes sense.',
              },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="mb-4 text-5xl font-black text-[#8B0000]/20 leading-none select-none">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Why Revive</p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for dealerships.<br />Not generic SaaS.
              </h2>
              <p className="mb-8 text-gray-400 leading-relaxed">
                Revive isn't a blast email tool with a CRM badge on it. It's an AI that
                understands the car business — seasonality, make-specific context, trade-in
                timing — and writes outreach that sounds like your best salesperson, not a robot.
              </p>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-lg bg-[#8B0000] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors"
              >
                Request a Demo <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <MessageSquare className="h-5 w-5 text-[#8B0000]" />,
                  title: 'Human-sounding messages',
                  body: 'No em dashes. No buzzwords. No "I hope this finds you well." Just normal, direct language.',
                },
                {
                  icon: <Clock className="h-5 w-5 text-[#8B0000]" />,
                  title: 'Multi-touch sequences',
                  body: 'Up to 5 touchpoints per lead, spaced intelligently across SMS and email.',
                },
                {
                  icon: <Shield className="h-5 w-5 text-[#8B0000]" />,
                  title: 'TCPA compliant',
                  body: 'Quiet hours enforcement, opt-out handling, and 18-month consent window tracking built in.',
                },
                {
                  icon: <Mail className="h-5 w-5 text-[#8B0000]" />,
                  title: 'SMS and email',
                  body: 'Reaches leads where they actually respond — not just wherever your CRM defaults to.',
                },
                {
                  icon: <TrendingUp className="h-5 w-5 text-[#8B0000]" />,
                  title: 'ROI dashboard',
                  body: 'See exactly what each reactivated lead is worth against what you spent to get it.',
                },
                {
                  icon: <Zap className="h-5 w-5 text-[#8B0000]" />,
                  title: 'Contextual intelligence',
                  body: 'Live vehicle news, incentives, and seasonal context woven into outreach automatically.',
                },
              ].map(feature => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-white/5 bg-[#0d0d0d] p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#8B0000]/10">
                    {feature.icon}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-500">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── What Revive doesn't do ────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-[#080808] py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Our Promise</p>
          <h2 className="mb-10 text-2xl font-bold sm:text-3xl">Things you'll never see from Revive.</h2>
          <div className="grid gap-3 sm:grid-cols-2 text-left">
            {[
              'Exclamation points',
              '"Limited time offer!!!"',
              'Generic "Hey there" openers',
              'Fake urgency tactics',
              'Spam-flagging keyword soup',
              '"Just checking in" messages',
              'One-size-fits-all blasts',
              'Consent shortcuts',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0d0d0d] px-4 py-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#8B0000]/20">
                  <span className="text-[10px] font-bold text-[#8B0000]">✕</span>
                </div>
                <span className="text-sm text-gray-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo form ─────────────────────────────────────────────────── */}
      <section id="demo" className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            {/* Left copy */}
            <div className="lg:pt-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Get Started</p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                See Revive in action<br />at your dealership.
              </h2>
              <p className="mb-8 text-gray-400 leading-relaxed">
                We'll show you exactly how Revive would approach your dormant leads — the
                message strategy, the sequence timing, what a real conversation looks like.
                No slide decks. Just the product.
              </p>
              <div className="space-y-3">
                {[
                  'Live walkthrough of your actual use case',
                  'Sample AI messages written for your brand',
                  'ROI estimate based on your lead volume',
                  'No contracts, no commitments',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#8B0000]" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right form */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 sm:p-8">
              <h3 className="mb-6 text-lg font-semibold text-white">Request a Demo</h3>
              <DemoForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080808] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">ReviveAI</span>
                <p className="text-xs text-gray-600 leading-none mt-0.5">AI Lead Reactivation for Dealerships</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a href="#how-it-works" className="hover:text-gray-400 transition-colors">How it works</a>
              <a href="#demo" className="hover:text-gray-400 transition-colors">Request Demo</a>
              <Link href="/dashboard" className="hover:text-gray-400 transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-gray-700">
              © {new Date().getFullYear()} ReviveAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
