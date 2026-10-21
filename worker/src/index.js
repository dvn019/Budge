// Budge reminders: keeps each phone's push sign-up and sends the daily
// "Anything to log today?" nudge at the time the person chose, skipping
// days they've already logged. Nothing about money is ever stored here.
import { buildPushHTTPRequest } from '@pushforge/builder';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '20:00', tz TEXT NOT NULL DEFAULT 'Africa/Lagos', on_flag INTEGER NOT NULL DEFAULT 1,
    last_logged TEXT, last_sent TEXT, streak INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)`
];

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// VAPID keys are made once, inside Cloudflare, and never leave it (only the public half is shared).
async function keys(env) {
  const row = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('vapid').first();
  if (row) return JSON.parse(row.v);
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateJWK = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const publicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const k = { privateJWK: { kty: privateJWK.kty, crv: privateJWK.crv, x: privateJWK.x, y: privateJWK.y, d: privateJWK.d }, publicKey };
  await env.DB.prepare('INSERT OR IGNORE INTO meta (k, v) VALUES (?, ?)').bind('vapid', JSON.stringify(k)).run();
  const again = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('vapid').first();
  return JSON.parse(again.v);
}

function localNow(tz, date = new Date()) {
  let parts;
  try { parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date); }
  catch (e) { return localNow('Africa/Lagos', date); }
  const g = t => parts.find(p => p.type === t).value;
  return { day: `${g('year')}-${g('month')}-${g('day')}`, minutes: +g('hour') * 60 + +g('minute') };
}
const toMin = hhmm => { const [h, m] = String(hhmm || '20:00').split(':').map(Number); return h * 60 + (m || 0); };

async function send(env, sub, payload) {
  const k = await keys(env);
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: k.privateJWK,
    subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    message: { payload, adminContact: env.CONTACT, options: { ttl: 6 * 3600, urgency: 'normal', topic: 'daily' } }
  });
  const r = await fetch(endpoint, { method: 'POST', headers, body });
  if (r.status === 404 || r.status === 410) { await env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(sub.id).run(); return 'gone'; }
  return r.ok ? 'sent' : 'failed ' + r.status;
}

// When the live site's version.json shows a new version, tell everyone who wants update news. Once per version.
async function announce(env) {
  const r = await fetch(env.SITE_URL + 'version.json?t=' + Date.now(), { cf: { cacheTtl: 0 } });
  if (!r.ok) return;
  const v = await r.json();
  if (!v || !v.version) return;
  const row = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind('last_version').first();
  if (row && row.v === v.version) return;
  await env.DB.prepare('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)').bind('last_version', v.version).run();
  if (!row) return; // first run: just remember the current version
  const { results } = await env.DB.prepare('SELECT * FROM subs WHERE news_flag = 1').all();
  const body = (v.notes && v.notes[0]) || 'Open Budge to see what changed.';
  await Promise.all(results.map(sub => send(env, sub, { title: 'Budge ' + v.version + ' is here', body, url: './', tag: 'update' }).catch(() => {})));
}

function reminder(sub) {
  const n = sub.streak || 0;
  return { title: 'Anything to log today?', body: n > 0 ? `Tap to add it and keep your ${n}-day streak.` : 'Tap to add what you spent.', url: './?add=1' };
}

function cors(env, req) {
  const o = req.headers.get('Origin') || '';
  const ok = o === env.ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(o);
  return { 'Access-Control-Allow-Origin': ok ? o : env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
const json = (data, status, h) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...h } });
const validId = id => typeof id === 'string' && /^[a-z0-9-]{8,64}$/i.test(id);
const validTime = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const validDay = d => /^\d{4}-\d{2}-\d{2}$/.test(d);

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    const url = new URL(req.url);
    try {
      if (req.method === 'GET' && url.pathname === '/') return json({ ok: true, app: 'budge-reminders' }, 200, h);
      if (req.method === 'GET' && url.pathname === '/key') return json({ publicKey: (await keys(env)).publicKey }, 200, h);
      if (req.method !== 'POST') return json({ error: 'not found' }, 404, h);
      const d = await req.json().catch(() => ({}));
      if (!validId(d.id)) return json({ error: 'bad id' }, 400, h);
      const now = Date.now();

      if (url.pathname === '/subscribe') {
        const s = d.subscription || {};
        if (typeof s.endpoint !== 'string' || !s.endpoint.startsWith('https://') || !s.keys || !s.keys.p256dh || !s.keys.auth) return json({ error: 'bad subscription' }, 400, h);
        const time = validTime(d.time) ? d.time : '20:00', tz = typeof d.tz === 'string' && d.tz.length < 64 ? d.tz : 'Africa/Lagos';
        await env.DB.prepare(`INSERT INTO subs (id, endpoint, p256dh, auth, time, tz, on_flag, last_logged, streak, created_at, updated_at, news_flag)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10, ?11)
          ON CONFLICT(id) DO UPDATE SET endpoint = ?2, p256dh = ?3, auth = ?4, time = ?5, tz = ?6, on_flag = ?7,
            last_logged = COALESCE(?8, last_logged), streak = ?9, updated_at = ?10, news_flag = ?11`)
          .bind(d.id, s.endpoint, s.keys.p256dh, s.keys.auth, time, tz, d.on === false ? 0 : 1, validDay(d.lastLogged) ? d.lastLogged : null, +d.streak || 0, now, d.news === false ? 0 : 1).run();
        return json({ ok: true }, 200, h);
      }
      if (url.pathname === '/update') {
        await env.DB.prepare(`UPDATE subs SET time = COALESCE(?2, time), tz = COALESCE(?3, tz), on_flag = COALESCE(?4, on_flag),
          last_logged = COALESCE(?5, last_logged), streak = COALESCE(?6, streak), updated_at = ?7, news_flag = COALESCE(?8, news_flag) WHERE id = ?1`)
          .bind(d.id, validTime(d.time) ? d.time : null, typeof d.tz === 'string' && d.tz.length < 64 ? d.tz : null,
            typeof d.on === 'boolean' ? (d.on ? 1 : 0) : null, validDay(d.lastLogged) ? d.lastLogged : null,
            Number.isFinite(d.streak) ? d.streak : null, now, typeof d.news === 'boolean' ? (d.news ? 1 : 0) : null).run();
        return json({ ok: true }, 200, h);
      }
      if (url.pathname === '/unsubscribe') {
        await env.DB.prepare('DELETE FROM subs WHERE id = ?').bind(d.id).run();
        return json({ ok: true }, 200, h);
      }
      if (url.pathname === '/test') {
        const sub = await env.DB.prepare('SELECT * FROM subs WHERE id = ?').bind(d.id).first();
        if (!sub) return json({ error: 'not subscribed' }, 404, h);
        const result = await send(env, sub, { ...reminder(sub), title: 'Budge reminders are on', body: 'This is how your daily reminder will look.' });
        return json({ result }, 200, h);
      }
      return json({ error: 'not found' }, 404, h);
    } catch (e) {
      return json({ error: 'server error' }, 500, h);
    }
  },

  // Every 15 minutes: announce a new release (once), then remind anyone whose time has passed today,
  // who hasn't logged and hasn't been reminded.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(announce(env).catch(() => {}));
    const { results } = await env.DB.prepare('SELECT * FROM subs WHERE on_flag = 1').all();
    const jobs = [];
    for (const sub of results) {
      const t = localNow(sub.tz, new Date(event.scheduledTime));
      const due = t.minutes >= toMin(sub.time) && t.minutes < toMin(sub.time) + 180;
      if (!due || sub.last_sent === t.day || sub.last_logged === t.day) continue;
      jobs.push(send(env, sub, reminder(sub)).then(r => {
        if (r === 'sent') return env.DB.prepare('UPDATE subs SET last_sent = ? WHERE id = ?').bind(t.day, sub.id).run();
      }));
    }
    ctx.waitUntil(Promise.all(jobs));
  }
};
