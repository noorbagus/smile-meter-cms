// app/api/units/[id]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { validateImageFile } from '@/lib/image-utils';

// Upload image for a specific unit and category
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const category = formData.get('category') as string;
    const userId = formData.get('userId') as string;
    
    // Validate image
    const validation = validateImageFile(image);
    if (!validation.valid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 });
    }
    
    // Upload to Supabase Storage
    const supabase = getServiceSupabase();
    const fileExt = image.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `units/${unitId}/${category}/${fileName}`;
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('unit-images')
      .upload(filePath, image);
    
    if (storageError) {
      return NextResponse.json({ 
        success: false, 
        error: storageError.message 
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('unit-images')
      .getPublicUrl(filePath);
    
    // Save to database
    const { data: existingImage } = await supabase
      .from('unit-images')
      .select('id')
      .eq('unit_id', unitId)
      .eq('category', category)
      .single();
    
    let result;
    
    if (existingImage) {
      // Update existing image
      const { data, error: dbError } = await supabase
        .from('unit-images')
        .update({
          image_url: publicUrl,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingImage.id)
        .select()
        .single();
      
      if (dbError) {
        return NextResponse.json({ 
          success: false, 
          error: dbError.message 
        }, { status: 500 });
      }
      
      result = data;
    } else {
      // Insert new image
      const { data, error: dbError } = await supabase
        .from('unit-images')
        .insert({
          unit_id: unitId,
          category,
          image_url: publicUrl,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (dbError) {
        return NextResponse.json({ 
          success: false, 
          error: dbError.message 
        }, { status: 500 });
      }
      
      result = data;
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to upload image'
    }, { status: 500 });
  }
}

// GET images for a specific unit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = params.id;
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('unit-images')
      .select('*')
      .eq('unit_id', unitId);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch images'
    }, { status: 500 });
  }
}