import Footer from "@/app/_components/footer";

export const metadata = {
  title: '红医师博客 - 实践 = 知识 ⊗ 技术',
  description: '军事医学、应急响应与技术创新相关的文章和思考',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

