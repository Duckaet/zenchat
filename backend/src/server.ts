import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import { globalErrorHandler } from './utils/errors';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const HOST = '0.0.0.0'; 


const allowedOriginsProd = [
  process.env.FRONTEND_URL,
  'https://zen-chat-frontend.vercel.app',
  'https://your-custom-domain.com'
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Zen Chat API is running',
    status: 'active',
    endpoints: ['/api/chat', '/api/search', '/health']
  });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: ['/api/chat', '/api/search', '/health']
  });
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Zen Chat API running on ${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;
