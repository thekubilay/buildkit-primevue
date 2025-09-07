export function castToTypeOf(targetSample: any, raw: any) {
  if (typeof raw !== 'string') return raw;
  const targetType = Array.isArray(targetSample)
    ? (targetSample.length ? typeof targetSample[0] : 'string')
    : typeof targetSample;
  switch (targetType) {
    case 'boolean':
      if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === 'true';
      if (raw === '1') return true;
      if (raw === '0') return false;
      return Boolean(raw);
    case 'number': {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    case 'string':
    default:
      return raw;
  }
}

export function equals(left: any, rightRaw: any): boolean {
  if (Array.isArray(rightRaw)) {
    const rights = rightRaw.map((r: any) => castToTypeOf(left, r));
    if (Array.isArray(left)) {
      return left.some((l: any) => rights.includes(l));
    }
    return rights.includes(left);
  }
  if (Array.isArray(left)) {
    const casted = castToTypeOf(left, rightRaw);
    return left.includes(casted);
  }
  const right = castToTypeOf(left, rightRaw);
  return left === right;
}

export function includesMatch(left: any, rightRaw: any | any[]): boolean {
  const rights = Array.isArray(rightRaw) ? rightRaw : [rightRaw];

  // If left is an array, check if any casted right is included in left
  if (Array.isArray(left)) {
    return rights.some(r => left.includes(castToTypeOf(left, r)));
  }

  // If both sides are strings, perform substring match (case-insensitive, trimmed)
  if (typeof left === 'string') {
    const l = left.trim().toLowerCase();
    return rights.some(r => {
      const rr = castToTypeOf(left, r);
      if (typeof rr === 'string') {
        return l.includes(rr.trim().toLowerCase());
      }
      // If not string after casting, fall back to strict equality
      return left === rr;
    });
  }

  // Fallback: cast and compare strictly for non-string scalars
  return rights.some(r => {
    const right = castToTypeOf(left, r);
    return left === right;
  });
}
