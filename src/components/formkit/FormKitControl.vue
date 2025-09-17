<template>
  <!-- CheckboxGroup rendering -->
  <div v-if="restAs === 'CheckboxGroup' && hasOptions" class="flex gap-2 pt-1" :class="classNameGroup">
    <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
      <component :is="PrimeCheckbox" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <label :for="`${name}-${i}`" class="text-sm">{{ opt.label }}</label>
    </div>
  </div>

  <!-- RadioButton group rendering -->
  <div v-else-if="restAs === 'RadioButton' && hasOptions" class="flex gap-2 pt-1" :class="classNameGroup">
    <div v-for="(opt, i) in options" :key="i" class="flex items-center gap-2">
      <component :is="PrimeRadioButton" :name="name" :inputId="`${name}-${i}`" :value="opt.value" :size="size"/>
      <label :for="`${name}-${i}`" class="text-sm">{{ opt.label }}</label>
    </div>
  </div>

  <div v-else-if="restAs === 'Editor'" class="flex gap-2 pt-1" :class="classNameGroup">
    <Editor v-bind="bindings" :size="size"/>
  </div>

  <!-- icon version component -->
  <IconField v-else-if="isIconVersion">
    <InputIcon v-if="iconLeft" :class="iconLeft"/>
    <component :is="component" :name="name" v-bind="bindings" :size="size"/>
    <InputIcon v-if="iconRight" :class="iconRight"/>
  </IconField>

  <!-- direct component -->
  <component v-else :is="component" :name="name" v-bind="bindings" :size="size"/>
</template>

<script setup lang="ts">
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Editor from "primevue/editor";

import * as PrimeVue from 'primevue';
import {computed, inject, type PropType} from 'vue';

const props = defineProps({
  rest: Object as PropType<any>,
  label: String as PropType<string>,
  inputId: String as PropType<string>,
  size: String as PropType<"small" | "medium" | "large">,
});

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);

const name = computed(() => $fcDynamicFormField?.name || "");
const size = computed(() => props.size)

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
    "flex-col": props.rest?.vertical
  }
})

const restAs = computed(() => props.rest?.as)
const options = computed(() => props.rest?.options || [])
const hasOptions = computed(() => Array.isArray(options.value) && options.value.length > 0)

const PrimeCheckbox = (PrimeVue as any).Checkbox
const PrimeRadioButton = (PrimeVue as any).RadioButton

const bindings = computed(() => {
  const binds: any = {}

  Object.keys(props.rest || {}).forEach(k => {
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

  if (!["Checkbox", "RadioButton", "CheckboxGroup"].includes(props.rest?.as)) {
    binds["class"] = "w-full"
  }

  return binds
})

</script>