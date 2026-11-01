// =============================================
// CINELOG - watchlist.js
// =============================================

let currentFilters = { genre: 'semua', year: 'semua', sort: 'terbaru-ditambah', status: 'watchlist' };

function renderPage() {
  const filtered = MovieStore.filterBy(currentFilters);
  const grid = document.getElementById('watchlistGrid');
  const emptyState = document.getElementById('emptyState');
  const count = document.getElementById('watchlistCount');

  if (count) count.textContent = `${filtered.length} film`;

  if (!filtered.length) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (!grid) return;

  grid.innerHTML = filtered.map(m => {
    const [c1, c2] = m.posterColor;
    const icons = { 'Sci-Fi': '🚀', 'Drama': '🎭', 'Thriller': '🔪', 'Aksi': '💥',
      'Animasi': '✨', 'Kriminal': '🔫', 'Musikal': '🎵', 'Petualangan': '🗺️',
      'Romansa': '❤️', 'Komedi': '😄', 'Perang': '⚔️', 'Sejarah': '📜',
      'Fantasi': '🔮', 'Misteri': '🕵️', 'Biografi': '📖', 'Musik': '🎶' };
    const icon = icons[m.genre[0]] || '🎬';
    return `
      <div class="movie-card" id="card-${m.id}">
        <div class="movie-poster">
          <div class="poster-bg" style="background:linear-gradient(160deg,${c1},${c2});position:relative">
            <div class="poster-overlay"></div>
            <div class="poster-content">
              <div class="poster-icon" style="color:${m.posterAccent}">${icon}</div>
              <div class="poster-title-text">${m.title}</div>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${m.posterAccent};opacity:0.7"></div>
          </div>
          <div class="poster-year-badge">${m.year}</div>
          <div class="poster-status-badge watchlist">🔖 Watchlist</div>
          <div class="card-hover-overlay">
            <button class="hover-btn" onclick="watchNow(${m.id},event)">✓ Tonton Sekarang</button>
            <button class="hover-btn" onclick="openMovieDetail(${m.id})">🎬 Detail Film</button>
            <button class="hover-btn" onclick="removeFromWatchlist(${m.id},event)" style="border-color:rgba(232,84,84,0.5);color:#ff8888">✕ Hapus</button>
          </div>
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title" title="${m.title}">${m.title}</div>
          <div class="movie-card-meta">
            <span class="movie-card-year">${m.year}</span>
            <span class="movie-card-genre">${m.genre[0]}</span>
          </div>
          <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">
            Ditambah: ${formatDate(m.dateAdded)}
          </div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="btn btn-success btn-sm" style="flex:1;padding:6px 8px;font-size:12px" onclick="watchNow(${m.id},event)">✓ Sudah Nonton</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function watchNow(id, event) {
  if (event) event.stopPropagation();
  MovieStore.moveToWatched(id);
  showToast('Film dipindahkan ke daftar Sudah Ditonton! 🎉', 'success');
  renderPage();
  updateSidebarStats();
}

function removeFromWatchlist(id, event) {
  if (event) event.stopPropagation();
  MovieStore.update(id, { status: 'collection' });
  showToast('Film dihapus dari watchlist.', 'info');
  renderPage();
  updateSidebarStats();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filterGenre')?.addEventListener('change', e => {
    currentFilters.genre = e.target.value;
    renderPage();
  });

  document.getElementById('filterSort')?.addEventListener('change', e => {
    currentFilters.sort = e.target.value;
    renderPage();
  });

  renderPage();
});
