'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Clock, RefreshCw, Zap, Calendar, Newspaper, Tag, ExternalLink, ChevronDown, Star } from 'lucide-react'
import { VehicleNews, DealerIncentive } from '@/types'
import { getUpcomingSeasonalEvents } from '@/lib/intel/seasonalContext'
import ArticleUseModal from '@/components/dashboard/ArticleUseModal'

interface CronStatus {
  last_run: string | null
  active_intel_count: number
  mileage_milestone_leads: number
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function formatDate(isoString: string | null): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupByBrand(articles: VehicleNews[]): Record<string, VehicleNews[]> {
  const grouped: Record<string, VehicleNews[]> = {}
  for (const article of articles) {
    const brand = article.brand ?? 'Other'
    if (!grouped[brand]) grouped[brand] = []
    if (grouped[brand].length < 2) grouped[brand].push(article)
  }
  return grouped
}

interface ArticleCardProps {
  article: VehicleNews
  onUse: () => void
}

function ArticleCard({ article, onUse }: ArticleCardProps) {
  return (
    <div>
      <a
        href={article.url.replace(/#_b=[^&]*/, '')}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 group"
      >
        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="h-10 w-14 rounded object-cover flex-shrink-0 bg-gray-100"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 flex-wrap">
            {article.article_type === 'deal' && (
              <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide flex-shrink-0">Deal</span>
            )}
            {article.article_type === 'new_model' && (
              <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide flex-shrink-0">New Model</span>
            )}
            <p className="text-xs font-medium text-gray-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {article.headline}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-gray-400">{article.source}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">{formatDate(article.published_at)}</span>
            <ExternalLink className="h-2.5 w-2.5 text-gray-300 group-hover:text-blue-400 ml-auto" />
          </div>
        </div>
      </a>
      <button
        onClick={onUse}
        className="mt-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        Use This →
      </button>
    </div>
  )
}

interface NewsSectionProps {
  title: string
  icon: React.ReactNode
  articles: Record<string, VehicleNews[]>
  collapsed: boolean
  onToggle: () => void
  onUse: (article: VehicleNews) => void
  emptyText?: string
  countBadgeClass?: string
}

function NewsSection({ title, icon, articles, collapsed, onToggle, onUse, countBadgeClass = 'bg-gray-100 text-gray-500' }: NewsSectionProps) {
  const brandKeys = Object.keys(articles)
  const totalCount = brandKeys.reduce((sum, b) => sum + articles[b].length, 0)
  if (totalCount === 0) return null

  return (
    <div className="px-5 py-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${countBadgeClass}`}>{totalCount}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`} />
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {brandKeys.map(brand => (
            <div key={brand}>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">{brand}</p>
              <div className="space-y-2">
                {articles[brand].map(article => (
                  <ArticleCard key={article.id} article={article} onUse={() => onUse(article)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SalesAmmoWidget() {
  const [news, setNews] = useState<VehicleNews[]>([])
  const [incentives, setIncentives] = useState<DealerIncentive[]>([])
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [useThisArticle, setUseThisArticle] = useState<VehicleNews | null>(null)
  const [collapsed, setCollapsed] = useState({ deals: false, new_models: false, news: true })

  const upcomingEvents = getUpcomingSeasonalEvents()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [newsRes, intelStatusRes, incentivesRes] = await Promise.all([
        fetch('/api/cron/news'),
        fetch('/api/cron/intel'),
        fetch('/api/incentives'),
      ])
      const [newsData, statusData, incentivesData] = await Promise.all([
        newsRes.json(),
        intelStatusRes.json(),
        incentivesRes.json(),
      ])
      setNews(Array.isArray(newsData) ? newsData : [])
      setCronStatus(statusData)
      setIncentives((Array.isArray(incentivesData) ? incentivesData : []).filter((i: DealerIncentive) => !i.expires_at || i.expires_at >= today))
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await Promise.all([
        fetch('/api/cron/news', { method: 'POST' }),
        fetch('/api/cron/intel', { method: 'POST' }),
      ])
      const [newsRes, intelRes] = await Promise.all([
        fetch('/api/cron/news'),
        fetch('/api/cron/intel'),
      ])
      const [newsData, statusData] = await Promise.all([newsRes.json(), intelRes.json()])
      setNews(Array.isArray(newsData) ? newsData : [])
      setCronStatus(statusData)
    } finally {
      setRefreshing(false)
    }
  }

  function toggle(key: keyof typeof collapsed) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Split articles into three priority tiers
  const dealArticles = news.filter(a => a.article_type === 'deal')
  const newModelArticles = news.filter(a => a.article_type === 'new_model')
  const newsArticles = news.filter(a => !a.article_type || a.article_type === 'news')

  const dealsByBrand = groupByBrand(dealArticles)
  const newModelsByBrand = groupByBrand(newModelArticles)
  const newsByBrand = groupByBrand(newsArticles)

  const hasAnyNews = news.length > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">Sales Ammo</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-6 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">

          {/* Active dealer incentives */}
          {incentives.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="h-3.5 w-3.5 text-blue-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Deals</p>
              </div>
              <div className="space-y-2.5">
                {incentives.slice(0, 3).map(inc => (
                  <div key={inc.id} className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{inc.vehicle_model}</p>
                      <p className="text-xs text-gray-500">{inc.deal_description}</p>
                      {inc.expires_at && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Expires {new Date(inc.expires_at + 'T12:00:00').toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News sections — DEALS → NEW MODELS → NEWS */}
          {hasAnyNews ? (
            <>
              <NewsSection
                title="Deals"
                icon={<Tag className="h-3.5 w-3.5 text-green-600" />}
                articles={dealsByBrand}
                collapsed={collapsed.deals}
                onToggle={() => toggle('deals')}
                onUse={setUseThisArticle}
                countBadgeClass="bg-green-100 text-green-700"
              />
              <NewsSection
                title="New Models"
                icon={<Star className="h-3.5 w-3.5 text-blue-500" />}
                articles={newModelsByBrand}
                collapsed={collapsed.new_models}
                onToggle={() => toggle('new_models')}
                onUse={setUseThisArticle}
                countBadgeClass="bg-blue-100 text-blue-700"
              />
              <NewsSection
                title="News"
                icon={<Newspaper className="h-3.5 w-3.5 text-gray-500" />}
                articles={newsByBrand}
                collapsed={collapsed.news}
                onToggle={() => toggle('news')}
                onUse={setUseThisArticle}
              />
            </>
          ) : (
            <div className="px-5 py-4 text-center">
              <Newspaper className="h-5 w-5 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No news yet.</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Set <a href="/settings" className="text-blue-600 hover:underline">brands in Settings</a> then click Refresh.
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {refreshing ? 'Fetching...' : 'Fetch now'}
              </button>
            </div>
          )}

          {/* Mileage milestones */}
          {cronStatus && cronStatus.mileage_milestone_leads > 0 && (
            <div className="px-5 py-3 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 flex-shrink-0">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">
                  {cronStatus.mileage_milestone_leads} lead{cronStatus.mileage_milestone_leads !== 1 ? 's' : ''} crossed a mileage milestone
                </p>
                <p className="text-xs text-gray-400">Prime time for a trade-in message</p>
              </div>
            </div>
          )}

          {/* Upcoming seasonal events */}
          {upcomingEvents.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upcoming</p>
              </div>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 2).map(event => (
                  <div key={event.context} className="flex items-center justify-between">
                    <p className="text-xs text-gray-700">{event.label}</p>
                    <p className="text-xs text-gray-400">in {event.daysAway}d</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last refresh */}
          <div className="px-5 py-2.5 flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {cronStatus?.last_run ? `Intel refreshed ${timeAgo(cronStatus.last_run)}` : 'Intel never refreshed'}
          </div>
        </div>
      )}
      <ArticleUseModal article={useThisArticle} onClose={() => setUseThisArticle(null)} />
    </div>
  )
}
