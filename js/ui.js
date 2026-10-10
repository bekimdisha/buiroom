// Shared helpers and header behaviour used by every page.
(function () {
  const { t } = BR;
  const DAY = 24 * 60 * 60 * 1000;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const price = n => '€' + Number(n).toLocaleString('en-US');

  function posted(date) {
    const days = Math.floor((Date.now() - date) / DAY);
    if (days <= 0) return t('posted.today');
    if (days === 1) return t('posted.yesterday');
    return t('posted.days', { n: days });
  }

  function cityName(cities, id) {
    const c = cities.find(c => c.id === id);
    return c ? c.name : id;
  }

  // Listings without photos get a lightweight inline SVG instead of a stored image.
  const TINTS = ['#f1ede6', '#e9eef0', '#edf0e8', '#f0eaea', '#ecebf1'];
  const GLYPHS = {
    room: '<path d="M70 118v-30h100v30M62 150v-24a8 8 0 0 1 8-8h100a8 8 0 0 1 8 8v24M62 142h116M84 104h28v14H84zM128 104h28v14h-28z"/>',
    apartment: '<path d="M82 156V60h76v96M70 156h100M100 78h12M128 78h12M100 100h12M128 100h12M100 122h12M128 122h12M112 156v-16h16v16"/>',
  };
  function placeholder(listing) {
    const n = parseInt(listing.id.replace(/\D/g, ''), 10) || 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" fill="${TINTS[n % TINTS.length]}"/><g fill="none" stroke="#1a1a1a" stroke-opacity=".3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[listing.type] || GLYPHS.room}</g></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  const cover = listing => listing.photos[0] || placeholder(listing);

  function card(listing, cities) {
    const place = [cityName(cities, listing.city), listing.neighbourhood].filter(Boolean).join(', ');
    return `
      <a class="card" href="listing.html?id=${encodeURIComponent(listing.id)}">
        <div class="card-img"><img src="${esc(cover(listing))}" alt="" loading="lazy" width="240" height="180"></div>
        <div class="card-body">
          <div class="price">${price(listing.price)}<small>${esc(t('per.month'))}</small></div>
          <h3>${esc(listing.title)}</h3>
          <p class="muted">${esc(t('type.' + listing.type))} · ${esc(place)} · ${listing.area} m²</p>
          <p class="card-meta"><span>${esc(posted(listing.postedAt))}</span>${listing.verified ? `<span class="verified">✓ ${esc(t('verified'))}</span>` : ''}</p>
        </div>
      </a>`;
  }

  function fillCities(select, cities, selected) {
    select.innerHTML = `<option value="">${esc(t('f.allCities'))}</option>` +
      cities.map(c => `<option value="${esc(c.id)}"${c.id === selected ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  }

  let toastTimer;
  function toast(message) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    BR.applyI18n();
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.addEventListener('click', BR.toggleLang);
  });

  // Features that are planned but not built yet.
  document.addEventListener('click', e => {
    const soon = e.target.closest('[data-soon]');
    if (soon) {
      e.preventDefault();
      toast(t('soon'));
    }
  });

  Object.assign(BR, { esc, price, posted, cityName, placeholder, cover, card, fillCities, toast });
})();
