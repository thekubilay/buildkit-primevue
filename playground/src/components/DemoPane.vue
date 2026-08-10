<template>
  <div class="pg-demo">
    <header class="pg-demo__head">
      <div>
        <h2>{{ demo.title }}</h2>
        <p class="pg-muted">{{ demo.summary }}</p>
      </div>
      <div class="pg-demo__opts">
        <label>
          size
          <select v-model="size">
            <option value="small">small</option>
            <option value="medium">medium</option>
            <option value="large">large</option>
          </select>
        </label>
        <label>
          locale
          <select v-model="locale">
            <option value="ja">ja</option>
            <option value="en">en</option>
          </select>
        </label>
      </div>
    </header>

    <ul v-if="demo.checks?.length" class="pg-checks">
      <li v-for="(check, i) in demo.checks" :key="i">{{ check }}</li>
    </ul>

    <div class="pg-demo__body">
      <div class="pg-card pg-card--form">
        <FormKit
          :key="formKey"
          v-model="form"
          :fields="fields"
          :size="size"
          :locale="locale"
          @submit="onSubmit"
        >
          <template #footer>
            <div class="pg-actions">
              <Button type="submit" size="small" label="Submit" @click="submitClicked"/>
              <Button
                v-if="demo.sampleData"
                type="button"
                size="small"
                severity="secondary"
                label="setFields(sample)"
                @click="loadSample"
              />
              <Button type="button" size="small" severity="secondary" label="clear()" @click="clearForm"/>
              <Button type="button" size="small" severity="secondary" outlined label="Reset demo" @click="reset"/>
            </div>
          </template>
        </FormKit>
      </div>

      <div class="pg-card pg-card--panels">
        <JsonPanel
          title="Last submit"
          :value="lastSubmit ?? '— press Submit —'"
          :badge="submitBadge"
          :badge-tone="submitTone"
        />
        <JsonPanel title="getPayload(states, fields)" :value="lastPayload ?? '— press Submit —'"/>
        <JsonPanel title="Rendered field keys" :value="renderedKeys"/>
        <JsonPanel title="Field definitions" :value="fields"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import Button from 'primevue/button'

// Consumer-side imports: the package root, exactly as an app would.
import {FormKit, getPayload, setFields, clear, isSeparatorField} from 'buildkit-primevue'

import JsonPanel from './JsonPanel.vue'
import type {Demo, Fields} from '../demos/types'

const props = defineProps<{demo: Demo}>()

const fields = ref<Fields>(props.demo.fields())
const size = ref(props.demo.size ?? 'small')
const locale = ref(props.demo.locale ?? 'en')

// FormKit writes into fields[key].defaultValue, so switching demos needs a fresh
// object AND a remount — otherwise stale defaults bleed across demos.
const formKey = ref(0)
const form = ref<Record<string, any>>({})

const lastSubmit = ref<any>(null)
const lastPayload = ref<any>(null)
const lastValid = ref<boolean | null>(null)

const renderedKeys = computed(() => ({
  inputs: Object.keys(fields.value).filter(k => !isSeparatorField(fields.value[k])),
  separators: Object.keys(fields.value).filter(k => isSeparatorField(fields.value[k])),
}))

const submitBadge = computed(() => {
  if (lastValid.value === null) return undefined
  return lastValid.value ? 'valid' : 'invalid'
})
const submitTone = computed<'ok' | 'error'>(() => (lastValid.value ? 'ok' : 'error'))

function reset() {
  fields.value = props.demo.fields()
  lastSubmit.value = null
  lastPayload.value = null
  lastValid.value = null
  formKey.value++
}

watch(() => props.demo.id, () => {
  size.value = props.demo.size ?? 'small'
  locale.value = props.demo.locale ?? 'en'
  reset()
})

// Plain { name: value } map of whatever the Form currently holds.
function currentValues(): Record<string, any> {
  const api: any = form.value
  const values: Record<string, any> = {}
  Object.keys(fields.value).forEach(name => {
    if (isSeparatorField(fields.value[name])) return
    const state = api?.getFieldState ? api.getFieldState(name) : api?.states?.[name]
    values[name] = state?.value
  })
  return values
}

function onSubmit(event: any) {
  lastValid.value = !!event?.valid
  lastSubmit.value = {
    valid: event?.valid,
    // FormKit already strips hidden fields and separators from `states`
    states: Object.fromEntries(
      Object.entries(event?.states ?? {}).map(([k, v]: [string, any]) => [k, v?.value]),
    ),
    errors: event?.errors ?? null,
  }
  lastPayload.value = getPayload(event?.states ?? {}, fields.value)
}

// PrimeVue's Form owns submission; this only records that the button was pressed
// so an ignored click is distinguishable from a form that never validated.
function submitClicked() {
  if (lastValid.value === null) lastValid.value = false
}

function loadSample() {
  if (!props.demo.sampleData) return
  setFields(props.demo.sampleData, fields.value)
  formKey.value++
}

function clearForm() {
  clear(currentValues(), fields.value)
  formKey.value++
}
</script>
