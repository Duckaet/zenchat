// API Request/Response Types
export interface WebSearchRequest {
  query: string;
  maxResults?: number;
  freshness?: 'pw' | 'pm' | 'py'; // past week, month, year
}

export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  publishedDate?: string;
}

export interface WebSearchResponse {
  success: boolean;
  results: WebSearchResult[];
  query: string;
  resultCount: number;
  searchTime: number;
  error?: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  needsSearch?: boolean;
  searchQuery?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  searchContext?: WebSearchResponse;
}
