const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { texts, target_lang, html } = await req.json()
    const DEEPL_KEY = Deno.env.get('DEEPL_KEY') ?? ''

    const r = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        source_lang: 'IT',
        target_lang,
        ...(html ? { tag_handling: 'html' } : {}),
      }),
    })

    const data = await r.json()

    if (!r.ok) {
      return new Response(
        JSON.stringify({ deepl_error: true, status: r.status, detail: data }),
        { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ deepl_error: true, status: 500, detail: String(err) }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
