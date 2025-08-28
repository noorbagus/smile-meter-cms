import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify JWT token for authenticated users
export const verifyJWT = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      return { valid: false, error: 'User profile not found or inactive' };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active
      }
    };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
};

// Verify API key for external unit access
export const verifyApiKey = async (apiKey, unitId = null) => {
  try {
    const query = supabase
      .from('units')
      .select('id, name, api_key, is_active, assigned_cs_id')
      .eq('api_key', apiKey)
      .eq('is_active', true);

    if (unitId) {
      query.eq('id', unitId);
    }

    const { data: unit, error } = await query.single();

    if (error || !unit) {
      return { valid: false, error: 'Invalid API key or unit not found' };
    }

    return {
      valid: true,
      unit: {
        id: unit.id,
        name: unit.name,
        assigned_cs_id: unit.assigned_cs_id
      }
    };
  } catch (error) {
    return { valid: false, error: 'API key verification failed' };
  }
};

// Middleware wrapper for API routes
export const withAuth = (handler, options = {}) => {
  return async (req, res) => {
    const { requireRole, allowApiKey = false, unitIdParam = 'id' } = options;

    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Missing or invalid authorization header',
          code: 'MISSING_AUTH_HEADER'
        });
      }

      const token = authHeader.substring(7);
      let authResult;

      // Try API key authentication first if allowed
      if (allowApiKey) {
        const unitId = req.query[unitIdParam];
        authResult = await verifyApiKey(token, unitId);
        
        if (authResult.valid) {
          req.unit = authResult.unit;
          req.authType = 'api_key';
          return handler(req, res);
        }
      }

      // Try JWT authentication
      authResult = await verifyJWT(token);
      
      if (!authResult.valid) {
        return res.status(401).json({ 
          error: authResult.error,
          code: 'INVALID_TOKEN'
        });
      }

      req.user = authResult.user;
      req.authType = 'jwt';

      // Check role requirements
      if (requireRole && req.user.role !== requireRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required_role: requireRole,
          user_role: req.user.role
        });
      }

      return handler(req, res);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Authentication service error',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };
};

// Admin-only middleware
export const withAdminAuth = (handler) => {
  return withAuth(handler, { requireRole: 'admin' });
};

// CS-only middleware  
export const withCSAuth = (handler) => {
  return withAuth(handler, { requireRole: 'customer_service' });
};

// Unit API middleware (API key only)
export const withUnitAuth = (handler) => {
  return withAuth(handler, { allowApiKey: true });
};

// Check if user can access unit (admin can access all, CS only assigned unit)
export const canAccessUnit = async (user, unitId) => {
  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role === 'customer_service') {
    const { data: unit, error } = await supabase
      .from('units')
      .select('assigned_cs_id')
      .eq('id', unitId)
      .single();

    if (error || !unit) {
      return { allowed: false, error: 'Unit not found' };
    }

    if (unit.assigned_cs_id !== user.id) {
      return { 
        allowed: false, 
        error: 'Access denied: not assigned to this unit' 
      };
    }

    return { allowed: true };
  }

  return { allowed: false, error: 'Invalid user role' };
};

// Validate stock operation permissions
export const validateStockOperation = async (user, unitId, operation) => {
  const unitAccess = await canAccessUnit(user, unitId);
  
  if (!unitAccess.allowed) {
    return unitAccess;
  }

  // Admin can perform all operations
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // CS can only reduce stock
  if (user.role === 'customer_service') {
    if (operation === 'reduce') {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      error: 'CS can only reduce stock quantities' 
    };
  }

  return { allowed: false, error: 'Invalid user role' };
};

// Rate limiting for API endpoints
const rateLimitStore = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const now = Date.now();
    
    if (!rateLimitStore.has(identifier)) {
      rateLimitStore.set(identifier, { requests: 1, resetTime: now + windowMs });
      return next();
    }

    const data = rateLimitStore.get(identifier);
    
    if (now > data.resetTime) {
      rateLimitStore.set(identifier, { requests: 1, resetTime: now + windowMs });
      return next();
    }

    if (data.requests >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }

    data.requests++;
    next();
  };
};

// Log authentication events
export const logAuthEvent = async (event, details = {}) => {
  try {
    const logData = {
      event,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || null,
      user_agent: details.userAgent || null
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Event:', logData);
    }

    // In production, you might want to log to a database table
    // await supabase.from('auth_logs').insert(logData);
    
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
};

export default {
  withAuth,
  withAdminAuth,
  withCSAuth,
  withUnitAuth,
  verifyJWT,
  verifyApiKey,
  canAccessUnit,
  validateStockOperation,
  rateLimit,
  logAuthEvent
};