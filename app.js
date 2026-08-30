/* ==========================================================================
   2000s Retro Web Portfolio Interactive Scripts
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initClock();
  initMusicPlayer();
  initVisitorCounter();
});

/* 1. Tab Switching System */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTabId = button.getAttribute("data-tab");

      // Deactivate all buttons & contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Activate clicked button and target tab
      button.classList.add("active");
      const activeContent = document.getElementById(`tab-${targetTabId}`);
      if (activeContent) {
        activeContent.classList.add("active");
      }
    });
  });
}

/* 2. Retro Live Clock */
function initClock() {
  const clockElement = document.getElementById("live-clock");
  if (!clockElement) return;

  function updateTime() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }

  updateTime();
  setInterval(updateTime, 1000);
}

/* 3. Retro DJ Set / Winamp Player Simulation */
function initMusicPlayer() {
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
      statusEl.textContent = "STATUS: PLAYING 🎵";
      statusEl.style.color = "#00ff00";
      visualizerEl.classList.add("playing");
    } else {
      statusEl.textContent = "STATUS: PAUSED ⏸";
      statusEl.style.color = "#ffff00";
      visualizerEl.classList.remove("playing");
    }
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => setPlayingState(true));
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => setPlayingState(false));
  }

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

/* 4. Retro Visitor Counter */
function initVisitorCounter() {
  const counterEl = document.getElementById("visitor-count");
  if (!counterEl) return;

  let count = parseInt(localStorage.getItem("retro_visitor_count") || "1337", 10);
  count += 1;
  localStorage.setItem("retro_visitor_count", count.toString());

  // Format as 6 digits with leading zeros (e.g. 001338)
  counterEl.textContent = count.toString().padStart(6, "0");
}
