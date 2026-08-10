export interface VisibilityLeaf {
  field: string;
  equals?: any;
  includes?: any | any[];
}

export interface VisibilityAnd {
  and: VisibilityCondition[];
}

export interface VisibilityOr {
  or: VisibilityCondition[];
}

export type VisibilityCondition =
  | VisibilityLeaf
  | VisibilityAnd
  | VisibilityOr
  | VisibilityCondition[];

export interface FormKitField {
  groupId?: string;
  label?: string;
  /** DOM id applied to the control, and the `for` target of the rendered label. */
  inputId?: string;
  /** Label marker only — renders the red `*`. Use `schema: "required"` to actually enforce. */
  required?: boolean;
  messages?: string[];
  className?: string;
  type?: string; // Value type hint ("number", "array"); for Separator: border style ("solid" | "dashed" | "dotted")
  as?: string; // Component type (Select, InputNumber, Checkbox, RadioButton, CheckboxGroup, Separator, etc.)
  align?: "left" | "center" | "right" | "top" | "bottom"; // Separator only: label position
  layout?: "horizontal" | "vertical"; // Separator only: rule orientation
  defaultValue?: any;
  colSpan?: { mobile: number, tablet: number, desktop: number }; // Responsive, defaults to full width
  style?: any;
  schema?: string; // Schema string like "required|max:12|email"
  vertical?: boolean; // this is for group inputs checkboxGroup RadioButton
  options?: Array<{ label: string; value: any }>; // For Select, RadioButton, CheckboxGroup
  showWhen?: VisibilityCondition | VisibilityCondition[];
  hideWhen?: VisibilityCondition | VisibilityCondition[];

  [key: string]: any; // For other field properties
}

import type { Locale } from "../locales/messages";

export interface FormKitProps {
  fields: { [key: string]: FormKitField };
  size?: "small" | "medium" | "large";
  locale?: Locale;
}