import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';

dotenv.config();

const app = express();
// Fix: Use Render's provided PORT, fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

console.log('🚀 Starting Zen Chat Backend...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT} (from ${process.env.PORT ? 'ENV' : 'default'})`);

const allowedOriginsProd = [
  process.env.FRONTEND_URL,
  process.env.YOUR_SITE_URL,
  'https://zenchat.parasbuilds.tech',
].filter((origin): origin is string => typeof origin === 'string');

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? allowedOriginsProd
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: PORT,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Zen Chat API',
    status: 'running',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      models: '/api/chat/models',
      search: '/api/search'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: ['/health', '/api/chat', '/api/search']
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Global error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.statusCode || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📡 API base: http://${HOST}:${PORT}/api`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('📴 Received shutdown signal, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
