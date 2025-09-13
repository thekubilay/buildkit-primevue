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
- PrimeVue >= 4.0.0
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
  name: { label: 'Name', as: 'InputText', required: true, colSpan: { mobile: 12, tablet: 12, desktop: 12 }, vertical: false, style: {} },
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
  email: { label: 'Email', as: 'InputText', schema: 'required|email', colSpan: { mobile: 12, tablet: 12, desktop: 12 }, vertical: false, style: {} },
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
  project: { label: 'Project', as: 'InputText', colSpan: { mobile: 12, tablet: 12, desktop: 12 }, vertical: false, style: {} },
  desired_m2: { label: 'Desired m²', as: 'InputNumber', type: 'number', colSpan: { mobile: 12, tablet: 6, desktop: 6 }, vertical: false, style: {} },
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

You can also import specific components via subpaths (with types):

```ts
import FormKit from 'buildkit-primevue/FormKit';
import FormKitControl from 'buildkit-primevue/FormKitControl';
```

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
- as: component name (e.g., InputText, InputNumber, Checkbox, RadioButton, Select)
- schema: validation rules string (e.g., "required|max:12|email")
- defaultValue: any
- colSpan: { mobile, tablet, desktop }
- vertical: boolean (layout for group inputs)
- options: for selectables
- showWhen/hideWhen: conditional visibility

Example field configuration:

```ts
const fields: FormKitProps['fields'] = {
  name: {
    label: 'Name',
    as: 'InputText',
    schema: 'required|min:2',
    defaultValue: '',
    colSpan: { mobile: 12, tablet: 6, desktop: 6 },
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
    colSpan: { mobile: 12, tablet: 6, desktop: 6 },
    vertical: false,
    style: {},
  },
};
```

## Utilities

- `setFields(data, fields)`
  - Maps an incoming object (e.g., from an API) to your field defaults using safe value casting.
- `getPayload(states)`
  - Reads PrimeVue `FormFieldState` objects and returns a clean payload with values cast to sensible types.
- `setDynamicFields(columns)`
  - Transforms a column/config array into a `fields` map. Copies `rules` to `schema` automatically for non-checkboxes.

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

## Contributing
PRs and issues are welcome. Please open a discussion or issue for significant changes.

## License
MIT

---
Repository: https://github.com/thekubilay/buildkit-primevue
