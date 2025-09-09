/**
 * Casts a value to string, boolean, or number based on its type
 * @param value - The value to cast
 * @returns The cast value as string, boolean, number, or null
 */
function castValue(value: unknown): string | boolean | number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Check the type and cast accordingly
  if (typeof value === 'string') {
    // Try to cast string to boolean first
    const lower = value.toLowerCase().trim();
    if (['true', '1', 'yes'].includes(lower)) return true;
    if (['false', '0', 'no', ''].includes(lower)) return false;

    // Try to cast string to number
    const num = Number(value.trim());
    if (!isNaN(num) && value.trim() !== '') return num;

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