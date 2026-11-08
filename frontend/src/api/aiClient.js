/**
 * aiClient.js
 * Multi-provider AI client supporting:
 * 1. Ollama (local/self-hosted via OpenAI-compatible endpoint or /api/chat)
 * 2. Groq (Free high-speed cloud Llama 3 models — zero Discord bot quota overlap)
 * 3. OpenAI / Custom LLM endpoints
 * 4. Algorithmic fallback
 */

const STORAGE_KEY = 'jerry_studio_api_keys'
const AI_PROXY_ENDPOINT = 'https://fbeegpzrbocqgyxeqqtc.supabase.co/functions/v1/ai-proxy'

export function getAiSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        provider: 'algorithmic',
        ollamaMode: 'cloud', // 'cloud' | 'local'
        ollamaKey: '',
        ollamaCloudModel: 'deepseek-v4.1-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2',
        groqKey: '',
        groqModel: 'llama-3.3-70b-versatile',
        openaiKey: '',
        openaiModel: 'gpt-4o-mini',
      }
    }
    const data = JSON.parse(raw)
    return {
      provider: data.aiProvider || 'algorithmic',
      ollamaMode: data.ollamaMode || 'cloud',
      ollamaKey: (data.ollamaKey || '').trim(),
      ollamaCloudModel: (data.ollamaCloudModel || 'deepseek-v4.1-flash').trim(),
      ollamaUrl: (data.ollamaUrl || 'http://localhost:11434').trim(),
      ollamaModel: (data.ollamaModel || 'llama3.2').trim(),
      groqKey: (data.groqKey || '').trim(),
      groqModel: (data.groqModel || 'llama-3.3-70b-versatile').trim(),
      openaiKey: (data.openai || '').trim(),
      openaiModel: (data.openaiModel || 'gpt-4o-mini').trim(),
    }
  } catch {
    return {
      provider: 'algorithmic',
      ollamaMode: 'cloud',
      ollamaKey: '',
      ollamaCloudModel: 'deepseek-v4.1-flash',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      groqKey: '',
      groqModel: 'llama-3.3-70b-versatile',
      openaiKey: '',
      openaiModel: 'gpt-4o-mini',
    }
  }
}

export function saveAiSettings(patch = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : {}
    const updated = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save AI settings:', err)
    return null
  }
}

/**
 * Tests connection to Ollama server and lists installed models.
 */
export async function testOllamaConnection(baseUrl = 'http://localhost:11434') {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '')
  if (!cleanUrl) {
    throw new Error('Please enter your Ollama endpoint URL (e.g. http://localhost:11434 or HTTPS tunnel).')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(`${cleanUrl}/api/tags`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      throw new Error(`Ollama responded with HTTP ${res.status}`)
    }

    const data = await res.json()
    const models = (data.models || []).map((m) => m.name)

    return {
      ok: true,
      models,
      message: models.length > 0
        ? `Connected to Ollama! Found models: ${models.slice(0, 4).join(', ')}${models.length > 4 ? '...' : ''}`
        : 'Connected to Ollama! (No local models downloaded yet — run `ollama pull llama3.2`)',
    }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Check that Ollama is running and accessible.')
    }
    // Check if mixed content error or CORS blocked
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Could not reach Ollama. If running locally, start Ollama with: `OLLAMA_ORIGINS="*" ollama serve`. If on HTTPS, use a Cloudflare Tunnel.'
      )
    }
    throw err
  }
}

/**
 * Tests connection to Ollama Cloud API via Supabase Edge Function proxy.
 */
export async function testOllamaCloudConnection(apiKey) {
  const key = (apiKey || '').trim()
  if (!key) {
    throw new Error('Please enter your Ollama.com API key (from ollama.com/settings/keys).')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(AI_PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'ollama_cloud',
        action: 'test',
        apiKey: key,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    const result = await res.json().catch(() => ({}))
    if (!res.ok || result.success === false) {
      throw new Error(result.error || `Ollama Cloud verification failed with status ${res.status}`)
    }

    return {
      ok: true,
      models: result.models || [],
      message: result.message || 'Connected to Ollama Cloud API!',
    }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out reaching Ollama Cloud.')
    }
    throw err
  }
}

/**
 * Tests connection to Groq API.
 */
export async function testGroqConnection(apiKey) {
  const key = (apiKey || '').trim()
  if (!key) throw new Error('Please enter a Groq API key.')

  const res = await fetch('https://api.groq.com/openai/v1/models', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq connection failed (${res.status}): ${err}`)
  }

  return { ok: true, message: 'Connected to Groq Cloud API!' }
}

/**
 * Generates an AI-crafted cold pitch using Ollama (Cloud/Local), Groq, or OpenAI.
 */
export async function generatePitchWithLLM({
  lead,
  angle = 'rescue',
  tone = 'senior',
  techStack = 'Flutter & Supabase',
}) {
  const settings = getAiSettings()
  if (settings.provider === 'algorithmic') {
    return null // Caller will use algorithmic formulas
  }

  const company = lead.company || 'the team'
  const contactName = lead.name || 'there'
  const notes = lead.notes || ''

  const angleDescriptions = {
    rescue: 'Technical Rescue: Focus on debugging FlutterFlow custom action bugs, App Store rejection blockers, state bottlenecks, and rapid stabilization.',
    mvp: 'Rapid MVP Launch: Focus on shipping a production-ready iOS and Android app in 2-4 weeks using FlutterFlow + Supabase without tech debt.',
    scale: 'Architecture & Scaling: Focus on enterprise Supabase Row-Level Security, modular Dart logic, and backend query optimization.',
  }

  const systemPrompt = `You are Jerry Waris, an elite senior mobile & full-stack software engineer (Jerry Dev Studio: https://jerry-dev-studio.web.app).
Write a high-converting, personalized cold email pitch and a short LinkedIn InMail snippet to a prospective client.
Tone: ${tone} (${tone === 'senior' ? 'no fluff, technical authority, clear outcomes' : tone === 'consultant' ? 'ROI and business impact focused' : 'crisp, 3 short paragraphs'}).
Target Angle: ${angleDescriptions[angle] || angleDescriptions.rescue}
Portfolio link to include: https://jerry-dev-studio.web.app/projects

Respond STRICTLY in valid JSON format with keys:
{
  "subject": "Compelling subject line under 60 chars",
  "body": "The email body in plain text formatted with line breaks",
  "inmail": "A short, punchy message under 300 characters suitable for LinkedIn InMail"
}`

  const userPrompt = `Client Company: ${company}
Prospect Name: ${contactName}
Tech Stack: ${techStack}
Project Notes / Job Scope:
${notes || 'Looking for senior mobile and backend engineering support.'}`

  let endpoint = ''
  let headers = { 'Content-Type': 'application/json' }
  let model = ''
  let bodyPayload = null
  let modelLabel = ''

  if (settings.provider === 'ollama') {
    if (settings.ollamaMode === 'cloud') {
      if (!settings.ollamaKey) {
        throw new Error('Ollama Cloud API Key is required. Please enter it in Settings > API Integrations.')
      }
      endpoint = AI_PROXY_ENDPOINT
      model = settings.ollamaCloudModel || 'deepseek-v4.1-flash'
      modelLabel = `Ollama Cloud (${model})`
      bodyPayload = {
        provider: 'ollama_cloud',
        action: 'chat',
        apiKey: settings.ollamaKey,
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }
    } else {
      const cleanUrl = settings.ollamaUrl.replace(/\/+$/, '')
      endpoint = `${cleanUrl}/v1/chat/completions`
      model = settings.ollamaModel || 'llama3.2'
      modelLabel = `Ollama Local (${model})`
      bodyPayload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }
    }
  } else if (settings.provider === 'groq') {
    if (!settings.groqKey) {
      throw new Error('Groq API Key is required. Please enter it in Settings > API Integrations.')
    }
    endpoint = 'https://api.groq.com/openai/v1/chat/completions'
    headers.Authorization = `Bearer ${settings.groqKey}`
    model = settings.groqModel || 'llama-3.3-70b-versatile'
    modelLabel = `Groq (${model})`
    bodyPayload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }
  } else if (settings.provider === 'openai') {
    if (!settings.openaiKey) {
      throw new Error('OpenAI API Key is required. Please enter it in Settings > API Integrations.')
    }
    endpoint = 'https://api.openai.com/v1/chat/completions'
    headers.Authorization = `Bearer ${settings.openaiKey}`
    model = settings.openaiModel || 'gpt-4o-mini'
    modelLabel = `OpenAI (${model})`
    bodyPayload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
  })

  if (!res.ok) {
    const errText = await res.text()
    let msg = errText
    try {
      const parsed = JSON.parse(errText)
      msg = parsed.error?.message || parsed.error || errText
    } catch {
      // ignore
    }
    throw new Error(`${modelLabel || settings.provider.toUpperCase()} failed (${res.status}): ${msg}`)
  }

  const data = await res.json()
  const rawData = data.data || data
  const content = rawData.choices?.[0]?.message?.content || rawData.message?.content || ''

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        subject: parsed.subject || `Engineering support for ${company}`,
        body: parsed.body || content,
        inmail: parsed.inmail || parsed.body?.slice(0, 280) || '',
        modelUsed: modelLabel || `${settings.provider} (${model})`,
      }
    }
  } catch {
    // If not JSON, use raw content
  }

  return {
    subject: `Technical engineering & roadmap for ${company}`,
    body: content.trim(),
    inmail: content.trim().slice(0, 280),
    modelUsed: modelLabel || `${settings.provider} (${model})`,
  }
}
