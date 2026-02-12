/**
 * SearchEngine — Web search using fetch-based scraping.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 */

import { FetchScraper } from './FetchScraper';
import { buildSearchUrl } from './url-builder';
import { parseSearchResults, type SearchResult } from './search-parsers';

export interface SearchResults {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

export interface SearchOptions {
  engine?: 'google' | 'bing' | 'duckduckgo';
  type?: 'web' | 'image' | 'video' | 'news';
  maxResults?: number;
  lang?: string;
  region?: string;
}

export class SearchEngine {
  private scraper: FetchScraper;

  constructor(scraper?: FetchScraper) {
    this.scraper = scraper || new FetchScraper();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const {
      engine = 'duckduckgo',
      type = 'web',
      maxResults = 10,
      lang,
      region,
    } = options;

    const startTime = Date.now();
    const searchUrl = buildSearchUrl(query, engine, type, { lang, region });

    const response = await this.scraper.scrape(searchUrl, {
      timeout: 15000,
      extractMetadata: false,
      extractLinks: false,
      cache: false,
    });

    const results = parseSearchResults(
      response.html || response.content,
      engine,
      maxResults,
    );

    return {
      query,
      results,
      totalResults: results.length,
      searchTime: Date.now() - startTime,
    };
  }
}
