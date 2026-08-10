#!/usr/bin/env node
/**
 * Consumer-side install check.
 *
 * Everything here is about what an app gets AFTER `npm install buildkit-primevue`,
 * which is a different surface from `npm test` (that runs against src/):
 *
 *   1. every "exports" subpath resolves to a file that actually exists in dist/types
 *   2. every one of those files is inside the "files" allowlist, i.e. it really ships
 *   3. the package Node itself resolves for each subpath matches (1)
 *
 * Exit code is non-zero when anything fails, so it drops straight into CI.
 */

import {createRequire} from 'node:module'
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const playgroundDir = resolve(here, '..')
const repoRoot = resolve(playgroundDir, '..')

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))

const failures = []
const warnings = []
const passes = []

const fail = (msg) => failures.push(msg)
const warn = (msg) => warnings.push(msg)
const pass = (msg) => passes.push(msg)

/* ------------------------------------------------------------------ *
 * 1 + 2. exports map targets exist and are covered by "files"
 * ------------------------------------------------------------------ */

// A path is shipped when it sits under one of the "files" entries.
const filesAllowlist = (pkg.files ?? []).map(f => f.replace(/^\.\//, '').replace(/\/$/, ''))
const isShipped = (relPath) => filesAllowlist.some(
  entry => relPath === entry || relPath.startsWith(`${entry}/`),
)

const collectTargets = (subpath, value, acc = []) => {
  if (typeof value === 'string') {
    acc.push({subpath, target: value})
  } else if (value && typeof value === 'object') {
    for (const [condition, nested] of Object.entries(value)) {
      collectTargets(`${subpath} [${condition}]`, nested, acc)
    }
  }
  return acc
}

const targets = Object.entries(pkg.exports ?? {}).flatMap(
  ([subpath, value]) => collectTargets(subpath, value),
)

if (targets.length === 0) fail('package.json has no "exports" map to verify')

for (const {subpath, target} of targets) {
  const relPath = target.replace(/^\.\//, '')
  const absPath = join(repoRoot, relPath)

  if (!existsSync(absPath)) {
    fail(`exports "${subpath}" -> ${target} does not exist (run \`npm run build\` at the repo root first)`)
    continue
  }
  if (!isShipped(relPath)) {
    fail(`exports "${subpath}" -> ${target} exists but is not covered by package.json "files" (${filesAllowlist.join(', ')}) — it would be missing from the published tarball`)
    continue
  }
  pass(`exports "${subpath}" -> ${target}`)
}

for (const key of ['main', 'module', 'types']) {
  const value = pkg[key]
  if (!value) {
    warn(`package.json has no "${key}" field`)
    continue
  }
  const relPath = value.replace(/^\.\//, '')
  if (!existsSync(join(repoRoot, relPath))) fail(`"${key}" -> ${value} does not exist`)
  else if (!isShipped(relPath)) fail(`"${key}" -> ${value} is not covered by "files"`)
  else pass(`"${key}" -> ${value}`)
}

/* ------------------------------------------------------------------ *
 * 3. Node resolves each subpath the same way
 * ------------------------------------------------------------------ */

const require = createRequire(join(playgroundDir, 'noop.js'))
let installedRoot = null

try {
  // The "exports" map does not expose ./package.json, so Node's resolver refuses
  // `buildkit-primevue/package.json`. Read it off disk through the symlink instead.
  installedRoot = join(playgroundDir, 'node_modules', 'buildkit-primevue')
  const installedPkg = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'))
  pass(`resolved buildkit-primevue@${installedPkg.version} from ${relative(playgroundDir, installedRoot) || '.'}`)
  if (installedPkg.version !== pkg.version) {
    warn(`installed version ${installedPkg.version} differs from repo version ${pkg.version} — run \`npm install\` in playground/`)
  }
} catch {
  fail('cannot resolve "buildkit-primevue" from playground/ — run `npm install` inside playground/ first')
}

if (installedRoot) {
  for (const subpath of Object.keys(pkg.exports ?? {})) {
    const specifier = subpath === '.' ? 'buildkit-primevue' : `buildkit-primevue/${subpath.replace(/^\.\//, '')}`
    // Type-only subpaths have nothing for Node's runtime resolver to find.
    const conditions = pkg.exports[subpath]
    const runtimeOnly = conditions && typeof conditions === 'object'
      && !('import' in conditions) && !('require' in conditions) && !('default' in conditions)
    if (runtimeOnly) {
      pass(`${specifier} (types-only subpath, skipped at runtime)`)
      continue
    }
    try {
      require.resolve(specifier)
      pass(`node resolves ${specifier}`)
    } catch (e) {
      fail(`node cannot resolve ${specifier}: ${e.code ?? e.message}`)
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4. the published tarball really contains those files
 * ------------------------------------------------------------------ */

// This is the only check that sees the REAL tarball. Step 1 approximates it from the
// "files" array, which cannot account for .npmignore/.gitignore exclusions — so if this
// step cannot run, the run is inconclusive and must fail rather than quietly pass.
try {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']})
  const packed = new Set((JSON.parse(out)[0]?.files ?? []).map(f => f.path))
  if (packed.size === 0) {
    fail('`npm pack --dry-run` reported an empty file list — cannot verify the published tarball')
  } else {
    for (const {subpath, target} of targets) {
      const relPath = target.replace(/^\.\//, '')
      if (!packed.has(relPath)) fail(`"${subpath}" -> ${target} is missing from \`npm pack\` output`)
    }
    pass(`npm pack contains ${packed.size} files`)
  }
} catch (e) {
  fail(`could not run \`npm pack --dry-run\`, so the published tarball is unverified: ${e.message}`)
}

/* ------------------------------------------------------------------ *
 * report
 * ------------------------------------------------------------------ */

console.log(`\n  buildkit-primevue install check\n`)
for (const p of passes) console.log(`  [32m✓[0m ${p}`)
for (const w of warnings) console.log(`  [33m![0m ${w}`)
for (const f of failures) console.log(`  [31m✗[0m ${f}`)

console.log(
  `\n  ${passes.length} passed, ${warnings.length} warning(s), ${failures.length} failed\n`,
)

process.exit(failures.length > 0 ? 1 : 0)
