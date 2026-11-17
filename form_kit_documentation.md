# buildkit-primevue Documentation

A Vue 3 form component library wrapping PrimeVue v4 components with a declarative, type-safe configuration API. Provides a single `<FormKit>` component driven by a field schema, with built-in Zod validation, conditional visibility, responsive grid layout, and form utilities.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Importing the Library](#importing-the-library)
3. [Basic Usage](#basic-usage)
4. [Field Definition Schema](#field-definition-schema)
5. [Supported PrimeVue Components](#supported-primevue-components)
6. [Separator Fields](#separator-fields)
7. [Validation Rules](#validation-rules)
8. [Visibility Conditions](#visibility-conditions)
9. [Responsive Grid Layout](#responsive-grid-layout)
10. [Type Casting](#type-casting)
11. [Utility Functions](#utility-functions)
12. [Locale Support](#locale-support)
13. [Complete Examples](#complete-examples)
14. [Playground](#playground)

---

## Installation & Setup

### Peer Dependencies

```bash
npm install buildkit-primevue
```

The following peer dependencies must be installed:

| Package            | Version   | Needed for                                     |
| ------------------ | --------- | ---------------------------------------------- |
| `vue`              | >=3.4     | Everything                                     |
| `primevue`         | ^4.4.0    | Every rendered control                         |
| `@primevue/forms`  | >=4.0.0   | `Form` / `FormField` — the form state engine   |
| `@primevue/themes` | >=4.0.0   | Theming                                        |
| `@primeuix/themes` | ^2.0.3    | Theming (Aura and friends)                     |
| `@primeuix/utils`  | >=0.0.1   | PrimeVue internals                             |
| `zod`              | 4.6.6     | Validation (exact pin)                         |
| `axios`            | >=1.0.0   | `as: "Zipcode"` lookup only                    |
| `@vueuse/core`     | ^14.1.0   | `useResizeObserver` for the responsive grid    |
| `quill`            | ^2.0.3    | `as: "Editor"` only                            |

`package.json` also declares `@types/node`, `autoprefixer` and `postcss` as peer
dependencies. These are build tooling, not runtime requirements — `playground/` installs
and builds the library with `@types/node` and `autoprefixer` completely absent.

### Plugin Registration (Global)

```typescript
import { createApp } from "vue";
import { BuildKitPrimeVue } from "buildkit-primevue";
import "buildkit-primevue/styles.css";

const app = createApp(App);
app.use(BuildKitPrimeVue);
app.mount("#app");
```

This registers `FormKit`, `FormKitControl`, `FormKitField`, `FormKitLabel`, and `FormKitSeparator` globally.

---

## Importing the Library

### Default Import (FormKit Component)

```typescript
import FormKit from "buildkit-primevue";
```

### Named Imports

```typescript
// Components
import {
  FormKit,
  FormKitControl,
  FormKitField,
  FormKitLabel,
  FormKitSeparator,
} from "buildkit-primevue";

// Utility functions
import {
  getPayload,
  setFields,
  setDynamicFields,
  clear,
  equals,
  includesMatch,
  isSeparatorField,
  SEPARATOR_TYPES,
} from "buildkit-primevue";

// Types
import type {
  FormKitProps,
  FormKitField,
  VisibilityCondition,
  Locale,
} from "buildkit-primevue";
```

### Subpath Imports

```typescript
import { getPayload } from "buildkit-primevue/utils/getPayload";
import { setFields } from "buildkit-primevue/utils/setFields";
import { clear } from "buildkit-primevue/utils/clear";
import { setDynamicFields } from "buildkit-primevue/utils/setDynamicFields";
```

> The `buildkit-primevue/FormKit` and `buildkit-primevue/FormKitControl` subpaths were
> removed: they pointed at bundle files the library build never emitted, so they threw
> `ERR_MODULE_NOT_FOUND` on every install. Import both components from the package root
> instead — `import { FormKit, FormKitControl } from "buildkit-primevue"`.

### Styles

```typescript
import "buildkit-primevue/styles.css";
```

---

## Basic Usage

```vue
<template>
  <FormKit v-bind="formArgs" v-model="form" @submit="onSubmit" />
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import FormKit from "buildkit-primevue";
import { getPayload } from "buildkit-primevue";
import type { FormKitProps } from "buildkit-primevue";

const form = ref<Record<string, any>>({});

const fields = {
  name: {
    label: "Name",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    schema: "required|max:100",
  },
  email: {
    label: "Email",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    schema: "required|email",
  },
};

const formArgs = reactive<FormKitProps>({
  fields: fields,
  size: "small",
  locale: "en",
});

const onSubmit = ({ valid, states }: any) => {
  if (valid) {
    const payload = getPayload(states, fields);
    console.log(payload);
  }
};
</script>
```

---

## Field Definition Schema

Each field is defined as a key-value pair in a fields object. The key becomes the field name, and the value is a `FormKitField` object.

### TypeScript Interfaces

```typescript
interface FormKitField {
  label?: string;
  inputId?: string;   // DOM id on the control + the label's `for` target
  required?: boolean; // label marker only — `schema: "required"` is what enforces
  groupId?: string;
  messages?: string[];
  className?: string;
  type?: string;              // also the border style for `as: "Separator"`
  as?: string;
  align?: "left" | "center" | "right" | "top" | "bottom"; // Separator only
  layout?: "horizontal" | "vertical";                     // Separator only
  defaultValue?: any;
  colSpan?: { mobile: number; tablet: number; desktop: number };
  style?: any;
  schema?: string;
  vertical?: boolean;
  options?: Array<{ label: string; value: any }>;
  showWhen?: VisibilityCondition | VisibilityCondition[];
  hideWhen?: VisibilityCondition | VisibilityCondition[];
  [key: string]: any; // Pass-through to PrimeVue component
}

interface VisibilityLeaf {
  field: string;
  equals?: any;
  includes?: any | any[];
}

type VisibilityCondition =
  | VisibilityLeaf
  | { and: VisibilityCondition[] }
  | { or: VisibilityCondition[] }
  | VisibilityCondition[];

interface FormKitProps {
  fields: Record<string, FormKitField>;
  size?: "small" | "medium" | "large";
  locale?: "ja" | "en";
}
```

### All Field Properties

| Property       | Type                                          | Required | Description                                                       |
| -------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `label`        | `string`                                      | No       | Field label text                                                  |
| `inputId`      | `string`                                      | No       | DOM id for the control and the `for` target of its label — see [Label association](#label-association) |
| `required`     | `boolean`                                     | No       | **Label marker only** — renders the red `*`. Does **not** validate; use `schema: "required"` for that |
| `groupId`      | `string`                                      | No       | Optional group identifier                                        |
| `messages`     | `string[]`                                    | No       | Custom error messages                                             |
| `className`    | `string`                                      | No       | CSS class name                                                    |
| `type`         | `string`                                      | No       | Value type hint (`"number"`, `"array"`). For `as: "Separator"` it is the border style |
| `as`           | `string`                                      | No       | PrimeVue component name, or `"Separator"`. Defaults to `InputText` |
| `align`        | `"left" \| "center" \| "right"`               | No       | **Separator only** — where the title sits (`"top" \| "center" \| "bottom"` when `layout: "vertical"`). Defaults to `center` |
| `layout`       | `"horizontal" \| "vertical"`                  | No       | **Separator only** — rule orientation. Defaults to `horizontal`    |
| `defaultValue` | `any`                                         | No       | Initial value for the field                                       |
| `colSpan`      | `{ mobile, tablet, desktop }`                 | No       | Responsive column spanning (1-6 per breakpoint). Omit for full width |
| `style`        | `any`                                         | No       | Inline styles object                                              |
| `schema`       | `string`                                      | No       | Validation rules string (e.g., `"required\|max:100\|email"`)     |
| `vertical`     | `boolean`                                     | No       | Stack items vertically (for CheckboxGroup, RadioButton)           |
| `options`      | `Array<{ label: string; value: any }>`        | No       | Options for Select, RadioButton, CheckboxGroup                    |
| `showWhen`     | `VisibilityCondition \| VisibilityCondition[]` | No       | Show field when condition(s) match                                |
| `hideWhen`     | `VisibilityCondition \| VisibilityCondition[]` | No       | Hide field when condition(s) match (`hideWhen` takes precedence)  |
| `[key]`        | `any`                                         | No       | Any additional PrimeVue component-specific prop (pass-through)    |

### Common Pass-Through Props (PrimeVue)

These are not part of FormKit's own API but are forwarded directly to the underlying PrimeVue component:

| Prop            | Used With                    | Description                          |
| --------------- | ---------------------------- | ------------------------------------ |
| `placeholder`   | InputText, Select, Textarea  | Placeholder text                     |
| `optionLabel`   | Select, MultiSelect          | Property name for option display     |
| `optionValue`   | Select, MultiSelect          | Property name for option value       |
| `filter`        | Select, MultiSelect          | Enable filtering/search in dropdown  |
| `showClear`     | Select                       | Show clear button                    |
| `dateFormat`    | DatePicker, Calendar         | Date display format                  |
| `showIcon`      | DatePicker, Calendar         | Show calendar icon                   |
| `selectionMode` | DatePicker, Calendar         | `single`, `multiple`, `range`        |
| `min`           | InputNumber                  | Minimum value                        |
| `max`           | InputNumber                  | Maximum value                        |
| `step`          | InputNumber                  | Step increment                       |
| `suffix`        | InputNumber                  | Value suffix                         |
| `prefix`        | InputNumber                  | Value prefix                         |
| `maxlength`     | InputText, Textarea          | Max character length                 |
| `readonly`      | InputText, Textarea          | Read-only mode                       |
| `iconLeft`      | InputText                    | Left icon (wrapped in IconField)     |
| `iconRight`     | InputText                    | Right icon (wrapped in IconField)    |
| `buttonType`    | RadioButton                  | Button styling type                  |

---

## Supported PrimeVue Components

Set via the `as` property. Defaults to `InputText` if not specified.

| `as` Value       | Component Type    | Value Type   | Notes                                    |
| ---------------- | ----------------- | ------------ | ---------------------------------------- |
| `InputText`      | Text input        | `string`     | Default component                        |
| `Textarea`       | Text area         | `string`     | Multi-line text                          |
| `Password`       | Password input    | `string`     | Masked text input                        |
| `Chips`          | Chip input        | `string[]`   | Tag-like input                           |
| `Editor`         | Rich text editor  | `string`     | HTML editor (requires Quill)             |
| `InputNumber`    | Number input      | `number`     | Auto-coerced to number                   |
| `Slider`         | Slider            | `number`     | Numeric range slider                     |
| `Select`         | Dropdown          | `any`        | Single selection, requires `options`     |
| `MultiSelect`    | Multi dropdown    | `any[]`      | Multiple selection, requires `options`   |
| `Checkbox`       | Single checkbox   | `boolean`    | Boolean toggle                           |
| `CheckboxGroup`  | Checkbox group    | `any[]`      | Multiple selection, requires `options`   |
| `RadioButton`    | Radio buttons     | `any`        | Single selection, requires `options`     |
| `ToggleButton`   | Toggle button     | `boolean`    | Boolean toggle button                    |
| `InputSwitch`    | Switch            | `boolean`    | Boolean switch                           |
| `ToggleSwitch`   | Switch            | `boolean`    | PrimeVue v4 name for the same control    |
| `Calendar`       | Calendar picker   | `Date`       | Date input                               |
| `DatePicker`     | Date picker       | `Date`       | Date input                               |
| `Zipcode`        | Zipcode input     | `string`     | Custom component with lookup icon        |
| `Separator`      | Horizontal rule   | *(no value)* | Layout only — see [Separator Fields](#separator-fields) |

Components are resolved dynamically from the PrimeVue namespace, so any PrimeVue component can theoretically be used by name. `Separator` is the one exception: it is intercepted by FormKit before the lookup and never becomes an input.

### Field Definition Examples by Component

**InputText:**
```javascript
name: {
  label: "Name",
  defaultValue: "",
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required|max:100",
  placeholder: "Enter your name",
}
```

**Select:**
```javascript
status: {
  label: "Status",
  as: "Select",
  defaultValue: "",
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required",
  options: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ],
  placeholder: "Select status",
  showClear: true,
}
```

**MultiSelect:**
```javascript
tags: {
  label: "Tags",
  as: "MultiSelect",
  defaultValue: [],
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required|min:1|max:5",
  options: [
    { label: "Frontend", value: "frontend" },
    { label: "Backend", value: "backend" },
    { label: "DevOps", value: "devops" },
  ],
  filter: true,
}
```

**InputNumber:**
```javascript
price: {
  label: "Price",
  as: "InputNumber",
  defaultValue: null,
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required",
  min: 0,
  max: 999999,
  prefix: "$",
}
```

**Checkbox:**
```javascript
agree: {
  label: "I agree to terms",
  as: "Checkbox",
  defaultValue: false,
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
}
```

**CheckboxGroup:**
```javascript
interests: {
  label: "Interests",
  as: "CheckboxGroup",
  defaultValue: [],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  vertical: true,
  options: [
    { label: "Sports", value: "sports" },
    { label: "Music", value: "music" },
    { label: "Reading", value: "reading" },
  ],
}
```

**RadioButton:**
```javascript
gender: {
  label: "Gender",
  as: "RadioButton",
  defaultValue: "",
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required",
  options: [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ],
}
```

**DatePicker:**
```javascript
birthday: {
  label: "Birthday",
  as: "DatePicker",
  defaultValue: null,
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
  schema: "required",
  dateFormat: "yy-mm-dd",
  showIcon: true,
}
```

**Textarea:**
```javascript
description: {
  label: "Description",
  as: "Textarea",
  defaultValue: "",
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  schema: "max:500",
  rows: 5,
}
```

**InputSwitch:**
```javascript
notifications: {
  label: "Enable Notifications",
  as: "InputSwitch",
  defaultValue: false,
  colSpan: { mobile: 1, tablet: 2, desktop: 3 },
}
```

---

## Separator Fields

A separator is a **layout-only** entry in the same `fields` object. It draws a horizontal
rule — optionally with a section title on it — and holds no value.

```javascript
const fields = {
  section_profile: {
    as: "Separator",
    label: "Profile",     // omit for a plain rule with no title
    align: "left",        // "left" | "center" (default) | "right"
    type: "dashed",       // "solid" (default) | "dashed" | "dotted"
  },
  first_name: { label: "First name", defaultValue: "", colSpan: { mobile: 1, tablet: 1, desktop: 2 } },
  last_name:  { label: "Last name",  defaultValue: "", colSpan: { mobile: 1, tablet: 1, desktop: 2 } },
};
```

### Properties

| Property  | Type                                | Default        | Description                                          |
| --------- | ----------------------------------- | -------------- | ---------------------------------------------------- |
| `as`      | `"Separator"`                       | —              | **Required.** Marks the entry as a separator          |
| `label`   | `string`                            | *(none)*       | Title on the rule. Omit / leave blank for a bare line |
| `align`   | `"left" \| "center" \| "right"`     | `"center"`     | Where the title sits. A vertical `layout` uses `"top" \| "center" \| "bottom"` instead |
| `type`    | `"solid" \| "dashed" \| "dotted"`   | `"solid"`      | Border style                                          |
| `layout`  | `"horizontal" \| "vertical"`        | `"horizontal"` | Rule orientation                                      |
| `colSpan` | `{ mobile, tablet, desktop }`       | full width     | Same responsive grid rules as any other field         |

`showWhen` / `hideWhen` work on separators exactly as they do on inputs, so a whole
section heading can appear and disappear with its fields. `class` / `className` are
applied to the rule, and any other property is forwarded to the underlying PrimeVue
`Divider`.

### What a separator is excluded from

Because it holds no value, a separator is deliberately skipped everywhere a value would
be expected:

| Behaviour                    | Separator                                              |
| ---------------------------- | ------------------------------------------------------ |
| PrimeVue `Form` registration | Never registers — no `FormField` wrapper is rendered   |
| `<Form :initial-values>`     | Excluded                                                |
| Validation schema            | No Zod entry is generated, even with `schema`/`required` |
| `@submit` event `states`     | Absent                                                  |
| `getPayload(states, fields)` | Skipped                                                 |
| `setFields(data, fields)`    | Skipped — no `defaultValue` is assigned                 |
| `clear(data, fields)`        | Skipped                                                 |

### Detecting separators in your own code

```typescript
import { isSeparatorField, SEPARATOR_TYPES } from "buildkit-primevue";

const inputNames = Object.keys(fields).filter((k) => !isSeparatorField(fields[k]));

SEPARATOR_TYPES; // ["Separator"]
```

> `as: "Divider"` is **not** treated as a separator. That name already resolved to
> PrimeVue's `Divider` through the generic `as` lookup, so it keeps its old behaviour
> and still renders inside a normal form field.

### Rendering directly

`FormKitSeparator` is exported and registered globally, so a rule can also be dropped
into the `#start` / `#end` / `#footer` slots outside the field loop:

```vue
<FormKitSeparator label="Advanced" :rest="{ align: 'left', type: 'dashed' }" />
```

---

## Validation Rules

Validation uses a string-based schema format parsed into Zod schemas. Rules are pipe-separated: `"rule1|rule2:param|rule3"`.

### Available Rules

| Rule       | Syntax              | Description                                              | Example                  |
| ---------- | ------------------- | -------------------------------------------------------- | ------------------------ |
| `required` | `required`          | Field must have a non-empty value                        | `"required"`             |
| `email`    | `email`             | Valid email format                                       | `"required\|email"`      |
| `url`      | `url`               | Valid URL format                                         | `"url"`                  |
| `min`      | `min:n`             | Min length (strings) or min count (arrays)               | `"min:5"`                |
| `max`      | `max:n`             | Max length (strings) or max count (arrays)               | `"max:100"`              |
| `length`   | `length:n`          | Exact length match                                       | `"length:10"`            |
| `between`  | `between:min,max`   | Length/count between min and max                         | `"between:5,20"`         |
| `number`   | `number`            | Digits only                                              | `"number"`               |
| `katakana` | `katakana`          | Full/half-width katakana and spaces only                 | `"required\|katakana"`   |
| `hiragana` | `hiragana`          | Hiragana and spaces only                                 | `"required\|hiragana"`   |
| `romaji`   | `romaji`            | Letters, numbers, underscores, hyphens only              | `"romaji"`               |
| `nospace`  | `nospace`           | No spaces allowed                                        | `"required\|nospace"`    |
| `regex`    | `regex:pattern`     | Custom regex pattern                                     | `"regex:^[A-Z]+$"`      |

### Label association

`inputId` is applied whether or not the field declares an `as`, and always onto the
element the user can actually focus. Which prop carries it is decided by asking the
resolved component, not by a hard-coded list:

| Component shape                                                     | Receives    | Label's `for` |
| ------------------------------------------------------------------- | ----------- | ------------- |
| Plain controls — `InputText`, `Textarea`, `Zipcode`                   | `id`        | ✅ points at it |
| Wrapper controls that declare `inputId` — `Select`, `MultiSelect`, `DatePicker`, `InputNumber`, `Checkbox`, `RadioButton`, `ToggleSwitch`, `Password`, … | `inputId`   | ✅ points at it |
| `Slider`, `Editor` — the id can only reach their outer wrapper        | `id` (wrapper) | ❌ omitted |
| `CheckboxGroup`, and `RadioButton` **with** `options`                 | per-option ids | ❌ omitted on the group label; each option labels its own input |

Where the id cannot reach a focusable control, the label is rendered **without** `for`
rather than with one that dangles or points at a plain `<div>` — a `for` that focuses
nothing is worse than none, because assistive tech announces the association as real.

### `required: true` vs `schema: "required"`

These are two independent knobs and it matters which one you reach for:

| Config                | Red `*` on the label | Blocks submission |
| --------------------- | -------------------- | ----------------- |
| `required: true`      | ✅                    | ❌                 |
| `schema: "required"`  | ❌                    | ✅                 |
| both                  | ✅                    | ✅                 |

`required` is a **presentation flag** — `FormKitLabel` renders the asterisk from it and
nothing else reads it. It is also filtered out before pass-through, so it never lands on
the input as the native HTML `required` attribute. Enforcement comes only from the
`required` token inside `schema`. In practice you usually want both:
`{ required: true, schema: "required|email" }`.

⚠️ One consequence worth knowing: `Select` and `RadioButton` only get their
**value-whitelist** check (submitted value must be one of `options`) when the schema marks
them required. An optional Select resolves to `z.any().optional()` and will accept a value
that is not in its `options` at all. If that check matters to you, add `required` to the
schema string.

### Validation Behavior

- ⚠️ **`schema` rules only apply when the schema also contains `required`.**
  `useFormKitValidations.ts` gates the whole rule loop behind `if (field.schema && isRequired)`.
  On an optional field, `schema: "number|length:10"` is parsed and then **silently ignored** —
  the field validates as a plain optional string. To apply a format rule, add `required`
  to the schema string.
- **A missing value reads as "required"**, not as a type mismatch. An empty required
  `InputNumber` says 必須項目です, not 数値を入力してください; that wording is reserved for a
  value of genuinely the wrong type. This works across Zod 3 and Zod 4: Zod 3 named the
  received type in `issue.received`, Zod 4 dropped that and carries the value as
  `issue.input`, so both are read. `tests/formkit.messages.test.ts` pins the zod 4.6.6
  issue shape and the literal Japanese messages.
- **Hidden fields skip validation** entirely (auto-replaced with `z.any().optional()`)
- Validation is visibility-aware: runs only on visible fields
- Arrays (MultiSelect, CheckboxGroup) validate `min`/`max` against item count
- Error messages are available in Japanese (`ja`) and English (`en`)
- Combine multiple rules: `"required|email|max:100"`
- Separator fields get no schema entry at all, even if given `schema` or `required`

---

## Visibility Conditions

Fields can be conditionally shown or hidden based on other field values using `showWhen` and `hideWhen`.

### Basic Syntax

```typescript
interface VisibilityCondition {
  field: string;       // Name of the field to watch
  equals?: any;        // Show/hide when field value equals this
  includes?: any;      // Show/hide when field value includes this
}
```

### Single Condition

```javascript
// Show 'details' only when status equals "active"
details: {
  label: "Details",
  showWhen: { field: "status", equals: "active" },
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
}

// Hide 'notes' when type equals "simple"
notes: {
  label: "Notes",
  hideWhen: { field: "type", equals: "simple" },
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
}
```

### Multiple Conditions (OR Logic)

When an array of conditions is provided, the field is shown/hidden if **any** condition matches (OR logic).

```javascript
// Show 'advanced_settings' when type is "alert" OR mode is "advanced"
advanced_settings: {
  label: "Advanced Settings",
  showWhen: [
    { field: "type", equals: "alert" },
    { field: "mode", equals: "advanced" },
  ],
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
}
```

### Substring Match with `includes`

```javascript
// Show 'result' when keyword contains "world"
result: {
  label: "Result",
  showWhen: { field: "keyword", includes: "world" },
  colSpan: { mobile: 1, tablet: 1, desktop: 1 },
}
```

### Behavior

- `hideWhen` takes precedence over `showWhen` if both are set
- Hidden fields are **completely removed from the DOM** (`v-if`, not `v-show`)
- Hidden fields are **excluded from validation**
- Hidden field values are **auto-cleared** to `null`
- Type coercion is applied: `"true"` matches `true`, `"1"` matches `1`, etc.

---

## Responsive Grid Layout

The `colSpan` property controls how many columns each field occupies across three breakpoints.

### Breakpoints

| Breakpoint | Width                | Property |
| ---------- | -------------------- | -------- |
| Mobile     | `< 512`              | `mobile` |
| Tablet     | `> 512` and `< 724`  | `tablet` |
| Desktop    | everything else      | `desktop`|

Both tablet comparisons are strict, so a width of exactly `512` or `724` falls through to
`desktop`. Width is measured on `document.body` via `useResizeObserver`, not on the form's
own container — the breakpoints follow the window, not the space the form sits in.

### Column Values (1-6)

| Value | Width                       | Layout         |
| ----- | --------------------------- | -------------- |
| `1`   | `100%`                      | Full width     |
| `2`   | `calc(50% - 10px)`          | Half width     |
| `3`   | `calc(33.33% - 13.33px)`    | One third      |
| `4`   | `calc(25% - 15px)`          | One quarter    |
| `5`   | `calc(20% - 16px)`          | One fifth      |
| `6`   | `calc(16.67% - 12.67px)`    | One sixth      |

Gap between fields is 20px.

### Examples

```javascript
// Full width on mobile, half on tablet, one-third on desktop
colSpan: { mobile: 1, tablet: 2, desktop: 3 }

// Always full width
colSpan: { mobile: 1, tablet: 1, desktop: 1 }

// Half on all screen sizes
colSpan: { mobile: 2, tablet: 2, desktop: 2 }
```

---

## Type Casting

The library automatically casts values based on the `as` component type. This happens when loading data via `setFields()` and extracting data via `getPayload()`.

| Component                          | Input             | Output         |
| ---------------------------------- | ----------------- | -------------- |
| `InputNumber`, `Slider`            | `"123"`           | `123`          |
| `Checkbox`, `ToggleButton`, `InputSwitch` | `"true"` / `"yes"` | `true`    |
| `Checkbox`, `ToggleButton`, `InputSwitch` | `"false"` / `"no"` | `false`  |
| `Calendar`, `DatePicker`           | `"2023-10-05T05:23:41.036132Z"` | `Date` object |
| `MultiSelect`, `CheckboxGroup`     | `"a,b,c"`         | `["a","b","c"]` |
| `MultiSelect`, `CheckboxGroup`     | `""`              | `[]`           |
| `InputText`, `Textarea`, `Select`  | any value         | Kept as-is     |
| *(any component)*                  | `null` / `undefined` | `null`      |

### Empty values on array-valued controls

`MultiSelect` and `CheckboxGroup` hold arrays, but an empty value reaches them as `""` from
several directions: `clear()` resets string state to it, and backend column configs handed
to `setDynamicFields()` typically ship `defaultValue: ""` for every field regardless of the
control. Two places cooperate so this does not surface as an error:

- `castValue` coerces `""` to `[]` for both controls, so `setFields()` and `getPayload()`
  produce the same array shape for each.
- The validator coerces a blank string to "no value" before the array check, so an
  **optional** MultiSelect/CheckboxGroup the user never touched does not report
  「無効な入力です（配列が必要です）」 and behave as if it were required.

A **required** array field still rejects a blank value.

---

## Utility Functions

### `setFields(data, fields)`

Populate field `defaultValue` properties from API response data.

```typescript
function setFields(data: any, fields: any): void
```

**Parameters:**
- `data` - API response object with key-value pairs
- `fields` - Field definitions object (modified in place)

```javascript
import { setFields } from "buildkit-primevue";

const apiData = {
  name: "John Doe",
  status: "published",
  calendar_start_at: "2026-02-27T15:00:00Z",
};

setFields(apiData, fields);
// fields.name.defaultValue is now "John Doe"
// fields.status.defaultValue is now "published"
// fields.calendar_start_at.defaultValue is now a Date object
```

### `getPayload(states, fields?)`

Extract a clean submission payload from form states.

```typescript
function getPayload(
  states: Record<string, FormFieldState>,
  fields?: Record<string, any>
): any
```

**Parameters:**
- `states` - Form field states from PrimeVue Form's submit event
- `fields` - (Optional) Field definitions for type-aware casting

```javascript
import { getPayload } from "buildkit-primevue";

const onSubmit = ({ valid, states }) => {
  if (valid) {
    const payload = getPayload(states, fields);
    await axios.post("/api/submit", payload);
  }
};
```

### `clear(data, fields)`

Reset all field values to their type-appropriate defaults.

```typescript
function clear(data: any, fields: any): void
```

**Resets to:**
- Strings → `""`
- Numbers → `null`
- Booleans → `false`
- Arrays → `[]`
- Objects → `null`

```javascript
import { clear } from "buildkit-primevue";

clear(form.value, fields);
```

### `setDynamicFields(columns)`

Convert backend column configuration to field definitions.

```typescript
function setDynamicFields(columns: any[]): any
```

```javascript
import { setDynamicFields } from "buildkit-primevue";

const columns = [
  {
    key: "status",
    extra_data: {
      status: {
        label: "Status",
        as: "Select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
        colSpan: { mobile: 1, tablet: 2, desktop: 3 },
      },
    },
  },
];

const fields = setDynamicFields(columns);
// Result: { status: { label: "Status", as: "Select", ... } }
```

### `equals(left, right)`

Visibility condition helper for strict equality with type coercion.

```typescript
function equals(left: any, right: any): boolean
```

- Casts `right` to match `left`'s type before comparing
- Array-aware: checks array inclusion

### `includesMatch(left, right)`

Visibility condition helper for substring/inclusion matching.

```typescript
function includesMatch(left: any, right: any | any[]): boolean
```

- String: case-insensitive substring match
- Array: checks if array includes the value

---

## Locale Support

The library supports Japanese (`"ja"`) and English (`"en"`) for validation messages.

```javascript
const formArgs = reactive<FormKitProps>({
  fields: fields,
  locale: "en", // or "ja" (default)
});
```

### Sample Error Messages

| Rule       | Japanese                                         | English                                |
| ---------- | ------------------------------------------------ | -------------------------------------- |
| `required` | 必須項目です                                       | This field is required                 |
| `email`    | 有効なメールアドレスを入力してください                  | Please enter a valid email address     |
| `min:5`    | 最低5文字で入力してください                          | Minimum 5 characters required          |
| `max:100`  | 最大100文字で入力してください                         | Maximum 100 characters allowed         |
| `katakana` | カタカナと空白のみで入力してください                    | Only katakana and spaces are allowed   |

---

## Complete Examples

### Contact Form

```javascript
const fields = {
  name: {
    label: "Full Name",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    schema: "required|max:50",
    placeholder: "Enter your full name",
  },
  email: {
    label: "Email Address",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    schema: "required|email",
    placeholder: "you@example.com",
  },
  phone: {
    label: "Phone Number",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    // `required` is what activates the other rules — without it `number` and
    // `length:10` are ignored. See "Validation Behavior" above.
    schema: "required|number|length:10",
    placeholder: "0901234567",
  },
  category: {
    label: "Category",
    as: "Select",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    schema: "required",
    options: [
      { label: "General Inquiry", value: "general" },
      { label: "Support", value: "support" },
      { label: "Feedback", value: "feedback" },
    ],
  },
  priority: {
    label: "Priority",
    as: "RadioButton",
    defaultValue: "normal",
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    options: [
      { label: "Low", value: "low" },
      { label: "Normal", value: "normal" },
      { label: "High", value: "high" },
    ],
  },
  message: {
    label: "Message",
    as: "Textarea",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    schema: "required|min:10|max:500",
    rows: 5,
  },
  subscribe: {
    label: "Subscribe to newsletter",
    as: "Checkbox",
    defaultValue: false,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
  },
};
```

### Form with Conditional Fields

```javascript
const fields = {
  contact_method: {
    label: "Preferred Contact Method",
    as: "Select",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    schema: "required",
    options: [
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Mail", value: "mail" },
    ],
  },
  // Only visible when contact_method is "email"
  email_address: {
    label: "Email Address",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    schema: "required|email",
    showWhen: { field: "contact_method", equals: "email" },
  },
  // Only visible when contact_method is "phone"
  phone_number: {
    label: "Phone Number",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    schema: "required|number",
    showWhen: { field: "contact_method", equals: "phone" },
  },
  // Only visible when contact_method is "mail"
  address: {
    label: "Mailing Address",
    as: "Textarea",
    defaultValue: "",
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    schema: "required|max:200",
    showWhen: { field: "contact_method", equals: "mail" },
  },
  // Visible when contact_method is "email" OR "phone"
  preferred_time: {
    label: "Preferred Contact Time",
    as: "DatePicker",
    defaultValue: null,
    colSpan: { mobile: 1, tablet: 2, desktop: 3 },
    showWhen: [
      { field: "contact_method", equals: "email" },
      { field: "contact_method", equals: "phone" },
    ],
    showIcon: true,
  },
};
```

### Full Component Integration

```vue
<template>
  <FormKit v-bind="formArgs" v-model="form" @submit="onSubmit" />
  <button @click="resetForm">Reset</button>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import FormKit from "buildkit-primevue";
import {
  getPayload,
  setFields,
  clear,
} from "buildkit-primevue";
import type { FormKitProps } from "buildkit-primevue";
import "buildkit-primevue/styles.css";
import axios from "axios";

const form = ref<Record<string, any>>({});

const fields = {
  // ... field definitions
};

const formArgs = reactive<FormKitProps>({
  fields: fields,
  size: "small",
  locale: "en",
});

// Load existing data from API
const loadData = async () => {
  const { data } = await axios.get("/api/item/123");
  setFields(data, fields);
};

// Submit form
const onSubmit = async ({ valid, states }: any) => {
  if (!valid) return;
  const payload = getPayload(states, fields);
  await axios.post("/api/item", payload);
};

// Reset form
const resetForm = () => {
  clear(form.value, fields);
};

loadData();
</script>
```

---

## Component Architecture

```
FormKit.vue (container - wraps @primevue/forms Form)
  ├─ FormKitField.vue (per-field wrapper with label/error display)
  │    └─ FormKitControl.vue (dynamic renderer using :is="component")
  │         └─ PrimeVue component (InputText, Select, DatePicker, etc.)
  └─ FormKitSeparator.vue (as: "Separator" — bypasses FormField entirely)
       └─ PrimeVue Divider
```

- `FormKit` manages the form state, visibility computation, and grid layout
- `FormKitField` renders the label, field wrapper, and error messages
- `FormKitControl` dynamically resolves and renders PrimeVue components, filtering out library-specific props before passing through to PrimeVue
- `FormKitSeparator` renders a rule for layout-only fields. It is branched to *before* `FormKitField`, which is what keeps separators out of the form state

---

## CSS Classes

Custom styles use a `bk-` prefix:

| Class                       | Element                                            |
| --------------------------- | -------------------------------------------------- |
| `.bk-form`                  | Form container (flex-wrap grid)                    |
| `.bk-form-field-wrapper`    | Per-field wrapper that carries the `colSpan` width  |
| `.bk-field`                 | Individual field wrapper                            |
| `.bk-label`                 | Field label (`.bk-text-error` span for the `*`)     |
| `.bk-form-footer`           | Footer slot area                                    |
| `.bk-separator`             | Separator root (the PrimeVue `Divider`)             |
| `.bk-separator-label`       | Separator title text                                |
| `.bk-group` / `.bk-group--wrap` | CheckboxGroup / RadioButton container           |
| `.bk-group-label`           | One option inside a checkbox group                  |
| `.bk-radio-label`           | One option inside a radio group                     |
| `.bk-button-option`         | Radio option with `buttonType: true`                |
| `.bk-button-option--active` / `--inactive` | Selected state of a `buttonType` option |
| `.bk-text-error` / `.bk-text-muted` | Error and help text                         |

The library leverages PrimeVue CSS variables for theming. Import `buildkit-primevue/styles.css` for base styles.

---

## Playground

`playground/` is a standalone consumer app that imports the library **the way an
installed app does** — through `node_modules/buildkit-primevue` and the package
`exports` map, never from `src/`. Use it to confirm a change survives packaging, not
just unit tests.

```bash
npm run playground:install   # build the lib, then install playground deps (links via file:..)
npm run playground           # build the lib, then start the playground on :3100
npm run playground:verify    # build the lib, then run the install check
npm run verify               # unit tests + install check + consumer build — the full gate
```

### What each check covers

| Command                 | Catches                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `npm test`              | Behaviour, against `src/` — fast, but blind to packaging                    |
| `npm run playground:verify` | `exports` subpaths pointing at files the build never emits, entries missing from `files`, subpaths Node cannot resolve, files absent from `npm pack` |
| `npm run playground:build`  | Whether the **published type declarations** actually typecheck in a consumer, and whether the built bundle resolves |

### Demos

Each entry in the sidebar is one field-schema scenario, with the live submit payload,
`getPayload()` output and field definitions shown next to the form:

`Separator` · `Text inputs` · `Selection controls` · `Numbers & dates` ·
`Validation` · `Conditional visibility` · `Responsive grid` · `Zipcode & Editor` ·
`setDynamicFields` · `Kitchen sink`

Demos live in `playground/src/demos/`. To add one, export a `Demo` object and register
it in `playground/src/demos/index.ts`.

> The playground reads the **built** library, so after changing `src/` run
> `npm run build` (or just use `npm run playground`, which builds first) to see the
> change.