import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // JANGAN redirect manual - biarkan AuthProvider handle
      // Redirect ke halaman netral yang akan di-handle AuthProvider
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect ke error page jika verification gagal
  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
}