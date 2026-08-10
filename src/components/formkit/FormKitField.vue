<template>
  <!-- Use v-if instead of v-show to completely remove the element from DOM when hidden -->
  <FormField v-if="isVisible" :name="String(name)" class="bk-field" :class="classNameWidth" v-slot="{ error }">
    <div :class="className">
      <FormKitLabel>{{ label }}</FormKitLabel>
      <slot/>
    </div>
    <div class="bk-flex bk-flex-col bk-gap-2">
      <small v-if="help" v-html="help" class="bk-text-xs bk-text-muted"></small>
      <small v-if="formApi[name]?.error" class="bk-text-xs bk-text-error">{{ typeof error === 'string' ? error : (error?.message ?? '') }}</small>
    </div>
  </FormField>
</template>

<script setup lang="ts">
import FormKitLabel from './FormKitLabel.vue';
import FormField from '@primevue/forms/formfield';

import {computed, onMounted, onUnmounted, provide, inject, ref, watch} from 'vue';
import {equals, includesMatch} from "./utils/visibility.ts";

onMounted(() => {
  if (showWhen.value?.field && $fcDynamicForm?.watchFieldValue) {
    // Set the initial value if API supports it
    try {
      showValue.value = $fcDynamicForm?.getFieldValue?.(showWhen.value.field) ?? showValue.value;
    } catch {
    }
    const stop = $fcDynamicForm.watchFieldValue(showWhen.value.field, (val: any) => {
      showValue.value = val;
    });
    if (typeof stop === 'function') stops.push(stop);
  }
  if (hideWhen.value?.field && $fcDynamicForm?.watchFieldValue) {
    try {
      hideValue.value = $fcDynamicForm?.getFieldValue?.(hideWhen.value.field) ?? hideValue.value;
    } catch {
    }
    const stop = $fcDynamicForm.watchFieldValue(hideWhen.value.field, (val: any) => {
      hideValue.value = val;
    });
    if (typeof stop === 'function') stops.push(stop);
  }
});

onUnmounted(() => {
  stops.forEach((s) => {
    try {
      s();
    } catch {
    }
  });
});

const {
  name,
  inputId,
  required = false,
  label = '',
  help,
  rest = {},
  formApi = undefined,
} = defineProps<{
  name: string | number;
  inputId?: string | null;
  required?: boolean,
  label?: string;
  help?: string,
  rest?: any;
  formApi?: any;
}>();

// A `<label for>` is only honest when it names an element the user can actually focus.
// Two shapes cannot satisfy that:
//   - grouped inputs (CheckboxGroup, or RadioButton with options) render one control per
//     option, each with its own id and its own label; the field-level id belongs to none
//     of them, so `for` would dangle
//   - Slider and Editor put our id on their outer wrapper — PrimeVue exposes no way to
//     reach the inner handle / contenteditable — so `for` would point at a plain <div>
// In both cases the label is left without `for` rather than pointing somewhere useless.
const isGroupedControl = computed(() => {
  const cfg = rest as any;
  const hasOptions = Array.isArray(cfg?.options) && cfg.options.length > 0;
  return hasOptions && ['CheckboxGroup', 'RadioButton'].includes(cfg?.as);
});

const idStaysOnWrapper = computed(() => ['Slider', 'Editor'].includes((rest as any)?.as));

// Exposed through getters rather than as a snapshot: a field's `as`/`options` can change
// in place after mount (setDynamicFields re-running, an async config load) without
// FormKit remounting this component, since its v-for key is `inputId ?? name`. A snapshot
// would leave `for` pointing at an id that no longer exists — the dangling association
// this whole computation exists to prevent.
provide('$fcDynamicFormField', {
  get name() { return name },
  get inputId() { return inputId },
  get required() { return required },
  get labelFor() {
    return (isGroupedControl.value || idStaysOnWrapper.value) ? undefined : inputId;
  },
});

const $fcDynamicForm: any = inject('$fcDynamicForm', undefined) ?? formApi;

const classNameWidth = computed(() => {
  return [rest.class || "", rest.className || ""]
})

const className = computed(() => {
  return {
    "bk-flex bk-gap-2 bk-row-reverse bk-items-center bk-justify-end": rest?.as === "Checkbox",
    "bk-flex bk-flex-col bk-gap-2": rest?.as !== 'Checkbox'
  }
})

const showWhen = computed(() => (rest as any)?.showWhen as { field?: string; equals?: any; includes?: any | any[] } | undefined);
const hideWhen = computed(() => (rest as any)?.hideWhen as { field?: string; equals?: any; includes?: any | any[] } | undefined);

const showValue = ref<any>(undefined);
const hideValue = ref<any>(undefined);

const stops: Array<() => void> = [];


const isVisible = computed<boolean>(() => {

  const hasShow = !!showWhen.value?.field;
  const hasHide = !!hideWhen.value?.field;

  let visible = true;

  if (hasShow) {
    const sw = showWhen.value as any;
    if (sw?.includes !== undefined) {
      visible = includesMatch(showValue.value, sw.includes);
    } else {
      visible = equals(showValue.value, sw?.equals);
    }
  }

  if (hasHide) {
    const hw = hideWhen.value as any;
    let shouldHide = false;
    if (hw?.includes !== undefined) {
      shouldHide = includesMatch(hideValue.value, hw.includes);
    } else {
      shouldHide = equals(hideValue.value, hw?.equals);
    }
    if (shouldHide) visible = false;
  }

  return visible;
});

// Expose visibility to parent via provide so FormKit.vue can track it
provide('$fcFieldVisibility', {
  isVisible: isVisible,
  fieldName: name,
});

// Clear the field's value whenever it becomes hidden to avoid showing stale input later
watch(isVisible, (visible) => {
  try {
    if (!visible) {
      $fcDynamicForm?.clearFieldValue?.(String(name));
    }
  } catch {
    // no-op
  }
}, { immediate: true });
</script>