import { Request, Response, NextFunction } from 'express';

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: In a production environment with multiple instances, use Redis or similar.
const store = new Map<string, RateLimitData>();

const LIMIT = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function musicRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Get IP address (handle proxies if behind Nginx/Load Balancer)
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const data = store.get(ip);

  // If no data or window expired, reset
  if (!data || now > data.resetTime) {
    store.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return next();
  }

  // Check limit
  if (data.count >= LIMIT) {
    const resetDate = new Date(data.resetTime).toLocaleTimeString();
    console.warn(`[Rate Limit] IP ${ip} exceeded daily limit of ${LIMIT}`);
    
    // Explicitly cast to any to avoid TypeScript return type conflict with void/Response
    return res.status(429).json({
      error: `Daily music recognition limit reached (${LIMIT}/day). Limit resets at ${resetDate}.`
    }) as any;
  }

  // Increment count
  data.count++;
  store.set(ip, data); // Update map (not strictly necessary for object reference, but good practice)
  
  // Clean up old entries periodically (optional optimization)
  // if (store.size > 10000) cleanupStore(); 

  next();
}
