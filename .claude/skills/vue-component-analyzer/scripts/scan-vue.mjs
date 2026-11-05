#!/usr/bin/env node
/**
 * scan-vue.mjs - deterministic fact-finder for Vue 3 single-file components.
 *
 * Collects structure metrics and pattern hits so the model can reason over facts
 * instead of re-reading every file. It flags candidates; the skill decides which matter.
 *
 * Usage:
 *   node scan-vue.mjs <srcDir> [--project <dirWithNodeModules>] [--json <out.json>] [--top <n>]
 *
 * Paths in the output are relative to the current working directory.
 * Uses the project's own @vue/compiler-sfc (ships with `vue`), so no extra install.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

// ---------- args ----------
const args = process.argv.slice(2)
if (!args[0] || args[0].startsWith('--')) {
  console.error('Usage: node scan-vue.mjs <srcDir> [--project <dir>] [--json <out.json>] [--top <n>]')
  process.exit(1)
}
const srcDir = path.resolve(args[0])
const opt = (name, def) => {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : def
}
const projectDir = path.resolve(opt('--project', findProjectRoot(srcDir)))
const jsonOut = opt('--json', null)
const TOP = Number(opt('--top', 15))

function findProjectRoot(start) {
  let dir = start
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules'))) return dir
    dir = path.dirname(dir)
  }
  return start
}

// ---------- compiler ----------
const req = createRequire(path.join(projectDir, 'package.json'))
let sfc
try {
  sfc = req('@vue/compiler-sfc')
} catch {
  try {
    sfc = req('vue/compiler-sfc')
  } catch {
    console.error(`Could not load @vue/compiler-sfc from ${projectDir}. Install dependencies or pass --project.`)
    process.exit(2)
  }
}
const { parse, babelParse } = sfc

// ---------- helpers ----------
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.nuxt', '.output'])
function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(p, out)
    else if (/\.(vue|js|ts|mjs)$/.test(entry.name) && !/\.(d|spec|test)\.(ts|js)$/.test(entry.name)) out.push(p)
  }
  return out
}
const rel = (p) => path.relative(process.cwd(), p)
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12)
const countNewlines = (s) => (s.match(/\n/g) || []).length
// Normalize code for exact-duplicate detection: drop comments and whitespace.
const normCode = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '')
// Structural signature: also erase identifiers and literals, so functions that differ only
// in names/endpoints/messages (copy-pasted logic) hash the same.
const normStruct = (s) => normCode(s)
  .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, 's')
  .replace(/\b\d+(\.\d+)?\b/g, 'n')
  .replace(/[A-Za-z_$][\w$]*/g, 'i')
const pascal = (tag) => tag.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())

// AST walker that passes the ancestor chain (needed to know whether a call is inside a function).
function walkAst(node, visit, ancestors = []) {
  if (!node || typeof node.type !== 'string') return
  visit(node, ancestors)
  const next = [...ancestors, node]
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments') continue
    const v = node[key]
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walkAst(c, visit, next))
    else if (v && typeof v.type === 'string') walkAst(v, visit, next)
  }
}
const isFn = (n) => /Function|ObjectMethod|ClassMethod/.test(n.type)

const findings = []
const add = (rule, severity, file, line, message, extra = {}) =>
  findings.push({ rule, severity, file: rel(file), line, message, ...extra })

const functionsIndex = [] // {name, file, line, lines, hash, struct}
const cssBlocks = [] // {file, line, selector, hash, decls, scoped}
const globalSelectors = new Map() // selector -> file (unscoped style blocks)
const scopedSelectors = [] // {selector, file, line}
const components = []
const importGraph = new Map() // absFile -> [absFile]
const globalComponents = new Set() // app.component('Name', ...)
const routeInfo = { staticViews: [], lazyViews: 0, file: null, line: null }

// ---------- import resolution ----------
function resolveImport(fromFile, source) {
  let base
  if (source.startsWith('.')) base = path.resolve(path.dirname(fromFile), source)
  else if (source.startsWith('@/') || source.startsWith('~/')) base = path.join(srcDir, source.slice(2))
  else return null // package import
  for (const ext of ['', '.js', '.ts', '.vue', '.mjs', '/index.js', '/index.ts']) {
    const p = base + ext
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  }
  return null
}

// ---------- script analysis ----------
function analyzeScript(content, lang, file, lineOffset, isVueFile) {
  const stats = {
    ref: 0, reactive: 0, shallowRef: 0, computed: 0, watch: 0, watchEffect: 0, deepWatch: 0,
    lifecycle: 0, functions: 0, imports: [], localNames: new Set(), registered: new Set(), setupReturns: [],
  }
  let ast
  try {
    const plugins = lang === 'ts' || lang === 'tsx' ? ['typescript'] : []
    ast = babelParse(content, { sourceType: 'module', plugins })
  } catch (e) {
    add('parse-error', 'info', file, lineOffset + 1, `Script could not be parsed: ${e.message.split('\n')[0]}`)
    return stats
  }
  const lineOf = (n) => (n.loc ? n.loc.start.line + lineOffset : lineOffset + 1)
  const srcOf = (n) => content.slice(n.start, n.end)
  const LIFECYCLE = /^on(Before)?(Mount|Mounted|Update|Updated|Unmount|Unmounted)$|^onActivated$|^onDeactivated$/
  const deps = []
  const vueImports = new Map() // local name -> source (for route analysis)
  const routeComponentIds = []
  const leak = { add: [], remove: 0, interval: [], clearInterval: 0, observers: [], disconnect: 0 }

  const recordFn = (name, node) => {
    if (!name || !node.body) return
    const body = srcOf(node)
    const lines = (node.loc?.end.line ?? 0) - (node.loc?.start.line ?? 0) + 1
    stats.functions++
    const bodyOnly = body.replace(/^[^(]*/, '')
    functionsIndex.push({ name, file: rel(file), line: lineOf(node), lines, hash: hash(normCode(bodyOnly)), struct: hash(normStruct(bodyOnly)) })
  }

  walkAst(ast.program, (node, ancestors) => {
    const inFunction = ancestors.some(isFn)
    if (node.type === 'ImportDeclaration') {
      stats.imports.push(node.source.value)
      deps.push(node.source.value)
      for (const s of node.specifiers) {
        stats.localNames.add(s.local.name)
        if (/\.vue$/.test(node.source.value)) vueImports.set(s.local.name, node.source.value)
      }
    }
    // Dynamic import('...') - counts as a dependency edge and as a lazy route if in a router file.
    if (node.type === 'CallExpression' && node.callee.type === 'Import' && node.arguments[0]?.type === 'StringLiteral') {
      deps.push(node.arguments[0].value)
      if (/\.vue$/.test(node.arguments[0].value)) routeInfo.lazyViews += /createRouter|routes/.test(content) ? 1 : 0
    }
    if (node.type === 'ObjectProperty' && node.key?.name === 'component' && node.value?.type === 'Identifier') {
      routeComponentIds.push({ name: node.value.name, line: lineOf(node) })
    }
    // components: { A, B } registration (Options API / setup())
    if (node.type === 'ObjectProperty' && node.key?.name === 'components' && node.value?.type === 'ObjectExpression') {
      for (const p of node.value.properties) if (p.key) stats.registered.add(p.key.name || p.key.value)
    }
    // Global registration: app.component('Name', X)
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property?.name === 'component' &&
        node.arguments[0]?.type === 'StringLiteral') {
      globalComponents.add(pascal(node.arguments[0].value))
    }
    // setup() { ... return { a, b } } - names exposed to the template
    if (node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression') {
      const fn = [...ancestors].reverse().find(isFn)
      const fnName = fn?.key?.name || (ancestors[ancestors.indexOf(fn) - 1]?.key?.name)
      if (fnName === 'setup') {
        for (const p of node.argument.properties) {
          if (p.type === 'ObjectProperty' && p.key?.name) stats.setupReturns.push({ name: p.key.name, line: lineOf(p) })
        }
      }
    }
    if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && /^(Resize|Intersection|Mutation)Observer$/.test(node.callee.name) && inFunction) {
      leak.observers.push(lineOf(node))
    }
    if (node.type === 'CallExpression') {
      const callee = node.callee.type === 'Identifier' ? node.callee.name
        : node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier' ? node.callee.property.name : null
      if (!callee) return
      if (callee in stats && typeof stats[callee] === 'number') stats[callee]++
      if (LIFECYCLE.test(callee)) stats.lifecycle++
      // Leak accounting only counts calls inside functions: module-scope listeners are app-lifetime singletons.
      if (callee === 'addEventListener' && inFunction) leak.add.push(lineOf(node))
      if (callee === 'removeEventListener') leak.remove++
      if (callee === 'setInterval' && inFunction) leak.interval.push(lineOf(node))
      if (callee === 'clearInterval') leak.clearInterval++
      if (callee === 'disconnect') leak.disconnect++
      if (callee === 'watch') {
        const cb = node.arguments[1]
        if (cb && /Function/.test(cb.type) && cb.body?.type === 'BlockStatement' && cb.body.body.length === 0) {
          add('empty-watcher', 'low', file, lineOf(node), 'watch() with an empty callback does nothing but track dependencies; remove it.')
        }
        const optsArg = node.arguments[2]
        if (optsArg?.type === 'ObjectExpression' && optsArg.properties.some(
          (p) => p.key?.name === 'deep' && p.value?.type === 'BooleanLiteral' && p.value.value)) {
          stats.deepWatch++
          add('deep-watch', 'medium', file, lineOf(node),
            'watch(..., { deep: true }) traverses the whole object on every change; watch a getter for the specific field(s) or a computed instead.')
        }
      }
      if ((callee === 'ref' || callee === 'reactive') && node.arguments[0]) {
        const a = node.arguments[0]
        const size = a.type === 'ArrayExpression' ? a.elements.length : a.type === 'ObjectExpression' ? a.properties.length : 0
        if (size >= 30) add('large-reactive-literal', 'low', file, lineOf(node),
          `${callee}() wraps a literal with ${size} entries; if it is never mutated per-item, use shallowRef/markRaw or a plain const.`)
      }
    }
    if (node.type === 'FunctionDeclaration') recordFn(node.id?.name, node)
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' &&
        (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')) {
      recordFn(node.id.name, node.init)
    }
    if (node.type === 'ObjectMethod' && node.key?.type === 'Identifier' && node.key.name !== 'setup' && node.key.name !== 'data') {
      recordFn(node.key.name, node)
    }
  })

  if (leak.add.length > leak.remove) add('listener-leak', 'high', file, leak.add[0],
    `addEventListener x${leak.add.length} inside functions but removeEventListener x${leak.remove}; remove listeners in onBeforeUnmount/onUnmounted.`)
  if (leak.interval.length > leak.clearInterval) add('interval-leak', 'high', file, leak.interval[0],
    `setInterval x${leak.interval.length} but clearInterval x${leak.clearInterval}; clear timers on unmount.`)
  if (leak.observers.length > leak.disconnect) add('observer-leak', 'medium', file, leak.observers[0],
    `${leak.observers.length} observer(s) created but disconnect() called ${leak.disconnect}x; disconnect on unmount.`)

  // Router: only identifiers actually used as `component:` values, and only .vue imports.
  const staticRoutes = routeComponentIds.filter((r) => vueImports.has(r.name))
  if (!isVueFile && staticRoutes.length) {
    routeInfo.staticViews.push(...staticRoutes.map((r) => r.name))
    routeInfo.file = file
    routeInfo.line = staticRoutes[0].line
  }

  const abs = importGraph.get(file) || []
  for (const d of deps) {
    const r = resolveImport(file, d)
    if (r) abs.push(r)
  }
  importGraph.set(file, abs)
  return stats
}

// ---------- template analysis ----------
const TEMPLATE_CALL_IGNORE = new Set(['t', '$t', '$tc', '$d', '$n', 'String', 'Number', 'Boolean', 'emit', '$emit', 'var', 'calc', 'rgba', 'rgb', 'url'])
// Method calls / constructors that do real work per call (allocate formatters, scan arrays, parse).
const EXPENSIVE = /\.(toLocaleString|toLocaleDateString|toLocaleTimeString|find|findIndex|filter|sort|reduce|map|some|every|flatMap)\s*\(|\bnew\s+(Date|Intl\.\w+|RegExp)\b|\bJSON\.\w+\s*\(/g
const BUILTIN_TAGS = new Set(['RouterLink', 'RouterView', 'Transition', 'TransitionGroup', 'KeepAlive', 'Teleport', 'Suspense', 'Component', 'Slot'])

function analyzeTemplate(ast, file) {
  const stats = { elements: 0, maxDepth: 0, vFor: 0, vIf: 0, vShow: 0, childComponents: new Map(), loops: [] }
  const visit = (node, depth, loop) => {
    if (!node) return
    if (node.type === 1) {
      stats.elements++
      stats.maxDepth = Math.max(stats.maxDepth, depth)
      if (node.tagType === 1 && !stats.childComponents.has(node.tag)) stats.childComponents.set(node.tag, node.loc.start.line)
      const props = node.props || []
      const dir = (name) => props.find((p) => p.type === 7 && p.name === name)
      const vFor = dir('for')
      const vIf = dir('if')
      if (dir('show')) stats.vShow++
      if (vIf) stats.vIf++
      let current = loop
      if (vFor) {
        stats.vFor++
        const exp = vFor.exp?.content || ''
        const m = exp.match(/^\s*\(?\s*([^,)]+?)\s*(?:,\s*([^,)]+?)\s*)?(?:,\s*([^,)]+?)\s*)?\)?\s+(?:in|of)\s+(.+)$/)
        const indexAlias = m?.[2]?.trim()
        const isKey = (p) => (p.type === 7 && p.name === 'bind' && p.arg?.content === 'key') || (p.type === 6 && p.name === 'key')
        const keyProp = props.find(isKey)
        // <template v-for> puts the key on the child in Vue 3.
        const childKey = node.tag === 'template' && node.children?.some((c) => c.type === 1 && (c.props || []).some(isKey))
        const line = node.loc.start.line
        if (!keyProp && !childKey) add('vfor-missing-key', 'high', file, line, `v-for="${exp}" has no :key; Vue cannot track items and will patch in place.`)
        else if (keyProp && indexAlias && keyProp.exp?.content?.trim() === indexAlias)
          add('vfor-index-key', 'medium', file, line, `v-for uses the index "${indexAlias}" as :key; use a stable id so reordering/filtering does not reuse the wrong DOM/state.`)
        if (vIf) add('vif-with-vfor', 'medium', file, line, 'v-if on the same element as v-for; filter in a computed (or move v-if to a wrapper <template>).')
        current = { line, source: m?.[4]?.trim() || exp, calls: new Map(), expensive: new Map() }
        stats.loops.push(current)
      }
      if (current) for (const p of props) {
        const content = p.type === 7 ? p.exp?.content : null
        if (content && p.name !== 'on' && p.name !== 'for') collectCalls(content, current)
      }
      ;(node.children || []).forEach((c) => visit(c, depth + 1, current))
      if (node.branches) node.branches.forEach((b) => (b.children || []).forEach((c) => visit(c, depth + 1, current)))
    } else if (node.type === 5 /* interpolation */ && loop) {
      collectCalls(node.content?.content || '', loop)
    } else if (node.children) {
      node.children.forEach((c) => visit(c, depth, loop))
    } else if (node.branches) {
      node.branches.forEach((b) => (b.children || []).forEach((c) => visit(c, depth, loop)))
    }
  }
  ;(ast.children || []).forEach((c) => visit(c, 1, null))
  return stats
}
function collectCalls(expr, loop) {
  for (const m of expr.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (TEMPLATE_CALL_IGNORE.has(m[1])) continue
    loop.calls.set(m[1], (loop.calls.get(m[1]) || 0) + 1)
  }
  for (const m of expr.matchAll(EXPENSIVE)) {
    const name = m[1] ? `.${m[1]}()` : m[2] ? `new ${m[2]}` : 'JSON.*'
    loop.expensive.set(name, (loop.expensive.get(name) || 0) + 1)
  }
}

// ---------- style analysis ----------
function analyzeStyles(styles, file) {
  let hexColors = 0
  let lines = 0
  for (const s of styles) {
    // Blank out comments but keep their newlines so line numbers stay exact.
    const css = s.content.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    lines += countNewlines(s.content) + 1
    hexColors += (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length
    const baseLine = s.loc.start.line
    for (const m of css.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim().replace(/\s+/g, ' ')
      const decls = m[2].split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean).sort()
      if (!selector || !decls.length) continue
      // m.index points at whitespace before the selector; skip it to land on the selector's own line.
      const selStart = m.index + (m[1].length - m[1].trimStart().length)
      const line = baseLine + countNewlines(css.slice(0, selStart))
      if (decls.length >= 3) cssBlocks.push({ file: rel(file), line, selector, hash: hash(decls.join(';')), decls: decls.length, scoped: !!s.scoped })
      for (const sel of selector.split(',').map((x) => x.trim())) {
        if (!/^[.#]?[\w-]+$/.test(sel)) continue // simple selectors only
        if (s.scoped) scopedSelectors.push({ selector: sel, file: rel(file), line })
        else if (!globalSelectors.has(sel)) globalSelectors.set(sel, rel(file))
      }
    }
  }
  return { styleLines: lines, hexColors }
}

// ---------- run ----------
const files = walkFiles(srcDir)
const pendingTemplates = [] // resolved after all scripts are read (global registrations)
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) {
    analyzeScript(source, file.endsWith('.ts') ? 'ts' : 'js', file, 0, false)
    continue
  }
  let descriptor
  try {
    ;({ descriptor } = parse(source, { filename: file }))
  } catch (e) {
    add('parse-error', 'info', file, 1, `SFC parse failed: ${e.message}`)
    continue
  }
  const comp = { file: rel(file), abs: file, lines: countNewlines(source) + 1, api: 'none', templateLines: 0, scriptLines: 0 }
  let scriptStats = { localNames: new Set(), registered: new Set(), setupReturns: [] }
  // Both <script> and <script setup> can exist; analyze each.
  for (const script of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
    const s = analyzeScript(script.content, script.lang, file, script.loc.start.line - 1, true)
    for (const k of ['localNames', 'registered']) s[k].forEach((x) => scriptStats[k].add(x))
    scriptStats.setupReturns.push(...s.setupReturns)
    for (const [k, v] of Object.entries(s)) if (typeof v === 'number') comp[k] = (comp[k] || 0) + v
    comp.scriptLines += countNewlines(script.content) + 1
  }
  if (!importGraph.has(file)) importGraph.set(file, [])
  comp.api = descriptor.scriptSetup ? 'script-setup' : descriptor.script && /\bsetup\s*\(/.test(descriptor.script.content) ? 'setup()'
    : descriptor.script ? 'options' : 'none'
  if (descriptor.template?.ast) {
    comp.templateLines = countNewlines(descriptor.template.content) + 1
    const t = analyzeTemplate(descriptor.template.ast, file)
    Object.assign(comp, { elements: t.elements, maxDepth: t.maxDepth, vFor: t.vFor, vIf: t.vIf, vShow: t.vShow })
    comp.childComponents = [...t.childComponents.keys()]
    pendingTemplates.push({ file, comp, scriptStats, children: t.childComponents, templateSrc: descriptor.template.content })
    // One finding per v-for (not per file), and only when it has enough work to be worth a look.
    for (const l of t.loops) {
      const helper = [...l.calls].reduce((n, [, c]) => n + c, 0)
      const heavy = [...l.expensive].reduce((n, [, c]) => n + c, 0)
      if (heavy === 0 && helper < 3) continue
      const parts = [...l.calls].map(([n, c]) => `${n} x${c}`).concat([...l.expensive].map(([n, c]) => `${n} x${c}`))
      add('calls-in-loop', heavy > 0 || helper >= 8 ? 'medium' : 'low', file, l.line,
        `v-for over "${l.source}": ${helper + heavy} calls per row (${parts.join(', ')})${heavy ? `, ${heavy} of them allocate/scan (formatters, array methods)` : ''}. Matters only for long or frequently re-rendered lists - then precompute display fields in a computed.`)
    }
  }
  Object.assign(comp, analyzeStyles(descriptor.styles, file))
  if (comp.lines > 400) add('large-component', comp.lines > 800 ? 'medium' : 'low', file, 1,
    `${comp.lines} lines (template ${comp.templateLines}, script ${comp.scriptLines}, styles ${comp.styleLines}); look for extractable child components or composables.`)
  components.push(comp)
}

// Template-dependent checks that need every file's registrations first.
for (const { file, comp, scriptStats, children, templateSrc } of pendingTemplates) {
  // Unresolved components: used in the template but not imported/registered/global/built-in.
  // Vue only warns at runtime for these, so builds pass while the UI silently renders nothing.
  const known = new Set([...scriptStats.localNames, ...scriptStats.registered].map(pascal))
  for (const [tag, line] of children) {
    const name = pascal(tag)
    if (BUILTIN_TAGS.has(name) || known.has(name) || globalComponents.has(name)) continue
    add('unresolved-component', 'high', file, line, `<${tag}> is used but never imported or registered; it renders nothing (runtime warning only).`)
  }
  // setup() returns that the template never references (dead code or forgotten UI).
  if (comp.api === 'setup()') {
    const unused = scriptStats.setupReturns.filter((r) => !new RegExp(`(?<![\\w$])${r.name.replace(/\$/g, '\\$')}(?![\\w$])`).test(templateSrc))
    if (unused.length) add('unused-setup-return', 'low', file, unused[0].line,
      `setup() returns ${unused.length} name(s) the template never uses: ${unused.map((u) => u.name).join(', ')}. Check for dead code (or use via refs/expose).`)
  }
}

// Orphans: files not reachable from the entry point through static or dynamic imports.
const entry = ['main.js', 'main.ts', 'main.mjs'].map((f) => path.join(srcDir, f)).find((f) => fs.existsSync(f))
const orphans = []
if (entry) {
  const seen = new Set([entry])
  const queue = [entry]
  while (queue.length) for (const d of importGraph.get(queue.shift()) || []) if (!seen.has(d)) { seen.add(d); queue.push(d) }
  for (const f of files) {
    if (seen.has(f)) continue
    orphans.push(rel(f))
    add('orphan-file', f.endsWith('.vue') ? 'medium' : 'low', f, 1,
      'Not imported (statically or lazily) from the app entry; likely dead code or a missing route/registration. Check before optimizing it.')
  }
}

if (routeInfo.staticViews.length >= 3) add('static-route-imports', 'medium', routeInfo.file, routeInfo.line,
  `${routeInfo.staticViews.length} route components are imported statically (${routeInfo.staticViews.join(', ')}), so every view ships in the initial bundle; use () => import('./views/X.vue') for routes not needed on first paint.`)

// ---------- cross-file duplicates ----------
const groupBy = (arr, keyFn) => arr.reduce((m, x) => {
  const k = keyFn(x)
  if (!m.has(k)) m.set(k, [])
  m.get(k).push(x)
  return m
}, new Map())
const multiFile = (g) => new Set(g.map((x) => x.file)).size > 1

const dupFunctions = [...groupBy(functionsIndex.filter((f) => f.lines >= 4), (f) => f.hash).values()]
  .filter(multiFile)
  .map((g) => ({ names: [...new Set(g.map((f) => f.name))], lines: g[0].lines, locations: g.map((f) => `${f.file}:${f.line}`) }))
  .sort((a, b) => b.lines * b.locations.length - a.lines * a.locations.length)
const exactHashes = new Set(dupFunctions.flatMap((d) => d.locations))

// Structurally identical (names/literals differ) - catches copy-pasted loaders, handlers, mappers.
const structTwins = [...groupBy(functionsIndex.filter((f) => f.lines >= 5), (f) => f.struct).values()]
  .filter(multiFile)
  .filter((g) => !g.every((f) => exactHashes.has(`${f.file}:${f.line}`)))
  .map((g) => ({ names: [...new Set(g.map((f) => f.name))], lines: g[0].lines, locations: g.map((f) => `${f.file}:${f.line}`) }))
  .sort((a, b) => b.lines * b.locations.length - a.lines * a.locations.length)

// Same name in several files with differing bodies - possible drift between copies.
const sameName = [...groupBy(functionsIndex, (f) => f.name).values()]
  .filter(multiFile)
  .filter((g) => !/^(setup|data|close|open|toggle\w*|handle\w*|on[A-Z]\w*)$/.test(g[0].name))
  .map((g) => ({ name: g[0].name, variants: new Set(g.map((f) => f.hash)).size, locations: g.map((f) => `${f.file}:${f.line} (${f.lines}l)`) }))
  .sort((a, b) => b.locations.length - a.locations.length)

const dupCss = [...groupBy(cssBlocks, (b) => b.hash).values()]
  .filter(multiFile)
  .map((g) => ({ decls: g[0].decls, files: [...new Set(g.map((b) => b.file))].sort(), selectors: [...new Set(g.map((b) => b.selector))], locations: g.map((b) => `${b.file}:${b.line} ${b.selector}`) }))
// Cluster duplicate CSS groups by the set of files sharing them: "6 modals share 20 rule bodies" is the signal.
const cssClusters = [...groupBy(dupCss, (d) => d.files.join('|')).values()]
  .map((g) => ({ files: g[0].files, groups: g.length, declarations: g.reduce((n, d) => n + d.decls, 0), selectors: g.flatMap((d) => d.selectors) }))
  .sort((a, b) => b.declarations * b.files.length - a.declarations * a.files.length)

const shadowedGlobals = scopedSelectors
  .filter((s) => globalSelectors.has(s.selector) && globalSelectors.get(s.selector) !== s.file)
  .map((s) => ({ ...s, global: globalSelectors.get(s.selector) }))

const SEV = { high: 0, medium: 1, low: 2, info: 3 }
const result = {
  srcDir: rel(srcDir) || '.',
  totals: {
    vueFiles: components.length,
    scriptFiles: files.length - components.length,
    findings: findings.length,
    orphans: orphans.length,
    duplicateFunctionGroups: dupFunctions.length,
    structuralTwinGroups: structTwins.length,
    duplicateCssGroups: dupCss.length,
    cssClusters: cssClusters.length,
    scopedOverridesOfGlobals: shadowedGlobals.length,
    lazyRouteViews: routeInfo.lazyViews,
  },
  components: components.map(({ abs, ...c }) => c).sort((a, b) => b.lines - a.lines),
  findings: findings.sort((a, b) => SEV[a.severity] - SEV[b.severity]),
  duplicates: { functions: dupFunctions, structuralTwins: structTwins, sameNameFunctions: sameName, cssClusters, css: dupCss, scopedOverridesOfGlobals: shadowedGlobals },
}

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2))

// ---------- markdown summary (stdout) ----------
const out = []
out.push(`# Vue scan: ${result.srcDir}`)
out.push(`${components.length} .vue files, ${result.totals.scriptFiles} JS/TS files, ${findings.length} pattern findings${orphans.length ? `, ${orphans.length} file(s) unreachable from ${rel(entry)}` : ''}.\n`)
out.push('## Components by size')
out.push('| File | Lines | Tmpl | Script | Style | API | ref/computed/watch | v-for | Children | Hex colors |')
out.push('|---|---|---|---|---|---|---|---|---|---|')
for (const c of result.components.slice(0, TOP)) {
  out.push(`| ${c.file} | ${c.lines} | ${c.templateLines} | ${c.scriptLines} | ${c.styleLines} | ${c.api} | ${c.ref ?? 0}/${c.computed ?? 0}/${(c.watch ?? 0) + (c.watchEffect ?? 0)} | ${c.vFor ?? 0} | ${(c.childComponents || []).length} | ${c.hexColors} |`)
}
for (const sev of ['high', 'medium', 'low']) {
  const list = findings.filter((f) => f.severity === sev)
  if (!list.length) continue
  out.push(`\n## ${sev[0].toUpperCase() + sev.slice(1)} (${list.length})`)
  for (const f of list.slice(0, TOP * 2)) out.push(`- [${f.rule}] ${f.file}:${f.line} - ${f.message}`)
  if (list.length > TOP * 2) out.push(`- ...and ${list.length - TOP * 2} more (see --json)`)
}
if (dupFunctions.length) {
  out.push(`\n## Identical function bodies across files (${dupFunctions.length} groups)`)
  for (const d of dupFunctions.slice(0, TOP)) out.push(`- ${d.names.join(' / ')} (${d.lines} lines): ${d.locations.join(', ')}`)
}
if (structTwins.length) {
  out.push(`\n## Structurally identical functions - same code shape, different names/literals (${structTwins.length} groups)`)
  for (const d of structTwins.slice(0, TOP)) out.push(`- ${d.names.join(' / ')} (~${d.lines} lines): ${d.locations.join(', ')}`)
}
const drift = sameName.filter((s) => s.variants > 1)
if (drift.length) {
  out.push(`\n## Same-named functions with different bodies - check for drift (${drift.length})`)
  for (const d of drift.slice(0, TOP)) out.push(`- ${d.name} (${d.variants} variants): ${d.locations.join(', ')}`)
}
if (cssClusters.length) {
  out.push(`\n## Duplicated CSS, clustered by file set (${dupCss.length} rule bodies in ${cssClusters.length} clusters)`)
  for (const c of cssClusters.slice(0, TOP)) {
    const sel = c.selectors.slice(0, 6).join(', ') + (c.selectors.length > 6 ? ', ...' : '')
    out.push(`- ${c.files.length} files share ${c.groups} rule bodies (${c.declarations} declarations each copy; e.g. ${sel}): ${c.files.join(', ')}`)
  }
}
if (shadowedGlobals.length) {
  out.push(`\n## Scoped styles redefining global classes (${shadowedGlobals.length})`)
  for (const s of shadowedGlobals.slice(0, TOP)) out.push(`- ${s.selector} in ${s.file}:${s.line} (global in ${s.global})`)
}
console.log(out.join('\n'))
