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


export function clear(data: any, fields: any): void {
  if (!data) {
    return
  }

  Object.keys(fields).forEach(key => {
    fields[key].defaultValue = castNextValue(data[key])
  })

}