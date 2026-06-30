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

type TableRow = string[];
type CardSpan = "default" | "wide" | "full";

const project = getHeatStrokeProject();
const projectChromeNav = buildProjectChromeNav("heatStroke", "/heat-stroke/");

const standardBadges = ["GRADE 系统", "AGREE 标准", "RIGHT 标准"];

const evidenceRows = [
  ["证据质量", ""],
  ["高 (A)", "非常有把握，观察值接近真实值"],
  ["中 (B)", "对观察值有中等把握，观察值有可能接近真实值，也有可能差别很大"],
  ["低 (C)", "对观察值把握有限，观察值与真实值可能有很大差别"],
  ["极低 (D)", "对观察值几乎没有把握，观察值与真实值可能有很大差别"],
  ["推荐强度", ""],
  ["强推荐 (I)", "明确显示干预措施利大于弊，或弊大于利"],
  ["弱推荐 (II)", "利弊不确定，或无论质量高低的证据均显示利弊相当"],
];

const heatRelatedIllnessRows = [
  ["热疹", "由于过度出汗导致汗腺堵塞", "出现皮疹、炎症、感染"],
  [
    "热水肿",
    "由于外周血管扩张和间质液体积聚引起的四肢肿胀",
    "在热环境中久坐导致的四肢(通常是下肢)肿胀",
  ],
  [
    "热痉挛",
    "在热环境中运动时由于液体和电解质耗竭引起的疼痛性肌肉痉挛",
    "疼痛性肌肉收缩，受影响的肌肉僵硬且触诊时有压痛",
  ],
  [
    "热晕厥",
    "热环境导致血管内容量不足，在体位改变时发生眩晕或晕厥",
    "全身无力、体位性晕厥，一旦平躺迅速恢复",
  ],
  [
    "热衰竭",
    "由于体液大量丢失导致心输出量减少",
    "疲劳、恶心、呕吐、头痛、眩晕、焦虑、大量出汗，但意识状态正常",
  ],
  [
    "热射病",
    "极高的核心体温(>40°C)和中枢神经系统功能障碍",
    "意识状态改变、癫痫发作、昏迷、多系统器官衰竭",
  ],
];

const heatstrokeTypes = [
  {
    title: "经典型 (CHS)",
    body: "被动暴露于热环境，常见于老、幼、弱、慢病患者。起病缓，体温可达40-42°C，或不明显。易误诊。",
    label: "Classic Heat Stroke",
  },
  {
    title: "劳力型 (EHS)",
    body: "高温高湿下高强度活动，常见于健康年轻人。起病急，体温速升>40°C，可首发严重神经症状。低温环境也可发生。",
    label: "Exertional Heat Stroke",
  },
];

const riskFactorRows = [
  ["环境因素", "高温高湿环境(热浪、桑拿等)、缺乏空调"],
  [
    "个体因素",
    "运动过度、着装过多、高龄、肥胖、饮酒、未经热习服、儿童、遗传因素(钙结合蛋白1、肉碱 棕榈酰转移酶II)",
  ],
  [
    "社会因素",
    "风险职业(军人、消防员、运动员、高温环境作业者、户外工作者)、强烈求胜的动机、流浪者、独居",
  ],
  [
    "共病",
    "烧伤、脱水、腹泻、感染、糖尿病、神经系统疾病、呼吸系统疾病、认知障碍、心脏病、心理障碍、汗腺功能障碍、吸毒史",
  ],
  [
    "药物治疗",
    "非甾体类解热镇痛药、抗胆碱能药物、抗精神病药、β受体阻滞剂、利尿剂、甲状腺药物、抗组胺药、抗帕金森药、钙通道阻滞剂、泻药、三环类抗抑郁药、锂",
  ],
];

const pathophysiologyItems = [
  "体温调节障碍",
  "急性循环障碍",
  "肠肝损伤与脓毒症",
  "炎症失调与凝血紊乱",
  "中枢神经损伤",
  "横纹肌溶解与肾损伤",
  "肺损伤",
];

const monitoringRecommendations = [
  "推荐 4 (I, C): 应用颅脑 CT 动态评估中枢神经系统损害。",
  "推荐 5 (I, C): 使用 TEG 或凝血分析仪动态评估凝血状态。",
  "推荐 6 (II, D): 对血流动力学不稳定者进行连续血流动力学监测。",
  "推荐 7 (II, D): 应用 MRI 评估脑、心肌、横纹肌损伤程度。",
];

const organImpacts = [
  "中枢神经系统 (谵妄、昏迷、癫痫；小脑损伤常见)",
  "凝血功能 (高凝 -> 低凝/DIC；TEG指导)",
  "循环功能 (高动力 -> 低动力；心肌损伤)",
  "肝功能 (AST/ALT 剧升，胆红素升高)",
  "肾功能 (急性肾损伤；NGAL 敏感指标)",
  "横纹肌 (EHS 多见；CK/Mb 剧升)",
  "胃肠功能 (动力下降、出血、肠源性感染)",
  "呼吸功能 (ARDS 风险)",
  "内环境 (电解质紊乱、酸中毒)",
];

const labRows = [
  ["血常规", "WBC, NEUT%, LYM#, PLT, HGB, HCT", "1-2次/d, 出血者视情增加"],
  ["心肌标志物", "cTnI, BNP", "1次/d"],
  ["横纹肌溶解", "CK, Mb", "1次/d"],
  ["凝血功能", "PT, APTT, D-dimer, Fibrinogen", "早期1次/6h, 稳定后1次/d"],
  ["", "TEG / 凝血与血小板功能分析仪", "早期1-2次/d, 直至稳定"],
  ["", "TAT, PIC", "早期1-2次/d, 直至稳定"],
  ["血管内皮功能", "TM, t-PAIC", "早期1次/d, 直至稳定"],
  ["肾功能", "Creatinine", "1次/d"],
  ["肝功能", "ALT, AST, Total Bilirubin", "早期2次/d, 直至稳定"],
  ["炎性指标", "CRP, IL-6", "1次/d"],
  ["电解质", "K, Na, Cl, Ca", "1-2次/d, 依异常情况增加"],
  ["血糖", "Glucose", "1次/4h, 直至稳定"],
  ["血气", "pH, PO2, PCO2, HCO3-, BE, Lactate", "1次/4h, 直至稳定"],
  ["感染", "PCT", "1次/d"],
  ["病原学", "血液培养", "持续高热或可疑感染者"],
];

const diagnosisCriteria = [
  "病史: 暴露于高温高湿环境 或 高强度运动",
  "临床表现: 中枢神经系统功能障碍 (昏迷、抽搐等)",
  "临床表现: 核心体温 > 40°C (非绝对必要条件)",
  "临床表现: 多器官 (≥2个) 功能损伤",
];

const hicRows = [
  ["0分", "<40.0", "<1.0", "<2"],
  ["1分", "40.0~42.0", "1.0~2.5", "2~4"],
  ["2分", "≥42.0", "≥2.5", "≥4"],
];

const severityItems = ["1-10 分: 轻度", "11-20 分: 中度", ">20 分: 重度"];

const differentialDiagnosis = [
  "中枢神经系统疾病 (脑血管病, 脑炎/脑膜炎, 癫痫)",
  "感染性疾病 (脓毒症休克)",
  "代谢障碍性疾病 (低血糖/高渗昏迷, 肝/肾性脑病)",
  "恶性高热 (麻醉相关)",
];

const lifeChain = ["快速评估", "现场急救", "后送转运", "医院救治", "康复返岗"];

const rapidCoolingRecommendations = [
  "推荐 9 (I, C): 卫生人员应在 5 min 内完成快速识别与评估。",
  "推荐 10 (I, B): 降温目标：发病 30 min 内核心体温 <39.0°C，2 h 内 <38.5°C。",
  "推荐 11 (I, C): 应持续监测核心体温 (首选直肠温度 ≥15cm)。",
];

const onsiteFirstAid = [
  "脱 (离热环境)",
  "泡 (冰水/冷水浸泡最佳)",
  "测 (核心体温)",
  "补 (快速补液, 首选含钠液)",
  "通 (保持气道通畅, 吸氧)",
  "静 (控制抽搐, 地西泮)",
];

const tenEarlyPrinciples = [
  "早降温",
  "早补液",
  "早镇静",
  "早插管",
  "早抗凝",
  "早补凝",
  "早抗感染",
  "早抗炎",
  "早血液净化",
  "早胃肠管理",
  "禁手术 (凝血障碍时)",
];

const treatmentGroups = [
  {
    title: "推荐 13-14: 降温与液体",
    label: "Cooling & Fluids",
    points: [
      "推荐 13 (I, C): 常规降温无效尽早行血液净化 (CBP) 降温。",
      "推荐 14 (I, C): 血流动力学监测下精准液体管理 (首选晶体液)。",
      "Target Temp <38.5°C (TTM). PICCO monitoring recommended.",
    ],
  },
  {
    title: "推荐 15-16: 神经与气道",
    label: "CNS & Airway",
    points: [
      "推荐 15 (I, C): 严重中枢损害者尽早镇痛镇静治疗。",
      "推荐 16 (I, C): 伴中枢损害者尽早行气管插管。",
      "Control seizures, manage brain edema. Secure airway early.",
    ],
  },
  {
    title: "推荐 17-18: 凝血管理",
    label: "Coagulation",
    points: [
      "推荐 17 (II, C): 符合 HIC 标准且无活动出血，尽早启动抗凝 (首选 UFH)。",
      "推荐 18 (II, D): 有出血倾向或出血时，行目标导向替代治疗 (补凝)。",
      "Monitor with TEG/ACT. Use FFP, Cryo, Platelets based on targets.",
    ],
    placeholder: "图 4: HIC 抗凝治疗流程 Placeholder",
  },
  {
    title: "推荐 19-20: 感染与炎症",
    label: "Infection & Inflammation",
    points: [
      "推荐 19 (I, D): 疑似脓毒症尽早用广谱抗生素。",
      "推荐 20 (II, D): 过度炎症反应可启动抗炎治疗 (小剂量激素, 蛋白酶抑制剂)。",
      "Monitor PCT, blood cultures. Consider corticosteroids, Ulinastatin.",
    ],
  },
  {
    title: "推荐 21-22: 器官支持",
    label: "Organ Support",
    points: [
      "推荐 21 (I, C): 横纹肌溶解或严重 AKI 时，尽早行血液净化 (CBP)。",
      "推荐 22 (II, D): 合并急性肝衰竭时，尽快启动人工肝 (ALSS) 治疗。",
      "CVVH/CVVHD/CVVHDF for kidney/rhabdo. Plasma exchange/PDF for liver.",
    ],
  },
  {
    title: "推荐 23: 胃肠管理",
    label: "GI Management",
    points: [
      "血流动力学稳定者应尽早给予肠内营养。",
      "推荐强度 II, 证据等级 D",
      "从短肽到整蛋白，允许性低热卡摄入 [20-25 kcal/(kg·d)]。",
      "Start early enteral nutrition if stable.",
    ],
  },
];

const summaryTags = [
  "#核心机制",
  "#个体差异",
  "#诊断标志物",
  "#高效降温",
  "#免疫紊乱",
  "#热耐力评估",
];

export const metadata = {
  title: "中国热射病诊断与治疗指南 2025 版速通 | 红医师",
  description:
    "基于中国热射病诊断与治疗指南 2025 版的分型、诊断、监测、救治、康复与预防速览。",
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

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-sm font-black uppercase tracking-normal text-muted-foreground">
      {children}
    </p>
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
        ? "md:col-span-2 lg:col-span-2"
        : "";

  return (
    <article
      className={`rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.12)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] ${spanClass}`}
    >
      {children}
    </article>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded border-2 border-border">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-foreground">
          <tr>
            {headers.map((header) => (
              <th className="border-b-2 border-border px-4 py-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isSection = row[1] === "";

            return (
              <tr
                className={isSection ? "bg-muted/70" : "even:bg-muted/25"}
                key={`${row.join("-")}-${rowIndex}`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    className="border-b border-border px-4 py-3 align-top font-bold text-muted-foreground last:border-b-0"
                    colSpan={isSection && cellIndex === 0 ? headers.length : 1}
                    hidden={isSection && cellIndex > 0}
                    key={`${cell}-${cellIndex}`}
                  >
                    <span
                      className={
                        isSection || cellIndex === 0
                          ? "text-foreground"
                          : undefined
                      }
                    >
                      {cell}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FigurePlaceholder({ children }: { children: string }) {
  return (
    <div className="mt-4 grid min-h-20 place-items-center rounded border-2 border-dashed border-border bg-muted/35 px-4 py-5 text-center font-mono text-sm font-black text-muted-foreground">
      {children}
    </div>
  );
}

export default function HeatStrokeDiagnosisTreatmentGuidelinePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="guide"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-guide"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="relative isolate overflow-hidden border-b-2 border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-8 py-12 md:grid-cols-[0.85fr_1.15fr] md:items-end md:py-20">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-normal text-background/70 dark:text-muted-foreground">
                GUIDELINE 2025
              </p>
              <h1 className="mt-4 text-[clamp(3rem,9vw,6.8rem)] font-black leading-[0.88] text-primary">
                中国热射病
                <br />
                诊断与治疗指南
              </h1>
              <p className="mt-5 font-mono text-lg font-black text-background/75 dark:text-muted-foreground">
                2025 版速通
              </p>
            </div>

            <div className="rounded border-2 border-background/70 bg-background/10 p-5">
              <p className="text-xl font-black leading-tight md:text-3xl">
                Guideline for Diagnosis and Treatment of Heatstroke in China
                (2025 Edition)
              </p>
              <p className="mt-4 font-bold leading-8 text-background/75 dark:text-muted-foreground">
                基于最新证据，采用GRADE、AGREE、RIGHT标准制定，涵盖分型、机制、诊断、治疗、康复、预防等8方面，提出25条推荐意见。
              </p>
            </div>
          </div>
        </section>

        <GovernanceBanner />

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-10 md:grid-cols-3 lg:grid-cols-4 md:py-14">
          <Card span="wide">
            <SectionLabel>Abstract</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">核心摘要</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              近年来，气候变暖导致热射病发病率和死亡率逐年升高，不典型症状病例增加。本指南基于最新证据，采用GRADE、AGREE、RIGHT标准制定，涵盖分型、机制、诊断、治疗、康复、预防等8方面，提出25条推荐意见，旨在规范诊疗，提升防治水平。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {standardBadges.map((badge) => (
                <span
                  className="rounded border-2 border-primary px-3 py-2 font-mono text-xs font-black text-primary"
                  key={badge}
                >
                  {badge}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Key Statistic</SectionLabel>
            <h3 className="mt-3 text-xl font-black">全球热相关死亡</h3>
            <p className="mt-4 text-6xl font-black leading-none text-primary">
              34.5<span className="text-3xl">万</span>
            </p>
            <p className="mt-2 font-bold text-muted-foreground">
              (2019年, 65岁以上)
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Global Heat-Related Deaths (2019, &gt;65 yrs)
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Background & Challenge</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              背景与挑战
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              热射病是可致死性热损伤疾病。全球变暖加剧其发病率与死亡率，已超自然灾害总和。为应对复杂形势，更新2015及2019版共识，制定本指南。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded border-2 border-border bg-muted/35 p-4 text-center">
                <p className="text-4xl font-black text-primary">80.6%</p>
                <p className="mt-1 font-bold text-muted-foreground">
                  死亡率增长
                </p>
                <p className="font-mono text-xs font-bold text-muted-foreground">
                  Mortality Rate Increase
                </p>
              </div>
              <div className="rounded border-2 border-border bg-muted/35 p-4 text-center">
                <p className="text-4xl font-black text-primary">180.7%</p>
                <p className="mt-1 font-bold text-muted-foreground">
                  就诊人数增长 (2022 vs 2021, 中国)
                </p>
                <p className="font-mono text-xs font-bold text-muted-foreground">
                  Patient Visits Increase
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Methodology</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              指南制定方法
            </h2>
            <p className="mt-4 text-sm font-bold leading-7 text-muted-foreground">
              遵循国际标准，采用 GRADE 系统评估证据，AGREE 标准指导过程，RIGHT
              清单规范报告。
            </p>
            <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">
              检索 PubMed, Embase, Web of Science, Cochrane, CNKI 等数据库至
              2024.12.31。
            </p>
          </Card>

          <Card>
            <SectionLabel>Target Patients</SectionLabel>
            <h3 className="mt-3 text-xl font-black text-primary">适用对象</h3>
            <p className="mt-2 font-bold text-muted-foreground">
              疑似/确诊热射病患者
            </p>
            <h3 className="mt-5 text-xl font-black text-primary">使用者</h3>
            <p className="mt-2 font-bold text-muted-foreground">
              各级医师、基层卫生人员、应急救援、医疗保障人员
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>GRADE System</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              证据质量与推荐强度
            </h3>
            <DataTable
              headers={["证据把握度级别", "定义"]}
              rows={evidenceRows}
            />
          </Card>

          <Card>
            <SectionLabel>Classification</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 1: 分型诊断
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              应根据病史和临床特点对热相关疾病 (HRS) 进行分型诊断。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 C
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Includes heat rash, edema, cramps, syncope, exhaustion, and
              heatstroke.
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>HRS Classification</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热相关疾病分类
            </h3>
            <DataTable
              headers={["临床状况", "定义", "症状和体征"]}
              rows={heatRelatedIllnessRows}
            />
          </Card>

          <Card span="wide">
            <SectionLabel>Types of Heatstroke</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              热射病两大类型
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {heatstrokeTypes.map((item) => (
                <div
                  className="rounded border-2 border-border p-4"
                  key={item.title}
                >
                  <h3 className="text-xl font-black text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card span="wide">
            <SectionLabel>Epidemiology</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 2: 流行病学
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              应充分了解热射病高危因素，辅助诊断和预防。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 B
            </p>
            <p className="mt-3 font-mono text-xs font-bold text-muted-foreground">
              CHS mortality: 14-65% (ICU &gt;60%). EHS mortality: &gt;30% (with
              hypotension).
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
              China 2022 study: Overall mortality 32.4% (CHS 33.8%, EHS 30%).
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>Risk Factors</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病危险因素
            </h3>
            <DataTable headers={["因素", "举例"]} rows={riskFactorRows} />
            <p className="mt-3 font-mono text-xs font-bold text-muted-foreground">
              *注：非甾体类解热镇痛药对热射病无效且可能有害。
            </p>
          </Card>

          <Card>
            <SectionLabel>Pathophysiology</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 3: 病生机制
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              重视热射病时肠肝损伤导致的继发性脓毒症反应。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 C
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Focus on gut-liver axis and secondary sepsis.
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Pathophysiology Overview</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              病理生理机制概述
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pathophysiologyItems.map((item) => (
                <div
                  className="rounded border-2 border-border bg-muted/35 px-3 py-3 font-bold"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *详细机制见图1 (placeholder below)
            </p>
            <FigurePlaceholder>
              图 1: 病理生理机制示意图 Placeholder
            </FigurePlaceholder>
          </Card>

          <Card span="wide">
            <SectionLabel>Clinical Manifestations & Monitoring</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 4-7: 临床表现与监测
            </h2>
            <ul className="mt-5 grid gap-3 font-bold leading-7 text-muted-foreground">
              {monitoringRecommendations.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *EHS: 更早出现严重横纹肌溶解、肾/肝损伤、DIC。
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
              *CHS: 表现易与基础病混淆。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Key Organ Impacts</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              主要器官系统影响
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {organImpacts.map((item) => (
                <div
                  className="rounded border-2 border-border bg-muted/35 px-3 py-3 text-sm font-bold leading-6"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card span="full">
            <SectionLabel>Lab Monitoring</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              实验室监测指标及频次
            </h3>
            <DataTable headers={["项目", "监测指标", "频次"]} rows={labRows} />
          </Card>

          <Card span="wide">
            <SectionLabel>Diagnosis & Severity</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 8: 诊断与评估
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              推荐使用中国热射病及 HIC 诊断标准进行早期诊断，应用 HSSS
              评分系统每日评估危重程度。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 C
            </p>
            <div className="mt-5 grid gap-2 text-sm font-bold text-muted-foreground">
              <p>热射病诊断标准 (表5)</p>
              <p>HIC 诊断评分 (表7)</p>
              <p>HSSS 危重评分 (表8)</p>
            </div>
          </Card>

          <Card span="wide">
            <SectionLabel>Diagnostic Criteria</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病诊断标准 (简要)
            </h3>
            <p className="mt-4 font-bold text-muted-foreground">
              需满足以下条件之一：
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-muted-foreground">
              {diagnosisCriteria.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *不能用其他原因解释。需区分CHS与EHS (表6)。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>HIC Score</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              HIC 诊断评分系统
            </h3>
            <DataTable
              headers={[
                "积分",
                "最高核心体温(℃)",
                "D-二聚体(μg/mL)",
                "PT延长值(s)",
              ]}
              rows={hicRows}
            />
            <p className="mt-4 text-lg font-black text-primary">
              总分 ≥ 3 分可诊断 HIC
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              *建议采用直肠温度，急诊初次评估。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Severity Score</SectionLabel>
            <h3 className="mt-2 text-2xl font-black text-primary">
              热射病危重评分 (HSSS)
            </h3>
            <p className="mt-4 font-bold text-muted-foreground">
              每日评估病情，总分 0-32 分。
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-muted-foreground">
              {severityItems.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *基于核心体温、氧合指数、PLT、胆红素、血压、乳酸、GCS、肌酐/尿量
              (详见表8)。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Differential Diagnosis</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">鉴别诊断</h2>
            <p className="mt-4 font-bold text-muted-foreground">
              需与以下疾病鉴别：
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-muted-foreground">
              {differentialDiagnosis.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </Card>

          <Card span="wide">
            <SectionLabel>Life-Saving Chain</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              救治生命链
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              由5个关键环节组成，强调快速反应和连续性。
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-5">
              {lifeChain.map((item, index) => (
                <div
                  className="rounded border-2 border-border bg-muted/35 p-3 text-center font-black"
                  key={item}
                >
                  <span className="block font-mono text-xs text-primary">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *详细流程见图2 (placeholder below)
            </p>
            <FigurePlaceholder>
              图 2: 救治生命链示意图 Placeholder
            </FigurePlaceholder>
          </Card>

          <Card span="wide">
            <SectionLabel>Rapid Assessment & Cooling</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 9-11: 快速评估与降温
            </h2>
            <ul className="mt-5 grid gap-3 font-bold leading-7 text-muted-foreground">
              {rapidCoolingRecommendations.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *关注不典型热射病：体温&lt;40°C、非高温环境、运动强度不高、意识障碍不重。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>On-Site First Aid</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              现场急救六步法
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              遵循&quot;边降温边转运&quot;，&quot;降温第一，转运第二&quot;原则。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {onsiteFirstAid.map((item) => (
                <div
                  className="rounded border-2 border-border bg-muted/35 p-3 text-center text-sm font-black"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs font-bold text-muted-foreground">
              *禁止使用非甾体类药物降温。
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
              *降温速率需 ≥ 0.155 °C/min。
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Transport</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 12: 后送转运
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              现场降温效果不理想者，应边降温边后送。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 B
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
              转运指征：体温&gt;40°C, 降温30min后仍&gt;40°C, 意识障碍无改善,
              缺乏救治条件。
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Transport Indications & Continuous Cooling
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>Hospital Treatment</SectionLabel>
            <h2 className="mt-2 text-center text-3xl font-black text-primary">
              医院救治：&quot;十早一禁&quot;原则
            </h2>
            <p className="mt-2 text-center font-mono text-sm font-black text-muted-foreground">
              Hospital Treatment: &quot;10 Early, 1 Prohibited&quot;
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {tenEarlyPrinciples.map((item) => (
                <div
                  className="rounded border-2 border-border bg-muted/35 p-3 text-center text-sm font-black"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <FigurePlaceholder>
              图 3: &quot;十早一禁&quot;原则示意图 Placeholder
            </FigurePlaceholder>
          </Card>

          {treatmentGroups.map((group) => (
            <Card key={group.title} span="wide">
              <SectionLabel>{group.label}</SectionLabel>
              <h3 className="mt-2 text-2xl font-black text-primary">
                {group.title}
              </h3>
              <ul className="mt-4 grid gap-2 text-sm font-bold leading-7 text-muted-foreground">
                {group.points.map((point) => (
                  <li key={point}>· {point}</li>
                ))}
              </ul>
              {group.placeholder ? (
                <FigurePlaceholder>{group.placeholder}</FigurePlaceholder>
              ) : null}
            </Card>
          ))}

          <Card span="wide">
            <SectionLabel>Rehabilitation</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 24: 康复与返岗
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              EHS 患者临床痊愈后，可进行热耐力测试及重建治疗。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 D
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
              测试环境：40°C, 40% RH。计算 PSI 指数评估。
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Heat tolerance testing (HTT) and rebuilding for EHS patients.
            </p>
          </Card>

          <Card span="wide">
            <SectionLabel>Prevention</SectionLabel>
            <h2 className="mt-2 text-2xl font-black text-primary">
              推荐 25: 预防
            </h2>
            <p className="mt-4 font-bold leading-7 text-muted-foreground">
              科学开展热习服可有效预防热射病 (尤其 EHS)。
            </p>
            <p className="mt-4 text-lg font-black text-primary">
              推荐强度 I, 证据等级 C
            </p>
            <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
              每年入夏前常规训练，周期 10-14 天。关注高危人群，及时补水补盐。
            </p>
            <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
              Heat acclimatization is key. Screen high-risk individuals.
            </p>
          </Card>

          <Card span="full">
            <SectionLabel>Summary & Outlook</SectionLabel>
            <h2 className="mt-2 text-3xl font-black text-primary">
              总结与展望
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              本指南更新了分型、机制、诊断评分、救治链、康复策略及&quot;十早一禁&quot;原则。未来研究需关注：核心机制、个体化表现机制、特异性标志物、高效降温方法、免疫紊乱干预、热耐力评估标准等。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {summaryTags.map((tag) => (
                <span
                  className="rounded border-2 border-border bg-muted/35 px-3 py-2 font-mono text-xs font-black text-muted-foreground"
                  key={tag}
                >
                  {tag}
                </span>
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
              href="/heat-stroke/pages/core-temperature-cooling"
            >
              查看核心体温与降温
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
