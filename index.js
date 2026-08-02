(() => {
  'use strict';

  const FILTERS = [
    ['paradigms', 'Paradigm', ['Declarative', 'Functional', 'Imperative', 'Logic', 'Object-oriented', 'Procedural']],
    ['typing', 'Typing', ['Static', 'Dynamic', 'Gradual', 'Strong', 'Weak']],
    ['execution', 'Execution mode', ['Compiled', 'Interpreted']],
    ['platforms', 'Platform', ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Web Browser']],
    ['runtimes', 'Runtime', ['Standalone executable', 'Language-specific runtime', 'Common Language Runtime (.NET)', 'JVM (Java)', 'BEAM (Erlang)']]
  ];

  const state = { languages: [], selected: new Map(), search: '' };
  const elements = {
    groups: document.querySelector('#filter-groups'), grid: document.querySelector('#language-grid'),
    active: document.querySelector('#active-filters'), count: document.querySelector('#result-count'),
    kicker: document.querySelector('#result-kicker'), clear: document.querySelector('#clear-filters'),
    empty: document.querySelector('#empty-state'), search: document.querySelector('#search-input'),
    dialog: document.querySelector('#method-dialog'), theme: document.querySelector('#theme-toggle')
  };

  const safe = (text) => String(text).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const label = (name) => name === 'runtimes' ? 'Runtime' : name === 'platforms' ? 'Platform' : name === 'paradigms' ? 'Paradigm' : name === 'typing' ? 'Typing' : 'Execution mode';

  function buildFilters() {
    elements.groups.innerHTML = FILTERS.map(([key, title, options]) => `
      <section class="filter-group" aria-labelledby="${key}-heading">
        <h3 id="${key}-heading">${title}</h3>
        <div class="option-list">${options.map((option) => `<button class="option" type="button" data-group="${key}" data-option="${safe(option)}" aria-pressed="false">${safe(option)}</button>`).join('')}</div>
      </section>`).join('');
  }

  function matches(language) {
    const query = state.search.trim().toLocaleLowerCase();
    if (query && !`${language.name} ${language.kind}`.toLocaleLowerCase().includes(query)) return false;
    return [...state.selected].every(([group, values]) => !values.size || valuesHas(language[group], values));
  }

  function valuesHas(values, selected) { return values.some((value) => selected.has(value)); }

  function card(language) {
    const tags = [language.paradigms[0], language.typing.includes('Gradual') ? 'Gradual' : language.typing[0], language.execution[0]];
    return `<button class="language-card" type="button" data-language="${safe(language.name)}" aria-label="Show traits for ${safe(language.name)}">
      <span class="card-top"><h3>${safe(language.name)}</h3><span class="card-arrow">↗</span></span>
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
    elements.active.innerHTML = active.map(({ group, value }) => `<span class="filter-pill">${safe(label(group))}: ${safe(value)}<button type="button" data-remove="${safe(group)}" data-value="${safe(value)}" aria-label="Remove ${safe(value)}">×</button></span>`).join('');
    document.querySelectorAll('.option').forEach((option) => {
      const values = state.selected.get(option.dataset.group);
      option.setAttribute('aria-pressed', String(Boolean(values?.has(option.dataset.option))));
    });
  }

  function toggle(group, option) {
    const values = state.selected.get(group) || new Set();
    values.has(option) ? values.delete(option) : values.add(option);
    values.size ? state.selected.set(group, values) : state.selected.delete(group);
    render();
  }

  function clear() { state.selected.clear(); state.search = ''; elements.search.value = ''; render(); }

  function showDetails(name) {
    const language = state.languages.find((item) => item.name === name);
    if (!language) return;
    const traits = FILTERS.map(([key, title]) => `<p><strong>${title}</strong><span>${language[key].map(safe).join(' · ')}</span></p>`).join('');
    const details = document.querySelector('#details-dialog');
    if (details) details.remove();
    document.body.insertAdjacentHTML('beforeend', `<dialog id="details-dialog"><div class="dialog-head"><p class="eyebrow">${safe(language.kind).toUpperCase()}</p><button class="close-dialog" type="button" aria-label="Close details">×</button></div><h2>${safe(language.name)}</h2><div class="details-list">${traits}</div><form method="dialog"><button class="dialog-done" type="submit">Close</button></form></dialog>`);
    const dialog = document.querySelector('#details-dialog');
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.showModal();
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
    document.querySelector('#clear-filters').addEventListener('click', clear);
    document.querySelector('#empty-clear').addEventListener('click', clear);
    document.querySelectorAll('#method-button, #footer-method').forEach((button) => button.addEventListener('click', () => elements.dialog.showModal()));
    elements.dialog.querySelector('.close-dialog').addEventListener('click', () => elements.dialog.close());
    elements.theme.addEventListener('click', () => { document.body.classList.toggle('light'); const isLight = document.body.classList.contains('light'); elements.theme.setAttribute('aria-label', `Use ${isLight ? 'dark' : 'light'} color theme`); localStorage.setItem('language-atlas-theme', isLight ? 'light' : 'dark'); });
    document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement !== elements.search) { event.preventDefault(); elements.search.focus(); } if (event.key === 'Escape' && document.activeElement === elements.search) elements.search.blur(); });
  }

  async function init() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`Could not load data (${response.status})`);
      state.languages = await response.json();
      if (state.languages.length !== 83) throw new Error('The language dataset is incomplete.');
      if (localStorage.getItem('language-atlas-theme') === 'light') document.body.classList.add('light');
      buildFilters(); setupEvents(); render();
    } catch (error) {
      elements.grid.innerHTML = `<p class="load-error">Unable to load the offline atlas: ${safe(error.message)}. Open this folder through a local web server so the browser can read <code>data.json</code>.</p>`;
    }
  }

  init();
})();
