export interface FormKitField {
  groupId?: string;
  label?: string;
  required?: boolean;
  messages?: string[];
  className?: string;
  type?: string;
  as?: string; // Component type (Select, InputNumber, Checkbox, RadioButton, CheckboxGroup, etc.)
  defaultValue?: any;
  colSpan: { mobile: number, tablet: number, desktop: number }; // Responsive
  style: any;
  schema?: string; // Schema string like "required|max:12|email"
  vertical: boolean; // this is for group inputs checkboxGroup RadioButton
  options?: Array<{ label: string; value: any }>; // For Select, RadioButton, CheckboxGroup
  showWhen?: {
    field: string;
    equals?: any;
    includes?: any | any[];
  };
  hideWhen?: {
    field: string;
    equals?: any;
    includes?: any | any[];
  };

  [key: string]: any; // For other field properties
}

import type { Locale } from "../locales/messages";

export interface FormKitProps {
  fields: { [key: string]: FormKitField };
  size?: "small" | "medium" | "large";
  locale?: Locale;
}