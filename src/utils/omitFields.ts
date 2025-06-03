export function omitFields<T extends object>(obj: T, fields: string[]): Partial<T> {
  const result = { ...obj };
  for (const field of fields) {
    if (field in result) {
      delete result[field as keyof T];
    }
  }
  return result;
}

export function omitFieldsDeep<T extends object>(obj: T, fields: string[]): Partial<T> {
  if (Array.isArray(obj)) {
    return obj.map((item) => omitFieldsDeep(item, fields)) as unknown as Partial<T>;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (!fields.includes(key)) {
        const value = obj[key];
        result[key] = typeof value === 'object' && value !== null
          ? omitFieldsDeep(value, fields)
          : value;
      }
    }
    return result;
  }

  return obj;
}
