import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}

export const separatorDemo: Demo = {
  id: 'separator',
  title: 'Separator',
  summary: 'Layout-only field (as: "Separator") that draws a rule, optionally with a title.',
  checks: [
    'Separators never appear in the submitted states or in getPayload() output.',
    'A separator without a label draws one unbroken rule — no empty gap in the middle.',
    'align controls where the title sits: left | center | right.',
    'type controls the border style: solid | dashed | dotted.',
    'showWhen/hideWhen work on separators too — toggle "Hide the last section".',
  ],
  fields: () => ({
    sep_plain: {
      as: 'Separator',
      colSpan: full,
    },
    first_name: {inputId: 'sep_first_name', label: 'First name', defaultValue: '', colSpan: half},
    last_name: {inputId: 'sep_last_name', label: 'Last name', defaultValue: '', colSpan: half},

    sep_left: {
      as: 'Separator',
      label: 'Left aligned / solid',
      align: 'left',
      type: 'solid',
      colSpan: full,
    },
    email: {inputId: 'sep_email', label: 'Email', as: 'InputText', defaultValue: '', colSpan: full},

    sep_center: {
      as: 'Separator',
      label: 'Centered / dashed',
      align: 'center',
      type: 'dashed',
      colSpan: full,
    },
    phone: {inputId: 'sep_phone', label: 'Phone', defaultValue: '', colSpan: half},
    fax: {inputId: 'sep_fax', label: 'Fax', defaultValue: '', colSpan: half},

    sep_right: {
      as: 'Separator',
      label: 'Right aligned / dotted',
      align: 'right',
      type: 'dotted',
      colSpan: full,
    },

    hide_last: {
      inputId: 'sep_hide_last',
      label: 'Hide the last section',
      as: 'Checkbox',
      defaultValue: false,
      colSpan: full,
    },
    sep_conditional: {
      as: 'Separator',
      label: 'Conditional section',
      align: 'left',
      type: 'dashed',
      hideWhen: {field: 'hide_last', equals: true},
      colSpan: full,
    },
    note: {
      inputId: 'sep_note',
      label: 'Note',
      as: 'Textarea',
      rows: 3,
      defaultValue: '',
      hideWhen: {field: 'hide_last', equals: true},
      colSpan: full,
    },
  }),
  sampleData: {
    first_name: 'Taro',
    last_name: 'Yamada',
    email: 'taro@example.com',
    phone: '090-0000-0000',
    fax: '',
    hide_last: false,
    note: 'setFields() must not touch the separator entries.',
  },
}
