import { classifyArticle, ArticleType } from './articleClassifier'

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

const FEEDS: { url: string; source: string }[] = [
  { url: 'https://www.motortrend.com/feed/',           source: 'MotorTrend' },
  { url: 'https://www.caranddriver.com/rss/all.xml',   source: 'Car and Driver' },
  { url: 'https://gmauthority.com/blog/feed/',         source: 'GM Authority' },
  { url: 'https://www.cadillacnews.com/feed/',         source: 'Cadillac News' },
  { url: 'https://www.motor1.com/rss/news/all/',       source: 'Motor1' },
]

// Ordered so longer/more-specific names are matched before substrings (e.g. "Land Rover" before "Rover")
const BRANDS: string[] = [
  'Alfa Romeo', 'Land Rover', 'Rolls-Royce', 'Aston Martin',
  'GMC', 'Cadillac', 'Chevrolet', 'Chevy', 'Buick',
  'Ford', 'Lincoln',
  'RAM', 'Ram', 'Dodge', 'Jeep', 'Chrysler',
  'Toyota', 'Lexus',
  'Honda', 'Acura',
  'Nissan', 'Infiniti',
  'Hyundai', 'Genesis', 'Kia',
  'Volkswagen', 'Audi', 'Porsche',
  'BMW', 'MINI', 'Mini',
  'Mercedes',
  'Volvo',
  'Subaru', 'Mazda', 'Mitsubishi',
  'Jaguar',
  'Tesla', 'Rivian', 'Lucid',
  'Ferrari', 'Lamborghini', 'Maserati', 'Bentley',
  'Fiat', 'Peugeot', 'Renault',
]

function detectBrand(text: string): string {
  for (const brand of BRANDS) {
    if (new RegExp(`\\b${brand}\\b`, 'i').test(text)) return brand
  }
  return 'General'
}

// Extract text content from an XML tag, handling CDATA sections
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`,
    'i'
  )
  const m = xml.match(re)
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

// Extract image URL from media:content, media:thumbnail, or enclosure
function extractImage(item: string): string | null {
  const mediaContent = item.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (mediaContent) return mediaContent[1]
  const mediaThumbnail = item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (mediaThumbnail) return mediaThumbnail[1]
  const enclosure = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i)
  if (enclosure) return enclosure[1]
  return null
}

// Extract <link> which in RSS is often text after the tag, not an attribute
function extractLink(item: string): string {
  // Prefer <link> text content
  const m = item.match(/<link>([^<]+)<\/link>/i)
  if (m) return m[1].trim()
  // Fall back to <guid> if it looks like a URL
  const guid = extractTag(item, 'guid')
  if (guid.startsWith('http')) return guid
  return ''
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function parseFeed(feedUrl: string, source: string): Promise<ScrapedArticle[]> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'ReviveAI/1.0 RSS Reader' },
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    console.error(`[rssScraper] ${source} returned ${res.status}`)
    return []
  }
  const xml = await res.text()

  const articles: ScrapedArticle[] = []
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRe.exec(xml)) !== null) {
    const item = match[1]

    const headline = stripHtml(extractTag(item, 'title'))
    const url = extractLink(item)
    if (!headline || !url) continue

    const rawDesc = extractTag(item, 'description') || extractTag(item, 'content:encoded')
    const summary = rawDesc ? stripHtml(rawDesc).slice(0, 250) : null

    const pubDateStr = extractTag(item, 'pubDate') || extractTag(item, 'dc:date')
    let published_at: string | null = null
    if (pubDateStr) {
      try { published_at = new Date(pubDateStr).toISOString() } catch {}
    }

    const image_url = extractImage(item)
    const brand = detectBrand(headline)
    const article_type = classifyArticle(headline, summary)

    articles.push({ headline, summary, url, brand, image_url, source, published_at, article_type })
  }

  return articles
}

export async function scrapeAllFeeds(): Promise<ScrapedArticle[]> {
  const results = await Promise.allSettled(
    FEEDS.map(f => parseFeed(f.url, f.source))
  )

  const seenUrls = new Set<string>()
  const allArticles: ScrapedArticle[] = []

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const article of result.value) {
      if (seenUrls.has(article.url)) continue
      seenUrls.add(article.url)
      allArticles.push(article)
    }
  }

  allArticles.sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0
    const db = b.published_at ? new Date(b.published_at).getTime() : 0
    return db - da
  })

  return allArticles
}

export const RSS_FEEDS: { name: string; url: string }[] = []
