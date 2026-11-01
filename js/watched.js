// =============================================
// CINELOG - watched.js
// =============================================

let currentFilters = { genre: 'semua', year: 'semua', sort: 'tahun-terbaru', status: 'watched' };
let ratingFilter = 'semua';

function renderPage() {
  let filtered = MovieStore.filterBy(currentFilters);

  // Apply rating filter
  if (ratingFilter !== 'semua') {
    if (ratingFilter === '5') filtered = filtered.filter(m => m.userRating === 5);
    else if (ratingFilter === '4') filtered = filtered.filter(m => m.userRating === 4);
    else if (ratingFilter === '3') filtered = filtered.filter(m => m.userRating === 3);
    else if (ratingFilter === '1-2') filtered = filtered.filter(m => m.userRating <= 2 && m.userRating > 0);
  }

  const grid = document.getElementById('watchedGrid');
  const emptyState = document.getElementById('emptyState');
  const count = document.getElementById('watchedCount');

  if (count) count.textContent = `${filtered.length} film`;

  renderSummary();

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
    const starsHtml = renderStars(m.userRating);

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
          <div class="poster-status-badge watched">✓ Ditonton</div>
          <div class="card-hover-overlay">
            <button class="hover-btn" onclick="openMovieDetail(${m.id})">🎬 Detail Film</button>
            <button class="hover-btn" onclick="openReviewModal(${m.id})">✎ Tulis Ulasan</button>
          </div>
        </div>
        <div class="movie-card-info">
          <div class="movie-card-title" title="${m.title}">${m.title}</div>
          <div class="movie-card-meta">
            <span class="movie-card-year">${m.year}</span>
            <span class="movie-card-genre">${m.genre[0]}</span>
          </div>
          <div class="star-rating" style="margin-top:6px">${starsHtml}</div>
          ${m.review ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:italic">"${m.review.substring(0, 50)}..."</div>` : ''}
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">📅 ${formatDate(m.dateWatched)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderSummary() {
  const watched = MovieStore.getByStatus('watched');
  const rated = watched.filter(m => m.userRating);
  const avgRating = rated.length
    ? (rated.reduce((a, m) => a + m.userRating, 0) / rated.length).toFixed(1)
    : '—';
  const totalHours = Math.round(watched.reduce((a, m) => a + m.duration, 0) / 60);
  const withReviews = watched.filter(m => m.review && m.review.trim()).length;
  const perfect = watched.filter(m => m.userRating === 5).length;

  const container = document.getElementById('watchedSummary');
  if (!container) return;

  container.innerHTML = `
    <div class="stat-card" style="padding:14px 16px">
      <div class="stat-icon" style="width:36px;height:36px;font-size:16px">🎬</div>
      <div class="stat-info"><span class="stat-number" style="font-size:22px">${watched.length}</span><span class="stat-desc">Film Ditonton</span></div>
    </div>
    <div class="stat-card" style="padding:14px 16px">
      <div class="stat-icon" style="width:36px;height:36px;font-size:16px">⏱️</div>
      <div class="stat-info"><span class="stat-number" style="font-size:22px">${totalHours}</span><span class="stat-desc">Jam Menonton</span></div>
    </div>
    <div class="stat-card" style="padding:14px 16px">
      <div class="stat-icon" style="width:36px;height:36px;font-size:16px">⭐</div>
      <div class="stat-info"><span class="stat-number" style="font-size:22px">${avgRating}</span><span class="stat-desc">Rata-rata Rating</span></div>
    </div>
    <div class="stat-card" style="padding:14px 16px">
      <div class="stat-icon" style="width:36px;height:36px;font-size:16px">✍️</div>
      <div class="stat-info"><span class="stat-number" style="font-size:22px">${withReviews}</span><span class="stat-desc">Ulasan Ditulis</span></div>
    </div>
    <div class="stat-card" style="padding:14px 16px">
      <div class="stat-icon" style="width:36px;height:36px;font-size:16px">🏆</div>
      <div class="stat-info"><span class="stat-number" style="font-size:22px">${perfect}</span><span class="stat-desc">Rating Sempurna</span></div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filterGenre')?.addEventListener('change', e => {
    currentFilters.genre = e.target.value;
    renderPage();
  });

  document.getElementById('filterYear')?.addEventListener('change', e => {
    currentFilters.year = e.target.value;
    renderPage();
  });

  document.getElementById('filterSort')?.addEventListener('change', e => {
    currentFilters.sort = e.target.value;
    renderPage();
  });

  document.getElementById('filterRating')?.addEventListener('change', e => {
    ratingFilter = e.target.value;
    renderPage();
  });

  renderPage();
});
