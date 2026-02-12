/**
 * Search Tools — AI SDK tool definitions for web search and scraping.
 * These tools are automatically available to all AI Provider conversations.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { FetchScraper } from './FetchScraper';
import { SearchEngine } from './SearchEngine';

const scraper = new FetchScraper();
const searchEngine = new SearchEngine(scraper);

/**
 * Build web search + scrape tools for AI SDK streamText.
 * These enable the AI to autonomously search the web when needed.
 */
export function buildSearchTools() {
  return {
    web_search: tool({
      description: 'Search the web using DuckDuckGo, Google, or Bing. Use this when the user asks a question that requires up-to-date information, current events, or facts you\'re unsure about.',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
        engine: z.enum(['duckduckgo', 'google', 'bing']).default('duckduckgo').describe('Search engine to use'),
        maxResults: z.number().min(1).max(20).default(5).describe('Number of results to return'),
      }),
      execute: async ({ query, engine, maxResults }: { query: string; engine: string; maxResults: number }) => {
        const results = await searchEngine.search(query, {
          engine: engine as 'duckduckgo' | 'google' | 'bing',
          maxResults,
        });

        return {
          query: results.query,
          results: results.results.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet || '',
          })),
          searchTime: results.searchTime,
        };
      },
    }),

    read_webpage: tool({
      description: 'Read and extract content from a webpage URL. Returns the page title, text content, and metadata. Use this to get detailed information from a specific URL found via web_search.',
      inputSchema: z.object({
        url: z.string().url().describe('The URL to read'),
        maxLength: z.number().min(500).max(50000).default(10000).describe('Maximum content length to return'),
      }),
      execute: async ({ url, maxLength }: { url: string; maxLength: number }) => {
        const result = await scraper.scrape(url, {
          extractMetadata: true,
          maxContentLength: maxLength,
        });

        return {
          title: result.title,
          url: result.url,
          content: result.content,
          description: result.metadata?.description || '',
          loadTime: result.loadTime,
        };
      },
    }),
  };
}
