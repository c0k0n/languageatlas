# Language Atlas

A small, offline-friendly field guide to 83 programming languages. Filter them by
kind, paradigm, typing, execution mode, platform, and runtime — then click any
language to see its full trait sheet.

Built as a single static page. No frameworks, no build step, no dependencies,
no accounts, no tracking. Open it, and it just works.

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

## What this is not

This is not a ranking, not a popularity contest, and not an encyclopedia entry
for every language in existence. It's a starting point — a way to notice
languages you hadn't considered. When you find an interesting one, go read its
actual documentation before you commit to it. (This README's author believes
nobody should pick a language from a filter UI alone, including this one.)

## How the data works

- **Source of truth:** `data.json` — one entry per language.
- **Reference notes:** `data/` contains the original working lists (`languageslist.txt`, `optionslist.txt`).
- **Classification date:** July 2026. Languages change; this dataset is a snapshot, not a promise.

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
index.html      Page structure and the two dialogs
index.css       All styling (dark/light themes, responsive, reduced-motion aware)
index.js        Filtering, rendering, dialogs, theme persistence — vanilla JS
data.json       The dataset (83 languages, one entry each)
data/           Original working notes (not shipped)
_headers        Security + crawling headers, applied by Cloudflare Pages
robots.txt      Search-engine hints for languageatlas.pages.dev
sitemap.xml     Single-page sitemap for languageatlas.pages.dev
```

## Deploying

Any static host works. The files deploy as-is — copy `index.html`, `index.css`,
`index.js`, `data.json`, `robots.txt`, and `sitemap.xml` to the docroot. The
live site runs on Cloudflare Pages.

The `_headers` file is Cloudflare Pages-specific: it applies the security and
crawling headers (CSP, `X-Frame-Options`, `nosniff`, `X-Robots-Tag`, and
friends) when served from Pages. Other hosts won't read it, so if you deploy
elsewhere, set the equivalent headers in that host's config.

## Accessibility & quality notes

- Semantic HTML, keyboard-friendly, skip link, visible focus states, dialogs
  with proper labelling, `prefers-reduced-motion` respected, live region on the
  result count, and an `aria-keyshortcuts` hint for the "/" search shortcut.
- Filters are encoded in the page URL (via `history.replaceState`, so browser
  history stays clean), which makes filtered views shareable and bookmarkable.
- The dataset is validated in-browser on load: every entry must have all five
  trait groups plus a kind, non-empty values, and values that exist in the filter
  lists. Broken data fails loudly instead of rendering half a page.
- `data.json` is the only thing you need to touch to add a language — the page
  count updates itself. The filter vocabulary lives once in `index.js` (mirrored
  by the working notes in `data/optionslist.txt`), and the in-browser validation
  rejects any data value that isn't in that vocabulary.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, learn from it, build something
better.
