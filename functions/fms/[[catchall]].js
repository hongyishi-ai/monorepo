const FILE_EXTENSION_PATTERN = /\.[a-zA-Z0-9]+$/;

function cloneAssetResponse(response, status = response.status) {
  return new Response(response.body, {
    status,
    headers: response.headers,
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (url.pathname === '/fms') {
    url.pathname = '/fms/';
    return Response.redirect(url.toString(), 301);
  }

  if (url.pathname === '/fms/' || FILE_EXTENSION_PATTERN.test(url.pathname)) {
    return env.ASSETS.fetch(request);
  }

  const appShellUrl = new URL(request.url);
  appShellUrl.pathname = '/fms/';
  appShellUrl.search = '';

  const response = await env.ASSETS.fetch(appShellUrl);
  return cloneAssetResponse(response, 200);
}
