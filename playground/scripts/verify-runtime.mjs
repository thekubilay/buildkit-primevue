#!/usr/bin/env node
/**
 * Consumer-side RUNTIME check against a REAL tarball install.
 *
 * `npm test` renders against src/ with PrimeVue stubbed out in vitest.setup.ts, so it
 * can only prove the library behaves against mocks we wrote ourselves. This script
 * closes that gap end to end:
 *
 *   1. `npm pack` the repo, exactly as `npm publish` would
 *   2. extract the tarball into a throwaway consumer's node_modules — a REAL directory,
 *      not the `file:..` symlink the playground dev loop uses
 *   3. link the peer dependencies in from playground/node_modules
 *   4. re-exec this file from inside that consumer and mount the built bundle against
 *      the real PrimeVue components in jsdom
 *
 * Step 2 matters: with the `file:..` symlink, Node resolves the library to its realpath
 * (the repo root) and its `import "vue"` then finds the ROOT node_modules — a second Vue
 * instance that crashes on mount. Vite's `resolve.dedupe` papers over that in the
 * browser; a published install has no symlink and no dedupe, so testing the tarball is
 * the only way to see what a consumer actually gets.
 *
 * Exit code is non-zero on any failed assertion.
 */

import {execFileSync} from 'node:child_process'
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync,
  statSync, symlinkSync,
} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {fileURLToPath} from 'node:url'

const selfPath = fileURLToPath(import.meta.url)

/* ================================================================== *
 * PHASE 1 — build the throwaway consumer, then re-exec inside it
 * ================================================================== */

if (!process.env.BK_RUNTIME_CHILD) {
  const playgroundDir = resolve(dirname(selfPath), '..')
  const repoRoot = resolve(playgroundDir, '..')
  const playgroundModules = join(playgroundDir, 'node_modules')

  const tmpRoot = mkdtempSync(join(tmpdir(), 'bk-install-'))
  const consumerDir = join(tmpRoot, 'consumer')
  const consumerModules = join(consumerDir, 'node_modules')

  try {
    // 0. refuse to certify a stale bundle. `npm pack` does not build, so running this
    // script directly after editing src/ would otherwise test the PREVIOUS dist and
    // report a pass for code that is not in it.
    const newestMtime = (dir) => {
      let newest = 0
      for (const entry of readdirSync(dir, {withFileTypes: true})) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        const full = join(dir, entry.name)
        const s = statSync(full)
        newest = Math.max(newest, entry.isDirectory() ? newestMtime(full) : s.mtimeMs)
      }
      return newest
    }
    const distDir = join(repoRoot, 'dist')
    if (!existsSync(distDir)) {
      throw new Error('dist/ is missing — run `npm run build` at the repo root first')
    }
    const srcNewest = newestMtime(join(repoRoot, 'src'))
    const distNewest = newestMtime(distDir)
    if (srcNewest > distNewest) {
      throw new Error('dist/ is older than src/ — run `npm run build` first, this check only ever sees the built bundle')
    }

    mkdirSync(consumerModules, {recursive: true})

    // 1. pack
    const packOut = execFileSync(
      'npm', ['pack', '--json', '--pack-destination', tmpRoot],
      {cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']},
    )
    const filename = JSON.parse(packOut)[0]?.filename
    if (!filename) throw new Error('npm pack produced no tarball')
    console.log(`  packed ${filename}`)

    // 2. extract — the tarball root is always ./package
    execFileSync('tar', ['-xzf', join(tmpRoot, filename), '-C', tmpRoot], {stdio: 'inherit'})
    renameSync(join(tmpRoot, 'package'), join(consumerModules, 'buildkit-primevue'))

    // 3. link peers in from the playground's install
    let linked = 0
    for (const entry of readdirSync(playgroundModules)) {
      if (entry === 'buildkit-primevue' || entry.startsWith('.')) continue
      if (entry.startsWith('@')) {
        mkdirSync(join(consumerModules, entry), {recursive: true})
        for (const sub of readdirSync(join(playgroundModules, entry))) {
          symlinkSync(join(playgroundModules, entry, sub), join(consumerModules, entry, sub), 'dir')
          linked++
        }
      } else {
        symlinkSync(join(playgroundModules, entry), join(consumerModules, entry), 'dir')
        linked++
      }
    }
    console.log(`  linked ${linked} peer packages into a throwaway consumer`)

    // 4. re-exec from inside the consumer so every bare specifier resolves there
    copyFileSync(selfPath, join(consumerDir, 'run.mjs'))
    execFileSync(process.execPath, [join(consumerDir, 'run.mjs')], {
      stdio: 'inherit',
      env: {...process.env, BK_RUNTIME_CHILD: '1'},
    })
  } catch (e) {
    if (typeof e?.status === 'number') process.exitCode = e.status
    else {
      console.error(`\n  \x1b[31m✗\x1b[0m runtime check could not run: ${e.message}\n`)
      process.exitCode = 1
    }
  } finally {
    rmSync(tmpRoot, {recursive: true, force: true})
  }

  process.exit(process.exitCode ?? 0)
}

/* ================================================================== *
 * PHASE 2 — running inside the throwaway consumer
 * ================================================================== */

const {JSDOM} = await import('jsdom')

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

globalThis.window = dom.window
globalThis.document = dom.window.document
// Node >=21 ships a getter-only `navigator`, so plain assignment throws.
Object.defineProperty(globalThis, 'navigator', {value: dom.window.navigator, configurable: true, writable: true})
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame ?? ((cb) => setTimeout(cb, 0))
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame ?? clearTimeout
globalThis.ResizeObserver = dom.window.ResizeObserver ?? class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// jsdom does not implement matchMedia; every real browser does. PrimeVue's Select calls
// it from its own mounted hook (primevue/select bindMatchMediaOrientationListener), so
// without this the harness would report a jsdom gap as a library error.
if (typeof dom.window.matchMedia !== 'function') {
  const stub = () => ({
    matches: false, media: '', onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })
  dom.window.matchMedia = stub
  globalThis.matchMedia = stub
}

// Vue's runtime-dom and PrimeVue reach for assorted DOM constructors (SVGElement,
// MathMLElement, Event, ...). Rather than guess which, copy every global jsdom defines
// that Node does not already provide.
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key in globalThis) continue
  try {
    Object.defineProperty(globalThis, key, {value: dom.window[key], configurable: true, writable: true})
  } catch {
    // read-only window properties are not needed here
  }
}

const {createApp, h, nextTick} = await import('vue')
const {default: PrimeVue} = await import('primevue/config')
const Aura = (await import('@primeuix/themes/aura')).default

// The whole point: the package root, resolved through "exports" -> dist/index.mjs,
// out of a directory that was produced by `npm pack`.
const lib = await import('buildkit-primevue')
const {FormKit, getPayload, isSeparatorField} = lib

const failures = []
const passes = []
const check = (label, condition, detail = '') => {
  if (condition) passes.push(label)
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
}

// Vue logs component errors instead of throwing them out of mount(), so they would
// otherwise pass silently.
const vueErrors = []

async function mountForm(fields, onSubmit) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const app = createApp({
    render() {
      return h(FormKit, {fields, size: 'small', locale: 'en', onSubmit})
    },
  })
  app.config.errorHandler = (err) => vueErrors.push(
    process.env.BK_RUNTIME_DEBUG ? (err?.stack ?? String(err)) : (err?.message ?? String(err)),
  )
  app.config.warnHandler = (msg) => vueErrors.push(`warn: ${msg}`)
  app.use(PrimeVue, {theme: {preset: Aura}})
  app.mount(host)

  await nextTick()
  await new Promise(r => setTimeout(r, 0))
  await nextTick()

  return {host, app}
}

/* ---- 1. exports survive packing ---- */

check('single Vue instance in the consumer', true) // proven by mount() succeeding below
check('package root exports FormKit', FormKit != null)
check('package root exports getPayload', typeof getPayload === 'function')
check('package root exports isSeparatorField', typeof isSeparatorField === 'function')
check('package root exports FormKitSeparator', lib.FormKitSeparator != null)
check('package root exports FormKitField/Control/Label',
  lib.FormKitField != null && lib.FormKitControl != null && lib.FormKitLabel != null)
check('package root exports setFields/clear/setDynamicFields',
  typeof lib.setFields === 'function' && typeof lib.clear === 'function' && typeof lib.setDynamicFields === 'function')
check('package root exports equals/includesMatch',
  typeof lib.equals === 'function' && typeof lib.includesMatch === 'function')
check('SEPARATOR_TYPES is ["Separator"]', JSON.stringify(lib.SEPARATOR_TYPES) === '["Separator"]',
  `got ${JSON.stringify(lib.SEPARATOR_TYPES)}`)
check('isSeparatorField does not claim "Divider"', lib.isSeparatorField({as: 'Divider'}) === false)

/* ---- 2. a labelled separator renders through the REAL PrimeVue Divider ---- */

{
  const {host} = await mountForm({
    sep_titled: {as: 'Separator', label: 'Section title', align: 'left', type: 'dashed'},
    name: {inputId: 'rt_name', label: 'Name', defaultValue: ''},
  })

  const divider = host.querySelector('[role="separator"]')
  check('labelled separator renders a real Divider root', !!divider,
    `html was: ${host.innerHTML.slice(0, 300)}`)

  if (divider) {
    // PrimeVue's Divider encodes align/layout/type into data-p, so asserting on it
    // proves the props reached the real component rather than only our wrapper.
    const dataP = divider.getAttribute('data-p') ?? ''
    check('align reaches the real Divider', dataP.includes('left'), `data-p="${dataP}"`)
    check('type reaches the real Divider', dataP.includes('dashed'), `data-p="${dataP}"`)
    check('layout defaults to horizontal', dataP.includes('horizontal'), `data-p="${dataP}"`)
    check('bk-separator class survives onto the Divider root',
      divider.classList.contains('bk-separator'), `class="${divider.getAttribute('class')}"`)
  }

  const label = host.querySelector('.bk-separator-label')
  check('separator label text renders', label?.textContent === 'Section title',
    `got ${JSON.stringify(label?.textContent)}`)
  check('labelled separator HAS a content wrapper',
    divider ? divider.children.length === 1 : false,
    divider ? `children: ${divider.children.length}` : 'no divider')
  // Asserted by `name`, not by `#rt_name`: FormKitControl only applies `inputId` as the
  // DOM id when the field definition carries an explicit `as` key, so a field relying on
  // the default InputText renders without one. See the id-association check below.
  check('the sibling input still renders',
    !!host.querySelector('input[name="name"]'),
    `inputs found: ${host.querySelectorAll('input').length}`)
}

/* ---- 3. the regression unit tests could only check against a mock ---- *
 * A `v-if` inside the slot still counts as "slot present" in Vue, which made the real
 * Divider draw an empty content box and cut a gap into an otherwise solid rule.        */

{
  const {host} = await mountForm({
    sep_bare: {as: 'Separator'},
    name: {inputId: 'rt_name2', label: 'Name', defaultValue: ''},
  })
  const divider = host.querySelector('[role="separator"]')
  check('unlabelled separator renders a real Divider root', !!divider)
  check('unlabelled separator has NO content wrapper (unbroken rule)',
    divider ? divider.children.length === 0 : false,
    divider ? `innerHTML: ${divider.innerHTML}` : 'no divider')
  check('unlabelled separator renders no label span',
    host.querySelector('.bk-separator-label') === null)
}

{
  const {host} = await mountForm({sep_ws: {as: 'Separator', label: '   '}})
  const divider = host.querySelector('[role="separator"]')
  check('whitespace-only label produces no content wrapper',
    divider ? divider.children.length === 0 : false,
    divider ? `innerHTML: ${divider.innerHTML}` : 'no divider')
}

/* ---- 4. defaults, when nothing is specified ---- */

{
  const {host} = await mountForm({sep_def: {as: 'Separator', label: 'Default'}})
  const dataP = host.querySelector('[role="separator"]')?.getAttribute('data-p') ?? ''
  check('align defaults to center', dataP.includes('center'), `data-p="${dataP}"`)
  check('type defaults to solid', dataP.includes('solid'), `data-p="${dataP}"`)
}

/* ---- 5. separators stay out of the form state end to end ---- */

{
  let submitted = null
  const fields = {
    sep: {as: 'Separator', label: 'Section'},
    name: {inputId: 'rt_name3', label: 'Name', defaultValue: 'taro'},
    email: {inputId: 'rt_email', label: 'Email', defaultValue: 'a@b.c'},
  }
  const {host} = await mountForm(fields, (e) => {
    submitted = e
  })

  const form = host.querySelector('form')
  check('a <form> element is rendered', !!form)
  if (form) {
    form.dispatchEvent(new dom.window.Event('submit', {bubbles: true, cancelable: true}))
    await nextTick()
    await new Promise(r => setTimeout(r, 30))
  }

  check('submit event fired', submitted !== null)
  if (submitted) {
    const keys = Object.keys(submitted.states ?? {}).sort()
    check('separator absent from submitted states', !keys.includes('sep'), `states: ${keys.join(', ')}`)
    check('inputs present in submitted states',
      keys.includes('name') && keys.includes('email'), `states: ${keys.join(', ')}`)

    const payload = getPayload(submitted.states ?? {}, fields)
    check('separator absent from getPayload output', !('sep' in payload),
      `payload keys: ${Object.keys(payload).join(', ')}`)
    check('getPayload returns the input values',
      payload.name === 'taro' && payload.email === 'a@b.c', JSON.stringify(payload))
  }
}

/* ---- 6. a form of ONLY separators must not crash ---- */

{
  let threw = null
  try {
    const {host} = await mountForm({a: {as: 'Separator', label: 'One'}, b: {as: 'Separator'}})
    check('separator-only form renders both rules',
      host.querySelectorAll('[role="separator"]').length === 2,
      `found ${host.querySelectorAll('[role="separator"]').length}`)
    check('separator-only form renders no inputs',
      host.querySelectorAll('input').length === 0,
      `found ${host.querySelectorAll('input').length}`)
  } catch (e) {
    threw = e
  }
  check('separator-only form does not throw', threw === null, threw?.message)
}

/* ---- 7. visibility applies to separators ---- */

{
  const {host} = await mountForm({
    toggle: {inputId: 'rt_toggle', label: 'Toggle', as: 'Checkbox', binary: true, defaultValue: true},
    sep_hidden: {as: 'Separator', label: 'Hidden section', hideWhen: {field: 'toggle', equals: true}},
    sep_shown: {as: 'Separator', label: 'Shown section', showWhen: {field: 'toggle', equals: true}},
  })
  const labels = [...host.querySelectorAll('.bk-separator-label')].map(n => n.textContent)
  check('hideWhen removes the separator from the DOM', !labels.includes('Hidden section'),
    `rendered: ${JSON.stringify(labels)}`)
  check('showWhen keeps the matching separator', labels.includes('Shown section'),
    `rendered: ${JSON.stringify(labels)}`)
}

/* ---- 8. ordinary controls still render, so the guards broke nothing ---- */

{
  const {host} = await mountForm({
    text: {inputId: 'rt_text', label: 'Text', defaultValue: ''},
    sep: {as: 'Separator', label: 'Mid'},
    num: {inputId: 'rt_num', label: 'Number', as: 'InputNumber', defaultValue: null},
    sel: {
      inputId: 'rt_sel', label: 'Select', as: 'Select', defaultValue: null,
      options: [{label: 'A', value: 'a'}], optionLabel: 'label', optionValue: 'value',
    },
    area: {inputId: 'rt_area', label: 'Area', as: 'Textarea', defaultValue: ''},
    chk: {inputId: 'rt_chk', label: 'Check', as: 'Checkbox', binary: true, defaultValue: false},
    multi: {
      inputId: 'rt_multi', label: 'Multi', as: 'MultiSelect', defaultValue: [],
      options: [{label: 'A', value: 'a'}], optionLabel: 'label', optionValue: 'value',
    },
    date: {inputId: 'rt_date', label: 'Date', as: 'DatePicker', defaultValue: null},
    pwd: {inputId: 'rt_pwd', label: 'Password', as: 'Password', feedback: false, defaultValue: ''},
    toggle: {inputId: 'rt_toggle2', label: 'Toggle', as: 'ToggleSwitch', defaultValue: false},
    // Controls whose id cannot reach a focusable element: PrimeVue puts it on the outer
    // wrapper and the real control is an inner span/contenteditable with no id of ours.
    slider: {inputId: 'rt_slider', label: 'Slider', as: 'Slider', defaultValue: 10},
    // Grouped inputs render one control per option, each with its own id — the field-level
    // inputId belongs to no single element.
    group: {
      inputId: 'rt_group', label: 'Group', as: 'CheckboxGroup', defaultValue: [],
      options: [{label: 'A', value: 'a'}, {label: 'B', value: 'b'}],
    },
    radios: {
      inputId: 'rt_radios', label: 'Radios', as: 'RadioButton', defaultValue: null,
      options: [{label: 'A', value: 'a'}],
    },
  })
  if (process.env.BK_RUNTIME_DEBUG) {
    console.log('--- DEBUG: form controls ---')
    for (const el of host.querySelectorAll('input, textarea, select, [id]')) {
      console.log(el.tagName, 'id=' + JSON.stringify(el.getAttribute('id')),
        'name=' + JSON.stringify(el.getAttribute('name')),
        'class=' + JSON.stringify((el.getAttribute('class') ?? '').slice(0, 60)))
    }
    console.log('--- DEBUG: vueErrors ---', JSON.stringify(vueErrors, null, 1))
  }

  check('mixed form still renders every non-separator control',
    !!host.querySelector('#rt_text') && !!host.querySelector('#rt_area')
    && !!host.querySelector('#rt_num') && !!host.querySelector('#rt_sel')
    && !!host.querySelector('#rt_chk'),
    `html length ${host.innerHTML.length}`)

  // `inputId` must reach the control whether or not the field declared an `as`. It used
  // to be assigned only inside FormKitControl's `k === "as"` branch, so a field relying
  // on the default InputText rendered without an id and its <label for> dangled.
  check('inputId reaches a field that declares no `as`',
    !!host.querySelector('#rt_text'),
    `ids present: ${[...host.querySelectorAll('[id]')].map(e => e.id).join(', ')}`)

  // Existence alone is not enough: PrimeVue components that wrap their control (Select,
  // MultiSelect, DatePicker, InputNumber, …) would happily take a plain `id` on the
  // OUTER div, leaving the label pointing at something the user cannot focus. Assert the
  // id sits on an element a label can actually activate.
  const FOCUSABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])
  const isFocusable = (el) =>
    !!el && (FOCUSABLE.has(el.tagName)
      || el.hasAttribute('tabindex')
      || ['combobox', 'listbox', 'textbox', 'checkbox', 'radio', 'spinbutton'].includes(el.getAttribute('role') ?? ''))

  const labelFors = [...host.querySelectorAll('label.bk-label')]
    .map(l => l.getAttribute('for'))
    .filter(Boolean)
  const dangling = labelFors.filter(id => !host.querySelector(`#${id}`))
  check('every label points at a control that exists',
    labelFors.length > 0 && dangling.length === 0,
    `fors: ${JSON.stringify(labelFors)} dangling: ${JSON.stringify(dangling)}`)

  const notFocusable = labelFors.filter(id => !isFocusable(host.querySelector(`#${id}`)))
  check('every label points at a FOCUSABLE control, not a wrapper',
    notFocusable.length === 0,
    notFocusable.map(id => {
      const el = host.querySelector(`#${id}`)
      return `${el ? `${id}=<${el.tagName.toLowerCase()} role="${el.getAttribute('role') ?? ''}">` : `${id}=<missing>`}`
    }).join(', '))

  // Controls whose id cannot reach a focusable element must carry no `for` at all rather
  // than a dangling or wrapper-pointing one.
  const labelTextToFor = new Map(
    [...host.querySelectorAll('label.bk-label')].map(l => [l.textContent?.trim() ?? '', l.getAttribute('for')]),
  )
  for (const text of ['Slider', 'Group', 'Radios']) {
    check(`the ${text} label omits \`for\` instead of dangling`,
      labelTextToFor.get(text) === null,
      `for="${labelTextToFor.get(text)}"`)
  }
  check('grouped options still label their own inputs',
    [...host.querySelectorAll('label.bk-group-label')].every(l => {
      const target = l.getAttribute('for')
      return !!target && isFocusable(host.querySelector(`#${target}`))
    }),
    `group labels: ${host.querySelectorAll('label.bk-group-label').length}`)

  check('`as` is never forwarded to the control as a DOM attribute',
    host.querySelector('#rt_text')?.getAttribute('as') === null
    && host.querySelector('#rt_area')?.getAttribute('as') === null)
  check('mixed form renders exactly one separator',
    host.querySelectorAll('[role="separator"]').length === 1,
    `found ${host.querySelectorAll('[role="separator"]').length}`)
  check('mixed form renders labels for the inputs',
    host.querySelectorAll('.bk-label').length >= 9,
    `found ${host.querySelectorAll('.bk-label').length}`)
  check('no id is rendered twice',
    (() => {
      const ids = [...host.querySelectorAll('[id]')].map(e => e.id)
      return new Set(ids).size === ids.length
    })(),
    `ids: ${[...host.querySelectorAll('[id]')].map(e => e.id).join(', ')}`)
}

/* ---- 9. a missing required value reads as "required", not a type mismatch ---- *
 * Zod 4 dropped `issue.received`, which left the error map's missing-value branch dead.
 * Verified here against the packed bundle so a build that loses the fix fails loudly.   */

{
  let submitted = null
  const {host} = await mountForm({
    tags: {inputId: 'rt_tags', label: 'Tags', as: 'MultiSelect', options: [], schema: 'required', defaultValue: ''},
    name: {inputId: 'rt_req_name', label: 'Name', schema: 'required', defaultValue: ''},
  }, (e) => {
    submitted = e
  })

  const form = host.querySelector('form')
  if (form) {
    form.dispatchEvent(new dom.window.Event('submit', {bubbles: true, cancelable: true}))
    await nextTick()
    await new Promise(r => setTimeout(r, 30))
  }

  const texts = [...host.querySelectorAll('.bk-text-error')].map(n => n.textContent?.trim()).filter(Boolean)
  check('an empty required form reports errors', submitted?.valid === false, `valid: ${submitted?.valid}`)
  check('no error message says a type is expected',
    !texts.some(t => t.includes('必要です')), `messages: ${JSON.stringify(texts)}`)
  check('no raw Zod English leaks into the UI',
    !texts.some(t => /Invalid input|expected|received/i.test(t)), `messages: ${JSON.stringify(texts)}`)
}

/* ---- 10. nothing was logged as a Vue error or warning ---- */

check('no Vue errors or warnings during any mount', vueErrors.length === 0,
  vueErrors.slice(0, 3).join(' | '))

/* ---------------------------------------------------------------- */

console.log('\n  buildkit-primevue runtime check (packed tarball + real PrimeVue + jsdom)\n')
for (const p of passes) console.log(`  \x1b[32m✓\x1b[0m ${p}`)
for (const f of failures) console.log(`  \x1b[31m✗\x1b[0m ${f}`)
console.log(`\n  ${passes.length} passed, ${failures.length} failed\n`)

process.exit(failures.length > 0 ? 1 : 0)
