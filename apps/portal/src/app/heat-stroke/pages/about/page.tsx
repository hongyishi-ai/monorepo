import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../../_components/project/projectNav";

function getHeatStrokeProject() {
  const entry = platformProjects.find((item) => item.id === "heat-stroke");

  if (!entry) {
    throw new Error("Missing heat-stroke project registry entry");
  }

  return entry;
}

const project = getHeatStrokeProject();
const projectChromeNav = buildProjectChromeNav("heatStroke", "/heat-stroke/");

const aboutParagraphs = [
  "“红医师”是一个由笔者发起的医疗公益项目，旨在汇聚医疗行业的资讯与实践经验，借助现代科技手段，让公众能够更加便捷地获取专业医疗知识。在科技迅猛发展的时代，推动医疗保障的现代化，是“红医师”始终不懈探索的方向与使命。",
  "“红医师热射病防治”平台，作为“红医师”项目的重要子栏目，专注于为可能面临热射病威胁的人群、医疗从业者以及广大公众提供科学、实用的知识支持，帮助大家快速了解这一危重疾病的特征与应对方法，从而提升社会整体应对突发健康危机的能力。",
  "作为一名长期奋战在医疗救援一线的工作者，我深知热射病的严峻危害。无数人曾因中暑而痛苦不堪，甚至有人因此失去了宝贵的生命。基于这一现实，我结合临床指南、个人经验以及热射病防治专家组的权威指导，倾力打造了这一资源平台。我始终坚信：生命的健康是我们学习、工作与生活品质的根本保障。为此，我诚挚呼吁每一个人积极学习热射病的预防、预警与急救知识，并将这一平台分享给更多需要帮助的人，让关爱传递更远。",
  "目前，“热射病防治”平台仍在不断完善之中，我真诚欢迎您提出宝贵的意见与建议。我将全力以赴，维护好这一公益性学习平台，为守护公众健康贡献绵薄之力。",
];

export const metadata = {
  title: "关于热射病防治项目 | 红医师",
  description: "红医师热射病防治平台项目介绍。",
};

export default function HeatStrokeAboutPage() {
  const content = project.content;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="about"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-about"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="border-b-2 border-border bg-muted/45">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-8 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-end md:py-16">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-normal text-muted-foreground">
                HEAT STROKE PROJECT
              </p>
              <h1 className="mt-4 text-[clamp(3.25rem,9vw,6.5rem)] font-black leading-[0.88] text-primary">
                关于
                <br />
                本项目
              </h1>
              <p className="mt-5 font-mono text-sm font-black text-muted-foreground">
                <time dateTime="2025-05-01">2025 年 5 月</time>
              </p>
            </div>

            <div className="rounded border-2 border-border bg-card p-5 shadow-[6px_6px_0_rgba(18,49,60,0.16)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.24)]">
              <img
                alt="红医师热射病防治平台项目图片，展示医疗救援与健康防护理念"
                className="aspect-[16/10] w-full rounded object-cover"
                src="/heat-stroke/assets/images/image.jpeg"
              />
            </div>
          </div>
        </section>

        <aside
          aria-label="内容审核状态"
          className="border-b-2 border-border bg-background"
          data-hongyishi-content-governance
        >
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-2 py-3 font-mono text-xs font-bold leading-5 text-muted-foreground md:grid-cols-[auto_1fr] md:items-center">
            <span className="w-fit border-2 border-primary bg-primary px-2 py-1 font-black text-primary-foreground">
              内容状态：待复核
            </span>
            <span className="text-foreground">
              {project.shortTitle} · {content.disclaimer}
            </span>
            <span className="md:col-span-2">
              来源：{content.sourceName} · 版本：{content.version} · 复核日期：
              {content.reviewedAt}.{" "}
              <a
                className="font-black text-foreground underline underline-offset-4"
                href={content.officialUpdateUrl}
              >
                官方更新源
              </a>
            </span>
          </div>
        </aside>

        <section className="mx-auto grid w-[min(960px,calc(100%_-_32px))] gap-6 py-12 md:py-16">
          <article className="rounded border-2 border-border bg-card p-6 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.12)] md:p-10 dark:shadow-[6px_6px_0_rgba(217,48,37,0.2)]">
            <div className="grid gap-6 text-lg font-bold leading-9 text-muted-foreground">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              className="rounded border-2 border-foreground bg-foreground px-5 py-4 text-center font-black text-background no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/"
            >
              返回项目首页
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/diagnosis-treatment-guideline"
            >
              查看诊断与治疗指南
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
