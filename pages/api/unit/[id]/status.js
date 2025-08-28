import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: unitId } = req.query;
  const authHeader = req.headers.authorization;

  // Validate bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    // Verify unit exists and token matches
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, name, api_key, is_active')
      .eq('id', unitId)
      .eq('api_key', token)
      .eq('is_active', true)
      .single();

    if (unitError || !unit) {
      return res.status(401).json({ error: 'Invalid unit ID or API key' });
    }

    // Get unit stock data with product details
    const { data: stockData, error: stockError } = await supabase
      .from('unit_stock')
      .select(`
        quantity,
        products!inner (
          id,
          name,
          is_active,
          categories (
            name
          )
        )
      `)
      .eq('unit_id', unitId)
      .eq('products.is_active', true);

    if (stockError) {
      console.error('Stock query error:', stockError);
      return res.status(500).json({ error: 'Failed to fetch stock data' });
    }

    // Calculate stock metrics
    const totalStock = stockData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const emptyProducts = stockData?.filter(item => item.quantity === 0).length || 0;
    const criticalProducts = stockData?.filter(item => item.quantity > 0 && item.quantity <= 5).length || 0;
    const availableProducts = stockData?.filter(item => item.quantity > 5).length || 0;

    // Determine unit status
    let status = 'available';
    if (totalStock === 0) {
      status = 'empty';
    } else if (totalStock <= 5 || emptyProducts >= 2 || criticalProducts >= 2) {
      status = 'critical';
    }

    // Update unit status in database
    const { error: statusUpdateError } = await supabase
      .from('unit_status')
      .upsert({
        unit_id: unitId,
        status,
        total_stock: totalStock,
        updated_at: new Date().toISOString()
      });

    if (statusUpdateError) {
      console.error('Status update error:', statusUpdateError);
    }

    // Prepare detailed response
    const responseData = {
      unit_id: unitId,
      unit_name: unit.name,
      status,
      timestamp: new Date().toISOString(),
      stock_summary: {
        total_stock: totalStock,
        total_products: stockData?.length || 0,
        empty_products: emptyProducts,
        critical_products: criticalProducts,
        available_products: availableProducts
      },
      products: stockData?.map(item => ({
        id: item.products.id,
        name: item.products.name,
        category: item.products.categories?.name || 'uncategorized',
        quantity: item.quantity,
        status: item.quantity === 0 ? 'empty' : 
                item.quantity <= 5 ? 'critical' : 'available'
      })) || [],
      status_messages: {
        id: getStatusMessage(status),
        en: getStatusMessageEn(status)
      }
    };

    // Set cache headers for external polling
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      unit_id: unitId,
      timestamp: new Date().toISOString()
    });
  }
}

function getStatusMessage(status) {
  switch (status) {
    case 'available':
      return 'Hadiah Tersedia';
    case 'critical':
      return 'Hadiah Hampir Habis';
    case 'empty':
      return 'Hadiah Habis';
    default:
      return 'Status Tidak Diketahui';
  }
}

function getStatusMessageEn(status) {
  switch (status) {
    case 'available':
      return 'Prizes Available';
    case 'critical':
      return 'Prizes Running Low';
    case 'empty':
      return 'No Prizes Available';
    default:
      return 'Unknown Status';
  }
}