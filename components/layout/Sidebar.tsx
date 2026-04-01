'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  ShieldCheck,
  Zap,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'ROI', href: '/roi', icon: TrendingUp },
  { name: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#1e2130] text-white'
                : 'text-[#8b92a5] hover:bg-[#1e2130] hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 bg-[#0f1117] px-4 border-b border-[#1e2130]">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-[#8b92a5] hover:text-white hover:bg-[#1e2130] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">ReviveAI</span>
        </div>
      </div>

      {/* Mobile backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar — fixed drawer on mobile, static column on desktop */}
      <div
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-[#0f1117] transition-transform duration-300',
          'md:relative md:translate-x-0 md:flex-shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#1e2130]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">ReviveAI</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-1.5 text-[#8b92a5] hover:text-white hover:bg-[#1e2130] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {navLinks}

        {/* Footer */}
        <div className="border-t border-[#1e2130] px-6 py-4">
          <p className="text-xs text-[#8b92a5]">ReviveAI v1.0</p>
          <p className="text-xs text-[#4a5068] mt-0.5">Contextual Intelligence</p>
        </div>
      </div>
    </>
  )
}
