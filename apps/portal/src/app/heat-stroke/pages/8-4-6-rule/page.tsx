import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../../_components/project/projectNav";
import { FloatingBackToTop } from "../_components/FloatingBackToTop";

function getHeatStrokeProject() {
  const entry = platformProjects.find((item) => item.id === "heat-stroke");

  if (!entry) {
    throw new Error("Missing heat-stroke project registry entry");
  }

  return entry;
}

const project = getHeatStrokeProject();
const projectChromeNav = buildProjectChromeNav("heatStroke", "/heat-stroke/");

const preventionMeasures = [
  {
    title: "做好热习服",
    points: [
      "通过反复热刺激提高机体热耐受能力，一般需 10-14天。",
      "强度判断：心率 <120（低），120-150（中），>150（高），>180（极限）。",
      "安全心率 ≈ (220-年龄)×70%；最高心率 ≈ (220-年龄)×(80%-85%)。",
      "心率>150持续不降或体温>38.5℃ 应终止训练。",
    ],
  },
  {
    title: "不带病参训",
    points: [
      "感冒、发烧、腹泻等降低抵抗力，易中暑。医生需评估。",
      "危险因素：身体不适、服药、超重、缺乏锻炼、中暑史。",
    ],
  },
  {
    title: "重视间隙降温",
    points: [
      "冷水喷雾、冰帽/颈圈、湿毛巾、冰袋、冷水浸泡前臂、饮用含盐冰液体。",
      "烈日下不摘帽。",
    ],
  },
  {
    title: "补水补盐",
    points: [
      "口渴时已缺水约 2% 体重，此时极易中暑。",
      "高强度训练时：每小时补含盐饮品 0.5-1升，每天 6-8升。",
      "观察尿量和颜色判断是否充足。",
      "推荐：榨菜+水、电解质泡腾片、口服补液盐。",
    ],
  },
  {
    title: "备齐监测“三宝”",
    points: [
      "温湿度计：监测环境。",
      "耳温监测仪：测核心体温。",
      "指脉氧检测仪：测心率、血氧。",
      "备好防暑药品：藿香正气、十滴水等。",
    ],
  },
  {
    title: "准备降温设备",
    points: [
      "救援浴盆担架、贮水槽、医用冰帽/颈圈/冰毯、冰袋等，用于紧急降温。",
    ],
  },
  {
    title: "保证充足睡眠",
    points: [
      "恢复体力，放松身心。野外可用眼罩改善环境。必要时遵医嘱用助眠药。",
    ],
  },
  {
    title: "关注重点人群",
    points: [
      "新训人员、少锻炼者、非热环境训练者、未热习服者、脱离热环境2周者。需先热习服并评估。",
    ],
  },
];

const warningSigns = [
  { word: "烫", title: "自觉发烫", body: "从里向外" },
  { word: "晃", title: "行走不稳", body: "异常疲倦" },
  { word: "晕", title: "头晕抽搐", body: "意识模糊" },
  { word: "乱", title: "生理紊乱", body: "恶心呕吐等" },
];

const treatmentSteps = [
  {
    title: "立即脱离热环境",
    body: "扶至阴凉处，脱去外衣，评估意识。",
  },
  {
    title: "全身降温",
    body: "浸泡（头外，约20℃水）或冰水擦拭+冰敷（腋下/大腿根）。",
  },
  {
    title: "测量生命体征",
    body: "核心体温（耳温）、心率、血氧、血压。",
  },
  {
    title: "建立静脉通道",
    body: "卫生员操作，快速输液（林格氏液/生理盐水等）。",
  },
  {
    title: "气道保护与氧疗",
    body: "血氧<95%鼻导管吸氧。昏迷头偏一侧防窒息，及时清呕吐物。",
  },
  {
    title: "控制抽搐",
    body: "遵医嘱用药（如安定），观察呼吸/血氧。按压躁动者避开关节。",
  },
];

export const metadata = {
  title: "8-4-6 热射病防治黄金法则 | 红医师",
  description: "热射病防治专家组组长宋青独创 8-4-6 法则。",
};

function GovernanceBanner() {
  const content = project.content;

  return (
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
  );
}

export default function HeatStrokeRulePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="rule"
        activeMenuItemId="rule"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-rule"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="relative isolate overflow-hidden border-b-2 border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-8 py-12 md:grid-cols-[0.8fr_1.2fr] md:items-end md:py-20">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-normal text-background/70 dark:text-muted-foreground">
                HEAT STROKE 8-4-6 RULE
              </p>
              <h1 className="mt-4 text-[clamp(3.7rem,11vw,7.5rem)] font-black leading-[0.86] text-primary">
                8-4-6
                <br />
                黄金法则
              </h1>
            </div>
            <div className="rounded border-2 border-background/70 bg-background/10 p-5">
              <p className="text-2xl font-black leading-tight md:text-4xl">
                防治热射病，关键在于预防；迅速抢救，第一时间正确降温是关键。
              </p>
              <p className="mt-4 text-lg font-bold leading-8 text-background/75 dark:text-muted-foreground">
                热射病防治专家组组长宋青独创
                <span className="mx-2 text-primary">“8-4-6法则”</span>
              </p>
            </div>
          </div>
        </section>

        <GovernanceBanner />

        <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-12 md:py-16">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-sm font-black text-muted-foreground">
                PREVENTION
              </p>
              <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
                8 项预防措施
              </h2>
            </div>
            <p className="max-w-xl font-bold leading-7 text-muted-foreground">
              热射病可防可控。训练前、训练中和训练后都要把风险控制落实到可执行动作。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {preventionMeasures.map((item, index) => (
              <article
                className={`rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] ${
                  index === 0 || index === 3 ? "lg:col-span-2" : ""
                }`}
                key={item.title}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-grid h-10 w-10 place-items-center rounded border-2 border-primary bg-primary font-black text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-black leading-tight">
                    {item.title}
                  </h3>
                </div>
                <ul className="grid gap-2 text-sm font-bold leading-6 text-muted-foreground">
                  {item.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-border bg-muted/45">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-[0.7fr_1.3fr] md:items-center md:py-16">
            <div>
              <p className="font-mono text-sm font-black text-muted-foreground">
                WARNING SIGNS
              </p>
              <h2 className="mt-2 text-4xl font-black text-primary md:text-5xl">
                4 个预警信号
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {warningSigns.map((item) => (
                <article
                  className="rounded border-2 border-border bg-card p-5 text-center"
                  key={item.word}
                >
                  <div className="text-7xl font-black leading-none text-primary">
                    {item.word}
                  </div>
                  <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 font-bold text-muted-foreground">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-12 md:py-16">
          <div className="mb-6 rounded border-2 border-border bg-card p-6">
            <p className="font-mono text-sm font-black text-muted-foreground">
              FIELD TREATMENT
            </p>
            <h2 className="mt-2 text-4xl font-black text-primary md:text-5xl">
              6 步现场救治法
            </h2>
            <p className="mt-4 max-w-3xl font-bold leading-8 text-muted-foreground">
              目标：1小时内体温降至
              <span className="mx-1 text-primary">38.5℃</span>
              以下。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {treatmentSteps.map((item, index) => (
              <article
                className="rounded border-2 border-border bg-card p-5 text-card-foreground"
                key={item.title}
              >
                <span className="font-mono text-4xl font-black text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-2xl font-black leading-tight">
                  {item.title}
                </h3>
                <p className="mt-4 font-bold leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              className="rounded border-2 border-foreground bg-foreground px-5 py-4 text-center font-black text-background no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/field-treatment"
            >
              进入现场处置
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/heat-index"
            >
              查询热指数
            </a>
          </div>
        </section>
      </main>

      <FloatingBackToTop />
    </div>
  );
}
