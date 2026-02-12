/**
 * URL Builder — Search engine URL construction.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 */

interface SearchUrlOptions {
  lang?: string;
  region?: string;
}

/** Build a search engine URL */
export function buildSearchUrl(
  query: string,
  engine: 'google' | 'bing' | 'duckduckgo' = 'duckduckgo',
  type: 'web' | 'image' | 'video' | 'news' = 'web',
  options: SearchUrlOptions = {},
): string {
  const encoded = encodeURIComponent(query);

  switch (engine) {
    case 'google': {
      const base = 'https://www.google.com/search';
      const params = new URLSearchParams({ q: encoded });
      if (type === 'image') params.set('tbm', 'isch');
      if (type === 'video') params.set('tbm', 'vid');
      if (type === 'news') params.set('tbm', 'nws');
      if (options.lang) params.set('hl', options.lang);
      return `${base}?${params.toString()}`;
    }

    case 'bing': {
      const base = 'https://www.bing.com/search';
      const params = new URLSearchParams({ q: encoded });
      if (type === 'image') return `https://www.bing.com/images/search?q=${encoded}`;
      if (type === 'video') return `https://www.bing.com/videos/search?q=${encoded}`;
      if (type === 'news') return `https://www.bing.com/news/search?q=${encoded}`;
      if (options.lang) params.set('setlang', options.lang);
      return `${base}?${params.toString()}`;
    }

    case 'duckduckgo':
    default: {
      // Use HTML lite version for easier parsing
      const params = new URLSearchParams({ q: encoded });
      if (type === 'image') return `https://duckduckgo.com/?q=${encoded}&iax=images&ia=images`;
      if (type === 'video') return `https://duckduckgo.com/?q=${encoded}&iax=videos&ia=videos`;
      if (type === 'news') return `https://duckduckgo.com/?q=${encoded}&iar=news&ia=news`;
      if (options.region) params.set('kl', options.region);
      return `https://html.duckduckgo.com/html/?${params.toString()}`;
    }
  }
}
