# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

buildkit-primevue is a Vue 3 form component library that wraps PrimeVue v4 components with a declarative, type-safe configuration API. It provides a single `<FormKit>` component driven by a field schema array, with built-in Zod validation, conditional visibility, responsive grid layout, and form utilities. The library targets Japanese-language applications (validation messages are in Japanese).

## Stack

- Library version 0.2.2, published to npm as `buildkit-primevue`; consumed by admin.branz-esalon, branz-esalon_fe, reservation.branz-esalon_fe, admin.kenshinyoyaku, admin.minatoshouji, highroller_fe. A change to the public API / `exports` map affects all of them.
- Peer deps: Vue >=3.4, PrimeVue 4 + @primevue/forms + @primeuix/themes 2, zod **4.6.6 (exact pin)**, @vueuse/core 14, axios, quill 2
- Dev toolchain: TypeScript 6.0, Vite 8.3 (exact pin `8.3.4`), vue-tsc 3, Vitest 4 (jsdom) + @vue/test-utils; tailwindcss 4 is a devDependency only (playground/dev)

## Commands

- **Install:** `npm ci`
- **Dev server:** `npm run dev` (Vite on port 3000)
- **Build:** `npm run build` (`vue-tsc -b` + Vite library build → `dist/`)
- **Run all tests:** `npm test` (Vitest, one-shot)
- **Watch tests:** `npm run test:ui` (plain `vitest` watch mode — despite the name there is no `--ui` flag and `@vitest/ui` is not installed)
- **Run a single test file:** `npx vitest run tests/formkit.visibility.test.ts`
- **Run tests matching a pattern:** `npx vitest run -t "pattern"`
- **Playground (consumer app):** `npm run playground` (builds the lib, serves `playground/` on port 3100)
- **Install/packaging check:** `npm run playground:verify`
- **Full gate:** `npm run verify` (tests + install check + consumer build)

## Architecture

### Component Hierarchy

```
FormKit.vue (container — wraps @primevue/forms Form)
  ├─ FormKitField.vue (per-field wrapper with label/error)
  │    └─ FormKitControl.vue (dynamic renderer using :is="component")
  │         └─ PrimeVue component (InputText, Select, DatePicker, etc.)
  └─ FormKitSeparator.vue (as: "Separator" — bypasses FormField)
       └─ PrimeVue Divider
```

`FormKitControl` dynamically resolves and renders PrimeVue components based on the `as` prop in each field definition. Library-specific props are filtered out before pass-through to PrimeVue.

**Separator fields** (`src/components/formkit/utils/isSeparator.ts`): `as: "Separator"` marks a layout-only entry. `FormKit.vue` branches to `FormKitSeparator` before `FormKitField`, so it never registers on the Form — and it is skipped in `initialValues`, the Zod schema, `getPayload`, `setFields` and `clear`. Any new code that iterates `fields` and expects a value must guard with `isSeparatorField()`.

### Key Systems

**Reactive Visibility** (`src/components/formkit/utils/visibility.ts`, used in `FormKit.vue`):
Fields support `showWhen`/`hideWhen` conditions that reference other field values. Form values are tracked via Vue `provide/inject` across the component tree. Hidden fields are excluded from validation and submission, and their values are auto-cleared.

**Validation** (`src/components/formkit/useFormKitValidations.ts`):
String-based schema format (`"required|email|max:100"`) is parsed into Zod schemas. Supports custom rules: katakana, hiragana, romaji, number, nospace. Validation is visibility-aware — hidden fields skip validation.

**Type Casting** (`src/components/formkit/utils/castValue.ts`):
Component-aware value coercion: ISO date strings → Date objects, string booleans → booleans, string numbers → numbers for InputNumber, comma-separated strings → arrays for MultiSelect.

**Responsive Grid** (`src/components/formkit/utils/spanStyleMap.ts`):
Fields use `colSpan: { mobile, tablet, desktop }` with breakpoints at 512px and 724px. Uses `useResizeObserver` from @vueuse/core.

### Utilities (exported from `src/index.ts`)

- `setFields(apiData, fields)` — populate field values from API response data
- `getPayload(states, fields)` — extract clean submission payload from form state
- `clear(form, fields)` — reset form fields to defaults
- `setDynamicFields(columns)` — convert backend column config to field definitions
- `equals()`, `includesMatch()` — visibility condition helpers

### Build Output

Vite library mode produces `dist/index.mjs` (ESM), `dist/index.cjs` (CJS), and `dist/styles.css`. Type definitions go to `types/`. Vue, PrimeVue, Zod, Axios, and @vueuse/core are externalized as peer dependencies.

### Entry Point

`src/index.ts` exports all components, utilities, types, and a Vue plugin (`BuildKitPrimeVue`) for global registration. Default export is the `FormKit` component.

### Testing

Tests live in `tests/` and use Vitest with jsdom. PrimeVue form components are mocked in `vitest.setup.ts` to avoid heavy rendering. Test files follow `*.test.ts` naming.

Unit tests run against `src/` and therefore cannot see packaging problems. `playground/` is a separate consumer app that imports the library through `node_modules/buildkit-primevue` and the `exports` map; `playground/scripts/verify-install.mjs` checks that every `exports` subpath resolves, ships in `files`, and lands in `npm pack`. Run `npm run verify` before publishing.

### Styling

Custom CSS in `src/components/styles.css` uses a `bk-` prefix (e.g., `.bk-form`, `.bk-field`). Leverages PrimeVue CSS variables for theming. No Tailwind dependency at runtime despite the package description.
