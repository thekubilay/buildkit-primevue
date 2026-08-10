/**
 * Separator fields are layout-only entries in the `fields` map: they render a
 * horizontal rule (optionally with a title) and never register on the Form, so
 * they are excluded from initial values, validation and the submit payload.
 */
// Deliberately does NOT include "Divider": that name already resolved to
// PrimeVue's Divider through FormKitControl's generic `as` lookup, so claiming it
// here would silently change behaviour for existing consumers.
export const SEPARATOR_TYPES = ["Separator"];

export function isSeparatorField(field: any): boolean {
  return SEPARATOR_TYPES.includes(field?.as);
}

export default isSeparatorField;
