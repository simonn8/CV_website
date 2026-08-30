/* ==========================================================================
   Simon's Web Jam '96 & Bookshelf Database Query Engine
   ========================================================================== */

// Global State
let allBooks = [];
let currentFilter = "all";
let currentSearch = "";
let currentSort = "default";

document.addEventListener("DOMContentLoaded", () => {
  initSolarOrbitNavigation();
  initLunarAudioPlayer();
  initClock();
  initVisitorOdometer();
  initBookshelfDatabase();
});

/* =========================================================================
   1. SOLAR ORBIT NAVIGATION SYSTEM
   ========================================================================= */
function initSolarOrbitNavigation() {
  const solarHub = document.getElementById("solar-hub");
  const contentContainer = document.getElementById("content-container");
  const backBtn = document.getElementById("back-to-orbit-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const activePanelTitle = document.getElementById("active-panel-title");

  const planetButtons = document.querySelectorAll(".planet-btn, .hub-nav-text-links a, .quick-orbit-btn");
  const sections = document.querySelectorAll(".cosmic-section");
  const quickOrbitBtns = document.querySelectorAll(".quick-orbit-btn");

  const titleMap = {
    "planet-bio": "🪐 PLANET BIO &bull; EXECUTIVE DOSSIER",
    "planet-cv": "📋 PLANET CV &bull; EXPERIENCE &amp; SKILLS",
    "planet-projects": "🚀 JUMP STATION &bull; CODING LABS",
    "planet-audio": "🎧 LUNAR TUNES &bull; DJ AUDIO DECK",
    "planet-books": "📚 STELLAR BOOKSHELF &bull; DATABASE ENGINE",
    "planet-contact": "📡 TRANSMISSION HUB &bull; DIRECT FREQUENCIES"
  };

  function openSection(targetId) {
    if (!targetId) return;

    // Show content overlay, hide hub
    solarHub.style.display = "none";
    contentContainer.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Hide all sections, show active
    sections.forEach((sec) => sec.classList.remove("active"));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    // Update Titlebar
    if (activePanelTitle && titleMap[targetId]) {
      activePanelTitle.innerHTML = titleMap[targetId];
    }

    // Update Quick Orbit Bar
    quickOrbitBtns.forEach((btn) => {
      if (btn.getAttribute("data-target") === targetId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update URL hash
    window.location.hash = targetId.replace("planet-", "");
  }

  function returnToOrbit() {
    contentContainer.style.display = "none";
    solarHub.style.display = "flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  planetButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-target");
      if (target) openSection(target);
    });
  });

  if (backBtn) backBtn.addEventListener("click", returnToOrbit);
  if (closeBtn) closeBtn.addEventListener("click", returnToOrbit);

  // Check URL Hash on load
  if (window.location.hash) {
    const hashTarget = "planet-" + window.location.hash.replace("#", "");
    if (document.getElementById(hashTarget)) {
      openSection(hashTarget);
    }
  }
}

/* =========================================================================
   2. BOOKSHELF DATABASE QUERY ENGINE
   ========================================================================= */
async function initBookshelfDatabase() {
  const container = document.getElementById("dynamic-books-container");
  const loadingIndicator = document.getElementById("db-loading-indicator");
  const searchInput = document.getElementById("book-search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const filterPills = document.querySelectorAll(".db-filter-pill");
  const sortSelect = document.getElementById("book-sort-select");

  try {
    const response = await fetch("data/books.json");
    if (response.ok) {
      allBooks = await response.json();
    } else {
      throw new Error("Local fetch status not OK");
    }
  } catch (err) {
    console.log("Loading fallback book dataset...", err);
    allBooks = getFallbackBooks();
  }

  if (loadingIndicator) loadingIndicator.style.display = "none";

  // Update Stats & Counters
  updateReadingStats(allBooks);

  // Initial Render
  renderBookshelf();

  // Search Input Listener
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderBookshelf();
    });
  }

  // Clear Search Listener
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      currentSearch = "";
      renderBookshelf();
    });
  }

  // Shelf Filter Listener
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.getAttribute("data-filter");
      renderBookshelf();
    });
  });

  // Sort Select Listener
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderBookshelf();
    });
  }
}

function renderBookshelf() {
  const container = document.getElementById("dynamic-books-container");
  const resultsCount = document.getElementById("results-count");
  if (!container) return;

  // 1. Filter
  let filtered = allBooks.filter((book) => {
    // Shelf filter
    if (currentFilter === "currently-reading" && book.shelf !== "currently-reading") return false;
    if (currentFilter === "read" && book.shelf !== "read") return false;
    if (currentFilter === "five-stars" && book.user_rating !== 5) return false;

    // Search filter
    if (currentSearch) {
      const matchTitle = book.title && book.title.toLowerCase().includes(currentSearch);
      const matchAuthor = book.author && book.author.toLowerCase().includes(currentSearch);
      const matchSynopsis = book.synopsis && book.synopsis.toLowerCase().includes(currentSearch);
      if (!matchTitle && !matchAuthor && !matchSynopsis) return false;
    }

    return true;
  });

  // 2. Sort
  if (currentSort === "rating-high") {
    filtered.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0));
  } else if (currentSort === "title-az") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (currentSort === "year-desc") {
    filtered.sort((a, b) => parseInt(b.book_published || "0", 10) - parseInt(a.book_published || "0", 10));
  } else if (currentSort === "year-asc") {
    filtered.sort((a, b) => parseInt(a.book_published || "0", 10) - parseInt(b.book_published || "0", 10));
  }

  // Update Counter
  if (resultsCount) resultsCount.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--neon-yellow); font-family: var(--font-mono);">
        🛸 No books found matching "${currentSearch}". Try another query!
      </div>
    `;
    return;
  }

  // Render HTML Cards
  container.innerHTML = filtered.map((book) => {
    const isReading = book.shelf === "currently-reading";
    const statusClass = isReading ? "reading" : "read";
    const statusLabel = isReading ? "📖 READING" : "✅ READ";
    const ratingDisplay = isReading 
      ? `<span style="color: var(--neon-yellow);">In Progress</span>`
      : renderStars(book.user_rating);

    const cover = book.cover_url || "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c6077453f5d54873c69460f0.png";
    const year = book.book_published ? `(${book.book_published})` : "";

    return `
      <article class="cosmic-book-card">
        <div class="book-cover-box">
          <img src="${cover}" alt="${escapeHtml(book.title)}" class="book-poster" loading="lazy" onerror="this.src='https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c6077453f5d54873c69460f0.png';" />
          <span class="shelf-status-tag ${statusClass}">${statusLabel}</span>
        </div>
        <div class="book-content-box">
          <div>
            <h4 class="book-title-text">${escapeHtml(book.title)}</h4>
            <p class="book-author-text">by ${escapeHtml(book.author)} ${year}</p>
            <div class="book-rating-pill">
              <span class="star-string">${ratingDisplay}</span>
            </div>
            <p class="book-synopsis-text">${escapeHtml(book.synopsis || "No description logged.")}</p>
          </div>
          <a href="${book.goodreads_url || '#'}" target="_blank" rel="noopener noreferrer" class="goodreads-link-btn">
            Goodreads ↗
          </a>
        </div>
      </article>
    `;
  }).join("");
}

function renderStars(rating) {
  const r = parseInt(rating, 10) || 0;
  if (r === 0) return '<span style="color:#888;">Unrated</span>';
  const full = "★".repeat(r);
  const empty = "☆".repeat(5 - r);
  return `${full}${empty} <span class="rating-number">(${r}/5)</span>`;
}

function updateReadingStats(books) {
  const totalEl = document.getElementById("stat-total-books");
  const readingEl = document.getElementById("stat-reading-books");
  const fiveStarsEl = document.getElementById("stat-five-stars");
  const countAll = document.getElementById("count-all");
  const countReading = document.getElementById("count-reading");

  const total = books.length;
  const reading = books.filter((b) => b.shelf === "currently-reading").length;
  const fiveStars = books.filter((b) => b.user_rating === 5).length;

  if (totalEl) totalEl.textContent = total;
  if (readingEl) readingEl.textContent = reading;
  if (fiveStarsEl) fiveStarsEl.textContent = fiveStars;
  if (countAll) countAll.textContent = total;
  if (countReading) countReading.textContent = reading;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

/* =========================================================================
   3. LUNAR TUNES AUDIO PLAYER
   ========================================================================= */
function initLunarAudioPlayer() {
  const tracks = [
    { title: "01. Simon - Late Night Grooves & Electro Session", duration: "60:00" },
    { title: "02. Simon - Underground Vibes Volume 1", duration: "45:00" },
    { title: "03. Simon - Summer Sunset Live Recording", duration: "75:00" },
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  const titleEl = document.getElementById("current-track-name");
  const statusEl = document.getElementById("playback-status");
  const visualizerEl = document.getElementById("visualizer-bars");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  function updateTrack() {
    if (titleEl) {
      titleEl.textContent = tracks[currentTrackIndex].title;
    }
  }

  function setPlayingState(playing) {
    isPlaying = playing;
    if (isPlaying) {
      statusEl.textContent = "STATUS: BROADCASTING IN ORBIT 🎵";
      statusEl.style.color = "var(--neon-lime)";
      if (visualizerEl) visualizerEl.classList.add("playing");
    } else {
      statusEl.textContent = "STATUS: TRANSMISSION PAUSED ⏸";
      statusEl.style.color = "var(--neon-yellow)";
      if (visualizerEl) visualizerEl.classList.remove("playing");
    }
  }

  if (playBtn) playBtn.addEventListener("click", () => setPlayingState(true));
  if (pauseBtn) pauseBtn.addEventListener("click", () => setPlayingState(false));

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
      updateTrack();
      setPlayingState(true);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      updateTrack();
      setPlayingState(true);
    });
  }
}

/* =========================================================================
   4. CLOCK & VISITOR ODOMETER
   ========================================================================= */
function initClock() {
  const clockEl = document.getElementById("live-clock");
  if (!clockEl) return;

  function updateTime() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString();
  }
  updateTime();
  setInterval(updateTime, 1000);
}

function initVisitorOdometer() {
  const counterEl = document.getElementById("visitor-count");
  if (!counterEl) return;

  let count = parseInt(localStorage.getItem("spacejam_visitor_count") || "1996", 10);
  count += 1;
  localStorage.setItem("spacejam_visitor_count", count.toString());

  counterEl.textContent = count.toString().padStart(6, "0");
}

/* Fallback dataset if offline */
function getFallbackBooks() {
  return [
    {
      id: "110331",
      title: "The Federalist Papers",
      author: "Alexander Hamilton, James Madison, John Jay",
      shelf: "currently-reading",
      user_rating: 0,
      cover_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327865541l/110331.jpg",
      synopsis: "Classic collection of 85 essays arguing for constitutional governance.",
      book_published: "1788",
      goodreads_url: "https://www.goodreads.com/book/show/110331"
    },
    {
      id: "66933",
      title: "The Wretched of the Earth",
      author: "Frantz Fanon",
      shelf: "read",
      user_rating: 5,
      cover_url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1704228247l/66933._SX98_.jpg",
      synopsis: "A seminal analysis of the psychology of colonization and revolutionary struggle.",
      book_published: "1961",
      goodreads_url: "https://www.goodreads.com/book/show/66933.The_Wretched_of_the_Earth"
    }
  ];
}
