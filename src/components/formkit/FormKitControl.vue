<template>
  <!-- icon version component -->
  <IconField v-if="isIconVersion">
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
  return (PrimeVue as any)[props.rest?.as || "InputText"];
});

const iconLeft = props.rest?.iconLeft || null
const iconRight = props.rest?.iconRight || null
const isIconVersion = props.rest?.iconLeft || props.rest?.iconRight

const bindings = computed(() => {
  const binds: any = {}

  Object.keys(props.rest || {}).forEach(k => {
    if (!["as", "className", "class"].includes(k)) {
      binds[k] = props.rest[k as any]
    }
  })

  if (props.rest?.as === "Checkbox") {
    binds["inputId"] = props.inputId;
  } else {
    binds["id"] = props.inputId;
  }

  return binds
})

</script>