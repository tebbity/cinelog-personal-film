// =============================================
// CINELOG - statistics.js
// =============================================

function renderPage() {
  renderOverviewStats();
  renderGenreChart();
  renderRatingChart();
  renderMonthlyChart();
  renderDirectorChart();
  renderTimeGenreChart();
  renderAchievements();
  makeChartsResponsive();
}

// ---- Overview Stats ----
function renderOverviewStats() {
  const watched = MovieStore.getByStatus('watched');
  const watchlist = MovieStore.getByStatus('watchlist');
  const rated = watched.filter(m => m.userRating);
  const avgRating = rated.length
    ? (rated.reduce((a, m) => a + m.userRating, 0) / rated.length).toFixed(1) : '—';
  const totalMinutes = watched.reduce((a, m) => a + m.duration, 0);
  const totalHours = Math.round(totalMinutes / 60);
  const reviewCount = watched.filter(m => m.review && m.review.trim()).length;

  // Top genre
  const genreCounts = {};
  watched.forEach(m => m.genre.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1));
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

  // Favorite director
  const dirCounts = {};
  watched.forEach(m => dirCounts[m.director] = (dirCounts[m.director] || 0) + 1);
  const topDir = Object.entries(dirCounts).sort((a, b) => b[1] - a[1])[0];

  const container = document.getElementById('overviewStats');
  if (!container) return;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">🎬</div>
      <div class="stat-info"><span class="stat-number">${watched.length}</span><span class="stat-desc">Film Ditonton</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⏱️</div>
      <div class="stat-info"><span class="stat-number">${totalHours}</span><span class="stat-desc">Jam Menonton</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⭐</div>
      <div class="stat-info"><span class="stat-number">${avgRating}</span><span class="stat-desc">Rata-rata Rating</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✍️</div>
      <div class="stat-info"><span class="stat-number">${reviewCount}</span><span class="stat-desc">Ulasan Ditulis</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎭</div>
      <div class="stat-info"><span class="stat-number" style="font-size:18px">${topGenre ? topGenre[0] : '—'}</span><span class="stat-desc">Genre Favorit</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🎬</div>
      <div class="stat-info"><span class="stat-number" style="font-size:14px;line-height:1.3">${topDir ? topDir[0].split(',')[0] : '—'}</span><span class="stat-desc">Sutradara Favorit</span></div>
    </div>`;
}

// ---- Genre Chart ----
function renderGenreChart() {
  const watched = MovieStore.getByStatus('watched');
  const genreCounts = {};
  watched.forEach(m => m.genre.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1));
  const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = sorted[0]?.[1] || 1;

  const container = document.getElementById('genreChart');
  if (!container) return;

  if (!sorted.length) { container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Belum ada data</p></div>'; return; }

  container.innerHTML = sorted.map(([genre, count]) => `
    <div class="bar-item">
      <div class="bar-label">${genre}</div>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(count / max * 100).toFixed(0)}%" style="width:0%"></div>
      </div>
      <div class="bar-count">${count}</div>
    </div>`).join('');

  animateBars('#genreChart .bar-fill');
}

// ---- Rating Chart ----
function renderRatingChart() {
  const watched = MovieStore.getByStatus('watched');
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  watched.forEach(m => { if (m.userRating) ratingCounts[m.userRating]++; });
  const maxCount = Math.max(...Object.values(ratingCounts)) || 1;

  const container = document.getElementById('ratingChart');
  if (!container) return;

  container.innerHTML = [5, 4, 3, 2, 1].map(stars => {
    const count = ratingCounts[stars];
    const pct = (count / maxCount * 100).toFixed(0);
    return `
    <div class="rating-row">
      <div class="rating-stars-label">${'★'.repeat(stars)}<span style="color:var(--text-muted)">${'★'.repeat(5 - stars)}</span></div>
      <div class="rating-track">
        <div class="rating-fill" data-width="${pct}%" style="width:0%"></div>
      </div>
      <div class="rating-count-label" style="color:var(--gold)">${count}</div>
    </div>`;
  }).join('');

  animateBars('#ratingChart .rating-fill');
}

// ---- Monthly Chart ----
function renderMonthlyChart() {
  const watched = MovieStore.getByStatus('watched');
  const monthMap = {};
  watched.forEach(m => {
    if (!m.dateWatched) return;
    const month = new Date(m.dateWatched).getMonth();
    monthMap[month] = (monthMap[month] || 0) + 1;
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const max = Math.max(...Object.values(monthMap), 1);

  const container = document.getElementById('monthlyChart');
  if (!container) return;

  container.innerHTML = months.map((m, i) => {
    const count = monthMap[i] || 0;
    const heightPct = (count / max * 100).toFixed(0);
    return `
    <div class="month-col">
      <div class="month-count">${count || ''}</div>
      <div class="month-bar-wrap">
        <div class="month-bar" data-height="${heightPct}%" style="height:0%"></div>
      </div>
      <div class="month-label">${m}</div>
    </div>`;
  }).join('');

  // Animate bars
  setTimeout(() => {
    container.querySelectorAll('.month-bar').forEach(bar => {
      bar.style.height = bar.dataset.height;
    });
  }, 100);
}

// ---- Director Chart ----
function renderDirectorChart() {
  const watched = MovieStore.getByStatus('watched');
  const dirCounts = {};
  watched.forEach(m => {
    const dir = m.director.split(',')[0].trim();
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;
  });
  const sorted = Object.entries(dirCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;

  const container = document.getElementById('directorChart');
  if (!container) return;

  if (!sorted.length) { container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Belum ada data</p></div>'; return; }

  container.innerHTML = sorted.map(([dir, count]) => `
    <div class="bar-item">
      <div class="bar-label" style="width:110px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${dir}">${dir}</div>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(count / max * 100).toFixed(0)}%" style="width:0%;background:linear-gradient(90deg,#1e40af,#818cf8)"></div>
      </div>
      <div class="bar-count">${count}</div>
    </div>`).join('');

  animateBars('#directorChart .bar-fill');
}

// ---- Time by Genre ----
function renderTimeGenreChart() {
  const watched = MovieStore.getByStatus('watched');
  const timeByGenre = {};
  watched.forEach(m => {
    m.genre.forEach(g => {
      timeByGenre[g] = (timeByGenre[g] || 0) + m.duration;
    });
  });

  const sorted = Object.entries(timeByGenre)
    .map(([g, t]) => [g, Math.round(t / 60)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const max = sorted[0]?.[1] || 1;

  const container = document.getElementById('timeGenreChart');
  if (!container) return;

  if (!sorted.length) { container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Belum ada data</p></div>'; return; }

  container.innerHTML = sorted.map(([genre, hours]) => `
    <div class="bar-item">
      <div class="bar-label">${genre}</div>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(hours / max * 100).toFixed(0)}%" style="width:0%;background:linear-gradient(90deg,#0f4c75,#38bdf8)"></div>
      </div>
      <div class="bar-count" style="width:40px">${hours}j</div>
    </div>`).join('');

  animateBars('#timeGenreChart .bar-fill');
}

// ---- Achievements ----
function renderAchievements() {
  const watched = MovieStore.getByStatus('watched');
  const totalHours = Math.round(watched.reduce((a, m) => a + m.duration, 0) / 60);
  const perfect5 = watched.filter(m => m.userRating === 5).length;
  const reviews = watched.filter(m => m.review && m.review.trim()).length;

  const genreCounts = {};
  watched.forEach(m => m.genre.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1));
  const uniqueGenres = Object.keys(genreCounts).length;

  const dirCounts = {};
  watched.forEach(m => dirCounts[m.director.split(',')[0].trim()] = (dirCounts[m.director.split(',')[0].trim()] || 0) + 1);
  const topDir = Object.entries(dirCounts).sort((a, b) => b[1] - a[1])[0];

  const achievements = [
    { icon: '🎬', title: `${watched.length} Film Ditonton`, desc: watched.length >= 10 ? '🏆 Level Sinefil!' : `${10 - watched.length} lagi menuju level 10`, unlocked: watched.length >= 5 },
    { icon: '⏱️', title: `${totalHours} Jam Menonton`, desc: totalHours >= 20 ? '🏆 Maraton Master!' : `${20 - totalHours} jam lagi`, unlocked: totalHours >= 10 },
    { icon: '⭐', title: `${perfect5} Rating Sempurna`, desc: perfect5 >= 3 ? '🏆 Kritikus Selektif!' : 'Terus nilai film favoritmu', unlocked: perfect5 >= 1 },
    { icon: '✍️', title: `${reviews} Ulasan`, desc: reviews >= 5 ? '🏆 Kritikus Handal!' : `${5 - reviews} ulasan lagi`, unlocked: reviews >= 1 },
    { icon: '🎭', title: `${uniqueGenres} Genre Dijelajahi`, desc: uniqueGenres >= 6 ? '🏆 Pencinta Genre Beragam!' : `${6 - uniqueGenres} genre lagi`, unlocked: uniqueGenres >= 3 },
    { icon: '🎬', title: topDir ? `${topDir[1]}× ${topDir[0].split(' ').pop()}` : 'Temukan Favorit', desc: topDir && topDir[1] >= 2 ? '🏆 Setia pada Sutradara!' : 'Tonton lebih banyak film', unlocked: topDir && topDir[1] >= 2 },
  ];

  const container = document.getElementById('achievements');
  if (!container) return;

  container.innerHTML = achievements.map(a => `
    <div style="background:${a.unlocked ? 'rgba(29,78,216,0.1)' : 'var(--bg-tertiary)'};border:1px solid ${a.unlocked ? 'rgba(59,130,246,0.3)' : 'var(--border)'};border-radius:var(--radius-lg);padding:16px;text-align:center;opacity:${a.unlocked ? '1' : '0.5'}">
      <div style="font-size:28px;margin-bottom:8px">${a.icon}</div>
      <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:4px">${a.title}</div>
      <div style="font-size:12px;color:var(--text-muted)">${a.desc}</div>
    </div>`).join('');
}

// ---- Animate Bars Helper ----
function animateBars(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

// ---- Responsive ----
function makeChartsResponsive() {
  if (window.innerWidth < 700) {
    const rows = document.querySelectorAll('#chartsRow1, #chartsRow2');
    rows.forEach(r => r.style.gridTemplateColumns = '1fr');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderPage();
});
