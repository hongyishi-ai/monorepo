const ALLOWED_PATHS = new Set([
  '/geo/1.0/direct',
  '/geo/1.0/reverse',
  '/data/2.5/weather',
  '/data/2.5/forecast',
]);

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const responseHeaders = {
  ...securityHeaders,
  ...corsHeaders,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...responseHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const requestUrl = new URL(request.url);
  const openWeatherPath = requestUrl.searchParams.get('path');

  if (!openWeatherPath || !ALLOWED_PATHS.has(openWeatherPath)) {
    return json(
      {
        error: 'Invalid path',
        allowed: Array.from(ALLOWED_PATHS),
      },
      400,
    );
  }

  if (!env.OPENWEATHER_API_KEY) {
    return json({ error: 'OPENWEATHER_API_KEY environment variable is not set' }, 500);
  }

  const targetUrl = new URL(`https://api.openweathermap.org${openWeatherPath}`);
  targetUrl.searchParams.set('appid', env.OPENWEATHER_API_KEY);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    if (key !== 'path' && key !== 'appid') {
      targetUrl.searchParams.append(key, value);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'hongyishi-cloudflare-pages/1.0',
      },
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...responseHeaders,
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
        'Cache-Control': response.ok ? 'public, max-age=300, stale-while-revalidate=300' : 'no-store',
      },
    });
  } catch (error) {
    console.error('OpenWeatherMap API error', error);
    return json({ error: 'Failed to fetch weather data' }, 500);
  }
}
