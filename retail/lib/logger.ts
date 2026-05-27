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
 */

import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    },
  }),
})

export default logger
