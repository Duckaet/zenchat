import express from 'express';
import { OpenRouterService } from '../services/llm/openrouter';
import { WebSearchService } from '../services/websearch';

const router = express.Router();
const openRouterService = new OpenRouterService();
const searchService = new WebSearchService();


const FREE_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'google/gemini-flash-1.5:free', name: 'Gemini Flash 1.5', provider: 'Google' },
  { id: 'anthropic/claude-3-haiku:free', name: 'Claude 3 Haiku', provider: 'Anthropic' }
];

router.post('/completion', async (req, res) => {
  try {
    const { messages, model, needsSearch, searchQuery } = req.body;

    console.log('Chat completion request:', { 
      model, 
      needsSearch, 
      searchQuery: searchQuery ? `"${searchQuery}"` : 'none',
      messageCount: messages.length 
    });

    let enhancedMessages = messages;

   
    if (needsSearch && searchQuery) {
      try {
        console.log('Starting web search for:', searchQuery);
        
        const searchResults = await searchService.search({ 
          query: searchQuery,
          count: 3,
          freshness: 'pw'
        });
        
        console.log(`Search completed: ${searchResults.resultCount} results found`);
        
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
          
          console.log('Search context added to messages');
        } else {
          console.log('No search results found, proceeding without search context');
        }
        
      } catch (searchError) {
        console.error('Search failed:', searchError.message);
      }
    }

   
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log(`Starting AI response with model: ${model}`);

    
    await openRouterService.streamCompletion(enhancedMessages, model, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
    
    console.log('Chat completion finished');

  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message,
      model: req.body.model 
    });
  }
});

router.get('/models', (req, res) => {
  res.json({ models: FREE_MODELS });
});

export default router;
