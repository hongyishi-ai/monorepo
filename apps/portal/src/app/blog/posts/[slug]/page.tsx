import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import Alert from "@/app/_components/alert";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import ReadingProgressBar from "@/app/_components/reading-progress";
import { BackToTop } from "@/app/_components/back-to-top";
import { ArticleToc } from "@/app/_components/article-toc";
import { MobileToc } from "@/app/_components/mobile-toc";

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  return (
    <main>
      <ReadingProgressBar placement="bottom" />
      <Alert preview={post.preview} />
      <Container>
        <Header />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row">
          <article id="article-content" className="flex-1">
            <PostHeader
              title={post.title}
              coverImage={post.coverImage}
              date={post.date}
              author={post.author}
            />
            <PostBody content={content} />
            <div className="mt-16 lg:hidden">
              <div className="sticky bottom-6 flex justify-end">
                <BackToTop />
              </div>
            </div>
          </article>
          <ArticleToc />
        </div>
        {/* Mobile TOC (mini bar + drawer) */}
        <MobileToc />
      </Container>
    </main>
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | 红医师博客`;

  return {
    title,
    openGraph: {
      title,
      images: [post.ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
