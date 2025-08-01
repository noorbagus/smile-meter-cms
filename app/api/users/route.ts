// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Consistent server-side auth validation
async function validateServerSession() {
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
  
  if (error || !session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (userError) {
    return { error: userError.message, status: 500 };
  }
  
  return { 
    session, 
    userId: session.user.id, 
    role: userData.role,
    supabase 
  };
}

async function validateAdminAccess(authResult: any) {
  if ('error' in authResult) {
    return authResult;
  }
  
  if (authResult.role !== 'admin') {
    return { error: 'Admin privileges required', status: 403 };
  }
  
  return authResult;
}

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    const adminCheck = await validateAdminAccess(authResult);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    
    const { supabase } = adminCheck;
    
    // Get query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    
    // Build query
    let query = supabase
      .from('users')
      .select('id, email, role');
    
    // Apply filters if provided
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    const adminCheck = await validateAdminAccess(authResult);
    if ('error' in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    
    const { supabase } = adminCheck;
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Create the user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: body.email,
        role: body.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}