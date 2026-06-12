import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV === 'production' && process.env.AXIOM_TOKEN
    ? {
        transport: {
          target: '@axiomhq/pino',
          options: {
            dataset: 'kandles-admin',
            token: process.env.AXIOM_TOKEN,
          },
        },
      }
    : { transport: { target: 'pino-pretty' } }),
})
