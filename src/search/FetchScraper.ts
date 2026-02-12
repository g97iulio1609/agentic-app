/**
 * FetchScraper — Lightweight page scraper using native fetch.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 * Fully React Native compatible — no Node.js dependencies.
 */

import {
  htmlToText,
  htmlToMarkdown,
  extractLinks,
  extractMedia,
  extractMetadata,
  type Link,
  type ExtractedMedia,
  type Metadata,
} from './content-parser';
import { getRandomUserAgent } from './stealth';

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  markdown: string;
  html: string;
  statusCode: number;
  contentType: string;
  loadTime: number;
  links?: Link[];
  media?: ExtractedMedia;
  metadata?: Metadata;
}

export interface ScrapeOptions {
  timeout?: number;
  extractMedia?: boolean;
  extractLinks?: boolean;
  extractMetadata?: boolean;
  cache?: boolean;
  maxContentLength?: number;
}

export class FetchScraper {
  private cache = new Map<string, { data: ScrapeResult; timestamp: number }>();
  private cacheTTL: number;

  constructor(cacheTTL = 30 * 60 * 1000) {
    this.cacheTTL = cacheTTL;
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
    const {
      timeout = 15000,
      extractMedia: shouldExtractMedia = false,
      extractLinks: shouldExtractLinks = false,
      extractMetadata: shouldExtractMetadata = true,
      cache: useCache = true,
      maxContentLength = 50000,
    } = options;

    // Check cache
    if (useCache) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const contentType = response.headers.get('content-type') || '';

      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? htmlToText(titleMatch[1] || '') : '';

      const content = htmlToText(html);

      const result: ScrapeResult = {
        url: response.url,
        title,
        content: content.slice(0, maxContentLength),
        markdown: htmlToMarkdown(html).slice(0, maxContentLength),
        html,
        statusCode: response.status,
        contentType,
        loadTime: Date.now() - startTime,
      };

      if (shouldExtractLinks) {
        result.links = extractLinks(html, url);
      }

      if (shouldExtractMedia) {
        result.media = extractMedia(html, url);
      }

      if (shouldExtractMetadata) {
        result.metadata = extractMetadata(html);
      }

      if (useCache) {
        this.cache.set(url, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async scrapeMany(
    urls: string[],
    options: ScrapeOptions & { concurrency?: number } = {},
  ): Promise<{ results: Map<string, ScrapeResult>; failed: Map<string, Error> }> {
    const { concurrency = 3, ...scrapeOptions } = options;
    const results = new Map<string, ScrapeResult>();
    const failed = new Map<string, Error>();

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const promises = batch.map(async (url) => {
        try {
          const result = await this.scrape(url, scrapeOptions);
          results.set(url, result);
        } catch (error) {
          failed.set(url, error instanceof Error ? error : new Error(String(error)));
        }
      });
      await Promise.all(promises);
    }

    return { results, failed };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
