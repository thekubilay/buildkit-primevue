<template>
  <section class="pg-panel">
    <header class="pg-panel__head">
      <h3>{{ title }}</h3>
      <span v-if="badge" class="pg-badge" :class="badgeClass">{{ badge }}</span>
    </header>
    <pre class="pg-json"><code>{{ pretty }}</code></pre>
  </section>
</template>

<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{
  title: string
  value: unknown
  badge?: string
  badgeTone?: 'ok' | 'warn' | 'error'
}>()

const badgeClass = computed(() => `pg-badge--${props.badgeTone ?? 'ok'}`)

// Dates and undefined do not survive JSON.stringify intact, and both matter a lot
// when eyeballing a form payload, so they are annotated rather than dropped.
const pretty = computed(() => {
  const seen = new WeakSet()
  try {
    const out = JSON.stringify(
      props.value,
      (_k, v) => {
        if (v instanceof Date) return `Date(${v.toISOString()})`
        if (v === undefined) return '<undefined>'
        if (typeof v === 'function') return '<function>'
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '<circular>'
          seen.add(v)
        }
        return v
      },
      2,
    )
    return out ?? String(props.value)
  } catch (e: any) {
    return `<unserialisable: ${e?.message ?? e}>`
  }
})
</script>
