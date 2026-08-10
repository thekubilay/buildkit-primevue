import castValue from "./castValue.ts";
import {isSeparatorField} from "./isSeparator.ts";

export function setFields(data: any, fields: any): void {
  if (!data) {
    return
  }

  Object.keys(fields).forEach(key => {
    // Separators hold no value, giving them a defaultValue would be meaningless
    if (isSeparatorField(fields[key])) return;

    const as = fields[key]?.as;
    fields[key].defaultValue = castValue(data[key], as)
  })

}