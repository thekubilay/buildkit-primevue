export interface FormKitField {
  groupId?: string;
  label?: string;
  required?: boolean;
  messages?: string[];
  className?: string;
  type?: string;
  as?: string; // Component type (Select, InputNumber, Checkbox, RadioButton, CheckboxGroup, etc.)
  defaultValue?: any;
  schema?: string; // Schema string like "required|max:12|email"
  validations?: string[]; // Array of validation rule names (fallback)
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

export interface FormKitProps {
  fields: { [key: string]: FormKitField };
  size?: "small" | "medium" | "large";
}