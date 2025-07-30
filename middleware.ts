// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  if (!session) {
    // If the user is not authenticated and tries to access a protected route
    const isProtectedRoute = !req.nextUrl.pathname.startsWith('/login');
    
    if (isProtectedRoute) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // If the user is authenticated and tries to access login page
    if (req.nextUrl.pathname.startsWith('/login')) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

// Add the paths that should be checked by the middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}