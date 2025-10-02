<template>
  <label :for="forId" class="flex text-xxs text-surface-700">
    <slot/>
    <span v-if="required" class="text-red-500">*</span>
  </label>
</template>

<script setup lang="ts">
import {computed, inject} from 'vue';

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);

const forId = computed(() => $fcDynamicFormField?.inputId);
const required = computed(() => $fcDynamicFormField?.required);

</script>
