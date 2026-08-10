<template>
  <!-- Two variants on purpose: PrimeVue draws its content wrapper whenever a default
       slot is present, and a `v-if` *inside* the slot still counts as present — that
       would cut an empty gap into an otherwise unbroken rule. So the label-less case
       passes no slot at all. -->
  <Divider v-if="hasLabel" v-bind="dividerProps">
    <span class="bk-separator-label">{{ label }}</span>
  </Divider>
  <Divider v-else v-bind="dividerProps"/>
</template>

<script setup lang="ts">
import Divider from "primevue/divider";

import {computed, type PropType} from "vue";

const props = defineProps({
  label: String as PropType<string>,
  rest: Object as PropType<any>,
});

// Library-only keys that must not reach PrimeVue's Divider as attributes.
const disallowedProps = new Set([
  "as", "align", "type", "layout", "class", "className",
  "defaultValue", "schema", "showWhen", "hideWhen", "colSpan",
  "options", "vertical", "groupId", "messages", "help", "inputId", "required",
]);

const hasLabel = computed(() => {
  const label = props.label;
  return typeof label === "string" && label.trim().length > 0;
});

// `align` is forwarded even without a label because it stays meaningful for a
// vertical layout.
const align = computed<"left" | "center" | "right" | "top" | "bottom">(() => props.rest?.align || "center");
const type = computed<"solid" | "dashed" | "dotted">(() => props.rest?.type || "solid");
const layout = computed<"horizontal" | "vertical">(() => props.rest?.layout || "horizontal");

const passthrough = computed(() => {
  const binds: Record<string, any> = {};
  Object.keys(props.rest || {}).forEach(k => {
    if (disallowedProps.has(k)) return;
    binds[k] = props.rest[k];
  });
  return binds;
});

const dividerProps = computed(() => ({
  ...passthrough.value,
  class: ["bk-separator", props.rest?.class || "", props.rest?.className || ""],
  layout: layout.value,
  type: type.value,
  align: align.value,
}));
</script>
