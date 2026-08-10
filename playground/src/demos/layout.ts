import type {Demo} from './types'

const span = (desktop: number, tablet = Math.min(desktop, 2), mobile = 1) => ({mobile, tablet, desktop})

export const layoutDemo: Demo = {
  id: 'layout',
  title: 'Responsive grid',
  summary: 'colSpan { mobile, tablet, desktop } with breakpoints at 512px and 724px.',
  checks: [
    'colSpan is a divisor, not a column count: desktop 3 means "three per row".',
    'Resize the window past 724px and 512px to watch the tablet/mobile values take over.',
    'A field without colSpan takes the full row — which is why separators need no colSpan.',
    'Breakpoints are measured on document.body, so they follow the window, not this panel.',
  ],
  fields: () => ({
    sep_1: {as: 'Separator', label: 'One per row (no colSpan)', align: 'left', type: 'dashed'},
    full_a: {inputId: 'lay_full_a', label: 'No colSpan at all', defaultValue: '', as: 'InputText'},
    full_b: {inputId: 'lay_full_b', label: 'colSpan desktop: 1', defaultValue: '', colSpan: span(1)},

    sep_2: {as: 'Separator', label: 'Two per row', align: 'left', type: 'dashed'},
    half_a: {inputId: 'lay_half_a', label: 'desktop: 2', defaultValue: '', colSpan: span(2)},
    half_b: {inputId: 'lay_half_b', label: 'desktop: 2', defaultValue: '', colSpan: span(2)},

    sep_3: {as: 'Separator', label: 'Three per row', align: 'left', type: 'dashed'},
    third_a: {inputId: 'lay_third_a', label: 'desktop: 3', defaultValue: '', colSpan: span(3)},
    third_b: {inputId: 'lay_third_b', label: 'desktop: 3', defaultValue: '', colSpan: span(3)},
    third_c: {inputId: 'lay_third_c', label: 'desktop: 3', defaultValue: '', colSpan: span(3)},

    sep_4: {as: 'Separator', label: 'Four per row', align: 'left', type: 'dashed'},
    q_a: {inputId: 'lay_q_a', label: '4', defaultValue: '', colSpan: span(4)},
    q_b: {inputId: 'lay_q_b', label: '4', defaultValue: '', colSpan: span(4)},
    q_c: {inputId: 'lay_q_c', label: '4', defaultValue: '', colSpan: span(4)},
    q_d: {inputId: 'lay_q_d', label: '4', defaultValue: '', colSpan: span(4)},

    sep_6: {as: 'Separator', label: 'Six per row', align: 'left', type: 'dashed'},
    s_a: {inputId: 'lay_s_a', label: '6', defaultValue: '', colSpan: span(6)},
    s_b: {inputId: 'lay_s_b', label: '6', defaultValue: '', colSpan: span(6)},
    s_c: {inputId: 'lay_s_c', label: '6', defaultValue: '', colSpan: span(6)},
    s_d: {inputId: 'lay_s_d', label: '6', defaultValue: '', colSpan: span(6)},
    s_e: {inputId: 'lay_s_e', label: '6', defaultValue: '', colSpan: span(6)},
    s_f: {inputId: 'lay_s_f', label: '6', defaultValue: '', colSpan: span(6)},
  }),
}
