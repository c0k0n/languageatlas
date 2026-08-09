(() => {
  'use strict';

  const THEME_KEY = 'language-atlas-theme';

  const FILTERS = [
    ['paradigms', 'Paradigm', ['Declarative', 'Functional', 'Imperative', 'Logic', 'Object-oriented', 'Procedural']],
    ['typing', 'Typing', ['Static', 'Dynamic', 'Gradual', 'Strong', 'Weak']],
    ['execution', 'Execution mode', ['Compiled', 'Interpreted']],
    ['platforms', 'Platform', ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Web Browser']],
    ['runtimes', 'Runtime', ['Standalone executable', 'Language-specific runtime', 'Common Language Runtime (.NET)', 'JVM (Java)', 'BEAM (Erlang)']]
  ];

  const FILTER_TITLES = new Map(FILTERS.map(([key, title]) => [key, title]));
  const FILTER_VALUES = new Map(FILTERS.map(([key, , options]) => [key, new Set(options)]));

  const state = { languages: [], selected: new Map(), search: '' };

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

  function buildFilters() {
    elements.groups.innerHTML = FILTERS.map(([key, title, options]) => `
      <section class="filter-group" aria-labelledby="${key}-heading">
        <h3 id="${key}-heading">${title}</h3>
        <div class="option-list">${options.map((option) => `<button class="option" type="button" data-group="${key}" data-option="${safe(option)}" aria-pressed="false">${safe(option)}</button>`).join('')}</div>
      </section>`).join('');
  }

  function hasSelectedValue(values, selected) {
    return values.some((value) => selected.has(value));
  }

  function matches(language) {
    const query = state.search.trim().toLocaleLowerCase();
    if (query && !`${language.name} ${language.kind}`.toLocaleLowerCase().includes(query)) return false;
    return [...state.selected].every(([group, values]) => !values.size || hasSelectedValue(language[group], values));
  }

  function card(language) {
    const tags = [language.paradigms[0], language.typing.includes('Gradual') ? 'Gradual' : language.typing[0], language.execution[0]];
    return `<button class="language-card" type="button" data-language="${safe(language.name)}" aria-label="Show traits for ${safe(language.name)}">
      <span class="card-top"><span class="card-title">${safe(language.name)}</span><span class="card-arrow">↗</span></span>
      <span class="kind">${safe(language.kind)}</span>
      <span class="tag-row">${tags.map((tag) => `<span class="tag">${safe(tag)}</span>`).join('')}</span>
    </button>`;
  }

  function render() {
    const visible = state.languages.filter(matches).sort((first, second) => first.name.localeCompare(second.name));
    const active = [...state.selected].flatMap(([group, values]) => [...values].map((value) => ({ group, value })));
    elements.grid.innerHTML = visible.map(card).join('');
    elements.grid.hidden = !visible.length;
    elements.empty.hidden = Boolean(visible.length);
    elements.count.textContent = `${visible.length} ${visible.length === 1 ? 'language' : 'languages'}`;
    elements.kicker.textContent = active.length || state.search ? 'MATCHING YOUR VIEW' : 'ALL LANGUAGES';
    elements.clear.hidden = !active.length && !state.search;
    elements.active.innerHTML = active.map(({ group, value }) => `<span class="filter-pill" role="listitem">${safe(FILTER_TITLES.get(group))}: ${safe(value)}<button type="button" data-remove="${safe(group)}" data-value="${safe(value)}" aria-label="Remove ${safe(value)}">×</button></span>`).join('');
    elements.groups.querySelectorAll('.option').forEach((option) => {
      const values = state.selected.get(option.dataset.group);
      option.setAttribute('aria-pressed', String(Boolean(values?.has(option.dataset.option))));
    });
  }

  function toggle(group, option) {
    const values = state.selected.get(group) || new Set();
    if (values.has(option)) values.delete(option); else values.add(option);
    if (values.size) state.selected.set(group, values); else state.selected.delete(group);
    render();
  }

  function clear() {
    state.selected.clear();
    state.search = '';
    elements.search.value = '';
    render();
  }

  function showDetails(name) {
    const language = state.languages.find((item) => item.name === name);
    if (!language) return;
    elements.detailsTitle.textContent = language.name;
    elements.detailsKind.textContent = language.kind.toUpperCase();
    elements.detailsList.replaceChildren(...FILTERS.map(([key, title]) => {
      const row = document.createElement('p');
      const label = document.createElement('strong');
      label.textContent = title;
      const values = document.createElement('span');
      values.textContent = language[key].join(' · ');
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
      const remove = event.target.closest('[data-remove]');
      if (remove) return toggle(remove.dataset.remove, remove.dataset.value);
      const language = event.target.closest('[data-language]');
      if (language) return showDetails(language.dataset.language);
    });
    elements.search.addEventListener('input', () => { state.search = elements.search.value; render(); });
    elements.clear.addEventListener('click', clear);
    elements.emptyClear.addEventListener('click', clear);
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
    return typeof language?.name === 'string' && language.name.length > 0 &&
      FILTERS.every(([key]) => Array.isArray(language[key]) && language[key].length > 0 &&
        language[key].every((value) => FILTER_VALUES.get(key).has(value)));
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
      elements.heroCount.textContent = languages.length;
      setTheme(storage.get(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
      buildFilters();
      setupEvents();
      render();
    } catch (error) {
      elements.grid.innerHTML = `<p class="load-error">Unable to load the offline atlas: ${safe(error.message)}. Open this folder through a local web server so the browser can read <code>data.json</code>.</p>`;
    }
  }

  init();
})();
