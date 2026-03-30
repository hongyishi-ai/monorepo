import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";

export default async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(gfm) // GitHub-flavored Markdown: tables, autolinks, strikethrough, task lists
    .use(
      html,
      {
        // Allow authored HTML (anchors, superscripts, etc.) to pass through.
        // Posts are trusted content, and preserving these tags keeps in-page reference links working.
        sanitize: false,
      },
    )
    .process(markdown);
  return result.toString();
}
