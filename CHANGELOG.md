# Changelog

## 0.2.0

### Breaking changes

**`required: true` no longer validates.** It is now purely the label marker that renders
the red `*`. Enforcement comes only from the `required` token inside `schema`.

Previously `required: true` alone blocked submission on 7 of 10 component types
(InputText, Textarea, the bare default, InputNumber, DatePicker, Select, RadioButton)
while doing nothing for Checkbox, MultiSelect and CheckboxGroup — the same config
enforced or not depending on `as`.

**Audit any field that relied on `required: true` alone; it no longer blocks submission.**

```diff
- { label: "Name", required: true }
+ { label: "Name", required: true, schema: "required" }
```

A related consequence: `Select` and `RadioButton` only get their value-whitelist check
(submitted value must be one of `options`) when the schema marks them required. An
optional Select now accepts a value that is not in its `options`.

**`CheckboxGroup` payload shape.** `castValue` now coerces `CheckboxGroup` values to
arrays like `MultiSelect` already did, so `""` becomes `[]` and `"a,b"` becomes
`["a","b"]`. Backends receiving a string for these fields will now receive an array.

**Label `for` is omitted where it cannot point at a focusable control** — `Slider`,
`Editor`, and grouped `CheckboxGroup` / `RadioButton`. Previously `for` was always
emitted and pointed at a wrapper element or at nothing. End-to-end selectors keyed on
`label[for=…]` for those field types need updating.

**Removed `exports` subpaths `buildkit-primevue/FormKit` and
`buildkit-primevue/FormKitControl`.** They pointed at bundle files the build never
emitted, so they threw `ERR_MODULE_NOT_FOUND` on every install. Import from the package
root instead:

```ts
import { FormKit, FormKitControl } from "buildkit-primevue";
```

### Added

- **`as: "Separator"`** — a layout-only field that draws a rule, optionally with a section
  title. `align` (`left` | `center` | `right`), `type` (`solid` | `dashed` | `dotted`),
  and `layout` are supported; `showWhen` / `hideWhen` work as on any other field.
  Separators never register on the form and are excluded from initial values, the
  validation schema, `getPayload()`, `setFields()` and `clear()`.
  New exports: `FormKitSeparator`, `isSeparatorField`, `SEPARATOR_TYPES`.
- **`playground/`** — a consumer app that imports the library through
  `node_modules/buildkit-primevue` and the package `exports` map rather than from `src/`,
  so it catches packaging problems unit tests cannot see. `npm run playground` serves it;
  `npm run verify` runs unit tests plus an install check and a runtime check that mounts
  the packed tarball against real PrimeVue.

### Fixed

- **Optional `MultiSelect` / `CheckboxGroup` behaved as required.** An empty value arrives
  as `""` from several directions (a blank CheckboxGroup, `clear()`, backend column
  configs shipping `defaultValue: ""`), which failed the array type check and reported
  「無効な入力です（配列が必要です）」 on a field the user never touched.
- **A missing value now reads as "required" rather than as a type mismatch.** Zod 4
  removed `issue.received`, which left the error map's missing-value branch dead; an empty
  required `InputNumber` said 数値を入力してください instead of 必須項目です. Fixed across
  the error map, the number and date branches, and every branch of the Select schema.
- **`inputId` now reaches the control regardless of `as`.** It was only applied when the
  field declared an explicit `as`, so a field relying on the default `InputText` rendered
  without an id and its label's `for` dangled. The id is also routed to the focusable
  element rather than a wrapper: components declaring PrimeVue's `inputId` prop receive it
  there, the rest receive `id`.
- **Published types corrected.** `showWhen` / `hideWhen` now type the nested `and` / `or`
  forms the runtime has always supported; `colSpan`, `style` and `vertical` are optional;
  `inputId` and the separator props are declared.

## 0.1.96 and earlier

See the git history.
