import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { MARS_EXPLORATION_ZONES } from '../src/data/marsMissionData.js';

const SESSION_COOKIE = 'ares_admin_session';
const ALLOWED_PHOTOS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

function sendJson(response, status, data, headers = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  response.end(JSON.stringify(data));
}

function requestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }
  return {};
}

function safeEqual(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const actualHash = createHmac('sha256', 'ares-admin-compare').update(actual).digest();
  const expectedHash = createHmac('sha256', 'ares-admin-compare').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function currentAdmin(request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() && session.username === process.env.ADMIN_USERNAME
      ? session.username
      : null;
  } catch {
    return null;
  }
}

function defaultZones() {
  return Object.fromEntries(
    Object.entries(MARS_EXPLORATION_ZONES).map(([zoneId, zone]) => [zoneId, zone.waypoints])
  );
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, bucket: process.env.SUPABASE_BUCKET || 'mars-map-photos' };
}

function supabaseHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra
  };
}

function validWaypoints(waypoints) {
  return Array.isArray(waypoints)
    && waypoints.length <= 500
    && waypoints.every((waypoint) =>
      waypoint
      && typeof waypoint === 'object'
      && typeof waypoint.id === 'string'
      && waypoint.id.length <= 100
      && typeof waypoint.name === 'string'
      && typeof waypoint.name_uz === 'string'
      && Number.isFinite(Number(waypoint.lat))
      && Number.isFinite(Number(waypoint.lng))
      && Number.isFinite(Number(waypoint.elevation))
      && Number.isFinite(Number(waypoint.slopeDeg))
    );
}

async function handleRequest(request, response) {
  const url = new URL(request.url || '/', `https://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (request.method === 'GET' && pathname === '/api/auth/session') {
    return sendJson(response, 200, { authenticated: Boolean(currentAdmin(request)) });
  }

  if (request.method === 'POST' && pathname === '/api/auth/login') {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;
    if (!username || !password || !sessionSecret) {
      return sendJson(response, 503, { error: 'Admin authentication is not configured.' });
    }

    const body = requestBody(request);
    if (!safeEqual(body.username, username) || !safeEqual(body.password, password)) {
      return sendJson(response, 401, { error: 'Invalid username or password.' });
    }

    const payload = Buffer.from(JSON.stringify({
      username,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    })).toString('base64url');
    const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
    const secure = process.env.VERCEL ? '; Secure' : '';
    return sendJson(response, 200, { authenticated: true }, {
      'Set-Cookie': `${SESSION_COOKIE}=${payload}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`
    });
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const secure = process.env.VERCEL ? '; Secure' : '';
    return sendJson(response, 200, { authenticated: false }, {
      'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
    });
  }

  if (request.method === 'GET' && pathname === '/api/zones') {
    const config = getSupabaseConfig();
    if (!config) return sendJson(response, 200, defaultZones());

    const result = await fetch(`${config.url}/rest/v1/zone_content?select=zone_id,waypoints`, {
      headers: supabaseHeaders(config.key)
    });
    if (!result.ok) {
      console.error('Supabase zone read failed:', result.status);
      return sendJson(response, 503, { error: 'Map storage is not configured. Showing the built-in map data is unavailable.' });
    }

    const rows = await result.json();
    const saved = new Map(rows.map((row) => [row.zone_id, row.waypoints]));
    const zones = Object.fromEntries(
      Object.entries(MARS_EXPLORATION_ZONES).map(([zoneId, zone]) => [
        zoneId,
        saved.has(zoneId) ? saved.get(zoneId) : zone.waypoints
      ])
    );
    return sendJson(response, 200, zones);
  }

  const zoneMatch = pathname.match(/^\/api\/zones\/([^/]+)$/);
  if (request.method === 'PUT' && zoneMatch) {
    if (!currentAdmin(request)) {
      return sendJson(response, 401, { error: 'Administrator sign-in is required.' });
    }

    const zoneId = decodeURIComponent(zoneMatch[1]);
    if (!Object.hasOwn(MARS_EXPLORATION_ZONES, zoneId)) {
      return sendJson(response, 404, { error: 'Unknown Mars map zone.' });
    }
    const waypoints = requestBody(request).waypoints;
    if (!validWaypoints(waypoints)) {
      return sendJson(response, 400, { error: 'The map locations are invalid.' });
    }

    const config = getSupabaseConfig();
    if (!config) {
      return sendJson(response, 503, { error: 'Supabase storage is not configured.' });
    }
    const result = await fetch(`${config.url}/rest/v1/zone_content?on_conflict=zone_id`, {
      method: 'POST',
      headers: supabaseHeaders(config.key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify({
        zone_id: zoneId,
        waypoints,
        updated_at: new Date().toISOString()
      })
    });
    if (!result.ok) {
      console.error('Supabase zone write failed:', result.status);
      return sendJson(response, 502, { error: 'Could not save map locations.' });
    }
    return sendJson(response, 200, { saved: true });
  }

  if (request.method === 'POST' && pathname === '/api/uploads/sign') {
    if (!currentAdmin(request)) {
      return sendJson(response, 401, { error: 'Administrator sign-in is required.' });
    }

    const config = getSupabaseConfig();
    if (!config) {
      return sendJson(response, 503, { error: 'Supabase storage is not configured.' });
    }

    const extension = ALLOWED_PHOTOS.get(requestBody(request).contentType);
    if (!extension) {
      return sendJson(response, 400, { error: 'Choose a JPEG, PNG, or WebP image.' });
    }

    const objectPath = `${randomBytes(16).toString('hex')}.${extension}`;
    const signEndpoint = `${config.url}/storage/v1/object/upload/sign/${encodeURIComponent(config.bucket)}/${objectPath}`;
    const result = await fetch(signEndpoint, {
      method: 'POST',
      headers: supabaseHeaders(config.key, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ upsert: false })
    });
    const signed = await result.json();
    if (!result.ok || !signed.token) {
      console.error('Supabase upload signing failed:', result.status);
      return sendJson(response, 502, { error: 'Could not prepare the photo upload.' });
    }

    const uploadUrl = new URL(
      `/storage/v1/object/upload/sign/${encodeURIComponent(config.bucket)}/${objectPath}`,
      config.url
    );
    uploadUrl.searchParams.set('token', signed.token);
    const publicUrl = `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${objectPath}`;
    return sendJson(response, 200, { uploadUrl: uploadUrl.href, publicUrl });
  }

  return sendJson(response, 404, { error: 'Not found.' });
}

export default async function handler(request, response) {
  try {
    await handleRequest(request, response);
  } catch (error) {
    console.error('Vercel API request failed:', error);
    if (!response.headersSent) sendJson(response, 500, { error: 'The API could not complete the request.' });
  }
}
