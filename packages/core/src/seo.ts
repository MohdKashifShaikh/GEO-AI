import type { Resource } from './types';

/**
 * SeoGenerator — generates meta tags, Link header, and JSON-LD
 * structured data for AI search engine discoverability.
 */
export class SeoGenerator {
  private readonly siteUrl: string;
  private readonly siteName: string;
  private readonly llmsUrl: string;
  private readonly llmsFullUrl: string;

  constructor(config: { siteUrl: string; siteName: string }) {
    // Strip trailing slash for consistent URL construction
    this.siteUrl = config.siteUrl.replace(/\/+$/, '');
    this.siteName = config.siteName;
    this.llmsUrl = `${this.siteUrl}/llms.txt`;
    this.llmsFullUrl = `${this.siteUrl}/llms-full.txt`;
  }

  /**
   * Generate HTML meta tags pointing to llms.txt and llms-full.txt.
   *
   * Returns:
   *   <meta name="llms" content="{siteUrl}/llms.txt">
   *   <meta name="llms-full" content="{siteUrl}/llms-full.txt">
   */
  generateMetaTags(): string {
    return [
      `<meta name="llms" content="${this.llmsUrl}">`,
      `<meta name="llms-full" content="${this.llmsFullUrl}">`,
    ].join('\n');
  }

  /**
   * Generate HTTP Link header value for AI content index.
   *
   * Returns: <{siteUrl}/llms.txt>; rel="ai-content-index"; type="text/plain"
   */
  generateLinkHeader(): string {
    return `<${this.llmsUrl}>; rel="ai-content-index"; type="text/plain"`;
  }

  /**
   * Generate JSON-LD structured data.
   *
   * - No resource: WebSite with ReadAction pointing to llms.txt
   * - Resource with type 'product': Product schema
   * - Resource with any other type: Article schema
   */
  generateJsonLd(resource?: Resource & { type?: string }): object {
    if (!resource) {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: this.siteName,
        url: this.siteUrl,
        potentialAction: {
          '@type': 'ReadAction',
          target: this.llmsUrl,
          name: 'AI Content Index',
        },
      };
    }

    const schemaType = resource.type === 'product' ? 'Product' : 'Article';

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: resource.title,
      url: resource.url,
    };

    if (resource.description) {
      jsonLd.description = resource.description;
    }

    if (resource.keywords) {
      jsonLd.keywords = resource.keywords;
    }

    return jsonLd;
  }
}
