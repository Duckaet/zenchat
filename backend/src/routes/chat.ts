import express, { Request, Response } from 'express';
import { OpenRouterService } from '../services/llm/openrouter';
import { WebSearchService } from '../services/websearch';
import { chatRateLimit } from '../middleware/rateLimit';
import { handleAsyncError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();
const openRouterService = new OpenRouterService();
const searchService = new WebSearchService();

const FREE_MODELS = [
  { 
    id: 'meta-llama/llama-3.1-8b-instruct:free', 
    name: 'Llama 3.1 8B', 
    provider: 'Meta' 
  },
  { 
    id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', 
    name: 'DeepSeek R1', 
    provider: 'DeepSeek' 
  },
  { 
    id: 'google/gemma-3n-e4b-it:free', 
    name: 'gemma', 
    provider: 'goggle' 
  }
];

// Apply rate limiting to chat completion
router.post('/completion', chatRateLimit, handleAsyncError(async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  
  try {
    const { messages, model, needsSearch, searchQuery } = req.body;

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    logger.info('Chat completion request', { 
      model, 
      needsSearch, 
      searchQuery: searchQuery ? `"${searchQuery}"` : 'none',
      messageCount: messages.length,
      ip: req.ip 
    });

    let enhancedMessages = messages;

    // Handle web search if requested
    if (needsSearch && searchQuery) {
      try {
        logger.info('Starting web search', { query: searchQuery });
        
        const searchResults = await searchService.search({ 
          query: searchQuery,
          count: 3,
          freshness: 'pw'
        });
        
        logger.info('Search completed', { 
          resultCount: searchResults.resultCount,
          searchTime: searchResults.searchTime 
        });
        
        if (searchResults.resultCount > 0) {
          const searchContext = searchService.formatForAI(searchResults);
          
          enhancedMessages = [
            ...messages.slice(0, -1), 
            {
              role: 'system',
              content: searchContext
            },
            messages[messages.length - 1] 
          ];
        }
        
      } catch (searchError) {
        logger.error('Search failed', { 
          error: searchError instanceof Error ? searchError.message : String(searchError),
        });
        // Continue without search context
      }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    logger.info('Starting AI response', { model });

    // Stream the response
    await openRouterService.streamCompletion(enhancedMessages, model, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
    
    const totalTime = Date.now() - startTime;
    logger.info('Chat completion finished', { 
      model, 
      totalTime,
      success: true 
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error('Chat completion error', { 
      error: error instanceof Error ? error.message : String(error),
      model: req.body.model,
      totalTime 
    });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate response',
        message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Internal server error'
      });
      return;
    }
    return;
  }
  return;
}));

router.get('/models', (req: Request, res: Response) => {
  res.json({ 
    models: FREE_MODELS,
    count: FREE_MODELS.length,
    timestamp: new Date().toISOString()
  });
});

export default router;
