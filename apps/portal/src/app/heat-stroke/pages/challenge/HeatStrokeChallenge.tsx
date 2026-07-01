"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type ModuleId = "intro" | "prevention" | "warning" | "treatment" | "quiz";
type AchievementType =
  | "training"
  | "prevention"
  | "treatment"
  | "quiz"
  | "streak"
  | "perfect";

type UserData = {
  xp: number;
  badges: number;
  completion: number;
  preventionProgress: number;
  treatmentProgress: number;
  achievements: AchievementType[];
  completedLessons: ModuleId[];
  lastVisit: string | null;
  streak: number;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type Reward = {
  title: string;
  description: string;
  icon: string;
} | null;

const storageKey = "heatStrokeWarrior";

const moduleLabels: Array<{ id: ModuleId; label: string }> = [
  { id: "intro", label: "热射病简介" },
  { id: "prevention", label: "预防措施" },
  { id: "warning", label: "预警信号" },
  { id: "treatment", label: "救治方法" },
  { id: "quiz", label: "综合测验" },
];

const achievementsConfig: Record<
  AchievementType,
  { icon: string; title: string; description: string }
> = {
  training: {
    icon: "火",
    title: "热习服新星",
    description: "完成热习服基础学习与测验",
  },
  prevention: {
    icon: "盾",
    title: "预防专家",
    description: "掌握热射病预防关键措施",
  },
  treatment: {
    icon: "救",
    title: "救治能手",
    description: "掌握热射病紧急救治方法",
  },
  quiz: {
    icon: "测",
    title: "测验达人",
    description: "成功通过综合测验",
  },
  streak: {
    icon: "勤",
    title: "持之以恒",
    description: "连续学习3天",
  },
  perfect: {
    icon: "满",
    title: "满分学霸",
    description: "以满分通过综合测验",
  },
};

const initialUserData: UserData = {
  xp: 0,
  badges: 0,
  completion: 0,
  preventionProgress: 0,
  treatmentProgress: 0,
  achievements: [],
  completedLessons: [],
  lastVisit: null,
  streak: 0,
};

const preventionCategories = [
  { id: "training", label: "训练相关措施" },
  { id: "health", label: "健康相关措施" },
  { id: "equipment", label: "装备/其他措施" },
] as const;

const preventionItems = [
  { id: "heat-adaptation", text: "做好热习服训练", category: "training" },
  { id: "no-ill-training", text: "不提倡带病参训", category: "health" },
  { id: "cooling-breaks", text: "重视训练间隙的降温", category: "training" },
  { id: "water-salt", text: "补水补盐", category: "health" },
  {
    id: "monitoring-tools",
    text: '备齐防暑监测"三宝"',
    category: "equipment",
  },
  { id: "cooling-equipment", text: "准备降温设备", category: "equipment" },
  { id: "sleep", text: "保证充足睡眠", category: "health" },
  { id: "key-groups", text: "关注重点人群", category: "training" },
];

const treatmentSteps = [
  { id: "leave-heat", text: "立即脱离热环境", order: 1 },
  { id: "cooling", text: "用水、冰进行全身降温", order: 2 },
  { id: "vitals", text: "测量核心体温、心率、血压", order: 3 },
  { id: "iv", text: "建立静脉输液通道", order: 4 },
  { id: "airway", text: "气道保护与氧疗", order: 5 },
  { id: "seizure", text: "控制抽搐", order: 6 },
];

const introScenarioOptions = [
  {
    text: "坚持训练，这只是正常的训练反应，需要克服",
    correct: false,
  },
  {
    text: "立即停止训练，到阴凉处休息，并向教官报告身体状况",
    correct: true,
  },
  {
    text: "喝一些水继续训练，稍后会好起来",
    correct: false,
  },
];

const warningSignals = [
  {
    id: "hot",
    signal: "烫",
    text: "小王在训练中感觉自己体温异常升高，感觉身体内部在发热",
  },
  {
    id: "shake",
    signal: "晃",
    text: "小李完成5公里跑后，走路摇摇晃晃，比平时疲劳感更强",
  },
  {
    id: "dizzy",
    signal: "晕",
    text: "小张在训练中突然感到头晕目眩，意识开始模糊",
  },
  {
    id: "disorder",
    signal: "乱",
    text: "小陈训练后脸色苍白，出现心慌、恶心想吐的症状",
  },
];

const preventionQuiz: QuizQuestion = {
  id: "prevention-basic",
  prompt: "热习服训练一般需要多长时间？",
  options: ["3-5天", "10-14天", "20-30天", "1-2个月"],
  correctIndex: 1,
};

const treatmentQuiz: QuizQuestion = {
  id: "treatment-basic",
  prompt: "热射病患者应在多长时间内将体温降至38.5摄氏度？",
  options: ["30分钟内", "1小时内", "2小时内", "4小时内"],
  correctIndex: 1,
};

const finalQuiz: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "1. 热射病的定义是什么？",
    options: [
      "轻度中暑的一种表现形式",
      "人体长时间暴露在高温、高湿环境下，引起体温调节功能失调的危及生命的临床综合征",
      "仅在夏季出现的季节性疾病",
      "只有老年人才会发生的疾病",
    ],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "2. 热习服训练的适应过程一般需要多长时间？",
    options: ["3-5天", "10-14天", "1个月", "2-3个月"],
    correctIndex: 1,
  },
  {
    id: "q3",
    prompt: "3. 以下哪项不是热射病的预警信号？",
    options: [
      "烫：自觉身体发烫",
      "晃：异常疲倦、行走不稳",
      "晕：头晕、意识模糊",
      "痒：皮肤瘙痒难忍",
    ],
    correctIndex: 3,
  },
  {
    id: "q4",
    prompt: "4. 热射病救治的第一步是什么？",
    options: [
      "立即脱离热环境",
      "建立静脉输液通道",
      "测量核心体温",
      "立即后送医院",
    ],
    correctIndex: 0,
  },
  {
    id: "q5",
    prompt: "5. 热射病患者应在多长时间内将体温降至38.5摄氏度？",
    options: ["30分钟内", "1小时内", "2小时内", "不需要特别控制时间"],
    correctIndex: 1,
  },
  {
    id: "q6",
    prompt: '6. 防暑监测"三宝"不包括以下哪项？',
    options: ["温湿度计", "耳温监测仪", "指脉氧检测仪", "血糖监测仪"],
    correctIndex: 3,
  },
  {
    id: "q7",
    prompt: "7. 以下哪些人群属于热射病高风险人群？",
    options: [
      "经常在高温环境下训练的人员",
      "新训人和长期不锻炼人员",
      "已完成热习服训练的人员",
      "体重正常的年轻人",
    ],
    correctIndex: 1,
  },
  {
    id: "q8",
    prompt: "8. 训练中如果心率大于多少，且持续不降，应终止训练？",
    options: ["120次/分", "140次/分", "150次/分", "180次/分"],
    correctIndex: 2,
  },
  {
    id: "q9",
    prompt: "9. 热射病患者如果出现抽搐，应该如何处理？",
    options: [
      "立即后送医院，不做任何处理",
      "用力按压患者的大关节处制止抽搐",
      "给予安定注射液，并监测呼吸情况",
      "让患者喝水，补充体液",
    ],
    correctIndex: 2,
  },
  {
    id: "q10",
    prompt: "10. 以下哪项不是热射病救治的正确做法？",
    options: [
      "将患者除头部外的身体浸泡在20摄氏度左右的水中",
      "用冰块放置在患者双腋下、大腿根部位",
      "立即后送医院，不进行任何现场降温",
      "昏迷患者将头部偏向一侧，防止窒息",
    ],
    correctIndex: 2,
  },
  {
    id: "q11",
    prompt: "11. 以下哪项是判断热习服达标的简单方法？",
    options: [
      "相同强度训练下，自觉不适减轻、心率增快不明显、体温上升幅度不高",
      "训练后体重减轻超过2%",
      "完全不出汗",
      "运动中心率始终低于100次/分",
    ],
    correctIndex: 0,
  },
  {
    id: "q12",
    prompt: "12. 为什么不提倡带病（如感冒、发烧、腹泻）参加高温训练？",
    options: [
      "会传染给其他战友",
      "生病时身体抵抗力下降，更容易发生中暑或热射病",
      "会影响训练成绩",
      "带病训练是意志力的体现",
    ],
    correctIndex: 1,
  },
  {
    id: "q13",
    prompt: "13. 如何通过尿液颜色判断补水是否足够？",
    options: [
      "尿量充足且颜色呈浅黄色或无色，表明补水足够",
      "尿液颜色越深黄越好，表明身体浓缩能力强",
      "只要不感到口渴就说明补水足够",
      "尿液颜色与补水无关",
    ],
    correctIndex: 0,
  },
  {
    id: "q14",
    prompt: "14. 保证充足睡眠对预防热射病有什么作用？",
    options: [
      "有助于身体恢复，提高对热环境的耐受力",
      "睡眠与热射病无关",
      "睡得越多越容易中暑",
      "可以减少白天的出汗量",
    ],
    correctIndex: 0,
  },
  {
    id: "q15",
    prompt: "15. 对于突发抽搐的热射病患者，应首选以下哪种药物控制？",
    options: ["退烧药", "安定（地西泮）注射液", "抗生素", "生理盐水"],
    correctIndex: 1,
  },
];

function normalizeUserData(value: Partial<UserData> | null): UserData {
  const achievements = Array.isArray(value?.achievements)
    ? value.achievements.filter((item): item is AchievementType =>
        Object.keys(achievementsConfig).includes(item),
      )
    : [];
  const completedLessons = Array.isArray(value?.completedLessons)
    ? value.completedLessons.filter((item): item is ModuleId =>
        moduleLabels.some((module) => module.id === item),
      )
    : [];

  return recomputeProgress({
    ...initialUserData,
    ...value,
    achievements,
    badges: achievements.length,
    completedLessons,
  });
}

function recomputeProgress(data: UserData): UserData {
  const coreModules: ModuleId[] = ["prevention", "warning", "treatment"];
  const completedCoreModules = coreModules.filter((id) =>
    data.completedLessons.includes(id),
  ).length;
  const completion = Math.round(
    (completedCoreModules / coreModules.length) * 100,
  );

  return {
    ...data,
    badges: data.achievements.length,
    completion,
    preventionProgress: data.completedLessons.includes("prevention") ? 100 : 0,
    treatmentProgress: data.completedLessons.includes("treatment") ? 100 : 0,
  };
}

function applyVisitStreak(data: UserData): UserData {
  const today = new Date().toDateString();
  if (data.lastVisit === today) return data;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const nextStreak =
    data.lastVisit === yesterday.toDateString() ? data.streak + 1 : 1;
  const achievements = [...data.achievements];
  if (nextStreak >= 3 && !achievements.includes("streak")) {
    achievements.push("streak");
  }

  return recomputeProgress({
    ...data,
    achievements,
    lastVisit: today,
    streak: nextStreak,
  });
}

function getFinalQuizResult(answers: Record<string, number>) {
  const correctCount = finalQuiz.filter(
    (question) => answers[question.id] === question.correctIndex,
  ).length;
  const total = finalQuiz.length;
  const score = Math.round((correctCount / total) * 100);
  return { correctCount, total, score };
}

function selectButtonClass(
  selected: boolean,
  correct?: boolean,
  incorrect?: boolean,
) {
  if (correct) {
    return "border-emerald-500 bg-emerald-500 text-white";
  }
  if (incorrect) {
    return "border-red-500 bg-red-500 text-white";
  }
  if (selected) {
    return "border-primary bg-primary text-primary-foreground";
  }
  return "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground";
}

export function HeatStrokeChallenge() {
  const [activeModule, setActiveModule] = useState<ModuleId>("intro");
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [reward, setReward] = useState<Reward>(null);
  const [introAnswer, setIntroAnswer] = useState<number | null>(null);
  const [identifiedSignals, setIdentifiedSignals] = useState<string[]>([]);
  const [preventionAssignments, setPreventionAssignments] = useState<
    Record<string, string>
  >({});
  const [preventionChecked, setPreventionChecked] = useState(false);
  const [preventionRewarded, setPreventionRewarded] = useState(false);
  const [treatmentAssignments, setTreatmentAssignments] = useState<
    Record<string, number>
  >({});
  const [treatmentChecked, setTreatmentChecked] = useState(false);
  const [treatmentRewarded, setTreatmentRewarded] = useState(false);
  const [singleQuizAnswers, setSingleQuizAnswers] = useState<
    Record<string, number>
  >({});
  const [submittedSingleQuizzes, setSubmittedSingleQuizzes] = useState<
    string[]
  >([]);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [finalValidation, setFinalValidation] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as Partial<UserData>) : null;
      setUserData(applyVisitStreak(normalizeUserData(parsed)));
    } catch {
      window.localStorage.removeItem(storageKey);
      setUserData(applyVisitStreak(initialUserData));
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(userData));
    } catch {
      // Local storage can fail in restricted contexts; gameplay still works.
    }
  }, [userData]);

  const finalResult = useMemo(
    () => (finalSubmitted ? getFinalQuizResult(finalAnswers) : null),
    [finalAnswers, finalSubmitted],
  );
  const allPreventionCorrect =
    preventionItems.every(
      (item) => preventionAssignments[item.id] === item.category,
    ) && preventionItems.every((item) => preventionAssignments[item.id]);
  const allTreatmentCorrect =
    treatmentSteps.every(
      (step) => treatmentAssignments[step.id] === step.order,
    ) && treatmentSteps.every((step) => treatmentAssignments[step.id]);

  function updateUserData(updater: (current: UserData) => UserData) {
    setUserData((current) => recomputeProgress(updater(current)));
  }

  function addXP(amount: number) {
    if (amount <= 0) return;
    updateUserData((current) => ({ ...current, xp: current.xp + amount }));
  }

  function unlockAchievement(type: AchievementType) {
    if (userData.achievements.includes(type)) return;
    const config = achievementsConfig[type];
    updateUserData((current) => {
      if (current.achievements.includes(type)) return current;
      return {
        ...current,
        achievements: [...current.achievements, type],
      };
    });
    setReward(config);
  }

  function completeLesson(moduleId: ModuleId) {
    if (userData.completedLessons.includes(moduleId)) return;
    updateUserData((current) => ({
      ...current,
      xp: current.xp + 30,
      completedLessons: [...current.completedLessons, moduleId],
    }));
  }

  function goToModule(moduleId: ModuleId) {
    setActiveModule(moduleId);
    window.setTimeout(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      20,
    );
  }

  function goNext(current: ModuleId, next: ModuleId) {
    completeLesson(current);
    if (current === "prevention") unlockAchievement("prevention");
    if (current === "treatment") unlockAchievement("treatment");
    goToModule(next);
  }

  function handleIntroAnswer(index: number) {
    if (introAnswer !== null) return;
    setIntroAnswer(index);
    if (introScenarioOptions[index]?.correct) addXP(50);
  }

  function handleSignal(id: string) {
    if (identifiedSignals.includes(id)) return;
    const next = [...identifiedSignals, id];
    setIdentifiedSignals(next);
    addXP(25);
    if (next.length === warningSignals.length) addXP(50);
  }

  function submitSingleQuiz(
    question: QuizQuestion,
    achievement?: AchievementType,
  ) {
    if (submittedSingleQuizzes.includes(question.id)) return;
    const answer = singleQuizAnswers[question.id];
    if (answer === undefined) {
      setFinalValidation("请先回答问题！");
      return;
    }
    setFinalValidation("");
    setSubmittedSingleQuizzes((current) => [...current, question.id]);
    if (answer === question.correctIndex) {
      addXP(30);
      if (achievement) unlockAchievement(achievement);
    }
  }

  function submitFinalQuiz() {
    const answeredCount = finalQuiz.filter(
      (question) => finalAnswers[question.id] !== undefined,
    ).length;
    if (answeredCount !== finalQuiz.length) {
      setFinalValidation("请回答所有问题后再提交！未回答的问题已用红框标出。");
      return;
    }

    const result = getFinalQuizResult(finalAnswers);
    setFinalValidation("");
    setFinalSubmitted(true);
    addXP(result.score * 2);
    if (result.score === 100) {
      unlockAchievement("perfect");
      unlockAchievement("quiz");
    } else if (result.score >= 80) {
      unlockAchievement("quiz");
    }
  }

  function resetChallenge() {
    setIntroAnswer(null);
    setIdentifiedSignals([]);
    setPreventionAssignments({});
    setPreventionChecked(false);
    setPreventionRewarded(false);
    setTreatmentAssignments({});
    setTreatmentChecked(false);
    setTreatmentRewarded(false);
    setSingleQuizAnswers({});
    setSubmittedSingleQuizzes([]);
    setFinalAnswers({});
    setFinalSubmitted(false);
    setFinalValidation("");
    goToModule("intro");
  }

  return (
    <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-10 md:py-14">
      <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs font-black uppercase text-muted-foreground">
            Warrior Progress
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight">通关进度</h2>

          <div className="mt-5 grid grid-cols-3 border-2 border-border bg-background text-center">
            <Stat value={userData.xp} label="经验值" />
            <Stat value={userData.badges} label="徽章" />
            <Stat value={`${userData.completion}%`} label="完成度" last />
          </div>

          <div className="mt-5 grid gap-4">
            <Progress label="总体进度" value={userData.completion} />
            <Progress label="预防措施" value={userData.preventionProgress} />
            <Progress label="救治方法" value={userData.treatmentProgress} />
          </div>

          <div className="mt-6 rounded border-2 border-primary bg-primary p-4 text-primary-foreground">
            <p className="font-black">每日挑战</p>
            <p className="mt-1 text-sm font-bold opacity-90">
              完成热射病预防措施测验
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded bg-primary-foreground/30">
              <div
                className="h-full rounded bg-primary-foreground"
                style={{ width: `${userData.completion}%` }}
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="font-black">成就徽章</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(achievementsConfig) as AchievementType[]).map(
                (type) => {
                  const unlocked = userData.achievements.includes(type);
                  const achievement = achievementsConfig[type];
                  return (
                    <button
                      className={`rounded border-2 p-3 text-center transition ${
                        unlocked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                      key={type}
                      title={achievement.description}
                      type="button"
                    >
                      <span className="block text-xl font-black">
                        {achievement.icon}
                      </span>
                      <span className="mt-1 block text-[11px] font-black leading-tight">
                        {achievement.title}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </aside>

        <div className="rounded border-2 border-border bg-card p-4 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] md:p-6">
          <nav
            aria-label="通关挑战模块"
            className="mb-6 flex gap-2 overflow-x-auto border-b-2 border-border pb-3"
          >
            {moduleLabels.map((module) => (
              <button
                className={`min-h-11 flex-none rounded border-2 px-4 text-sm font-black transition ${
                  activeModule === module.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
                key={module.id}
                onClick={() => goToModule(module.id)}
                type="button"
              >
                {module.label}
              </button>
            ))}
          </nav>

          <div className="grid gap-5">
            <LessonFrame
              active={activeModule === "intro"}
              description="了解热射病的定义、危害及其重要性"
              id="intro"
              title="热射病简介"
            >
              <ContentBlock title="什么是热射病？">
                <p>
                  热射病（重度中暑）是指人体长时间暴露在高温、高湿环境下，或进行高强度运动时，引起体温调节功能失调、体内热量过度积蓄，从而导致中枢神经系统损害、多器官功能障碍或严重凝血功能障碍等危及生命的临床综合征。
                </p>
              </ContentBlock>

              <div className="rounded border-2 border-border bg-background p-4">
                <h3 className="text-xl font-black">情景模拟</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-muted-foreground">
                  你是一名新训人员，正在参加夏季高温下的野外训练。今天气温高达38℃，湿度很大。训练已经持续了2小时，你开始感到头晕、恶心，并且出汗减少。你应该怎么做？
                </p>
                <div className="mt-4 grid gap-2">
                  {introScenarioOptions.map((option, index) => {
                    const selected = introAnswer === index;
                    const shouldMark =
                      introAnswer !== null && (selected || option.correct);
                    return (
                      <button
                        className={`rounded border-2 px-4 py-3 text-left text-sm font-bold leading-6 transition ${selectButtonClass(
                          selected,
                          shouldMark && option.correct,
                          shouldMark && selected && !option.correct,
                        )}`}
                        disabled={introAnswer !== null}
                        key={option.text}
                        onClick={() => handleIntroAnswer(index)}
                        type="button"
                      >
                        {option.text}
                      </button>
                    );
                  })}
                </div>
                {introAnswer !== null ? (
                  <Feedback
                    ok={introScenarioOptions[introAnswer]?.correct}
                    text={
                      introScenarioOptions[introAnswer]?.correct
                        ? "正确！当出现头晕、恶心和出汗减少等症状时，应立即停止训练，到阴凉处休息，并向教官报告身体状况。"
                        : "不正确。当出现这些症状时，继续训练可能导致热射病，应立即停止训练并寻求帮助。"
                    }
                  />
                ) : null}
              </div>

              <LessonNav
                nextLabel="下一关"
                onNext={() => goNext("intro", "prevention")}
              />
            </LessonFrame>

            <LessonFrame
              active={activeModule === "prevention"}
              description="学习8项关键预防措施，有效预防热射病"
              id="prevention"
              title="热射病预防措施"
            >
              <ContentBlock title="热射病可防可控">
                <p>
                  热射病可防可控，关键在于做好预防。以下8项措施对预防热射病十分重要。
                </p>
              </ContentBlock>

              <div className="rounded border-2 border-border bg-background p-4">
                <h3 className="text-xl font-black">预防措施分类</h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  原页面使用拖拽；这里改为移动端更稳的点选分类，分类规则保持一致。
                </p>
                <div className="mt-4 grid gap-3">
                  {preventionItems.map((item) => {
                    const assigned = preventionAssignments[item.id];
                    const checkedCorrect =
                      preventionChecked && assigned === item.category;
                    const checkedWrong =
                      preventionChecked && assigned !== item.category;
                    return (
                      <div
                        className={`rounded border-2 p-3 ${
                          checkedCorrect
                            ? "border-emerald-500"
                            : checkedWrong
                              ? "border-red-500"
                              : "border-border"
                        }`}
                        key={item.id}
                      >
                        <p className="font-black">{item.text}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {preventionCategories.map((category) => (
                            <button
                              className={`rounded border-2 px-3 py-2 text-xs font-black transition ${selectButtonClass(
                                assigned === category.id,
                              )}`}
                              data-testid={`prevention-${item.id}-${category.id}`}
                              key={category.id}
                              onClick={() => {
                                setPreventionAssignments((current) => ({
                                  ...current,
                                  [item.id]: category.id,
                                }));
                                setPreventionChecked(false);
                              }}
                              type="button"
                            >
                              {category.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="mt-4 min-h-11 rounded border-2 border-foreground bg-primary px-4 font-black text-primary-foreground"
                  onClick={() => {
                    setPreventionChecked(true);
                    if (allPreventionCorrect && !preventionRewarded) {
                      addXP(100);
                      setPreventionRewarded(true);
                    }
                  }}
                  type="button"
                >
                  检查分类
                </button>
                {preventionChecked ? (
                  <Feedback
                    ok={allPreventionCorrect}
                    text={
                      allPreventionCorrect
                        ? "分类正确！"
                        : "分类有误，请检查红色边框的项目。"
                    }
                  />
                ) : null}
              </div>

              <ContentBlock title="热习服训练">
                <p>
                  热习服是通过反复热刺激，使人体出现生理、心理、行为、形态方面的适应性反应，从而提高机体对热的耐受能力，即主动热适应。进行热习服训练时，要在热适应的基础上循序渐进增加运动量，如先适应热环境下的低强度训练，再适应热环境下的高强度训练。这个适应过程一般需要10～14天。
                </p>
                <ul className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground">
                  <li>心率小于120次/分：低强度</li>
                  <li>心率在120～150次/分：中等强度</li>
                  <li>心率大于150次/分：大强度</li>
                  <li>心率超过180次/分：极限强度</li>
                  <li>安全心率计算：(220-年龄)×70%</li>
                  <li>最高心率计算：(220-年龄)×(80%~85%)</li>
                </ul>
              </ContentBlock>

              <SingleQuiz
                answer={singleQuizAnswers[preventionQuiz.id]}
                onAnswer={(index) =>
                  setSingleQuizAnswers((current) => ({
                    ...current,
                    [preventionQuiz.id]: index,
                  }))
                }
                onSubmit={() => submitSingleQuiz(preventionQuiz, "training")}
                question={preventionQuiz}
                quizId="prevention-quiz"
                submitted={submittedSingleQuizzes.includes(preventionQuiz.id)}
              />

              <LessonNav
                nextLabel="下一关"
                onNext={() => goNext("prevention", "warning")}
                onPrev={() => goToModule("intro")}
                prevLabel="上一关"
              />
            </LessonFrame>

            <LessonFrame
              active={activeModule === "warning"}
              description="学习识别热射病的4个关键预警信号"
              id="warning"
              title="热射病预警信号"
            >
              <ContentBlock title="热射病预警4信号">
                <p>
                  训练中要关注热射病预警4信号。如果战友们在训练中或训练后出现以下4种情况，极有可能是发生热射病的先兆：
                </p>
                <ul className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground">
                  <li>烫：自觉身体发烫（从里向外发热）</li>
                  <li>晃：异常疲倦、行走不稳</li>
                  <li>晕：头晕、意识模糊、抽搐</li>
                  <li>
                    乱：出现脸白、心慌、气短、恶心、呕吐、腹痛、腹泻等症状
                  </li>
                </ul>
              </ContentBlock>

              <div className="rounded border-2 border-border bg-background p-4">
                <h3 className="text-xl font-black">情景识别：匹配预警信号</h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  点击以下每个场景，将其与对应的预警信号（烫、晃、晕、乱）关联起来：
                </p>
                <div className="mt-4 grid gap-3">
                  {warningSignals.map((item) => {
                    const identified = identifiedSignals.includes(item.id);
                    return (
                      <button
                        className={`rounded border-2 p-4 text-left transition ${
                          identified
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                        }`}
                        key={item.id}
                        onClick={() => handleSignal(item.id)}
                        type="button"
                      >
                        <span className="block text-sm font-bold leading-6">
                          {item.text}
                        </span>
                        {identified ? (
                          <span className="mt-2 block font-black">
                            识别为: {item.signal}预警信号
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <LessonNav
                nextLabel="下一关"
                onNext={() => goNext("warning", "treatment")}
                onPrev={() => goToModule("prevention")}
                prevLabel="上一关"
              />
            </LessonFrame>

            <LessonFrame
              active={activeModule === "treatment"}
              description="学习热射病救治6步法，掌握紧急救治技能"
              id="treatment"
              title="热射病救治方法"
            >
              <ContentBlock title="热射病救治6步法">
                <p>
                  一旦发生热射病，要迅速实施抢救，第一时间进行正确降温，不让患者的体温升起来，而不是立即后送。如果在1小时内患者体温降至38.5摄氏度，即使发生了热射病也不会很严重。
                </p>
              </ContentBlock>

              <div className="rounded border-2 border-border bg-background p-4">
                <h3 className="text-xl font-black">救治步骤排序</h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  为每个救治动作选择正确顺序，保留原 1-6 步排序规则。
                </p>
                <div className="mt-4 grid gap-3">
                  {treatmentSteps.map((step) => {
                    const selectedOrder = treatmentAssignments[step.id];
                    const checkedCorrect =
                      treatmentChecked && selectedOrder === step.order;
                    const checkedWrong =
                      treatmentChecked && selectedOrder !== step.order;
                    return (
                      <div
                        className={`rounded border-2 p-3 ${
                          checkedCorrect
                            ? "border-emerald-500"
                            : checkedWrong
                              ? "border-red-500"
                              : "border-border"
                        }`}
                        key={step.id}
                      >
                        <p className="font-black">{step.text}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6].map((order) => (
                            <button
                              className={`h-9 w-9 rounded border-2 text-sm font-black ${selectButtonClass(
                                selectedOrder === order,
                              )}`}
                              data-testid={`treatment-${step.id}-${order}`}
                              key={order}
                              onClick={() => {
                                setTreatmentAssignments((current) => ({
                                  ...current,
                                  [step.id]: order,
                                }));
                                setTreatmentChecked(false);
                              }}
                              type="button"
                            >
                              {order}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="mt-4 min-h-11 rounded border-2 border-foreground bg-primary px-4 font-black text-primary-foreground"
                  onClick={() => {
                    setTreatmentChecked(true);
                    if (allTreatmentCorrect && !treatmentRewarded) {
                      addXP(100);
                      setTreatmentRewarded(true);
                    }
                  }}
                  type="button"
                >
                  检查顺序
                </button>
                {treatmentChecked ? (
                  <Feedback
                    ok={allTreatmentCorrect}
                    text={
                      allTreatmentCorrect
                        ? "排序正确！"
                        : "排序有误，请检查红色边框的项目。"
                    }
                  />
                ) : null}
              </div>

              <ContentBlock title="救治步骤详解">
                <ol className="mt-3 grid gap-3 text-sm font-bold leading-7 text-muted-foreground">
                  <li>
                    <strong>立即脱离热环境</strong>
                    ：如果发现战友跑步时摇摇晃晃或已经摔倒，应立即将其搀扶到树荫下，脱去装具和外衣裤，便于散热。同时，对其大声呼叫，以评估意识状态。
                  </li>
                  <li>
                    <strong>用水、冰进行全身降温</strong>
                    ：将患者除头部外的其他身体部位浸泡在20摄氏度左右的浴盆中。此方法降温快速有效。
                  </li>
                  <li>
                    <strong>测量核心体温、心率、血压</strong>
                    ：用耳温枪测核心体温，用指脉氧检测仪了解心率和指脉氧饱和度，用血压计测血压。
                  </li>
                  <li>
                    <strong>建立静脉输液通道</strong>
                    ：卫生人员到达后，应立即建立静脉输液通道，视病情可以建立两条静脉输液通道。
                  </li>
                  <li>
                    <strong>气道保护与氧疗</strong>
                    ：如指脉氧饱和度小于95%，要给予鼻导管吸氧。昏迷患者应将头部偏向一侧，防止窒息。
                  </li>
                  <li>
                    <strong>控制抽搐</strong>
                    ：如患者突发抽搐，应立即给予安定注射液，并注意观察呼吸情况、监测指脉氧饱和度。
                  </li>
                </ol>
              </ContentBlock>

              <SingleQuiz
                answer={singleQuizAnswers[treatmentQuiz.id]}
                onAnswer={(index) =>
                  setSingleQuizAnswers((current) => ({
                    ...current,
                    [treatmentQuiz.id]: index,
                  }))
                }
                onSubmit={() => submitSingleQuiz(treatmentQuiz)}
                question={treatmentQuiz}
                quizId="treatment-quiz"
                submitted={submittedSingleQuizzes.includes(treatmentQuiz.id)}
              />

              <LessonNav
                nextLabel="综合测验"
                onNext={() => goNext("treatment", "quiz")}
                onPrev={() => goToModule("warning")}
                prevLabel="上一关"
              />
            </LessonFrame>

            <LessonFrame
              active={activeModule === "quiz"}
              description="测试你对热射病预防与救治的全面理解"
              id="quiz"
              title="热射病预防与救治综合测验"
            >
              <div className="grid gap-4">
                {finalQuiz.map((question) => {
                  const answer = finalAnswers[question.id];
                  const unanswered =
                    finalValidation && answer === undefined && !finalSubmitted;
                  return (
                    <article
                      className={`rounded border-2 bg-background p-4 ${
                        unanswered ? "border-red-500" : "border-border"
                      }`}
                      key={question.id}
                    >
                      <p className="font-black leading-7">{question.prompt}</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {question.options.map((option, index) => {
                          const selected = answer === index;
                          const correct =
                            finalSubmitted && index === question.correctIndex;
                          const incorrect =
                            finalSubmitted &&
                            selected &&
                            index !== question.correctIndex;
                          return (
                            <button
                              className={`rounded border-2 px-4 py-3 text-left text-sm font-bold leading-6 transition ${selectButtonClass(
                                selected,
                                correct,
                                incorrect,
                              )}`}
                              data-testid={`final-${question.id}-${index}`}
                              disabled={finalSubmitted}
                              key={option}
                              onClick={() =>
                                setFinalAnswers((current) => ({
                                  ...current,
                                  [question.id]: index,
                                }))
                              }
                              type="button"
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {finalSubmitted ? (
                        <Feedback
                          ok={answer === question.correctIndex}
                          text={
                            answer === question.correctIndex
                              ? `${question.prompt.split(".")[0]}: 正确！`
                              : `${question.prompt.split(".")[0]}: 不正确。`
                          }
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {finalValidation ? (
                <div
                  className="mt-4 rounded border-2 border-red-500 bg-red-500/10 p-4 text-sm font-black text-red-600 dark:text-red-300"
                  role="alert"
                >
                  {finalValidation}
                </div>
              ) : null}

              {finalResult ? (
                <div className="mt-5 rounded border-2 border-primary bg-primary p-5 text-center text-primary-foreground">
                  <p className="text-xl font-black">测验完成！</p>
                  <p className="mt-3 font-mono text-6xl font-black">
                    {finalResult.score}%
                  </p>
                  <p className="mt-3 font-bold">
                    你答对了 {finalResult.correctCount} 道题，共{" "}
                    {finalResult.total} 道题。
                  </p>
                  <p className="mt-3 font-black">
                    {finalResult.score === 100
                      ? "太棒了，满分！"
                      : finalResult.score >= 80
                        ? "恭喜你，掌握得不错！"
                        : "继续努力，温故知新！"}
                  </p>
                  <button
                    className="mt-4 min-h-11 rounded border-2 border-primary-foreground bg-primary-foreground px-4 font-black text-primary"
                    onClick={resetChallenge}
                    type="button"
                  >
                    再学一次
                  </button>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-between">
                  <button
                    className="min-h-12 rounded border-2 border-border bg-background px-5 font-black text-muted-foreground"
                    onClick={() => goToModule("treatment")}
                    type="button"
                  >
                    返回
                  </button>
                  <button
                    className="min-h-12 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground"
                    onClick={submitFinalQuiz}
                    type="button"
                  >
                    提交测验
                  </button>
                </div>
              )}
            </LessonFrame>
          </div>
        </div>
      </div>

      {reward ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded border-2 border-border bg-background p-6 text-center shadow-xl">
            <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-3xl font-black text-primary-foreground">
              {reward.icon}
            </p>
            <h3 className="mt-4 text-2xl font-black">{reward.title}</h3>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {reward.description}
            </p>
            <button
              className="mt-5 min-h-11 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground"
              onClick={() => setReward(null)}
              type="button"
            >
              继续学习
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({
  value,
  label,
  last = false,
}: {
  value: number | string;
  label: string;
  last?: boolean;
}) {
  return (
    <div className={`p-3 ${last ? "" : "border-r-2 border-border"}`}>
      <p className="font-mono text-2xl font-black text-primary">{value}</p>
      <p className="mt-1 text-[11px] font-black text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-muted">
        <div
          className="h-full rounded bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LessonFrame({
  active,
  children,
  description,
  id,
  title,
}: {
  active: boolean;
  children: ReactNode;
  description: string;
  id: string;
  title: string;
}) {
  return (
    <section
      className={active ? "grid gap-5" : "hidden"}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <header>
        <h2 className="text-3xl font-black leading-tight" id={`${id}-title`}>
          {title}
        </h2>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function ContentBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="rounded border-2 border-border bg-background p-4 text-sm font-bold leading-7 text-muted-foreground">
      <h3 className="mb-2 border-l-4 border-primary pl-3 text-xl font-black text-foreground">
        {title}
      </h3>
      {children}
    </article>
  );
}

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className={`mt-3 rounded border-2 p-3 text-sm font-black ${
        ok
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
      }`}
    >
      {text}
    </div>
  );
}

function LessonNav({
  nextLabel,
  onNext,
  onPrev,
  prevLabel,
}: {
  nextLabel: string;
  onNext: () => void;
  onPrev?: () => void;
  prevLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:justify-between">
      <button
        className="min-h-12 rounded border-2 border-border bg-background px-5 font-black text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!onPrev}
        onClick={onPrev}
        type="button"
      >
        {prevLabel ?? "上一关"}
      </button>
      <button
        className="min-h-12 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground"
        onClick={onNext}
        type="button"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function SingleQuiz({
  answer,
  onAnswer,
  onSubmit,
  question,
  quizId,
  submitted,
}: {
  answer?: number;
  onAnswer: (index: number) => void;
  onSubmit: () => void;
  question: QuizQuestion;
  quizId: string;
  submitted: boolean;
}) {
  return (
    <div
      className="rounded border-2 border-border bg-background p-4"
      id={quizId}
    >
      <h3 className="text-xl font-black">快速测验</h3>
      <p className="mt-3 font-black">{question.prompt}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {question.options.map((option, index) => {
          const selected = answer === index;
          const correct = submitted && index === question.correctIndex;
          const incorrect =
            submitted && selected && index !== question.correctIndex;
          return (
            <button
              className={`rounded border-2 px-4 py-3 text-left text-sm font-bold leading-6 ${selectButtonClass(
                selected,
                correct,
                incorrect,
              )}`}
              disabled={submitted}
              key={option}
              onClick={() => onAnswer(index)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
      <button
        className="mt-4 min-h-11 rounded border-2 border-foreground bg-primary px-4 font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
        disabled={submitted}
        onClick={onSubmit}
        type="button"
      >
        {submitted ? "已提交" : "提交答案"}
      </button>
      {submitted ? (
        <Feedback
          ok={answer === question.correctIndex}
          text={
            answer === question.correctIndex
              ? "回答正确"
              : "回答有误，请参考高亮答案"
          }
        />
      ) : null}
    </div>
  );
}
