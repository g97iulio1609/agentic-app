/**
 * Search Engine Parsers — Parse HTML results from DDG, Google, Bing.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 */

import { htmlToText } from './content-parser';

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  position: number;
  thumbnailUrl?: string;
}

/** Parse DuckDuckGo HTML lite results */
export function parseDuckDuckGoResults(html: string, maxResults = 10): SearchResult[] {
  const results: SearchResult[] = [];

  const resultRegex =
    /<div class="result[^"]*">[\s\S]*?<a[^>]+href="([^"]*)"[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  let position = 1;

  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1] || '';
    const title = htmlToText(match[2] || '');
    const snippet = htmlToText(match[3] || '');

    if (url && title && !url.includes('duckduckgo.com')) {
      results.push({
        title,
        url: url.startsWith('//') ? `https:${url}` : url,
        snippet,
        position: position++,
      });
    }
  }

  // Alternative parsing for newer DDG format
  if (results.length === 0) {
    const altRegex =
      /<a[^>]+class="result__url"[^>]+href="([^"]*)"[^>]*>[\s\S]*?<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)</gi;

    while ((match = altRegex.exec(html)) !== null && results.length < maxResults) {
      const url = match[1] || '';
      const title = htmlToText(match[2] || '');
      const snippet = htmlToText(match[3] || '');

      if (url && title) {
        results.push({ title, url, snippet, position: position++ });
      }
    }
  }

  return results;
}

/** Parse Google search results */
export function parseGoogleResults(html: string, maxResults = 10): SearchResult[] {
  const results: SearchResult[] = [];
  const resultRegex =
    /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;

  let match;
  let position = 1;

  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1] || '';
    const title = htmlToText(match[2] || '');

    if (url && title && !url.includes('google.com') && !url.includes('youtube.com/results')) {
      results.push({ title, url, position: position++ });
    }
  }

  return results;
}

/** Parse Bing search results */
export function parseBingResults(html: string, maxResults = 10): SearchResult[] {
  const results: SearchResult[] = [];
  const resultRegex =
    /<li class="b_algo"[\s\S]*?<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;

  let match;
  let position = 1;

  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const url = match[1] || '';
    const title = htmlToText(match[2] || '');
    const snippet = htmlToText(match[3] || '');

    if (url && title && !url.includes('bing.com')) {
      results.push({ title, url, snippet, position: position++ });
    }
  }

  return results;
}

/** Parse search results based on engine */
export function parseSearchResults(
  html: string,
  engine: 'google' | 'bing' | 'duckduckgo',
  maxResults = 10,
): SearchResult[] {
  switch (engine) {
    case 'google': return parseGoogleResults(html, maxResults);
    case 'bing': return parseBingResults(html, maxResults);
    case 'duckduckgo':
    default: return parseDuckDuckGoResults(html, maxResults);
  }
}
