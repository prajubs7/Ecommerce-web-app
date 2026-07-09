import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * generate-embedding Edge Function
 *
 * Called after a product is created or updated.
 * Generates a text embedding from the product's title + description
 * and stores it in the products.embedding column.
 *
 * Why Edge Function instead of client-side?
 * 1. OpenAI API key stays server-side (never exposed to browser)
 * 2. Runs close to the database (low latency)
 * 3. Can be triggered automatically via pg_cron or webhook later
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { productId } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role key — bypasses RLS to read/write any product
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the product to embed
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, title, description, metadata')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build text to embed — more context = better semantic understanding
    // Include brand from metadata if available
    const brand    = (product.metadata as any)?.brand ?? '';
    const textToEmbed = [
      product.title,
      brand ? `Brand: ${brand}` : '',
      product.description ?? '',
    ]
      .filter(Boolean)
      .join('. ');

    // Call OpenAI Embeddings API
    const openAIResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // 1536 dimensions, cheapest, very accurate
        input: textToEmbed,
      }),
    });

    if (!openAIResponse.ok) {
      const err = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const openAIData = await openAIResponse.json();
    const embedding  = openAIData.data[0].embedding as number[];

    // Store embedding in products table
    const { error: updateError } = await supabase
      .from('products')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', productId);

    if (updateError) throw updateError;

    console.log(`✅ Embedding generated for product ${productId} (${embedding.length} dimensions)`);

    return new Response(
      JSON.stringify({ success: true, dimensions: embedding.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('generate-embedding error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});