import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}

const countries = [
  {label: 'Japan', value: 'jp'},
  {label: 'Türkiye', value: 'tr'},
  {label: 'Germany', value: 'de'},
  {label: 'Brazil', value: 'br'},
]

export const selectionDemo: Demo = {
  id: 'selection',
  title: 'Selection controls',
  summary: 'Select, MultiSelect, RadioButton, CheckboxGroup, Checkbox and ToggleSwitch.',
  checks: [
    'Select / RadioButton validate the submitted value against `options`.',
    'MultiSelect and CheckboxGroup produce arrays; getPayload() splits comma strings back into arrays.',
    'RadioButton + `buttonType: true` renders the segmented button styling.',
    '`vertical: true` stacks a group instead of laying it out in a row.',
    'REGRESSION WATCH: submit without touching anything. The two fields whose defaultValue is "" '
    + '(empty_multi / empty_group) must NOT report 「無効な入力です（配列が必要です）」 — they are optional. '
    + 'Both must appear in the payload as [], never as "".',
  ],
  fields: () => ({
    country: {
      inputId: 'sel_country',
      label: 'Select',
      as: 'Select',
      options: countries,
      optionLabel: 'label',
      optionValue: 'value',
      placeholder: 'Pick a country',
      showClear: true,
      defaultValue: null,
      colSpan: half,
    },
    visited: {
      inputId: 'sel_visited',
      label: 'MultiSelect',
      as: 'MultiSelect',
      options: countries,
      optionLabel: 'label',
      optionValue: 'value',
      placeholder: 'Pick several',
      defaultValue: [],
      colSpan: half,
    },
    plan: {
      inputId: 'sel_plan',
      label: 'RadioButton',
      as: 'RadioButton',
      options: [
        {label: 'Free', value: 'free'},
        {label: 'Pro', value: 'pro'},
        {label: 'Enterprise', value: 'enterprise'},
      ],
      defaultValue: 'free',
      colSpan: full,
    },
    plan_buttons: {
      inputId: 'sel_plan_buttons',
      label: 'RadioButton (buttonType)',
      as: 'RadioButton',
      buttonType: true,
      options: [
        {label: 'Monthly', value: 'monthly'},
        {label: 'Yearly', value: 'yearly'},
      ],
      defaultValue: 'monthly',
      colSpan: full,
    },
    topics: {
      inputId: 'sel_topics',
      label: 'CheckboxGroup',
      as: 'CheckboxGroup',
      options: [
        {label: 'Vue', value: 'vue'},
        {label: 'PrimeVue', value: 'primevue'},
        {label: 'Zod', value: 'zod'},
      ],
      defaultValue: [],
      colSpan: full,
    },
    topics_vertical: {
      inputId: 'sel_topics_vertical',
      label: 'CheckboxGroup (vertical)',
      as: 'CheckboxGroup',
      vertical: true,
      options: [
        {label: 'Email', value: 'email'},
        {label: 'SMS', value: 'sms'},
        {label: 'Push', value: 'push'},
      ],
      defaultValue: ['email'],
      colSpan: half,
    },
    agree: {
      inputId: 'sel_agree',
      label: 'Checkbox',
      as: 'Checkbox',
      binary: true,
      defaultValue: false,
      colSpan: half,
    },
    notifications: {
      inputId: 'sel_notifications',
      label: 'ToggleSwitch',
      as: 'ToggleSwitch',
      defaultValue: false,
      colSpan: half,
    },

    sep_empty: {
      as: 'Separator',
      label: 'Empty-string defaults (the reported regression)',
      align: 'left',
      type: 'dashed',
      colSpan: full,
    },
    // Backend column configs routinely ship `defaultValue: ""` for every control. These
    // two reproduce the user report: optional array fields that behaved as required.
    empty_multi: {
      inputId: 'sel_empty_multi',
      label: 'MultiSelect with defaultValue: ""',
      as: 'MultiSelect',
      options: countries,
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: '',
      colSpan: half,
    },
    empty_group: {
      inputId: 'sel_empty_group',
      label: 'CheckboxGroup with defaultValue: ""',
      as: 'CheckboxGroup',
      options: [
        {label: '選択1', value: '1'},
        {label: '選択2', value: '2'},
      ],
      defaultValue: '',
      colSpan: half,
    },
  }),
  sampleData: {
    country: 'jp',
    visited: ['jp', 'tr'],
    plan: 'pro',
    plan_buttons: 'yearly',
    topics: ['vue', 'zod'],
    topics_vertical: ['email', 'push'],
    agree: true,
    notifications: 'true',
    empty_multi: '',
    empty_group: '',
  },
}
