// middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// Note: This resets when the server restarts
// For production, use Redis or a database
const rateLimitStore: Record<string, { count: number, timestamp: number }> = {};

// Configuration
const RATE_LIMIT = {
  // Default: 60 requests per minute
  DEFAULT_LIMIT: 60,
  DEFAULT_WINDOW: 60 * 1000, // 1 minute in ms
  
  // Uploads: 20 per hour
  UPLOAD_LIMIT: 20,
  UPLOAD_WINDOW: 60 * 60 * 1000, // 1 hour in ms
};

/**
 * Rate limiting middleware for API routes
 */
export function rateLimit(req: NextRequest, res: NextResponse) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Get client IP
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const path = req.nextUrl.pathname;
  
  // Different limits for different endpoints
  const isImageUpload = path.includes('/api/units') && path.includes('/images') && req.method === 'POST';
  
  const limit = isImageUpload ? RATE_LIMIT.UPLOAD_LIMIT : RATE_LIMIT.DEFAULT_LIMIT;
  const window = isImageUpload ? RATE_LIMIT.UPLOAD_WINDOW : RATE_LIMIT.DEFAULT_WINDOW;
  
  // Create a key that includes the path type
  const key = `${ip}:${isImageUpload ? 'upload' : 'api'}`;
  const now = Date.now();
  
  // Initialize or reset if window has passed
  if (!rateLimitStore[key] || (now - rateLimitStore[key].timestamp) > window) {
    rateLimitStore[key] = { count: 1, timestamp: now };
    return NextResponse.next();
  }
  
  // Increment request count
  rateLimitStore[key].count++;
  
  // Check if over limit
  if (rateLimitStore[key].count > limit) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimitStore[key].timestamp + window - now) / 1000)
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitStore[key].timestamp + window - now) / 1000).toString()
        }
      }
    );
  }
  
  return NextResponse.next();
}

// Helper to apply rate limiting to specific routes
export function withRateLimit(handler: (req: NextRequest) => NextResponse | Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const res = rateLimit(req, NextResponse.next());
    
    // If rate limit response, return it
    if (res.status === 429) {
      return res;
    }
    
    // Otherwise, continue to handler
    return handler(req);
  };
}