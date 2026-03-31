import Parser from 'rss-parser'
import { BRAND_KEYWORDS } from './intentClassifier'
import { classifyArticle, ArticleType } from './articleClassifier'

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
  timeout: 10000,
})

export const RSS_FEEDS = [
  { name: 'Car and Driver',   url: 'https://www.caranddriver.com/feed' },
  { name: 'MotorTrend',       url: 'https://www.motortrend.com/feed' },
  { name: 'GM Authority',     url: 'https://gmauthority.com/blog/feed' },
  { name: 'CarBuzz',          url: 'https://carbuzz.com/feed' },
  { name: 'Automotive News',  url: 'https://www.autonews.com/rss.xml' },
  { name: 'Hagerty Media',    url: 'https://www.hagerty.com/media/feed' },
  { name: 'The Drive',        url: 'https://www.thedrive.com/feed' },
  { name: 'Road and Track',   url: 'https://www.roadandtrack.com/feed' },
  { name: 'Jalopnik',         url: 'https://jalopnik.com/rss' },
]

export interface ScrapedArticle {
  headline: string
  summary: string | null
  url: string
  brand: string | null
  image_url: string | null
  source: string
  published_at: string | null
  article_type: ArticleType
}

// Returns ALL matching brands for an article (not just the first)
function detectBrands(text: string, activeBrands: string[]): string[] {
  const lower = ` ${text.toLowerCase()} `
  const matched: string[] = []
  for (const brand of activeBrands) {
    const keywords = BRAND_KEYWORDS[brand]
    if (keywords && keywords.some(k => lower.includes(k))) matched.push(brand)
  }
  return matched
}

function extractImageUrl(item: Record<string, unknown>): string | null {
  // media:content (most common)
  const mc = item.mediaContent as Record<string, unknown> | undefined
  if (mc?.['$']) {
    const attrs = mc['$'] as Record<string, string>
    if (attrs.url) return attrs.url
  }

  // media:thumbnail
  const mt = item.mediaThumbnail as Record<string, unknown> | undefined
  if (mt?.['$']) {
    const attrs = mt['$'] as Record<string, string>
    if (attrs.url) return attrs.url
  }

  // enclosure
  const enc = item.enclosure as { url?: string; type?: string } | undefined
  if (enc?.url && enc.type?.startsWith('image')) return enc.url

  // img tag in content/summary HTML
  const html = (item.content || item.summary || item['content:encoded'] || '') as string
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch) return imgMatch[1]

  return null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 250)
}

export async function scrapeFeed(
  feedUrl: string,
  sourceName: string,
  activeBrands: string[]
): Promise<ScrapedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl)
    const articles: ScrapedArticle[] = []

    for (const item of feed.items ?? []) {
      const headline = item.title?.trim() ?? ''
      const url = item.link?.trim() ?? ''
      if (!headline || !url) continue

      const searchText = `${headline} ${item.contentSnippet ?? ''} ${item.summary ?? ''}`
      const brands = detectBrands(searchText, activeBrands)
      if (brands.length === 0) continue  // Skip articles not relevant to this dealership's brands

      const rawSummary = item.contentSnippet || item.summary || ''
      const summary = rawSummary ? stripHtml(rawSummary) : null
      const image_url = extractImageUrl(item as unknown as Record<string, unknown>)
      const published_at = item.isoDate ?? item.pubDate ?? null
      const article_type = classifyArticle(headline, summary)

      // Emit one row per matching brand.
      // Additional brands get a URL fragment (#_b=Brand) so each row has a unique URL
      // while still linking to the correct article (browsers ignore unknown fragments).
      brands.forEach((brand, i) => {
        const brandUrl = i === 0 ? url : `${url}#_b=${encodeURIComponent(brand)}`
        articles.push({ headline, summary, url: brandUrl, brand, image_url, source: sourceName, published_at, article_type })
      })
    }

    return articles
  } catch (err: any) {
    console.error(`[rssScraper] Failed to fetch "${sourceName}":`, err.message)
    return []
  }
}

export async function scrapeAllFeeds(activeBrands: string[]): Promise<ScrapedArticle[]> {
  if (activeBrands.length === 0) return []

  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => scrapeFeed(feed.url, feed.name, activeBrands))
  )

  const all: ScrapedArticle[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value)
    }
  }

  // Sort by date descending
  all.sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0
    const db = b.published_at ? new Date(b.published_at).getTime() : 0
    return db - da
  })

  return all
}
