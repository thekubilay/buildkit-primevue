import type {FormFieldState} from "@primevue/forms";
import castValue from "./castValue.ts";

export function getPayload(states: Record<string, FormFieldState>, fields?: Record<string, any>): any {
  const payload: Record<string, any> = {};

  for (const field in states) {
    if (Object.prototype.hasOwnProperty.call(states, field)) {
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

