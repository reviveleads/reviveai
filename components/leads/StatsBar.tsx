import { LeadStats } from '@/types'
import { GitBranch } from 'lucide-react'

interface Props {
  stats: LeadStats
}

const statItems = [
  { key: 'total',            label: 'Total',            color: 'text-gray-900',   border: 'border-gray-200'   },
  { key: 'pending',          label: 'Pending',          color: 'text-gray-600',   border: 'border-gray-200'   },
  { key: 'abandoned',        label: 'Abandoned',        color: 'text-orange-600', border: 'border-orange-100' },
  { key: 'contacted',        label: 'Contacted',        color: 'text-blue-600',   border: 'border-blue-100'   },
  { key: 'responded',        label: 'Responded',        color: 'text-amber-600',  border: 'border-amber-100'  },
  { key: 'appointed',        label: 'Appointed',        color: 'text-green-600',  border: 'border-green-100'  },
  { key: 'opted_out',        label: 'Opted Out',        color: 'text-gray-400',   border: 'border-gray-100'   },
  { key: 'sequences_active', label: 'Sequences Active', color: 'text-purple-600', border: 'border-purple-100' },
] as const

export default function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {statItems.map(item => (
        <div
          key={item.key}
          className={`rounded-xl border ${item.border} bg-white px-4 py-4 shadow-sm`}
        >
          {item.key === 'sequences_active' ? (
            <div className="flex items-center gap-1 mb-1">
              <GitBranch className="h-3 w-3 text-purple-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-none">Sequences</p>
            </div>
          ) : (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
          )}
          <p className={`text-2xl font-bold mt-1 ${item.color}`}>{stats[item.key]}</p>
        </div>
      ))}
    </div>
  )
}
