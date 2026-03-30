import { corsHeaders } from './cors.ts'

Deno.serve(async (req) => {
  const timestamp = new Date().toISOString()
  console.log(`\n================================================================================`)
  console.log(`[${timestamp}] 🚀 FUNCTION START: Conexzap Webhook Handler (DEBUG MODE)`)
  console.log(`================================================================================`)

  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Method Validation
  if (req.method !== 'POST') {
    console.error(`❌ Invalid Method: ${req.method}`)
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // PASSO 1: Setup Environment & Headers
    console.log('PASSO 1: Configurando variáveis de ambiente...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      throw new Error('Missing Supabase environment variables')
    }

    // Headers comuns para todas as requisições ao Supabase REST API
    const dbHeaders = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // Para retornar os dados após insert/update
    }

    // PASSO 2: Parse do Body
    console.log('PASSO 2: Lendo e parseando o corpo da requisição...')
    let rawBody = ''
    try {
        rawBody = await req.text()
    } catch (e) {
        console.error('❌ Erro ao ler body:', e)
        throw new Error('Falha ao ler corpo da requisição')
    }
    
    console.log(`📦 Payload recebido (${rawBody.length} chars):`, rawBody)

    if (!rawBody) throw new Error('Empty request body')
    
    let payload
    try {
        payload = JSON.parse(rawBody)
    } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e)
        throw new Error('Body inválido (não é JSON)')
    }

    // PASSO 3: Validação da API Key
    console.log('PASSO 3: Extraindo API Key...')
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key')
    console.log(`🔑 Header X-API-Key: ${apiKey ? '***PRESENT***' : 'MISSING'}`)
    
    if (!apiKey) {
      console.error('❌ Missing API Key Header')
      return new Response(JSON.stringify({ success: false, error: 'Missing X-API-Key header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PASSO 4: Consulta ao Banco (Validação Key) via FETCH
    console.log('PASSO 4: Validando API Key no banco via FETCH...')
    // URL: /rest/v1/distributor_api_keys?key_hash=eq.VALUE&select=distributor_id
    const keyQueryUrl = `${supabaseUrl}/rest/v1/distributor_api_keys?key_hash=eq.${apiKey}&select=distributor_id`
    console.log(`📡 GET ${keyQueryUrl}`)
    
    const keyResponse = await fetch(keyQueryUrl, {
      method: 'GET',
      headers: dbHeaders
    })

    if (!keyResponse.ok) {
      const errText = await keyResponse.text()
      console.error(`❌ Erro HTTP ao consultar API Key: ${keyResponse.status}`, errText)
      throw new Error(`Erro ao consultar API Key: ${keyResponse.status} - ${errText}`)
    }

    const keyData = await keyResponse.json()
    console.log(`✅ Resposta API Key DB:`, JSON.stringify(keyData))
    
    if (!keyData || keyData.length === 0) {
      console.error('❌ Invalid API Key: Chave não encontrada ou inativa')
      return new Response(JSON.stringify({ success: false, error: 'Invalid API Key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const distributorId = keyData[0].distributor_id
    console.log(`✅ API Key Válida! Distributor ID: ${distributorId}`)

    // PASSO 5: Roteamento de Eventos
    const type = payload.webhookType || payload.type || payload.event || (payload.body?.method === 'message' ? 'message' : 'unknown')
    console.log(`PASSO 5: Tipo de evento identificado: ${type}`)

    if (type === 'contact-create-update' || payload.event === 'contact-create-update') {
      return await handleContactUpdate(supabaseUrl, dbHeaders, payload, distributorId)
    } 
    
    if (type === 'message' || payload.body?.method === 'message') {
      return await handleMessage(supabaseUrl, dbHeaders, payload, distributorId)
    }

    console.warn(`⚠️ Tipo desconhecido: ${type}. Ignorando com sucesso.`)
    return new Response(JSON.stringify({ success: true, message: 'Ignored unknown type', type_received: type }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('🔥 CRITICAL ERROR:', error.message)
    console.error(error.stack)
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ------------------------------------------------------------------
// Logic Handlers (Direct FETCH Implementation)
// ------------------------------------------------------------------

async function handleContactUpdate(baseUrl: string, headers: any, payload: any, userId: string) {
  console.log('PASSO 6: Processando Contact Update...')
  
  const contact = payload.contact || payload.body?.contact
  console.log('👤 Dados do contato:', JSON.stringify(contact))
  
  if (!contact || !contact.number) {
    console.error('❌ Dados de contato inválidos (missing contact object or number)')
    return new Response(JSON.stringify({ success: false, error: 'Invalid contact data' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const normalizedPhone = String(contact.number).replace(/\D/g, '')
  const name = contact.name || 'Unknown Contact'
  const email = contact.email || null

  console.log(`🔍 Telefone normalizado: ${normalizedPhone}`)

  // 1. Buscar se já existe (GET)
  const searchUrl = `${baseUrl}/rest/v1/leads?distributor_id=eq.${userId}&phone=eq.${normalizedPhone}&select=id`
  console.log(`📡 GET ${searchUrl}`)
  
  const searchResp = await fetch(searchUrl, { method: 'GET', headers })
  const searchData = await searchResp.json()
  
  if (!searchResp.ok) {
     console.error('❌ Erro na busca de leads:', JSON.stringify(searchData))
     throw new Error(`Erro na busca: ${JSON.stringify(searchData)}`)
  }

  console.log('🔎 Resultado da busca:', JSON.stringify(searchData))

  if (searchData && searchData.length > 0) {
    // 2. Atualizar (PATCH)
    const leadId = searchData[0].id
    console.log(`🔄 Atualizando Lead Existente ID: ${leadId}`)
    
    const updateUrl = `${baseUrl}/rest/v1/leads?id=eq.${leadId}`
    const updateBody = {
      name: name !== 'Unknown Contact' ? name : undefined,
      email: email,
      last_activity_at: new Date().toISOString()
    }
    
    // Remove undefined keys
    Object.keys(updateBody).forEach(key => updateBody[key] === undefined && delete updateBody[key])

    console.log(`📡 PATCH ${updateUrl}`)
    console.log(`📤 Body:`, JSON.stringify(updateBody))

    const updateResp = await fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateBody)
    })

    if (!updateResp.ok) {
        const errText = await updateResp.text()
        console.error(`❌ Falha ao atualizar lead: ${errText}`)
        throw new Error(`Falha ao atualizar lead: ${errText}`)
    }
    console.log('✅ Lead atualizado com sucesso')

  } else {
    // 3. Criar (POST)
    console.log('✨ Criando novo Lead...')
    const insertUrl = `${baseUrl}/rest/v1/leads`
    const insertBody = {
      distributor_id: userId,
      user_id: userId,
      name: name,
      phone: normalizedPhone,
      email: email,
      source: 'conexzap',
      status: 'new',
      channel: 'whatsapp',
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    }

    console.log(`📡 POST ${insertUrl}`)
    console.log(`📤 Body:`, JSON.stringify(insertBody))

    const insertResp = await fetch(insertUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(insertBody)
    })

    if (!insertResp.ok) {
        const errText = await insertResp.text()
        console.error(`❌ Falha ao criar lead: ${errText}`)
        throw new Error(`Falha ao criar lead: ${errText}`)
    }
    console.log('✅ Lead criado com sucesso')
  }

  return new Response(JSON.stringify({ success: true, message: 'Contact processed via FETCH' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleMessage(baseUrl: string, headers: any, payload: any, userId: string) {
  console.log('PASSO 7: Processando Mensagem...')
  
  const msg = payload.body?.msg || payload.msg
  const ticket = payload.body?.ticket || payload.ticket

  if (!msg || !ticket || !ticket.contact?.number) {
    console.warn('⚠️ Dados incompletos na mensagem. Msg/Ticket/Number missing.')
    console.warn('Msg:', !!msg, 'Ticket:', !!ticket, 'Number:', ticket?.contact?.number)
    return new Response(JSON.stringify({ success: false, error: 'Incomplete message data' }), {
      status: 200, // Return 200 to acknowledge webhook and stop retries
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const contactName = ticket.contact?.name || ticket.contact?.pushname || 'Unknown Contact'
  const normalizedPhone = String(ticket.contact.number).replace(/\D/g, '')
  
  const text = 
    msg.message?.conversation || 
    msg.message?.extendedTextMessage?.text || 
    (msg.type === 'chat' ? msg.body : '') || 
    'Media/Audio Message'

  const title = `Mensagem de ${contactName}`
  
  // Insert Sales Opportunity Activity
  const insertUrl = `${baseUrl}/rest/v1/sales_opportunities`
  const insertBody = {
    distributor_id: userId,
    customer_name: contactName,
    customer_phone: normalizedPhone,
    activity_type: 'whatsapp_message',
    status: 'completed',
    notes: `${title}: ${text}`,
    visit_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    custom_data: {
      source: 'conexzap',
      original_message: text,
      ticket_id: ticket.id,
      timestamp: msg.messageTimestamp
    }
  }

  console.log('💾 Salvando Sales Opportunity via FETCH...')
  console.log(`📡 POST ${insertUrl}`)
  console.log(`📤 Body:`, JSON.stringify(insertBody))
  
  const insertResp = await fetch(insertUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(insertBody)
  })

  if (!insertResp.ok) {
      const err = await insertResp.text()
      console.error(`❌ Erro ao salvar mensagem (DB Error): ${err}`)
      // Retorna 200 mesmo com erro de BD para evitar loop infinito do webhook, mas loga o erro.
      return new Response(JSON.stringify({ 
          success: false, 
          error: 'DB Error caught (returning 200 to stop retry)', 
          details: err 
      }), {
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }

  console.log('✅ Mensagem salva com sucesso!')
  return new Response(JSON.stringify({ success: true, message: 'Message saved via FETCH' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}