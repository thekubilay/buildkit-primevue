<template>
  <!-- CheckboxGroup rendering -->
  <div v-if="restAs === 'CheckboxGroup' && hasOptions" class="bk-group" :class="classNameGroup">
    <label v-for="(opt, i) in options" :key="i" :for="`${name}-${i}`" class="bk-group-label">
      <component :is="PrimeCheckbox" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <span class="bk-text-sm">{{ opt.label }}</span>
    </label>
  </div>

  <!-- RadioButton group rendering -->
  <div v-else-if="restAs === 'RadioButton' && hasOptions" class="bk-group bk-group--wrap" :class="classNameGroup">
    <label v-for="(opt, i) in options" :key="i" :for="`${name}-${i}`" class="bk-radio-label"
           :class="[buttonTypeClass, buttonTypeClassActiveClass(opt.value)]">
      <component :is="PrimeRadioButton" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <span>{{ opt.label }}</span>
    </label>
  </div>

  <div v-else-if="restAs === 'Editor'" class="bk-group" :class="classNameGroup">
    <Editor v-bind="bindings" :size="size"/>
  </div>

  <IconField v-else-if="restAs === 'Zipcode'">
    <InputText :name="name" v-bind="bindings" :size="size"/>
    <InputIcon v-if="!isLoading" class="fa-regular fa-search bk-clickable" @click="setAddress(formApi)"/>
    <InputIcon v-else class="fa-regular fa-spinner fa-spin"/>
  </IconField>

  <!-- icon version component -->
  <IconField v-else-if="isIconVersion">
    <InputIcon v-if="iconLeft" :class="iconLeft"/>
    <component :is="component" :name="name" v-bind="bindings" :size="size" />
    <InputIcon v-if="iconRight" :class="iconRight"/>
  </IconField>

  <!-- direct component -->
  <component v-else :is="component" :name="name" v-bind="bindings" :size="size"/>
</template>

<script setup lang="ts">
import InputText from "primevue/inputtext"
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Editor from "primevue/editor";

import * as PrimeVue from 'primevue';
import {computed, inject, onUnmounted, ref, type PropType} from 'vue';
import useZipcodeHelpers from "./useZipcodeHelpers.ts";

const props = defineProps({
  formApi: Object as PropType<any>,
  rest: Object as PropType<any>,
  label: String as PropType<string>,
  inputId: String as PropType<string>,
  size: String as PropType<"small" | "medium" | "large">,
});

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);
const $fcDynamicForm: any = inject('$fcDynamicForm', undefined);

const {isLoading, setAddress} = useZipcodeHelpers()

const name = computed(() => $fcDynamicFormField?.name || "");
const size = computed(() => props.size)

// Track the current field value reactively to style active radio button wrapper
const currentValue = ref<any>(undefined);

let stopWatch: any = null;

if ($fcDynamicForm && name.value) {
  try {
    // initialize and watch this field's value
    stopWatch = $fcDynamicForm.watchFieldValue(name.value, (val: any) => {
      currentValue.value = val;
    });
  } catch {
  }
}

onUnmounted(() => {
  try {
    if (typeof stopWatch === 'function') stopWatch();
  } catch {
  }
});

const component = computed(() => {
  const key = props.rest?.as || "InputText";
  const resolved = (PrimeVue as any)[key];
  return resolved || key;
});

const iconLeft = props.rest?.iconLeft || null
const iconRight = props.rest?.iconRight || null
const isIconVersion = props.rest?.iconLeft || props.rest?.iconRight

const classNameGroup = computed(() => {
  return {
    "bk-flex-col": props.rest?.vertical
  }
})

const buttonTypeClass = computed(() => {
  const extra = (props.rest as any)?.buttonTypeClass || '';
  return {
    'bk-button-option': !!props.rest?.buttonType,
    [extra]: !!extra
  }
})

const buttonTypeClassActiveClass = computed(() => (val: any) => {
  return {
    'bk-button-option--active': !!props.rest?.buttonType && val === currentValue.value,
    'bk-button-option--inactive': !!props.rest?.buttonType && val !== currentValue.value
  }
})

const restAs = computed(() => props.rest?.as)
const options = computed(() => props.rest?.options || [])
const hasOptions = computed(() => Array.isArray(options.value) && options.value.length > 0)

const PrimeCheckbox = (PrimeVue as any).Checkbox
const PrimeRadioButton = (PrimeVue as any).RadioButton

const bindings = computed(() => {
  const binds: any = {}

  const disallowedProps = new Set(["defaultValue", "schema", "showWhen", "hideWhen", "colSpan"]);

  Object.keys(props.rest || {}).forEach(k => {
    if (disallowedProps.has(k)) {
      // skip non-input props that can conflict with controlled value handling
      return;
    }
    if (["class", "className"].includes(k)) {
      binds["class"] = props.rest[k];
    } else {
      if (k === "as") {
        if (props.rest?.as === "Checkbox") {
          binds["inputId"] = props.inputId;
        } else {
          binds["id"] = props.inputId;
        }
      } else {
        binds[k] = props.rest[k]
      }
    }
  })

  // Ensure full width by default for most inputs
  if (!["Checkbox", "RadioButton", "CheckboxGroup"].includes(props.rest?.as)) {
    binds["class"] = "bk-w-full"
  }

  // Special-case Date-like inputs: bind modelValue from current form state so initial Date shows up
  const as = props.rest?.as;
  if (as === 'DatePicker' || as === 'Calendar') {
    binds["modelValue"] = currentValue.value ?? null;
  }

  return binds
})

</script>