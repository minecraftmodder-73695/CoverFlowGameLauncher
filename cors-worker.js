// Minimal CORS proxy for GameFlow (Cloudflare Workers, free tier is plenty).
//
// 1. Cloudflare dashboard > Workers & Pages > Create > "Hello World" worker > Edit code > paste this file > Deploy.
// 2. In GameFlow > Settings, set "CORS proxy" to:  https://YOUR-WORKER.workers.dev/?url=
//
// Only forwards to the hosts below and passes through the Authorization header
// (SteamGridDB needs it). Your API keys are never stored by the worker.

const ALLOW = new Set(['www.steamgriddb.com', 'retroachievements.org', 'media.retroachievements.org']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const reply = (body, status) => new Response(body, { status, headers: CORS });

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return reply(null, 204);
    if (req.method !== 'GET') return reply('Method not allowed', 405);
    let target;
    try { target = new URL(new URL(req.url).searchParams.get('url')); }
    catch { return reply('Bad url', 400); }
    if (target.protocol !== 'https:' || !ALLOW.has(target.hostname)) return reply('Host not allowed', 403);

    const auth = req.headers.get('authorization');
    const upstream = await fetch(target, auth ? { headers: { authorization: auth } } : {});
    const out = new Response(upstream.body, upstream);
    for (const k in CORS) out.headers.set(k, CORS[k]);
    return out;
  },
};
