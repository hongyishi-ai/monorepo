import type {
  TcccFlowDefinition,
  TcccFlowNode,
} from "../_components/TcccDecisionFlow";
import airwayFlowData from "../pages/tfc-airway/airway-flow.json";

export type TcccModuleStage = "CUF" | "TFC" | "TACEVAC" | "课程";

type ScenarioSpec = {
  id: string;
  label: string;
  title: string;
  body: string;
  details: string[];
  cautions?: string[];
  capability?: "全员" | "医护" | "专业人员";
};

type ModuleSpec = {
  slug: string;
  title: string;
  shortTitle: string;
  stage: TcccModuleStage;
  section: string;
  summary: string;
  prompt: string;
  scenarios: ScenarioSpec[];
  nextSlug: string;
  nextLabel: string;
  activeMenuItemId?: string;
};

export type TcccModuleEntry = ModuleSpec & {
  activeBottomItemId: "standard" | "tfc" | "tacevac" | "directory";
  flow: TcccFlowDefinition;
};

const guidelineVersion = "2026-05-01";
const menuItemBySlug: Record<string, string> = {
  "cuf-threat-care": "threat",
  "tccc-tbi": "tbi",
  "tccc-eye-trauma": "eye",
  "tccc-pain-management": "pain",
  "tccc-antibiotics": "antibiotics",
  "tccc-wound-care": "wound",
  "tccc-burns": "wound",
  "tccc-documentation": "documentation",
};

function stageBottomItem(stage: TcccModuleStage, slug: string) {
  if (slug === "tccc-standard") return "standard" as const;
  if (slug === "tccc-flow-framework" || stage === "课程") {
    return "directory" as const;
  }
  return stage === "TACEVAC" ? ("tacevac" as const) : ("tfc" as const);
}

function createFlow(spec: ModuleSpec): TcccFlowDefinition {
  const scenarioNodes: TcccFlowNode[] = spec.scenarios.map((scenario) => ({
    id: `${scenario.id}-action`,
    type: "action",
    eyebrow: `${spec.stage} · 处置`,
    title: scenario.title,
    body: scenario.body,
    progress: 55,
    capability: scenario.capability ?? "医护",
    details: scenario.details,
    cautions: scenario.cautions,
    nextNodeId: "reassess",
    nextLabel: "完成处置并复评",
  }));

  const stageCaution =
    spec.stage === "TACEVAC"
      ? [
          "2026 TCCC 指南说明：完整 TACEVAC 指南现由 CoERCCC 单独管理；本页用于 TCCC 向后送阶段过渡与既有干预复核训练。",
        ]
      : undefined;

  return {
    title: `${spec.title}决策训练`,
    version: guidelineVersion,
    sourceSection: spec.section,
    startNodeId: "intro",
    nextModuleHref: `/tccc/pages/${spec.nextSlug}`,
    nextModuleLabel: spec.nextLabel,
    nodes: [
      {
        id: "intro",
        type: "intro",
        eyebrow: `${spec.stage} · ${spec.section}`,
        title: spec.title,
        body: spec.summary,
        progress: 0,
        capability: "全员",
        cautions: stageCaution,
        nextNodeId: "assessment",
        nextLabel: "开始情景判断",
      },
      {
        id: "assessment",
        type: "choice",
        eyebrow: `${spec.stage} · 评估`,
        title: spec.prompt,
        body: "选择最符合伤员当前表现的情景。完成处置后必须再次评估，不能把一次干预视为永久有效。",
        progress: 25,
        capability: "全员",
        choices: spec.scenarios.map((scenario, index) => ({
          id: scenario.id,
          label: scenario.label,
          nextNodeId: `${scenario.id}-action`,
          tone: index === spec.scenarios.length - 1 ? "caution" : "primary",
        })),
      },
      ...scenarioNodes,
      {
        id: "reassess",
        type: "choice",
        eyebrow: `${spec.stage} · 复评`,
        title: "处置后问题是否得到控制？",
        body: "重新检查生命体征、伤情变化和本次干预效果。若问题仍存在或再次出现，回到评估节点重新选择处置路径。",
        progress: 82,
        capability: "医护",
        choices: [
          {
            id: "controlled",
            label: "是，当前问题已控制",
            nextNodeId: "complete",
          },
          {
            id: "not-controlled",
            label: "否，仍未控制或再次恶化",
            nextNodeId: "assessment",
            tone: "caution",
          },
        ],
      },
      {
        id: "complete",
        type: "complete",
        eyebrow: `${spec.stage} · 本模块完成`,
        title: "继续下一项优先任务",
        body: "当前问题已得到控制，但仍需持续复评，并把评估、处置和状态变化记录在伤员文书中。",
        progress: 100,
        details: [
          "任何生命体征恶化都应触发重新 MARCH 评估。",
          "交接时说明受伤机制、伤情、生命体征和已完成处置。",
        ],
      },
    ],
  };
}

const moduleSpecs: ModuleSpec[] = [
  {
    slug: "cuf-threat-care",
    title: "直接威胁下救治",
    shortTitle: "直接威胁（CUF）",
    stage: "CUF",
    section: "直接威胁下救治（CUF）",
    summary:
      "在持续直接威胁下，先维持火力、掩蔽和任务安全，只实施战术上可行的救命措施。",
    prompt: "当前威胁与伤员能力如何？",
    scenarios: [
      {
        id: "self-aid",
        label: "伤员能行动并可自救",
        title: "指挥伤员移向掩体并自救",
        body: "让伤员在战术可行时继续行动、转移至掩体，并自行控制危及生命的外部出血。",
        details: ["维持还击和掩蔽。", "避免伤员继续暴露并受到二次伤害。"],
        capability: "全员",
      },
      {
        id: "extract",
        label: "伤员无法移动，需要转移",
        title: "在战术可行时转移伤员",
        body: "移动或拖拽伤员至相对安全处；若位于燃烧车辆或建筑内，先撤离并终止燃烧过程。",
        details: ["不要因非紧急处置延长暴露时间。", "气道管理通常延后至 TFC。"],
        capability: "全员",
      },
      {
        id: "hemorrhage",
        label: "存在危及生命的四肢外出血",
        title: "使用四肢止血带",
        body: "若战术可行，对适合使用止血带的危及生命四肢出血实施控制。",
        details: [
          "伤口位置不明确时可高而紧地置于衣物外。",
          "进入 TFC 后必须重新评估止血带。",
        ],
        capability: "全员",
      },
    ],
    nextSlug: "tccc-standard",
    nextLabel: "进入 TCCC 标准流程",
  },
  {
    slug: "tccc-standard",
    title: "TCCC 标准流程",
    shortTitle: "标准流程",
    stage: "课程",
    section: "TCCC 三阶段与 TFC 基本管理计划",
    summary:
      "根据威胁、救治阶段和伤员当前最紧迫问题，选择正确入口，而不是机械完成固定清单。",
    prompt: "当前处于哪个救治阶段？",
    scenarios: [
      {
        id: "direct-threat",
        label: "仍处于直接威胁或交火环境",
        title: "回到直接威胁下救治原则",
        body: "优先处理威胁、掩蔽、伤员转移和战术可行的大出血控制。",
        details: ["非必要气道处置通常延后。", "尽快转入相对安全的 TFC 环境。"],
        capability: "全员",
      },
      {
        id: "field-care",
        label: "已进入战术野战救治（TFC）",
        title: "从未识别的大出血开始 MARCH",
        body: "建立警戒、完成伤员分类，然后按大出血、气道、呼吸、循环和低体温等优先级推进。",
        details: ["随伤情变化反复回到 MARCH。", "同步沟通、记录并准备后送。"],
        capability: "全员",
      },
      {
        id: "evacuation",
        label: "正在向后送平台交接或运输",
        title: "完成过渡并重新评估全部干预",
        body: "清楚交接伤员稳定性、已识别伤情和处置，固定伤员并由后送医疗人员重新评估。",
        details: [
          "完整 TACEVAC 指南由 CoERCCC 单独管理。",
          "不得假定 TFC 干预在运输中持续有效。",
        ],
      },
    ],
    nextSlug: "tfc-hemorrhage",
    nextLabel: "从 TFC 大出血开始",
    activeMenuItemId: "standard",
  },
  {
    slug: "tfc-hemorrhage",
    title: "TFC 大出血控制",
    shortTitle: "大出血",
    stage: "TFC",
    section: "战术野战救治（TFC）第 3 节：大出血",
    summary:
      "识别所有未控制出血，并根据解剖部位选择四肢止血带、伤口填塞、止血敷料或交界区装置。",
    prompt: "出血最适合哪种控制方式？",
    scenarios: [
      {
        id: "limb",
        label: "危及生命的四肢出血或创伤性截肢",
        title: "皮肤上方 2–3 英寸放置四肢止血带",
        body: "将推荐的四肢止血带直接置于皮肤、出血点近心端 2–3 英寸；首个不能止血时并排加第二个。",
        details: [
          "暴露并清楚标记所有止血带。",
          "记录放置时间并持续确认出血停止。",
        ],
        capability: "全员",
      },
      {
        id: "compressible",
        label: "不适合四肢止血带的可压迫外出血",
        title: "填塞伤口并持续直接加压",
        body: "优先使用 Combat Gauze 等止血敷料，通常至少直接加压 3 分钟；失败时按产品特点更换或加用其他敷料。",
        details: ["XStat 不在现场移除。", "可用压力敷料维持控制。"],
        capability: "全员",
      },
      {
        id: "junctional",
        label: "交界区或头颈部可压迫出血",
        title: "选择交界区装置或 iTClamp",
        body: "按伤口部位和训练授权使用交界区止血装置；头颈伤口边缘易合拢时可考虑 iTClamp。",
        details: [
          "iTClamp 不得用于眼或距眼眶 1 cm 内。",
          "颈部使用后频繁监测气道和扩张性血肿。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tfc-airway",
    nextLabel: "进入气道管理",
    activeMenuItemId: "tfc",
  },
  {
    slug: "tccc-breathing",
    title: "呼吸与胸部伤处置",
    shortTitle: "呼吸",
    stage: "TFC",
    section: "战术野战救治（TFC）第 5 节：呼吸管理",
    summary:
      "识别张力性气胸、开放性胸部伤口和低氧，并在每次干预后确认呼吸、循环和血氧变化。",
    prompt: "当前最紧迫的呼吸问题是什么？",
    scenarios: [
      {
        id: "tension",
        label: "疑似张力性气胸并有呼吸窘迫或休克",
        title: "实施针刺减压并判断是否成功",
        body: "按训练授权在推荐部位实施针刺减压，观察窘迫改善、气体逸出、SpO₂ 上升或生命体征恢复。",
        details: [
          "首次无效时在同侧另一个推荐部位用新针再次尝试。",
          "根据机制考虑对侧减压；两次仍无效则继续循环评估。",
        ],
        capability: "医护",
      },
      {
        id: "open-chest",
        label: "开放性或吸吮性胸部伤口",
        title: "立即覆盖胸部伤口",
        body: "优先使用带阀胸封；无带阀胸封时使用无阀胸封，并监测继发张力性气胸。",
        details: [
          "若低氧、窘迫或低血压加重，考虑揭开或移除胸封并实施减压。",
          "持续复评双侧胸部。",
        ],
        capability: "全员",
      },
      {
        id: "hypoxia",
        label: "中重度 TBI 或通气不足伴低氧",
        title: "维持氧合并提供通气支持",
        body: "中重度 TBI 目标 SpO₂ ≥92%；通气不足且低氧无法纠正时，考虑合适尺寸鼻咽通气道并用 1000 ml BVM 通气。",
        details: [
          "连续监测 SpO₂ 与 EtCO₂。",
          "一般伤员不因受伤本身常规吸氧，应按低氧和适应证使用。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-shock-fluid",
    nextLabel: "进入循环与休克管理",
    activeMenuItemId: "breathing",
  },
  {
    slug: "tccc-shock-fluid",
    title: "休克与复苏",
    shortTitle: "休克复苏",
    stage: "TFC",
    section: "战术野战救治（TFC）第 6 节：循环",
    summary:
      "用意识状态和桡动脉搏动识别出血性休克，优先使用血制品复苏并反复检查出血控制。",
    prompt: "伤员是否存在出血性休克？",
    scenarios: [
      {
        id: "no-shock",
        label: "无休克表现",
        title: "暂不需要静脉补液",
        body: "无休克时通常不需要立即静脉补液；伤员清醒且能吞咽时可口服液体。",
        details: ["继续监测意识和桡动脉搏动。", "警惕隐匿性出血和迟发休克。"],
      },
      {
        id: "shock-blood",
        label: "存在休克且可获得血制品",
        title: "按优先级实施血液复苏",
        body: "优先冷藏低滴度 O 型全血，其次预筛低滴度 O 型新鲜全血，再依次考虑 1:1:1、1:1 成分血及单一血浆或红细胞。",
        details: [
          "同步启动低体温预防和液体加温。",
          "复苏目标为意识改善或正常桡动脉搏动。",
        ],
        capability: "专业人员",
      },
      {
        id: "refractory",
        label: "复苏后休克仍持续或再次出现",
        title: "重新查找出血并考虑未处理的张力性气胸",
        body: "复查全部外部止血措施，继续按指南复苏；对无反应休克同时考虑未处理的张力性气胸。",
        details: [
          "中重度 TBI 伴意识异常时目标 SBP >100 mmHg 或正常桡动脉搏动。",
          "持续记录每次复评结果。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-hypothermia",
    nextLabel: "进入低体温预防",
  },
  {
    slug: "tccc-iv-txa",
    title: "血管通路与 TXA",
    shortTitle: "IV/IO 与 TXA",
    stage: "TFC",
    section: "战术野战救治（TFC）第 6c–6d 节",
    summary:
      "根据休克风险和用药需要建立 IV/IO 通路，并在明确适应证和时间窗内给予氨甲环酸（TXA）。",
    prompt: "伤员需要哪项循环支持？",
    scenarios: [
      {
        id: "access",
        label: "休克、休克高风险或无法口服所需药物",
        title: "建立 IV 或 IO 通路",
        body: "首选 18G 静脉通路或盐水锁；需要通路但无法迅速建立 IV 时改用 IO。",
        details: ["通路本身不是补液指征。", "固定并持续检查通路位置。"],
        capability: "医护",
      },
      {
        id: "txa-bleeding",
        label: "可能需要输血：休克、重大截肢、躯干穿透伤或严重出血",
        title: "尽早给予 TXA",
        body: "给予 TXA 2 g，经 IV/IO 缓慢推注，尽早实施且不得晚于受伤后 3 小时。",
        details: [
          "不要因 TXA 延误出血控制和血液复苏。",
          "记录受伤时间与给药时间。",
        ],
        capability: "医护",
      },
      {
        id: "txa-tbi",
        label: "显著 TBI 体征或爆炸/钝性伤后意识异常",
        title: "按 TBI 适应证考虑 TXA",
        body: "显著 TBI 或相关意识异常同样属于指南列出的 TXA 适应证。",
        details: [
          "同时防止低氧和低血压。",
          "给药仍需满足受伤后 3 小时时间窗。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-shock-fluid",
    nextLabel: "进入休克复苏",
  },
  {
    slug: "tccc-pelvic-binder",
    title: "骨盆绑带",
    shortTitle: "骨盆绑带",
    stage: "TFC",
    section: "战术野战救治（TFC）第 6a 节：出血控制",
    summary:
      "对严重钝性或爆炸伤，根据骨盆痛、下肢重大截肢、查体、意识和休克判断是否使用骨盆绑带。",
    prompt: "是否存在可疑骨盆骨折指征？",
    scenarios: [
      {
        id: "indicated",
        label:
          "严重钝性/爆炸伤并有骨盆痛、查体异常、重大下肢截肢、意识障碍或休克",
        title: "在大转子水平放置骨盆绑带",
        body: "按器材说明将骨盆绑带正确置于大转子水平并收紧，避免放置过高。",
        details: ["记录放置时间。", "绑带后继续处理出血性休克并检查下肢灌注。"],
        capability: "全员",
      },
      {
        id: "uncertain",
        label: "机制可疑但体征不明确",
        title: "结合机制和休克风险审慎判断",
        body: "不要依赖单一疼痛表现；无意识或休克伤员可能无法报告骨盆痛。",
        details: ["避免反复挤压骨盆检查。", "尽快后送并持续复评。"],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-shock-fluid",
    nextLabel: "进入休克复苏",
  },
  {
    slug: "tccc-hypothermia",
    title: "低体温预防",
    shortTitle: "低体温",
    stage: "TFC",
    section: "战术野战救治（TFC）第 7 节：低体温预防",
    summary:
      "创伤和大面积烧伤伤员即使在温暖环境中也易失温，应尽早阻断传导、对流、蒸发和辐射热损失。",
    prompt: "当前最主要的失温风险是什么？",
    scenarios: [
      {
        id: "environment",
        label: "伤员暴露于冷地面、风、雨或湿衣物",
        title: "立即隔离冷源并更换湿衣",
        body: "在伤员与冷表面之间放置隔热材料，尽可能更换湿衣并防风防雨。",
        details: [
          "保留防护装备并与伤员同行。",
          "不要等待体温下降后才开始保温。",
        ],
        capability: "全员",
      },
      {
        id: "active-heat",
        label: "需要主动加温和完整封装",
        title: "主动加温躯干并封闭保温",
        body: "将主动加温毯置于前胸和腋下区域，避免热源直接接触皮肤，再使用防水外袋和保温层封装。",
        details: [
          "逐步升级为带帽睡袋等高保温系统。",
          "烧伤伤员同样需要强化低体温预防。",
        ],
        capability: "全员",
      },
      {
        id: "fluids",
        label: "正在快速输注 IV/IO 复苏液",
        title: "加温复苏液",
        body: "使用电池供电加温设备，按指南能力将输出温度维持约 38°C，并与保温封装同步。",
        details: [
          "不要把主动热源直接贴在皮肤上。",
          "运输平台上继续防风和防雨。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-tbi",
    nextLabel: "进入脑损伤评估",
    activeMenuItemId: "hypothermia",
  },
  {
    slug: "tccc-tbi",
    title: "中重度创伤性脑损伤",
    shortTitle: "TBI",
    stage: "TFC",
    section: "战术野战救治（TFC）第 8 节：创伤性脑损伤",
    summary:
      "识别伤后超过 10 分钟仍不能遵循简单指令的疑似中重度 TBI，优先防止低氧、低血压和脑疝。",
    prompt: "疑似 TBI 伤员当前最危险的表现是什么？",
    scenarios: [
      {
        id: "moderate-severe",
        label: "伤后超过 10 分钟不能遵循简单指令",
        title: "按中重度 TBI 处理并尽快后送",
        body: "维持 SpO₂ ≥92%，SBP >100 mmHg 或正常桡动脉搏动；目标尽快到达神经外科能力，理想情况下 5 小时内。",
        details: [
          "有出血性休克时优先按休克复苏。",
          "无出血证据时可给予 1–2 单位血浆；轻度 TBI 不适用。",
        ],
        capability: "医护",
      },
      {
        id: "ventilated",
        label: "已接受辅助通气",
        title: "控制通气并监测 EtCO₂",
        body: "有 EtCO₂ 时目标 35–45 mmHg；无法监测时采用低潮气量、每分钟 10 次通气。",
        details: [
          "无休克且战术可行时抬高头胸超过 30°。",
          "保持头部正中，避免颈部旋转。",
        ],
        capability: "医护",
      },
      {
        id: "herniation",
        label: "瞳孔不对称/固定散大或出现异常姿势",
        title: "按脑疝路径给予高渗盐水",
        body: "给予 3% 或 5% 高渗盐水 250 ml，或 23.4% 高渗盐水 30 ml，经 IV/IO 至少 10 分钟并冲管。",
        details: [
          "20 分钟无反应可重复一次，最多 2 次。",
          "不得预防性使用；高渗盐水不是复苏液。",
        ],
        capability: "专业人员",
      },
    ],
    nextSlug: "tccc-eye-trauma",
    nextLabel: "进入眼外伤评估",
  },
  {
    slug: "tccc-eye-trauma",
    title: "穿透性眼外伤",
    shortTitle: "眼外伤",
    stage: "TFC",
    section: "战术野战救治（TFC）第 9 节：穿透性眼外伤",
    summary:
      "疑似穿透性眼伤时保护眼球、记录视力并尽早给予 2026 指南推荐抗菌药。",
    prompt: "眼部伤情属于哪种情况？",
    scenarios: [
      {
        id: "suspected",
        label: "疑似或明确穿透性眼外伤",
        title: "快速测视力并使用硬质眼罩",
        body: "完成现场快速视力测试并记录，使用硬质眼罩保护患眼，禁止使用加压眼垫。",
        details: ["避免对眼球施压。", "保留异物，不在现场拔除。"],
        capability: "全员",
      },
      {
        id: "oral",
        label: "伤员可口服药物",
        title: "尽早给予 Cefadroxil",
        body: "按 2026 指南尽早给予 Cefadroxil 1 g 口服。",
        details: ["记录给药时间。", "硬质眼罩和后送不能因给药延误。"],
        capability: "医护",
      },
      {
        id: "parenteral",
        label: "不能口服或需注射给药",
        title: "尽早给予 Ceftriaxone",
        body: "按 2026 指南给予 Ceftriaxone 2 g IV 或 IM。",
        details: ["继续监测并尽快后送。", "不得使用压力敷料覆盖眼球。"],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-monitoring",
    nextLabel: "进入监测模块",
  },
  {
    slug: "tccc-monitoring",
    title: "伤员监测",
    shortTitle: "监测",
    stage: "TFC",
    section: "战术野战救治（TFC）第 10 节：监测",
    summary:
      "在有指征且设备可用时启动高级电子监测，但不能以设备读数代替反复临床评估。",
    prompt: "当前需要重点监测什么？",
    scenarios: [
      {
        id: "airway-breathing",
        label: "气道、通气或中重度 TBI 风险",
        title: "连续关注 SpO₂ 与 EtCO₂",
        body: "用 SpO₂ 和 EtCO₂ 辅助判断气道通畅、氧合和通气，并结合伤员表现解释读数。",
        details: [
          "休克和明显低体温可使脉搏血氧读数不可靠。",
          "中重度 TBI 氧饱和度目标 ≥92%。",
        ],
        capability: "医护",
      },
      {
        id: "shock",
        label: "休克、输血或病情不稳定",
        title: "建立趋势而非只看单次读数",
        body: "连续记录意识、脉搏、血压、呼吸和体温变化，观察干预前后趋势。",
        details: ["设备报警必须回到伤员身边确认。", "重新检查所有止血和通路。"],
        capability: "医护",
      },
      {
        id: "limited",
        label: "没有高级电子监测设备",
        title: "使用可重复的临床指标",
        body: "以意识、桡动脉搏动、呼吸频率和质量、皮肤表现及伤情变化进行连续复评。",
        details: ["固定时间点记录。", "不要因缺少设备停止救治或延误后送。"],
        capability: "全员",
      },
    ],
    nextSlug: "tccc-pain-management",
    nextLabel: "进入镇痛管理",
  },
  {
    slug: "tccc-pain-management",
    title: "2026 镇痛管理",
    shortTitle: "镇痛",
    stage: "TFC",
    section: "战术野战救治（TFC）第 11 节：镇痛",
    summary:
      "目标是把疼痛降至可耐受，同时保留气道通畅、呼吸驱动和意识，而不是追求完全无痛或完全镇静。",
    prompt: "伤员能否继续执行任务？",
    scenarios: [
      {
        id: "mission-capable",
        label: "可继续任务且可口服",
        title: "使用 2026 CWMP 镇痛方案",
        body: "Acetaminophen 1000–1300 mg PO 每 8 小时、Meloxicam 15 mg PO 每日一次、Suzetrigine 首次 100 mg 后每 12 小时 50 mg。",
        details: ["由伤员自服或 TCCC 人员协助。", "记录剂量和时间。"],
        capability: "全员",
      },
      {
        id: "non-mission",
        label: "不能继续任务，需要强效镇痛",
        title: "按 2026 固定剂量 Ketamine / Esketamine 路径",
        body: "医疗人员可选 Ketamine 100 mg IM、50 mg IN、25 mg（或 0.2–0.3 mg/kg）IV/IO 1 分钟，或 Esketamine 14/28 mg IN；必要时每 30 分钟重复。",
        details: ["先记录 AVPU。", "终点为疼痛减轻或出现眼球震颤。"],
        capability: "医护",
      },
      {
        id: "respiratory-risk",
        label: "镇痛后呼吸减少或意识变化",
        title: "立即复评气道和呼吸",
        body: "先将气道调整至嗅探位；无效时提供通气支持，并持续监测循环。",
        details: [
          "不推荐 Ketamine/Esketamine 与 benzodiazepine 联用。",
          "避免与 opioid 镇痛并用 benzodiazepine。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-antibiotics",
    nextLabel: "进入抗菌药模块",
  },
  {
    slug: "tccc-antibiotics",
    title: "2026 战伤抗菌药",
    shortTitle: "抗菌药",
    stage: "TFC",
    section: "战术野战救治（TFC）第 12 节：抗菌药",
    summary:
      "所有开放性战斗伤都推荐尽早使用抗菌药，并根据伤员能否口服选择 2026 指南推荐路径。",
    prompt: "伤员能否口服药物？",
    scenarios: [
      {
        id: "oral-primary",
        label: "可以口服",
        title: "首选 Cefadroxil",
        body: "给予 Cefadroxil 1 g PO，每日一次。",
        details: ["尽早给药。", "记录首次给药时间并随伤员交接。"],
        capability: "医护",
      },
      {
        id: "oral-alternative",
        label: "可以口服但需替代方案",
        title: "使用 Cephalexin 替代",
        body: "2026 指南列出的口服替代方案为 Cephalexin 500 mg PO，每 6 小时一次。",
        details: [
          "确认后续剂量能够延续。",
          "确认药物过敏史，并按医疗指挥链处理禁忌证或替代方案。",
        ],
        capability: "医护",
      },
      {
        id: "cannot-oral",
        label: "休克、无意识或不能口服",
        title: "给予 Ceftriaxone",
        body: "给予 Ceftriaxone 2 g IV/IO/IM，每日一次。",
        details: ["不要因建立通路延误其他救命干预。", "记录途径、剂量和时间。"],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-wound-care",
    nextLabel: "进入伤口检查与包扎",
  },
  {
    slug: "tccc-wound-care",
    title: "伤口检查与包扎",
    shortTitle: "伤口",
    stage: "TFC",
    section: "战术野战救治（TFC）第 13–14 节",
    summary:
      "检查和包扎已知伤口，再完成全身附加伤口检查；腹腔内容物膨出需要单独决策。",
    prompt: "当前伤口属于哪种情况？",
    scenarios: [
      {
        id: "routine",
        label: "已知伤口，出血已控制",
        title: "检查、覆盖并寻找遗漏伤口",
        body: "包扎已知伤口并完成附加伤口检查，持续确认敷料、止血和远端灌注。",
        details: ["开放性战伤按第 12 节给予抗菌药。", "记录伤口位置和处理。"],
        capability: "全员",
      },
      {
        id: "evisceration-reducible",
        label: "腹腔内容物膨出，无肠液/粪便泄漏且出血可控",
        title: "清洁覆盖并可短暂尝试复位",
        body: "控制出血，用清洁且尽可能温暖的液体减少污染；可单次短暂（<60 秒）尝试复位。",
        details: ["覆盖暴露肠管的敷料应湿润、无菌。", "伤员保持 NPO。"],
        capability: "医护",
      },
      {
        id: "evisceration-no-reduction",
        label: "存在泄漏、活动性出血或无法复位",
        title: "禁止强行复位",
        body: "不要将破裂或活动性出血的脏器强推回腹腔；用不粘、防水材料覆盖并固定。",
        details: ["优先透明覆盖以便复评出血。", "保持 NPO 并尽快后送。"],
        cautions: ["侵入性操作或严重伤情需要镇静时，必须具备保护气道的能力。"],
        capability: "专业人员",
      },
    ],
    nextSlug: "tccc-burns",
    nextLabel: "进入烧伤处置",
  },
  {
    slug: "tccc-burns",
    title: "烧伤处置",
    shortTitle: "烧伤",
    stage: "TFC",
    section: "战术野战救治（TFC）第 15 节：烧伤",
    summary:
      "把伤员视为伴烧伤的创伤伤员，先完成创伤优先级，再处理吸入性损伤、烧伤覆盖、复苏和保温。",
    prompt: "烧伤当前最主要的风险是什么？",
    scenarios: [
      {
        id: "airway",
        label: "面部烧伤、密闭空间暴露或疑似吸入性损伤",
        title: "积极监测气道与氧合",
        body: "频繁检查气道和 SpO₂；出现呼吸窘迫或氧饱和度下降时考虑早期外科气道。",
        details: ["不要等待明显完全阻塞。", "同时继续创伤 MARCH 评估。"],
        capability: "医护",
      },
      {
        id: "limited",
        label: "烧伤面积 ≤20% TBSA",
        title: "估算 TBSA 并干燥覆盖",
        body: "用九分法把 TBSA 估算到最近 10%，用干燥无菌敷料覆盖并强化低体温预防。",
        details: [
          "烧伤本身不是院前抗菌药指征。",
          "伴开放性穿透伤时按抗菌药章节处理。",
        ],
        capability: "全员",
      },
      {
        id: "extensive",
        label: "烧伤面积 >20% TBSA",
        title: "启动烧伤复苏并优先处理出血性休克",
        body: "建立 IV/IO 后按 USAISR Rule of Ten：40–80 kg 成人初始速率为 %TBSA ×10 ml/h；体重每超过 80 kg 10 kg 增加 100 ml/h。",
        details: [
          "出血性休克复苏优先于烧伤休克。",
          "可用乳酸林格液、0.9% 盐水或指南列出的 Hextend 限量方案。",
        ],
        capability: "专业人员",
      },
    ],
    nextSlug: "tccc-splints",
    nextLabel: "进入骨折固定",
  },
  {
    slug: "tccc-splints",
    title: "骨折固定",
    shortTitle: "夹板",
    stage: "TFC",
    section: "战术野战救治（TFC）第 16 节：夹板固定",
    summary:
      "固定骨折并在固定前后检查远端脉搏、感觉和运动，避免固定本身造成新的灌注损害。",
    prompt: "骨折固定前后出现什么情况？",
    scenarios: [
      {
        id: "pulse-present",
        label: "远端脉搏存在，肢体可按当前位置固定",
        title: "固定相邻关节并重新检查脉搏",
        body: "在可行位置固定骨折上下关节，填充空隙并避免压迫止血带、伤口和神经血管结构。",
        details: ["固定前后记录远端脉搏、感觉和运动。", "持续观察肿胀。"],
        capability: "全员",
      },
      {
        id: "pulse-lost",
        label: "固定后远端脉搏减弱或消失",
        title: "立即松解并重新评估固定",
        body: "检查夹板和包扎是否过紧，调整后再次评估远端灌注。",
        details: [
          "不要让固定延误大出血和休克处置。",
          "无法恢复灌注时加快后送。",
        ],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-cpr",
    nextLabel: "进入 TFC 心肺复苏判断",
  },
  {
    slug: "tccc-cpr",
    title: "TFC 心肺复苏判断",
    shortTitle: "TFC CPR",
    stage: "TFC",
    section: "战术野战救治（TFC）第 17 节：心肺复苏（CPR）",
    summary:
      "战场爆炸或穿透伤无脉搏、无呼吸且无其他生命迹象时，常规复苏不会成功；先排除可逆的张力性气胸。",
    prompt: "无脉搏、无呼吸伤员属于哪种情景？",
    scenarios: [
      {
        id: "trauma-arrest",
        label: "爆炸/穿透伤，无脉搏、无呼吸、无生命迹象",
        title: "不实施常规战场 CPR",
        body: "按 2026 TFC 指南，此类伤员的战场复苏不会成功，不应尝试常规 CPR。",
        details: ["遵循任务、分类和医疗指挥原则。", "准确记录判断和时间。"],
        capability: "医护",
      },
      {
        id: "torso",
        label: "躯干伤或多发伤，在 TFC 中无脉搏/呼吸",
        title: "先实施双侧针刺减压",
        body: "在停止救治前实施双侧针刺减压，以排除张力性气胸这一可逆原因。",
        details: ["技术与呼吸章节相同。", "减压后立即重新检查生命迹象。"],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-casualty-communication",
    nextLabel: "进入沟通模块",
  },
  {
    slug: "tccc-casualty-communication",
    title: "伤员与指挥链沟通",
    shortTitle: "沟通",
    stage: "TFC",
    section: "战术野战救治（TFC）第 18 节：沟通",
    summary:
      "持续向伤员解释、安抚并与战术领导和后送系统共享足以支持决策的伤情信息。",
    prompt: "当前需要向谁沟通？",
    scenarios: [
      {
        id: "casualty",
        label: "伤员能够沟通",
        title: "鼓励、安抚并解释处置",
        body: "说明即将进行的处置和后送计划，争取配合并持续观察意识变化。",
        details: ["使用简单、明确的语言。", "将伤员回答纳入复评。"],
        capability: "全员",
      },
      {
        id: "leadership",
        label: "需要协调战术领导与后送资源",
        title: "报告稳定性与后送需求",
        body: "尽早并持续向战术领导报告伤员状态和后送需求，以支持资源和安全决策。",
        details: ["不要泄露不必要信息。", "状态变化时更新优先级。"],
        capability: "全员",
      },
      {
        id: "medical",
        label: "需要向后送或接收医疗人员交接",
        title: "使用 MIST 结构交接",
        body: "报告受伤机制、伤情、生命体征/症状和已完成处置，并补充稳定性与尚未解决的问题。",
        details: ["口头交接必须伴随文书。", "明确最近一次药物和止血带时间。"],
        capability: "医护",
      },
    ],
    nextSlug: "tccc-documentation",
    nextLabel: "进入文书记录",
  },
  {
    slug: "tccc-documentation",
    title: "TCCC 伤员文书",
    shortTitle: "DD 1380",
    stage: "TFC",
    section: "战术野战救治（TFC）第 19 节：救治记录",
    summary:
      "在 DD Form 1380 TCCC Card 记录临床评估、处置和状态变化，并确保文书随伤员进入下一救治层级。",
    prompt: "当前文书缺少哪类关键内容？",
    scenarios: [
      {
        id: "assessment",
        label: "缺少评估和生命体征趋势",
        title: "补齐时间化评估记录",
        body: "记录意识、呼吸、循环、疼痛、神经状态和每次复评变化。",
        details: ["记录应能重建伤员状态随时间的变化。", "避免只写最终状态。"],
        capability: "全员",
      },
      {
        id: "interventions",
        label: "缺少止血、药物或其他处置时间",
        title: "记录处置、剂量、途径和时间",
        body: "特别记录止血带放置/重置/转换、TXA、镇痛、抗菌药、液体和血制品。",
        details: ["止血带本体也应标记时间。", "记录干预后效果。"],
        capability: "全员",
      },
      {
        id: "handoff",
        label: "准备离开当前救治人员",
        title: "将文书固定并随伤员交接",
        body: "把完成的 DD 1380 牢固附于伤员并随伤员转运至下一救治层级。",
        details: ["口头 MIST 不能替代文书。", "交接前确认身份与文书一致。"],
        capability: "全员",
      },
    ],
    nextSlug: "tccc-evac-prep",
    nextLabel: "进入后送准备",
  },
  {
    slug: "tccc-evac-prep",
    title: "后送准备",
    shortTitle: "准备后送",
    stage: "TFC",
    section: "战术野战救治（TFC）第 20 节：后送准备",
    summary:
      "在不停止复评的前提下固定文书、敷料、保温系统和担架带，并按战术程序集结伤员。",
    prompt: "后送前最需要补齐什么？",
    scenarios: [
      {
        id: "medical",
        label: "敷料、止血带或保温系统未固定",
        title: "固定所有医疗装置和松散末端",
        body: "固定绷带、包扎、保温毯和绑带，确保运输振动不会使干预失效。",
        details: ["保持止血带可见并标记。", "持续检查远端灌注和呼吸。"],
        capability: "全员",
      },
      {
        id: "litter",
        label: "需要担架运输或长时间后送",
        title: "正确使用担架固定带并增加衬垫",
        body: "按需要固定担架带；长时间后送考虑增加衬垫并保护压力点。",
        details: ["不得遮挡关键监测和气道。", "再次确认伤员身份和文书。"],
        capability: "全员",
      },
      {
        id: "staging",
        label: "准备在后送点集结",
        title: "按单位程序集结并维持安全",
        body: "向可步行伤员下达指令，按标准程序集结并持续维持后送点安全。",
        details: ["状态恶化时重新排序后送优先级。", "保持与后送系统沟通。"],
        capability: "全员",
      },
    ],
    nextSlug: "tacevac-reassessment",
    nextLabel: "进入 TACEVAC 过渡复评",
  },
  {
    slug: "circulation-course",
    title: "循环系统与战伤复苏课程",
    shortTitle: "循环课程",
    stage: "课程",
    section: "课程补充：TFC 第 6 节与第 8 节",
    summary:
      "把组织灌注、出血控制、血液复苏和 TBI 血压目标连接为可操作的战场循环判断。",
    prompt: "当前最需要理解哪条循环逻辑？",
    scenarios: [
      {
        id: "perfusion",
        label: "意识异常和桡动脉弱，如何判断休克",
        title: "用可获得的灌注指标建立趋势",
        body: "排除脑损伤等替代原因后，意识异常和桡动脉弱/消失支持出血性休克。",
        details: ["寻找并控制出血源。", "复苏后反复检查指标是否改善。"],
      },
      {
        id: "blood",
        label: "为何优先全血和成分血",
        title: "同时恢复携氧、凝血和循环容量",
        body: "血液复苏优先级体现对携氧能力、凝血因子和容量的综合恢复，而非单纯补充晶体液。",
        details: ["遵循获批的血液使用方案。", "同步加温并防止低体温。"],
      },
      {
        id: "tbi",
        label: "TBI 与出血性休克目标冲突",
        title: "先控制出血并避免脑低灌注",
        body: "出血性休克存在时优先按休克复苏；中重度 TBI 仍需维持 SBP >100 mmHg 或正常桡动脉搏动。",
        details: ["避免低氧。", "持续神经状态复评。"],
      },
    ],
    nextSlug: "tccc-iv-txa",
    nextLabel: "进入 IV/IO 与 TXA",
  },
  {
    slug: "tccc-flow-framework",
    title: "TCCC 课程目录",
    shortTitle: "课程目录",
    stage: "课程",
    section: "2026 TCCC 中文交互课程导航",
    summary:
      "根据当前学习目标选择 TFC 主流程、专项处置或 TACEVAC 过渡，不再使用旧版滚动式双语框架。",
    prompt: "你准备训练哪个阶段？",
    scenarios: [
      {
        id: "march",
        label: "从 MARCH 主流程开始",
        title: "按优先级完成 TFC 主流程",
        body: "从大出血、气道、呼吸、循环和低体温开始，再进入 TBI、药物、伤口和后送准备。",
        details: ["每个模块均有复评回路。", "项目首页提供全部独立入口。"],
        capability: "全员",
      },
      {
        id: "advanced",
        label: "训练专项医疗处置",
        title: "选择循环、TBI、镇痛或伤口模块",
        body: "专项模块按人员能力等级区分基础操作、医护操作和专业侵入性操作。",
        details: ["训练材料不替代授权和认证。", "优先使用当前指南原文。"],
      },
      {
        id: "evac",
        label: "训练后送过渡与交接",
        title: "进入 TACEVAC 过渡课程",
        body: "复评全部伤情和既有干预，完成平台固定、持续监测和 MIST/文书交接。",
        details: [
          "完整 TACEVAC 指南由 CoERCCC 单独管理。",
          "本项目明确显示这一边界。",
        ],
      },
    ],
    nextSlug: "tccc-standard",
    nextLabel: "进入标准流程",
    activeMenuItemId: "course",
  },
  {
    slug: "tacevac-reassessment",
    title: "TACEVAC 过渡复评",
    shortTitle: "后送复评",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：救治过渡",
    summary:
      "接收伤员后重新评估全部伤情和既有干预，确认运输平台固定与当前稳定性。",
    prompt: "交接后首先发现什么问题？",
    scenarios: [
      {
        id: "unstable",
        label: "伤员不稳定或生命体征恶化",
        title: "立即重新开始 MARCH",
        body: "从大出血、气道、呼吸和循环重新评估，不依赖上一救治人员的最后结论。",
        details: ["确认止血带、胸封、气道和通路。", "更新后送优先级。"],
      },
      {
        id: "intervention",
        label: "既有干预可能松脱或失效",
        title: "逐项验证干预效果",
        body: "检查所有伤口、止血带、夹板、骨盆绑带、保温和监测装置。",
        details: ["记录重新评估结果。", "运输后再次检查。"],
      },
      {
        id: "stable",
        label: "当前稳定，准备装载",
        title: "完成平台固定和持续监测",
        body: "按平台要求固定伤员，确保气道可接近、监测可见、文书随伤员。",
        details: [
          "交接至少包含稳定性、伤情和处置。",
          "持续复评，不因装载结束停止观察。",
        ],
      },
    ],
    nextSlug: "tacevac-airway",
    nextLabel: "进入后送气道复评",
    activeMenuItemId: "tacevac",
  },
  {
    slug: "tacevac-airway",
    title: "TACEVAC 气道复评",
    shortTitle: "后送气道",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：气道管理",
    summary:
      "运输振动、体位和伤情变化可使气道再次恶化；经过训练时可考虑气管插管替代环甲膜切开。",
    prompt: "运输中气道出现什么变化？",
    scenarios: [
      {
        id: "patent",
        label: "气道通畅且自主呼吸稳定",
        title: "维持体位并连续监测",
        body: "保持最能保护气道的体位，连续观察 SpO₂、EtCO₂ 和气道通畅度。",
        details: ["固定气道装置。", "每次移动后重新检查。"],
      },
      {
        id: "deteriorating",
        label: "气道恶化或既有装置失效",
        title: "重新开放气道并准备确定性气道",
        body: "按 TFC 气道步骤重新处置；具备训练和授权时可考虑气管插管。",
        details: [
          "用连续 EtCO₂ 确认位置。",
          "无法控制创伤性阻塞时按外科气道路径。",
        ],
        capability: "专业人员",
      },
    ],
    nextSlug: "tacevac-breathing",
    nextLabel: "进入后送呼吸管理",
  },
  {
    slug: "tacevac-breathing",
    title: "TACEVAC 呼吸与氧合",
    shortTitle: "后送呼吸",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：呼吸管理",
    summary:
      "运输中继续处理胸部伤并按适应证使用氧气；中重度 TBI 维持 SpO₂ ≥92%。",
    prompt: "伤员是否需要补充氧或再次胸部干预？",
    scenarios: [
      {
        id: "oxygen",
        label: "低血氧、氧合受损、无意识、TBI、休克、高海拔或烟雾吸入",
        title: "按适应证给予补充氧",
        body: "上述情景可从补充氧获益；中重度 TBI 维持 SpO₂ ≥92%。",
        details: ["大多数战伤伤员不需要常规吸氧。", "结合临床表现解释 SpO₂。"],
      },
      {
        id: "recurrent-tension",
        label: "运输中再次呼吸窘迫、低氧或低血压",
        title: "重新评估张力性气胸",
        body: "检查胸封和既有减压效果，按呼吸章节处理复发或未控制的张力性气胸。",
        details: ["检查双侧胸部。", "不要把所有低血压都归因于出血。"],
      },
    ],
    nextSlug: "tacevac-tbi",
    nextLabel: "进入后送 TBI 管理",
  },
  {
    slug: "tacevac-tbi",
    title: "TACEVAC 中重度 TBI",
    shortTitle: "后送 TBI",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：中重度 TBI",
    summary:
      "TACEVAC 阶段继续执行与 TFC 相同的中重度 TBI 原则，并密切观察运输中的神经恶化。",
    prompt: "运输中 TBI 伤员出现什么情况？",
    scenarios: [
      {
        id: "stable",
        label: "氧合、血压和神经状态稳定",
        title: "维持目标并每 5–10 分钟复评",
        body: "保持 SpO₂ ≥92%、SBP >100 mmHg 或正常桡动脉搏动，并每 5–10 分钟复评神经状态。",
        details: ["有 EtCO₂ 时维持 35–45 mmHg。", "保持头部正中。"],
      },
      {
        id: "herniation",
        label: "出现瞳孔变化或异常姿势",
        title: "按脑疝路径处理并加速后送",
        body: "按 TFC 高渗盐水方案处理，持续通气、氧合和循环监测，并尽快到达神经外科能力。",
        details: ["不得预防性使用高渗盐水。", "记录每次神经检查和给药。"],
        capability: "专业人员",
      },
    ],
    nextSlug: "tacevac-shock-fluid",
    nextLabel: "进入后送循环复评",
  },
  {
    slug: "tacevac-shock-fluid",
    title: "TACEVAC 休克复评",
    shortTitle: "后送休克",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：持续循环管理",
    summary:
      "运输中反复检查休克、出血控制和血液复苏反应，防止振动、移动和时间导致再次出血。",
    prompt: "运输中循环状态如何变化？",
    scenarios: [
      {
        id: "improving",
        label: "意识和桡动脉搏动改善",
        title: "维持复苏终点并避免过度补液",
        body: "继续监测并按协议维持血液复苏，不以正常化所有数值为目标。",
        details: ["持续加温。", "再次检查所有止血措施。"],
      },
      {
        id: "recurrent",
        label: "休克复发或对复苏无反应",
        title: "寻找再次出血和张力性气胸",
        body: "复查止血带、伤口和隐匿出血，同时重新评估未处理或复发的张力性气胸。",
        details: ["按血制品优先级继续复苏。", "更新接收机构。"],
      },
    ],
    nextSlug: "tacevac-iv-txa",
    nextLabel: "进入后送通路与 TXA 复核",
  },
  {
    slug: "tacevac-iv-txa",
    title: "TACEVAC 通路与 TXA 复核",
    shortTitle: "后送 IV/TXA",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：持续用药与血管通路管理",
    summary:
      "确认 IV/IO 通路仍可用、TXA 适应证和时间窗已正确执行，并把给药信息传递给接收方。",
    prompt: "通路或 TXA 记录存在什么问题？",
    scenarios: [
      {
        id: "access",
        label: "通路渗漏、松脱或无法使用",
        title: "重新建立可靠通路",
        body: "检查固定、回流和输注部位；需要但无法快速获得 IV 时使用 IO。",
        details: ["运输后再次检查。", "记录新通路位置和时间。"],
      },
      {
        id: "txa-missing",
        label: "符合 TXA 适应证且仍在受伤后 3 小时内",
        title: "确认并补齐 TXA",
        body: "若尚未给予，按 2 g IV/IO 缓慢推注方案执行；超过 3 小时不得补给。",
        details: ["确认既往是否已给药，避免重复。", "完整交接剂量和时间。"],
      },
    ],
    nextSlug: "tacevac-pelvic-binder",
    nextLabel: "进入骨盆绑带复核",
  },
  {
    slug: "tacevac-pelvic-binder",
    title: "TACEVAC 骨盆绑带复核",
    shortTitle: "后送骨盆",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：骨盆稳定复评",
    summary: "确认骨盆绑带位置、固定和下肢灌注，避免装载和运输使绑带移位。",
    prompt: "骨盆绑带当前状态如何？",
    scenarios: [
      {
        id: "correct",
        label: "位于大转子水平且固定可靠",
        title: "保持固定并持续检查灌注",
        body: "确认绑带未上移，检查下肢脉搏、感觉和皮肤表现。",
        details: ["不要为重复查体频繁松开。", "继续休克复评。"],
      },
      {
        id: "malposition",
        label: "位置过高、松动或运输后移位",
        title: "重新调整至大转子水平",
        body: "按器材说明重新定位和收紧，随后再次检查下肢灌注。",
        details: ["记录调整。", "避免因调整延误不稳定伤员后送。"],
      },
    ],
    nextSlug: "tacevac-pain-management",
    nextLabel: "进入后送镇痛复评",
  },
  {
    slug: "tacevac-pain-management",
    title: "TACEVAC 镇痛复评",
    shortTitle: "后送镇痛",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：持续镇痛监测",
    summary:
      "运输中重新评估疼痛、气道、呼吸和意识，延续 2026 镇痛方案而不造成多药联用风险。",
    prompt: "镇痛后伤员表现如何？",
    scenarios: [
      {
        id: "controlled",
        label: "疼痛可耐受，气道和意识稳定",
        title: "维持并记录疗效",
        body: "继续按给药间隔观察，不为追求完全无痛追加不必要药物。",
        details: ["监测气道、呼吸和循环。", "交接最近剂量和时间。"],
      },
      {
        id: "inadequate",
        label: "疼痛仍不可耐受但生命体征稳定",
        title: "按 2026 方案评估重复剂量",
        body: "按 Ketamine/Esketamine 路径和时间间隔处理，避免 benzodiazepine 联用。",
        details: ["重新记录 AVPU。", "排除伤情恶化造成的新疼痛。"],
      },
      {
        id: "depressed",
        label: "呼吸减少或意识恶化",
        title: "停止追加并支持气道通气",
        body: "调整至嗅探位；无效时提供通气支持，并重新评估 TBI、休克和药物影响。",
        details: ["持续 SpO₂/EtCO₂。", "通知接收方。"],
      },
    ],
    nextSlug: "tacevac-hypothermia",
    nextLabel: "进入后送保温与眼伤复核",
  },
  {
    slug: "tacevac-hypothermia",
    title: "TACEVAC 保温与眼伤复核",
    shortTitle: "后送保温/眼伤",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：低体温与眼部保护复评",
    summary:
      "运输平台继续强化保温，并确认穿透性眼外伤的硬质眼罩、视力记录和 2026 抗菌药方案。",
    prompt: "运输中最需要纠正哪项护理？",
    scenarios: [
      {
        id: "heat-loss",
        label: "保温系统松散、受潮或暴露风雨",
        title: "升级并重新密闭保温系统",
        body: "恢复隔热、主动加温和防水外层，平台上持续防风防雨。",
        details: ["检查热源不直接接触皮肤。", "加温输注液体。"],
      },
      {
        id: "eye-shield",
        label: "眼罩移位或使用了压力敷料",
        title: "改用硬质眼罩并避免眼球受压",
        body: "恢复硬质眼罩保护，确认视力测试已记录，并按 2026 方案确认 Cefadroxil 或 Ceftriaxone。",
        details: ["不要拔除异物。", "加速眼科/外科后送。"],
      },
    ],
    nextSlug: "tacevac-cpr",
    nextLabel: "进入 TACEVAC CPR 判断",
  },
  {
    slug: "tacevac-cpr",
    title: "TACEVAC 心肺复苏判断",
    shortTitle: "后送 CPR",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：心肺复苏（CPR）",
    summary:
      "TACEVAC 阶段的 CPR 判断不同于 TFC：先双侧减压，在特定近距离外科后送条件下才可考虑 CPR。",
    prompt: "无脉搏、无呼吸伤员是否符合 TACEVAC CPR 条件？",
    scenarios: [
      {
        id: "decompress",
        label: "躯干伤/多发伤，尚未完成双侧减压",
        title: "先实施双侧针刺减压",
        body: "先排除张力性气胸，随后立即检查生命迹象是否恢复。",
        details: ["技术与呼吸章节一致。", "记录时间和反应。"],
      },
      {
        id: "consider-cpr",
        label: "无明显致命伤，短时间内将到达外科能力",
        title: "可考虑 CPR",
        body: "仅在不损害任务、不剥夺其他伤员救命资源的前提下考虑 CPR。",
        details: ["持续评估资源和后送时间。", "与接收外科能力沟通。"],
        capability: "医护",
      },
      {
        id: "not-appropriate",
        label: "明显致命伤、无法快速到达外科或会危及任务/其他伤员",
        title: "不实施 CPR",
        body: "遵循分类、任务和医疗指挥原则，把有限资源用于可获益伤员。",
        details: ["完成记录。", "保持团队沟通。"],
      },
    ],
    nextSlug: "tacevac-handoff",
    nextLabel: "进入护理交接",
  },
  {
    slug: "tacevac-handoff",
    title: "TACEVAC 护理交接",
    shortTitle: "后送交接",
    stage: "TACEVAC",
    section: "战术后送救治（TACEVAC）：过渡与沟通",
    summary:
      "向下一救治层级交接稳定性、伤情和处置，并确保完整文书与伤员一同转移。",
    prompt: "交接还缺少什么？",
    scenarios: [
      {
        id: "verbal",
        label: "尚未完成结构化口头交接",
        title: "使用 MIST 完成口头交接",
        body: "报告受伤机制、伤情、生命体征/症状和处置，先说明伤员稳定或不稳定。",
        details: ["指出未解决问题。", "说明最近药物和止血带时间。"],
      },
      {
        id: "documents",
        label: "文书不完整或未随伤员固定",
        title: "补齐并固定伤员文书",
        body: "确认 DD 1380 等适用文书完整、身份一致并牢固随伤员转移。",
        details: ["口头交接不替代文书。", "接收方确认收到。"],
      },
      {
        id: "transfer",
        label: "准备完成平台或机构间转移",
        title: "共同复核装置和责任转移",
        body: "交接双方共同确认气道、止血、通路、夹板、保温和监测，明确责任已转移。",
        details: ["转移后再次评估。", "不要在无人负责时中断监测。"],
      },
    ],
    nextSlug: "tccc-flow-framework",
    nextLabel: "返回课程目录",
  },
];

const airwayModule: TcccModuleEntry = {
  slug: "tfc-airway",
  title: "TFC 气道管理",
  shortTitle: "气道",
  stage: "TFC",
  section: "战术野战救治（TFC）第 4 节：气道管理",
  summary: "根据伤员意识、气道通畅情况和创伤表现选择处置路径。",
  prompt: "伤员当前气道状态如何？",
  scenarios: [],
  nextSlug: "tccc-breathing",
  nextLabel: "进入呼吸管理",
  activeBottomItemId: "tfc",
  activeMenuItemId: "airway",
  flow: airwayFlowData as TcccFlowDefinition,
};

export const tcccModules: TcccModuleEntry[] = [
  ...moduleSpecs.map((spec) => ({
    ...spec,
    activeBottomItemId: stageBottomItem(spec.stage, spec.slug),
    activeMenuItemId: spec.activeMenuItemId ?? menuItemBySlug[spec.slug],
    flow: createFlow(spec),
  })),
  airwayModule,
];

export const tcccModuleBySlug = new Map(
  tcccModules.map((module) => [module.slug, module]),
);

export const tcccModuleGroups = [
  {
    id: "core",
    title: "三阶段与 MARCH 主流程",
    slugs: [
      "cuf-threat-care",
      "tccc-standard",
      "tfc-hemorrhage",
      "tfc-airway",
      "tccc-breathing",
      "tccc-shock-fluid",
      "tccc-hypothermia",
    ],
  },
  {
    id: "extended",
    title: "TFC 专项处置",
    slugs: [
      "tccc-iv-txa",
      "tccc-pelvic-binder",
      "tccc-tbi",
      "tccc-eye-trauma",
      "tccc-monitoring",
      "tccc-pain-management",
      "tccc-antibiotics",
      "tccc-wound-care",
      "tccc-burns",
      "tccc-splints",
      "tccc-cpr",
      "tccc-casualty-communication",
      "tccc-documentation",
      "tccc-evac-prep",
    ],
  },
  {
    id: "evac",
    title: "TACEVAC 过渡与持续复评",
    slugs: [
      "tacevac-reassessment",
      "tacevac-airway",
      "tacevac-breathing",
      "tacevac-tbi",
      "tacevac-shock-fluid",
      "tacevac-iv-txa",
      "tacevac-pelvic-binder",
      "tacevac-pain-management",
      "tacevac-hypothermia",
      "tacevac-cpr",
      "tacevac-handoff",
    ],
  },
  {
    id: "course",
    title: "课程与框架",
    slugs: ["circulation-course", "tccc-flow-framework"],
  },
] as const;
