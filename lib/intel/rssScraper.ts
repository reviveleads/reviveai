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

export async function scrapeAllFeeds(activeBrands: string[]): Promise<ScrapedArticle[]> {
  if (activeBrands.length === 0) return []

  const apiKey = process.env.NEWSDATA_API_KEY
  if (!apiKey) {
    console.error('[rssScraper] NEWSDATA_API_KEY not set')
    return []
  }

  const allArticles: ScrapedArticle[] = []
  const seenUrls = new Set<string>()

  for (const brand of activeBrands) {
    try {
      const query = encodeURIComponent(`${brand} car`)
      const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${query}&language=en&category=technology,business`

      const res = await fetch(url)
      if (!res.ok) {
        console.error(`[rssScraper] NewsData API error for ${brand}: ${res.status}`)
        continue
      }

      const data = await res.json()
      if (data.status !== 'success' || !Array.isArray(data.results)) continue

      for (const item of data.results) {
        const headline = item.title?.trim() ?? ''
        const articleUrl = item.link?.trim() ?? ''
        if (!headline || !articleUrl || seenUrls.has(articleUrl)) continue
        seenUrls.add(articleUrl)

        const summary = item.description ? item.description.slice(0, 250) : null
        const image_url = item.image_url ?? null
        const source = item.source_id ?? item.source_name ?? 'NewsData'
        const published_at = item.pubDate ? new Date(item.pubDate).toISOString() : null
        const article_type = classifyArticle(headline, summary)

        allArticles.push({
          headline,
          summary,
          url: articleUrl,
          brand,
          image_url,
          source,
          published_at,
          article_type,
        })
      }
    } catch (err: any) {
      console.error(`[rssScraper] Failed for brand "${brand}":`, err.message)
    }
  }

  // Sort by date descending
  allArticles.sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0
    const db = b.published_at ? new Date(b.published_at).getTime() : 0
    return db - da
  })

  return allArticles
}

// Keep export for any code that imports RSS_FEEDS
export const RSS_FEEDS: { name: string; url: string }[] = []
