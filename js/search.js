(function () {
  const { t } = BR;
  let form, cities;

  // The URL is the source of truth for filters, so searches can be shared and bookmarked.
  function readUrl() {
    const p = new URLSearchParams(location.search);
    return {
      city: p.get('city') || '',
      type: p.get('type') || '',
      min: Number(p.get('min')) || 0,
      max: Number(p.get('max')) || 0,
      furnished: p.get('furnished') === '1',
      sort: p.get('sort') || '',
    };
  }

  function readForm() {
    const d = new FormData(form);
    return {
      city: d.get('city') || '',
      type: d.get('type') || '',
      min: Number(d.get('min')) || 0,
      max: Number(d.get('max')) || 0,
      furnished: d.get('furnished') === '1',
      sort: d.get('sort') || '',
    };
  }

  function writeForm(f) {
    BR.fillCities(form.elements.city, cities, f.city);
    form.querySelectorAll('input[name="type"]').forEach(radio => { radio.checked = radio.value === f.type; });
    form.elements.min.value = f.min || '';
    form.elements.max.value = f.max || '';
    form.elements.furnished.checked = f.furnished;
    form.elements.sort.value = f.sort;
  }

  function writeUrl(f) {
    const p = new URLSearchParams();
    if (f.city) p.set('city', f.city);
    if (f.type) p.set('type', f.type);
    if (f.min) p.set('min', f.min);
    if (f.max) p.set('max', f.max);
    if (f.furnished) p.set('furnished', '1');
    if (f.sort) p.set('sort', f.sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  async function render(f) {
    const listings = await BR.api.getListings(f);
    const results = document.getElementById('results');
    const filtered = Boolean(f.city || f.type || f.min || f.max || f.furnished);

    document.getElementById('count').textContent =
      listings.length === 1 ? t('res.one') : t('res.many', { n: listings.length });
    document.getElementById('clear').hidden = !filtered;

    if (listings.length) {
      results.className = 'grid';
      results.innerHTML = listings.map(l => BR.card(l, cities)).join('');
    } else {
      results.className = '';
      results.innerHTML = `<div class="empty"><p>${BR.esc(t('res.none'))}</p></div>`;
    }
  }

  function update() {
    const f = readForm();
    writeUrl(f);
    render(f);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    form = document.getElementById('filters');
    cities = await BR.api.getCities();
    const f = readUrl();
    writeForm(f);
    render(f);

    form.addEventListener('input', update);
    form.addEventListener('submit', e => e.preventDefault());
    document.getElementById('clear').addEventListener('click', () => {
      const sort = form.elements.sort.value;
      writeForm({ city: '', type: '', min: 0, max: 0, furnished: false, sort });
      update();
    });
  });

  document.addEventListener('br:lang', () => {
    if (!form) return;
    const f = readForm();
    writeForm(f);
    render(f);
  });
})();
