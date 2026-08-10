import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}
const third = {mobile: 1, tablet: 2, desktop: 3}

export const kitchenSinkDemo: Demo = {
  id: 'kitchen-sink',
  title: 'Kitchen sink',
  summary: 'A realistic form: separators, validation, visibility, grid and utils all at once.',
  checks: [
    'Load the sample data, submit, and compare the payload against what is on screen.',
    'Hidden branches must be absent from the payload, not present-and-null.',
    'Press Clear and confirm every control empties without leaving a stale separator behind.',
  ],
  size: 'small',
  fields: () => ({
    sep_account: {as: 'Separator', label: 'Account', align: 'left', type: 'solid', colSpan: full},
    email: {inputId: 'ks_email', label: 'Email', schema: 'required|email', defaultValue: '', colSpan: half},
    password: {
      inputId: 'ks_password',
      label: 'Password',
      as: 'Password',
      toggleMask: true,
      feedback: false,
      schema: 'required|min:8',
      defaultValue: '',
      colSpan: half,
    },

    sep_profile: {as: 'Separator', label: 'Profile', align: 'left', type: 'dashed', colSpan: full},
    last_name: {inputId: 'ks_last_name', label: 'Last name', schema: 'required', defaultValue: '', colSpan: half},
    first_name: {inputId: 'ks_first_name', label: 'First name', schema: 'required', defaultValue: '', colSpan: half},
    last_kana: {inputId: 'ks_last_kana', label: 'Last name (kana)', schema: 'required|katakana', defaultValue: '', colSpan: half},
    first_kana: {inputId: 'ks_first_kana', label: 'First name (kana)', schema: 'required|katakana', defaultValue: '', colSpan: half},
    birthday: {inputId: 'ks_birthday', label: 'Birthday', as: 'DatePicker', showIcon: true, dateFormat: 'yy/mm/dd', defaultValue: null, colSpan: half},
    gender: {
      inputId: 'ks_gender',
      label: 'Gender',
      as: 'RadioButton',
      buttonType: true,
      options: [
        {label: 'Female', value: 'f'},
        {label: 'Male', value: 'm'},
        {label: 'Other', value: 'o'},
      ],
      defaultValue: null,
      colSpan: half,
    },

    sep_address: {as: 'Separator', label: 'Address', align: 'left', type: 'dashed', colSpan: full},
    zipcode: {inputId: 'ks_zipcode', label: 'Zipcode', as: 'Zipcode', defaultValue: '', colSpan: third},
    prefecture: {inputId: 'ks_prefecture', label: 'Prefecture', defaultValue: '', colSpan: third},
    address: {inputId: 'ks_address', label: 'Address', defaultValue: '', colSpan: third},

    sep_prefs: {as: 'Separator', label: 'Preferences', align: 'left', type: 'dashed', colSpan: full},
    contact_ok: {inputId: 'ks_contact_ok', label: 'May we contact you?', as: 'Checkbox', binary: true, defaultValue: false, colSpan: half},
    contact_channel: {
      inputId: 'ks_contact_channel',
      label: 'Preferred channel',
      as: 'Select',
      options: [
        {label: 'Email', value: 'email'},
        {label: 'Phone', value: 'phone'},
      ],
      optionLabel: 'label',
      optionValue: 'value',
      showWhen: {field: 'contact_ok', equals: true},
      schema: 'required',
      required: true,
      defaultValue: null,
      colSpan: half,
    },
    topics: {
      inputId: 'ks_topics',
      label: 'Topics',
      as: 'CheckboxGroup',
      options: [
        {label: 'Products', value: 'products'},
        {label: 'Events', value: 'events'},
        {label: 'Jobs', value: 'jobs'},
      ],
      showWhen: {field: 'contact_ok', equals: true},
      defaultValue: [],
      colSpan: full,
    },

    sep_end: {as: 'Separator', colSpan: full},
    message: {inputId: 'ks_message', label: 'Message', as: 'Textarea', rows: 4, defaultValue: '', colSpan: full},
  }),
  sampleData: {
    email: 'taro@example.com',
    password: 'sup3rsecret',
    last_name: '山田',
    first_name: '太郎',
    last_kana: 'ヤマダ',
    first_kana: 'タロウ',
    birthday: '1990-05-14T00:00:00Z',
    gender: 'm',
    zipcode: '1000001',
    prefecture: '東京都',
    address: '千代田区千代田',
    contact_ok: true,
    contact_channel: 'email',
    topics: ['products', 'events'],
    message: 'Everything below should round-trip through getPayload().',
  },
}
