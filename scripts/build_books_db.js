const fs = require('fs');
const path = require('path');

const books = [];
const seenIds = new Set();

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
}

function getField(chunk, tag) {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const sIdx = chunk.indexOf(startTag);
  if (sIdx === -1) return '';
  const eIdx = chunk.indexOf(endTag, sIdx + startTag.length);
  if (eIdx === -1) return '';
  return cleanText(chunk.substring(sIdx + startTag.length, eIdx));
}

function getCover(chunk) {
  const tags = ['book_large_image_url', 'book_medium_image_url', 'book_image_url', 'book_small_image_url'];
  for (const tag of tags) {
    const raw = getField(chunk, tag);
    if (raw && !raw.includes('nophoto') && raw.startsWith('http')) return raw;
  }
  return '';
}

function processFeed(filePath, defaultShelf) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const chunks = content.split('<item>');
  chunks.shift();

  for (const chunk of chunks) {
    const bookId = getField(chunk, 'book_id') || getField(chunk, 'id');
    const title = getField(chunk, 'title');
    const author = getField(chunk, 'author_name');
    const cover = getCover(chunk);
    const rating = parseInt(getField(chunk, 'user_rating'), 10) || 0;
    const review = getField(chunk, 'user_review');
    let synopsis = getField(chunk, 'book_description');
    if (!synopsis) {
      synopsis = getField(chunk, 'description');
    }
    if (synopsis.length > 250) synopsis = synopsis.substring(0, 250) + '...';
    const pubYear = getField(chunk, 'book_published');
    const readAt = getField(chunk, 'user_read_at');
    const shelves = getField(chunk, 'user_shelves');
    const shelf = shelves.includes('currently-reading') ? 'currently-reading' : defaultShelf;

    if (bookId && title && !seenIds.has(bookId)) {
      seenIds.add(bookId);
      books.push({
        id: bookId,
        title: title,
        author: author || 'Unknown Author',
        shelf: shelf,
        user_rating: rating,
        user_review: review,
        cover_url: cover,
        synopsis: synopsis,
        book_published: pubYear,
        user_read_at: readAt,
        goodreads_url: 'https://www.goodreads.com/book/show/' + bookId
      });
    }
  }
}

processFeed('/Users/snega/.gemini/antigravity/brain/cf22c6a5-b0a8-458a-bf76-222c47736a20/.system_generated/steps/103/content.md', 'currently-reading');
processFeed('/Users/snega/.gemini/antigravity/brain/cf22c6a5-b0a8-458a-bf76-222c47736a20/.system_generated/steps/99/content.md', 'read');

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'books.json'), JSON.stringify(books, null, 2), 'utf8');
console.log(`Successfully saved ${books.length} books into data/books.json!`);

