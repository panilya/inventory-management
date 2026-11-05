---
name: vue-component-analyzer
description: Analyze a Vue 3 codebase's component structure and suggest concrete optimizations for rendering performance and code reuse - oversized components to split, logic to extract into composables, helpers and CSS duplicated across files, v-for key problems, expensive template expressions, deep watchers, listener/timer leaks, and bundle-size wins like lazy routes. Produces a ranked report with file:line evidence, then applies fixes only when the user picks them. Use this skill whenever the user asks to audit, analyze, review, optimize, refactor, or "clean up" Vue components, asks why a Vue page is slow or re-renders too much, wants to reduce duplication between components, or asks what to extract into composables or shared components - even if they don't say "analyze".
---

# Vue Component Analyzer

Find the changes that actually make a Vue 3 app faster or easier to maintain, prove each one with file:line evidence, and rank them so the user can decide what to fix. The deliverable is a report. Code changes happen only after the user chooses which findings to act on.

## Why this approach

Reading every component by eye is slow and inconsistent, and it is bad at cross-file questions ("is this helper copied into six files?"). So the work is split:

1. A bundled scanner (`scripts/scan-vue.mjs`) parses every SFC with the project's own `@vue/compiler-sfc` and collects facts: sizes, reactivity counts, v-for keys, function calls inside loops, duplicated function bodies and CSS rules across files, listener and timer balance, and static route imports.
2. You read only the files the scan points at, decide which candidates matter in context, and turn them into ranked recommendations.

The scanner flags candidates; it does not know context. A function called inside a 5-row v-for is irrelevant, the same call in a 2,000-row table is not. Your judgment is the valuable part, so don't paste scanner output as findings.

## Workflow

### 1. Scope and context

- Find the Vue source root (usually `src/` or `client/src/`) and the directory that holds `node_modules`.
- Read project conventions first: `CLAUDE.md` / `AGENTS.md` (including nested ones), `package.json` (Vue version, router, state library, build tool), and the shape of `src/` (is there already a `composables/`, `utils/`, `components/`?). Recommendations must fit the project's existing patterns and API style (`<script setup>` vs `setup()` vs Options API). If the user named specific files or a focus (performance only, one page), narrow the scope to that.
- Note any delegation rules (e.g. "all `.vue` edits go to a vue-expert agent"). They apply in step 5.
- Get a rough sense of data size once, up front: where list data comes from (API, mock JSON files, a store) and roughly how many records the biggest lists hold. Almost every performance judgment later ("does this v-for matter?") depends on it. Counting records in fixture files or reading the API's page size is usually enough.
- Pick a scratch directory for intermediate files (`<scratch>` below): the session's scratchpad or temp directory if one is provided, otherwise the OS temp dir. Don't write scan output or build artifacts into the repository.

### 2. Run the scanner

```bash
node <skill-dir>/scripts/scan-vue.mjs <srcDir> --json <scratch>/vue-scan.json
```

- `--project <dir>` if `node_modules` is not in an ancestor of `srcDir`; `--top <n>` to show more rows. Paths in the output are relative to the directory you run it from.
- Stdout is a compact markdown summary; the JSON holds everything (per-component metrics, all findings, duplicate groups). Read the summary first and dip into the JSON only for detail.
- What it detects:
  - Template: v-for key problems, v-if together with v-for, per-loop work (helper calls, plus allocating calls like `.toLocaleString()`, `.filter()` and `new Date`), and components used but never imported or registered.
  - Script: deep watchers, empty watchers, large reactive literals, listener/interval/observer leaks inside functions, and `setup()` returns the template never uses.
  - Project: files unreachable from `main.js`, and static route imports.
  - Cross-file: identical function bodies, structurally identical functions that differ only in names and literals (copy-pasted loaders and handlers), same-named functions whose bodies differ (drift), duplicated CSS clustered by file set, and scoped styles overriding global classes.
- What it can't see, so look for it by reading code: inline object/array props, v-show vs v-if choices, watchers that should be computed values, reactive API payloads that should be `shallowRef`, heavy dependencies, and behavioral drift between helpers with *different* names (for example `currencySymbol` re-implemented as a computed in several views).
- For real bundle numbers, build into scratch so the repo's `dist/` is untouched: `npx vite build --outDir <scratch>/dist --emptyOutDir` (or the project's equivalent). Note chunk count and sizes.
- If it fails because `@vue/compiler-sfc` can't be found, the project's dependencies aren't installed. Ask before running an install, or continue with manual review guided by `references/patterns.md`.

### 3. Verify and enrich

For every candidate you might report, open the code at the cited lines and confirm it. Then add what the scanner can't see.

Reading order matters for cost. Findings cluster by file, so read each flagged view once, top to bottom (template, then script), with all of its candidates in mind, rather than jumping to each line separately. Then read the shared modules (`utils/`, composables, API client) once, because most reuse recommendations land there.

**Correctness bugs come first.** Analysis often surfaces outright bugs: components that don't exist, copies of a helper that disagree (different rounding, currency or thresholds), error state that never clears, stale responses overwriting fresh ones. Report them even though they aren't "optimizations", and rank them above everything else. They are usually the most valuable thing in the report. Read `references/patterns.md` for the catalog of patterns, how to judge each one, and the standard fix.

Checks that need judgment:
- **List size and render frequency.** Where does the v-for data come from, how big can it get, and does anything make the parent re-render often (filters, timers, input)? This decides whether calls inside loops, missing `v-memo`, or deep reactivity matter at all.
- **Reactivity shape.** Large API payloads stored with `ref()`/`reactive()` that are only replaced wholesale (`shallowRef` candidates), watchers that could be computed values, and computed values that do heavy work on every dependency change.
- **Component boundaries.** For large components, sketch the natural split: which template region plus which state forms a self-contained child, and which logic is a composable. A big file alone isn't a problem; mixed responsibilities are.
- **Reuse.** For each duplicate group, check whether the copies are truly the same behavior or have drifted. Drifted copies can be a bug, which is worth saying. Check whether a shared home already exists (`utils/`, an existing composable) before proposing a new file.
- **Loading.** Static route imports, heavy modals/charts imported eagerly, large libraries pulled in for one function.

Discard false positives silently. If a whole scanner rule produced noise for this codebase, mention it in one line at the end so the user can trust the rest.

### 4. Write the report

Write the report to `<scratch>/vue-analysis.md` unless the user named a location. Don't add untracked files to the repo uninvited (some repos are public), but offer to save it into the repo, e.g. under `docs/`. Keep it scannable; each finding must earn its place. Use this structure:

```markdown
# Vue component analysis - <project>

## Summary
<3-5 sentences: overall health, the 2-3 changes with the best payoff, rough effort.>

## Findings
| # | Finding | Type | Impact | Effort | Where |
|---|---------|------|--------|--------|-------|
| 1 | Shared modal shell duplicated in 6 modals (~150 lines CSS each) | Reuse | High | M | components/*Modal.vue |
...

### 1. <Finding title>
**Evidence:** `path/File.vue:123`, `path/Other.vue:45` - what the code does now (short snippet only if it clarifies).
**Why it matters:** the concrete cost - extra renders per keystroke, KB shipped up front, N places to change for one fix, a latent bug.
**Suggested change:** the specific refactor, naming the new composable/component/util and where it lives, with a short before/after sketch for anything non-obvious.
**Risk / test:** what could break and how to check it.

## Not worth changing
<Candidates you checked and deliberately rejected, one line each with the reason. This builds trust and stops re-litigation.>
```

Ranking: order by impact relative to effort. Impact means a real user-visible or maintenance cost in *this* app: bugs and correctness risks (missing components, drifted duplicates that produce different output, index keys on reorderable lists, leaks), then measurable performance (initial bundle, large-list renders, render frequency), then reuse and maintainability. Label effort S/M/L. Group tiny mechanical fixes into one finding instead of listing ten.

After writing the file, give the user a short chat summary: the top 3 findings and the file path. Ask which findings to apply, e.g. "Want me to apply 1, 3 and 5?".

### 5. Apply on request

Only change code for findings the user picked. For each:
- Make the smallest change that delivers the improvement, in the project's existing style. Extract to an existing shared location when one fits.
- Preserve behavior. Don't change props, emits, API calls, or visible output unless the finding is specifically about a bug, and say so.
- Follow project delegation rules for who edits `.vue` files.
- Verify: run the build, the project's tests if any, and re-run the scanner to confirm the finding is gone. For UI-affecting changes, load the affected pages in a browser if one is available.
- Report what changed per finding and anything that didn't go as planned.

## Reference files

- `scripts/scan-vue.mjs` - the scanner (Node 18+, uses the project's `@vue/compiler-sfc`; no install).
- `references/patterns.md` - the pattern catalog: what each signal means, when it matters, and the idiomatic Vue 3 fix. Read during step 3.
