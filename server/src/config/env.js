import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  GENERATION_MODE: z.enum(['mock', 'gemini']).default('mock'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/ai_mystery_room'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  GENERATION_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  GENERATION_MAX_CONCURRENT: z.coerce.number().int().min(1).max(20).default(2),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && value.GENERATION_MODE !== 'gemini') {
    context.addIssue({ code: 'custom', path: ['GENERATION_MODE'], message: 'Production must use Gemini generation.' })
  }
  if (value.NODE_ENV === 'production' && value.MONGODB_URI === 'mongodb://127.0.0.1:27017/ai_mystery_room') {
    context.addIssue({ code: 'custom', path: ['MONGODB_URI'], message: 'Set the production MongoDB URI explicitly.' })
  }
  if (value.NODE_ENV === 'production' && value.CLIENT_ORIGIN === 'http://localhost:5173') {
    context.addIssue({ code: 'custom', path: ['CLIENT_ORIGIN'], message: 'Set the production frontend origin explicitly.' })
  }
  if (value.GENERATION_MODE === 'gemini' && !value.GEMINI_API_KEY) {
    context.addIssue({ code: 'custom', path: ['GEMINI_API_KEY'], message: 'Required when GENERATION_MODE=gemini.' })
  }
  if (value.GENERATION_MODE === 'gemini' && !value.GEMINI_MODEL) {
    context.addIssue({ code: 'custom', path: ['GEMINI_MODEL'], message: 'Required when GENERATION_MODE=gemini.' })
  }
  if (value.GENERATION_MODE === 'gemini' && value.GEMINI_MODEL && !/^gemini-[a-z0-9.]+(?:-[a-z0-9.]+)*$/.test(value.GEMINI_MODEL)) {
    context.addIssue({ code: 'custom', path: ['GEMINI_MODEL'], message: 'Use the Gemini API model ID (for example, gemini-3.5-flash-lite), not its display name.' })
  }
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  const details = parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('; ')
  throw new Error(`Invalid environment configuration: ${details}`)
}

export const env = parsed.data
