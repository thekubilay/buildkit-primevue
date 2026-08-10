import {setDynamicFields} from 'buildkit-primevue'
import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}

/**
 * Backend-shaped column config. `setDynamicFields` expects each entry to be
 * `{ key, extra_data: { [key]: <field definition> } }` and returns a plain
 * `{ [key]: fieldDefinition }` map ready to hand to <FormKit :fields>.
 */
const columns = [
  {
    key: 'section',
    extra_data: {
      section: {as: 'Separator', label: 'Generated from backend columns', align: 'left', type: 'dashed', colSpan: full},
    },
  },
  {
    key: 'company_name',
    extra_data: {
      company_name: {inputId: 'dyn_company', label: 'Company', schema: 'required', defaultValue: '', colSpan: half},
    },
  },
  {
    key: 'employees',
    extra_data: {
      employees: {inputId: 'dyn_employees', label: 'Employees', as: 'InputNumber', defaultValue: null, colSpan: half},
    },
  },
  {
    key: 'industry',
    extra_data: {
      industry: {
        inputId: 'dyn_industry',
        label: 'Industry',
        as: 'Select',
        options: [
          {label: 'Software', value: 'software'},
          {label: 'Retail', value: 'retail'},
        ],
        optionLabel: 'label',
        optionValue: 'value',
        defaultValue: null,
        colSpan: half,
      },
    },
  },
  {
    key: 'is_public',
    extra_data: {
      is_public: {inputId: 'dyn_is_public', label: 'Publicly listed', as: 'Checkbox', binary: true, defaultValue: false, colSpan: half},
    },
  },
  {
    key: 'ticker',
    extra_data: {
      ticker: {
        inputId: 'dyn_ticker',
        label: 'Ticker (only when publicly listed)',
        showWhen: {field: 'is_public', equals: true},
        defaultValue: '',
        colSpan: half,
      },
    },
  },
]

export const dynamicFieldsDemo: Demo = {
  id: 'dynamic-fields',
  title: 'setDynamicFields',
  summary: 'Turning a backend column config into a FormKit field map at runtime.',
  checks: [
    'Input shape is `{ key, extra_data: { [key]: definition } }` — anything else yields an empty field.',
    'The helper shallow-clones each definition, so the source config is not mutated.',
    'Separators survive the conversion like any other field definition.',
  ],
  fields: () => setDynamicFields(columns),
  sampleData: {
    company_name: 'Buildkit Inc.',
    employees: 42,
    industry: 'software',
    is_public: true,
    ticker: 'BKT',
  },
}
