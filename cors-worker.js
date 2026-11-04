// Minimal CORS proxy for GameFlow (Cloudflare Workers, free tier is plenty).
//
// 1. Cloudflare dashboard > Workers & Pages > Create > "Hello World" worker > Edit code > paste this file > Deploy.
// 2. In GameFlow > Settings, set "CORS proxy" to:  https://YOUR-WORKER.workers.dev/?url=
//
// It only forwards to the hosts listed below, and passes through the Authorization header
// (SteamGridDB needs it). Your API keys are never stored by the worker.

const ALLOW = [
  'www.steamgriddb.com',
  'retroachievements.org',
  'media.retroachievements.org',
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    let target;
    try { target = new URL(new URL(req.url).searchParams.get('url')); }
    catch { return new Response('Bad url', { status: 400, headers: CORS }); }
    if (target.protocol !== 'https:' || !ALLOW.includes(target.hostname)) {
      return new Response('Host not allowed', { status: 403, headers: CORS });
    }
    const headers = new Headers();
    const auth = req.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    const upstream = await fetch(target, { headers });
    const out = new Headers(upstream.headers);
    for (const k in CORS) out.set(k, CORS[k]);
    return new Response(upstream.body, { status: upstream.status, headers: out });
  },
};
