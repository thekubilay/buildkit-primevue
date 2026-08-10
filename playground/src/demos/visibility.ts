import type {Demo} from './types'

const full = {mobile: 1, tablet: 1, desktop: 1}
const half = {mobile: 1, tablet: 1, desktop: 2}

export const visibilityDemo: Demo = {
  id: 'visibility',
  title: 'Conditional visibility',
  summary: 'showWhen / hideWhen with equals, includes, and nested and/or trees.',
  checks: [
    'A hidden field is removed from the DOM — it does not just go transparent.',
    'Hidden fields are cleared, skip validation, and are dropped from the submitted states.',
    'Set "Contact method" to `other` to reveal the free-text field required only in that branch.',
    'The and/or block needs BOTH a pro plan AND (email OR phone) to appear.',
  ],
  fields: () => ({
    contact_method: {
      inputId: 'vis_contact_method',
      label: 'Contact method',
      as: 'Select',
      options: [
        {label: 'Email', value: 'email'},
        {label: 'Phone', value: 'phone'},
        {label: 'Other', value: 'other'},
      ],
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: 'email',
      colSpan: half,
    },
    plan: {
      inputId: 'vis_plan',
      label: 'Plan',
      as: 'RadioButton',
      buttonType: true,
      options: [
        {label: 'Free', value: 'free'},
        {label: 'Pro', value: 'pro'},
      ],
      defaultValue: 'free',
      colSpan: half,
    },

    email: {
      inputId: 'vis_email',
      label: 'Email (showWhen equals "email")',
      schema: 'required|email',
      showWhen: {field: 'contact_method', equals: 'email'},
      defaultValue: '',
      colSpan: half,
    },
    phone: {
      inputId: 'vis_phone',
      label: 'Phone (showWhen equals "phone")',
      schema: 'required',
      showWhen: {field: 'contact_method', equals: 'phone'},
      defaultValue: '',
      colSpan: half,
    },
    other_detail: {
      inputId: 'vis_other_detail',
      label: 'Tell us how (showWhen equals "other")',
      schema: 'required',
      showWhen: {field: 'contact_method', equals: 'other'},
      defaultValue: '',
      colSpan: full,
    },
    newsletter: {
      inputId: 'vis_newsletter',
      label: 'Newsletter (hideWhen plan is free)',
      as: 'Checkbox',
      binary: true,
      hideWhen: {field: 'plan', equals: 'free'},
      defaultValue: false,
      colSpan: half,
    },

    interests: {
      inputId: 'vis_interests',
      label: 'Interests',
      as: 'MultiSelect',
      options: [
        {label: 'Design', value: 'design'},
        {label: 'Code', value: 'code'},
        {label: 'Ops', value: 'ops'},
      ],
      optionLabel: 'label',
      optionValue: 'value',
      defaultValue: [],
      colSpan: half,
    },
    code_detail: {
      inputId: 'vis_code_detail',
      label: 'Languages (showWhen interests includes "code")',
      showWhen: {field: 'interests', includes: 'code'},
      defaultValue: '',
      colSpan: half,
    },

    sep_nested: {
      as: 'Separator',
      label: 'Nested and / or',
      align: 'left',
      type: 'dashed',
      colSpan: full,
    },
    priority_support: {
      inputId: 'vis_priority_support',
      label: 'Priority support — needs plan=pro AND (method=email OR method=phone)',
      as: 'Checkbox',
      binary: true,
      showWhen: {
        and: [
          {field: 'plan', equals: 'pro'},
          {
            or: [
              {field: 'contact_method', equals: 'email'},
              {field: 'contact_method', equals: 'phone'},
            ],
          },
        ],
      },
      defaultValue: false,
      colSpan: full,
    },
  }),
  sampleData: {
    contact_method: 'phone',
    plan: 'pro',
    email: '',
    phone: '090-1111-2222',
    other_detail: '',
    newsletter: true,
    interests: ['code'],
    code_detail: 'TypeScript',
    priority_support: true,
  },
}
