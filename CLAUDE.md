# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

buildkit-primevue is a Vue 3 form component library that wraps PrimeVue v4 components with a declarative, type-safe configuration API. It provides a single `<FormKit>` component driven by a field schema array, with built-in Zod validation, conditional visibility, responsive grid layout, and form utilities. The library targets Japanese-language applications (validation messages are in Japanese).

## Commands

- **Dev server:** `npm run dev` (Vite on port 3000)
- **Build:** `npm run build` (tsc + Vite library build → `dist/`)
- **Run all tests:** `npm test` (Vitest, one-shot)
- **Test UI:** `npm run test:ui` (Vitest interactive UI)
- **Run a single test file:** `npx vitest run tests/formkit.visibility.test.ts`
- **Run tests matching a pattern:** `npx vitest run -t "pattern"`

## Architecture

### Component Hierarchy

```
FormKit.vue (container — wraps @primevue/forms Form)
  └─ FormKitField.vue (per-field wrapper with label/error)
       └─ FormKitControl.vue (dynamic renderer using :is="component")
            └─ PrimeVue component (InputText, Select, DatePicker, etc.)
```

`FormKitControl` dynamically resolves and renders PrimeVue components based on the `as` prop in each field definition. Library-specific props are filtered out before pass-through to PrimeVue.

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

### Styling

Custom CSS in `src/components/styles.css` uses a `bk-` prefix (e.g., `.bk-form`, `.bk-field`). Leverages PrimeVue CSS variables for theming. No Tailwind dependency at runtime despite the package description.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:
- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:
- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED
WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:
- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)
Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)
If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)
Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `ctx_stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |
