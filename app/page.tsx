import Link from 'next/link'
import { Zap, ArrowRight, ArrowDown, CheckCircle } from 'lucide-react'
import DemoForm from '@/components/landing/DemoForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white antialiased">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">ReviveAI</span>
          </div>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#how-it-works" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#pricing" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="#demo"
              className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors"
            >
              Book a Demo
            </a>
            <Link
              href="/dashboard"
              className="hidden sm:block rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-[#8B0000]/8 blur-[140px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B0000]/40 bg-[#8B0000]/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B0000]" />
            <span className="text-xs font-medium uppercase tracking-widest text-[#cc2200]">
              AI-Powered Lead Reactivation for Dealerships
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Your CRM Is Full of Money.{' '}
            <span className="text-[#8B0000]">We Help You Get It Out.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            We text your old leads like a real salesperson would and fill your appointment
            calendar using people you already paid for.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#how-it-works"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-white/10 px-8 py-4 text-sm font-semibold text-white hover:border-white/20 hover:bg-white/5 transition-colors"
            >
              See How It Works
            </a>
            <a
              href="#demo"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-8 py-4 text-sm font-semibold text-white hover:bg-[#a00000] transition-colors"
            >
              Book a 10-Min Demo <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-700">
          <ArrowDown className="h-5 w-5" />
        </div>
      </section>

      {/* ── Pain section ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">The Problem</p>
          <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Your CRM Is Full of Money—<br className="hidden sm:block" />Nobody's Working It
          </h2>
          <p className="text-lg leading-relaxed text-gray-400">
            Every dealership has thousands of old leads sitting in the CRM. People who inquired,
            got a quote, almost bought… and then disappeared. Not because they weren't serious—
            because nobody followed up the right way. Salespeople forget. BDC gives up after a
            couple tries. After 30 days, the lead is basically dead.{' '}
            <span className="text-white font-medium">That's where we come in.</span>
          </p>
        </div>
      </section>

      {/* ── What We Do ────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">What We Do</p>
              <h2 className="mb-6 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                We Bring Those Leads Back to Life
              </h2>
              <p className="mb-8 text-gray-400 leading-relaxed text-lg">
                Revive goes into your old CRM data and starts real conversations through SMS.
                Not spam. Not templates. Conversations that sound like a real person texting
                from their phone.
              </p>
              <div className="space-y-4">
                {[
                  'We reach out to leads you already paid for',
                  'We start natural conversations — not robotic garbage',
                  'We re-engage buyers who are still in the market',
                  'We turn them into real appointments on your calendar',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#8B0000]">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-300 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-6">How it flows</p>
              <div className="space-y-0">
                {[
                  { n: '01', title: 'You give us your old CRM leads', body: "Doesn't matter if they're 3 months or 3 years old." },
                  { n: '02', title: 'We start real SMS conversations', body: 'Personalized to the vehicle they inquired about. Sounds human. Because the intent is human.' },
                  { n: '03', title: 'Interested leads respond', body: 'We keep the conversation going and qualify them in real-time.' },
                  { n: '04', title: 'Appointments land on your calendar', body: 'Your sales team picks it up from there.' },
                ].map((step, i, arr) => (
                  <div key={step.n} className="relative">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#8B0000]/20 border border-[#8B0000]/30">
                          <span className="text-xs font-bold text-[#8B0000]">{step.n}</span>
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-[#8B0000]/20 my-1" />}
                      </div>
                      <div className={i < arr.length - 1 ? 'pb-6' : ''}>
                        <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Example Texts ─────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Real Conversations</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              What Your Leads Actually Receive
            </h2>
          </div>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            No scripts. No weird tone. Just conversations that get responses.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Conversation 1 */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] overflow-hidden">
              <div className="bg-[#111] border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#8B0000]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#cc2200]">M</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Mike</p>
                  <p className="text-[10px] text-gray-600">Silverado inquiry — 4 months ago</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">Hey Mike, still looking for a Silverado or did you already grab something?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#2a2a2a] px-3 py-2">
                    <p className="text-xs text-gray-200 leading-relaxed">Still looking actually. Been busy. What do you have?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">Nice. We just got a couple in — one's a loaded LTZ with low miles. Want me to send you the details?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation 2 */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] overflow-hidden">
              <div className="bg-[#111] border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#8B0000]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#cc2200]">S</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Sarah</p>
                  <p className="text-[10px] text-gray-600">Truck inquiry — 6 months ago</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">Hey Sarah, we got a couple trucks in I thought of you — want me to send options?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#2a2a2a] px-3 py-2">
                    <p className="text-xs text-gray-200 leading-relaxed">Yeah send them over</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">Sending now. You still looking in that same price range or has anything changed?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation 3 */}
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] overflow-hidden">
              <div className="bg-[#111] border-b border-white/5 px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#8B0000]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#cc2200]">D</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Dave</p>
                  <p className="text-[10px] text-gray-600">Ready to buy — 2 months ago</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">If you're still in the market I can get you numbers today — what are you working with?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#2a2a2a] px-3 py-2">
                    <p className="text-xs text-gray-200 leading-relaxed">Yeah let's do it. I'm ready to move if the deal's right</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#8B0000] px-3 py-2">
                    <p className="text-xs text-white leading-relaxed">Perfect. Let me pull some options. Can you come in Thursday or does the weekend work better?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Math ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">The Numbers</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Here's What This Looks Like in Real Life
            </h2>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Start with 1,000 old leads in your CRM', value: '1,000', sub: 'leads', highlight: false },
              { label: '5–10% respond', value: '50–100', sub: 'people back in conversation', highlight: false },
              { label: 'Of those, qualify to real conversations', value: '30–50', sub: 'real conversations', highlight: false },
              { label: 'Convert to booked appointments', value: '15–25', sub: 'appointments booked', highlight: false },
              { label: 'Close 20%', value: '3–5', sub: 'extra deals this month', highlight: true },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-full rounded-xl border px-6 py-5 flex items-center justify-between gap-4 ${step.highlight ? 'border-[#8B0000]/50 bg-[#8B0000]/10' : 'border-white/5 bg-[#0d0d0d]'}`}>
                  <span className={`text-sm leading-snug ${step.highlight ? 'text-white font-semibold' : 'text-gray-400'}`}>{step.label}</span>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-2xl font-black ${step.highlight ? 'text-[#8B0000]' : 'text-white'}`}>{step.value}</span>
                    <p className="text-xs text-gray-600 mt-0.5">{step.sub}</p>
                  </div>
                </div>
                {i < 4 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-3 bg-[#8B0000]/30" />
                    <ArrowDown className="h-4 w-4 text-[#8B0000]/60" />
                    <div className="w-px h-3 bg-[#8B0000]/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-gray-500 text-sm">
            From leads you already paid for.{' '}
            <span className="text-white font-semibold">That's it.</span>
          </p>
        </div>
      </section>

      {/* ── Why SMS ───────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Why SMS</p>
              <h2 className="mb-6 text-3xl font-black tracking-tight sm:text-4xl">
                Because Texts Get Read.<br />Emails Don't.
              </h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Email follow-up is dead. SMS gets opened, read, and responded to. And when it
                sounds like a real person — that's when it converts.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#8B0000]/30 bg-[#8B0000]/10 p-8 text-center">
                <p className="text-5xl font-black text-[#8B0000] mb-2">98%</p>
                <p className="text-sm font-semibold text-white mb-1">SMS Open Rate</p>
                <p className="text-xs text-gray-600">Most read within 3 minutes</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-8 text-center">
                <p className="text-5xl font-black text-gray-600 mb-2">21%</p>
                <p className="text-sm font-semibold text-gray-400 mb-1">Email Open Rate</p>
                <p className="text-xs text-gray-700">And declining every year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What We Don't Do ──────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">No Surprises</p>
          <h2 className="mb-8 text-3xl font-black tracking-tight sm:text-4xl">
            Let's Be Clear
          </h2>
          <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-8 space-y-5">
            {[
              { no: "We don't sell cars for you." },
              { no: "We don't replace your sales team." },
              { no: "We don't promise closes." },
            ].map(item => (
              <div key={item.no} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-gray-500">✕</span>
                </div>
                <span className="text-gray-400">{item.no}</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#8B0000]">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <p className="text-white font-semibold leading-relaxed">
                  We do one thing: We get you more real appointments from your existing leads.
                  What you do with those appointments is on your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Pricing</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Built for Dealerships That Want More Appointments
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Starter',
                price: '$1,500',
                period: '/mo',
                volume: 'Up to 75 units/month',
                popular: false,
              },
              {
                name: 'Core',
                price: '$2,500',
                period: '/mo',
                volume: '76–150 units/month',
                popular: true,
              },
              {
                name: 'Pro',
                price: '$3,500',
                period: '/mo',
                volume: '151–300 units/month',
                popular: false,
              },
              {
                name: 'Enterprise',
                price: '$6,000+',
                period: '/mo',
                volume: '500+ units or groups',
                popular: false,
              },
            ].map(tier => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 flex flex-col gap-4 ${
                  tier.popular
                    ? 'border-2 border-[#8B0000] bg-[#8B0000]/10'
                    : 'border border-white/5 bg-[#0d0d0d]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#8B0000] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div>
                  <p className={`text-sm font-semibold mb-1 ${tier.popular ? 'text-[#cc2200]' : 'text-gray-400'}`}>{tier.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-white">{tier.price}</span>
                    <span className="text-gray-500 text-sm mb-1">{tier.period}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 border-t border-white/5 pt-4">{tier.volume}</p>
                <a
                  href="#demo"
                  className={`mt-auto text-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-[#8B0000] text-white hover:bg-[#a00000]'
                      : 'border border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            30-day free pilot. No contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            You Already Paid for These Leads
          </h2>
          <p className="mb-10 text-gray-400 text-lg leading-relaxed">
            The only question is — are you going to let them sit there…
            or turn them into deals?
          </p>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-lg bg-[#8B0000] px-10 py-5 text-base font-bold text-white hover:bg-[#a00000] transition-colors"
          >
            See Revive in Action <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* ── Demo Form ─────────────────────────────────────────────────── */}
      <section id="demo" className="border-t border-white/5 bg-[#080808] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="lg:pt-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#8B0000]">Book a Demo</p>
              <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl">
                Book a 10-Minute Demo
              </h2>
              <p className="mb-8 text-gray-400 leading-relaxed text-lg">
                Show us your CRM leads. We'll show you what we can pull out of them.
              </p>
              <div className="space-y-3">
                {[
                  'No slide decks — we show you the actual product',
                  "We'll estimate your reactivation opportunity on the spot",
                  'No commitment, no contracts',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#8B0000]" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 sm:p-8">
              <h3 className="mb-6 text-lg font-bold text-white">Book My Demo</h3>
              <DemoForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080808] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Top row: brand + nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">ReviveAI</span>
                <p className="text-xs text-gray-600 leading-none mt-0.5">AI Lead Reactivation for Dealerships</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
              <a href="#how-it-works" className="hover:text-gray-400 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-gray-400 transition-colors">Pricing</a>
              <a href="#demo" className="hover:text-gray-400 transition-colors">Book a Demo</a>
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
              <Link href="/dashboard" className="hover:text-gray-400 transition-colors">Sign In</Link>
            </div>
          </div>

          {/* Business info */}
          <div className="border-t border-white/5 pt-6">
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
        </div>
      </footer>

    </div>
  )
}
