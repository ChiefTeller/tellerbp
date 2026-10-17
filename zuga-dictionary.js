(() => {
  const search = document.querySelector('#term-search');
  const sections = [...document.querySelectorAll('#dictionary .dictionary-section')];
  const status = document.querySelector('#search-status');
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().replace(/[\u0591-\u05c7]/g, '').replace(/\s+/g, ' ').trim();
  const records = sections.map(section => ({section, title: normalize(section.querySelector('h2').textContent), entries: [...section.querySelectorAll('.dictionary-entry')].map(node => ({node, text: normalize(node.textContent)}))}));
  const total = records.reduce((n, r) => n + r.entries.length, 0);
  const update = () => {
    const query = normalize(search.value);
    let visible = 0;
    records.forEach(record => {
      let shown = 0;
      record.entries.forEach(entry => {
        const matches = !query || entry.text.includes(query) || record.title.includes(query);
        entry.node.hidden = !matches;
        if (matches) shown++;
      });
      record.section.hidden = shown === 0;
      visible += shown;
    });
    status.textContent = query ? `${visible} מתוך ${total} ערכים תואמים לחיפוש` : `${total} ערכים ב־21 תחומים`;
    document.querySelector('#empty-search').hidden = visible !== 0;
  };
  search.addEventListener('input', update);
  document.querySelector('#clear-search').addEventListener('click', () => {search.value = ''; update(); search.focus();});
  document.querySelector('.dictionary-search').hidden = false;
  update();
  document.querySelector('.contents').addEventListener('click', event => {
    if (event.target.closest('a') && search.value) { search.value = ''; update(); }
  });
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.closest('#dictionary') && search.value) {search.value = ''; update(); target.scrollIntoView();}
  });
})();
