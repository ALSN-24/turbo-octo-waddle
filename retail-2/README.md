# Retail CRM v3 — MySQL Migration

> Built on Next.js 16 (App Router) · TypeScript 5.7 · MySQL 8.0+

---

## Table of Contents

1. [What Changed](#1-what-changed)
2. [Quick Start](#2-quick-start)
3. [File Integration Guide](#3-file-integration-guide)
4. [Environment Variables](#4-environment-variables)
5. [Database Setup](#5-database-setup)
6. [Architecture Overview](#6-architecture-overview)
7. [Authentication Flow](#7-authentication-flow)
8. [API Reference](#8-api-reference)
9. [Code Documentation](#9-code-documentation)
10. [Development Guide](#10-development-guide)
11. [Deployment Checklist](#11-deployment-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What Changed

| Area | Before | After |
|---|---|---|
| Database | PostgreSQL | MySQL 8.0+ via `mysql2` |
| Authentication | Magic-link credential flow | bcrypt passwords + HS256 JWT cookie |
| Sessions | SSR session cookie | `crm_session` HttpOnly cookie, 7-day expiry |
| Data access | client SDK queries | `fetch('/api/...')` → API routes → raw SQL |
| Route protection | session refresh flow | Edge JWT verification in `middleware.ts` |
| **Removed packages** | `@vercel/analytics` | *(deleted)* |
| **Added packages** | — | `mysql2`, `bcryptjs`, `jose`, `@types/bcryptjs` |

---

## 2. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create the database and all tables
mysql -u root -p < scripts/001_create_tables_mysql.sql

# 3. Configure environment variables
cp .env.example .env.local
#    → Edit .env.local with your MySQL credentials and a JWT secret

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/auth/login`.

> Note: For local development, `MYSQL_HOST` in `.env.local` should be `localhost` when MySQL is running on your machine. Use `db` only when the app is run through `docker compose`.
>
> This app depends on MySQL and server-side rendering. It cannot be deployed as a static-only site on S3, and DynamoDB is not a drop-in replacement for the current database layer.

### Codespaces / Dev Container

This repository includes a preconfigured dev container in `.devcontainer/` that starts:
- a local MySQL service,
- the app workspace container,
- port forwarding for `3000`.

To use it in GitHub Codespaces or VS Code Remote Containers:
1. Open the repository in Codespaces or in VS Code.
2. Choose **Reopen in Container**.
3. When the container is ready, run:

```bash
npm install
npm run dev
```

The dev container uses the included `.env.example` values for development. If you want real secrets, create a `.env.local` in the repo root and keep it out of source control.

### Optional: Run with Docker Compose

If you prefer to run the app in Docker, use the included `docker-compose.yml` and `Dockerfile`.

```bash
docker compose up --build
```

On Windows, Docker Desktop must be running before executing `docker compose`. If you see an error like `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine` or `npipe:////./pipe/docker_engine`, start or restart Docker Desktop and try again.
Click **Sign up** to create your first account.

**Verify the database connection:**
```bash
curl http://localhost:3000/api/health
# Expected: { "status": "ok", "checks": { "db": true, "jwt_secret": true, "mysql_host": true } }
```

---

## 3. File Integration Guide

Copy each file from the output folder into your project at the path shown.  
The **Action** column tells you what to do with each file.

Legend: `NEW` = create this file · `REPLACE` = overwrite the existing file · `DELETE` = remove from project · `KEEP` = no changes needed

### 3.1 Root / Configuration

| File | Action | Notes |
|---|---|---|
| `package.json` | REPLACE | Added `mysql2`, `bcryptjs`, `jose`, `eslint`. Removed legacy SDK packages. |
| `next.config.mjs` | REPLACE | Added `serverExternalPackages` for `mysql2` and `bcryptjs`. Removed `ignoreBuildErrors`. |
| `tsconfig.json` | KEEP | No changes required. |
| `middleware.ts` | REPLACE | Complete rewrite. Guards all routes via JWT. |
| `eslint.config.mjs` | NEW | ESLint flat config. Required for `npm run lint` to work. |
| `next-env.d.ts` | NEW | Next.js TypeScript references. Required for type resolution. |
| `.env.example` | REPLACE | Updated with MySQL and JWT variables. |
| `scripts/001_create_tables_mysql.sql` | NEW | MySQL 8.0 schema for all five tables. |
| `scripts/001_create_tables.sql` | DELETE | Old PostgreSQL schema. No longer used. |
| `styles/globals.css` | DELETE | Orphaned duplicate. CSS lives in `app/globals.css`. |

### 3.2 Library (`lib/`)

| File | Action | Notes |
|---|---|---|
| `lib/env.ts` | NEW | Validates required env vars at startup. |
| `lib/auth.ts` | NEW | `createUser`, `signIn`, `signOut`, `getSession`. |
| `lib/types.ts` | REPLACE | Added `description` field to `Product` interface. |
| `lib/utils.ts` | KEEP | No changes. |
| `lib/mysql/db.ts` | NEW | MySQL pool singleton + `query()`, `queryOne()`, `withTransaction()`. |
| `lib/mysql/queries.ts` | NEW | All data access functions (customers, products, orders, dashboard). |
| `lib/legacy/` | DELETE | Entire legacy adapter directory. |

### 3.3 App Pages (`app/`)

| File | Action | Notes |
|---|---|---|
| `app/globals.css` | REPLACE | Added dark mode `--success` and `--warning` CSS variable overrides. |
| `app/layout.tsx` | REPLACE | Mounts `ThemeProvider` + theme-aware `Toaster`. |
| `app/error.tsx` | NEW | Root error boundary for server component crashes. |
| `app/loading.tsx` | NEW | Root loading skeleton (shown during data fetches). |
| `app/not-found.tsx` | NEW | Custom 404 page. |
| `app/page.tsx` | REPLACE | Dashboard. Reads MySQL via `getDashboardStats()`. |
| `app/customers/page.tsx` | REPLACE | Loads customers + orders in parallel. |
| `app/customers/loading.tsx` | NEW | Re-exports root loading skeleton. |
| `app/inventory/page.tsx` | REPLACE | Loads products. |
| `app/inventory/loading.tsx` | NEW | Re-exports root loading skeleton. |
| `app/orders/page.tsx` | REPLACE | Loads orders, customers, active products. |
| `app/orders/loading.tsx` | NEW | Re-exports root loading skeleton. |
| `app/reports/page.tsx` | REPLACE | Loads all data for analytics. |
| `app/reports/loading.tsx` | NEW | Re-exports root loading skeleton. |
| `app/auth/login/page.tsx` | REPLACE | Calls `/api/auth/login`. Spinner, validation, error display. |
| `app/auth/sign-up/page.tsx` | REPLACE | Calls `/api/auth/register`. Client-side validation. |
| `app/auth/sign-up-success/page.tsx` | REPLACE | No longer shows email confirmation message. |
| `app/auth/error/page.tsx` | REPLACE | Handles `?error=` and `?message=` params. |

### 3.4 API Routes (`app/api/`)

| File | Action | Notes |
|---|---|---|
| `app/api/auth/login/route.ts` | NEW | `POST` — verify credentials, set JWT cookie. |
| `app/api/auth/logout/route.ts` | NEW | `POST` — expire session cookie. |
| `app/api/auth/register/route.ts` | NEW | `POST` — create user, set JWT cookie. |
| `app/api/health/route.ts` | NEW | `GET` — liveness check. No auth required. |
| `app/api/customers/route.ts` | REPLACE | `GET`/`POST` with input validation. |
| `app/api/customers/[id]/route.ts` | REPLACE | `PUT`/`DELETE` with 404 handling. |
| `app/api/products/route.ts` | REPLACE | `GET`/`POST` with validation. |
| `app/api/products/[id]/route.ts` | REPLACE | `PUT`/`DELETE` with 404 handling. |
| `app/api/orders/route.ts` | REPLACE | `GET`/`POST` — uses transaction for create. |
| `app/api/orders/[id]/route.ts` | REPLACE | `GET`/`PUT`/`DELETE` with 404 + status validation. |

### 3.5 Components (`components/`)

| File | Action | Notes |
|---|---|---|
| `components/crm-layout.tsx` | REPLACE | Accepts `userEmail` / `userName` props instead of a provider-specific user object. |
| `components/crm-sidebar.tsx` | REPLACE | Logout calls `/api/auth/logout`. Error-tolerant redirect. |
| `components/customers-content.tsx` | REPLACE | Fetch API driven data flow. Toast feedback. Loading states. Validation. |
| `components/inventory-content.tsx` | REPLACE | Same as customers. Added `description` field + `Textarea` component. |
| `components/orders-content.tsx` | REPLACE | Same as customers. Atomic order creation. |
| `components/reports-content.tsx` | REPLACE | Removed unused import. Fixed division-by-zero edge case. |
| `components/dashboard-content.tsx` | KEEP | No changes. |
| `components/theme-provider.tsx` | KEEP | No changes. |
| `components/ui/` | KEEP | All shadcn/ui components unchanged. |

---

## 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# MySQL connection
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=retail_crm

# JWT signing secret — REQUIRED
# Generate a secure value: openssl rand -base64 32
JWT_SECRET=replace_with_a_long_random_secret
```

> **Security note:** `JWT_SECRET` must be at least 32 random bytes. Never commit `.env.local` to version control.  
> The application will **refuse to start** if `JWT_SECRET`, `MYSQL_HOST`, `MYSQL_USER`, or `MYSQL_DATABASE` are missing.

---

## 5. Database Setup

### Create the database and tables

```bash
mysql -u root -p < scripts/001_create_tables_mysql.sql
```

The script is idempotent (uses `IF NOT EXISTS`) — safe to run multiple times.

### Schema summary

```
users          — Application accounts (email + bcrypt password hash)
customers      — CRM customers
products       — Inventory items with stock tracking
orders         — Customer orders (FK → customers, SET NULL on customer delete)
order_items    — Line items (FK → orders CASCADE, FK → products SET NULL)
```

### Verify the schema was created

```sql
USE retail_crm;
SHOW TABLES;
-- Should show: customers, order_items, orders, products, users
```

---

## 6. Architecture Overview

```
Browser Request
    │
    ▼
middleware.ts  (Edge Runtime)
    │  Reads crm_session cookie → jwtVerify()
    │  → Redirect to /auth/login if missing/expired
    │  → 401 JSON if unauthenticated API request
    ▼
Server Component  (Node.js Runtime)
    │  await Promise.all([getData(), getSession()])
    │  getSession() = cookie read + jwtVerify only (no DB query)
    ▼
Client Component
    │  Renders with initial data from server
    │  User actions → fetch('/api/...')
    ▼
API Route  (Node.js Runtime)
    │  Input validation → lib/mysql/queries.ts
    ▼
MySQL Database
```

### Key design decisions

- **No N+1 queries.** The `fetchOrders()` helper uses two batch queries: one JOIN for orders+customers, one `WHERE order_id IN (...)` for items+products.
- **Atomic order creation.** `createOrder()` wraps all INSERT statements in `withTransaction()`. If any item fails, the parent order row is rolled back.
- **JWT is stateless.** `getSession()` reads the cookie and calls `jwtVerify()` only — no database round-trip. Adding session data to a page is essentially free.
- **HMR pool guard.** The MySQL pool is stored on `globalThis.__mysqlPool` so Next.js hot-module reloads in development reuse the existing pool instead of leaking connections.

---

## 7. Authentication Flow

```
Register:  POST /api/auth/register
           → bcrypt.hash(password, 12)
           → INSERT users
           → SignJWT → set crm_session cookie
           → redirect /

Login:     POST /api/auth/login
           → getUserByEmail()
           → bcrypt.compare(password, hash)
           → SignJWT → set crm_session cookie
           → redirect /

Request:   middleware.ts
           → jwtVerify(cookie) — no DB query
           → passes through or redirects/401s

Logout:    POST /api/auth/logout
           → set cookie with MaxAge=0 (expires it)
           → redirect /auth/login
```

### Session cookie properties

| Property | Value |
|---|---|
| Name | `crm_session` |
| Algorithm | HS256 |
| Expiry | 7 days |
| HttpOnly | `true` — not accessible to JavaScript |
| Secure | `true` in production (HTTPS only) |
| SameSite | `Lax` — CSRF protection for top-level navigation |
| Path | `/` — applies to all routes |

---

## 8. API Reference

All routes except `/api/auth/*` and `/api/health` require a valid `crm_session` cookie.  
Unauthenticated requests receive `401 { "error": "Unauthorized." }`.

### Authentication

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Verify credentials, set session cookie |
| `POST` | `/api/auth/register` | Create account, set session cookie |
| `POST` | `/api/auth/logout` | Expire session cookie |

### Customers

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customers |
| `POST` | `/api/customers` | Create customer (`name`, `email` required) |
| `PUT` | `/api/customers/:id` | Update customer fields |
| `DELETE` | `/api/customers/:id` | Delete customer |

### Products

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/products` | List all products (`?active=true` for active only) |
| `POST` | `/api/products` | Create product (`name`, `sku`, `price`, `stock` required) |
| `PUT` | `/api/products/:id` | Update product fields |
| `DELETE` | `/api/products/:id` | Delete product |

### Orders

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders with customer + items |
| `POST` | `/api/orders` | Create order (atomic — items created in same transaction) |
| `GET` | `/api/orders/:id` | Get single order |
| `PUT` | `/api/orders/:id` | Update order status |
| `DELETE` | `/api/orders/:id` | Delete order (cascades to order_items) |

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | DB connectivity + env var check. No auth required. |

---

## 9. Code Documentation

### `lib/env.ts`

Validates required environment variables at **module load time** — before the server accepts any requests. If any required variable is missing, it throws a descriptive error listing each missing variable with a hint about what it's for.

Import this module at the top of any server-side file that depends on environment variables. It is already imported by `lib/mysql/db.ts` and `lib/auth.ts`.

```typescript
// Usage — add this import at the top of server-side files:
import '@/lib/env'
```

---

### `lib/mysql/db.ts`

Exports a single MySQL connection pool and three helper functions.

**Pool configuration:**
- `dateStrings: true` — DATETIME columns return ISO strings. Required because `Date` objects cannot be serialised from Server Components to Client Components in Next.js.
- `decimalNumbers: true` — DECIMAL columns return JavaScript numbers automatically.
- `connectionLimit: 10` — maximum 10 simultaneous connections.

**Exported functions:**

```typescript
// Execute a parameterised query and return typed rows
query<T>(sql: string, params?: unknown[]): Promise<T[]>

// Like query<T> but returns the first row or null
queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>

// Run a callback inside a transaction — commits on success, rolls back on error
withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T>
```

---

### `lib/auth.ts`

Handles all authentication logic. Passwords are hashed with bcryptjs (work factor 12). Sessions are signed JWT tokens stored in an HttpOnly cookie.

**Exported functions:**

```typescript
// Create a new user (throws if email already exists)
createUser(email: string, password: string, name?: string): Promise<AuthUser>

// Verify credentials and set the session cookie
signIn(email: string, password: string): Promise<AuthUser>

// Read and verify the session cookie — no DB query
getSession(): Promise<AuthUser | null>

// Expire the session cookie
signOut(): Promise<void>

// Look up a user by email (used internally by signIn)
getUserByEmail(email: string): Promise<(AuthUser & { password_hash: string }) | null>

// Create a signed JWT and set the session cookie
createSession(user: AuthUser): Promise<void>
```

---

### `lib/mysql/queries.ts`

All database access for the application. Every function returns plain TypeScript objects matching the interfaces in `lib/types.ts`.

**Customers:** `getCustomers()`, `getCustomerById(id)`, `createCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)`

**Products:** `getProducts(activeOnly?)`, `getProductById(id)`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`

**Orders:** `getOrders()`, `getOrdersByStatus(status)`, `getOrderById(id)`, `createOrder(data)`, `updateOrderStatus(id, status)`, `deleteOrder(id)`

**Dashboard:** `getDashboardStats()` — returns counts, total revenue, low-stock products, recent orders, pending order count. Uses 6 parallel queries.

The private `fetchOrders(suffix, params)` helper performs a JOIN of orders with customers, then batch-loads all related order_items with their products in a second query. This ensures any list of N orders always uses exactly 2 database queries regardless of N.

---

### `middleware.ts`

Runs on every request in the **Edge Runtime** (before the Node.js server handles it). Imports only `next/server` and `jose` — both are edge-compatible.

**Routing logic:**

| Path pattern | Unauthenticated | Authenticated |
|---|---|---|
| `/api/auth/*`, `/api/health` | Pass through | Pass through |
| `/api/*` (all others) | Return `401` JSON | Pass through |
| `/`, `/customers`, `/inventory`, `/orders`, `/reports` | Redirect to `/auth/login` | Pass through |
| `/auth/login`, `/auth/sign-up` | Pass through | Redirect to `/` |
| Everything else | Pass through | Pass through |

---

## 10. Development Guide

### Adding a new data entity (e.g. "suppliers")

1. Add the table to `scripts/001_create_tables_mysql.sql`
2. Add the TypeScript interface to `lib/types.ts`
3. Add CRUD functions to `lib/mysql/queries.ts`
4. Create `app/api/[entity]/route.ts` (GET, POST) and `app/api/[entity]/[id]/route.ts` (PUT, DELETE)
5. Create the server page at `app/[entity]/page.tsx`
6. Create `app/[entity]/loading.tsx` re-exporting the root loading skeleton
7. Create the client content component at `components/[entity]-content.tsx`
8. Add the route to `PROTECTED_PAGES` in `middleware.ts`
9. Add the nav item to `navItems` in `components/crm-sidebar.tsx`

### Adding a database query

All queries live in `lib/mysql/queries.ts`. Conventions:

- Always use parameterised queries — never interpolate user input into SQL.
- Use `query<T>()` for lists, `queryOne<T>()` for single-row lookups.
- Use `withTransaction()` for operations that write to multiple tables.
- Return the freshly-read row after INSERT or UPDATE.

```typescript
// Example pattern
export async function createEntity(data: Omit<Entity, 'id' | 'created_at' | 'updated_at'>) {
  const id = crypto.randomUUID()
  await query(
    'INSERT INTO entities (id, name) VALUES (?, ?)',
    [id, data.name],
  )
  return getEntityById(id) // always return the fresh read
}
```

### Running linting

```bash
npm run lint
```

ESLint uses `eslint.config.mjs` with `next/core-web-vitals` and `next/typescript`. Variables prefixed with `_` are exempt from the unused-variable rule (used in route handlers: `_request`).

---

## 11. Deployment Checklist

### Required before go-live

- [ ] Set `JWT_SECRET` to a 32+ byte random value (`openssl rand -base64 32`)
- [ ] Set all `MYSQL_*` variables to production credentials
- [ ] Set `NODE_ENV=production` (enables `Secure` cookie flag and Next.js production mode)
- [ ] Run `npm run build` and verify it completes without errors
- [ ] Run the MySQL schema script against the production database
- [ ] Confirm `/api/health` returns `{ "status": "ok" }` in the production environment

### Recommended

- [ ] Use a dedicated MySQL user with only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on `retail_crm`
- [ ] Enable TLS for the MySQL connection (add `ssl` config to the pool in `lib/mysql/db.ts`)
- [ ] Add rate limiting to `/api/auth/login` and `/api/auth/register` (nginx or a middleware library)
- [ ] Set up log monitoring for server errors
- [ ] Configure automated database backups

### Post-deployment verification

1. Visit `/api/health` — all checks must be `true`
2. Register a new user at `/auth/sign-up`
3. Log in at `/auth/login`
4. Create and delete a test customer
5. Verify `crm_session` cookie is `HttpOnly`, `Secure`, `SameSite=Lax` in browser DevTools
6. Test that visiting `/api/customers` without a cookie returns `401`

---

## 12. Troubleshooting

### "Missing required environment variables" on startup

`lib/env.ts` runs before the server accepts requests. It lists every missing variable with a hint. Copy `.env.example` to `.env.local` and fill in all required values.

### `/api/health` returns `{ "db": false }`

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Check the database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'retail_crm'"

# Check the schema is applied
mysql -u root -p retail_crm -e "SHOW TABLES"

# Check user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'your_user'@'localhost'"
```

### Redirect loop between `/` and `/auth/login`

The session cookie is not being set. Check:
- `JWT_SECRET` is set in `.env.local`
- You are running over HTTP in development (the `Secure` flag requires HTTPS — only affects production)
- Your browser is not blocking cookies for `localhost`

### `bcryptjs` or `mysql2` module not found

```bash
npm install
```

These are listed in `package.json` dependencies. If missing after install, check that `node_modules` exists and is not in `.gitignore` for your deployment environment.

### TypeScript errors after copying files

- Ensure `next-env.d.ts` is at the project root
- Run `npm install` to install `@types/bcryptjs` and other `devDependencies`
- Do not manually edit `next-env.d.ts` — Next.js manages this file

### "Too many connections" in development

This should not occur with the `globalThis` pool guard, but can happen after many rapid server restarts. Wait ~60 seconds for idle connections to time out, or restart MySQL.

### Docker Compose fails because the Docker daemon is unavailable

If `docker compose up --build` fails with a `npipe` API connection error on Windows, the Docker daemon is not running. Open Docker Desktop and wait until it reports that the engine is running, then retry the command.

If you use WSL, you may also need to run `wsl --shutdown` and restart Docker Desktop.

---

## Package versions

| Package | Version |
|---|---|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.7.3 |
| mysql2 | ^3.11.3 |
| bcryptjs | ^2.4.3 |
| jose | ^5.9.6 |
| tailwindcss | ^4.2.0 |
| sonner | ^1.7.1 |
