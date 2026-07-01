"use client";

import { useMemo, useState } from "react";

type Option = {
  label: string;
  value: number;
};

type Question = {
  id: string;
  title: string;
  options: Option[];
  note?: string;
};

const bmiOptions: Option[] = [
  { label: ">32kg/m2", value: 1 },
  { label: "28~32kg/m2", value: 2 },
  { label: "24~27.9kg/m2", value: 3 },
  { label: "18.5~23.9kg/m2", value: 4 },
  { label: "<18.5kg/m2", value: 5 },
];

const questions: Question[] = [
  {
    id: "q2",
    title: "您认为自己的耐热能力处于什么水平?",
    options: ["很差", "不太好", "一般", "比较好", "很强"].map(toOption),
  },
  {
    id: "q3",
    title: "您是否有训练导致中暑的病史?",
    options: [
      "最近1个月发生过",
      "最近半年发生过",
      "最近1年发生过",
      "1年以前发生过",
      "没有",
    ].map(toOption),
  },
  {
    id: "q4",
    title: "您是否了解自己平时的静息心率是多少?",
    options: [
      "不知道",
      "70次/分以上",
      "60~70次/分",
      "50~60次/分",
      "40~50次/分",
    ].map(toOption),
  },
  {
    id: "q5",
    title: "您最近一次参加三千米跑考核的测试成绩是多少?",
    options: ["不及格", "及格", "良好", "优秀", "特别好"].map(toOption),
  },
  {
    id: "q6",
    title: "最近这次三千米考核中，您的感觉是以下哪种?",
    options: [
      "呼吸困难，生不如死，总是想放弃",
      "浑身发烫，热得要爆，咬牙坚持",
      "头晕头痛，尚可忍受",
      "没有异常，全力以赴考核",
      "很轻松，还有所保留",
    ].map(toOption),
  },
  {
    id: "q7",
    title: "最近这次三千米考核后您是否觉得很累?",
    options: [
      "太累了，气都喘不上来了，休息了好几天才缓过来",
      "很累，全身发烫，休息了好久",
      "有点累，歇歇就好",
      "没啥感觉，正常发挥",
      "很轻松，还可以再快点",
    ].map(toOption),
  },
  {
    id: "q8",
    title: "最近这次三千米考核后几天是否有不舒服?",
    options: ["腹泻", "腹痛", "头痛", "四肢酸痛", "没有不舒服"].map(toOption),
  },
  {
    id: "q9",
    title: "您是否了解自己考核时的平均心率是多少?",
    options: [
      "不知道",
      "180次/分以上",
      "160~180次/分",
      "140~160次/分",
      "140次/分以下",
    ].map(toOption),
    note: "如了解，可在下方选填平均心率；该字段不参与原评分。",
  },
  {
    id: "q10",
    title: "您最近一次跑步训练的跑步距离是多长?",
    options: ["半年没跑了", "3km以内", "3~5km", "5~10km", "10km以上"].map(
      toOption,
    ),
  },
  {
    id: "q11",
    title: "您最近一次跑步训练的跑步时间是多久?",
    options: [
      "半年没跑了",
      "30分钟以内",
      "30~60分钟",
      "1~2小时",
      "2小时以上",
    ].map(toOption),
  },
  {
    id: "q12",
    title: "您最近一月的跑量是多少?",
    options: ["没跑", "1~12km", "12~40km", "40~80km", "80km以上"].map(toOption),
  },
  {
    id: "q13",
    title: "您最近跑步的平均速度是多少?",
    options: [
      "每公里8分钟以上",
      "每公里6~8分钟",
      "每公里5~6分钟",
      "每公里4~5分钟",
      "每公里3~4分",
    ].map(toOption),
  },
  {
    id: "q14",
    title: "您最近1个月体重情况稳定吗?",
    options: [
      "重了5kg以上",
      "重了2~5kg",
      "基本稳定",
      "轻了2~5kg",
      "轻了5kg以上",
    ].map(toOption),
  },
  {
    id: "q15",
    title: "您最近1个月内休息情况好吗?",
    options: [
      "老是失眠，头疼，睡不着，白天老犯困",
      "经常失眠，睡不好，白天犯困",
      "偶尔失眠，总体还行",
      "睡眠正常，白天正常工作",
      "睡眠质量高，精力充沛工作",
    ].map(toOption),
  },
  {
    id: "q16",
    title: "最近1个月内您是否生病?",
    options: [
      "有发烧，吃了药还没全好，还在吃药",
      "有发烧，吃了药已经退烧，感觉还要休息一下",
      "有点感冒、拉肚子，休息几天，已经好了",
      "有点感冒、拉肚子，没吃药已经好了",
      "没有",
    ].map(toOption),
  },
  {
    id: "q17",
    title: "如果在15天内您要参加3千米体能测试，您会怎么看待?",
    options: [
      "太可怕了，直接放弃，坚决不考",
      "试试吧，肯定考不过格",
      "抓紧训练，及格有望",
      "积极准备，有信心通过",
      "小菜一碟，随考随过",
    ].map(toOption),
  },
  {
    id: "q18",
    title:
      "如果在15天内安排您参加3千米体能测试，您觉得自己的考核成绩会是什么结果?",
    options: ["不及格", "能及格", "良好", "优秀", "特别好"].map(toOption),
  },
];

function toOption(label: string, index: number): Option {
  return { label, value: index + 1 };
}

function calculateBmi(heightCm: string, weightKg: string) {
  const height = Number.parseFloat(heightCm);
  const weight = Number.parseFloat(weightKg);

  if (!(height > 0) || !(weight > 0)) {
    return null;
  }

  const heightMeters = height / 100;
  return weight / (heightMeters * heightMeters);
}

function calculateBmiScore(bmi: number | null) {
  if (bmi === null) return null;
  if (bmi < 18.5) return 5;
  if (bmi < 24) return 4;
  if (bmi < 28) return 3;
  if (bmi < 32) return 2;
  return 1;
}

function interpretScore(score: number) {
  if (score >= 80) return "评估结果：耐热能力优秀";
  if (score >= 70) return "评估结果：耐热能力良好";
  if (score >= 60) return "评估结果：耐热能力中等";
  if (score >= 40) return "评估结果：耐热能力较弱";
  return "评估结果：耐热能力差，请注意！";
}

export function HeatToleranceAssessment() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [averageHeartRate, setAverageHeartRate] = useState("");
  const [missingQuestions, setMissingQuestions] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const bmi = useMemo(() => calculateBmi(height, weight), [height, weight]);
  const bmiScore = calculateBmiScore(bmi);
  const allQuestions = useMemo(
    () => [
      {
        id: "q1",
        title: "你的体重指数 [体重(Kg) / 身高(m)的平方] 是多少?",
        options: bmiOptions,
      },
      ...questions,
    ],
    [],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missing = [];
    if (bmiScore === null) missing.push("q1");

    for (const question of questions) {
      if (!answers[question.id]) {
        missing.push(question.id);
      }
    }

    setMissingQuestions(missing);

    if (missing.length > 0) {
      const target =
        document.querySelector(`[data-question-id="${missing[0]}"]`) ??
        document.getElementById("bmi-calculator-inputs");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const total =
      (bmiScore ?? 0) +
      Object.values(answers).reduce((sum, value) => sum + value, 0);
    setScore(total);

    window.setTimeout(() => {
      document
        .getElementById("score-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  return (
    <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-10 md:py-14">
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs font-black uppercase text-muted-foreground">
            Heat Tolerance
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight md:text-4xl">
            热耐力评分表
          </h2>
          <p className="mt-3 text-sm font-bold leading-7 text-muted-foreground">
            请输入身高体重，系统按原规则自动完成第 1 题。第 2 至第 18 题每题 1-5
            分，分数越高代表评估的热耐力越强。
          </p>

          <div
            className="mt-6 grid gap-3 rounded border-2 border-border bg-background p-4"
            id="bmi-calculator-inputs"
          >
            <label className="grid gap-2 text-sm font-black">
              身高 (cm)
              <input
                className="min-h-12 rounded border-2 border-border bg-background px-3 font-mono text-base font-bold outline-none transition focus:border-primary"
                id="height"
                inputMode="decimal"
                min="1"
                name="height"
                onChange={(event) => setHeight(event.target.value)}
                placeholder="例如: 175"
                type="number"
                value={height}
              />
            </label>
            <label className="grid gap-2 text-sm font-black">
              体重 (Kg)
              <input
                className="min-h-12 rounded border-2 border-border bg-background px-3 font-mono text-base font-bold outline-none transition focus:border-primary"
                id="weight"
                inputMode="decimal"
                min="1"
                name="weight"
                onChange={(event) => setWeight(event.target.value)}
                placeholder="例如: 70"
                step="0.1"
                type="number"
                value={weight}
              />
            </label>
            <div className="rounded border-2 border-border bg-muted/40 p-3">
              <p className="text-xs font-black text-muted-foreground">
                计算 BMI
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-primary">
                {bmi === null ? "-" : bmi.toFixed(1)}
              </p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                第 1 题自动选择：
                {bmiScore === null ? "待输入" : `${bmiScore} 分`}
              </p>
            </div>
          </div>

          <div
            className="mt-5 rounded border-2 border-primary bg-primary p-4 text-primary-foreground"
            id="score-section"
          >
            <p className="font-mono text-xs font-black uppercase opacity-80">
              Final Score
            </p>
            <p
              className="mt-1 text-6xl font-black leading-none"
              id="score-display"
            >
              {score ?? "-"}
            </p>
            <p className="mt-3 text-sm font-black" id="score-interpretation">
              {score === null
                ? "完成问卷后显示评估结果。"
                : interpretScore(score)}
            </p>
          </div>
        </aside>

        <form className="grid gap-4" id="rating-form" onSubmit={handleSubmit}>
          {missingQuestions.length > 0 ? (
            <div
              className="rounded border-2 border-primary bg-primary/10 p-4 text-sm font-black text-primary"
              role="alert"
            >
              请先完成所有突出显示的问题后再计算分数。
            </div>
          ) : null}

          {allQuestions.map((question, index) => {
            const isBmiQuestion = question.id === "q1";
            const selectedValue = isBmiQuestion
              ? bmiScore
              : (answers[question.id] ?? null);
            const isMissing = missingQuestions.includes(question.id);

            return (
              <fieldset
                className={`rounded border-2 bg-card p-4 text-card-foreground transition ${
                  isMissing
                    ? "border-primary shadow-[0_0_0_4px_rgba(217,48,37,0.18)]"
                    : "border-border"
                }`}
                data-question-id={question.id}
                key={question.id}
              >
                <legend className="mb-3 w-full font-black leading-7">
                  <span className="mr-2 font-mono text-primary">
                    {index + 1}.
                  </span>
                  {question.title}
                  {question.id === "q1" && bmi !== null ? (
                    <span className="ml-2 font-mono text-sm text-primary">
                      (BMI: {bmi.toFixed(1)})
                    </span>
                  ) : null}
                </legend>

                <div className="grid gap-2 md:grid-cols-5">
                  {question.options.map((option) => {
                    const optionId = `${question.id}-${option.value}`;
                    const checked = selectedValue === option.value;

                    return (
                      <label
                        className={`flex min-h-14 cursor-pointer items-center gap-2 rounded border-2 px-3 py-2 text-sm font-bold leading-5 transition ${
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
                        } ${
                          isBmiQuestion
                            ? "cursor-not-allowed opacity-80"
                            : "cursor-pointer"
                        }`}
                        htmlFor={optionId}
                        key={optionId}
                      >
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-primary"
                          disabled={isBmiQuestion}
                          id={optionId}
                          name={question.id}
                          onChange={() => {
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option.value,
                            }));
                            setMissingQuestions((current) =>
                              current.filter((id) => id !== question.id),
                            );
                          }}
                          type="radio"
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>

                {question.id === "q1" ? (
                  <p className="mt-3 text-xs font-bold text-muted-foreground">
                    此题根据上方输入的身高体重自动选择，无需手动操作。
                  </p>
                ) : null}

                {question.id === "q9" ? (
                  <label className="mt-3 grid gap-2 text-xs font-black text-muted-foreground sm:max-w-xs">
                    如了解, 可选填:
                    <input
                      className="min-h-10 rounded border-2 border-border bg-background px-3 font-mono text-sm font-bold text-foreground outline-none transition focus:border-primary"
                      inputMode="numeric"
                      name="q9_hr"
                      onChange={(event) =>
                        setAverageHeartRate(event.target.value)
                      }
                      placeholder="次/分"
                      type="number"
                      value={averageHeartRate}
                    />
                  </label>
                ) : null}

                {question.note ? (
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    {question.note}
                  </p>
                ) : null}
              </fieldset>
            );
          })}

          <button
            className="min-h-14 rounded border-2 border-foreground bg-primary px-5 text-lg font-black text-primary-foreground shadow-[5px_5px_0_rgba(18,49,60,0.18)] transition active:translate-x-1 active:translate-y-1 dark:border-border"
            type="submit"
          >
            计算总分
          </button>
        </form>
      </div>
    </section>
  );
}
