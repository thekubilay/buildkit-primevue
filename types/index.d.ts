// Type definitions for buildkit-primevue
// Project: buildkit-primevue
// Definitions by: BuildKit Team

import type { App, Plugin, DefineComponent, Component } from 'vue';
import type { FormFieldState } from '@primevue/forms';

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
  /** Value type hint ("number", "array"); for `as: "Separator"` this is the border style. */
  type?: string | 'solid' | 'dashed' | 'dotted';
  as?: string;
  /** Separator only: where the label sits on the rule. */
  align?: 'left' | 'center' | 'right' | 'top' | 'bottom';
  /** Separator only: rule orientation. */
  layout?: 'horizontal' | 'vertical';
  defaultValue?: any;
  colSpan?: { mobile: number; tablet: number; desktop: number };
  style?: any;
  schema?: string;
  vertical?: boolean;
  options?: Array<{ label: string; value: any }>;
  showWhen?: VisibilityCondition | VisibilityCondition[];
  hideWhen?: VisibilityCondition | VisibilityCondition[];
  [key: string]: any;
}

export type Locale = 'ja' | 'en';

export interface FormKitProps {
  fields: { [key: string]: FormKitField };
  size?: 'small' | 'medium' | 'large';
  locale?: Locale;
}

// Components
export const FormKit: DefineComponent<FormKitProps>;
export const FormKitControl: DefineComponent<any>;
export const FormKitField: DefineComponent<any>;
export const FormKitLabel: DefineComponent<any>;
export const FormKitSeparator: DefineComponent<{ label?: string; rest?: any }>;

// Default export is the main FormKit component
declare const _default: typeof FormKit;
export default _default;

// Plugin for global registration
export const BuildKitPrimeVue: Plugin & { version: string } & {
  install(app: App): void;
};

export const version: string;

// Utils
export function setDynamicFields(columns: any[]): any;
export function setFields(data: any, fields: any): void;
export function getPayload(states: Record<string, FormFieldState>, fields?: Record<string, any>): any;
export function clear(states: Record<string, FormFieldState>, fields: any): any;

// Separator helpers
export const SEPARATOR_TYPES: string[];
export function isSeparatorField(field: any): boolean;

// Visibility utils (re-exported)
export function equals<T = any>(a: T, b: T): boolean;
export function includesMatch(haystack: any, needle: any): boolean;

// Re-export types
export type { FormKitProps as TypesFormKitProps };
