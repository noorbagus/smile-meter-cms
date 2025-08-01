// app/api/units/route.ts
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

// GET /api/units - Get all units with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { userId, role, supabase } = authResult;
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const managerId = url.searchParams.get('managerId');

    // Build query based on user role
    let query = supabase.from('units').select(`
      id,
      name,
      assigned_manager_id,
      created_at,
      updated_at,
      users:assigned_manager_id (
        email
      )
    `);

    // For non-admin users, only show units they manage
    if (role !== 'admin') {
      query = query.eq('assigned_manager_id', userId);
    } 
    // For admin with managerId filter
    else if (managerId) {
      query = query.eq('assigned_manager_id', managerId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data to include manager name and status
    const transformedData = data.map(unit => ({
      id: unit.id,
      name: unit.name,
      status: 'active',
      assigned_manager_id: unit.assigned_manager_id,
      created_at: unit.created_at,
      updated_at: unit.updated_at,
      manager_name: (unit.users as any)?.email || null
    }));

    return NextResponse.json(transformedData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/units - Create a new unit
export async function POST(request: NextRequest) {
  try {
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { role, supabase } = authResult;

    // Only admins can create units
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create units' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Unit name is required' },
        { status: 400 }
      );
    }

    // Create unit
    const { data, error } = await supabase
      .from('units')
      .insert({
        name: body.name,
        assigned_manager_id: body.assigned_manager_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
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