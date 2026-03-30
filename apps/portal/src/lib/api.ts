import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

function normalizeAll(s: string) {
  return [s, s.normalize?.("NFC"), s.normalize?.("NFD"), s.normalize?.("NFKC"), s.normalize?.("NFKD")].filter(
    Boolean,
  ) as string[];
}

export function getPostBySlug(slug: string) {
  const incoming = slug.replace(/\.md$/, "");
  const variants = new Set<string>([
    ...normalizeAll(incoming),
    ...normalizeAll(decodeURIComponent(incoming)),
  ]);

  // Find the first file whose slug matches in any normalization form
  const candidates = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));
  let matched: string | null = null;
  for (const file of candidates) {
    const base = file.replace(/\.md$/, "");
    const names = new Set<string>(normalizeAll(base));
    // also add decodeURIComponent just in case
    names.add(decodeURIComponent(base));
    for (const alt of normalizeAll(decodeURIComponent(base))) names.add(alt);
    for (const v of variants) {
      if (names.has(v)) {
        matched = file;
        break;
      }
    }
    if (matched) break;
  }

  const realSlug = matched ? matched.replace(/\.md$/, "") : incoming;
  const fullPath = join(postsDirectory, `${matched ?? `${incoming}.md`}`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return { ...data, slug: realSlug, content } as Post;
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // 过滤缺少关键元信息的草稿，避免主页渲染报错
    .filter((p) =>
      Boolean(
        p &&
          p.title &&
          p.date &&
          p.coverImage &&
          p.ogImage?.url &&
          (p as any).author && (p as any).author.name && (p as any).author.picture,
      ),
    )
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
