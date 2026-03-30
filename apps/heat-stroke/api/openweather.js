// Vercel Serverless Function - OpenWeatherMap API 代理
// 用于隐藏 API Key，支持以下路径：
// /api/openweather?path=/geo/1.0/direct&q=Beijing
// /api/openweather?path=/data/2.5/weather&q=Beijing

const ALLOWED_PATHS = new Set([
  '/geo/1.0/direct',
  '/geo/1.0/reverse',
  '/data/2.5/weather',
  '/data/2.5/forecast'
]);

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path, ...queryParams } = req.query;

  // 验证路径
  if (!path || !ALLOWED_PATHS.has(path)) {
    return res.status(400).json({
      error: 'Invalid path',
      allowed: Array.from(ALLOWED_PATHS)
    });
  }

  // 获取 API Key
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENWEATHER_API_KEY environment variable is not set' });
  }

  // 构造目标 URL
  const targetUrl = new URL(`https://api.openweathermap.org${path}`);
  targetUrl.searchParams.set('appid', apiKey);

  // 添加其他查询参数
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      targetUrl.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'hongyishi-hs/1.0 (Vercel)',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('OpenWeatherMap API error:', error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
