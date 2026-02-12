/**
 * Content Parser — Extract content from HTML.
 * Ported from OneCrawl (github.com/g97iulio1609/onecrawl).
 * Pure string manipulation — fully compatible with React Native.
 */

export interface Link {
  href: string;
  text: string;
  rel?: string;
}

export interface ExtractedMedia {
  images: { src: string; alt: string }[];
  videos: { src: string; type?: string }[];
}

export interface Metadata {
  title?: string;
  description?: string;
  author?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/** Remove HTML tags and get plain text */
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simple HTML to Markdown conversion */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]+src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract links from HTML */
export function extractLinks(html: string, baseUrl: string): Link[] {
  const links: Link[] = [];
  const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1] || '';
    const text = htmlToText(match[2] || '');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

    const resolvedHref = href.startsWith('http')
      ? href
      : href.startsWith('//')
        ? `https:${href}`
        : new URL(href, baseUrl).href;

    links.push({ href: resolvedHref, text });
  }

  return links;
}

/** Extract media (images, videos) from HTML */
export function extractMedia(html: string, baseUrl: string): ExtractedMedia {
  const images: { src: string; alt: string }[] = [];
  const videos: { src: string; type?: string }[] = [];

  const imgRegex = /<img[^>]+src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1] || '';
    if (src) {
      images.push({
        src: src.startsWith('http') ? src : new URL(src, baseUrl).href,
        alt: match[2] || '',
      });
    }
  }

  const videoRegex = /<(?:video|source)[^>]+src="([^"]*)"[^>]*(?:type="([^"]*)")?[^>]*\/?>/gi;
  while ((match = videoRegex.exec(html)) !== null) {
    const src = match[1] || '';
    if (src) {
      videos.push({
        src: src.startsWith('http') ? src : new URL(src, baseUrl).href,
        type: match[2],
      });
    }
  }

  return { images, videos };
}

/** Extract metadata from HTML */
export function extractMetadata(html: string): Metadata {
  const meta: Metadata = {};

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) meta.title = htmlToText(titleMatch[1] || '');

  const metaRegex = /<meta[^>]+(?:name|property)="([^"]*)"[^>]+content="([^"]*)"[^>]*\/?>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const name = (match[1] || '').toLowerCase();
    const content = match[2] || '';
    switch (name) {
      case 'description': meta.description = content; break;
      case 'author': meta.author = content; break;
      case 'keywords': meta.keywords = content.split(',').map(k => k.trim()); break;
      case 'og:title': meta.ogTitle = content; break;
      case 'og:description': meta.ogDescription = content; break;
      case 'og:image': meta.ogImage = content; break;
    }
  }

  return meta;
}
