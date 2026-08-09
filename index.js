(() => {
  'use strict';

  const THEME_KEY = 'language-atlas-theme';

  // The option vocabulary below mirrors data/optionslist.txt (the original
  // working notes). Every value in data.json is validated against these lists
  // on load, so the dataset cannot silently drift from the filter UI.
  // Note: 'typing' and 'strength' are two separate filter groups that both
  // read the 'typing' field, so static/dynamic/gradual and strong/weak stay
  // independently filterable instead of being lumped into one OR-group.

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

  const state = { languages: [], selected: new Map(), search: '', sort: 'az' };

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

  function matches(language) {
    const query = state.search.trim().toLocaleLowerCase();
    if (query && !`${language.name} ${language.kind}`.toLocaleLowerCase().includes(query)) return false;
    return [...state.selected].every(([group, values]) => !values.size || hasSelectedValue(language[FIELD.get(group)], values));
  }

  function countFor(group, option) {
    const others = [...state.selected].filter(([selectedGroup]) => selectedGroup !== group);
    const query = state.search.trim().toLocaleLowerCase();
    return state.languages.filter((language) => {
      if (query && !`${language.name} ${language.kind}`.toLocaleLowerCase().includes(query)) return false;
      if (!others.every(([selectedGroup, values]) => !values.size || hasSelectedValue(language[FIELD.get(selectedGroup)], values))) return false;
      return asList(language[FIELD.get(group)]).includes(option);
    }).length;
  }

  const comparators = {
    az: (first, second) => first.name.localeCompare(second.name),
    za: (first, second) => second.name.localeCompare(first.name)
  };

  function card(language) {
    const tags = [language.paradigms[0], language.typing.includes('Gradual') ? 'Gradual' : language.typing[0], language.execution[0]];
    return `<button class="language-card" type="button" data-language="${safe(language.name)}" aria-label="Show traits for ${safe(language.name)}">
      <span class="card-top"><span class="card-title">${safe(language.name)}</span><span class="card-arrow">↗</span></span>
      <span class="kind">${safe(language.kind)}</span>
      <span class="tag-row">${tags.map((tag) => `<span class="tag">${safe(tag)}</span>`).join('')}</span>
    </button>`;
  }

  function render() {
    const visible = state.languages.filter(matches).sort(comparators[state.sort]);
    const active = [...state.selected].flatMap(([group, values]) => [...values].map((value) => ({ group, value })));
    elements.groups.innerHTML = FILTERS.map(([key, title, options]) => {
      const selected = state.selected.get(key);
      return `
      <section class="filter-group" aria-labelledby="${key}-heading">
        <div class="filter-group-head">
          <h3 id="${key}-heading">${title}</h3>
          <button class="group-clear" type="button" data-group-clear="${key}" ${selected?.size ? '' : 'hidden'}>Clear</button>
        </div>
        <div class="option-list">${options.map((option) => {
          const count = countFor(key, option);
          return `<button class="option" type="button" data-group="${key}" data-option="${safe(option)}" aria-pressed="${selected?.has(option) ? 'true' : 'false'}" aria-label="${safe(option)}, ${count} matching languages">
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
    elements.active.innerHTML = active.map(({ group, value }) => `<span class="filter-pill" role="listitem">${safe(FILTER_TITLES.get(group))}: ${safe(value)}<button type="button" data-remove="${safe(group)}" data-value="${safe(value)}" aria-label="Remove ${safe(value)}">×</button></span>`).join('');
    elements.sort.value = state.sort;
    syncUrl();
  }

  function toggle(group, option) {
    const values = state.selected.get(group) || new Set();
    if (values.has(option)) values.delete(option); else values.add(option);
    if (values.size) state.selected.set(group, values); else state.selected.delete(group);
    render();
  }

  function clearGroup(group) {
    state.selected.delete(group);
    render();
  }

  function clear() {
    state.selected.clear();
    state.search = '';
    elements.search.value = '';
    render();
  }

  function setSort(value) {
    state.sort = value === 'za' ? 'za' : 'az';
    render();
  }

  function serializeState() {
    const params = [];
    [...state.selected].forEach(([group, values]) => {
      if (values.size) params.push(`${encodeURIComponent(group)}=${[...values].map(encodeURIComponent).join(',')}`);
    });
    if (state.search) params.push(`search=${encodeURIComponent(state.search)}`);
    if (state.sort !== 'az') params.push(`sort=${encodeURIComponent(state.sort)}`);
    return params.length ? `#${params.join('&')}` : '#';
  }

  function parseState() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    state.selected = new Map();
    params.forEach((value, key) => {
      if (key === 'search') { state.search = value; return; }
      if (key === 'sort') { state.sort = value === 'za' ? 'za' : 'az'; return; }
      if (!FIELD.has(key)) return;
      const values = new Set(value.split(',').filter(Boolean));
      values.forEach((item) => { if (!GROUP_VALUES.get(key).has(item)) values.delete(item); });
      if (values.size) state.selected.set(key, values);
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
    elements.detailsList.replaceChildren(...FIELDS.map((field) => {
      const row = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = FIELD_TITLES[field];
      const values = document.createElement('span');
      values.textContent = asList(language[field]).join(' · ');
      row.append(label, values);
      return row;
    }));
    elements.details.showModal();
  }

  function setTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    elements.theme.setAttribute('aria-pressed', String(isLight));
    elements.theme.setAttribute('aria-label', `Use ${isLight ? 'dark' : 'light'} color theme`);
    storage.set(THEME_KEY, theme);
  }

  function setupEvents() {
    document.addEventListener('click', (event) => {
      const option = event.target.closest('.option');
      if (option) return toggle(option.dataset.group, option.dataset.option);
      const groupClear = event.target.closest('[data-group-clear]');
      if (groupClear) return clearGroup(groupClear.dataset.groupClear);
      const remove = event.target.closest('[data-remove]');
      if (remove) return toggle(remove.dataset.remove, remove.dataset.value);
      const language = event.target.closest('[data-language]');
      if (language) return showDetails(language.dataset.language);
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
    });
  }

  function isValidLanguage(language) {
    if (typeof language?.name !== 'string' || language.name.length === 0) return false;
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
})();
