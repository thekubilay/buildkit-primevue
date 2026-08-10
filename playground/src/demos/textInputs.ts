import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}

export const textInputsDemo: Demo = {
  id: 'text-inputs',
  title: 'Text inputs',
  summary: 'InputText (the default), Textarea, Password and the icon-field variants.',
  checks: [
    'Omitting `as` falls back to InputText.',
    'iconLeft / iconRight wrap the control in a PrimeVue IconField.',
    '`help` accepts HTML and renders under the control.',
    'Every value here should come back out of getPayload() as a plain string.',
  ],
  fields: () => ({
    plain: {
      inputId: 'txt_plain',
      label: 'Default (no `as`)',
      placeholder: 'Resolves to InputText',
      defaultValue: '',
      colSpan: half,
    },
    explicit: {
      inputId: 'txt_explicit',
      label: 'InputText',
      as: 'InputText',
      defaultValue: '',
      colSpan: half,
    },
    with_icon_left: {
      inputId: 'txt_icon_left',
      label: 'Icon left',
      as: 'InputText',
      iconLeft: 'pi pi-user',
      placeholder: 'Username',
      defaultValue: '',
      colSpan: half,
    },
    with_icon_right: {
      inputId: 'txt_icon_right',
      label: 'Icon right',
      as: 'InputText',
      iconRight: 'pi pi-search',
      defaultValue: '',
      colSpan: half,
    },
    password: {
      inputId: 'txt_password',
      label: 'Password',
      as: 'Password',
      toggleMask: true,
      feedback: false,
      defaultValue: '',
      colSpan: half,
    },
    disabled: {
      inputId: 'txt_disabled',
      label: 'Disabled passthrough',
      as: 'InputText',
      disabled: true,
      defaultValue: 'read only',
      colSpan: half,
    },
    bio: {
      inputId: 'txt_bio',
      label: 'Textarea',
      as: 'Textarea',
      rows: 4,
      autoResize: true,
      help: 'Unknown props are passed straight through to PrimeVue — <code>rows</code> and <code>autoResize</code> come from here.',
      defaultValue: '',
      colSpan: full,
    },
  }),
  sampleData: {
    plain: 'from setFields',
    explicit: 'hello',
    with_icon_left: 'kubilay',
    with_icon_right: 'query',
    password: 'secret',
    disabled: 'read only',
    bio: 'Multi\nline\ntext',
  },
}
