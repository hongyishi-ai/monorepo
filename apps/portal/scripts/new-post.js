#!/usr/bin/env node
/*
 * Create a new blog post and asset folder.
 * Usage:
 *   npm run new:post -- --slug my-article --title "My Article" \
 *     --author "Your Name" --authorPic "/assets/blog/authors/zwz.jpeg" \
 *     --excerpt "One-line summary"
 */
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function toTitle(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFileSafe(p, content) {
  if (fs.existsSync(p)) {
    console.error(`File exists: ${p}`);
    process.exit(1);
  }
  fs.writeFileSync(p, content);
}

function writePlaceholderJpg(dest) {
  // 1x1 white JPEG
  const b64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEBAVFQ8QDxAQEA8QDxAQDxAQFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGhAQGisdHSUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAcACAMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAABQYBAwQCB//EADYQAAICAgEDAwIEBgMAAAAAAAABAgMRBCEFEjFBUWEGEzKBkaEHMlJSc8HR8CMzQ1OCov/EABkBAQADAQEAAAAAAAAAAAAAAAABAgMEBf/EAB8RAQEAAgIDAQEAAAAAAAAAAAABAhEDIRIxQQQTUf/aAAwDAQACEQMRAD8A9wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/Z';
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
}

(function main() {
  const {
    slug,
    title: _title,
    excerpt = '',
    date,
    author = 'Your Name',
    authorPic = '/assets/blog/authors/zwz.jpeg',
  } = parseArgs();

  if (!slug) {
    console.error('Missing --slug');
    process.exit(1);
  }
  if (!/^[A-Za-z0-9\-]+$/.test(slug)) {
    console.error('Slug should contain only letters, numbers and dashes.');
    process.exit(1);
  }
  const title = _title || toTitle(slug);
  const when = date || new Date().toISOString();

  const repo = process.cwd();
  const postsDir = path.join(repo, '_posts');
  const assetsDir = path.join(repo, 'public', 'assets', 'blog', slug);

  ensureDir(postsDir);
  ensureDir(assetsDir);

  const mdPath = path.join(postsDir, `${slug}.md`);
  const fm = `---\n` +
    `title: "${title}"\n` +
    `excerpt: "${excerpt}"\n` +
    `coverImage: "/assets/blog/${slug}/cover.jpg"\n` +
    `date: "${when}"\n` +
    `author:\n  name: "${author}"\n  picture: "${authorPic}"\n` +
    `ogImage:\n  url: "/assets/blog/${slug}/cover.jpg"\n` +
    `---\n\n` +
    `## 引言\n\n这里写 1–2 段开篇。\n\n` +
    `## 正文\n\n这是你的新文章 \"${title}\"。\n\n` +
    `![示例图片](/assets/blog/${slug}/image-1.jpg)\n\n` +
    `## 总结\n\n用要点总结全文。\n`;

  writeFileSafe(mdPath, fm);

  // Create placeholder images: cover.jpg, image-1.jpg, inline.svg
  const coverPath = path.join(assetsDir, 'cover.jpg');
  if (!fs.existsSync(coverPath)) writePlaceholderJpg(coverPath);

  const img1Path = path.join(assetsDir, 'image-1.jpg');
  if (!fs.existsSync(img1Path)) writePlaceholderJpg(img1Path);

  const inlineSvgPath = path.join(assetsDir, 'inline.svg');
  if (!fs.existsSync(inlineSvgPath)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="#dbeafe"/><circle cx="400" cy="200" r="120" fill="#60a5fa"/><text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="'Noto Sans SC', 'Noto Sans CJK SC', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="18" fill="#1e3a8a">/assets/blog/${slug}/inline.svg</text></svg>`;
    fs.writeFileSync(inlineSvgPath, svg);
  }

  console.log('Created:');
  console.log(' -', path.relative(repo, mdPath));
  console.log(' -', path.relative(repo, coverPath));
  console.log(' -', path.relative(repo, img1Path));
  console.log(' -', path.relative(repo, inlineSvgPath));
  console.log('\nNext steps:');
  console.log(` - Add images to public/assets/blog/${slug}/`);
  console.log(` - Run dev: npm run dev, open /posts/${slug}`);
})();
