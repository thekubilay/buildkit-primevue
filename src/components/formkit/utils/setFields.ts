import castValue from "./castValue.ts";

export function setFields(data: any, fields: any): void {
  if (!data) {
    return
  }

  Object.keys(fields).forEach(key => {
    fields[key].defaultValue = castValue(data[key])
  })

}