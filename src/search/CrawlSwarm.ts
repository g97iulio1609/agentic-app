/**
 * CrawlSwarm — Agentic distributed crawling with AI SDK v6.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 * Uses streamText + tools for multi-step agentic crawling.
 * Fully React Native compatible — no Node.js dependencies.
 */

import { streamText, tool, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { FetchScraper } from './FetchScraper';
import { SearchEngine } from './SearchEngine';

export interface PrioritizedUrl {
  url: string;
  priority: number;
  depth: number;
  parentUrl?: string;
  reason?: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  links: string[];
  relevanceScore: number;
}

export interface SwarmConfig {
  model: LanguageModel;
  maxUrls?: number;
  maxDepth?: number;
  allowedDomains?: string[];
  excludePatterns?: RegExp[];
  maxSteps?: number;
}

interface SwarmState {
  queue: PrioritizedUrl[];
  visited: Set<string>;
  results: Map<string, CrawlResult>;
}

export class CrawlSwarm {
  private config: Required<SwarmConfig>;
  private state: SwarmState;
  private scraper = new FetchScraper();
  private searchEngine = new SearchEngine(this.scraper);

  constructor(config: SwarmConfig) {
    this.config = {
      maxUrls: 20,
      maxDepth: 2,
      allowedDomains: [],
      excludePatterns: [],
      maxSteps: 10,
      ...config,
    };

    this.state = {
      queue: [],
      visited: new Set(),
      results: new Map(),
    };
  }

  private shouldCrawl(url: string): boolean {
    try {
      const parsed = new URL(url);

      if (this.config.allowedDomains.length > 0) {
        const domain = parsed.hostname.replace('www.', '');
        if (!this.config.allowedDomains.some(d => domain.includes(d))) return false;
      }

      for (const pattern of this.config.excludePatterns) {
        if (pattern.test(url)) return false;
      }

      if (this.state.visited.size >= this.config.maxUrls) return false;

      return true;
    } catch {
      return false;
    }
  }

  async crawl(
    goal: string,
    options: {
      seedUrls?: string[];
      onProgress?: (status: { visited: number; queued: number; step: string }) => void;
      signal?: AbortSignal;
    } = {},
  ): Promise<{ results: CrawlResult[]; summary: string }> {
    const { seedUrls = [], onProgress, signal } = options;

    for (const url of seedUrls) {
      if (this.shouldCrawl(url)) {
        this.state.queue.push({ url, priority: 10, depth: 0 });
      }
    }

    // Build tools
    const swarmTools = {
      searchWeb: tool({
        description: 'Search the web for URLs related to a query',
        inputSchema: z.object({
          query: z.string().describe('Search query'),
          maxResults: z.number().default(10),
        }),
        execute: async ({ query, maxResults }: { query: string; maxResults: number }) => {
          const result = await this.searchEngine.search(query, { maxResults });
          return result.results.map(r => ({
            url: r.url,
            title: r.title,
            snippet: r.snippet,
          }));
        },
      }),

      scrapeUrl: tool({
        description: 'Scrape content from a URL',
        inputSchema: z.object({
          url: z.string().describe('URL to scrape'),
        }),
        execute: async ({ url }: { url: string }) => {
          if (this.state.visited.has(url)) return { cached: true, url };

          try {
            const response = await this.scraper.scrape(url, {
              extractLinks: true,
              maxContentLength: 5000,
            });
            this.state.visited.add(url);

            const links = response.links?.slice(0, 20).map(l => l.href) ?? [];
            const crawlResult: CrawlResult = {
              url,
              title: response.title,
              content: response.content.slice(0, 5000),
              links,
              relevanceScore: 0.5,
            };

            this.state.results.set(url, crawlResult);

            return {
              title: crawlResult.title,
              contentPreview: crawlResult.content.slice(0, 500),
              linkCount: crawlResult.links.length,
            };
          } catch (error) {
            return { error: (error as Error).message, url };
          }
        },
      }),

      addToQueue: tool({
        description: 'Add URLs to crawl queue with priority',
        inputSchema: z.object({
          urls: z.array(z.object({
            url: z.string(),
            priority: z.number().min(0).max(10),
            reason: z.string().optional(),
          })),
        }),
        execute: async ({ urls }: { urls: Array<{ url: string; priority: number; reason?: string }> }) => {
          let added = 0;
          for (const item of urls) {
            if (!this.shouldCrawl(item.url) || this.state.visited.has(item.url)) continue;
            this.state.queue.push({ url: item.url, priority: item.priority, depth: 0, reason: item.reason });
            added++;
          }
          this.state.queue.sort((a, b) => b.priority - a.priority);
          return { added, queueSize: this.state.queue.length };
        },
      }),

      getStatus: tool({
        description: 'Get current crawl status',
        inputSchema: z.object({}),
        execute: async () => ({
          queueSize: this.state.queue.length,
          visited: this.state.visited.size,
          resultsCount: this.state.results.size,
          nextUrls: this.state.queue.slice(0, 5).map(u => u.url),
        }),
      }),
    };

    const prompt = seedUrls.length > 0
      ? `Goal: ${goal}\n\nSeed URLs: ${seedUrls.join(', ')}\n\nCrawl these URLs and find relevant content. Use searchWeb to find more pages, scrapeUrl to read pages, and addToQueue to prioritize. When done, provide a comprehensive summary.`
      : `Goal: ${goal}\n\nSearch the web and crawl relevant pages to gather information. Use searchWeb to find pages, scrapeUrl to read them, and addToQueue to prioritize. When done, provide a comprehensive summary.`;

    let summary = '';

    try {
      const result = streamText({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        system: `You are a web research agent. Your job is to:
1. Analyze the goal and plan a search strategy
2. Search the web for relevant pages
3. Scrape and read the most relevant pages
4. Synthesize your findings into a comprehensive answer
Be thorough but efficient — prioritize quality over quantity.`,
        tools: swarmTools,
        stopWhen: stepCountIs(this.config.maxSteps),
        abortSignal: signal,
      });

      for await (const part of result.fullStream) {
        if (signal?.aborted) break;
        if (part.type === 'text-delta') {
          summary += part.text;
        }
        if (part.type === 'tool-call') {
          onProgress?.({
            visited: this.state.visited.size,
            queued: this.state.queue.length,
            step: part.toolName,
          });
        }
      }
    } catch (error) {
      if (!signal?.aborted) throw error;
    }

    return {
      results: [...this.state.results.values()],
      summary,
    };
  }

  reset(): void {
    this.state = { queue: [], visited: new Set(), results: new Map() };
  }
}

export function createCrawlSwarm(config: SwarmConfig): CrawlSwarm {
  return new CrawlSwarm(config);
}
