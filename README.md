# 🌌 Simon's Web Jam '96 | Cosmic Portfolio, CV & Stellar Bookshelf Database

An authentic **1996 Space Jam website**-themed personal portfolio, CV showcase, underground DJ audio player, and **client-side database-driven digital library** with 47+ books synced with Goodreads.

---

## 🪐 Theme: 1996 Space Jam Experience

- **Planetary Solar System Hub**: Central **SIMON'S WEB JAM '96** emblem with 6 interactive orbiting planets:
  - 🪐 **Planet Bio**: Executive statement & background in Business Engineering & IT.
  - 📋 **Planet CV**: Complete professional career, Sports & Leisure Group NV (€2M EBITDA supply chain), 24Flow, Sirris QRM Silver, and KU Leuven degrees.
  - 🚀 **Jump Station**: Coding experiments, repositories, and learning milestones.
  - 🎧 **Lunar Tunes**: Retro DJ audio deck with green LCD equalizer bars and underground electronic mix broadcasts.
  - 📚 **Stellar Bookshelf**: Complete database-driven library with 47 books, star ratings, live search, and sorting.
  - 📡 **Transmission Hub**: Direct frequencies (Email, Phone, LinkedIn, GitHub, Goodreads) and cosmic guestbook.
- **Visuals**: Starfield particle cosmos, glowing neon planetary rings, vintage 90s cyber typography, and Netscape-ready badges.

---

## 📚 Database Architecture: `data/books.json`

Instead of hardcoded HTML, all **47 books** from Simon's Goodreads profile are stored in a structured JSON database [`data/books.json`](file:///Users/snega/Documents/CV_website/data/books.json).

### Database Engine Features:
- 🔍 **Live Search Bar**: Search across 47 books by title, author, or synopsis keywords.
- 🏷️ **Shelf Filters**:
  - `All Books (47)`
  - `📖 Currently Reading (3)` (*The Federalist Papers*, *Plato*, *The Intelligent Investor*)
  - `⭐ 5-Star Hall of Fame (12)` (*Fanon*, *Humboldt*, *Malcolm X*, *Steinbeck*, *Frankenstein*, *Anna Karenina*, *1984*, *Steve Jobs*, etc.)
  - `✅ Read & Rated (44)`
- 🔽 **Sorting Options**:
  - *Default / Recent*
  - *Highest Rated (5★ ➔ 1★)*
  - *Title (A ➔ Z)*
  - *Publication Year (Newest / Oldest)*
- 📊 **Reading Analytics Dashboard**: Dynamically computes total books, in-progress count, 5-star count, and average rating.

---

## 🚀 How to Run Locally

1. Simply open [`index.html`](file:///Users/snega/Documents/CV_website/index.html) in your browser.
2. Or use Python's built-in web server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your web browser.

---

## 🛠️ Update & Deploy Workflow

Whenever you make updates:
```bash
git add .
git commit -m "Your update description"
git push
```
GitHub Pages automatically deploys your updates live at:
👉 **[https://simonn8.github.io/CV_website/](https://simonn8.github.io/CV_website/)**
