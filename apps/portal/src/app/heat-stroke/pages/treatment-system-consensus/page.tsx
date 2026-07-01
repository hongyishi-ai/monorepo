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

const militaryProgress = [
  "2015: 专家共识(草案) [8]",
  "2016: 全军防治专家组成立",
  "2019: 共识更新 [4]",
  "2024: 防治规范纳入国军标 [9]",
  "四级体系: 预防为主，关口前移 [10]",
  '"8-4-6"法则: 基层广泛应用 [11]',
  '"十早一禁": 院内治疗原则 [4,8]',
];

const localChallenges = [
  "公众认识不足，处理能力有限",
  '院前急救存误区，"黄金半小时"难保障',
  "院内缺乏专业团队与措施",
  "全病程救治体系空白 [12-14]",
];

const consensusGoals = [
  "降低发生率",
  "提高救治成功率",
  "降低重症病死率",
  "改善远期预后与生存质量",
];

const preventionRoles = [
  "个人: 学习知识，掌握方法，尤其高风险人群。",
  "政府: 宣传教育，气象预警，政策保护。",
  "社会: 避暑中心，医疗咨询，社区合作。",
  "组织: 军事训练、赛事活动等做好保障预案。",
];

const ruleColumns = [
  {
    title: "预防 8 措施",
    points: [
      "热习服",
      "不带病",
      "预降温",
      "补水盐",
      "备三宝",
      "配设备",
      "不熬夜",
      "盯重点",
    ],
  },
  {
    title: "预警 4 信号",
    points: [
      "烫: 自觉身体发烫",
      "晃: 异常疲倦、行走不稳",
      "晕: 头晕、意识模糊、抽搐",
      "乱: 面色异常、心慌气短、恶心呕吐等",
    ],
  },
  {
    title: "急救 6 步法",
    points: [
      "脱: 脱离热环境、脱去衣物",
      "泡: 冷水浸泡降温",
      "测: 监测生命体征和核心体温",
      "补: 静脉补液",
      "通: 气道保护和氧疗",
      "静: 控制抽搐",
    ],
  },
];

const hasteRows = [
  ["H", "Heat exposure", "热暴露"],
  ["A", "Altered mental status", "精神状态改变评估"],
  ["S", "Start cooling", "立即冷水降温 / CPR"],
  ["T", "Time", "时间紧迫，快打急救电话"],
  ["E", "Emergency", "紧急行动，防病情发展"],
];

const centerLevelRows = [
  [
    "三级",
    "二级及以下医院",
    "独立急诊科，降温单元，基础/高级生命支持，流程质控，科普。",
  ],
  [
    "二级",
    "三级综合医院",
    "+高水平重症救治，MDT，信息化，质控体系，培训科研，门诊咨询。",
  ],
  [
    "一级",
    "国域医疗中心/大型三甲",
    "+全流程一体化模式，区域网络，数据平台，培训基地，热耐力实验室，制定标准，督导，咨询。",
  ],
];

const coolingPoints = [
  "0.5h 内核心温度降至 39.0°C 以下",
  "2h 内核心温度降至 38.5°C 以下",
  '黄金半小时，"先降温后转运"。',
  "冷水浸泡是金标准；无条件时选择覆盖面积大、速率快、可及的方式。",
  "实时监测核心体温、意识和生命体征。",
];

const coolingSupplies = [
  "现场: 降温水池、温湿度计、体温计、指脉氧仪、冰水、毛巾等。",
  "院前: 降温担架、体温计、冰块、冰水、毛巾等。",
  "急诊: 电动冰毯机、降温水池/马甲/帽、血滤机、制冰机、持续直肠温度监测等。",
];

const qualityItems = [
  "质量控制: 结构、过程、结局指标。",
  "教育培训与科研: 提升技能，鼓励研究。",
  "信息化数据管理: 精确质控，数据互通。",
];

const outpatientItems = [
  "出院后随诊随访",
  "系统化康复支持",
  "神经与心理功能干预",
  "预防咨询与风险评估",
];

const outlookItems = [
  "提升公众认知与自我保护",
  "强化院前急救关键作用",
  "深化多学科协作(MDT)",
  "整合康复训练与慢病管理",
  "建立全国统一、标准化、高效协调的救治网络",
  "发挥救治中心的关键作用和专科联盟的联动优势",
];

const recommendations = [
  "推荐意见 1: 通过建设热射病全流程防治体系，优化防治流程，提升救治的规范性与成功率，进而改善患者的预后和生存质量。",
  '推荐意见 2: 救治坚持预防为主，多方面着手，力求"热不致病"。',
  '推荐意见 3: "8-4-6"黄金法则便于记忆，适合普及培训。',
  "推荐意见 4: 快速识别、评估、降温和对症支持是成功治疗的关键。",
  "推荐意见 5: 加强培训，建完善区域体系，形成紧密衔接救治链条。",
  "推荐意见 6: 院内救治以急诊科和重症医学科为主，结合 MDT 协作。优化流程，加强衔接，具备批量救治能力。",
  "推荐意见 7: 康复治疗至关重要，通过个体化方案促进恢复。",
  "推荐意见 8: 康复患者纳入长期随访，关注中长期并发症，进行慢病管理。",
  "推荐意见 9: 建区域网络，规划中心，有效联动，建信息平台，确保及时救治。",
  "推荐意见 10: 建四级体系，明确功能定位，强化联动，推信息化与 MDT。",
  "推荐意见 11: 救治单元是核心，确保迅速降温达标，具备监测和生命支持能力。",
  "推荐意见 12: 建议高级中心建热耐力实验室，评估热耐力，支持康复训练。",
  "推荐意见 13: 建议设热射病门诊，提供全病程管理，提升治愈率和生活质量。",
  "推荐意见 14: 建议组建专科联盟，整合资源，推动规范化防治体系建设。",
];

export const metadata = {
  title: "热射病救治体系建设标准专家共识 | 红医师",
  description:
    "热射病救治体系建设标准专家共识速读，覆盖预防、院前、院内、康复、慢病管理和救治中心建设。",
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

function RecommendationBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 border-l-4 border-primary bg-primary/10 p-4 text-sm font-bold leading-7 text-muted-foreground">
      {children}
    </div>
  );
}

function FigurePlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex min-h-28 items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 p-4 text-center text-sm font-bold text-muted-foreground">
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded border-2 border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 text-sm font-bold leading-7 text-muted-foreground">
      {items.map((item) => (
        <li key={item}>· {item}</li>
      ))}
    </ul>
  );
}

export default function HeatStrokeTreatmentSystemConsensusPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="consensus"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-consensus"
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
                Heatstroke Treatment System Consensus
              </p>
              <h1 className="mt-4 text-[clamp(3rem,9vw,6.8rem)] font-black leading-[0.9] text-primary">
                热射病救治体系
                <br />
                建设标准
              </h1>
            </div>
            <div className="rounded border-2 border-background/70 bg-background/10 p-5">
              <p className="text-2xl font-black leading-tight md:text-4xl">
                应对全球变暖，规范救治流程，提升国民健康。
              </p>
              <p className="mt-4 font-bold leading-8 text-background/75 dark:text-muted-foreground">
                覆盖预防、现场、院前、院内、康复、慢病管理和区域救治网络建设。
              </p>
            </div>
          </div>
        </section>

        <GovernanceBanner />

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-5 py-12 md:grid-cols-3 lg:grid-cols-4">
          <Card span="wide">
            <SectionLabel>The Challenge</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">严峻挑战</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              全球变暖加剧，极端高温频发，热射病核心体温可超过
              40°C，发生率显著上升，威胁生命健康。
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded border-2 border-border bg-muted/30 p-5 text-center">
                <p className="text-6xl font-black text-primary">20.7%</p>
                <p className="mt-2 font-black">ICU 病死率</p>
                <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
                  Southwest China, 2024
                </p>
              </div>
              <div className="rounded border-2 border-border bg-muted/30 p-5 text-center">
                <p className="text-6xl font-black text-primary">34.1%</p>
                <p className="mt-2 font-black">出院病死率</p>
                <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
                  Discharge Mortality
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm font-bold leading-6 text-muted-foreground">
              体育运动、军训、户外作业致死事件屡见报道，加强预防与应对刻不容缓。
            </p>
          </Card>

          <Card>
            <SectionLabel>Military Progress</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">军队先行</h2>
            <BulletList items={militaryProgress} />
          </Card>

          <Card>
            <SectionLabel>Local Challenges</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">地方挑战</h2>
            <BulletList items={localChallenges} />
            <p className="mt-4 text-sm font-bold text-muted-foreground">
              亟需建立统一标准与救治网络。
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>Consensus Goal</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">共识目标</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              优化全流程防治体系：预防、现场、院前、院内、康复、慢病管理。提升及时性、规范性、科学性。
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {consensusGoals.map((goal) => (
                <div
                  className="border-2 border-border bg-muted/30 px-4 py-5 text-center text-lg font-black"
                  key={goal}
                >
                  {goal}
                </div>
              ))}
            </div>
            <RecommendationBox>{recommendations[0]}</RecommendationBox>
          </Card>

          <div className="py-6 md:col-span-3 lg:col-span-4">
            <p className="font-mono text-sm font-black text-muted-foreground">
              System Construction Requirements
            </p>
            <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
              热射病救治体系建设要求
            </h2>
          </div>

          <Card span="wide">
            <SectionLabel>2.1 Prevention First</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              预防为主 · 热不致病
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              预防优于治疗。强调个人防护、组织保障、环境干预。
            </p>
            <BulletList items={preventionRoles} />
            <RecommendationBox>{recommendations[1]}</RecommendationBox>
          </Card>

          <Card span="wide">
            <SectionLabel>8-4-6 Golden Rule</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              "8-4-6" 黄金法则
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              简明易记，适合普及培训。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {ruleColumns.map((column) => (
                <div
                  className="rounded border-2 border-border bg-muted/30 p-4"
                  key={column.title}
                >
                  <h4 className="text-lg font-black text-primary">
                    {column.title}
                  </h4>
                  <BulletList items={column.points} />
                </div>
              ))}
            </div>
            <RecommendationBox>{recommendations[2]}</RecommendationBox>
            <FigurePlaceholder>
              图 1: 热射病防治 "8-4-6" 黄金法则示意图
            </FigurePlaceholder>
          </Card>

          <Card span="wide">
            <SectionLabel>2.2 Pre-hospital</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              院前急救 · 病不致危
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              关键在于快速识别、评估、降温和对症支持。第一目击者自救互救至关重要。
            </p>
            <div className="mt-5 rounded border-2 border-primary bg-primary/10 p-5 text-center">
              <p className="text-5xl font-black text-primary">黄金半小时</p>
              <p className="mt-3 font-black">
                最初 30-60 min 内将核心体温降至 38.5°C 以下，病死率可降至零。
              </p>
            </div>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              需加强院前人员培训，建立区域救治体系，形成"现场自救互救 - 院前急救
              - 院内急诊"链条。
            </p>
            <FigurePlaceholder>
              图 2: 热射病院前院内一体化救治链条示意图
            </FigurePlaceholder>
            <p className="mt-4 font-black text-primary">
              "先降温，后转运"。基层设降温单元，救护车成移动降温单元，急诊设抢救单元。
            </p>
            <RecommendationBox>
              <p>{recommendations[3]}</p>
              <p className="mt-2">{recommendations[4]}</p>
            </RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>Haste Rule</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              Haste 法则
            </h3>
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              高温或剧烈活动后出现神志改变时，立即启动。
            </p>
            <DataTable headers={["要点", "英文", "解释"]} rows={hasteRows} />
          </Card>

          <Card span="wide">
            <SectionLabel>2.3 In-hospital MDT</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              院内多学科联合 · 危不致死
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              急诊科负责快速评估处理，危重症由重症医学科主导，需多学科团队(MDT)协作。倡导"十早一禁"原则，提供最佳器官功能支持。
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FigurePlaceholder>
                图 3: 急诊接诊处置流程示意图
              </FigurePlaceholder>
              <FigurePlaceholder>图 4: 批量伤处置流程示意图</FigurePlaceholder>
            </div>
            <p className="mt-4 text-sm font-bold text-muted-foreground">
              高发季或高发地区，急诊需具备批量救治能力。
            </p>
            <RecommendationBox>{recommendations[5]}</RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>2.4 Rehabilitation</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              康复训练 · 促进恢复
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              早期康复重要。ICU 患者长期并发症率 3.7%~40.7%，约 30%
              幸存者有认知或运动障碍，常为永久性。
            </p>
            <p className="mt-3 font-bold leading-8 text-muted-foreground">
              需个体化康复策略，包括高压氧、中医、针灸、物理、心理治疗。复工、复赛、复职建议正常后逐步恢复，可考虑热耐力检测辅助。
            </p>
            <RecommendationBox>{recommendations[6]}</RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>2.5 Chronic Management</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              慢病管理 · 关注长期损伤
            </h3>
            <BulletList
              items={[
                "经典型 2 年病死率达 71%。",
                "康复者肾病、认知障碍、心理疾病风险增加。",
                "心血管事件风险 4 倍，缺血性中风 5.5 倍。",
                "劳力型复发率 4.1%~15.4%，多在 2 年内。",
              ]}
            />
            <FigurePlaceholder>
              图 5: 热射病全病程救治体系示意图
            </FigurePlaceholder>
            <RecommendationBox>{recommendations[7]}</RecommendationBox>
          </Card>

          <div className="py-6 md:col-span-3 lg:col-span-4">
            <p className="font-mono text-sm font-black text-muted-foreground">
              System Construction Content
            </p>
            <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
              热射病救治体系建设内容
            </h2>
          </div>

          <Card>
            <SectionLabel>3.1 Network</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              建立救治网络
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              根据地区特点规划布局。地市或县域至少设一家二级以上医院为救治中心，联合下级机构形成闭环网络。
            </p>
            <p className="mt-3 font-bold leading-8 text-muted-foreground">
              合理布局急救站，统一指挥调度。救护车 30min
              内抵达中心或哨点。建立信息指挥平台，强化联动。
            </p>
            <RecommendationBox>{recommendations[8]}</RecommendationBox>
          </Card>

          <Card span="wide">
            <SectionLabel>3.2 Centers</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病救治中心
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              体系建设关键。提供综合、循证、标准化服务，覆盖预防到慢病管理全流程。乡镇卫生院等为哨点，中心分三级。
            </p>
            <DataTable
              headers={["级别", "机构", "核心要求"]}
              rows={centerLevelRows}
            />
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              由行政牵头，急诊或重症负责，多科室参与。建立
              MDT、数据平台和联动机制。
            </p>
            <RecommendationBox>{recommendations[9]}</RecommendationBox>
          </Card>

          <Card span="wide">
            <SectionLabel>3.2.2 Units & Cooling</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病救治单元与降温要点
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              院前、急诊、病房、ICU
              均需建立救治单元。具备快速降温、核心体温监测、急救复苏、生命支持能力。
            </p>
            <BulletList items={coolingPoints} />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FigurePlaceholder>
                图 6: 现场降温方式示意图，水池或冰块包裹
              </FigurePlaceholder>
              <FigurePlaceholder>
                图 7: 急诊科降温方式示意图，冰毯或冰水擦浴
              </FigurePlaceholder>
            </div>
            <details className="mt-5 rounded border-2 border-border bg-muted/30 p-4 text-sm font-bold leading-7 text-muted-foreground">
              <summary className="cursor-pointer text-foreground">
                查看降温设备物资
              </summary>
              <BulletList items={coolingSupplies} />
            </details>
            <RecommendationBox>{recommendations[10]}</RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>3.2.3-3.2.5</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              中心建设要素
            </h3>
            <BulletList items={qualityItems} />
            <p className="mt-4 text-sm font-bold text-muted-foreground">
              质量控制、培训科研与数据管理是持续改进的基础。
            </p>
          </Card>

          <Card>
            <SectionLabel>3.3 Heat Tolerance Lab</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热耐力检测实验室
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              用于客观评估个体热耐力。建议在一级或二级中心建设。模拟环境为
              40°C、40%RH(±1%)，配备跑步机、核心体温和心率监测设备。
            </p>
            <FigurePlaceholder>图 8: 热耐力检测实验室示意图</FigurePlaceholder>
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              用途：抽查评估、热习服效果、发现高风险人员、辅助康复训练恢复。
            </p>
            <RecommendationBox>{recommendations[11]}</RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>3.4 Clinic</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病门诊
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              提升规范诊疗，促进全病程管理。
            </p>
            <BulletList items={outpatientItems} />
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              多学科参与，包括急诊、重症、康复、中医、心理、心内、呼吸、消化等，适时
              MDT。
            </p>
            <RecommendationBox>{recommendations[12]}</RecommendationBox>
          </Card>

          <Card>
            <SectionLabel>3.5 Specialty Alliance</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病专科联盟
            </h3>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              领先医院牵头，形成紧密型学科联合体。统筹资源，通过联合诊疗、培训、科研等方式，实现区域联动、同质建设、互补发展。
            </p>
            <RecommendationBox>{recommendations[13]}</RecommendationBox>
          </Card>

          <Card span="full">
            <SectionLabel>Outlook</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">展望</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              最终目标是降低发病率、重症率、病死率、致残率，减轻高温对健康的冲击。
            </p>
            <BulletList items={outlookItems} />
            <p className="mt-6 text-center text-2xl font-black text-primary">
              共同努力，提升公共健康水平，保障生命安全。
            </p>
          </Card>

          <div className="grid gap-3 md:col-span-3 md:grid-cols-3 lg:col-span-4">
            <a
              className="rounded border-2 border-foreground bg-foreground px-5 py-4 text-center font-black text-background no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/diagnosis-treatment-guideline"
            >
              查看诊断与治疗指南
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/8-4-6-rule"
            >
              学习 8-4-6 法则
            </a>
            <a
              className="rounded border-2 border-border bg-card px-5 py-4 text-center font-black text-card-foreground no-underline transition-transform active:translate-x-1 active:translate-y-1"
              href="/heat-stroke/pages/core-temperature-cooling"
            >
              查看核心体温与降温
            </a>
          </div>
        </section>
      </main>

      <FloatingBackToTop />
    </div>
  );
}
