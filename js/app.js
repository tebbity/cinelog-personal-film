// =============================================
// CINELOG - app.js (Shared Application Logic)
// =============================================

// ---- LocalStorage Helpers ----
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

// ---- Movie State Manager ----
const MovieStore = {
  _movies: null,

  getAll() {
    if (!this._movies) {
      this._movies = Storage.get('cinelog_movies', window.MOVIES_DB);
    }
    return this._movies;
  },

  save() {
    Storage.set('cinelog_movies', this._movies);
  },

  getById(id) {
    return this.getAll().find(m => m.id === id) || null;
  },

  getByStatus(status) {
    return this.getAll().filter(m => m.status === status);
  },

  update(id, updates) {
    const movies = this.getAll();
    const idx = movies.findIndex(m => m.id === id);
    if (idx !== -1) {
      this._movies[idx] = { ...movies[idx], ...updates };
      this.save();
      return this._movies[idx];
    }
    return null;
  },

  moveToWatched(id) {
    return this.update(id, {
      status: 'watched',
      dateWatched: new Date().toISOString().split('T')[0]
    });
  },

  moveToWatchlist(id) {
    return this.update(id, {
      status: 'watchlist',
      dateWatched: null
    });
  },

  addReview(id, rating, review) {
    return this.update(id, { userRating: rating, review });
  },

  search(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.getAll().filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.director.toLowerCase().includes(q) ||
      m.genre.some(g => g.toLowerCase().includes(q)) ||
      m.year.toString().includes(q)
    );
  },

  filterBy({ genre = 'semua', year = 'semua', sort = 'judul', status = null }) {
    let movies = status ? this.getByStatus(status) : this.getAll();

    if (genre !== 'semua') {
      movies = movies.filter(m => m.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    if (year !== 'semua') {
      const decade = parseInt(year);
      if (!isNaN(decade)) {
        movies = movies.filter(m => Math.floor(m.year / 10) * 10 === decade);
      }
    }

    return this._sort(movies, sort);
  },

  _sort(movies, sort) {
    const arr = [...movies];
    switch (sort) {
      case 'rating': return arr.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
      case 'tahun-terbaru': return arr.sort((a, b) => b.year - a.year);
      case 'tahun-terlama': return arr.sort((a, b) => a.year - b.year);
      case 'terbaru-ditambah': return arr.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      case 'judul': default: return arr.sort((a, b) => a.title.localeCompare(b.title));
    }
  }
};

// ---- Poster Renderer ----
function renderPoster(movie, size = 'normal') {
  const [c1, c2] = movie.posterColor;
  const accent = movie.posterAccent;
  const icons = { 'Sci-Fi': '🚀', 'Drama': '🎭', 'Thriller': '🔪', 'Aksi': '💥',
    'Animasi': '✨', 'Kriminal': '🔫', 'Musikal': '🎵', 'Petualangan': '🗺️',
    'Romansa': '❤️', 'Komedi': '😄', 'Perang': '⚔️', 'Sejarah': '📜',
    'Fantasi': '🔮', 'Misteri': '🕵️', 'Biografi': '📖', 'Musik': '🎶' };
  const icon = icons[movie.genre[0]] || '🎬';
  const fontSize = size === 'small' ? '12px' : '14px';
  return `
    <div class="poster-bg" style="background: linear-gradient(160deg, ${c1}, ${c2}); position:relative;">
      <div class="poster-overlay"></div>
      <div class="poster-content">
        <div class="poster-icon" style="color:${accent}">${icon}</div>
        <div class="poster-title-text" style="font-size:${fontSize}">${movie.title}</div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${accent};opacity:0.7;"></div>
    </div>`;
}

function renderStars(rating, interactive = false, movieId = null) {
  if (!rating && !interactive) return '<span style="font-size:12px;color:var(--text-muted)">Belum dinilai</span>';
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const cls = i <= (rating || 0) ? 'filled' : '';
    if (interactive) {
      html += `<span class="rating-star-btn ${cls}" data-star="${i}" data-movie="${movieId}">★</span>`;
    } else {
      html += `<span class="star ${cls}">★</span>`;
    }
  }
  if (!interactive && rating) html += `<span class="rating-text">${rating}.0</span>`;
  return html;
}

// ---- Movie Card ----
function createMovieCard(movie, options = {}) {
  const { showStatus = false, actions = [] } = options;
  const statusLabel = movie.status === 'watched' ? '✓ Ditonton' : movie.status === 'watchlist' ? '◷ Watchlist' : '';
  const statusBadge = showStatus && statusLabel
    ? `<div class="poster-status-badge ${movie.status}">${statusLabel}</div>` : '';

  let hoverBtns = '';
  if (actions.includes('detail')) hoverBtns += `<button class="hover-btn" onclick="openMovieDetail(${movie.id})">🎬 Detail Film</button>`;
  if (actions.includes('watched') && movie.status !== 'watched') hoverBtns += `<button class="hover-btn" onclick="markWatched(${movie.id}, event)">✓ Tandai Ditonton</button>`;
  if (actions.includes('watchlist') && movie.status !== 'watchlist') hoverBtns += `<button class="hover-btn" onclick="addToWatchlist(${movie.id}, event)">+ Tambah ke Watchlist</button>`;
  if (actions.includes('review')) hoverBtns += `<button class="hover-btn" onclick="openReviewModal(${movie.id})">✎ Tulis Ulasan</button>`;
  if (actions.includes('remove-watchlist') && movie.status === 'watchlist') hoverBtns += `<button class="hover-btn" onclick="removeFromWatchlist(${movie.id}, event)">✕ Hapus dari Watchlist</button>`;

  const starsHtml = renderStars(movie.userRating);

  return `
    <div class="movie-card" id="card-${movie.id}">
      <div class="movie-poster">
        ${renderPoster(movie)}
        <div class="poster-year-badge">${movie.year}</div>
        ${statusBadge}
        <div class="card-hover-overlay">
          ${hoverBtns || `<button class="hover-btn" onclick="openMovieDetail(${movie.id})">🎬 Detail Film</button>`}
        </div>
      </div>
      <div class="movie-card-info">
        <div class="movie-card-title" title="${movie.title}">${movie.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-year">${movie.year}</span>
          <span class="movie-card-genre">${movie.genre[0]}</span>
        </div>
        <div class="star-rating" style="margin-top:6px">${starsHtml}</div>
      </div>
    </div>`;
}

// ---- Movie Detail Modal ----
function openMovieDetail(id) {
  const movie = MovieStore.getById(id);
  if (!movie) return;

  const overlay = document.getElementById('movieModal');
  if (!overlay) return;

  const poster = overlay.querySelector('#modalPoster');
  const [c1, c2] = movie.posterColor;
  const icons = { 'Sci-Fi': '🚀', 'Drama': '🎭', 'Thriller': '🔪', 'Aksi': '💥',
    'Animasi': '✨', 'Kriminal': '🔫', 'Musikal': '🎵', 'Petualangan': '🗺️',
    'Romansa': '❤️', 'Komedi': '😄', 'Perang': '⚔️', 'Sejarah': '📜',
    'Fantasi': '🔮', 'Misteri': '🕵️', 'Biografi': '📖', 'Musik': '🎶' };
  const icon = icons[movie.genre[0]] || '🎬';

  poster.style.background = `linear-gradient(160deg, ${c1}, ${c2})`;
  poster.innerHTML = `
    <div class="poster-overlay"></div>
    <div class="poster-content">
      <div style="font-size:40px;color:${movie.posterAccent}">${icon}</div>
      <div class="poster-title-text">${movie.title}</div>
    </div>`;

  overlay.querySelector('#modalTitle').textContent = movie.title;
  overlay.querySelector('#modalOrigTitle').textContent = movie.title !== movie.originalTitle ? `"${movie.originalTitle}"` : '';
  overlay.querySelector('#modalYear').textContent = movie.year;
  overlay.querySelector('#modalDuration').textContent = `${movie.duration} menit`;
  overlay.querySelector('#modalLang').textContent = movie.language;
  overlay.querySelector('#modalGenres').innerHTML = movie.genre.map(g => `<span class="meta-pill genre">${g}</span>`).join('');
  overlay.querySelector('#modalSynopsis').textContent = movie.synopsis;
  overlay.querySelector('#modalDirector').innerHTML = `Sutradara: <span>${movie.director}</span>`;
  overlay.querySelector('#modalCast').innerHTML = movie.cast.join(' • ');

  // Rating & review
  const ratingSection = overlay.querySelector('#modalRatingSection');
  ratingSection.innerHTML = `
    <div style="margin-bottom:12px">
      <div class="form-label">Rating Komunitas</div>
      <div style="display:flex;align-items:center;gap:8px">
        ${renderStars(Math.round(movie.rating))}
        <span style="font-size:13px;color:var(--text-muted)">${movie.rating}/5 · Komunitas</span>
      </div>
    </div>
    <div>
      <div class="form-label">Rating Saya</div>
      <div class="rating-input" id="interactiveRating">
        <span style="font-size:13px;color:var(--text-muted);margin-right:4px">Nilai:</span>
        ${[1,2,3,4,5].map(i => `<span class="rating-star-btn ${i <= (movie.userRating||0) ? 'active' : ''}" data-star="${i}">★</span>`).join('')}
        <span id="ratingLabel" style="font-size:13px;color:var(--gold);margin-left:8px">${movie.userRating ? movie.userRating + '/5' : 'Klik untuk menilai'}</span>
      </div>
    </div>`;

  // Setup interactive rating
  let tempRating = movie.userRating || 0;
  const stars = ratingSection.querySelectorAll('.rating-star-btn');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const n = parseInt(star.dataset.star);
      stars.forEach((s, i) => s.classList.toggle('active', i < n));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => s.classList.toggle('active', i < tempRating));
    });
    star.addEventListener('click', () => {
      tempRating = parseInt(star.dataset.star);
      stars.forEach((s, i) => s.classList.toggle('active', i < tempRating));
      ratingSection.querySelector('#ratingLabel').textContent = tempRating + '/5';
      MovieStore.addReview(movie.id, tempRating, movie.review);
      showToast('Rating disimpan!', 'success');
      refreshCurrentPage();
    });
  });

  // Review section
  const reviewSection = overlay.querySelector('#modalReviewSection');
  reviewSection.innerHTML = `
    <div class="form-group">
      <label class="form-label">Ulasan Saya</label>
      <textarea class="form-textarea" id="reviewTextarea" placeholder="Tulis ulasan tentang film ini...">${movie.review || ''}</textarea>
    </div>`;

  // Status buttons
  const statusSection = overlay.querySelector('#modalStatusSection');
  const watched = movie.status === 'watched';
  statusSection.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn ${watched ? 'btn-success' : 'btn-secondary'}" onclick="modalMarkWatched(${movie.id})">
        ${watched ? '✓ Sudah Ditonton' : '▶ Tandai Ditonton'}
      </button>
      <button class="btn ${movie.status === 'watchlist' ? 'btn-secondary' : 'btn-ghost'}" 
        style="${movie.status === 'watchlist' ? 'border-color:var(--warning);color:var(--warning)' : ''}"
        onclick="modalMoveWatchlist(${movie.id})">
        ${movie.status === 'watchlist' ? '◷ Di Watchlist' : '+ Tambah Watchlist'}
      </button>
    </div>`;

  // Save review button
  overlay.querySelector('#saveReviewBtn').onclick = () => {
    const reviewText = overlay.querySelector('#reviewTextarea').value;
    MovieStore.addReview(movie.id, tempRating || movie.userRating, reviewText);
    showToast('Ulasan berhasil disimpan!', 'success');
    refreshCurrentPage();
  };

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMovieModal() {
  const overlay = document.getElementById('movieModal');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function modalMarkWatched(id) {
  MovieStore.moveToWatched(id);
  closeMovieModal();
  showToast('Film ditandai sebagai sudah ditonton!', 'success');
  refreshCurrentPage();
}

function modalMoveWatchlist(id) {
  MovieStore.moveToWatchlist(id);
  closeMovieModal();
  showToast('Film ditambahkan ke watchlist!', 'info');
  refreshCurrentPage();
}

// ---- Review Modal ----
function openReviewModal(id) {
  openMovieDetail(id);
}

// ---- Mark Watched / Watchlist ----
function markWatched(id, event) {
  if (event) event.stopPropagation();
  MovieStore.moveToWatched(id);
  showToast('Film ditandai sebagai sudah ditonton!', 'success');
  refreshCurrentPage();
}

function addToWatchlist(id, event) {
  if (event) event.stopPropagation();
  MovieStore.moveToWatchlist(id);
  showToast('Film ditambahkan ke watchlist!', 'info');
  refreshCurrentPage();
}

function removeFromWatchlist(id, event) {
  if (event) event.stopPropagation();
  MovieStore.update(id, { status: 'collection' });
  showToast('Film dihapus dari watchlist.', 'info');
  refreshCurrentPage();
}

// ---- Toast Notifications ----
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✓', error: '✗', info: '🎬' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '🔔'}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ---- Search ----
function initSearch() {
  const input = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim();
      if (!query) { results.classList.remove('open'); return; }

      const found = MovieStore.search(query).slice(0, 6);
      if (!found.length) {
        results.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:14px">Tidak ada film ditemukan</div>';
      } else {
        results.innerHTML = found.map(m => {
          const [c1, c2] = m.posterColor;
          return `
          <div class="search-result-item" onclick="openMovieDetail(${m.id})">
            <div class="search-result-poster">
              <div class="poster-bg" style="background:linear-gradient(160deg,${c1},${c2});width:36px;height:54px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px">🎬</div>
            </div>
            <div class="search-result-info">
              <div class="title">${m.title}</div>
              <div class="meta">${m.year} · ${m.genre[0]} · ${m.director}</div>
            </div>
          </div>`;
        }).join('');
      }
      results.classList.add('open');
    }, 250);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('open');
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { results.classList.remove('open'); input.value = ''; }
  });
}

// ---- Sidebar Mobile ----
function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

// ---- Active Nav Item ----
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && (href === page || (page === '' && href === 'index.html'))) {
      item.classList.add('active');
    }
  });
}

// ---- Update Sidebar Stats ----
function updateSidebarStats() {
  const watched = MovieStore.getByStatus('watched').length;
  const watchlist = MovieStore.getByStatus('watchlist').length;
  const el1 = document.getElementById('sidebarWatchedCount');
  const el2 = document.getElementById('sidebarWatchlistCount');
  const badge = document.getElementById('watchlistBadge');
  if (el1) el1.textContent = watched;
  if (el2) el2.textContent = watchlist;
  if (badge) badge.textContent = watchlist;
}

// ---- Refresh Current Page ----
function refreshCurrentPage() {
  if (typeof renderPage === 'function') renderPage();
  updateSidebarStats();
}

// ---- Date Formatter ----
function formatDate(dateStr) {
  if (!dateStr) return 'Belum ditonton';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---- Initialize App ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initSearch();
  setActiveNav();
  updateSidebarStats();

  // Modal close
  const overlay = document.getElementById('movieModal');
  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeMovieModal(); });
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeMovieModal);
  }

  // Global keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMovieModal();
  });
});
