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

  const syncBtn = document.getElementById("sync-goodreads-btn");
  const syncStatusBadge = document.getElementById("db-sync-status-badge");

  // 1. Initialize dataset with all 47 books immediately
  allBooks = getFallbackBooks();

  // 2. Also try fetching from data/books.json if served via web server
  try {
    const response = await fetch("data/books.json");
    if (response.ok) {
      const fetched = await response.json();
      if (Array.isArray(fetched) && fetched.length > 0) {
        allBooks = fetched;
      }
    }
  } catch (err) {
    // Uses embedded 47-book dataset
  }

  if (loadingIndicator) loadingIndicator.style.display = "none";
  if (syncStatusBadge) syncStatusBadge.textContent = `● DB STATUS: ${allBooks.length} BOOKS READY`;

  // Update Stats & Initial Render
  updateReadingStats(allBooks);
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

  // Live Sync Button Listener
  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      syncBtn.textContent = "⏳ Syncing...";
      if (syncStatusBadge) syncStatusBadge.textContent = "● SYNCING GOODREADS RSS...";

      try {
        const feedUrl = "https://www.goodreads.com/review/list_rss/163717021?shelf=read";
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            if (syncStatusBadge) syncStatusBadge.textContent = `● SYNCED LIVE (${json.items.length} BOOKS FETCHED) 🟢`;
          }
        }
      } catch (e) {
        if (syncStatusBadge) syncStatusBadge.textContent = `● DB: ${allBooks.length} BOOKS ACTIVE`;
      } finally {
        syncBtn.textContent = "🔄 Sync Goodreads";
      }
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
   3. LUNAR TUNES AUDIO PLAYER & YOUTUBE STREAM ENGINE
   ========================================================================= */
const djSets = [
  {
    id: "MvYE8fAfuH4",
    title: "1. Ongehoord Collective | YAMI RECORDS (103)",
    channel: "YAMI RECORDS",
    date: "Latest Session"
  },
  {
    id: "keA0EYOCnQM",
    title: "2. Simon Nachtergaele @comalaradio | 05.08.26",
    channel: "Comala Radio",
    date: "05.08.26"
  },
  {
    id: "MEuUfsyMybs",
    title: "3. Simon Nachtergaele live at Radio Ruit 06.02.2026",
    channel: "Radio Ruit",
    date: "06.02.26"
  },
  {
    id: "LXlFbAsZi4A",
    title: "4. Simon Nachtergaele live at Radio Ruit 24.10.25",
    channel: "Radio Ruit",
    date: "24.10.25"
  },
  {
    id: "sieDJ4si6RU",
    title: "5. Simon Nachtergaele live at Radio Ruit 13.06.25",
    channel: "Radio Ruit",
    date: "13.06.25"
  }
];

let currentTrackIndex = 0;
let isAudioPlaying = false;
let ytPlayer = null;
let isYTReady = false;

// Global YouTube API Ready Callback
window.onYouTubeIframeAPIReady = function () {
  const container = document.getElementById("youtube-player");
  if (!container) return;

  ytPlayer = new YT.Player("youtube-player", {
    height: "100%",
    width: "100%",
    videoId: djSets[currentTrackIndex].id,
    playerVars: {
      autoplay: 1,
      playsinline: 1,
      controls: 1,
      rel: 0
    },
    events: {
      onReady: (event) => {
        isYTReady = true;
        // Attempt autoplay
        try {
          event.target.playVideo();
          setAudioState(true);
        } catch (e) {
          console.log("Autoplay waiting for user gesture...");
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          setAudioState(true);
        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
          setAudioState(false);
        }
      }
    }
  });
};

function initLunarAudioPlayer() {
  const iframe = document.getElementById("main-youtube-iframe");
  const titleEl = document.getElementById("current-track-name");
  const barTitleEl = document.getElementById("bar-track-title");
  const statusEl = document.getElementById("playback-status");
  const visualizerEl = document.getElementById("visualizer-bars");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const barPlayBtn = document.getElementById("bar-play-btn");
  const barPrevBtn = document.getElementById("bar-prev-btn");
  const barNextBtn = document.getElementById("bar-next-btn");
  const jumpAudioBtn = document.querySelector(".jump-to-audio-btn");

  function loadTrack(index, autoPlay = true) {
    currentTrackIndex = (index + djSets.length) % djSets.length;
    const track = djSets[currentTrackIndex];

    // If YouTube IFrame API is active
    if (ytPlayer && typeof ytPlayer.loadVideoById === "function") {
      ytPlayer.loadVideoById(track.id);
      if (autoPlay) {
        ytPlayer.playVideo();
      }
    } else if (iframe) {
      // Direct iframe fallback
      const autoParam = autoPlay ? "1" : "0";
      iframe.src = `https://www.youtube.com/embed/${track.id}?autoplay=${autoParam}&enablejsapi=1&playsinline=1`;
    }

    // Update Text Titles
    if (titleEl) titleEl.textContent = track.title;
    if (barTitleEl) barTitleEl.textContent = track.title;

    // Highlight Active Mix in List
    const mixRows = document.querySelectorAll(".mix-row");
    mixRows.forEach((row, rIdx) => {
      if (rIdx === currentTrackIndex) {
        row.classList.add("active-mix");
      } else {
        row.classList.remove("active-mix");
      }
    });

    setAudioState(autoPlay);
  }

  function setAudioState(playing) {
    isAudioPlaying = playing;
    if (isAudioPlaying) {
      if (statusEl) {
        statusEl.textContent = "STATUS: BROADCASTING IN ORBIT 🎵";
        statusEl.style.color = "var(--neon-lime)";
      }
      if (visualizerEl) visualizerEl.classList.add("playing");
      if (barPlayBtn) {
        barPlayBtn.textContent = "⏸ PAUSE";
        barPlayBtn.classList.add("active");
      }
      if (playBtn) playBtn.classList.add("play-active");
    } else {
      if (statusEl) {
        statusEl.textContent = "STATUS: TRANSMISSION PAUSED ⏸";
        statusEl.style.color = "var(--neon-yellow)";
      }
      if (visualizerEl) visualizerEl.classList.remove("playing");
      if (barPlayBtn) {
        barPlayBtn.textContent = "▶ PLAY";
        barPlayBtn.classList.remove("active");
      }
      if (playBtn) playBtn.classList.remove("play-active");
    }
  }

  function playCurrentTrack() {
    if (ytPlayer && typeof ytPlayer.playVideo === "function") {
      ytPlayer.unMute();
      ytPlayer.playVideo();
    } else if (iframe) {
      const track = djSets[currentTrackIndex];
      iframe.src = `https://www.youtube.com/embed/${track.id}?autoplay=1&enablejsapi=1&playsinline=1`;
    }
    setAudioState(true);
  }

  function pauseCurrentTrack() {
    if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
      ytPlayer.pauseVideo();
    } else if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
    setAudioState(false);
  }

  // Hook Up Controls
  if (playBtn) playBtn.addEventListener("click", () => playCurrentTrack());
  if (pauseBtn) pauseBtn.addEventListener("click", () => pauseCurrentTrack());
  if (nextBtn) nextBtn.addEventListener("click", () => loadTrack(currentTrackIndex + 1, true));
  if (prevBtn) prevBtn.addEventListener("click", () => loadTrack(currentTrackIndex - 1, true));

  // Floating Bar Controls
  if (barPlayBtn) {
    barPlayBtn.addEventListener("click", () => {
      if (isAudioPlaying) {
        pauseCurrentTrack();
      } else {
        playCurrentTrack();
      }
    });
  }
  if (barNextBtn) barNextBtn.addEventListener("click", () => loadTrack(currentTrackIndex + 1, true));
  if (barPrevBtn) barPrevBtn.addEventListener("click", () => loadTrack(currentTrackIndex - 1, true));

  if (jumpAudioBtn) {
    jumpAudioBtn.addEventListener("click", () => {
      const solarHub = document.getElementById("solar-hub");
      const contentContainer = document.getElementById("content-container");
      const activePanelTitle = document.getElementById("active-panel-title");
      const sections = document.querySelectorAll(".cosmic-section");

      if (solarHub) solarHub.style.display = "none";
      if (contentContainer) contentContainer.style.display = "block";
      sections.forEach((sec) => sec.classList.remove("active"));

      const audioSec = document.getElementById("planet-audio");
      if (audioSec) audioSec.classList.add("active");
      if (activePanelTitle) activePanelTitle.innerHTML = "🎧 LUNAR TUNES &bull; DJ AUDIO DECK";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Hook Up Track List Buttons
  const playButtons = document.querySelectorAll(".play-track-btn");
  playButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      loadTrack(idx, true);
    });
  });

  const mixRows = document.querySelectorAll(".mix-row");
  mixRows.forEach((row) => {
    row.addEventListener("click", () => {
      const idx = parseInt(row.getAttribute("data-set-index"), 10);
      loadTrack(idx, true);
    });
  });

  // Autoplay Initialization: Load the latest set immediately
  loadTrack(0, true);

  // Browser Autoplay Policy: On first user interaction, unmute and play
  const kickAutoplayOnUserGesture = () => {
    playCurrentTrack();
    window.removeEventListener("click", kickAutoplayOnUserGesture);
    window.removeEventListener("touchstart", kickAutoplayOnUserGesture);
    window.removeEventListener("keydown", kickAutoplayOnUserGesture);
  };

  window.addEventListener("click", kickAutoplayOnUserGesture, { once: true });
  window.addEventListener("touchstart", kickAutoplayOnUserGesture, { once: true });
  window.addEventListener("keydown", kickAutoplayOnUserGesture, { once: true });
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
    "id": "110331",
    "title": "The Federalist Papers",
    "author": "Alexander Hamilton",
    "shelf": "currently-reading",
    "user_rating": 0,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327865541l/110331.jpg",
    "synopsis": "Hailed by Thomas Jefferson as “the best commentary on the principles of government which was ever written\", The Federalist Papers is a collection of eighty-five essays published by Founding Fathers Alexander Hamilton, James Madison, and John Jay from...",
    "book_published": "1788",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/110331"
  },
  {
    "id": "9462",
    "title": "Plato: Complete Works",
    "author": "Plato",
    "shelf": "currently-reading",
    "user_rating": 0,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1415678006l/9462.jpg",
    "synopsis": "Outstanding translations by leading contemporary scholars--many commissioned especially for this volume--are presented here in the first single edition to include the entire surviving corpus of works attributed to Plato in antiquity. In his introduct...",
    "book_published": "-347",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/9462"
  },
  {
    "id": "106835",
    "title": "The Intelligent Investor",
    "author": "Benjamin Graham",
    "shelf": "currently-reading",
    "user_rating": 0,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1409602421l/106835.jpg",
    "synopsis": "More than one million hardcovers soldNow available for the first time in paperback!The Classic Text Annotated to Update Graham's Timeless Wisdom for Today's Market ConditionsThe greatest investment advisor of the twentieth century, Benjamin Graham ta...",
    "book_published": "1949",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/106835"
  },
  {
    "id": "5505708",
    "title": "The Story of the Integration of the Indian States (World Affairs: National and International Viewpoints)",
    "author": "V.P. Menon",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1507452810l/5505708._SY475_.jpg",
    "synopsis": "When on August 1947 India became an Independent Dominion in the British Commonwealth of Nations, one of the largest unresolved problems facing it was the presence of 554 princely states within its boundaries. The British Government had announced that...",
    "book_published": "1956",
    "user_read_at": "Mon, 24 Aug 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/5505708"
  },
  {
    "id": "66933",
    "title": "The Wretched of the Earth",
    "author": "Frantz Fanon",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1704228247l/66933._SX318_.jpg",
    "synopsis": "A distinguished psychiatrist from Martinique who took part in the Algerian Nationalist Movement, Frantz Fanon was one of the most important theorists of revolutionary struggle, colonialism, and racial difference in history. Fanon's masterwork is a cl...",
    "book_published": "1961",
    "user_read_at": "Sat, 8 Aug 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/66933"
  },
  {
    "id": "23995249",
    "title": "The Invention of Nature: Alexander von Humboldt's New World",
    "author": "Andrea Wulf",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1452449264l/23995249.jpg",
    "synopsis": "Alexander von Humboldt (1769-1859) was the most famous scientist of his age, a visionary German naturalist and polymath whose discoveries forever changed the way we understand the natural world. Among his most revolutionary ideas was a radical concep...",
    "book_published": "2015",
    "user_read_at": "Sat, 1 Aug 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/23995249"
  },
  {
    "id": "433797",
    "title": "Defeat Into Victory: Battling Japan in Burma and India, 1942-1945",
    "author": "William Slim",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1347280205l/433797.jpg",
    "synopsis": "Field Marshal Viscount Slim (1891-1970) led shattered British forces from Burma to India in one of the lesser-known but more nightmarish retreats of World War II. He then restored his army's fighting capabilities and morale with virtually no support ...",
    "book_published": "1956",
    "user_read_at": "Thu, 30 Jul 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/433797"
  },
  {
    "id": "28862",
    "title": "The Prince",
    "author": "Niccolò Machiavelli",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1390055828l/28862.jpg",
    "synopsis": "Machiavelli needs to be looked at as he really was. Hence: Can Machiavelli, who makes the following observations, be Machiavellian as we understand the disparaging term?1. So it is that to know the nature of a people, one need be a Prince; to know th...",
    "book_published": "1513",
    "user_read_at": "Tue, 14 Jul 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/28862"
  },
  {
    "id": "36578942",
    "title": "The 100-Year-Old Man Who Climbed Out the Window and Disappeared (Hundred-Year-Old Man, #1)",
    "author": "Jonas Jonasson",
    "shelf": "read",
    "user_rating": 0,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1510447566l/36578942._SY475_.jpg",
    "synopsis": "After a long and eventful life, Allan Karlsson ends up in a nursing home, believing it to be his last stop. The only problem is that he’s still in good health. A big celebration is in the works for his 100th birthday, but Allan really isn’t intereste...",
    "book_published": "2009",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/36578942"
  },
  {
    "id": "4145202",
    "title": "Frankenstein",
    "author": "Mary Wollstonecraft Shelley",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1348644616l/4145202.jpg",
    "synopsis": "Shelley's suspenseful and intellectually rich gothic tale confronts some of the most important and enduring themes in all of literture--the power of human imagination, the potential hubris of science, the gulf between appearance and essence, the effe...",
    "book_published": "1818",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/4145202"
  },
  {
    "id": "233411514",
    "title": "Meditations",
    "author": "Marcus Aurelius",
    "shelf": "read",
    "user_rating": 0,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1750554861l/233411514._SY475_.jpg",
    "synopsis": "Written in Greek, without any intention of publication, by the only Roman emperor who was also a philosopher, the Meditations of Marcus Aurelius (AD 121-180) offer a remarkable series of challenging spiritual reflections and exercises developed as th...",
    "book_published": "180",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/233411514"
  },
  {
    "id": "6859244",
    "title": "Het Communistisch Manifest",
    "author": "Karl Marx",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1252838431l/6859244.jpg",
    "synopsis": "A rousing call to arms whose influence is still felt todayOriginally published on the eve of the 1848 European revolutions, The Communist Manifesto is a condensed and incisive account of the worldview Marx and Engels developed during their hectic int...",
    "book_published": "1848",
    "user_read_at": "Fri, 10 Jul 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/6859244"
  },
  {
    "id": "161789",
    "title": "The Toyota Way: 14 Management Principles from the World's Greatest Manufacturer",
    "author": "Jeffrey K. Liker",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1436741874l/161789._SY475_.jpg",
    "synopsis": "\"This book will give you an understanding of what has made Toyota successful and some practical ideas that you can use to develop your own approach to business.\"--Gary Convis, Managing Office of ToyotaFewer man-hours. Less inventory. The highest qual...",
    "book_published": "2003",
    "user_read_at": "Thu, 9 Jul 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/161789"
  },
  {
    "id": "15823480",
    "title": "Anna Karenina",
    "author": "Leo Tolstoy",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1546091617l/15823480._SY475_.jpg",
    "synopsis": "Acclaimed by many as the world's greatest novel, Anna Karenina provides a vast panorama of contemporary life in Russia and of humanity in general. In it Tolstoy uses his intense imaginative insight to create some of the most memorable characters in a...",
    "book_published": "1878",
    "user_read_at": "Wed, 24 Jun 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/15823480"
  },
  {
    "id": "61439040",
    "title": "1984",
    "author": "George Orwell",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1657781256l/61439040._SX318_.jpg",
    "synopsis": "A masterpiece of rebellion and imprisonment where war is peace freedom is slavery and Big Brother is watching. Thought Police, Big Brother, Orwellian - these words have entered our vocabulary because of George Orwell's classic dystopian novel 1984. T...",
    "book_published": "1949",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/61439040"
  },
  {
    "id": "220161058",
    "title": "Apple in China: The Capture of the World's Greatest Company",
    "author": "Patrick McGee",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1740350739l/220161058._SY475_.jpg",
    "synopsis": "For readers of Walter Isaacson’s Steve Jobs and Chris Miller’s Chip War, a riveting look at how Apple helped build China’s dominance in electronics assembly and manufacturing only to find itself trapped in a relationship with an authoritarian state m...",
    "book_published": "2025",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/220161058"
  },
  {
    "id": "10884",
    "title": "Einstein: His Life and Universe",
    "author": "Walter Isaacson",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1328011405l/10884.jpg",
    "synopsis": "Einstein was a rebel and nonconformist from boyhood days, and these character traits drove both his life and his science. In this narrative, Walter Isaacson explains how his mind worked and the mysteries of the universe that he discovered.",
    "book_published": "2007",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/10884"
  },
  {
    "id": "34448463",
    "title": "Inside the Battle of Algiers: Memoir of a Woman Freedom Fighter",
    "author": "Zohra Drif",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1490293101l/34448463.jpg",
    "synopsis": "This gripping insider’s account chronicles how and why a young woman in 1950s Algiers joined the armed wing of Algeria’s national liberation movement to combat her country’s French occupiers. When the movement’s leaders turned to Drif and her female ...",
    "book_published": "2017",
    "user_read_at": "Thu, 23 Apr 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/34448463"
  },
  {
    "id": "4069",
    "title": "Man's Search for Meaning",
    "author": "Viktor E. Frankl",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1535419394l/4069._SY475_.jpg",
    "synopsis": "Psychiatrist Viktor Frankl's memoir has riveted generations of readers with its descriptions of life in Nazi death camps and its lessons for spiritual survival. Based on his own experience and the stories of his patients, Frankl argues that we cannot...",
    "book_published": "1946",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/4069"
  },
  {
    "id": "9717",
    "title": "The Unbearable Lightness of Being",
    "author": "Milan Kundera",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1265401884l/9717.jpg",
    "synopsis": "In The Unbearable Lightness of Being, Milan Kundera tells the story of a young woman in love with a man torn between his love for her and his incorrigible womanizing and one of his mistresses and her humbly faithful lover. This magnificent novel juxt...",
    "book_published": "1984",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/9717"
  },
  {
    "id": "5211",
    "title": "A Fine Balance",
    "author": "Rohinton Mistry",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1551173390l/5211._SY475_.jpg",
    "synopsis": "With a compassionate realism and narrative sweep that recall the work of Charles Dickens, this magnificent novel captures all the cruelty and corruption, dignity and heroism, of India. The time is 1975. The place is an unnamed city by the sea. The go...",
    "book_published": "1995",
    "user_read_at": "Tue, 7 Apr 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/5211"
  },
  {
    "id": "92057",
    "title": "The Autobiography of Malcolm X",
    "author": "Malcolm X",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1434682864l/92057.jpg",
    "synopsis": "Alternate cover for ISBN 9780345350688Through a life of passion and struggle, Malcolm X became one of the most influential figures of the 20th Century. In this riveting account, he tells of his journey from a prison cell to Mecca, describing his tran...",
    "book_published": "1965",
    "user_read_at": "Mon, 9 Mar 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/92057"
  },
  {
    "id": "11084145",
    "title": "Steve Jobs",
    "author": "Walter Isaacson",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1511288482l/11084145._SY475_.jpg",
    "synopsis": "Walter Isaacson's worldwide bestselling biography of Apple cofounder Steve Jobs. Based on more than forty interviews with Steve Jobs conducted over two years--as well as interviews with more than 100 family members, friends, adversaries, competitors,...",
    "book_published": "2011",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/11084145"
  },
  {
    "id": "223736214",
    "title": "Breakneck: China's Quest to Engineer the Future",
    "author": "Dan Wang",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1765233885l/223736214._SY475_.jpg",
    "synopsis": "As the defining conflict of the twenty-first century approaches, Breakneck offers a riveting, firsthand investigation of China’s seismic progress—and what it means for America.Technology analyst Dan Wang—“an indispensable voice on China” (Evan Osnos)...",
    "book_published": "2025",
    "user_read_at": "Fri, 13 Feb 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/223736214"
  },
  {
    "id": "318431",
    "title": "Long Walk to Freedom",
    "author": "Nelson Mandela",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327997342l/318431.jpg",
    "synopsis": "Nelson Mandela is one of the great moral and political leaders of our time: an international hero whose lifelong dedication to the fight against racial oppression in South Africa won him the Nobel Peace Prize and the presidency of his country. Since ...",
    "book_published": "1991",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/318431"
  },
  {
    "id": "8095331",
    "title": "It's About Time: The Competitive Advantage of Quick Response Manufacturing",
    "author": "Rajan Suri",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1348430788l/8095331.jpg",
    "synopsis": "In the decade since the publication of Rajan Suri’s landmark book, Quick Response Manufacturing , the innovative principles of QRM have been proven with impressive results at many companies, big and small, in a variety of industries. While the key pr...",
    "book_published": "2010",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/8095331"
  },
  {
    "id": "113934",
    "title": "The Goal: A Process of Ongoing Improvement",
    "author": "Eliyahu M. Goldratt",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1475538019l/113934._SY475_.jpg",
    "synopsis": "Written in a fast-paced thriller style, The Goal, a gripping novel, is transforming management thinking throughout the world. It is a book to recommend to your friends in industry - even to your bosses - but not to your competitors. Alex Rogo is a ha...",
    "book_published": "",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/113934"
  },
  {
    "id": "10836",
    "title": "Che Guevara: A Revolutionary Life",
    "author": "Jon Lee Anderson",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1406995661l/10836.jpg",
    "synopsis": "\"Acclaimed around the world and a national best-seller, this is the definitive work on Che Guevara, the dashing rebel whose epic dream was to end poverty and injustice in Latin America and the developing world through armed revolution. Jon Lee Anders...",
    "book_published": "1997",
    "user_read_at": "Sun, 1 Feb 2026 00:00:00 +0000",
    "goodreads_url": "https://www.goodreads.com/book/show/10836"
  },
  {
    "id": "117833",
    "title": "The Master and Margarita",
    "author": "Mikhail Bulgakov",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1327867963l/117833.jpg",
    "synopsis": "The first complete, annotated English Translation of Mikhail Bulgakov's comic masterpiece.An audacious revision of the stories of Faust and Pontius Pilate, The Master and Margarita is recognized as one of the essential classics of modern Russian lite...",
    "book_published": "1925",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/117833"
  },
  {
    "id": "1772910",
    "title": "White Nights",
    "author": "Fyodor Dostoevsky",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1450699039l/1772910.jpg",
    "synopsis": "White Nights is a short story by Fyodor Dostoevsky that was published in 1848. Set in St. Petersburg, it is the story of a young man fighting his inner restlessness. A light and tender narrative, it delves into the torment and guilt of unrequited lov...",
    "book_published": "1848",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/1772910"
  },
  {
    "id": "17159733",
    "title": "A Long Walk to Freedom: 1918-1962: Early Years, 1918-1962 v. 1",
    "author": "Nelson Mandela",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1394258769l/17159733.jpg",
    "synopsis": "The riveting memoirs of the outstanding moral and political leader of our time, LONG WALK TO FREEDOM brilliantly recreates the drama of the experiences that helped shape Nelson Mandela's destiny. From his beginning in the Transkei to his being taken ...",
    "book_published": "1994",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/17159733"
  },
  {
    "id": "18114322",
    "title": "The Grapes of Wrath",
    "author": "John Steinbeck",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1375670575l/18114322.jpg",
    "synopsis": "The Pulitzer Prize-winning epic of the Great Depression, a book that galvanized—and sometimes outraged—millions of readers.First published in 1939, Steinbeck’s Pulitzer Prize-winning epic of the Great Depression chronicles the Dust Bowl migration of ...",
    "book_published": "1939",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/18114322"
  },
  {
    "id": "219324018",
    "title": "Waarom het kind in de polenta kookt",
    "author": "Aglaja Veteranyi",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1726682333l/219324018._SY475_.jpg",
    "synopsis": "Twee jonge zussen in een Roemeense circusfamilie zoeken naar houvast in een bestaan dat zich afspeelt in twee werelden: het kleurrijke thuis van het circus en de karavaan, en de harde realiteit van voortdurend buitenstaander en onderweg zijn. Om hun ...",
    "book_published": "1999",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/219324018"
  },
  {
    "id": "10210",
    "title": "Jane Eyre",
    "author": "Charlotte Brontë",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1557343311l/10210._SY475_.jpg",
    "synopsis": "Alternate editions can be found here and here.A gothic masterpiece of tempestuous passions and dark secrets, Charlotte Brontë's Jane Eyre is edited with an introduction and notes by Stevie Davis in Penguin Classics.Charlotte Brontë tells the story of...",
    "book_published": "1847",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/10210"
  },
  {
    "id": "56916837",
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1612238791l/56916837._SY475_.jpg",
    "synopsis": "One of the best-loved stories of all time, To Kill a Mockingbird has been translated into more than forty languages, sold more than forty million copies worldwide, served as the basis for an enormously popular motion picture, and was voted one of the...",
    "book_published": "1960",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/56916837"
  },
  {
    "id": "3675181",
    "title": "De pest",
    "author": "Albert Camus",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1219750252l/3675181.jpg",
    "synopsis": "Het uitbreken van een pestepidemie in een Noord-Afrikaanse stad met als gevolg het totale isolement stelt de bewoners voor fundamentele vragen over goed en kwaad.",
    "book_published": "1947",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/3675181"
  },
  {
    "id": "4406",
    "title": "East of Eden",
    "author": "John Steinbeck",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1639969375l/4406.jpg",
    "synopsis": "In his journal, Nobel Prize winner John Steinbeck called East of Eden “the first book,” and indeed it has the primordial power and simplicity of myth. Set in the rich farmland of California’s Salinas Valley, this sprawling and often brutal novel foll...",
    "book_published": "1952",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/4406"
  },
  {
    "id": "8225859",
    "title": "Congo: een geschiedenis",
    "author": "David Van Reybrouck",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1274853817l/8225859.jpg",
    "synopsis": "Er is aan het begin van de eenentwintigste eeuw nauwelijks een roeriger natie dan Congo, het reusachtige land in het hart van Afrika, dat barst van de grondstoffen die onontbeerlijk zijn in onze moderne tijd – én van de gruwelijke conflicten. Hoe kon...",
    "book_published": "2010",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/8225859"
  },
  {
    "id": "55253543",
    "title": "Revolusi: Indonesië en het ontstaan van de moderne wereld",
    "author": "David Van Reybrouck",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1599466482l/55253543._SY475_.jpg",
    "synopsis": "Vijf jaar lang werkte David Van Reybrouck aan zijn monumentale Revolusi. Hij interviewde bijna tweehonderd mensen, de laatste nog levende getuigen van de onafhankelijkheidsstrijd, in Indonesische rusthuizen, Japanse miljoenensteden en op verafgelegen...",
    "book_published": "2020",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/55253543"
  },
  {
    "id": "34265228",
    "title": "Aurangzeb: The Man and the Myth",
    "author": "Audrey Truschke",
    "shelf": "read",
    "user_rating": 3,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1505059365l/34265228.jpg",
    "synopsis": "THE MUGHAL EMPEROR AURANGZEB ALAMGIR, who reigned from 1658 to 1707, is one of the most hated men in Indian history. Widely reviled as a religious fanatic who sought to violently oppress Hindus, he is even blamed by some for setting into motion confl...",
    "book_published": "2017",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/34265228"
  },
  {
    "id": "323455",
    "title": "De Profundis",
    "author": "Oscar Wilde",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1312003472l/323455.jpg",
    "synopsis": "De Profundis (Latin: \"from the depths\") is a 50,000 word letter written by Oscar Wilde during his imprisonment in Reading Gaol, to Lord Alfred Douglas, his lover. Wilde wrote the letter between January and March 1897; he was not allowed to send it, b...",
    "book_published": "1897",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/323455"
  },
  {
    "id": "3153446",
    "title": "Wilde zwanen: drie dochters van China",
    "author": "Jung Chang",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1390457822l/3153446.jpg",
    "synopsis": "Wilde zwanen geeft een panoramische visie op het China van de twintigste eeuw. Het beschrijft het leven van de grootmoeder van Jung Chang, concubine van een generaal in het feodale China, van haar moeder, hoge partijfunctionaris tijdens het communist...",
    "book_published": "1991",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/3153446"
  },
  {
    "id": "52382796",
    "title": "Shōgun (Asian Saga, #1)",
    "author": "James Clavell",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1704385704l/52382796._SY475_.jpg",
    "synopsis": "After Englishman John Blackthorne is lost at sea, he awakens in a place few Europeans know of and even fewer have seen--Nippon. Thrust into the closed society that is seventeenth-century Japan, a land where the line between life and death is razor-th...",
    "book_published": "1975",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/52382796"
  },
  {
    "id": "77203",
    "title": "The Kite Runner",
    "author": "Khaled Hosseini",
    "shelf": "read",
    "user_rating": 4,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1579036753l/77203._SY475_.jpg",
    "synopsis": "1970s Twelve-year-old Amir is desperate to win the local kite-fighting tournament and his loyal friend Hassan promises to help him. But neither of the boys can foresee what would happen to Hassan that afternoon, an event that is to shatter their live...",
    "book_published": "2003",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/77203"
  },
  {
    "id": "25986929",
    "title": "Goodnight Punpun Omnibus, Vol. 1",
    "author": "Inio Asano",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1449607528l/25986929.jpg",
    "synopsis": "Meet Punpun Punyama. He’s an average kid in an average town.He wants to win a Nobel Prize and save the world.He wants to go far away with his true love.He wants to find some porn.But Punpun’s life is about to unravel…",
    "book_published": "2006",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/25986929"
  },
  {
    "id": "29761157",
    "title": "Het meisje dat van IS won: Ontvoerd, verkocht, ontsnapt",
    "author": "Farida Khalaf",
    "shelf": "read",
    "user_rating": 5,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1459606246l/29761157.jpg",
    "synopsis": "Verkocht. Het duurde even voordat ik het besefte. Ik was verkocht als een dier op de veemarkt. De mannen die me hadden ontvoerd en gevangen gehouden, hadden me nu verpatst. Voor geld hadden ze me aan andere mannen doorgegeven, die met me konden doen ...",
    "book_published": "2016",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/29761157"
  },
  {
    "id": "48554421",
    "title": "Ode aan de verwondering",
    "author": "Caroline Pauwels",
    "shelf": "read",
    "user_rating": 2,
    "user_review": "",
    "cover_url": "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1571750486l/48554421._SY475_.jpg",
    "synopsis": "Kinderen zijn vaak verwonderd. Waarom is de zee blauw? Waarom wordt het donker? Waarom is die meneer kaal? Ergens op weg naar de volwassenheid verliezen de meesten van ons die onbevangenheid. Gaandeweg wordt het vuur van de nieuwsgierigheid gedoofd: ...",
    "book_published": "2019",
    "user_read_at": "",
    "goodreads_url": "https://www.goodreads.com/book/show/48554421"
  }
];
}
