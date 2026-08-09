# Language Atlas

A small, offline-friendly field guide to 83 programming languages. Filter them by
kind, paradigm, typing, execution mode, platform, and runtime — then click any
language to see its full trait sheet.

Built as a single static page. No frameworks, no build step, no dependencies,
no accounts, no tracking. Open it, and it just works. A service worker caches
the app for true offline use after the first visit.

Live at [https://languageatlas.pages.dev](https://languageatlas.pages.dev).

---

## What this is

A curated, hand-maintained dataset of languages, presented through filters that
answer questions like:

- *"I want something functional, statically typed, compiled, that runs everywhere."*
- *"What runs on the JVM and isn't Java?"*
- *"Give me languages that produce standalone executables."*

The filters are intentionally simple: pick options, results broaden within a
section and narrow across sections. Search narrows everything. Each option shows
how many languages would match under your other filters, your active filters are
kept in the URL (so views are shareable), and results can be sorted by name.
Typing is split into two sections — "Typing" (static / dynamic / gradual) and
"Typing strength" (strong / weak) — because they are two different questions
that shouldn't be mashed into one bucket.

Right-click or long-press a filter option to exclude it — this lets you say
"everything *except* Object-oriented" or "not standalone executables." Excluded
options show with a strikethrough and coral styling, and appear in the active
filter bar as "NOT Paradigm: Object-oriented." Filter sections are collapsible
(sidebar state is remembered), options sort by match count so the most common
choices float to the top, and search highlights matching text in the result
cards. Each language card also links to its official homepage.

Hit the **+** button on any language card to add it to a comparison (up to 5).
A comparison bar appears showing your selected languages, and a side-by-side
trait table is available below the grid.

## What this is not

This is not a ranking, not a popularity contest, and not an encyclopedia entry
for every language in existence. It's a starting point — a way to notice
languages you hadn't considered. When you find an interesting one, go read its
actual documentation before you commit to it. (This README's author believes
nobody should pick a language from a filter UI alone, including this one.)

## How the data works

- **Source of truth:** `data.json` — one entry per language, each with an optional
  `url` field linking to its official homepage.
- **Reference notes:** `data/` contains the original working lists (`languageslist.txt`, `optionslist.txt`).
- **Classification date:** August 2026. Languages change; this dataset is a snapshot, not a promise.

A few honest caveats about the labels:

- **Strong vs weak typing** is genuinely fuzzy. There's no formal definition
  everyone agrees on, so these tags follow common coercion conventions and are
  the most opinionated part of the data. Take them as a hint, not a verdict.
- **Paradigms** reflect what a language is commonly *used as*, not everything it
  can technically express. (Almost every language can fake any paradigm if you
  squint hard enough.)
- **Platforms** mean an established implementation or first-class target exists
  there — not "somebody once transpiled it in a weekend project."
- **Compiled vs interpreted** gets blurry with VMs and JIT runtimes, so some
  languages honestly get both tags.

If a label looks wrong to you, check the language's official documentation
first — and then feel free to open an issue or a pull request.

A handful of labels are honest judgment calls rather than settled facts, so they
deserve a mention:

- **Crystal** on Windows uses official builds that are still marked preview-grade.
- **Ruby** on iOS/Android only works through RubyMotion, a third-party commercial
  product. **Java** on iOS relies on the OpenJDK Mobile project (an official
  downstream, not mainline JDK), and **Scala**/**Clojure** on Android go through
  community toolchains rather than first-party support.
- **Lua** and **MoonScript** in the browser depend on community Lua-in-JavaScript
  virtual machines like Fengari rather than first-party support.
- **Lean** browser builds are official for Lean 3; Lean 4's JavaScript backend is
  still a community effort, so the tag is a stretch.
- **F#** on iOS/Android is possible through .NET MAUI, but MAUI's tooling is
  C#-first, so those tags are candidates rather than guarantees.
- **SQLite** is an embedded C library, so calling its runtime "language-specific"
  is a small modeling lie we live with.
- **Racket** is tagged "gradual" because Typed Racket — its officially documented
  gradually-typed sibling — is part of the same language family.

## Running it locally

Because the page loads `data.json` via `fetch`, you need to serve the folder
over HTTP (a browser won't let a plain `file://` page read local files).

```sh
# Any static server works. Python, for example:
python3 -m http.server 8000
# then open http://localhost:8000
```

That's it. No `npm install`, no config, no build.

## Project layout

```
index.html      Page structure, dialogs, comparison panel, and preload link
index.css       All styling (dark/light themes, responsive, reduced-motion, contrast)
index.js        Filtering, comparison, focus trap, theme — vanilla JS
data.json       The dataset (83 languages, one entry each)
sw.js           Service worker with versioned cache for offline use
manifest.json   Web app manifest for PWA installability
icon.svg        App icon (favicon and PWA icon)
data/           Original working notes (not shipped)
_headers        Security + crawling headers, applied by Cloudflare Pages
robots.txt      Search-engine hints for languageatlas.pages.dev
sitemap.xml     Single-page sitemap for languageatlas.pages.dev
llms.txt        Machine-readable site brief for AI agents, per the llms.txt spec
```

## Deploying

Any static host works. The files deploy as-is — copy `index.html`, `index.css`,
`index.js`, `data.json`, `sw.js`, `manifest.json`, `icon.svg`, `robots.txt`,
`sitemap.xml`, and `llms.txt` to the docroot. The live site runs on Cloudflare
Pages.

The `_headers` file is Cloudflare Pages-specific: it applies the security and
crawling headers (CSP, `X-Frame-Options`, `nosniff`, `X-Robots-Tag`, and
friends) when served from Pages. Other hosts won't read it, so if you deploy
elsewhere, set the equivalent headers in that host's config.

## Accessibility & quality notes

- Semantic HTML, keyboard-friendly, skip link with `scroll-margin-top`, visible
  focus states, dialogs with proper labelling, `prefers-reduced-motion` respected,
  `prefers-contrast` for high-contrast users, live region on the result count,
  and an `aria-keyshortcuts` hint for the "/" search shortcut.
- Language cards are `<article>`s with a real `<button>` title for the trait
  dialog, plus sibling compare and homepage controls — no nested interactive
  elements, no fake `role="button"` containers, no inline event handlers
  (everything survives the strict CSP).
- The comparison table uses proper `scope="col"` / `scope="row"` header cells
  so screen readers can map each cell to its language and trait.
- Filter group titles are styled `<span>`s inside the collapse toggle buttons —
  headings stay headings, buttons stay buttons.
- Arrow keys navigate within filter groups, and the search field matches against
  all language traits (name, kind, paradigms, typing, execution, platforms,
  runtimes) — not just the name. Search terms are highlighted in the result cards.
  Search text is memoized per language so filtering and per-option counts stay
  cheap.
- Right-click (desktop) or long-press (mobile) a filter option to exclude it.
  Excluded options are tracked in the URL and shown with strikethrough styling.
- Filter sections are collapsible with a chevron indicator, and collapsed state
  persists in localStorage. Options within each section are sorted by match count
  so the most relevant choices appear first.
- Active filter pills use semantic `<ul>`/`<li>` markup instead of ARIA role
  attributes on `<span>` elements.
- Filters are encoded in the page URL (via `history.replaceState`, so browser
  history stays clean), which makes filtered views shareable and bookmarkable.
- Filter selections and exclusions announce themselves to screen readers via an
  `aria-live="assertive"` region (e.g. "Selected Typing: Static" or "Excluded
  Paradigm: Object-oriented").
- Dialogs trap focus — Tab and Shift+Tab cycle through the dialog's controls
  instead of escaping to the page behind.
- Theme transitions are coordinated across body, hero, filters, results, footer,
  and dialogs (300ms ease) so switching between dark and light modes feels smooth
  rather than jarring.
- The dataset is validated in-browser on load: every entry must have all five
  trait groups plus a kind, non-empty values, and values that exist in the filter
  lists. Broken data fails loudly instead of rendering half a page.
- A service worker with versioned cache precaches the app shell, data, manifest,
  and icon, making the page fully functional offline after the first visit. Old
  caches are automatically cleaned up on activation. A web app manifest
  (`manifest.json` with `id`, `scope`, and an SVG icon) enables PWA
  installability.
- `data.json` is preloaded via `<link rel="preload">` to start fetching the
  dataset as early as possible.
- Headings use `text-wrap: balance` for better visual rhythm on wider viewports.
- Comparison lets users select up to 5 languages via the + button on each card.
  A comparison bar shows selected languages with remove buttons, and a
  side-by-side trait table is available below the grid. The comparison panel is
  keyboard-accessible and announces selection changes to screen readers.
- A `@media print` stylesheet hides the UI chrome and outputs a clean reference
  card of the current filtered view.
- JSON-LD structured data is included for search engine understanding.
- `data.json` is the only thing you need to touch to add a language — the page
  count updates itself. Each language can optionally include a `url` field for
  its official homepage, which appears on the card and in the detail dialog.
  The filter vocabulary lives once in `index.js` (mirrored by the working notes
  in `data/optionslist.txt`), and the in-browser validation rejects any data
  value that isn't in that vocabulary.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, learn from it, build something
better.
