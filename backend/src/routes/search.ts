import express from 'express';
import { WebSearchService } from '../services/websearch';
import { WebSearchRequest } from '../types/api';
import { AppError, handleAsyncError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();
const searchService = new WebSearchService();


router.post('/web', handleAsyncError(async (req: express.Request, res: express.Response) => {
  const startTime = Date.now();
  
  try {
    const { query, maxResults, freshness }: WebSearchRequest = req.body;
    
    // Input validation
    if (!query) {
      throw new AppError('Query parameter is required', 400);
    }

    const searchRequest: WebSearchRequest = {
      query: query.trim(),
      maxResults: maxResults || 3,
      freshness: freshness || 'pw'
    };

    const searchResponse = await searchService.search(searchRequest);
    const formattedContext = searchService.formatForAI(searchResponse);

    const responseTime = Date.now() - startTime;

    logger.info('Search API request completed', {
      query: searchRequest.query,
      resultCount: searchResponse.resultCount,
      responseTime,
      success: true
    });

    return res.status(200).json({
      ...searchResponse,
      context: formattedContext,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Search API request failed', {
      query: req.body.query,
      error: error instanceof Error ? error.message : String(error),
      responseTime,
      success: false
    });

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        context: error.context
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Search service temporarily unavailable'
    });
  }
}));

export default router;
