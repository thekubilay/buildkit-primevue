/**
 * Casts a value to string, boolean, number, Date, or null based on its type
 * - If value is an ISO-8601 date string (e.g., "2023-10-05T05:23:41.036132Z"), returns a Date instance
 * @param value - The value to cast
 * @returns The cast value as string, boolean, number, Date, or null
 */
type CastComponent =
  | 'InputText'
  | 'Textarea'
  | 'Editor'
  | 'Password'
  | 'Chips'
  | 'Select'
  | 'MultiSelect'
  | 'InputNumber'
  | 'Slider'
  | 'Checkbox'
  | 'ToggleButton'
  | 'InputSwitch'
  | 'Calendar'
  | 'DatePicker'
  | string | undefined;

/**
 * Casts a value to string, boolean, number, Date, or null based on its type
 * - If value is an ISO-8601 date string (e.g., "2023-10-05T05:23:41.036132Z"), returns a Date instance
 * - When `as` (component type) is provided, casting respects the component:
 *   - Numeric casting only for number-like components (InputNumber, Slider)
 *   - Boolean casting only for boolean-like components (Checkbox, ToggleButton, InputSwitch)
 *   - Date casting only for date-like components (Calendar, DatePicker)
 *   - Text-like components (InputText, Textarea, Editor, Password, Chips, Dropdown, MultiSelect) keep string values
 * - When `as` is omitted, falls back to legacy auto-casting behavior for backward compatibility
 * @param value - The value to cast
 * @param as - Optional PrimeVue component name (from fields.as) to guide casting
 * @returns The cast value as string, boolean, number, Date, or null
 */
function castValue(value: unknown, as?: CastComponent): string | boolean | number | Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const isNumberLike = as ? ['InputNumber', 'Slider'].includes(as) : undefined;
  const isBooleanLike = as ? ['Checkbox', 'ToggleButton', 'InputSwitch'].includes(as) : undefined;
  const isDateLike = as ? ['Calendar', 'DatePicker'].includes(as) : undefined;
  const isTextLike = as ? ['InputText', 'Textarea', 'Editor', 'Password', 'Chips', 'Select', 'MultiSelect'].includes(as) : undefined;

  // Check the type and cast accordingly
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Boolean casting
    if (isBooleanLike === true || (isBooleanLike === undefined)) {
      const lower = trimmed.toLowerCase();
      if (['true', 'yes', 'true'].includes(lower)) return true;
      if (['false', 'no', 'false'].includes(lower)) return false;
    }

    // Date casting (ISO-8601)
    if (isDateLike === true || (isDateLike === undefined)) {
      const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})$/i;
      if (isoLike.test(trimmed)) {
        // Normalize fractional seconds to max 3 digits (milliseconds) for stable Date parsing
        const normalized = trimmed.replace(
          /(\.)(\d+)(?=(Z|[+\-]\d{2}:?\d{2})$)/,
          (_m, dot: string, frac: string) => {
            const ms = frac.length > 3 ? frac.slice(0, 3) : frac.padEnd(3, '0');
            return `${dot}${ms}`;
          }
        );
        const d = new Date(normalized);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    }

    // Number casting
    if (isNumberLike === true || (isNumberLike === undefined && isTextLike !== true)) {
      const num = Number(trimmed);
      if (!isNaN(num) && trimmed !== '') return num;
    }

    // Default: return as string
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // For other types, try to convert to string
  return String(value);
}

export default castValue;