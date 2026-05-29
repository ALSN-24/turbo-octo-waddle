/**
 * app/reports/loading.tsx — Reports route loading skeleton
 *
 * Next.js App Router renders this immediately while the Reports page's
 * Server Component fetches its data. The user sees the CRM shell instantly
 * rather than a blank screen.
 *
 * Re-exports the root loading skeleton (app/loading.tsx) so all five CRM
 * sections share a single implementation without duplication.
 */
export { default } from '@/app/loading'
