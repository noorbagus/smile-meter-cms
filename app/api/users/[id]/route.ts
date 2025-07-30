// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
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
    const supabase = getServiceSupabase();
    const body = await request.json();
    
    // Start a transaction (simplified version)
    let updateSuccessful = true;
    
    // Update password if provided
    if (body.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { password: body.password }
      );
      
      if (authError) {
        updateSuccessful = false;
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }
    
    // Update email if provided (requires auth update too)
    if (body.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId, 
        { email: body.email }
      );
      
      if (authError) {
        updateSuccessful = false;
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    if (updateSuccessful) {
      const updateData: any = {};
      
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      updateData.updated_at = new Date().toISOString();
      
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
    }
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