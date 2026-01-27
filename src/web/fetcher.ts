import { FetchOptions, FetchResult, WebConfig } from '../types';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

/**
 * Web content fetcher - fetches and parses web pages
 */
export class WebFetcher {
  private config: WebConfig;
  private turndown: TurndownService;

  constructor(config: WebConfig = {}) {
    this.config = {
      userAgent:
        config.userAgent ||
        'Mozilla/5.0 (compatible; GroqRAG/1.0; +https://github.com/mithun50/groq-rag)',
      timeout: config.timeout || 30000,
      maxContentLength: config.maxContentLength || 1000000, // 1MB
      followRedirects: config.followRedirects ?? true,
      proxy: config.proxy,
    };

    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Add rules for better markdown conversion
    this.turndown.addRule('removeScripts', {
      filter: ['script', 'style', 'noscript', 'iframe'],
      replacement: () => '',
    });

    this.turndown.addRule('preserveCode', {
      filter: 'pre',
      replacement: (content, node) => {
        const code = (node as unknown as { textContent: string }).textContent || content;
        return `\n\`\`\`\n${code}\n\`\`\`\n`;
      },
    });
  }

  /**
   * Truncate content to specified limit
   */
  private truncateContent(content: string, maxLength?: number): string {
    if (!maxLength || content.length <= maxLength) return content;
    return content.slice(0, maxLength - 3) + '...';
  }

  /**
   * Calculate max length from options (maxContentLength or maxTokens)
   */
  private getMaxLength(options: FetchOptions): number | undefined {
    const { maxContentLength, maxTokens } = options;
    if (maxContentLength) return maxContentLength;
    if (maxTokens) return maxTokens * 4; // ~4 chars per token estimate
    return undefined;
  }

  /**
   * Fetch a URL and extract content
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const {
      headers = {},
      timeout = this.config.timeout,
      extractText = true,
      includeLinks = false,
      includeImages = false,
    } = options;

    const maxLength = this.getMaxLength(options);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent!,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          ...headers,
        },
        redirect: this.config.followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      clearTimeout(timeoutId);

      // Parse HTML
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, noscript, iframe, nav, footer, aside, .ads, .advertisement').remove();

      // Extract title
      const title = $('title').text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        undefined;

      // Extract metadata
      const metadata = {
        description:
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          undefined,
        author:
          $('meta[name="author"]').attr('content') ||
          $('meta[property="article:author"]').attr('content') ||
          undefined,
        publishedDate:
          $('meta[property="article:published_time"]').attr('content') ||
          $('time').attr('datetime') ||
          undefined,
      };

      // Extract main content
      let content = '';
      let markdown = '';

      if (extractText) {
        // Try to find main content area
        const mainSelectors = [
          'main',
          'article',
          '[role="main"]',
          '.content',
          '.post-content',
          '.article-content',
          '.entry-content',
          '#content',
          '#main',
        ];

        let mainHtml = $('body').html() || '';
        let mainText = $('body').text();

        for (const selector of mainSelectors) {
          const selected = $(selector);
          if (selected.length > 0) {
            mainHtml = selected.first().html() || mainHtml;
            mainText = selected.first().text();
            break;
          }
        }

        markdown = this.turndown.turndown(mainHtml);
        content = mainText.replace(/\s+/g, ' ').trim();
      }

      // Extract links if requested
      let links: Array<{ text: string; href: string }> | undefined;
      if (includeLinks) {
        links = [];
        $('a[href]').each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          const text = $el.text().trim();
          if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
            try {
              const absoluteUrl = new URL(href, url).toString();
              links!.push({ text, href: absoluteUrl });
            } catch {
              // Invalid URL, skip
            }
          }
        });
        // Deduplicate
        links = [...new Map(links.map(l => [l.href, l])).values()];
      }

      // Extract images if requested
      let images: Array<{ alt: string; src: string }> | undefined;
      if (includeImages) {
        images = [];
        $('img[src]').each((_, el) => {
          const $el = $(el);
          const src = $el.attr('src');
          const alt = $el.attr('alt') || '';
          if (src) {
            try {
              const absoluteUrl = new URL(src, url).toString();
              images!.push({ alt, src: absoluteUrl });
            } catch {
              // Invalid URL, skip
            }
          }
        });
      }

      return {
        url,
        title,
        content: this.truncateContent(content, maxLength),
        markdown: markdown ? this.truncateContent(markdown, maxLength) : undefined,
        links,
        images,
        metadata,
        fetchedAt: new Date(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch multiple URLs in parallel
   */
  async fetchMany(
    urls: string[],
    options: FetchOptions = {}
  ): Promise<Array<FetchResult | Error>> {
    const results = await Promise.allSettled(
      urls.map(url => this.fetch(url, options))
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return new Error(`Failed to fetch ${urls[i]}: ${result.reason}`);
      }
    });
  }

  /**
   * Fetch and extract just the text content
   */
  async fetchText(url: string): Promise<string> {
    const result = await this.fetch(url, { extractText: true });
    return result.content;
  }

  /**
   * Fetch and convert to markdown
   */
  async fetchMarkdown(url: string): Promise<string> {
    const result = await this.fetch(url, { extractText: true });
    return result.markdown || result.content;
  }
}

/**
 * Create a web fetcher with default config
 */
export function createFetcher(config?: WebConfig): WebFetcher {
  return new WebFetcher(config);
}
