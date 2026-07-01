"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type StepId = 1 | 2 | 3 | 4 | 5 | 6;
type Consciousness = "conscious" | "unconscious" | null;

type Vitals = {
  temperature: string;
  heartRate: string;
  oxygen: string;
  systolic: string;
  diastolic: string;
};

const totalSteps = 6;

const warningOptions = [
  {
    id: "hot",
    signal: "烫",
    title: "患者感觉身体发烫",
    detail: "自觉身体发烫（从里向外发热）",
  },
  {
    id: "unstable",
    signal: "晃",
    title: "患者行走不稳或异常疲倦",
    detail: "异常疲倦、行走不稳",
  },
  {
    id: "dizzy",
    signal: "晕",
    title: "患者头晕或意识模糊",
    detail: "头晕、意识模糊、抽搐",
  },
  {
    id: "seizure",
    signal: "晕",
    title: "患者出现抽搐",
    detail: "出现抽搐时，第六步需要控制抽搐",
  },
  {
    id: "pale",
    signal: "乱",
    title: "患者脸色苍白",
    detail: "脸白、心慌、气短、恶心、呕吐、腹痛、腹泻等",
  },
  {
    id: "nausea",
    signal: "乱",
    title: "患者恶心或呕吐",
    detail: "胃肠道症状提示风险升高",
  },
  {
    id: "stomach",
    signal: "乱",
    title: "患者腹痛或腹泻",
    detail: "继续观察并准备转运",
  },
  {
    id: "breath",
    signal: "乱",
    title: "患者心慌或气短",
    detail: "需要持续监测心肺情况",
  },
];

const step2Actions = [
  {
    id: "move",
    title: "已将患者转移到阴凉处",
    detail: "如果发现战友跑步时摇摇晃晃或已经摔倒，应立即将其搀扶到树荫下。",
  },
  {
    id: "undress",
    title: "已脱去患者装具和外衣裤",
    detail: "脱去装具和外衣裤，便于散热。",
  },
  {
    id: "assess",
    title: "已评估患者意识状态",
    detail: "对患者大声呼叫，以评估意识状态。",
  },
];

const coolingOptions = [
  {
    id: "immersion",
    title: "已将患者浸泡在冷水中",
    detail: "将患者除头部外的其他身体部位浸泡在20摄氏度左右的浴盆中。",
  },
  {
    id: "towel",
    title: "已用冰毛巾擦拭患者全身",
    detail: "用冰水浸泡过的毛巾擦拭全身。",
  },
  {
    id: "ice",
    title: "已在关键部位放置冰块",
    detail: "将冰块放置在患者双腋下、大腿根。",
  },
  {
    id: "icecap",
    title: "已为患者戴上冰帽/冰颈圈",
    detail: "头部戴冰帽、冰颈圈。",
  },
];

const step5BaseActions = [
  {
    id: "iv",
    title: "已联系卫生人员建立静脉输液通道",
    detail:
      "卫生人员到达后，应立即建立静脉输液通道，视病情可以建立两条静脉输液通道，快速输入林格氏液、生理盐水、糖盐水等。",
  },
  {
    id: "oxygen",
    title: "已给予患者氧疗",
    detail: "如指脉氧饱和度小于95%，要给予鼻导管吸氧。",
  },
];

const unconsciousActions = [
  {
    id: "airway",
    title: "已将患者头部偏向一侧",
    detail: "昏迷患者应将头部偏向一侧，防止口腔有异物引起窒息。",
  },
  {
    id: "clear",
    title: "已清除口腔分泌物（如有）",
    detail: "一旦发生呕吐，应立即清除口腔分泌物，确保呼吸道通畅。",
  },
];

const seizureActions = [
  {
    id: "seizure-med",
    title: "已联系医务人员给予抗抽搐药物",
    detail:
      "如患者突发抽搐，应立即给予安定注射液（10～20mg肌肉注射或5～10mg静脉注射）。",
  },
];

const monitorAction = {
  id: "monitor",
  title: "已安排人员持续监测患者生命体征",
  detail: "持续监测患者体温、心率、血压和血氧饱和度，直到体温降至38.5℃以下。",
};

const initialVitals: Vitals = {
  temperature: "",
  heartRate: "",
  oxygen: "",
  systolic: "",
  diastolic: "",
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasValidNumber(value: string, min: number, max: number) {
  const number = toNumber(value);
  return number !== null && number >= min && number <= max;
}

function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function HeatStrokeFieldTreatment() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [maxStepReached, setMaxStepReached] = useState<StepId>(1);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [cooling, setCooling] = useState<string[]>([]);
  const [consciousness, setConsciousness] = useState<Consciousness>(null);
  const [vitals, setVitals] = useState<Vitals>(initialVitals);

  useEffect(() => {
    if (!started || isFinished) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isFinished, started]);

  const hasSeizure = warnings.includes("seizure");
  const oxygenNumber = toNumber(vitals.oxygen);
  const temperatureNumber = toNumber(vitals.temperature);
  const systolicNumber = toNumber(vitals.systolic);
  const diastolicNumber = toNumber(vitals.diastolic);

  const step2Complete =
    step2Actions.every((item) => actions.includes(item.id)) &&
    consciousness !== null;
  const step4Complete =
    hasValidNumber(vitals.temperature, 35, 42) &&
    hasValidNumber(vitals.heartRate, 40, 200) &&
    hasValidNumber(vitals.oxygen, 70, 100) &&
    hasValidNumber(vitals.systolic, 60, 220) &&
    hasValidNumber(vitals.diastolic, 40, 120);
  const activeStep5Actions = useMemo(
    () =>
      consciousness === "unconscious"
        ? [...step5BaseActions, ...unconsciousActions]
        : step5BaseActions,
    [consciousness],
  );
  const step5Complete = activeStep5Actions.every((item) =>
    actions.includes(item.id),
  );
  const activeStep6Actions = hasSeizure
    ? [...seizureActions, monitorAction]
    : [monitorAction];
  const step6Complete = activeStep6Actions.every((item) =>
    actions.includes(item.id),
  );

  const temperatureWarning =
    temperatureNumber !== null && temperatureNumber > 40
      ? "危险！体温过高，需立即降温！"
      : temperatureNumber !== null && temperatureNumber > 38.5
        ? "警告：体温升高，需继续降温"
        : "";
  const heartRateWarning =
    toNumber(vitals.heartRate) !== null && Number(vitals.heartRate) > 150
      ? "警告：心率过快！"
      : "";
  const bloodPressureWarning =
    systolicNumber !== null && diastolicNumber !== null && systolicNumber < 90
      ? "警告：低血压！可能存在休克风险"
      : systolicNumber !== null &&
          diastolicNumber !== null &&
          (systolicNumber > 180 || diastolicNumber > 110)
        ? "警告：高血压！"
        : "";

  function startFlow() {
    setStarted(true);
    setCurrentStep(1);
    setMaxStepReached(1);
    setSeconds(0);
    setIsFinished(false);
    window.setTimeout(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      20,
    );
  }

  function goToStep(step: StepId) {
    if (step > maxStepReached + 1) return;
    setCurrentStep(step);
    setMaxStepReached((current) => (step > current ? step : current));
    window.setTimeout(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      20,
    );
  }

  function finishFlow() {
    setIsFinished(true);
    window.setTimeout(
      () => window.scrollTo({ top: 0, behavior: "smooth" }),
      20,
    );
  }

  function resetApp() {
    setStarted(false);
    setCurrentStep(1);
    setMaxStepReached(1);
    setSeconds(0);
    setIsFinished(false);
    setWarnings([]);
    setActions([]);
    setCooling([]);
    setConsciousness(null);
    setVitals(initialVitals);
  }

  function updateVital(key: keyof Vitals, value: string) {
    setVitals((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-10 md:py-14">
      {!started ? (
        <StartScreen onStart={startFlow} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.32fr_0.68fr]">
          <aside className="rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs font-black uppercase text-muted-foreground">
              Field Protocol
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight">处置状态</h2>
            <div className="progress-container hys-flow-status mb-8 mt-5 rounded border-2 border-border bg-background p-4">
              <div className="flex justify-between gap-3 text-sm font-black">
                <span id="current-step-text">
                  {isFinished
                    ? "处置完成"
                    : `步骤 ${currentStep}/${totalSteps}`}
                </span>
                <span id="timer" className="timer font-mono text-primary">
                  {formatTimer(seconds)}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded bg-muted">
                <div
                  id="progress-fill"
                  className="h-full rounded bg-primary transition-all"
                  style={{
                    width: `${isFinished ? 100 : ((currentStep - 1) / totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              {[
                "检查预警信号",
                "立即脱离热环境",
                "用水、冰进行全身降温",
                "测量核心体温、心率、血压",
                "建立静脉输液通道和气道保护",
                "控制抽搐",
              ].map((label, index) => {
                const step = (index + 1) as StepId;
                return (
                  <button
                    className={`rounded border-2 px-3 py-2 text-left text-sm font-black ${
                      !isFinished && currentStep === step
                        ? "border-primary bg-primary text-primary-foreground"
                        : step <= maxStepReached
                          ? "border-border bg-background text-muted-foreground"
                          : "border-border bg-muted text-muted-foreground/60"
                    }`}
                    disabled={step > maxStepReached}
                    key={label}
                    onClick={() => goToStep(step)}
                    type="button"
                  >
                    {step}. {label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded border-2 border-border bg-card p-4 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] md:p-6">
            {!isFinished ? (
              <div id="treatment-flow">
                <StepFrame
                  active={currentStep === 1}
                  id="step1"
                  kicker="第一步"
                  title="检查预警信号"
                >
                  <p className="text-sm font-bold leading-7 text-muted-foreground">
                    请检查患者是否出现以下预警信号：如果患者出现任意一种预警信号，可能是热射病先兆，需要立即采取措施。
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {warningOptions.map((item) => (
                      <CheckCard
                        checked={warnings.includes(item.id)}
                        detail={item.detail}
                        key={item.id}
                        label={`${item.signal}：${item.title}`}
                        onToggle={() =>
                          setWarnings((current) =>
                            toggleInList(current, item.id),
                          )
                        }
                        testId={`warning-${item.id}`}
                      />
                    ))}
                  </div>
                  <StepNav
                    nextDisabled={warnings.length === 0}
                    nextId="next-btn-1"
                    onNext={() => goToStep(2)}
                  />
                </StepFrame>

                <StepFrame
                  active={currentStep === 2}
                  id="step2"
                  kicker="第二步"
                  title="立即脱离热环境"
                >
                  <div className="grid gap-3">
                    {step2Actions.map((item, index) => (
                      <CheckCard
                        checked={actions.includes(item.id)}
                        detail={item.detail}
                        key={item.id}
                        label={`${index + 1}. ${item.title}`}
                        onToggle={() =>
                          setActions((current) =>
                            toggleInList(current, item.id),
                          )
                        }
                        testId={`action-${item.id}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 rounded border-2 border-border bg-background p-4">
                    <p className="font-black">患者意识状态</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SelectButton
                        active={consciousness === "conscious"}
                        id="conscious-btn"
                        onClick={() => setConsciousness("conscious")}
                      >
                        清醒
                      </SelectButton>
                      <SelectButton
                        active={consciousness === "unconscious"}
                        id="unconscious-btn"
                        onClick={() => setConsciousness("unconscious")}
                      >
                        意识不清
                      </SelectButton>
                    </div>
                  </div>
                  <StepNav
                    nextDisabled={!step2Complete}
                    nextId="next-btn-2"
                    onNext={() => goToStep(3)}
                    onPrev={() => goToStep(1)}
                  />
                </StepFrame>

                <StepFrame
                  active={currentStep === 3}
                  id="step3"
                  kicker="第三步"
                  title="用水、冰进行全身降温"
                >
                  <p className="text-sm font-bold leading-7 text-muted-foreground">
                    选择可用的降温方法。多种方法可同时进行，降温是救治热射病的关键。
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {coolingOptions.map((item) => (
                      <CheckCard
                        checked={cooling.includes(item.id)}
                        detail={item.detail}
                        key={item.id}
                        label={item.title}
                        onToggle={() =>
                          setCooling((current) =>
                            toggleInList(current, item.id),
                          )
                        }
                        testId={`cooling-${item.id}`}
                      />
                    ))}
                  </div>
                  <Alert tone="hot">
                    注意：如果在1小时内患者体温降至38.5摄氏度，即使发生了热射病也不会很严重。
                  </Alert>
                  <StepNav
                    nextDisabled={cooling.length === 0}
                    nextId="next-btn-3"
                    onNext={() => goToStep(4)}
                    onPrev={() => goToStep(2)}
                  />
                </StepFrame>

                <StepFrame
                  active={currentStep === 4}
                  id="step4"
                  kicker="第四步"
                  title="测量核心体温、心率、血压"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputBlock
                      id="temperature-input"
                      label="患者体温（°C）"
                      max={42}
                      min={35}
                      onChange={(value) => updateVital("temperature", value)}
                      step="0.1"
                      value={vitals.temperature}
                    />
                    <InputBlock
                      id="heart-rate-input"
                      label="患者心率（次/分）"
                      max={200}
                      min={40}
                      onChange={(value) => updateVital("heartRate", value)}
                      value={vitals.heartRate}
                    />
                    <InputBlock
                      id="oxygen-input"
                      label="血氧饱和度（%）"
                      max={100}
                      min={70}
                      onChange={(value) => updateVital("oxygen", value)}
                      value={vitals.oxygen}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputBlock
                        id="systolic-input"
                        label="收缩压（mmHg）"
                        max={220}
                        min={60}
                        onChange={(value) => updateVital("systolic", value)}
                        value={vitals.systolic}
                      />
                      <InputBlock
                        id="diastolic-input"
                        label="舒张压（mmHg）"
                        max={120}
                        min={40}
                        onChange={(value) => updateVital("diastolic", value)}
                        value={vitals.diastolic}
                      />
                    </div>
                  </div>
                  <div className="mt-5 rounded border-2 border-border bg-background p-4">
                    <div className="temperature-gauge relative h-5 rounded-full bg-gradient-to-r from-sky-500 via-yellow-400 to-red-600">
                      {[0, 50, 100].map((left) => (
                        <span
                          className="temperature-marker absolute -top-2 h-9 w-1 bg-foreground"
                          key={left}
                          style={{ left: `${left}%` }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs font-black text-muted-foreground">
                      <span>35°C</span>
                      <span>38.5°C</span>
                      <span>42°C</span>
                    </div>
                  </div>
                  {temperatureWarning ? (
                    <Alert id="temperature-warning" tone="danger">
                      {temperatureWarning}
                    </Alert>
                  ) : null}
                  {heartRateWarning ? (
                    <Alert id="vitals-warning" tone="danger">
                      {heartRateWarning}
                    </Alert>
                  ) : null}
                  {bloodPressureWarning ? (
                    <Alert id="bp-warning" tone="danger">
                      {bloodPressureWarning}
                    </Alert>
                  ) : null}
                  <StepNav
                    nextDisabled={!step4Complete}
                    nextId="next-btn-4"
                    onNext={() => goToStep(5)}
                    onPrev={() => goToStep(3)}
                  />
                </StepFrame>

                <StepFrame
                  active={currentStep === 5}
                  id="step5"
                  kicker="第五步"
                  title="建立静脉输液通道和气道保护"
                >
                  {oxygenNumber !== null && oxygenNumber < 95 ? (
                    <Alert id="oxygen-alert" role="alert" tone="danger">
                      注意：患者血氧饱和度低于95%，需要给予氧疗！
                    </Alert>
                  ) : null}
                  <div className="grid gap-3">
                    {activeStep5Actions.map((item) => (
                      <CheckCard
                        checked={actions.includes(item.id)}
                        detail={item.detail}
                        key={item.id}
                        label={item.title}
                        onToggle={() =>
                          setActions((current) =>
                            toggleInList(current, item.id),
                          )
                        }
                        testId={`action-${item.id}`}
                      />
                    ))}
                  </div>
                  <StepNav
                    nextDisabled={!step5Complete}
                    nextId="next-btn-5"
                    onNext={() => goToStep(6)}
                    onPrev={() => goToStep(4)}
                  />
                </StepFrame>

                <StepFrame
                  active={currentStep === 6}
                  id="step6"
                  kicker="第六步"
                  title="控制抽搐"
                >
                  {hasSeizure ? (
                    <div
                      className="mb-3 rounded border-2 border-border bg-background p-4"
                      id="seizure-control"
                    >
                      <p className="font-black">抽搐处理</p>
                      <p className="mt-2 text-sm font-bold leading-7 text-muted-foreground">
                        注射后注意观察患者的呼吸情况、监测指脉氧饱和度。如果出现呼吸抑制、指脉氧饱和度下降的情况，可以通过简易呼吸器辅助呼吸。在按压躁动的患者时，不要按压大关节处，避免造成骨折、脱位和肌肉损伤。
                      </p>
                    </div>
                  ) : (
                    <div
                      className="mb-3 rounded border-2 border-border bg-background p-4"
                      id="no-seizure"
                    >
                      <p className="font-black">患者无抽搐</p>
                      <p className="mt-2 text-sm font-bold text-muted-foreground">
                        患者目前未出现抽搐症状，继续观察患者情况，保持降温措施。
                      </p>
                    </div>
                  )}
                  <div className="grid gap-3">
                    {activeStep6Actions.map((item) => (
                      <CheckCard
                        checked={actions.includes(item.id)}
                        detail={item.detail}
                        key={item.id}
                        label={item.title}
                        onToggle={() =>
                          setActions((current) =>
                            toggleInList(current, item.id),
                          )
                        }
                        testId={`action-${item.id}`}
                      />
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-between">
                    <button
                      className="min-h-12 rounded border-2 border-border bg-background px-5 font-black text-muted-foreground"
                      onClick={() => goToStep(5)}
                      type="button"
                    >
                      上一步
                    </button>
                    <button
                      className="min-h-12 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!step6Complete}
                      id="finish-btn"
                      onClick={finishFlow}
                      type="button"
                    >
                      完成处置流程
                    </button>
                  </div>
                </StepFrame>
              </div>
            ) : (
              <ResultSummary
                consciousness={consciousness}
                onRestart={resetApp}
                seconds={seconds}
                temperatureWarning={
                  temperatureNumber !== null && temperatureNumber > 38.5
                }
                vitals={vitals}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <section id="start-screen">
      <div className="grid gap-5 md:grid-cols-[1fr_0.9fr] md:items-stretch">
        <div className="rounded border-2 border-border bg-card p-6 shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
          <p className="font-mono text-xs font-black uppercase text-muted-foreground">
            8-4-6 Rule
          </p>
          <h2 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
            现场先稳住，体温必须降下来
          </h2>
          <p className="mt-5 text-sm font-bold leading-7 text-muted-foreground md:text-base">
            这是一套热射病现场处置流程模拟。按步骤识别预警信号、执行降温、记录生命体征，并生成处置总结。
          </p>
          <button
            className="mt-6 min-h-12 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground"
            id="start-btn"
            onClick={onStart}
            type="button"
          >
            立即识别并处置病例
          </button>
        </div>
        <div className="grid grid-cols-3 border-2 border-border bg-background text-center shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
          {[
            ["8", "项预防措施"],
            ["4", "个预警信号"],
            ["6", "步救治方法"],
          ].map(([value, label], index) => (
            <div
              className={`grid place-items-center p-4 ${index === 2 ? "" : "border-r-2 border-border"}`}
              key={label}
            >
              <div>
                <p className="font-mono text-5xl font-black text-primary">
                  {value}
                </p>
                <p className="mt-2 text-sm font-black text-muted-foreground">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepFrame({
  active,
  children,
  id,
  kicker,
  title,
}: {
  active: boolean;
  children: ReactNode;
  id: string;
  kicker: string;
  title: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={active ? "grid gap-5" : "hidden"}
      id={id}
    >
      <header>
        <p className="font-mono text-xs font-black uppercase text-muted-foreground">
          {kicker}
        </p>
        <h2
          className="mt-2 text-3xl font-black leading-tight"
          id={`${id}-title`}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function CheckCard({
  checked,
  detail,
  label,
  onToggle,
  testId,
}: {
  checked: boolean;
  detail: string;
  label: string;
  onToggle: () => void;
  testId: string;
}) {
  return (
    <button
      aria-checked={checked}
      className={`custom-checkbox group rounded border-2 p-4 text-left transition ${
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary"
      }`}
      data-testid={testId}
      onClick={onToggle}
      role="checkbox"
      type="button"
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-1 grid h-6 w-6 flex-none place-items-center rounded border-2 text-xs font-black ${
            checked
              ? "border-primary-foreground bg-primary-foreground text-primary"
              : "border-primary text-transparent"
          }`}
        >
          ✓
        </span>
        <span>
          <span className="block font-black">{label}</span>
          <span
            className={`mt-2 block text-sm font-bold leading-6 ${
              checked ? "text-primary-foreground/85" : "text-muted-foreground"
            }`}
          >
            {detail}
          </span>
        </span>
      </span>
    </button>
  );
}

function SelectButton({
  active,
  children,
  id,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  id: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 rounded border-2 px-4 font-black ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground"
      }`}
      id={id}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function StepNav({
  nextDisabled,
  nextId,
  onNext,
  onPrev,
}: {
  nextDisabled: boolean;
  nextId: string;
  onNext: () => void;
  onPrev?: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-between">
      <button
        className="min-h-12 rounded border-2 border-border bg-background px-5 font-black text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!onPrev}
        onClick={onPrev}
        type="button"
      >
        上一步
      </button>
      <button
        className="min-h-12 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={nextDisabled}
        id={nextId}
        onClick={onNext}
        type="button"
      >
        继续下一步
      </button>
    </div>
  );
}

function InputBlock({
  id,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  step?: string;
  value: string;
}) {
  return (
    <label className="block rounded border-2 border-border bg-background p-4">
      <span className="text-sm font-black">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded border-2 border-border bg-card px-3 font-mono font-black text-foreground outline-none focus:border-primary"
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function Alert({
  children,
  id,
  role,
  tone,
}: {
  children: ReactNode;
  id?: string;
  role?: string;
  tone: "danger" | "hot";
}) {
  return (
    <div
      className={`mt-4 rounded border-2 p-4 text-sm font-black leading-6 ${
        tone === "danger"
          ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
          : "border-primary bg-primary/10 text-primary"
      }`}
      id={id}
      role={role}
    >
      {children}
    </div>
  );
}

function ResultSummary({
  consciousness,
  onRestart,
  seconds,
  temperatureWarning,
  vitals,
}: {
  consciousness: Consciousness;
  onRestart: () => void;
  seconds: number;
  temperatureWarning: boolean;
  vitals: Vitals;
}) {
  const oxygenNumber = toNumber(vitals.oxygen);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <section className="grid gap-5" id="result">
      <header>
        <p className="font-mono text-xs font-black uppercase text-muted-foreground">
          Result
        </p>
        <h2 className="mt-2 text-3xl font-black leading-tight">
          处置<span className="text-primary">完成</span>
        </h2>
      </header>
      <div className="rounded border-2 border-border bg-background p-5 text-sm font-bold leading-7 text-muted-foreground">
        <p className="text-base text-foreground">
          您已完成热射病现场处置的关键步骤。请继续监测患者情况，并尽快将患者转运至医疗机构进行进一步治疗。
        </p>
        <Alert tone="hot">
          重要提示：热射病是一种危及生命的紧急情况，即使完成了现场处置，也必须尽快将患者送往医院进行专业治疗！
        </Alert>
        <div className="mt-5 grid gap-2" id="summary-content">
          <SummaryRow
            label="处置用时"
            value={`${minutes}分${remainingSeconds}秒`}
          />
          <SummaryRow
            label="患者体温"
            value={vitals.temperature ? `${vitals.temperature}°C` : "未记录"}
          />
          <SummaryRow
            label="患者心率"
            value={vitals.heartRate ? `${vitals.heartRate}次/分` : "未记录"}
          />
          <SummaryRow
            label="患者血氧"
            value={vitals.oxygen ? `${vitals.oxygen}%` : "未记录"}
          />
          <SummaryRow
            label="患者血压"
            value={
              vitals.systolic
                ? `${vitals.systolic}/${vitals.diastolic} mmHg`
                : "未记录"
            }
          />
          <SummaryRow
            label="意识状态"
            value={consciousness === "unconscious" ? "意识不清" : "清醒"}
          />
        </div>
        {temperatureWarning ? (
          <Alert tone="danger">注意：患者体温仍高于38.5°C，需继续降温！</Alert>
        ) : null}
        {oxygenNumber !== null && oxygenNumber < 95 ? (
          <Alert tone="danger">注意：患者血氧饱和度低于95%，需继续氧疗！</Alert>
        ) : null}
        <button
          className="mt-5 min-h-11 rounded border-2 border-foreground bg-primary px-5 font-black text-primary-foreground"
          id="restart-btn"
          onClick={onRestart}
          type="button"
        >
          重新开始
        </button>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong className="text-foreground">{label}：</strong>
      {value}
    </p>
  );
}
