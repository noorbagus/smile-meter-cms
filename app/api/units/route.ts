// app/api/units/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/units - Get all units with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const managerId = url.searchParams.get('managerId');

    // Get user role from session
    const userId = session.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

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
    if (userData.role !== 'admin') {
      query = query.eq('assigned_manager_id', userId);
    } 
    // For admin with managerId filter
    else if (managerId) {
      query = query.eq('assigned_manager_id', managerId);
    }

    // Execute query
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
      status: 'active', // Default status since it's not in the database yet
      assigned_manager_id: unit.assigned_manager_id,
      created_at: unit.created_at,
      updated_at: unit.updated_at,
      manager_name: unit.users?.email || null
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
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userId = session.user.id;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create units' },
        { status: 403 }
      );
    }

    // Parse request body
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