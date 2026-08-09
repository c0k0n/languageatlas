# Language Atlas

A small, offline-friendly field guide to 83 programming languages. Filter them by
paradigm, typing, execution mode, platform, and runtime — then click any language
to see its full trait sheet.

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
section and narrow across sections. Search narrows everything.

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
  result count.
- The dataset is validated in-browser on load: every entry must have all five
  trait groups, non-empty values, and values that exist in the filter lists.
  Broken data fails loudly instead of rendering half a page.
- `data.json` is the only thing you need to touch to add a language — the page
  count updates itself.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, learn from it, build something
better.
