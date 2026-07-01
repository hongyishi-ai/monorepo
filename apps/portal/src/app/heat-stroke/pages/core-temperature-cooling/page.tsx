import { platformProjects } from "@/lib/projects";
import type { ReactNode } from "react";
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

type CardSpan = "default" | "wide" | "full";
type TableRow = string[];

const project = getHeatStrokeProject();
const projectChromeNav = buildProjectChromeNav("heatStroke", "/heat-stroke/");

const preventionItems = [
  "环境把控: 避开高温时段，改善通风。",
  "个人防护: 主动补含盐水电解质，穿透气衣物。",
  "热习服: 逐步适应热环境。",
  "关注特殊人群: 老年、儿童、慢病等。",
  "科学训练: 张弛有度，高温下多休息。",
];

const monitoringRows = [
  ["金标准", "直肠温度", "Rectal Temperature"],
  ["替代方法", "膀胱温度", "Bladder"],
  ["替代方法", "食道温度", "Esophageal"],
  ["进阶方法", "体温胶囊", "Pill"],
  ["不推荐", "腋温、口温、额温、耳温", "误差大，不用于诊断"],
];

const coolingMethods = [
  {
    title: "冰水浸泡 (CWI)",
    tag: "首选 / Fastest cooling",
    body: "降温最快，劳力性热射病首选。方法为 0-15°C 冷水浸泡，头部除外。",
    emphasis: true,
  },
  {
    title: "蒸发降温",
    tag: "Evaporative cooling",
    body: "速度较快，相对安全。方法为喷洒温水并用风扇强吹。",
  },
  {
    title: "血管内降温",
    tag: "Intravascular cooling",
    body: "高效，通常需要中心静脉置管和设备支持，适用于 ICU 场景。",
  },
];

const prohibitedMethods = [
  "退热药: 无效且可能伤肝肾。",
  "酒精擦浴: 有中毒风险。",
  "不过度搓揉。",
  "不滥用纯水口服。",
];

const supportItems = [
  "呼吸支持 (Ventilation)",
  "循环支持 (Circulation)",
  "肾脏支持 (Renal - CRRT)",
  "凝血障碍处理 (Coagulation)",
  "中枢神经保护 (CNS Protection)",
];

const processSteps = [
  {
    time: "立即",
    label: "Immediately",
    body: "脱离热环境，初步评估 ABC。",
  },
  {
    time: "5 分钟内",
    label: "Within 5 min",
    body: "启动核心体温(直肠)监测。",
  },
  {
    time: "15 分钟内",
    label: "Within 15 min",
    body: "开始有效降温，选择 CWI 或蒸发降温等方式。",
  },
  {
    time: "30 分钟内",
    label: "Within 30 min",
    body: "核心体温降至 <38.5°C。",
  },
  {
    time: "持续进行",
    label: "Continuously",
    body: "持续监测，维持 37-38°C，处理并发症，早期集中救治。",
  },
];

const caseLessons = [
  "早期、快速、有效降温至关重要。",
  "核心体温监测是基础。",
  "掌握正确降温方法和禁忌。",
  "凝血功能障碍需早期防治。",
];

const keyPoints = [
  "热射病是急症，降温速度决定生死。",
  "预防是关键，需做好防护。",
  "救治核心是黄金 30 分钟降温，劳力性热射病首选冷水浸泡。",
  "核心体温监测是基石，指导精准降温。",
];

export const metadata = {
  title: "热射病核心体温监测与降温方法 | 红医师",
  description:
    "热射病核心体温监测与快速降温方法速读，覆盖直肠温度监测、冷水浸泡、蒸发降温、禁忌和急救流程。",
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

function Card({
  children,
  span = "default",
}: {
  children: ReactNode;
  span?: CardSpan;
}) {
  const spanClass =
    span === "full"
      ? "md:col-span-3 lg:col-span-4"
      : span === "wide"
        ? "md:col-span-2"
        : "";

  return (
    <article
      className={`${spanClass} rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]`}
    >
      {children}
    </article>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs font-black uppercase tracking-normal text-muted-foreground">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 text-sm font-bold leading-7 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>· {item}</li>
      ))}
    </ul>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded border-2 border-border">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-foreground text-background dark:bg-muted dark:text-foreground">
          <tr>
            {headers.map((header) => (
              <th className="border-r border-border px-4 py-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="odd:bg-muted/25" key={row.join("|")}>
              {row.map((cell, index) => (
                <td
                  className="border-r border-t border-border px-4 py-3 align-top font-bold leading-6 text-muted-foreground last:border-r-0"
                  key={`${cell}-${index}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HeatStrokeCoreTemperatureCoolingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="cooling"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-cooling"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="relative isolate overflow-hidden border-b-2 border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-8 py-12 md:grid-cols-[0.95fr_1.05fr] md:items-end md:py-20">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-normal text-background/70 dark:text-muted-foreground">
                Core Temperature Monitoring & Cooling
              </p>
              <h1 className="mt-4 text-[clamp(3rem,9vw,6.8rem)] font-black leading-[0.9] text-primary">
                核心体温监测
                <br />
                与降温方法
              </h1>
            </div>
            <div className="rounded border-2 border-background/70 bg-background/10 p-5">
              <p className="text-2xl font-black leading-tight md:text-4xl">
                本次分享聚焦热射病早期关键环节：核心体温监测与快速有效降温。
              </p>
              <p className="mt-4 font-bold leading-8 text-background/75 dark:text-muted-foreground">
                讲者：热射病专家组教授 · 日期：2025.04 ·
                结合十余年急救经验，系统讲解常用知识与方法。
              </p>
            </div>
          </div>
        </section>

        <GovernanceBanner />

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-5 py-12 md:grid-cols-3 lg:grid-cols-4">
          <Card span="wide">
            <SectionLabel>Critical Goal</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              降温是关键
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              快速有效降温是治疗核心。研究表明，每延迟 1 分钟，病死率增加约 1%。
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded border-2 border-primary bg-primary/10 p-5 text-center">
                <p className="text-6xl font-black text-primary">30 min</p>
                <p className="mt-2 font-black">黄金降温时间</p>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  降至 38°C 以下
                </p>
              </div>
              <div className="rounded border-2 border-border bg-muted/30 p-5">
                <p className="text-xl font-black text-primary">
                  早发现 / 早诊断 / 早治疗
                </p>
                <p className="mt-3 font-mono text-xs font-bold uppercase text-muted-foreground">
                  Early detection, diagnosis, treatment
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Vital Sign</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">核心体温</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              反映内部脏器温度，优于体表温度。热射病特征为核心体温 &gt; 40°C。
            </p>
            <p className="mt-5 text-5xl font-black text-primary">&gt;40°C</p>
          </Card>

          <Card>
            <SectionLabel>Overview</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              热射病概述
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              中暑最严重阶段，核心体温 &gt; 40°C 并伴有中枢神经损害。
            </p>
            <BulletList
              items={["早期: 热痉挛", "进展: 热衰竭", "严重: 热射病"]}
            />
          </Card>

          <Card span="wide">
            <SectionLabel>Monitoring</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              核心体温监测方法
            </h2>
            <DataTable
              headers={["分类", "方法", "说明"]}
              rows={monitoringRows}
            />
            <p className="mt-4 font-black text-primary">
              持续监测，避免过度降温(&lt;36°C)。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Prevention</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">预防措施</h2>
            <BulletList items={preventionItems} />
          </Card>

          <Card span="full">
            <SectionLabel>Cooling Methods</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              专业降温方法
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {coolingMethods.map((method) => (
                <div
                  className={`rounded border-2 p-5 ${
                    method.emphasis
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30"
                  }`}
                  key={method.title}
                >
                  <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                    {method.tag}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-primary">
                    {method.title}
                  </h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">
                    {method.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded border-2 border-destructive bg-destructive/10 p-5">
              <h3 className="text-2xl font-black text-destructive">禁用方法</h3>
              <BulletList items={prohibitedMethods} />
            </div>
          </Card>

          <Card span="wide">
            <SectionLabel>Treatment & Support</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              治疗目标与器官支持
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded border-2 border-primary bg-primary/10 p-5">
                <p className="font-black text-primary">第一阶段 (30min)</p>
                <p className="mt-2 text-lg font-black">核心体温 &lt; 38.5°C</p>
              </div>
              <div className="rounded border-2 border-border bg-muted/30 p-5">
                <p className="font-black text-primary">第二阶段 (24h)</p>
                <p className="mt-2 text-lg font-black">维持 37-38°C</p>
              </div>
            </div>
            <BulletList items={supportItems} />
          </Card>

          <Card>
            <SectionLabel>Four Don'ts</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-destructive">
              降温处理“四不”
            </h2>
            <BulletList items={prohibitedMethods} />
          </Card>

          <Card span="full">
            <SectionLabel>Process Summary</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              急救流程总结
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {processSteps.map((step, index) => (
                <div
                  className="rounded border-2 border-border bg-muted/30 p-4"
                  key={step.time}
                >
                  <p className="text-4xl font-black text-primary">
                    {index + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-black">{step.time}</h3>
                  <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                    {step.label}
                  </p>
                  <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-2xl font-black text-primary">
              时间就是生命！时间就是大脑！时间就是器官！
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Case Study & Lessons</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              案例分享与教训
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              分享了 30
              年前一例因认识不足、降温不当、未使用核心体温监测、误用退热药导致死亡的案例。
            </p>
            <BulletList items={caseLessons} />
          </Card>

          <Card span="wide">
            <SectionLabel>Core Takeaway</SectionLabel>
            <h2 className="mt-2 text-5xl font-black leading-none text-primary">
              降温！
              <br />
              降温！
              <br />
              还是降温！
            </h2>
            <p className="mt-5 font-mono text-sm font-black uppercase text-muted-foreground">
              Cool down. Cool down. Cool down.
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>Key Points & Outlook</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              核心要点与展望
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {keyPoints.map((point) => (
                <div
                  className="rounded border-2 border-border bg-muted/30 p-4 text-sm font-black leading-7"
                  key={point}
                >
                  {point}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-3 md:col-span-3 md:grid-cols-3 lg:col-span-4">
            <a
              className="rounded border-2 border-foreground bg-foreground px-5 py-4 text-center font-black text-background no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/field-treatment"
            >
              进入现场处置
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/diagnosis-treatment-guideline"
            >
              查看诊断与治疗指南
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/treatment-system-consensus"
            >
              查看救治体系共识
            </a>
          </div>
        </section>
      </main>

      <FloatingBackToTop />
    </div>
  );
}
