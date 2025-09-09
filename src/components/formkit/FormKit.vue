<template>
  <Form
    ref="formRef"
    :key="formKey"
    v-slot="$form"
    :initial-values="initialValues"
    :resolver="resolver"
    @submit="submit"
    class="flex flex-wrap items-start gap-y-3 gap-x-8"
  >
    <slot name="start"></slot>

    <slot v-bind="$form">
      <template v-for="({ inputId, label, required, help, colSpan, ...rest }, name) in fields" :key="inputId ?? name">
        <div class="flex flex-start" :style="styleColumnSpan(colSpan)">
          <FormKitField :name="name" :input-id="inputId" :required="required" :label="label" :help="help" :rest="rest" :form-api="$form">
            <component :is="FormKitControl" :label="label" :input-id="inputId" :rest="rest" :size="size"/>
          </FormKitField>
        </div>
      </template>
    </slot>

    <slot name="end"></slot>

    <div class="w-full flex justify-between">
      <slot name="footer"></slot>
    </div>
  </Form>
</template>

<script setup lang="ts">
import Form from "@primevue/forms/form";

import FormKitField from "./FormKitField.vue";
import FormKitControl from "./FormKitControl.vue";


import {computed, provide, ref, watch} from "vue";
import {equals, includesMatch} from "./utils/visibility.ts";
import {useResizeObserver} from "@vueuse/core";
import type {FormKitProps} from "./types/FormKitProps.ts";

import useFormKitValidations from "./useFormKitValidations.ts";

import spanStyleMap from "./utils/spanStyleMap.ts";


const {fields, size = "medium"} = defineProps<FormKitProps>();

const emit = defineEmits(["submit"])
const model = defineModel("modelValue")

const {resolver} = useFormKitValidations(fields)

const body = ref<HTMLElement>(document.body);
const ww = ref(2600)

useResizeObserver(body, (entries) => {
  const entry = entries[0]
  const {width} = entry.contentRect
  ww.value = width
})

// Ref for the underlying PrimeVue Form instance and a key to remount when initial-values change
const formRef = ref<any>(null)
const formKey = ref(0)

provide('$fcDynamicForm', {
  getFieldValue: (fieldName: string) => {
    // prefer a getter if available, fall back to the state map
    const api: any = formRef.value || model.value
    const state = api?.getFieldState ? api.getFieldState(fieldName) : api?.states?.[fieldName];
    return state?.value;
  },
  watchFieldValue: (fieldName: string, cb: (val: any) => void) => {
    // consumers can watch a specific field's value reactively
    return watch(
      () => {
        const api: any = formRef.value || model.value
        const state = api?.getFieldState ? api.getFieldState(fieldName) : api?.states?.[fieldName];
        return state?.value;
      },
      (val) => cb(val),
      {immediate: true}
    );
  },
});


const initialValues = computed<any>(() => {
  const obj: { [key: string]: any } = {};
  Object.keys(fields).forEach(key => {
    obj[key] = (fields as any)[key]?.defaultValue;
  })
  return obj;
})

// Remount the Form if initialValues object changes (e.g., setFields called after mount)
watch(initialValues, () => {
  formKey.value++
}, { deep: true })

const styleColumnSpan = computed(() => (span: { mobile: number, tablet: number, desktop: number }) => {

  let value = ""
  let device: "desktop" | "tablet" | "mobile" = "desktop"

  if (ww.value < 512) {
    device = "mobile"
  } else if (ww.value > 512 && 724) {
    device = "tablet"
  }

  if (!span) {
    value = spanStyleMap["1"]
  } else {
    value = spanStyleMap[`${span[device]}`]
  }

  return {
    "width": value
  }
})

function isFieldVisibleByConfig(_: string, cfg: any, values: Record<string, any>): boolean {
  // underscore is fieldName

  const showWhen = cfg?.showWhen;
  const hideWhen = cfg?.hideWhen;

  let visible = true;
  if (showWhen?.field) {
    const left = values[showWhen.field];
    if (showWhen.includes !== undefined) visible = includesMatch(left, showWhen.includes);
    else visible = equals(left, showWhen.equals);
  }
  if (hideWhen?.field) {
    const left = values[hideWhen.field];

    let shouldHide = false;
    if (hideWhen.includes !== undefined) shouldHide = includesMatch(left, hideWhen.includes);
    else shouldHide = equals(left, hideWhen.equals);
    if (shouldHide) visible = false;
  }
  return visible;
}

const submit = (event: any) => {
  try {
    const states: Record<string, any> = event?.states || {};

    // Build a plain values map from states
    const values: Record<string, any> = {};
    Object.keys(states).forEach(k => {
      values[k] = states[k]?.value;
    });

    // Filter states by visibility using fields config
    const conditionalStates: Record<string, any> = {};

    Object.entries(fields as any).forEach(([name, cfg]: any) => {
      const visible = isFieldVisibleByConfig(name as string, cfg, values);
      if (visible && states[name]) {
        conditionalStates[name] = states[name];
      }
    });

    const nextEvent = {
      ...event,
      states: conditionalStates
    };

    emit('submit', nextEvent);

  } catch (e) {
    // Fallback: emit as-is if anything unexpected occurs
    emit('submit', event);
  }
};

</script>