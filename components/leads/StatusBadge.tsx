import { LeadStatus } from '@/types'
import { clsx } from 'clsx'

const statusConfig: Record<LeadStatus, { label: string; classes: string }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  },
  contacted: {
    label: 'Contacted',
    classes: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  },
  responded: {
    label: 'Responded',
    classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  appointed: {
    label: 'Appointed',
    classes: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  },
  dead: {
    label: 'Dead',
    classes: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  },
  opted_out: {
    label: 'Opted Out',
    classes: 'bg-gray-100 text-gray-400 ring-1 ring-gray-200 line-through',
  },
}

export default function StatusBadge({ status }: { status: LeadStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.classes
      )}
    >
      {config.label}
    </span>
  )
}
