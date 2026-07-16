"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type TcccFlowChoice = {
  id: string;
  label: string;
  nextNodeId: string;
  tone?: "primary" | "caution";
};

export type TcccFlowNode = {
  id: string;
  type: "intro" | "choice" | "action" | "complete";
  eyebrow: string;
  title: string;
  body: string;
  progress: number;
  capability?: "全员" | "医护" | "专业人员";
  details?: string[];
  cautions?: string[];
  choices?: TcccFlowChoice[];
  nextNodeId?: string;
  nextLabel?: string;
};

export type TcccFlowDefinition = {
  title: string;
  version: string;
  sourceSection: string;
  startNodeId: string;
  nextModuleHref: string;
  nextModuleLabel: string;
  nodes: TcccFlowNode[];
};

type TcccDecisionFlowProps = {
  definition: TcccFlowDefinition;
};

const transitionDuration = 180;

function choiceClass(tone: TcccFlowChoice["tone"]) {
  if (tone === "caution") {
    return "border-primary bg-primary/10 text-foreground hover:bg-primary hover:text-primary-foreground";
  }

  return "border-foreground bg-card text-card-foreground hover:bg-foreground hover:text-background";
}

export function TcccDecisionFlow({ definition }: TcccDecisionFlowProps) {
  const nodeById = useMemo(
    () => new Map(definition.nodes.map((node) => [node.id, node])),
    [definition.nodes],
  );
  const [currentNodeId, setCurrentNodeId] = useState(definition.startNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentNode = nodeById.get(currentNodeId);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);

    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [currentNodeId]);

  if (!currentNode) {
    throw new Error(`Missing TCCC flow node: ${currentNodeId}`);
  }

  function transitionTo(targetNodeId: string, nextHistory: string[]) {
    if (!nodeById.has(targetNodeId) || isExiting) return;

    const commit = () => {
      setHistory(nextHistory);
      setCurrentNodeId(targetNodeId);
      setIsExiting(false);
    };

    if (reduceMotion) {
      commit();
      return;
    }

    setIsExiting(true);
    timerRef.current = setTimeout(commit, transitionDuration);
  }

  function goForward(targetNodeId: string) {
    transitionTo(targetNodeId, [...history, currentNodeId]);
  }

  function goBack() {
    const previousNodeId = history.at(-1);
    if (!previousNodeId) return;
    transitionTo(previousNodeId, history.slice(0, -1));
  }

  function restart() {
    transitionTo(definition.startNodeId, []);
  }

  return (
    <section
      aria-label={definition.title}
      className="relative isolate overflow-x-clip bg-background py-5 md:py-12"
      data-tccc-decision-flow
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(18,49,60,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,49,60,0.06)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(rgba(244,236,220,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.05)_1px,transparent_1px)]" />

      <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] grid-cols-1 gap-4 lg:grid-cols-[0.32fr_0.68fr] lg:grid-rows-[auto_1fr] lg:gap-x-5 lg:gap-y-0">
        <aside className="hidden min-w-0 border-r-2 border-border pr-6 pt-2 lg:col-start-1 lg:row-start-1 lg:block">
          <p className="font-mono text-xs font-black text-muted-foreground">
            {definition.sourceSection}
          </p>
          <p
            className="mt-4 text-5xl font-black leading-none text-primary"
            aria-hidden="true"
          >
            TCCC
          </p>
          <p className="mt-5 text-xl font-black text-foreground">
            {definition.title}
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
            根据伤员当前表现作出选择，完成处置后持续复评，直至当前问题得到控制。
          </p>
        </aside>

        <div
          className="sticky top-[84px] z-30 self-start rounded border-2 border-border bg-background/95 p-2 shadow-[0_4px_0_hsl(var(--border)/0.08)] backdrop-blur lg:top-[96px] lg:col-start-1 lg:row-start-2 lg:mt-0 lg:rounded-none lg:border-0 lg:border-r-2 lg:bg-background/90 lg:p-0 lg:pr-6 lg:pt-6 lg:shadow-none"
          data-tccc-mobile-controls
        >
          <div className="flex items-center gap-2 lg:block">
            <div
              className="min-w-0 flex-1"
              aria-label={`流程进度 ${currentNode.progress}%`}
            >
              <div className="flex items-center justify-between gap-3 text-xs font-black text-muted-foreground">
                <span>流程进度</span>
                <span className="font-mono">{currentNode.progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded border border-border bg-muted lg:mt-2 lg:h-3 lg:border-2">
                <div
                  className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${currentNode.progress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-none gap-2 lg:mt-5 lg:flex-wrap">
              <button
                aria-label="返回上一步"
                className="min-h-11 rounded border-2 border-border bg-card px-2.5 text-xs font-black text-card-foreground disabled:cursor-not-allowed disabled:opacity-35 lg:px-3 lg:text-sm"
                data-tccc-back
                disabled={history.length === 0 || isExiting}
                onClick={goBack}
                type="button"
              >
                <span className="lg:hidden">上一步</span>
                <span className="hidden lg:inline">返回上一步</span>
              </button>
              <button
                aria-label="重新开始"
                className="min-h-11 rounded border-2 border-border bg-background px-2.5 text-xs font-black text-muted-foreground disabled:cursor-not-allowed disabled:opacity-35 lg:px-3 lg:text-sm"
                data-tccc-restart
                disabled={currentNodeId === definition.startNodeId || isExiting}
                onClick={restart}
                type="button"
              >
                <span className="lg:hidden">重置</span>
                <span className="hidden lg:inline">重新开始</span>
              </button>
            </div>
          </div>
        </div>

        <div
          aria-live="polite"
          className={`min-w-0 rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)] transition-[opacity,transform] duration-200 motion-reduce:transition-none md:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)] ${
            isExiting
              ? "translate-y-3 scale-[0.99] opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }`}
          data-tccc-current-node={currentNode.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-border pb-4">
            <div>
              <p className="font-mono text-xs font-black text-muted-foreground">
                {currentNode.eyebrow}
              </p>
              <h1
                className="mt-2 text-[clamp(2rem,9vw,4.5rem)] font-black leading-[0.95] text-primary outline-none"
                ref={headingRef}
                tabIndex={-1}
              >
                {currentNode.title}
              </h1>
            </div>
            {currentNode.capability ? (
              <span className="rounded border-2 border-border bg-muted px-3 py-2 text-xs font-black text-foreground">
                能力等级：{currentNode.capability}
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-base font-bold leading-8 text-muted-foreground md:text-lg">
            {currentNode.body}
          </p>

          {currentNode.details?.length ? (
            <ul className="mt-5 divide-y-2 divide-border border-y-2 border-border text-sm font-bold leading-7 text-foreground">
              {currentNode.details.map((detail) => (
                <li className="py-3" key={detail}>
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}

          {currentNode.cautions?.length ? (
            <div className="mt-5 border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm font-black leading-7 text-foreground">
              {currentNode.cautions.map((caution) => (
                <p key={caution}>{caution}</p>
              ))}
            </div>
          ) : null}

          {currentNode.type === "choice" ? (
            <div className="mt-7 grid grid-cols-1 gap-3" data-tccc-choices>
              {currentNode.choices?.map((choice) => (
                <button
                  className={`min-h-14 rounded border-2 px-4 py-3 text-left text-base font-black leading-6 transition-colors disabled:cursor-wait disabled:opacity-60 ${choiceClass(
                    choice.tone,
                  )}`}
                  data-tccc-choice={choice.id}
                  disabled={isExiting}
                  key={choice.id}
                  onClick={() => goForward(choice.nextNodeId)}
                  type="button"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}

          {currentNode.type === "intro" || currentNode.type === "action" ? (
            <button
              className="mt-7 min-h-14 w-full rounded border-2 border-foreground bg-primary px-5 py-3 text-lg font-black text-primary-foreground shadow-[5px_5px_0_rgba(18,49,60,0.18)] transition active:translate-x-1 active:translate-y-1 disabled:cursor-wait disabled:opacity-60 dark:border-border"
              data-tccc-next
              disabled={!currentNode.nextNodeId || isExiting}
              onClick={() =>
                currentNode.nextNodeId && goForward(currentNode.nextNodeId)
              }
              type="button"
            >
              {currentNode.nextLabel ?? "下一步"}
            </button>
          ) : null}

          {currentNode.type === "complete" ? (
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                className="inline-flex min-h-14 items-center justify-center rounded border-2 border-foreground bg-foreground px-5 text-center text-lg font-black text-background no-underline transition-transform active:translate-x-1 active:translate-y-1"
                data-tccc-next-module
                href={definition.nextModuleHref}
              >
                {definition.nextModuleLabel}
              </a>
              <button
                className="min-h-14 rounded border-2 border-border bg-card px-5 text-lg font-black text-card-foreground"
                onClick={restart}
                type="button"
              >
                再练一次
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
