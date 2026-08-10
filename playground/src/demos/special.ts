import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const third = {mobile: 1, tablet: 2, desktop: 3}

export const specialDemo: Demo = {
  id: 'special',
  title: 'Zipcode & Editor',
  summary: 'The two library-specific controls: the Japanese zipcode lookup and the Quill editor.',
  checks: [
    'Zipcode is hard-wired to field names: it reads `zipcode` and writes `prefecture` and `address`.',
    'Lookup fires on the icon click and needs exactly 7 digits (hyphens are stripped). Try 1000001.',
    'It calls zipcloud.ibsnet.co.jp over the network, so it needs a live connection.',
    'zipcodeSearchIcon / zipcodeLoadingIcon swap the built-in inline SVGs for icon classes.',
    'Editor stores HTML as a string and requires the `quill` peer dependency.',
  ],
  fields: () => ({
    zipcode: {
      inputId: 'sp_zipcode',
      label: 'Zipcode (click the icon to look up)',
      as: 'Zipcode',
      placeholder: '1000001',
      defaultValue: '',
      colSpan: third,
    },
    prefecture: {
      inputId: 'sp_prefecture',
      label: 'Prefecture (auto-filled)',
      defaultValue: '',
      colSpan: third,
    },
    address: {
      inputId: 'sp_address',
      label: 'Address (auto-filled)',
      defaultValue: '',
      colSpan: third,
    },
    zipcode_custom_icon: {
      inputId: 'sp_zipcode_custom',
      label: 'Zipcode with custom icons',
      as: 'Zipcode',
      zipcodeSearchIcon: 'pi pi-map-marker',
      zipcodeLoadingIcon: 'pi pi-spin pi-spinner',
      defaultValue: '',
      help: 'Only the field literally named <code>zipcode</code> is used as the lookup source.',
      colSpan: third,
    },

    sep_editor: {as: 'Separator', label: 'Rich text', align: 'left', type: 'dashed', colSpan: full},
    body: {
      inputId: 'sp_body',
      label: 'Editor',
      as: 'Editor',
      editorStyle: 'height: 160px',
      defaultValue: '',
      colSpan: full,
    },
  }),
  sampleData: {
    zipcode: '1000001',
    prefecture: '東京都',
    address: '千代田区千代田',
    zipcode_custom_icon: '',
    body: '<p>Hello from <strong>setFields()</strong></p>',
  },
}
