import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * Server-side auth utilities - DO NOT use in client components
 */

export async function getServerSession() {
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getServerUser() {
  const { session } = await getServerSession();
  if (!session) return null;

  const supabase = getServiceSupabase();
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { user: session.user, profile };
}

export async function requireServerAuth() {
  const auth = await getServerUser();
  if (!auth) {
    throw new Error('Authentication required');
  }
  return auth;
}

export async function requireServerAdmin() {
  const auth = await requireServerAuth();
  if (auth.profile?.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return auth;
}