import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  const envelope = await request.text()
  const header = envelope.split('\n')[0]

  let dsn: string
  try {
    dsn = JSON.parse(header).dsn as string
  } catch {
    return new Response('Invalid Sentry envelope', { status: 400 })
  }

  if (!dsn) {
    return new Response('Missing DSN in envelope header', { status: 400 })
  }

  const url = new URL(dsn)
  const projectId = url.pathname.slice(1)

  try {
    const res = await fetch(`https://${url.hostname}/api/${projectId}/envelope/`, {
      method: 'POST',
      body: envelope,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
    })
    return new Response(null, { status: res.status })
  } catch {
    return new Response('Upstream error', { status: 502 })
  }
}
