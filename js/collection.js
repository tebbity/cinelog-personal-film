// =============================================
// CINELOG - collection.js
// =============================================

let currentFilters = { genre: 'semua', year: 'semua', sort: 'judul', status: null };

function renderPage() {
  const filtered = MovieStore.filterBy(currentFilters);
  const grid = document.getElementById('collectionGrid');
  const emptyState = document.getElementById('emptyState');
  const count = document.getElementById('collectionCount');

  if (count) count.textContent = `${filtered.length} film`;

  if (!filtered.length) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (!grid) return;

  grid.innerHTML = filtered.map(m =>
    createMovieCard(m, {
      showStatus: true,
      actions: ['detail', 'watched', 'watchlist', 'review']
    })
  ).join('');
}

function resetFilters() {
  currentFilters = { genre: 'semua', year: 'semua', sort: 'judul', status: null };
  document.getElementById('filterGenre').value = 'semua';
  document.getElementById('filterYear').value = 'semua';
  document.getElementById('filterSort').value = 'judul';
  document.querySelectorAll('.filter-tag').forEach(t => t.classList.toggle('active', t.dataset.status === 'semua'));
  renderPage();
}

document.addEventListener('DOMContentLoaded', () => {
  // Genre filter
  document.getElementById('filterGenre')?.addEventListener('change', e => {
    currentFilters.genre = e.target.value;
    renderPage();
  });

  // Year/decade filter
  document.getElementById('filterYear')?.addEventListener('change', e => {
    currentFilters.year = e.target.value;
    renderPage();
  });

  // Sort
  document.getElementById('filterSort')?.addEventListener('change', e => {
    currentFilters.sort = e.target.value;
    renderPage();
  });

  // Status filter tags
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const status = tag.dataset.status;
      currentFilters.status = status === 'semua' ? null : status;
      renderPage();
    });
  });

  renderPage();
});
