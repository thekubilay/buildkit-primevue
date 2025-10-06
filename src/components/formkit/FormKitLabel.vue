<template>
  <label :for="forId" class="bk-label">
    <slot/>
    <span v-if="required" class="bk-text-error">*</span>
  </label>
</template>

<script setup lang="ts">
import {computed, inject} from 'vue';

const $fcDynamicFormField: any = inject('$fcDynamicFormField', undefined);

const forId = computed(() => $fcDynamicFormField?.inputId);
const required = computed(() => $fcDynamicFormField?.required);

</script>
