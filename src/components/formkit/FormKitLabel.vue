<template>
  <label :for="forId" class="bk-label">
    <slot/>
    <span v-if="required" class="bk-text-error">*</span>
  </label>
</template>

<script setup lang="ts">
import {computed, inject} from 'vue';

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);

// `labelFor` is `inputId` narrowed to the cases where that id really lands on a focusable
// control — FormKitField clears it for grouped inputs and for Slider/Editor. Falling back
// to `inputId` keeps this component usable on its own, outside a FormKitField.
const forId = computed(() => (
  $fcDynamicFormField && 'labelFor' in $fcDynamicFormField
    ? $fcDynamicFormField.labelFor
    : $fcDynamicFormField?.inputId
));
const required = computed(() => $fcDynamicFormField?.required);

</script>
