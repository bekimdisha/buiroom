(function () {
  const { t, esc } = BR;
  const id = new URLSearchParams(location.search).get('id');
  const MONTHS = {
    sq: ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  function availableFrom(iso) {
    const date = new Date(iso + 'T00:00:00');
    if (date <= new Date()) return t('fact.now');
    // Month names are spelled out here because browsers do not reliably ship Albanian locale data.
    return `${date.getDate()} ${MONTHS[BR.getLang()][date.getMonth()]} ${date.getFullYear()}`;
  }

  function gallery(listing) {
    const photos = listing.photos.length ? listing.photos : [BR.placeholder(listing)];
    const thumbs = photos.length > 1
      ? `<div class="thumbs">${photos.map((src, i) =>
          `<button type="button" data-photo="${esc(src)}" aria-current="${i === 0}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>`
      : '';
    return `<div class="gallery-main"><img id="main-photo" src="${esc(photos[0])}" alt="${esc(listing.photos.length ? listing.title : t('d.noPhoto'))}"></div>${thumbs}`;
  }

  function fact(label, value) {
    return `<div><dt>${esc(t(label))}</dt><dd>${esc(value)}</dd></div>`;
  }

  async function render() {
    const root = document.getElementById('detail');
    const [cities, listing] = await Promise.all([BR.api.getCities(), id ? BR.api.getListing(id) : null]);

    if (!listing) {
      document.title = 'BuiRoom';
      root.innerHTML = `<div class="empty" style="margin-bottom: 56px"><p>${esc(t('d.notFound'))}</p></div>`;
      return;
    }

    document.title = `${listing.title} | BuiRoom`;
    const place = [BR.cityName(cities, listing.city), listing.neighbourhood].filter(Boolean).join(', ');
    const digits = listing.phone.replace(/\D/g, '');
    const message = encodeURIComponent(t('c.message', { title: listing.title }));

    root.innerHTML = `
      <div class="detail">
        <article>
          ${gallery(listing)}
          <h1>${esc(listing.title)}</h1>
          <p class="muted">${esc(place)}</p>
          <p class="card-meta"><span>${esc(BR.posted(listing.postedAt))}</span>${listing.verified ? `<span class="verified">✓ ${esc(t('verified'))}</span>` : ''}</p>

          <dl class="facts">
            ${fact('fact.type', t('type.' + listing.type))}
            ${fact('fact.area', listing.area + ' m²')}
            ${fact('fact.bedrooms', listing.bedrooms === 0 ? t('fact.studio') : listing.bedrooms)}
            ${fact('fact.floor', listing.floor)}
            ${fact('fact.furnishing', t(listing.furnished ? 'furnished.yes' : 'furnished.no'))}
            ${fact('fact.available', availableFrom(listing.availableFrom))}
          </dl>

          ${listing.amenities.length ? `
            <h2>${esc(t('d.amenities'))}</h2>
            <ul class="tags">${listing.amenities.map(a => `<li>${esc(t('am.' + a))}</li>`).join('')}</ul>` : ''}

          <h2>${esc(t('d.description'))}</h2>
          <p>${esc(listing.description)}</p>
        </article>

        <aside class="contact">
          <div class="price">${BR.price(listing.price)}<small>${esc(t('per.month'))}</small></div>
          <h2 style="font-size: 1rem">${esc(t('c.title'))}</h2>
          <a class="btn btn-wa btn-block" href="https://wa.me/${digits}?text=${message}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn btn-block" href="viber://chat?number=%2B${digits}">Viber</a>
          <a class="btn btn-block" href="tel:+${digits}">${esc(t('c.call'))}</a>
          <p class="tip">${esc(t('c.tip'))}</p>
          <div class="contact-links">
            <button type="button" id="share">${esc(t('c.share'))}</button>
            <button type="button" data-soon>${esc(t('c.report'))}</button>
          </div>
        </aside>
      </div>`;

    root.querySelectorAll('[data-photo]').forEach(btn => btn.addEventListener('click', () => {
      document.getElementById('main-photo').src = btn.dataset.photo;
      root.querySelectorAll('[data-photo]').forEach(b => b.setAttribute('aria-current', String(b === btn)));
    }));

    document.getElementById('share').addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: listing.title, url: location.href });
        else {
          await navigator.clipboard.writeText(location.href);
          BR.toast(t('c.copied'));
        }
      } catch (e) { /* share cancelled or clipboard unavailable */ }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Return to the search the visitor came from, keeping their filters.
    if (document.referrer.includes('search.html')) document.getElementById('back').href = document.referrer;
    render();
  });
  document.addEventListener('br:lang', render);
})();
