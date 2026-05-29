module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[project]/lib/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALLOW_REGISTRATION",
    ()=>ALLOW_REGISTRATION
]);
/**
 * lib/env.ts
 *
 * Validates required environment variables at module load time.
 * Import this at the top of any server-side entry point to get
 * a clear error at startup rather than a cryptic failure mid-request.
 *
 * Usage: import '@/lib/env'
 */ const REQUIRED = {
    JWT_SECRET: 'Used to sign and verify session cookies. Generate with: openssl rand -base64 32',
    MYSQL_HOST: 'Hostname of your MySQL server (e.g. localhost)',
    MYSQL_USER: 'MySQL username (e.g. root)',
    MYSQL_PASSWORD: 'Password for MYSQL_USER (use a strong password in production)',
    MYSQL_DATABASE: 'MySQL database name (e.g. retail_crm)'
};
const missing = Object.entries(REQUIRED).filter(([key])=>!process.env[key]).map(([key, hint])=>`  ${key} — ${hint}`);
if (missing.length > 0) {
    throw new Error(`\n\nMissing required environment variables:\n\n${missing.join('\n')}\n\n` + `Copy .env.example to .env.local and fill in the values.\n`);
}
const ALLOW_REGISTRATION = (process.env.ALLOW_REGISTRATION ?? 'true').toLowerCase() !== 'false';
}),
"[project]/lib/mysql/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "query",
    ()=>query,
    "queryOne",
    ()=>queryOne,
    "withTransaction",
    ()=>withTransaction
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mysql2$2f$promise__$5b$external$5d$__$28$mysql2$2f$promise$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mysql2$29$__ = __turbopack_context__.i("[externals]/mysql2/promise [external] (mysql2/promise, cjs, [project]/node_modules/mysql2)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
;
;
function createPool() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$mysql2$2f$promise__$5b$external$5d$__$28$mysql2$2f$promise$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mysql2$29$__["default"].createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'retail_crm',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        // Return dates as ISO strings — Next.js cannot serialise Date objects
        // from Server Components to Client Components
        dateStrings: true,
        // Cast DECIMAL columns to JS numbers automatically
        decimalNumbers: true
    });
}
// In dev, store the pool on `global` so HMR module reloads reuse it.
// In production there is only one module instance, so globalThis is fine too.
const pool = globalThis.__mysqlPool ?? (globalThis.__mysqlPool = createPool());
const __TURBOPACK__default__export__ = pool;
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] ?? null;
}
async function withTransaction(fn) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
        const result = await fn(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally{
        conn.release();
    }
}
}),
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "createUser",
    ()=>createUser,
    "getSession",
    ()=>getSession,
    "getUserByEmail",
    ()=>getUserByEmail,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
/**
 * lib/auth.ts
 *
 * Credential-based authentication backed by MySQL.
 * Passwords are hashed with bcryptjs.
 * Sessions are signed JWT cookies (via jose).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$node$2f$esm$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/node/esm/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$node$2f$esm$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/node/esm/jwt/verify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mysql$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mysql/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
;
;
;
;
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COOKIE_NAME = 'crm_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
;
function getSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET);
}
// ---------------------------------------------------------------------------
// Password helpers  (dynamic import so bcryptjs is server-only)
// ---------------------------------------------------------------------------
async function hashPassword(plain) {
    const bcrypt = await __turbopack_context__.A("[externals]/bcryptjs [external] (bcryptjs, cjs, [project]/node_modules/bcryptjs, async loader)");
    return bcrypt.hash(plain, 12);
}
async function verifyPassword(plain, hash) {
    const bcrypt = await __turbopack_context__.A("[externals]/bcryptjs [external] (bcryptjs, cjs, [project]/node_modules/bcryptjs, async loader)");
    return bcrypt.compare(plain, hash);
}
async function getUserByEmail(email) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mysql$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["queryOne"])('SELECT id, email, name, password_hash FROM users WHERE email = ?', [
        email
    ]);
}
async function createUser(email, password, name) {
    const id = crypto.randomUUID();
    const password_hash = await hashPassword(password);
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mysql$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["query"])('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', [
            id,
            email,
            password_hash,
            name ?? null
        ]);
    } catch (err) {
        // MySQL error 1062 = duplicate entry (unique constraint violation)
        if (err instanceof Error && err.message.includes('Duplicate entry')) {
            throw new Error('A user with that email already exists.');
        }
        throw err;
    }
    return {
        id,
        email,
        name: name ?? null
    };
}
async function signIn(email, password) {
    const user = await getUserByEmail(email);
    if (!user) throw new Error('Invalid email or password.');
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password.');
    await createSession({
        id: user.id,
        email: user.email,
        name: user.name
    });
    return {
        id: user.id,
        email: user.email,
        name: user.name
    };
}
async function createSession(user) {
    const token = await new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$node$2f$esm$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
        sub: user.id,
        email: user.email,
        name: user.name
    }).setProtectedHeader({
        alg: 'HS256'
    }).setIssuedAt().setExpirationTime('7d').sign(getSecret());
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/'
    });
}
async function getSession() {
    try {
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$node$2f$esm$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, getSecret());
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name ?? null
        };
    } catch  {
        return null;
    }
}
async function signOut() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
    });
}
}),
"[project]/lib/rate-limit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * lib/rate-limit.ts
 *
 * Lightweight in-memory rate limiter for auth endpoints.
 * Uses a sliding-window counter keyed by IP address.
 *
 * ⚠️  AWS MULTI-INSTANCE WARNING
 * This store is process-local. With multiple ECS tasks or App Runner
 * instances, each replica has its own counter — an attacker can bypass
 * the limit by round-robining across instances.
 *
 * For production multi-instance deployments, swap this for a Redis-backed
 * implementation using AWS ElastiCache (Redis OSS). Drop-in replacement:
 *
 *   npm install @upstash/ratelimit @upstash/redis
 *   # or use ioredis pointing at your ElastiCache endpoint
 *
 * Add to .env:
 *   REDIS_URL=rediss://:token@your-cluster.cache.amazonaws.com:6379
 *
 * Single-instance deployments (one App Runner instance, one ECS task)
 * are safe with this in-memory implementation.
 *
 * Usage:
 *   const result = rateLimit('login', ip, { limit: 10, windowMs: 60_000 })
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
 */ __turbopack_context__.s([
    "rateLimit",
    ()=>rateLimit
]);
const store = new Map();
// Clean up expired entries every 5 minutes to prevent unbounded memory growth.
// .unref() ensures this timer does not prevent Node.js from exiting on SIGTERM
// (important for graceful container shutdown in ECS / App Runner).
setInterval(()=>{
    const now = Date.now();
    for (const [key, win] of store){
        if (now > win.resetAt) store.delete(key);
    }
}, 5 * 60_000).unref();
function rateLimit(action, ip, options) {
    const key = `${action}:${ip}`;
    const now = Date.now();
    let win = store.get(key);
    // Start a fresh window if none exists or the previous one has expired.
    if (!win || now > win.resetAt) {
        win = {
            count: 0,
            resetAt: now + options.windowMs
        };
        store.set(key, win);
    }
    win.count += 1;
    const allowed = win.count <= options.limit;
    const remaining = Math.max(0, options.limit - win.count);
    return {
        allowed,
        remaining,
        resetAt: win.resetAt
    };
}
}),
"[project]/lib/logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
/**
 * lib/logger.ts
 *
 * Structured JSON logger powered by pino.
 * In development (NODE_ENV !== 'production') logs are pretty-printed to
 * stdout. In production every line is a JSON object for log-aggregation
 * services (Datadog, CloudWatch, Loki, etc.).
 *
 * Usage:
 *   import log from '@/lib/logger'
 *   log.info({ route: '/api/customers' }, 'Fetched customers')
 *   log.error({ err, route }, 'Failed to create order')
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$pino$29$__ = __turbopack_context__.i("[externals]/pino [external] (pino, cjs, [project]/node_modules/pino)");
;
const logger = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$pino$29$__["default"])({
    level: process.env.LOG_LEVEL ?? 'info',
    ...("TURBOPACK compile-time value", "development") !== 'production' && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard'
            }
        }
    }
});
const __TURBOPACK__default__export__ = logger;
}),
"[project]/app/api/auth/register/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * app/api/auth/register/route.ts
 *
 * Creates a new user account and immediately signs them in.
 *
 * Gate: Requires ALLOW_REGISTRATION=true (default) in environment.
 *       Set ALLOW_REGISTRATION=false to disable public sign-up for
 *       internal deployments where accounts are provisioned by admins.
 *
 * Rate limit: 5 registrations per IP per 10 minutes.
 *
 * Responses:
 *   201  { user: AuthUser }   — account created, cookie set
 *   400  { error: string }    — validation failure or duplicate email
 *   403  { error: string }    — registration disabled
 *   429  { error: string }    — rate limit exceeded
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/rate-limit.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(request) {
    // Block registration entirely when the feature flag is off.
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALLOW_REGISTRATION"]) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Registration is disabled. Contact an administrator.'
        }, {
            status: 403
        });
    }
    // Rate limit: 5 attempts per IP per 10 minutes.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const limit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimit"])('register', ip, {
        limit: 5,
        windowMs: 10 * 60_000
    });
    if (!limit.allowed) {
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].warn({
            ip,
            route: 'POST /api/auth/register'
        }, 'Rate limit exceeded');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Too many registration attempts. Please try again later.'
        }, {
            status: 429
        });
    }
    try {
        const { email, password, name } = await request.json();
        if (!email || !password) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Email and password are required.'
            }, {
                status: 400
            });
        }
        // Minimum length check before bcrypt (cost 12) to avoid slow hashing
        // on obviously invalid inputs.
        if (password.length < 8) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Password must be at least 8 characters.'
            }, {
                status: 400
            });
        }
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createUser"])(email, password, name);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSession"])(user);
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].info({
            userId: user.id,
            route: 'POST /api/auth/register'
        }, 'User registered');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            user
        }, {
            status: 201
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].error({
            err,
            route: 'POST /api/auth/register'
        }, message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message
        }, {
            status: 400
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02rswiy._.js.map