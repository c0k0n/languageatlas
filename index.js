(() => {
  'use strict';

  const THEME_KEY = 'language-atlas-theme';
  const COLLAPSED_KEY = 'language-atlas-collapsed';

  const FIELDS = ['paradigms', 'typing', 'execution', 'platforms', 'runtimes', 'kind'];

  const FILTERS = [
    ['kind', 'Kind', ['language', 'assembly language', 'shell language', 'query language', 'portable bytecode']],
    ['paradigms', 'Paradigm', ['Declarative', 'Functional', 'Imperative', 'Logic', 'Object-oriented', 'Procedural']],
    ['typing', 'Typing', ['Static', 'Dynamic', 'Gradual']],
    ['strength', 'Typing strength', ['Strong', 'Weak']],
    ['execution', 'Execution mode', ['Compiled', 'Interpreted']],
    ['platforms', 'Platform', ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Web Browser']],
    ['runtimes', 'Runtime', ['Standalone executable', 'Language-specific runtime', 'JavaScript runtime', 'Common Language Runtime (.NET)', 'JVM (Java)', 'BEAM (Erlang)']]
  ];

  const FIELD = new Map(FILTERS.map(([key]) => [key, key === 'strength' ? 'typing' : key]));
  const FILTER_TITLES = new Map(FILTERS.map(([key, title]) => [key, title]));
  const GROUP_VALUES = new Map(FILTERS.map(([key, , options]) => [key, new Set(options)]));
  const FIELD_VALUES = new Map();
  FIELDS.forEach((field) => {
    const values = new Set();
    FILTERS.forEach(([key, , options]) => {
      if (FIELD.get(key) === field) options.forEach((option) => values.add(option));
    });
    FIELD_VALUES.set(field, values);
  });

  const FIELD_TITLES = {
    paradigms: 'Paradigm',
    typing: 'Typing',
    execution: 'Execution mode',
    platforms: 'Platform',
    runtimes: 'Runtime',
    kind: 'Kind'
  };

  const state = { languages: [], selected: new Map(), excluded: new Map(), collapsed: new Set(), search: '', sort: 'az' };

  const elements = {
    groups: document.querySelector('#filter-groups'),
    grid: document.querySelector('#language-grid'),
    active: document.querySelector('#active-filters'),
    count: document.querySelector('#result-count'),
    kicker: document.querySelector('#result-kicker'),
    clear: document.querySelector('#clear-filters'),
    empty: document.querySelector('#empty-state'),
    emptyClear: document.querySelector('#empty-clear'),
    search: document.querySelector('#search-input'),
    sort: document.querySelector('#sort-select'),
    dialog: document.querySelector('#method-dialog'),
    details: document.querySelector('#details-dialog'),
    detailsTitle: document.querySelector('#details-title'),
    detailsKind: document.querySelector('#details-kind'),
    detailsList: document.querySelector('#details-list'),
    heroCount: document.querySelector('#hero-count'),
    theme: document.querySelector('#theme-toggle')
  };

  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ } }
  };

  const safe = (text) => String(text).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

  const asList = (value) => (Array.isArray(value) ? value : [value]);

  function hasSelectedValue(values, selected) {
    return asList(values).some((value) => selected.has(value));
  }

  function searchableText(language) {
    return [language.name, language.kind, ...language.paradigms, ...language.typing, ...language.execution, ...language.platforms, ...language.runtimes].join(' ').toLocaleLowerCase();
  }

  function highlight(text, query) {
    if (!query) return safe(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  function matches(language) {
    const query = state.search.trim().toLocaleLowerCase();
    if (query && !searchableText(language).includes(query)) return false;
    for (const [group, values] of state.selected) {
      if (values.size && !hasSelectedValue(language[FIELD.get(group)], values)) return false;
    }
    for (const [group, values] of state.excluded) {
      if (values.size && hasSelectedValue(language[FIELD.get(group)], values)) return false;
    }
    return true;
  }

  function countFor(group, option) {
    const query = state.search.trim().toLocaleLowerCase();
    return state.languages.filter((language) => {
      if (query && !searchableText(language).includes(query)) return false;
      for (const [g, values] of state.selected) {
        if (g !== group && values.size && !hasSelectedValue(language[FIELD.get(g)], values)) return false;
      }
      for (const [g, values] of state.excluded) {
        if (g !== group && values.size && hasSelectedValue(language[FIELD.get(g)], values)) return false;
      }
      return asList(language[FIELD.get(group)]).includes(option);
    }).length;
  }

  const comparators = {
    az: (first, second) => first.name.localeCompare(second.name),
    za: (first, second) => second.name.localeCompare(first.name)
  };

  function card(language) {
    const tags = [language.paradigms[0], language.typing.includes('Gradual') ? 'Gradual' : language.typing[0], language.execution[0]];
    const query = state.search.trim();
    const link = language.url
      ? `<a class="card-link" href="${safe(language.url)}" target="_blank" rel="noopener noreferrer" aria-label="${safe(language.name)} homepage" onclick="event.stopPropagation()">↗</a>`
      : '';
    return `<button class="language-card" type="button" data-language="${safe(language.name)}" aria-label="Show traits for ${safe(language.name)}">
      <span class="card-top"><span class="card-title">${highlight(language.name, query)}</span>${link}<span class="card-arrow">↗</span></span>
      <span class="kind">${highlight(language.kind, query)}</span>
      <span class="tag-row">${tags.map((tag) => `<span class="tag">${highlight(tag, query)}</span>`).join('')}</span>
    </button>`;
  }

  function sortedOptions(group, options) {
    return [...options].sort((a, b) => countFor(group, b) - countFor(group, a));
  }

  function render() {
    const visible = state.languages.filter(matches).sort(comparators[state.sort]);
    const active = [
      ...[...state.selected].flatMap(([group, values]) => [...values].map((value) => ({ group, value, type: 'include' }))),
      ...[...state.excluded].flatMap(([group, values]) => [...values].map((value) => ({ group, value, type: 'exclude' })))
    ];
    elements.groups.innerHTML = FILTERS.map(([key, title, options]) => {
      const selected = state.selected.get(key);
      const excluded = state.excluded.get(key);
      const isCollapsed = state.collapsed.has(key);
      const sorted = sortedOptions(key, options);
      return `
      <section class="filter-group" aria-labelledby="${key}-heading">
        <div class="filter-group-head">
          <button class="collapse-toggle" type="button" data-collapse="${key}" aria-expanded="${isCollapsed ? 'false' : 'true'}" aria-controls="${key}-options">
            <h3 id="${key}-heading">${title}</h3>
            <span class="chevron" aria-hidden="true"></span>
          </button>
          <button class="group-clear" type="button" data-group-clear="${key}" ${(selected?.size || excluded?.size) ? '' : 'hidden'}>Clear</button>
        </div>
        <div class="option-list" id="${key}-options" ${isCollapsed ? 'hidden' : ''}>${sorted.map((option) => {
          const count = countFor(key, option);
          const isExcluded = excluded?.has(option);
          const isSelected = selected?.has(option);
          const stateClass = isExcluded ? 'excluded' : isSelected ? 'included' : '';
          return `<button class="option ${stateClass}" type="button" data-group="${key}" data-option="${safe(option)}" aria-pressed="${isSelected ? 'true' : 'false'}" aria-label="${safe(option)}, ${count} matching languages${isExcluded ? ', excluded' : ''}">
            <span>${safe(option)}</span><span class="option-count">${count}</span>
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');
    elements.grid.innerHTML = visible.map(card).join('');
    elements.grid.hidden = !visible.length;
    elements.empty.hidden = Boolean(visible.length);
    elements.count.textContent = `${visible.length} ${visible.length === 1 ? 'language' : 'languages'}`;
    elements.kicker.textContent = active.length || state.search ? 'MATCHING YOUR VIEW' : 'ALL LANGUAGES';
    elements.clear.hidden = !active.length && !state.search;
    elements.active.innerHTML = active.map(({ group, value, type }) => {
      const label = type === 'exclude' ? `NOT ${safe(FILTER_TITLES.get(group))}: ${safe(value)}` : `${safe(FILTER_TITLES.get(group))}: ${safe(value)}`;
      return `<li class="filter-pill ${type === 'exclude' ? 'excluded' : ''}">${label}<button type="button" data-remove="${safe(group)}" data-value="${safe(value)}" aria-label="Remove ${safe(value)}">×</button></li>`;
    }).join('');
    elements.sort.value = state.sort;
    syncUrl();
  }

  function toggle(group, option) {
    const values = state.selected.get(group) || new Set();
    if (values.has(option)) values.delete(option); else values.add(option);
    if (values.size) state.selected.set(group, values); else state.selected.delete(group);
    const excluded = state.excluded.get(group);
    if (excluded?.has(option)) excluded.delete(option);
    render();
  }

  function toggleExcluded(group, option) {
    const values = state.excluded.get(group) || new Set();
    if (values.has(option)) values.delete(option); else values.add(option);
    if (values.size) state.excluded.set(group, values); else state.excluded.delete(group);
    const selected = state.selected.get(group);
    if (selected?.has(option)) selected.delete(option);
    render();
  }

  function clearGroup(group) {
    state.selected.delete(group);
    state.excluded.delete(group);
    render();
  }

  function clear() {
    state.selected.clear();
    state.excluded.clear();
    state.search = '';
    elements.search.value = '';
    render();
  }

  function setSort(value) {
    state.sort = value === 'za' ? 'za' : 'az';
    render();
  }

  function toggleCollapse(group) {
    if (state.collapsed.has(group)) state.collapsed.delete(group); else state.collapsed.add(group);
    storage.set(COLLAPSED_KEY, JSON.stringify([...state.collapsed]));
    render();
  }

  function serializeState() {
    const params = [];
    [...state.selected].forEach(([group, values]) => {
      if (values.size) params.push(`${encodeURIComponent(group)}=${[...values].map(encodeURIComponent).join(',')}`);
    });
    [...state.excluded].forEach(([group, values]) => {
      if (values.size) params.push(`exclude_${encodeURIComponent(group)}=${[...values].map(encodeURIComponent).join(',')}`);
    });
    if (state.search) params.push(`search=${encodeURIComponent(state.search)}`);
    if (state.sort !== 'az') params.push(`sort=${encodeURIComponent(state.sort)}`);
    return params.length ? `#${params.join('&')}` : '#';
  }

  function parseState() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    state.selected = new Map();
    state.excluded = new Map();
    params.forEach((value, key) => {
      if (key === 'search') { state.search = value; return; }
      if (key === 'sort') { state.sort = value === 'za' ? 'za' : 'az'; return; }
      const isExclude = key.startsWith('exclude_');
      const groupKey = isExclude ? key.slice(8) : key;
      if (!FIELD.has(groupKey)) return;
      const target = isExclude ? state.excluded : state.selected;
      const values = new Set(value.split(',').filter(Boolean));
      values.forEach((item) => { if (!GROUP_VALUES.get(groupKey).has(item)) values.delete(item); });
      if (values.size) target.set(groupKey, values);
    });
    if (!params.has('search')) state.search = '';
    if (!params.has('sort')) state.sort = 'az';
  }

  function syncUrl() {
    try {
      const next = serializeState();
      if (window.location.hash !== next) history.replaceState(null, '', next);
    } catch { /* hash sync is a nicety, never a blocker */ }
  }

  function showDetails(name) {
    const language = state.languages.find((item) => item.name === name);
    if (!language) return;
    elements.detailsTitle.textContent = language.name;
    elements.detailsKind.textContent = language.kind.toUpperCase();
    const rows = FIELDS.map((field) => {
      const row = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = FIELD_TITLES[field];
      const values = document.createElement('span');
      values.textContent = asList(language[field]).join(' · ');
      row.append(label, values);
      return row;
    });
    if (language.url) {
      const row = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = 'Home';
      const link = document.createElement('span');
      const a = document.createElement('a');
      a.href = language.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = language.url;
      link.append(a);
      row.append(label, link);
      rows.push(row);
    }
    elements.detailsList.replaceChildren(...rows);
    elements.details.showModal();
  }

  function setTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    elements.theme.setAttribute('aria-pressed', String(isLight));
    elements.theme.setAttribute('aria-label', `Use ${isLight ? 'dark' : 'light'} color theme`);
    storage.set(THEME_KEY, theme);
  }

  let longPressTimer = null;

  function setupEvents() {
    document.addEventListener('click', (event) => {
      const collapse = event.target.closest('[data-collapse]');
      if (collapse) { toggleCollapse(collapse.dataset.collapse); return; }
      const option = event.target.closest('.option');
      if (option) return toggle(option.dataset.group, option.dataset.option);
      const groupClear = event.target.closest('[data-group-clear]');
      if (groupClear) return clearGroup(groupClear.dataset.groupClear);
      const remove = event.target.closest('[data-remove]');
      if (remove) return toggle(remove.dataset.remove, remove.dataset.value);
      const language = event.target.closest('[data-language]');
      if (language) return showDetails(language.dataset.language);
    });

    document.addEventListener('contextmenu', (event) => {
      const option = event.target.closest('.option');
      if (option) {
        event.preventDefault();
        toggleExcluded(option.dataset.group, option.dataset.option);
      }
    });

    document.addEventListener('pointerdown', (event) => {
      const option = event.target.closest('.option');
      if (!option) return;
      longPressTimer = setTimeout(() => {
        toggleExcluded(option.dataset.group, option.dataset.option);
        longPressTimer = null;
      }, 500);
    });

    document.addEventListener('pointerup', () => { clearTimeout(longPressTimer); longPressTimer = null; });
    document.addEventListener('pointercancel', () => { clearTimeout(longPressTimer); longPressTimer = null; });
    document.addEventListener('pointermove', (event) => {
      if (longPressTimer && event.target.closest('.option')) return;
      clearTimeout(longPressTimer);
      longPressTimer = null;
    });

    elements.search.addEventListener('input', () => { state.search = elements.search.value; render(); });
    elements.sort.addEventListener('change', () => setSort(elements.sort.value));
    elements.clear.addEventListener('click', clear);
    elements.emptyClear.addEventListener('click', clear);
    window.addEventListener('hashchange', () => { parseState(); elements.search.value = state.search; render(); });
    document.querySelectorAll('#method-button, #footer-method').forEach((button) => button.addEventListener('click', () => elements.dialog.showModal()));
    elements.dialog.querySelector('.close-dialog').addEventListener('click', () => elements.dialog.close());
    elements.details.querySelector('.close-dialog').addEventListener('click', () => elements.details.close());
    [elements.dialog, elements.details].forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
    elements.theme.addEventListener('click', () => setTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && document.activeElement !== elements.search) { event.preventDefault(); elements.search.focus(); }
      if (event.key === 'Escape' && document.activeElement === elements.search) elements.search.blur();
      if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && event.target.classList.contains('option')) {
        const options = [...event.target.closest('.option-list').querySelectorAll('.option')];
        const index = options.indexOf(event.target);
        const next = event.key === 'ArrowRight'
          ? options[index + 1] || options[0]
          : options[index - 1] || options[options.length - 1];
        next.focus();
        event.preventDefault();
      }
    });
  }

  function isValidLanguage(language) {
    if (typeof language?.name !== 'string' || language.name.length === 0) return false;
    if (language.url !== undefined && typeof language.url !== 'string') return false;
    return FIELDS.every((field) => {
      const values = asList(language[field]);
      return values.length > 0 && values.every((value) => typeof value === 'string' && FIELD_VALUES.get(field).has(value));
    });
  }

  function validate(languages) {
    if (!Array.isArray(languages)) throw new Error('The language dataset is malformed.');
    const names = new Set();
    languages.forEach((language) => {
      if (!isValidLanguage(language)) throw new Error(`Invalid entry: ${typeof language?.name === 'string' ? language.name : 'unnamed'}.`);
      if (names.has(language.name)) throw new Error(`Duplicate entry: ${language.name}.`);
      names.add(language.name);
    });
  }

  async function init() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`Could not load data (${response.status})`);
      const languages = await response.json();
      validate(languages);
      state.languages = languages;
      const savedCollapsed = storage.get(COLLAPSED_KEY);
      if (savedCollapsed) {
        try { state.collapsed = new Set(JSON.parse(savedCollapsed)); } catch { /* ignore */ }
      }
      parseState();
      elements.search.value = state.search;
      elements.heroCount.textContent = languages.length;
      setTheme(storage.get(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
      setupEvents();
      render();
    } catch (error) {
      elements.grid.innerHTML = `<p class="load-error">Unable to load the offline atlas: ${safe(error.message)}. Open this folder through a local web server so the browser can read <code>data.json</code>.</p>`;
    }
  }

  init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
})();
