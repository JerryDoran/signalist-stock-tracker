'use server';

import { getDateRange } from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface FinnhubArticle {
  id?: string;
  url?: string;
  headline?: string;
  summary?: string;
  image?: string;
  source?: string;
  category?: string;
  datetime?: number;
}

interface FormattedArticle {
  id: string;
  headline: string;
  summary: string;
  image: string | null;
  source: string;
  url: string;
  datetime: number;
}

async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> {
  const cacheOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (revalidateSeconds !== undefined) {
    cacheOptions.cache = 'force-cache';
    cacheOptions.next = { revalidate: revalidateSeconds };
  } else {
    cacheOptions.cache = 'no-store';
  }

  const response = await fetch(url, cacheOptions);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function validateArticle(article: FinnhubArticle): boolean {
  return !!(
    (article.headline || article.url) &&
    article.source &&
    article.datetime
  );
}

function formatArticle(article: FinnhubArticle): FormattedArticle {
  return {
    id: article.id || article.url || `${Date.now()}-${Math.random()}`,
    headline: article.headline || 'No headline',
    summary: article.summary || '',
    image: article.image || null,
    source: article.source || 'Unknown',
    url: article.url || '',
    datetime: article.datetime || 0,
  };
}

export async function getNews(symbols?: string[]): Promise<FormattedArticle[]> {
  try {
    if (!FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not set');
    }

    const { from, to } = getDateRange(5);

    // If symbols provided, fetch company news with round-robin
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      if (cleanedSymbols.length === 0) {
        return [];
      }

      const articles: FormattedArticle[] = [];
      const dedupeIds = new Set<string>();

      // Round-robin through symbols, max 6 iterations
      for (let round = 0; round < 6; round++) {
        const symbol = cleanedSymbols[round % cleanedSymbols.length];

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
          const data = await fetchJSON<FinnhubArticle[]>(url, 3600); // Cache for 1 hour

          // Find one valid article from this symbol
          let foundArticle = false;
          for (const article of data) {
            if (validateArticle(article)) {
              const dedupeKey = article.id || article.url || article.headline;
              if (dedupeKey && !dedupeIds.has(dedupeKey)) {
                articles.push(formatArticle(article));
                dedupeIds.add(dedupeKey);
                foundArticle = true;
                break;
              }
            }
          }

          if (!foundArticle && articles.length >= 6) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching news for symbol ${symbol}:`, error);
          continue;
        }

        if (articles.length >= 6) {
          break;
        }
      }

      // Sort by datetime descending
      articles.sort((a, b) => b.datetime - a.datetime);
      return articles.slice(0, 6);
    }

    // Fallback to general market news
    try {
      const url = `${FINNHUB_BASE_URL}/news?category=general&minId=0&token=${FINNHUB_API_KEY}`;
      const data = await fetchJSON<FinnhubArticle[]>(url, 3600);

      const dedupeSet = new Set<string>();
      const articles: FormattedArticle[] = [];

      for (const article of data) {
        if (validateArticle(article)) {
          const dedupeKey = article.id || article.url || article.headline;
          if (dedupeKey && !dedupeSet.has(dedupeKey)) {
            articles.push(formatArticle(article));
            dedupeSet.add(dedupeKey);

            if (articles.length >= 6) {
              break;
            }
          }
        }
      }

      articles.sort((a, b) => b.datetime - a.datetime);
      return articles;
    } catch (error) {
      console.error('Error fetching general news:', error);
      throw new Error('Failed to fetch news');
    }
  } catch (error) {
    console.error('Error in getNews:', error);
    throw new Error('Failed to fetch news');
  }
}
