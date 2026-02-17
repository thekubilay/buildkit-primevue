// Type definitions for buildkit-primevue
// Project: buildkit-primevue
// Definitions by: BuildKit Team

import type { App, Plugin, DefineComponent, Component } from 'vue';
import type { FormFieldState } from '@primevue/forms';

export interface FormKitField {
  groupId?: string;
  label?: string;
  required?: boolean;
  messages?: string[];
  className?: string;
  type?: string;
  as?: string;
  defaultValue?: any;
  colSpan: { mobile: number; tablet: number; desktop: number };
  style: any;
  schema?: string;
  vertical: boolean;
  options?: Array<{ label: string; value: any }>;
  showWhen?: { field: string; equals?: any; includes?: any | any[] };
  hideWhen?: { field: string; equals?: any; includes?: any | any[] };
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

// Visibility utils (re-exported)
export function equals<T = any>(a: T, b: T): boolean;
export function includesMatch(haystack: any, needle: any): boolean;

// Re-export types
export type { FormKitProps as TypesFormKitProps };
