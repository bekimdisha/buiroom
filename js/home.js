(function () {
  const LATEST_COUNT = 8;

  async function render() {
    const [cities, listings] = await Promise.all([BR.api.getCities(), BR.api.getListings()]);

    const select = document.getElementById('city');
    BR.fillCities(select, cities, select.value);

    document.getElementById('city-chips').innerHTML = cities
      .map(c => `<a class="chip" href="search.html?city=${encodeURIComponent(c.id)}">${BR.esc(c.name)}</a>`)
      .join('');

    document.getElementById('latest').innerHTML = listings
      .slice(0, LATEST_COUNT)
      .map(l => BR.card(l, cities))
      .join('');
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('br:lang', render);
})();
