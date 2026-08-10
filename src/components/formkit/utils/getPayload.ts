import type {FormFieldState} from "@primevue/forms";
import castValue from "./castValue.ts";
import {isSeparatorField} from "./isSeparator.ts";

export function getPayload(states: Record<string, FormFieldState>, fields?: Record<string, any>): any {
  const payload: Record<string, any> = {};

  for (const field in states) {
    if (Object.prototype.hasOwnProperty.call(states, field)) {
      // Separators are layout-only and never carry a value
      if (isSeparatorField(fields?.[field])) continue;

      const state = states[field];
      const as = fields?.[field]?.as;
      const castedValue = castValue(state.value, as)

      if (typeof castedValue === "string" && castedValue.includes("GMT")) {
        payload[field] = new Date(castedValue).toISOString();
      } else {
        payload[field] = castedValue;
      }
    }
  }

  return payload;
};

