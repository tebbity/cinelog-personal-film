// =============================================
// CINELOG - ai-recommend.js
// AI Film Recommendation Engine (Local Algorithm)
// =============================================

let selectedMood = null;

// ---- Mood Button Selection ----
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      if (selectedMood === btn.dataset.mood) {
        selectedMood = null; // toggle off
      } else {
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
      }
    });
  });

  document.getElementById('getRecommendBtn')?.addEventListener('click', getRecommendations);
});

// ---- Main Recommendation Engine ----
function getRecommendations() {
  const genre = document.getElementById('aiGenre')?.value || 'semua';
  const basis = document.getElementById('aiBasis')?.value || 'rating';
  const maxDuration = parseInt(document.getElementById('aiDuration')?.value || '0');
  const mood = selectedMood;

  // Show result card with loading state
  const resultCard = document.getElementById('aiResultCard');
  const loading = document.getElementById('aiLoading');
  const content = document.getElementById('aiResultContent');

  resultCard.classList.add('visible');
  loading.style.display = 'block';
  content.style.display = 'none';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Simulate processing delay for UX
  setTimeout(() => {
    const results = computeRecommendations({ genre, basis, maxDuration, mood });
    displayResults(results, { genre, basis, mood });
    loading.style.display = 'none';
    content.style.display = 'block';
  }, 1200);
}

// ---- Scoring Algorithm ----
function computeRecommendations({ genre, basis, maxDuration, mood }) {
  let pool = MovieStore.getAll();

  // Filter by duration
  if (maxDuration > 0) {
    pool = pool.filter(m => m.duration <= maxDuration);
  }

  // Score each movie
  const scored = pool.map(m => {
    let score = 0;

    // Genre match
    if (genre !== 'semua') {
      if (m.genre.some(g => g.toLowerCase() === genre.toLowerCase())) score += 30;
    }

    // Mood match
    if (mood && m.mood) {
      if (m.mood.includes(mood)) score += 25;
    }

    // Basis scoring
    switch (basis) {
      case 'rating':
        score += m.rating * 5;
        break;
      case 'belum-ditonton':
        if (m.status !== 'watched') score += 20;
        break;
      case 'watchlist':
        if (m.status === 'watchlist') score += 30;
        break;
      case 'era-terbaru':
        score += (m.year - 2000) / 2;
        break;
      case 'klasik':
        if (m.year < 2005) score += 25;
        break;
    }

    // Boost unwatched films slightly
    if (m.status !== 'watched') score += 5;

    // Random shuffle factor for variety
    score += Math.random() * 8;

    return { movie: m, score };
  });

  // Sort by score and return top 6
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(s => s.movie);
}

// ---- Display Results ----
function displayResults(movies, { genre, basis, mood }) {
  const grid = document.getElementById('aiResultGrid');
  const title = document.getElementById('aiResultTitle');
  const desc = document.getElementById('aiResultDesc');

  if (!movies.length) {
    title.textContent = 'Tidak ada hasil';
    desc.textContent = 'Coba ubah filter atau suasana hati.';
    grid.innerHTML = '<div class="empty-state"><p>Ubah preferensi dan coba lagi.</p></div>';
    return;
  }

  // Build descriptive title
  const basisLabels = {
    'rating': 'rating tertinggi',
    'belum-ditonton': 'belum kamu tonton',
    'watchlist': 'dari watchlistmu',
    'era-terbaru': 'era terbaru',
    'klasik': 'klasik abadi'
  };

  const titleText = [
    genre !== 'semua' ? `${genre}` : 'Berbagai Genre',
    mood ? `• Suasana ${mood}` : '',
    `• ${basisLabels[basis] || ''}`
  ].filter(Boolean).join(' ');

  title.textContent = `🎬 Rekomendasi: ${titleText}`;
  desc.textContent = `${movies.length} film dipilih berdasarkan preferensimu. Klik poster untuk detail atau tambahkan ke watchlist.`;

  grid.innerHTML = movies.map(m => `
    <div class="movie-card" style="cursor:pointer">
      <div class="movie-poster">
        <div class="poster-bg" style="background:linear-gradient(160deg,${m.posterColor[0]},${m.posterColor[1]});position:relative">
          <div class="poster-overlay"></div>
          <div class="poster-content">
            <div class="poster-icon" style="color:${m.posterAccent}">${getGenreIcon(m.genre[0])}</div>
            <div class="poster-title-text" style="font-size:12px">${m.title}</div>
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${m.posterAccent};opacity:0.7"></div>
        </div>
        <div class="poster-year-badge">${m.year}</div>
        <div class="poster-status-badge ${m.status}">${m.status === 'watched' ? '✓' : '🔖'}</div>
        <div class="card-hover-overlay">
          <button class="hover-btn" onclick="openMovieDetail(${m.id})">🎬 Detail</button>
          ${m.status !== 'watchlist' && m.status !== 'watched'
            ? `<button class="hover-btn" onclick="addToWatchlist(${m.id},event)">+ Watchlist</button>` : ''}
          ${m.status !== 'watched'
            ? `<button class="hover-btn" onclick="markWatched(${m.id},event)">✓ Ditonton</button>` : ''}
        </div>
      </div>
      <div class="movie-card-info">
        <div class="movie-card-title" title="${m.title}">${m.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-year">${m.year}</span>
          <span class="movie-card-genre">${m.genre[0]}</span>
        </div>
        <div style="display:flex;gap:2px;margin-top:5px">${renderStars(Math.round(m.rating))}</div>
        ${m.mood && m.mood.length
          ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px">${m.mood.slice(0,2).join(' · ')}</div>` : ''}
      </div>
    </div>`).join('');
}

// ---- Quick Presets ----
function quickRecommend(type) {
  const resultCard = document.getElementById('aiResultCard');
  const loading = document.getElementById('aiLoading');
  const content = document.getElementById('aiResultContent');

  resultCard.classList.add('visible');
  loading.style.display = 'block';
  content.style.display = 'none';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  setTimeout(() => {
    let results = [];
    let title = '';
    let desc = '';

    switch (type) {
      case 'top-rated':
        results = MovieStore.getAll()
          .filter(m => m.userRating)
          .sort((a, b) => b.userRating - a.userRating || b.rating - a.rating)
          .slice(0, 6);
        title = '⭐ Film dengan Rating Terbaikmu';
        desc = 'Film-film yang kamu beri nilai paling tinggi.';
        break;

      case 'not-watched':
        results = MovieStore.getAll()
          .filter(m => m.status !== 'watched')
          .sort((a, b) => b.rating - a.rating + Math.random() * 2)
          .slice(0, 6);
        title = '🆕 Film yang Belum Ditonton';
        desc = 'Film-film menunggu untuk ditonton, diurutkan berdasarkan rating komunitas.';
        break;

      case 'similar-genre': {
        const watched = MovieStore.getByStatus('watched');
        const genreCounts = {};
        watched.forEach(m => m.genre.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1));
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        results = MovieStore.getAll()
          .filter(m => m.status !== 'watched' && (!topGenre || m.genre.includes(topGenre)))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 6);
        title = `🎭 Lebih Banyak ${topGenre || 'Film Seru'}`;
        desc = `Karena kamu suka genre ${topGenre || 'beragam'}, ini pilihan yang cocok untukmu.`;
        break;
      }

      case 'masterpiece':
        results = MovieStore.getAll()
          .filter(m => m.rating >= 4.5)
          .sort((a, b) => b.rating - a.rating + Math.random())
          .slice(0, 6);
        title = '🏆 Mahakarya Sinema';
        desc = 'Film-film terbaik dengan rating komunitas 4.5 ke atas.';
        break;
    }

    document.getElementById('aiResultTitle').textContent = title;
    document.getElementById('aiResultDesc').textContent = desc;
    displayResultsGrid(results);
    loading.style.display = 'none';
    content.style.display = 'block';
  }, 800);
}

function displayResultsGrid(movies) {
  const grid = document.getElementById('aiResultGrid');
  if (!movies.length) {
    grid.innerHTML = '<div class="empty-state"><p style="color:var(--text-muted)">Tidak ada film ditemukan.</p></div>';
    return;
  }
  grid.innerHTML = movies.map(m => `
    <div class="movie-card" style="cursor:pointer">
      <div class="movie-poster">
        <div class="poster-bg" style="background:linear-gradient(160deg,${m.posterColor[0]},${m.posterColor[1]});position:relative">
          <div class="poster-overlay"></div>
          <div class="poster-content">
            <div class="poster-icon" style="color:${m.posterAccent}">${getGenreIcon(m.genre[0])}</div>
            <div class="poster-title-text" style="font-size:12px">${m.title}</div>
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${m.posterAccent};opacity:0.7"></div>
        </div>
        <div class="poster-year-badge">${m.year}</div>
        <div class="card-hover-overlay">
          <button class="hover-btn" onclick="openMovieDetail(${m.id})">🎬 Detail</button>
          ${m.status !== 'watched' ? `<button class="hover-btn" onclick="markWatched(${m.id},event)">✓ Ditonton</button>` : ''}
        </div>
      </div>
      <div class="movie-card-info">
        <div class="movie-card-title" title="${m.title}">${m.title}</div>
        <div class="movie-card-meta">
          <span class="movie-card-year">${m.year}</span>
          <span class="movie-card-genre">${m.genre[0]}</span>
        </div>
        <div style="display:flex;gap:2px;margin-top:5px">${renderStars(Math.round(m.rating))}</div>
      </div>
    </div>`).join('');
}

// ---- Reset Form ----
function resetAIForm() {
  document.getElementById('aiGenre').value = 'semua';
  document.getElementById('aiBasis').value = 'rating';
  document.getElementById('aiDuration').value = '0';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  selectedMood = null;
  document.getElementById('aiResultCard').classList.remove('visible');
}

// ---- Genre Icon Helper ----
function getGenreIcon(genre) {
  const icons = { 'Sci-Fi': '🚀', 'Drama': '🎭', 'Thriller': '🔪', 'Aksi': '💥',
    'Animasi': '✨', 'Kriminal': '🔫', 'Musikal': '🎵', 'Petualangan': '🗺️',
    'Romansa': '❤️', 'Komedi': '😄', 'Perang': '⚔️', 'Sejarah': '📜',
    'Fantasi': '🔮', 'Misteri': '🕵️', 'Biografi': '📖', 'Musik': '🎶' };
  return icons[genre] || '🎬';
}
