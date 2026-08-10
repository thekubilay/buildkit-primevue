# buildkit-primevue

FormKit-powered form components and helpers built on PrimeVue v4 and Tailwind CSS. Provides a single drop-in `<FormKit>` component with a typed configuration schema, field utilities, and visibility helpers. Ships with first-class TypeScript support and friendly defaults.

- Vue 3 + PrimeVue v4
- Tailwind CSS 4-ready
- Default import for FormKit: `import FormKit from 'buildkit-primevue'`
- Utilities for mapping incoming data to fields and extracting a clean payload
- Bundled type definitions — no custom declarations needed

## Table of Contents
- Requirements
- Installation
- Quick Start
- Usage Examples
  - Minimal example
  - With utilities (setFields, getPayload)
  - Global plugin registration
  - Subpath imports
- Types
- Field schema basics
- Utilities
- Visibility helpers
- Troubleshooting
- Contributing
- License

## Requirements
- Vue >= 3.4
- PrimeVue >= 4.4.0
- @primevue/forms >= 4.0.0
- Tailwind CSS >= 4 (recommended) and tailwindcss-primeui (optional)

See peerDependencies in package.json for the full list.

## Installation

Install the package and the required peers:

```bash
npm i buildkit-primevue primevue @primevue/forms @primevue/themes @primeuix/themes @primeuix/utils vue
# optional but recommended if you use Tailwind v4
npm i -D tailwindcss @tailwindcss/vite @tailwindcss/postcss tailwindcss-primeui
```

Make sure PrimeVue and a theme are set up in your app entry per PrimeVue docs.

## Quick Start

You can import FormKit as a default import without curly braces:

```vue
<script setup lang="ts">
import FormKit from 'buildkit-primevue';
import type { FormKitProps } from 'buildkit-primevue';
import { ref, reactive } from 'vue';

const form = ref<Record<string, any>>({});
const fields: FormKitProps['fields'] = {
  // `required: true` draws the * on the label; `schema: 'required'` is what enforces it.
  name: { label: 'Name', as: 'InputText', required: true, schema: 'required', colSpan: { mobile: 1, tablet: 1, desktop: 1 }, vertical: false, style: {} },
};

const args = reactive<FormKitProps>({ fields, size: 'small' });
</script>

<template>
  <FormKit v-model="form" v-bind="args" />
</template>
```

## Usage Examples

### 1) Minimal example

```vue
<script setup lang="ts">
import FormKit from 'buildkit-primevue';
import type { FormKitProps } from 'buildkit-primevue';

const fields: FormKitProps['fields'] = {
  email: { label: 'Email', as: 'InputText', schema: 'required|email', colSpan: { mobile: 1, tablet: 1, desktop: 1 }, vertical: false, style: {} },
};
</script>

<template>
  <FormKit :fields="fields" />
</template>
```

### 2) With utilities (setFields, getPayload)

```vue
<script setup lang="ts">
import FormKit, { setFields, getPayload } from 'buildkit-primevue';
import type { FormKitProps } from 'buildkit-primevue';
import { ref, reactive, onMounted } from 'vue';

const form = ref<Record<string, any>>({});
const fields: FormKitProps['fields'] = {
  project: { label: 'Project', as: 'InputText', colSpan: { mobile: 1, tablet: 1, desktop: 1 }, vertical: false, style: {} },
  desired_m2: { label: 'Desired m²', as: 'InputNumber', type: 'number', colSpan: { mobile: 1, tablet: 2, desktop: 2 }, vertical: false, style: {} },
};

const args = reactive<FormKitProps>({ fields, size: 'small' });

onMounted(() => {
  // Prefill form defaults from API data
  setFields({ project: 'sample1', desired_m2: 70 }, fields);
});

function submit({ valid, states }: any) {
  const payload = getPayload(states);
  if (valid) {
    console.log('Submitting', payload);
  } else {
    console.log('Invalid', payload);
  }
}
</script>

<template>
  <FormKit v-model="form" v-bind="args" @submit="submit" />
</template>
```

### 3) Global plugin registration

If you prefer global registration of components:

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { BuildKitPrimeVue } from 'buildkit-primevue';

createApp(App)
  .use(BuildKitPrimeVue)
  .mount('#app');
```

After this, `<FormKit/>` and related components are globally available.

### 4) Subpath imports

Utility subpaths are available (with types):

```ts
import { getPayload } from 'buildkit-primevue/utils/getPayload';
import { setFields } from 'buildkit-primevue/utils/setFields';
import { clear } from 'buildkit-primevue/utils/clear';
import { setDynamicFields } from 'buildkit-primevue/utils/setDynamicFields';
```

> The `buildkit-primevue/FormKit` and `buildkit-primevue/FormKitControl` subpaths were
> removed — they pointed at bundle files the build never emitted, so they threw
> `ERR_MODULE_NOT_FOUND`. Import them from the package root instead:
> `import { FormKit, FormKitControl } from 'buildkit-primevue'`.

### 5) Separator fields

A separator is a layout-only entry in the same `fields` object — it draws a rule
(optionally with a section title) and never becomes part of the form value:

```ts
const fields = {
  section: { as: 'Separator', label: 'Profile', align: 'left', type: 'dashed' },
  first_name: { label: 'First name', colSpan: { mobile: 1, tablet: 1, desktop: 2 } },
  last_name:  { label: 'Last name',  colSpan: { mobile: 1, tablet: 1, desktop: 2 } },
};
```

- `label` — omit for a bare rule with no title
- `align` — `left` | `center` (default) | `right`
- `type` — `solid` (default) | `dashed` | `dotted`

Separators are excluded from initial values, validation, `getPayload()`, `setFields()`
and `clear()`. See [form_kit_documentation.md](./form_kit_documentation.md#separator-fields).

## Types

This package ships its own TypeScript definitions. No need to install `@types/buildkit-primevue` or add custom module declarations.

Useful types you can import:
- `FormKitProps`

```ts
import type { FormKitProps } from 'buildkit-primevue';
```

## Field schema basics

Each field accepts a config object. Common properties include:
- label: string
- as: component name (e.g., InputText, InputNumber, Checkbox, RadioButton, Select) or `Separator`
- required: boolean — draws the red `*` on the label **only**; it does not validate
- schema: validation rules string (e.g., "required|max:12|email") — this is what enforces
- defaultValue: any
- colSpan: { mobile, tablet, desktop } — optional, defaults to full width
- vertical: boolean (layout for group inputs)
- options: for selectables
- align / type: separator-only (label position and border style)
- showWhen/hideWhen: conditional visibility

Example field configuration:

```ts
const fields: FormKitProps['fields'] = {
  name: {
    label: 'Name',
    as: 'InputText',
    schema: 'required|min:2',
    defaultValue: '',
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    vertical: false,
    style: {},
  },
  country: {
    label: 'Country',
    as: 'Select',
    options: [
      { label: 'Japan', value: 'JP' },
      { label: 'Türkiye', value: 'TR' },
    ],
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    vertical: false,
    style: {},
  },
};
```

## Utilities

- `setFields(data, fields)`
  - Maps an incoming object (e.g., from an API) to your field defaults using safe value casting.
- `getPayload(states, fields?)`
  - Reads PrimeVue `FormFieldState` objects and returns a clean payload with values cast to sensible types. Pass `fields` so casting is component-aware (arrays for MultiSelect/CheckboxGroup, numbers for InputNumber, …) and separators are skipped. Without it, casting falls back to guessing from the value alone — `"true"` still becomes `true` and an ISO string still becomes a `Date`, but a value that only the component could disambiguate is left as a string.
- `setDynamicFields(columns)`
  - Transforms a `{ key, extra_data: { [key]: definition } }` array into a `fields` map. It shallow-clones each definition verbatim; it does **not** derive `schema` from anything.

Import from the main entry:

```ts
import { setFields, getPayload, setDynamicFields } from 'buildkit-primevue';
```

## Visibility helpers

Two helpers are exported for conditional rendering logic:
- `equals(left, right)` — strict equality with smart casting for arrays and common string-to-boolean/number cases.
- `includesMatch(left, right | right[])` — substring match for strings or membership for arrays/scalars with casting.

```ts
import { equals, includesMatch } from 'buildkit-primevue';
```

## Troubleshooting

- I can’t import `FormKit` without curly braces.
  - Ensure you’re using `import FormKit from 'buildkit-primevue'`. The default export is the component itself.
- TypeScript can’t find types.
  - Types are bundled. Confirm your tooling resolves package types (no custom `declare module` needed).
- PrimeVue components aren’t styled.
  - Make sure you installed and configured a PrimeVue theme per PrimeVue docs and that Tailwind is set up if you use Tailwind classes.

## Playground

`playground/` is a consumer app that imports the library the way an installed app does —
through `node_modules/buildkit-primevue` and the package `exports` map, not from `src/`.
That is what makes it catch packaging problems unit tests can't see.

```bash
npm run playground          # build the lib, then serve the playground on :3100
npm run playground:verify   # check every exports subpath resolves, ships, and packs
npm run verify              # unit tests + install check + consumer build
```

It ships ten demos — separator, text inputs, selection controls, numbers & dates,
validation, conditional visibility, responsive grid, zipcode & editor, `setDynamicFields`
and a kitchen sink — each showing the live submit payload next to the form.
See [playground/README.md](./playground/README.md).

## Contributing
PRs and issues are welcome. Please open a discussion or issue for significant changes.

Before publishing, run `npm run verify`.

## License
MIT

---
Repository: https://github.com/thekubilay/buildkit-primevue
