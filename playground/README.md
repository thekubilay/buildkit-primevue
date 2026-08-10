# buildkit-primevue playground

A standalone consumer app that imports the library **exactly the way an installed app
does** — through `node_modules/buildkit-primevue` and the package `exports` map, never
from `../src`.

That distinction is the whole point. `npm test` runs against `src/`, so it cannot see
packaging problems: a missing `exports` target, a stale `types/index.d.ts`, a file left
out of the `files` allowlist. This app can.

## Running it

From the **repo root**:

```bash
npm run playground:install   # build the lib, then install playground deps
npm run playground           # build the lib, then start dev server on :3100
```

The library is linked with `"buildkit-primevue": "file:.."`, so `playground/node_modules/buildkit-primevue`
is a symlink to the repo. It still resolves through `dist/` and the `exports` map — you
just don't need to reinstall after every change, only rebuild:

```bash
npm run build      # at the repo root, then reload the browser
```

`vite.config.ts` dedupes `vue`, `primevue`, `zod` and friends. Without that, the
symlinked library would resolve its externalised imports against the **root**
`node_modules` and load a second copy of Vue.

## Checks

```bash
npm run playground:verify   # package/install check (scripts/verify-install.mjs)
npm run playground:build    # vue-tsc + vite build against the published types
npm run verify              # unit tests + both of the above — the full gate
```

`scripts/verify-install.mjs` asserts that:

1. every `exports` subpath points at a file that exists,
2. every one of those files is covered by the `files` allowlist,
3. Node itself resolves each subpath from a consumer's position,
4. `npm pack` really includes them.

## Demos

| Demo                     | Covers                                                        |
| ------------------------ | ------------------------------------------------------------- |
| Separator                | `as: "Separator"`, align/type variants, exclusion from payload |
| Text inputs              | InputText / Textarea / Password, icon fields, pass-through props |
| Selection controls       | Select, MultiSelect, RadioButton, CheckboxGroup, Checkbox, ToggleSwitch |
| Numbers & dates          | InputNumber, Slider, DatePicker (including clear-in-edit-mode) |
| Validation               | Every schema-string rule, in both locales                     |
| Conditional visibility   | `showWhen` / `hideWhen`, `includes`, nested `and`/`or`        |
| Responsive grid          | `colSpan` at all six widths across the 512/724px breakpoints  |
| Zipcode & Editor         | The zipcode lookup and the Quill editor                       |
| setDynamicFields         | Backend column config → field map                             |
| Kitchen sink             | A realistic form combining all of the above                   |

Each demo shows the form next to the live submit result, the `getPayload()` output, and
the field definitions driving it.

Adding one: export a `Demo` from `src/demos/` and register it in `src/demos/index.ts`.
`fields()` must return a **fresh** object on every call — FormKit writes into
`defaultValue`.
