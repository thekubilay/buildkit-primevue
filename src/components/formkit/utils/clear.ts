import type { FormFieldState } from '@primevue/forms';
import type { FormKitProps } from '../types/FormKitProps';
import castValue from './castValue';

/**
 * Clears form field states to their default values and resets validation meta.
 *
 * - Sets state.value to fields[name].defaultValue (casted), or undefined if not provided.
 * - Resets touched/dirty flags so validation messages do not show after clearing.
 * - Clears error state to reflect a brand-new form.
 */
export function clear(
  states: Record<string, FormFieldState>,
  fields?: FormKitProps['fields']
): void {
  if (!states || typeof states !== 'object') return;

  Object.keys(states).forEach((name) => {
    const state = states[name] as any;
    const cfg = fields?.[name] as any;

    // Determine the target value: prefer declared defaultValue, otherwise undefined
    const nextValue = cfg && 'defaultValue' in cfg ? cfg.defaultValue : undefined;

    // Assign the value (cast to primitive/array types as in getPayload/setFields utilities)
    try {
      state.value = castValue(nextValue as any);
    } catch {
      state.value = nextValue as any;
    }

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
