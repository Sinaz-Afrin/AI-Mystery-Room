import { z } from 'zod'
import { generatedCaseSchema } from '../../validators/caseSchemas.js'

const supportedKeywords = new Set([
  '$id', '$defs', '$ref', '$anchor', 'type', 'format', 'title', 'description', 'enum',
  'items', 'prefixItems', 'minimum', 'maximum', 'anyOf', 'oneOf',
  'properties', 'additionalProperties', 'required', 'propertyOrdering',
])

function filterSupportedKeywords(value) {
  if (Array.isArray(value)) return value.map(filterSupportedKeywords)
  if (value === null || typeof value !== 'object') return value

  const output = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === 'properties' || key === '$defs') {
      output[key] = Object.fromEntries(Object.entries(child).map(([name, schema]) => [name, filterSupportedKeywords(schema)]))
      continue
    }
    if (key === 'const') {
      output.enum = [child]
      continue
    }
    if (!supportedKeywords.has(key)) continue
    output[key] = filterSupportedKeywords(child)
  }
  return output
}

export function makeGeminiOutputSchema() {
  return filterSupportedKeywords(z.toJSONSchema(generatedCaseSchema))
}
