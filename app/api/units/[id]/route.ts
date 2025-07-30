// app/api/units/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/units/[id] - Get a single unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role and check access permission
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

    // Get unit with images and manager info
    const { data: unit, error } = await supabase
      .from('units')
      .select(`
        *,
        users:assigned_manager_id (
          id,
          email,
          role
        ),
        unit_images (
          id,
          category,
          image_url,
          updated_at,
          updated_by
        )
      `)
      .eq('id', unitId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Check if user has access to this unit
    if (
      userData.role !== 'admin' && 
      unit.assigned_manager_id !== userId
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to access this unit' },
        { status: 403 }
      );
    }

    // Transform image data to a more usable format
    const images: Record<string, any> = {};
    if (unit.unit_images) {
      unit.unit_images.forEach(image => {
        if (image.category) {
          images[image.category] = image;
        }
      });
    }

    // Format response data
    const formattedUnit = {
      ...unit,
      images,
      manager: unit.users,
      status: 'active', // Default status since it's not in the database yet
      users: undefined // Remove the nested users object
    };

    return NextResponse.json(formattedUnit);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/units/[id] - Update a unit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
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

    // Check if unit exists and if user has access
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('assigned_manager_id')
      .eq('id', unitId)
      .single();

    if (unitError) {
      return NextResponse.json(
        { error: unitError.message },
        { status: unitError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    // Only admin can update unit details, or assigned manager can update certain fields
    if (
      userData.role !== 'admin' &&
      unit.assigned_manager_id !== userId
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to update this unit' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };

    // Only admins can change the assigned manager and name
    if (userData.role === 'admin') {
      if (body.name !== undefined) updateData.name = body.name;
      if (body.assigned_manager_id !== undefined) {
        updateData.assigned_manager_id = body.assigned_manager_id || null;
      }
    }

    // Update unit
    const { data, error } = await supabase
      .from('units')
      .update(updateData)
      .eq('id', unitId)
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

// DELETE /api/units/[id] - Delete a unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete units
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
        { error: 'Only administrators can delete units' },
        { status: 403 }
      );
    }

    // Delete associated images first
    const { error: imagesError } = await supabase
      .from('unit_images')
      .delete()
      .eq('unit_id', unitId);

    if (imagesError) {
      return NextResponse.json(
        { error: imagesError.message },
        { status: 500 }
      );
    }

    // Then delete the unit
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

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