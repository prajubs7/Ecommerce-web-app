import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      query,
      threshold = 0.3,  // minimum similarity score (0-1)
      limit     = 10,   // max results
    } = await req.json();

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Embed the search query using the same model as products
    const openAIResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query.trim(),
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI error: ${await openAIResponse.text()}`);
    }

    const openAIData     = await openAIResponse.json();
    const queryEmbedding = openAIData.data[0].embedding;

    // Step 2: Find similar products using pgvector cosine similarity
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: products, error } = await supabase.rpc(
      'search_products_semantic',
      {
        query_embedding:    queryEmbedding,
        similarity_threshold: threshold,
        match_count:        limit,
      }
    );

    if (error) throw error;

    console.log(`🔍 Semantic search "${query}": ${products?.length ?? 0} results`);

    return new Response(
      JSON.stringify({ products: products ?? [], query }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('semantic-search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});