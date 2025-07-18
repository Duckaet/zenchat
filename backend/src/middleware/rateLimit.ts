import rateLimit from 'express-rate-limit';

export const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: {
    error: 'Too many chat requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: {
    error: 'Too many search requests, please try again later.',
  },
});