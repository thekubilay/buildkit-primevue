import type {FormKitField} from 'buildkit-primevue'

export type Fields = Record<string, FormKitField>

export interface Demo {
  /** URL hash slug, also the nav key */
  id: string
  title: string
  /** One-line description shown under the title */
  summary: string
  /** Longer notes rendered as a bullet list; use these to state what to look for */
  checks?: string[]
  /** Fresh field map. MUST return a new object each call — FormKit mutates defaultValue. */
  fields: () => Fields
  /** Optional API-shaped payload, wired to the "setFields(data)" button */
  sampleData?: Record<string, any>
  size?: 'small' | 'medium' | 'large'
  locale?: 'ja' | 'en'
}
