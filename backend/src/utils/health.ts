import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        openrouter: 'unknown',
        search: 'unknown'
      }
    };

    // Test database connection
    try {
      const { error } = await supabase.from('chats').select('id').limit(1);
      health.services.database = error ? 'down' : 'up';
    } catch {
      health.services.database = 'down';
    }

    // Test OpenRouter
    health.services.openrouter = process.env.OPENROUTER_API_KEY ? 'configured' : 'missing';
    
    // Test Search
    health.services.search = process.env.BRAVE_SEARCH_API_KEY ? 'configured' : 'missing';

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;