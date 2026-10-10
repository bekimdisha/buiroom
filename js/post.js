(function () {
  const { t, esc } = BR;
  const MAX_PHOTOS = 5;
  const MAX_EDGE = 1280; // longest side in pixels after shrinking
  const QUALITY = 0.75;

  let form, cities, current = 0;
  const photos = []; // compressed images as data URLs

  // Shrinks a photo in the browser so only a small file ever needs storing.
  async function compress(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', QUALITY);
    // Browsers that cannot encode WebP silently return PNG, which is far larger.
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', QUALITY);
  }

  function renderPhotos() {
    document.getElementById('photos').innerHTML = photos.map((src, i) =>
      `<div class="photo"><img src="${esc(src)}" alt=""><button type="button" data-remove="${i}">${esc(t('p.remove'))}</button></div>`).join('');
    document.getElementById('add-photos').hidden = photos.length >= MAX_PHOTOS;
  }

  async function addPhotos(files) {
    let failed = false;
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      try { photos.push(await compress(file)); } catch (e) { failed = true; }
    }
    renderPhotos();
    if (failed) BR.toast(t('p.photoError'));
  }

  // Accepts "069 123 4567", "+355 69 123 4567" or "69 123 4567"; returns "+35569..." or null.
  function normalisePhone(raw) {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('355')) digits = digits.slice(3);
    digits = digits.replace(/^0+/, '');
    return /^\d{8,9}$/.test(digits) ? '+355' + digits : null;
  }

  function draft() {
    const d = new FormData(form);
    return {
      type: d.get('type'),
      title: d.get('title').trim(),
      city: d.get('city'),
      neighbourhood: d.get('neighbourhood').trim(),
      price: Number(d.get('price')),
      area: Number(d.get('area')),
      bedrooms: Number(d.get('bedrooms')),
      floor: Number(d.get('floor')),
      furnished: d.get('furnished') === '1',
      availableFrom: d.get('availableFrom'),
      amenities: d.getAll('amenities'),
      description: d.get('description').trim(),
      photos: [...photos],
      phone: normalisePhone(d.get('phone')) || '',
    };
  }

  function show(step) {
    current = step;
    form.querySelectorAll('.step').forEach(el => { el.hidden = Number(el.dataset.step) !== step; });
    document.querySelectorAll('#stepper li').forEach((li, i) => {
      li.classList.toggle('done', i < step);
      if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    if (step === 2) renderPreview();
    window.scrollTo(0, 0);
  }

  function renderPreview() {
    document.getElementById('preview').innerHTML = BR.card({ ...draft(), id: 'u0', verified: false, postedAt: new Date() }, cities);
  }

  // Checks only the fields of the visible step and points the visitor at the first problem.
  function stepValid() {
    const phone = form.elements.phone;
    phone.setCustomValidity(current === 2 && !normalisePhone(phone.value) ? t('p.phoneInvalid') : '');
    const fields = form.querySelector(`.step[data-step="${current}"]`).querySelectorAll('input, select, textarea');
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function fillCities() {
    const select = form.elements.city;
    const selected = select.value;
    select.innerHTML = `<option value="">${esc(t('p.chooseCity'))}</option>` +
      cities.map(c => `<option value="${esc(c.id)}"${c.id === selected ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  }

  async function publish(e) {
    e.preventDefault();
    if (!stepValid()) return;
    try {
      const listing = await BR.api.createListing(draft());
      document.getElementById('view-link').href = 'listing.html?id=' + encodeURIComponent(listing.id);
      document.getElementById('wizard').hidden = true;
      document.getElementById('success').hidden = false;
      window.scrollTo(0, 0);
    } catch (err) {
      BR.toast(t('p.storageError'));
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    form = document.getElementById('post-form');
    cities = await BR.api.getCities();
    fillCities();

    const now = new Date();
    const today = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.elements.availableFrom.value = today;
    form.elements.availableFrom.min = today;

    form.addEventListener('click', e => {
      if (e.target.closest('[data-next]') && stepValid()) show(current + 1);
      if (e.target.closest('[data-back]')) show(current - 1);
      const remove = e.target.closest('[data-remove]');
      if (remove) {
        photos.splice(Number(remove.dataset.remove), 1);
        renderPhotos();
      }
    });
    form.elements.phone.addEventListener('input', e => e.target.setCustomValidity(''));
    document.getElementById('photo-input').addEventListener('change', async e => {
      await addPhotos(e.target.files);
      e.target.value = '';
    });
    form.addEventListener('submit', publish);

    show(0);
  });

  document.addEventListener('br:lang', () => {
    if (!form) return;
    fillCities();
    renderPhotos();
    if (current === 2) renderPreview();
  });
})();
