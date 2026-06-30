import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../_components/project/ProjectChrome";

function getTcccProject() {
  const entry = platformProjects.find((item) => item.id === "tccc");

  if (!entry) {
    throw new Error("Missing tccc project registry entry");
  }

  return entry;
}

const project = getTcccProject();

const bottomItems = [
  { id: "standard", label: "标准", href: "/tccc/pages/tccc-standard" },
  { id: "tfc", label: "TFC", href: "/tccc/pages/tfc-hemorrhage" },
  {
    id: "tacevac",
    label: "TACEVAC",
    href: "/tccc/pages/tacevac-reassessment",
  },
  { id: "directory", label: "目录", href: "/tccc/" },
];

const menuItems = [
  { id: "platform", label: "总入口", href: "/" },
  { id: "directory", label: "项目首页", href: "/tccc/" },
  { id: "standard", label: "标准流程", href: "/tccc/pages/tccc-standard" },
  { id: "tfc", label: "TFC 大出血", href: "/tccc/pages/tfc-hemorrhage" },
  { id: "airway", label: "TFC 气道", href: "/tccc/pages/tfc-airway" },
  { id: "breathing", label: "呼吸管理", href: "/tccc/pages/tccc-breathing" },
  {
    id: "hypothermia",
    label: "低体温预防",
    href: "/tccc/pages/tccc-hypothermia",
  },
  {
    id: "tacevac",
    label: "TACEVAC 复评",
    href: "/tccc/pages/tacevac-reassessment",
  },
  { id: "course", label: "课程目录", href: "/tccc/pages/tccc-flow-framework" },
];

const primaryFlows = [
  {
    phase: "MARCH",
    title: "TCCC标准流程",
    subtitle: "TCCC Standard Algorithm",
    body: "全面的战术战斗伤员救护流程，包含从交火中救治到战术区域救护的完整步骤。",
    href: "/tccc/pages/tccc-standard",
    action: "查看流程",
  },
  {
    phase: "M",
    title: "大出血流程",
    subtitle: "Massive Hemorrhage Algorithm",
    body: "针对大出血情况的紧急处理流程，包括止血工具选择和操作步骤。",
    href: "/tccc/pages/tfc-hemorrhage",
    action: "查看流程",
  },
  {
    phase: "A",
    title: "气道管理算法",
    subtitle: "Airway Management Algorithm",
    body: "气道评估与管理流程，包括基础气道处理和高级气道技术的应急管理。",
    href: "/tccc/pages/tfc-airway",
    action: "查看流程",
  },
  {
    phase: "R",
    title: "呼吸管理算法",
    subtitle: "Breathing Management Algorithm",
    body: "战伤呼吸问题的评估与处理流程，包括胸部伤情的识别和紧急处理措施。",
    href: "/tccc/pages/tccc-breathing",
    action: "查看流程",
  },
];

const flowCards = [
  {
    title: "静脉通路与止血酸",
    subtitle: "Circulation Algorithm",
    body: "静脉通路建立与止血酸使用的专项流程，包括适应症判断和操作步骤。",
    href: "/tccc/pages/tccc-iv-txa",
  },
  {
    title: "骨盆绑带流程",
    subtitle: "Pelvic Binder Algorithm",
    body: "针对骨盆出血的专项救治流程，详细说明骨盆绑带的使用适应症和操作步骤。",
    href: "/tccc/pages/tccc-pelvic-binder",
  },
  {
    title: "疼痛管理与镇痛",
    subtitle: "Pain Management & Analgesia",
    body: "战场疼痛评估与镇痛处理流程，包含不同程度疼痛的药物选择和给药剂量。",
    href: "/tccc/pages/tccc-pain-management",
  },
  {
    title: "休克与液体复苏",
    subtitle: "Shock & Fluid Resuscitation",
    body: "针对出血性休克的液体复苏决策流程，包括血制品使用和复苏目标。",
    href: "/tccc/pages/tccc-shock-fluid",
  },
  {
    title: "战术后送开放气道",
    subtitle: "TACEVAC Airway Algorithm",
    body: "战术后送阶段的气道再评估与开放气道流程，和 TFC 气道入口区分维护。",
    href: "/tccc/pages/tacevac-airway",
  },
  {
    title: "伤口处理",
    subtitle: "Wound Care Algorithm",
    body: "战伤伤口处理流程，包括烧伤评估、液体复苏和伤口包扎的决策路径。",
    href: "/tccc/pages/tccc-wound-care",
  },
  {
    title: "战术后送脑损伤",
    subtitle: "TACEVAC TBI Algorithm",
    body: "战术后送阶段创伤性脑损伤的评估与处理流程，包括脑疝识别与紧急处置。",
    href: "/tccc/pages/tacevac-tbi",
  },
  {
    title: "伤员沟通",
    subtitle: "Casualty Communication",
    body: "与伤员、指挥链和医疗后送链的有效沟通流程，包括伤情报告格式。",
    href: "/tccc/pages/tccc-casualty-communication",
  },
  {
    title: "预防低体温",
    subtitle: "Hypothermia Prevention",
    body: "预防战场低体温的专项流程，详细说明温度管理措施及其重要性。",
    href: "/tccc/pages/tccc-hypothermia",
  },
  {
    title: "TACEVAC预防低体温与眼外伤",
    subtitle: "TACEVAC Hypothermia & Eye Trauma",
    body: "战术后送护理阶段的低体温预防与贯通性眼外伤专项流程，包含体温管理和眼外伤处理流程。",
    href: "/tccc/pages/tacevac-hypothermia",
  },
  {
    title: "TACEVAC再评估",
    subtitle: "TACEVAC Re-assessment",
    body: "战术后送过程中伤员再评估流程，包括干预措施效果检查和出血再评估。",
    href: "/tccc/pages/tacevac-reassessment",
  },
  {
    title: "流程框架",
    subtitle: "Flow Framework Demo",
    body: "可复用的决策流程框架示例，展示如何创建和定制自己的TCCC流程。",
    href: "/tccc/pages/tccc-flow-framework",
  },
  {
    title: "循环系统教案",
    subtitle: "Circulatory System Course",
    body: "战斗环境下的循环系统：从生理学到前沿复苏的系统性教学内容，包含解剖学、病理生理学和临床应用。",
    href: "/tccc/pages/circulation-course",
  },
  {
    title: "使用说明",
    subtitle: "Documentation",
    body: "详细的项目说明文档，包含功能介绍、使用指南和开发扩展建议。",
    href: "/tccc/README.md",
  },
];

export const metadata = {
  title: "战场救护 TCCC | 红医师",
  description: project.description,
};

export default function TcccPage() {
  const content = project.content;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="directory"
        activeMenuItemId="directory"
        bottomAriaLabel="TCCC 项目移动端导航"
        bottomItems={bottomItems}
        brandHref="/tccc/"
        menuAriaLabel="TCCC 项目移动端菜单"
        menuButtonLabel="打开 TCCC 项目移动端导航菜单"
        menuItems={menuItems}
        menuPanelId="hys-mobile-top-menu-panel-tccc"
        navAriaLabel="红医师战场救护导航"
        projectLabel="战场救护"
        scope="tccc"
        titlePrefix="打开 TCCC "
      />

      <main id="main">
        <section
          aria-labelledby="tccc-title"
          className="relative isolate flex min-h-[calc(100svh_-_78px)] items-end overflow-hidden border-b-2 border-border"
        >
          <img
            alt="战场救护 TCCC 海报"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            src={project.coverImage}
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(18,49,60,0.84)_48%,rgba(217,48,37,0.34)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />

          <div className="mx-auto w-[min(1200px,calc(100%_-_32px))] pb-[calc(env(safe-area-inset-bottom)_+_7rem)] pt-12 text-background dark:text-foreground md:py-20">
            <p className="mb-4 inline-flex items-center gap-3 font-mono text-sm font-black text-background/80 dark:text-foreground/80">
              <span className="h-1 w-10 bg-primary" aria-hidden="true" />
              TACTICAL COMBAT CASUALTY CARE
            </p>
            <h1
              className="max-w-4xl text-[clamp(3.4rem,10vw,7rem)] font-black leading-[0.9] tracking-normal"
              id="tccc-title"
            >
              <span className="text-primary">TCCC</span>
              <br />
              战术战伤救护流程
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-background/85 dark:text-foreground/85 md:text-xl">
              基于 CoTCCC 2017版官方指南的交互式决策流程
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-background bg-primary px-5 font-black text-primary-foreground no-underline shadow-[5px_5px_0_rgba(244,236,220,0.24)] transition-transform active:translate-x-1 active:translate-y-1"
                href="/tccc/pages/tccc-standard"
              >
                查看标准流程
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-background bg-background/95 px-5 font-black text-[#12313c] no-underline shadow-[5px_5px_0_rgba(217,48,37,0.35)] transition-transform active:translate-x-1 active:translate-y-1 dark:border-foreground dark:bg-foreground dark:text-background"
                href="/tccc/pages/tfc-hemorrhage"
              >
                进入 TFC 大出血
              </a>
            </div>
          </div>
        </section>

        <aside
          aria-label="内容审核状态"
          className="border-b-2 border-border bg-muted/45"
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

        <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-12 md:py-16">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-sm font-black text-muted-foreground">
                TFC FIRST LINE
              </p>
              <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
                关键流程入口
              </h2>
            </div>
            <p className="max-w-xl font-bold leading-7 text-muted-foreground">
              内容状态：CoTCCC 2017 基础内容，需按 JTS / Deployed Medicine
              最新资料更新复核。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {primaryFlows.map((item) => (
              <a
                className="group relative overflow-hidden rounded border-2 border-border bg-card p-5 text-card-foreground no-underline shadow-[6px_6px_0_rgba(18,49,60,0.16)] transition-transform hover:-translate-y-1 dark:shadow-[6px_6px_0_rgba(217,48,37,0.24)]"
                href={item.href}
                key={item.href}
              >
                <span className="font-mono text-xs font-black text-primary">
                  {item.subtitle}
                </span>
                <strong className="mt-5 block text-2xl font-black leading-tight">
                  {item.title}
                </strong>
                <span className="mt-4 block min-h-24 font-bold leading-7 text-muted-foreground">
                  {item.body}
                </span>
                <span className="mt-8 flex items-end justify-between gap-4">
                  <span className="rounded bg-foreground px-3 py-2 font-black text-background">
                    {item.action}
                  </span>
                  <span className="text-5xl font-black leading-none text-primary opacity-90">
                    {item.phase}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-2 lg:grid-cols-3">
            {flowCards.map((item) => (
              <a
                className="rounded border-2 border-background/30 bg-background/[0.08] p-5 text-background no-underline transition-colors hover:border-primary hover:bg-background/[0.14] dark:text-card-foreground"
                href={item.href}
                key={item.href}
              >
                <span className="font-mono text-xs font-black text-background/60 dark:text-muted-foreground">
                  {item.subtitle}
                </span>
                <h3 className="mt-3 text-xl font-black leading-tight">
                  {item.title}
                </h3>
                <p className="mt-3 font-bold leading-7 text-background/70 dark:text-muted-foreground">
                  {item.body}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:py-16">
          <div className="rounded border-2 border-border bg-card p-6">
            <p className="font-mono text-sm font-black text-muted-foreground">
              PROJECT CONTEXT
            </p>
            <h2 className="mt-3 text-3xl font-black text-primary">使用边界</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              仅供教育训练和流程学习，不能替代现行作战医疗规范、医疗指挥链或正式认证课程。
            </p>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              {project.description}。{content.entryLabel}；{content.dataPolicy}
            </p>
          </div>
          <div className="rounded border-2 border-border bg-muted/50 p-6">
            <h2 className="text-2xl font-black">离线静态流程</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              旧版 TCCC 深层流程、图片、视频、离线页、manifest 与 service worker
              继续保留在 /tccc/ 下。
            </p>
            <a
              className="mt-6 inline-flex rounded border-2 border-foreground bg-foreground px-4 py-3 font-black text-background no-underline"
              href="/tccc/README.md"
            >
              查看文档
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
