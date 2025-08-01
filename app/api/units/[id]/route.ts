// app/api/units/[id]/route.ts
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

async function checkUnitAccess(supabase: any, unitId: string, userId: string, userRole: string) {
  if (userRole === 'admin') return true;
  
  const { data } = await supabase
    .from('units')
    .select('assigned_manager_id')
    .eq('id', unitId)
    .single();
    
  return data?.assigned_manager_id === userId;
}

// GET /api/units/[id] - Get a single unit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { userId, role, supabase } = authResult;
    
    // Check unit access
    const hasAccess = await checkUnitAccess(supabase, unitId, userId, role);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to access this unit' },
        { status: 403 }
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

    // Transform image data
    const images: Record<string, any> = {};
    if (unit.unit_images) {
      unit.unit_images.forEach((image: any) => {
        if (image.category) {
          images[image.category] = image;
        }
      });
    }

    // Format response
    const formattedUnit = {
      ...unit,
      images,
      manager: (unit.users as any),
      status: 'active',
      users: undefined
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
    
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { userId, role, supabase } = authResult;
    
    // Check unit access
    const hasAccess = await checkUnitAccess(supabase, unitId, userId, role);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to update this unit' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };

    // Only admins can change assigned manager and name
    if (role === 'admin') {
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
    
    // Use consistent server auth validation
    const authResult = await validateServerSession();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { role, supabase } = authResult;

    // Only admins can delete units
    if (role !== 'admin') {
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

    // Delete the unit
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