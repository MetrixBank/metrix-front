import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

const FIXED_USER_ID = 'a2b96ad2-b089-4b90-becb-340a2a97a7c9'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Webhook funcionando',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    )
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json()

      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            user_id: FIXED_USER_ID,
            nome: body.nome || 'Sem nome',
            telefone: body.telefone || 'Sem telefone',
            mensagem: body.mensagem || 'Sem mensagem',
            origem: body.origem || 'conexzap',
            canal: body.canal || 'whatsapp',
            data: body.data || new Date().toISOString(),
            distributor_id: body.distributor_id || 'DIST_TESTE'
          }
        ])
        .select()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: corsHeaders }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Lead inserido',
          lead_id: data[0].id
        }),
        { status: 200, headers: corsHeaders }
      )
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: corsHeaders }
      )
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: corsHeaders }
  )
})