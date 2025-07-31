// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

async function validateAdminSession() {
  const supabase = getServiceSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  // Check if user is admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (userError) {
    return { error: userError.message, status: 500 };
  }
  
  if (userData.role !== 'admin') {
    return { error: 'Admin privileges required', status: 403 };
  }
  
  return { session, userId: session.user.id };
}

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Validate admin session
    const sessionResult = await validateAdminSession();
    if ('error' in sessionResult) {
      return NextResponse.json(
        { error: sessionResult.error },
        { status: sessionResult.status }
      );
    }
    
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
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

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Validate admin session
    const sessionResult = await validateAdminSession();
    if ('error' in sessionResult) {
      return NextResponse.json(
        { error: sessionResult.error },
        { status: sessionResult.status }
      );
    }
    
    const supabase = getServiceSupabase();
    const body = await request.json();
    
    // Update password if provided
    if (body.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { password: body.password }
      );
      
      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }
    
    // Update email if provided
    if (body.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { email: body.email }
      );
      
      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
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

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Validate admin session
    const sessionResult = await validateAdminSession();
    if ('error' in sessionResult) {
      return NextResponse.json(
        { error: sessionResult.error },
        { status: sessionResult.status }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Delete the auth user first
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    
    // Delete the user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}