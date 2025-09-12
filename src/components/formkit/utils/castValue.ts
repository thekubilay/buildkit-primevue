/**
 * Casts a value to string, boolean, number, Date, or null based on its type
 * - If value is an ISO-8601 date string (e.g., "2023-10-05T05:23:41.036132Z"), returns a Date instance
 * @param value - The value to cast
 * @returns The cast value as string, boolean, number, Date, or null
 */
function castValue(value: unknown): string | boolean | number | Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Check the type and cast accordingly
  if (typeof value === 'string') {
    // Try to cast string to boolean first
    const trimmed = value.trim();
    const lower = trimmed.toLowerCase();
    if (['true', '1', 'yes', 'True'].includes(lower)) return true;
    if (['false', '0', 'no', '', 'False'].includes(lower)) return false;

    // Try to cast ISO-8601 date strings (including fractional seconds)
    // Examples handled:
    //  - 2023-10-05T05:23:41Z
    //  - 2023-10-05T05:23:41.036Z
    //  - 2023-10-05T05:23:41.036132Z (microseconds -> truncated to milliseconds)
    //  - 2023-10-05T05:23:41.036+00:00
    //  - 2023-10-05T05:23:41.036132+00:00
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

    // Try to cast string to number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;

    // Return as string
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