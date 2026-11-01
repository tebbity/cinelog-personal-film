// =============================================
// CINELOG - dashboard.js
// =============================================

function renderPage() {
  renderStats();
  renderRecentWatched();
  renderWatchlistPreview();
  renderRecommendations();
  renderActivityFeed();
}

// ---- Stats Overview ----
function renderStats() {
  const watched = MovieStore.getByStatus('watched');
  const watchlist = MovieStore.getByStatus('watchlist');
  const rated = watched.filter(m => m.userRating);
  const avgRating = rated.length
    ? (rated.reduce((a, m) => a + m.userRating, 0) / rated.length).toFixed(1)
    : '—';
  const totalHours = Math.round(watched.reduce((a, m) => a + m.duration, 0) / 60);
  const reviews = watched.filter(m => m.review && m.review.trim()).length;

  const container = document.getElementById('statsGrid');
  if (!container) return;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">🎬</div>
      <div class="stat-info">
        <span class="stat-number">${watched.length}</span>
        <span class="stat-desc">Film Ditonton</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🔖</div>
      <div class="stat-info">
        <span class="stat-number">${watchlist.length}</span>
        <span class="stat-desc">Di Watchlist</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⭐</div>
      <div class="stat-info">
        <span class="stat-number">${avgRating}</span>
        <span class="stat-desc">Rata-rata Rating</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⏱️</div>
      <div class="stat-info">
        <span class="stat-number">${totalHours}</span>
        <span class="stat-desc">Jam Menonton</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✍️</div>
      <div class="stat-info">
        <span class="stat-number">${reviews}</span>
        <span class="stat-desc">Ulasan Ditulis</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎭</div>
      <div class="stat-info">
        <span class="stat-number">${getTopGenre(watched)}</span>
        <span class="stat-desc">Genre Favorit</span>
      </div>
    </div>`;
}

function getTopGenre(movies) {
  const counts = {};
  movies.forEach(m => m.genre.forEach(g => counts[g] = (counts[g] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '—';
}

// ---- Recent Watched ----
function renderRecentWatched() {
  const container = document.getElementById('recentWatched');
  if (!container) return;

  const recent = MovieStore.getByStatus('watched')
    .sort((a, b) => new Date(b.dateWatched || b.dateAdded) - new Date(a.dateWatched || a.dateAdded))
    .slice(0, 6);

  if (!recent.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-icon">🎬</div><p style="font-size:13px;color:var(--text-muted)">Belum ada film yang ditonton</p></div>';
    return;
  }

  container.innerHTML = recent.map(m => `
    <div class="recent-movie-card" onclick="openMovieDetail(${m.id})" style="cursor:pointer">
      <div class="movie-poster" style="aspect-ratio:2/3;border-radius:var(--radius-lg);overflow:hidden;position:relative">
        ${renderPoster(m, 'small')}
        <div class="poster-year-badge" style="font-size:10px">${m.year}</div>
      </div>
      <div style="padding:8px 4px">
        <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.title}</div>
        <div style="display:flex;gap:2px;margin-top:4px">${renderStars(m.userRating)}</div>
      </div>
    </div>`).join('');
}

// ---- Watchlist Preview ----
function renderWatchlistPreview() {
  const container = document.getElementById('watchlistPreview');
  if (!container) return;

  const items = MovieStore.getByStatus('watchlist')
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 6);

  if (!items.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-icon">🔖</div><p style="font-size:13px;color:var(--text-muted)">Watchlist kosong</p></div>';
    return;
  }

  container.innerHTML = items.map(m => `
    <div class="recent-movie-card" onclick="openMovieDetail(${m.id})" style="cursor:pointer">
      <div class="movie-poster" style="aspect-ratio:2/3;border-radius:var(--radius-lg);overflow:hidden;position:relative">
        ${renderPoster(m, 'small')}
        <div style="position:absolute;top:6px;left:6px;background:rgba(232,160,74,0.85);color:white;font-size:9px;padding:2px 6px;border-radius:3px;z-index:3;font-weight:600">SOON</div>
      </div>
      <div style="padding:8px 4px">
        <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.title}</div>
        <div style="font-size:11px;color:var(--text-muted)">${m.year}</div>
      </div>
    </div>`).join('');
}

// ---- Recommendations ----
function renderRecommendations() {
  const container = document.getElementById('recommendations');
  if (!container) return;

  const watched = MovieStore.getByStatus('watched');
  const topGenre = getTopGenre(watched);
  const watchedIds = new Set(watched.map(m => m.id));

  // Suggest unwatched films that match top genre or are highly rated
  let suggestions = MovieStore.getAll()
    .filter(m => !watchedIds.has(m.id) || m.status === 'watchlist')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  if (!suggestions.length) suggestions = MovieStore.getByStatus('watchlist').slice(0, 6);

  container.innerHTML = suggestions.map(m =>
    createMovieCard(m, { showStatus: true, actions: ['detail', 'watched', 'watchlist'] })
  ).join('');
}

// ---- Activity Feed ----
function renderActivityFeed() {
  const container = document.getElementById('activityFeed');
  if (!container) return;

  const watched = MovieStore.getByStatus('watched')
    .sort((a, b) => new Date(b.dateWatched || b.dateAdded) - new Date(a.dateWatched || a.dateAdded))
    .slice(0, 5);

  const activities = watched.map(m => ({
    movie: m,
    date: m.dateWatched,
    type: m.review ? 'review' : 'watched'
  }));

  if (!activities.length) {
    container.innerHTML = '<div class="empty-state"><p>Belum ada aktivitas</p></div>';
    return;
  }

  container.innerHTML = activities.map(a => `
    <div class="activity-item" onclick="openMovieDetail(${a.movie.id})" style="cursor:pointer">
      <div class="activity-dot" style="background:${a.type === 'review' ? '#f5c842' : 'var(--burgundy-light)'}"></div>
      <div class="activity-content">
        <div class="title">${a.type === 'review' ? '✍️ Menulis ulasan' : '✅ Menonton'}: <strong>${a.movie.title}</strong></div>
        <div class="desc">
          ${formatDate(a.date)} &nbsp;·&nbsp; ${a.movie.genre[0]}
          ${a.movie.userRating ? `&nbsp;·&nbsp; ${'★'.repeat(a.movie.userRating)}` : ''}
        </div>
      </div>
      <div style="flex-shrink:0">
        <div style="width:40px;height:60px;border-radius:4px;overflow:hidden">
          <div class="poster-bg" style="background:linear-gradient(160deg,${a.movie.posterColor[0]},${a.movie.posterColor[1]});width:40px;height:60px;display:flex;align-items:center;justify-content:center;font-size:18px">🎬</div>
        </div>
      </div>
    </div>`).join('');
}

// ---- Hero Greeting ----
function setHeroGreeting() {
  const el = document.getElementById('heroDayGreet');
  if (!el) return;
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const h = now.getHours();
  const greeting = h < 12 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
  el.textContent = `${greeting} 👋 — ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setHeroGreeting();
  renderPage();
  // Responsive dashboard row
  const row = document.getElementById('dashboardRow');
  if (row && window.innerWidth < 700) {
    row.style.gridTemplateColumns = '1fr';
  }
});
