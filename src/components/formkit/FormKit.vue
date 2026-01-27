<template>
  <Form ref="formRef" :key="formKey" v-slot="$form" :initial-values="initialValues" :resolver="resolver" @submit="submit" class="bk-form">
    <slot name="start"></slot>

    <slot v-bind="$form">
      <template v-for="({ inputId, label, required, help, colSpan, ...rest }, name) in fields" :key="inputId ?? name">
        <!-- Only render wrapper if field is visible - this removes space when hidden -->
        <div
          v-if="fieldVisibility[String(name)]"
          class="bk-form-field-wrapper"
          :style="styleColumnSpan(colSpan)"
        >
          <FormKitField :name="name" :input-id="inputId" :required="required" :label="label" :help="help" :rest="rest" :form-api="$form">
            <component :is="FormKitControl" :label="label" :input-id="inputId" :rest="rest" :size="size" :form-api="model"/>
          </FormKitField>
        </div>
      </template>
    </slot>

    <slot name="end"></slot>

    <div class="bk-form-footer">
      <slot name="footer"></slot>
    </div>
  </Form>
</template>

<script setup lang="ts">
import Form from "@primevue/forms/form";

import FormKitField from "./FormKitField.vue";
import FormKitControl from "./FormKitControl.vue";


import {computed, provide, ref, watch, reactive} from "vue";
import {equals, includesMatch} from "./utils/visibility.ts";
import {useResizeObserver} from "@vueuse/core";
import type {FormKitProps} from "./types/FormKitProps.ts";

import useFormKitValidations from "./useFormKitValidations.ts";

import spanStyleMap from "./utils/spanStyleMap.ts";


const {fields, size = "medium"} = defineProps<FormKitProps>();

const emit = defineEmits(["submit"])
const model = defineModel("modelValue")

const resolver = computed(() => useFormKitValidations(fields).resolver)

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

// Reactive object to track current form values for visibility computation
const formValues = reactive<Record<string, any>>({});

// Reactive object to track field visibility
const fieldVisibility = computed(() => {
  const visibility: Record<string, boolean> = {};

  Object.entries(fields as any).forEach(([fieldName, cfg]: [string, any]) => {
    visibility[fieldName] = isFieldVisibleByValues(cfg, formValues);
  });

  return visibility;
});

/**
 * Check if a field should be visible based on its showWhen/hideWhen config and current form values
 */
function isFieldVisibleByValues(cfg: any, values: Record<string, any>): boolean {
  const showWhen = cfg?.showWhen;
  const hideWhen = cfg?.hideWhen;

  let visible = true;

  if (showWhen?.field) {
    const left = values[showWhen.field];
    if (showWhen.includes !== undefined) {
      visible = includesMatch(left, showWhen.includes);
    } else {
      visible = equals(left, showWhen.equals);
    }
  }

  if (hideWhen?.field) {
    const left = values[hideWhen.field];
    let shouldHide = false;
    if (hideWhen.includes !== undefined) {
      shouldHide = includesMatch(left, hideWhen.includes);
    } else {
      shouldHide = equals(left, hideWhen.equals);
    }
    if (shouldHide) visible = false;
  }

  return visible;
}

// Expose the internal Form API via v-model so parents can call utils like clear(form, fields)
watch(formRef, (val) => {
  try {
    // model is the component's v-model; assign underlying Form instance
    (model as any).value = val;
  } catch {
    // no-op
  }
}, { immediate: true })

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
      (val) => {
        // Update our reactive formValues tracker
        formValues[fieldName] = val;
        cb(val);
      },
      {immediate: true}
    );
  },
  setFieldValue: (fieldName: string, value: any) => {
    // try using API method first; fall back to directly mutating state
    const api: any = formRef.value || model.value
    try {
      if (api?.setFieldValue) {
        api.setFieldValue(fieldName, value);
      } else if (api?.setValue) {
        // Some implementations expose setValue(name, value)
        api.setValue(fieldName, value);
      } else if (api?.states?.[fieldName]) {
        api.states[fieldName].value = value;
      }
      // Also update our reactive tracker
      formValues[fieldName] = value;
    } catch {
      // no-op
    }
  },
  clearFieldValue: (fieldName: string) => {
    // Clearing means resetting to null to avoid persisting previous input when hidden
    const api: any = formRef.value || model.value
    try {
      if (api?.setFieldValue) api.setFieldValue(fieldName, null);
      else if (api?.setValue) api.setValue(fieldName, null);
      else if (api?.states?.[fieldName]) api.states[fieldName].value = null;
      // Also update our reactive tracker
      formValues[fieldName] = null;
    } catch {
      // no-op
    }
  }
});

// Watch all field values to keep formValues in sync
watch(
  () => {
    const api: any = formRef.value || model.value;
    if (!api) return null;

    // Collect all current values
    const values: Record<string, any> = {};
    Object.keys(fields).forEach(fieldName => {
      try {
        const state = api?.getFieldState ? api.getFieldState(fieldName) : api?.states?.[fieldName];
        values[fieldName] = state?.value;
      } catch {
        // no-op
      }
    });
    return values;
  },
  (newValues) => {
    if (newValues) {
      Object.entries(newValues).forEach(([key, value]) => {
        formValues[key] = value;
      });
    }
  },
  { immediate: true, deep: true }
);

// Initialize formValues with default values
Object.entries(fields as any).forEach(([fieldName, cfg]: [string, any]) => {
  formValues[fieldName] = cfg?.defaultValue;
});

const initialValues = computed<any>(() => {
  const obj: { [key: string]: any } = {};
  Object.keys(fields).forEach(key => {
    obj[key] = (fields as any)[key]?.defaultValue
  })
  return obj;
})

const styleColumnSpan = computed(() => (span: { mobile: number, tablet: number, desktop: number }) => {

  let value = ""
  let device: "desktop" | "tablet" | "mobile" = "desktop"

  if (ww.value < 512) {
    device = "mobile"
  } else if (ww.value > 512 && ww.value < 724) {
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

// Remount the Form if the initialValues object changes (e.g., setFields called after mount)
watch(initialValues, () => {
  formKey.value++
}, {deep: true})

</script>