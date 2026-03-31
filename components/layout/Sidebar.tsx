'use client'

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

  return (
    <div className="flex h-full w-64 flex-col bg-[#0f1117] flex-shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-[#1e2130]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">ReviveAI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* Footer */}
      <div className="border-t border-[#1e2130] px-6 py-4">
        <p className="text-xs text-[#8b92a5]">ReviveAI v1.0</p>
        <p className="text-xs text-[#4a5068] mt-0.5">Contextual Intelligence</p>
      </div>
    </div>
  )
}
