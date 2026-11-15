import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import initSqlJs from 'sql.js';
import multer from 'multer';
import { MARS_EXPLORATION_ZONES } from '../src/data/marsMissionData.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminUsername || !adminPassword) {
  throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in the project .env file.');
}
if (adminPassword.length < 8) {
  throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');
}

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

const dataDir = path.resolve(rootDir, process.env.DATA_DIR || 'data');
const databasePath = path.resolve(dataDir, process.env.DATABASE_FILE || 'mars-maps.sqlite');
const uploadsDir = path.join(dataDir, 'uploads');
mkdirSync(path.dirname(databasePath), { recursive: true });
mkdirSync(uploadsDir, { recursive: true });

const sessionSecretPath = path.join(dataDir, '.session-secret');
let sessionSecret;
if (process.env.SESSION_SECRET) {
  sessionSecret = process.env.SESSION_SECRET;
} else if (existsSync(sessionSecretPath)) {
  sessionSecret = readFileSync(sessionSecretPath, 'utf8').trim();
} else {
  sessionSecret = randomBytes(32).toString('hex');
  writeFileSync(sessionSecretPath, sessionSecret, { mode: 0o600 });
}

const wasmPath = path.join(rootDir, 'node_modules/sql.js/dist/sql-wasm.wasm');
const SQL = await initSqlJs({ locateFile: () => wasmPath });
const database = existsSync(databasePath)
  ? new SQL.Database(readFileSync(databasePath))
  : new SQL.Database();

database.run(`
  CREATE TABLE IF NOT EXISTS zone_content (
    zone_id TEXT PRIMARY KEY,
    waypoints_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

for (const [zoneId, zone] of Object.entries(MARS_EXPLORATION_ZONES)) {
  database.run(
    `INSERT OR IGNORE INTO zone_content (zone_id, waypoints_json, updated_at)
     VALUES (?, ?, ?)`,
    [zoneId, JSON.stringify(zone.waypoints), new Date().toISOString()]
  );
}

function persistDatabase() {
  writeFileSync(databasePath, Buffer.from(database.export()));
}

persistDatabase();

function equalSecret(actual, expected) {
  if (typeof actual !== 'string') return false;
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function createSessionToken(username) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getSessionUsername(request) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ares_admin_session='));
  if (!cookie) return null;

  const token = cookie.slice('ares_admin_session='.length);
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedSignature = createHmac('sha256', sessionSecret)
    .update(payload)
    .digest('base64url');
  if (!equalSecret(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() && session.username === adminUsername
      ? session.username
      : null;
  } catch {
    return null;
  }
}

function requireAdmin(request, response, next) {
  if (!getSessionUsername(request)) {
    response.status(401).json({ error: 'Administrator sign-in is required.' });
    return;
  }
  next();
}

function readZones() {
  const statement = database.prepare('SELECT zone_id, waypoints_json FROM zone_content');
  const zones = {};
  while (statement.step()) {
    const row = statement.getAsObject();
    zones[row.zone_id] = JSON.parse(row.waypoints_json);
  }
  statement.free();
  return zones;
}

function isValidWaypoints(waypoints) {
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

const allowedPhotoTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadsDir),
    filename: (_request, file, callback) => {
      callback(null, `${randomBytes(16).toString('hex')}.${allowedPhotoTypes.get(file.mimetype)}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!allowedPhotoTypes.has(file.mimetype)) {
      callback(new Error('Choose a JPEG, PNG, or WebP image.'));
      return;
    }
    callback(null, true);
  }
});
const pendingLocalUploads = new Map();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir, { fallthrough: false, index: false }));

app.get('/api/auth/session', (request, response) => {
  response.json({ authenticated: Boolean(getSessionUsername(request)) });
});

app.post('/api/auth/login', (request, response) => {
  const { username, password } = request.body || {};
  if (!equalSecret(username, adminUsername) || !equalSecret(password, adminPassword)) {
    response.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const token = createSessionToken(adminUsername);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `ares_admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`
  );
  response.json({ authenticated: true });
});

app.post('/api/auth/logout', (_request, response) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `ares_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
  );
  response.json({ authenticated: false });
});

app.get('/api/zones', (_request, response) => {
  response.json(readZones());
});

app.post('/api/uploads/sign', requireAdmin, (request, response) => {
  const contentType = request.body?.contentType;
  const extension = allowedPhotoTypes.get(contentType);
  if (!extension) {
    response.status(400).json({ error: 'Choose a JPEG, PNG, or WebP image.' });
    return;
  }

  const uploadId = randomBytes(16).toString('hex');
  const filename = `${randomBytes(16).toString('hex')}.${extension}`;
  pendingLocalUploads.set(uploadId, {
    filename,
    contentType,
    expiresAt: Date.now() + 15 * 60 * 1000
  });
  response.json({
    uploadUrl: `/api/uploads/local/${uploadId}`,
    publicUrl: `/uploads/${filename}`
  });
});

app.put(
  '/api/uploads/local/:uploadId',
  requireAdmin,
  express.raw({ type: [...allowedPhotoTypes.keys()], limit: '10mb' }),
  (request, response) => {
    const pending = pendingLocalUploads.get(request.params.uploadId);
    if (!pending || pending.expiresAt <= Date.now()) {
      pendingLocalUploads.delete(request.params.uploadId);
      response.status(404).json({ error: 'Photo upload request expired. Try again.' });
      return;
    }
    if (
      request.headers['content-type'] !== pending.contentType
      || !Buffer.isBuffer(request.body)
    ) {
      response.status(400).json({ error: 'The uploaded photo type is invalid.' });
      return;
    }

    writeFileSync(path.join(uploadsDir, pending.filename), request.body);
    pendingLocalUploads.delete(request.params.uploadId);
    response.status(201).json({ uploaded: true });
  }
);

app.put('/api/zones/:zoneId', requireAdmin, (request, response) => {
  const { zoneId } = request.params;
  if (!Object.hasOwn(MARS_EXPLORATION_ZONES, zoneId)) {
    response.status(404).json({ error: 'Unknown Mars map zone.' });
    return;
  }

  const waypoints = request.body?.waypoints;
  if (!isValidWaypoints(waypoints)) {
    response.status(400).json({ error: 'The map locations are invalid.' });
    return;
  }

  database.run(
    `INSERT INTO zone_content (zone_id, waypoints_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(zone_id) DO UPDATE SET
       waypoints_json = excluded.waypoints_json,
       updated_at = excluded.updated_at`,
    [zoneId, JSON.stringify(waypoints), new Date().toISOString()]
  );
  persistDatabase();
  response.json({ saved: true });
});

app.post('/api/uploads', requireAdmin, (request, response) => {
  photoUpload.single('photo')(request, response, (error) => {
    if (error) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      response.status(status).json({ error: error.message });
      return;
    }
    if (!request.file) {
      response.status(400).json({ error: 'Choose a JPEG, PNG, or WebP image.' });
      return;
    }
    response.status(201).json({ url: `/uploads/${request.file.filename}` });
  });
});

const distDir = path.join(rootDir, 'dist');
app.use(express.static(distDir));
app.use((request, response, next) => {
  if (
    request.method === 'GET'
    && !request.path.startsWith('/api/')
    && !request.path.startsWith('/uploads/')
    && existsSync(path.join(distDir, 'index.html'))
  ) {
    response.sendFile(path.join(distDir, 'index.html'));
    return;
  }
  next();
});

app.use((error, _request, response, next) => {
  console.error('Local application request failed:', error);
  if (response.headersSent) {
    next(error);
    return;
  }
  response.status(500).json({ error: 'The local server could not complete the request.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Local SQLite server listening on http://localhost:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});
