import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  query?: {
    original: string;
  };
}

export interface WebSearchRequest {
  query: string;
  count?: number;
  freshness?: string;
}

export interface WebSearchResponse {
  success: boolean;
  results: BraveSearchResult[];
  query: string;
  resultCount: number;
  searchTime: number;
}

export class WebSearchService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY!;
    if (!this.apiKey) {
      throw new AppError('BRAVE_SEARCH_API_KEY is required', 500);
    }
  }

  public async search(request: WebSearchRequest): Promise<WebSearchResponse> {
    const startTime = Date.now();
    const { query, count = 3, freshness = 'pw' } = request;

    try {
     
      const searchUrl = new URL(this.baseUrl);
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append('count', count.toString());
      searchUrl.searchParams.append('freshness', freshness);

      console.log('Brave Search URL:', searchUrl.toString());

      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-Subscription-Token': this.apiKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip'
        }
      });

      if (!response.ok) {
        throw new AppError(`Brave Search API error: ${response.status} ${response.statusText}`, response.status);
      }

      const data: BraveSearchResponse = await response.json();
      console.log(' Brave Search Response:', JSON.stringify(data, null, 2));

   
      const results = data.web?.results?.slice(0, count) || [];
      const searchTime = Date.now() - startTime;

      logger.info('Web search completed', {
        query,
        resultCount: results.length,
        searchTime,
        success: true
      });

      return {
        success: true,
        results,
        query: data.query?.original || query,
        resultCount: results.length,
        searchTime
      };

    } catch (error) {
      const searchTime = Date.now() - startTime;
      
      logger.error('Web search failed', {
        query,
        error: error.message,
        searchTime,
        success: false
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Web search service temporarily unavailable', 503);
    }
  }

  public formatForAI(searchResponse: WebSearchResponse): string {
    const { results, query } = searchResponse;
    
    if (results.length === 0) {
      return `No recent web results found for: "${query}". Please provide a response based on your existing knowledge.`;
    }

    const timestamp = new Date().toISOString();
    const formattedResults = results
      .map((result, index) => 
        `${index + 1}. **${result.title}**\n` +
        `   ${result.description}\n` +
        `   Source: ${result.url}\n` +
        `   ${result.age ? `Published: ${result.age}` : ''}`
      )
      .join('\n\n');

    return `# Current Web Search Results for "${query}"\n` +
           `*Search completed at ${timestamp}*\n\n` +
           `${formattedResults}\n\n` +
           `**Instructions**: Based on these current web search results, provide an accurate and up-to-date response. Reference the sources when appropriate.`;
  }
}
