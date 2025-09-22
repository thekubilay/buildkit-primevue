import type {FormFieldState} from '@primevue/forms';
import type {FormKitProps} from '../types/FormKitProps';

/**
 * Clears form field states to their default values and resets validation meta.
 *
 * Usage:
 * - clear(states, fields)
 * - clear(formApiOrModel, fields) where object has `.states` or `.getFieldState(name)`
 *
 * Effects per field:
 * - Sets state.value to fields[name].defaultValue (casted), or undefined if not provided.
 * - Resets touched/dirty flags so validation messages do not show after clearing.
 * - Clears error state to reflect a brand-new form.
 */

const castNextValue = (value: any) => {
  if (typeof value === "string") {
    return ""
  } else if (typeof value === "number") {
    return null
  } else if (typeof value === "boolean") {
    return false;
  } else if (Array.isArray(value)) {
    return [];
  } else if (typeof value === "object") {
    return null
  }
}

export function clear(
  statesOrForm?: Record<string, FormFieldState> | { states?: Record<string, FormFieldState> } | { getFieldState?: (name: string) => FormFieldState } | null,
  fields?: FormKitProps['fields']
): void {
  if (!statesOrForm) return;

  // Resolve states map from different accepted inputs
  let states: Record<string, FormFieldState> | undefined;

  const asAny: any = statesOrForm as any;

  if (asAny && typeof asAny === 'object') {
    if (asAny.states && typeof asAny.states === 'object') {
      states = asAny.states as Record<string, FormFieldState>;
    } else if (typeof asAny.getFieldState === 'function' && fields) {
      // Build a synthetic states map from the field list
      states = Object.keys(fields).reduce((acc: Record<string, FormFieldState>, name) => {
        try {
          const s = asAny.getFieldState(name);
          if (s) acc[name] = s as FormFieldState;
        } catch {
          // ignore
        }
        return acc;
      }, {});
    } else if (!('getFieldState' in asAny)) {
      // Assume it's already a state map
      states = asAny as Record<string, FormFieldState>;
    }
  }

  if (!states || typeof states !== 'object') return;

  Object.keys(states).forEach((name) => {
    const state = (states as any)[name] as any;
    const cfg = fields?.[name] as any;

    // Determine the target value: prefer declared defaultValue, otherwise undefined
    const value = cfg && 'defaultValue' in cfg ? cfg.defaultValue : undefined;

    state.value = castNextValue(value)
    // console.log(name, value)

    // Assign the value (cast to primitive/array types as in getPayload/setFields utilities)
    // try {
    //   // state.value = nextValue
    //   state.value = castValue(nextValue as any);
    //   // console.log(state.value)
    // } catch {
    //   state.value = nextValue as any;
    // }

    // Reset meta to avoid showing validation messages post-clear
    if ('touched' in state) state.touched = false;
    if ('dirty' in state) state.dirty = false;

    // PrimeVue Forms keeps error on state; ensure it is cleared
    if ('error' in state) state.error = undefined;
    if ('errors' in state) state.errors = undefined;

    // Some implementations keep status flags; reset conservatively if present
    if ('valid' in state) state.valid = true;
    if ('invalid' in state) state.invalid = false;
  });
}
