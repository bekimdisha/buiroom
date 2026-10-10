// Data access layer. Pages call these async functions only, so the sample
// data in data/listings.js can be swapped for a real backend without touching them.
(function () {
  const data = window.BUIROOM_DATA;
  const DAY = 24 * 60 * 60 * 1000;

  const EXPIRY_DAYS = 30;
  const STORE_KEY = 'br-listings';

  // Prototype storage: listings posted from this browser live in localStorage.
  function readPosted() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }

  const withDates = l => ({ ...l, postedAt: l.postedAt ? new Date(l.postedAt) : new Date(Date.now() - l.postedDaysAgo * DAY) });

  function all() {
    return [...data.listings, ...readPosted()].map(withDates).filter(l => Date.now() - l.postedAt < EXPIRY_DAYS * DAY);
  }

  async function getCities() {
    return data.cities;
  }

  // filters: { city, type, min, max, furnished, sort }
  async function getListings(filters = {}) {
    const { city, type, min, max, furnished, sort } = filters;
    const out = all().filter(l =>
      (!city || l.city === city) &&
      (!type || l.type === type) &&
      (!min || l.price >= min) &&
      (!max || l.price <= max) &&
      (!furnished || l.furnished)
    );
    if (sort === 'cheapest') out.sort((a, b) => a.price - b.price);
    else if (sort === 'priciest') out.sort((a, b) => b.price - a.price);
    else out.sort((a, b) => b.postedAt - a.postedAt);
    return out;
  }

  async function getListing(id) {
    return all().find(l => l.id === id) || null;
  }

  // Throws if the browser cannot store the listing (for example, storage is full).
  async function createListing(input) {
    const listing = { ...input, id: 'u' + Date.now().toString(36), verified: false, postedAt: new Date().toISOString() };
    localStorage.setItem(STORE_KEY, JSON.stringify([...readPosted(), listing]));
    return listing;
  }

  window.BR = window.BR || {};
  BR.api = { getCities, getListings, getListing, createListing };
})();
