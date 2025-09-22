import type {FormFieldState} from "@primevue/forms";
import castValue from "./castValue.ts";

export function getPayload(states: Record<string, FormFieldState>, fields?: Record<string, any>): any {
  const payload: Record<string, any> = {};

  for (const field in states) {
    if (Object.prototype.hasOwnProperty.call(states, field)) {
      const state = states[field];
      const as = fields?.[field]?.as;
      payload[field] = castValue(state.value, as);
    }
  }

  return payload;
};

