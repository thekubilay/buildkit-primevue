<template>
  <FormField :name="String(name)" class="bk-field" :class="classNameWidth" v-show="isVisible" v-slot="{ error }">
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

provide('$fcDynamicFormField', {
  name: name,
  inputId: inputId,
  required: required,
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
