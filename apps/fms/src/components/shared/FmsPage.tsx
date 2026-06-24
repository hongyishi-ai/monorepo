import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, HelpCircle } from "lucide-react";

import { TourHelpButton } from "@/components/ui/tour-help-button";
import { cn } from "@/lib/utils";

export interface FmsGuideStep {
  title: string;
  description: string;
}

interface FmsPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function FmsPageHeader({
  eyebrow = "红医师 / 训练伤防治",
  title,
  description,
  className,
  children,
}: FmsPageHeaderProps) {
  return (
    <header
      className={cn(
        "t-stagger mx-auto mb-10 max-w-4xl text-center md:mb-14",
        className,
      )}
      data-tour-id="page-header"
    >
      <p className="t-stagger-line t-stagger-line--1 hys-kicker mb-4">
        {eyebrow}
      </p>
      <h1 className="t-stagger-line t-stagger-line--2 hys-title">{title}</h1>
      <div className="t-stagger-line t-stagger-line--3 hys-subtitle mx-auto mt-6 max-w-3xl">
        {description}
      </div>
      {children && (
        <div className="t-stagger-line t-stagger-line--4 mt-6">{children}</div>
      )}
    </header>
  );
}

interface FmsGuidePanelProps {
  title?: string;
  summary: string;
  steps: FmsGuideStep[];
  boundary?: string;
  className?: string;
  tourId?: string;
}

export function FmsGuidePanel({
  title = "使用引导",
  summary,
  steps,
  boundary,
  className,
  tourId = "page-guide",
}: FmsGuidePanelProps) {
  return (
    <section
      className={cn(
        "t-stagger hys-guide-panel hys-card mb-8 md:mb-10",
        className,
      )}
      data-hys-fms-guide-panel
      data-tour-id={tourId}
      aria-label={title}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="t-stagger-line t-stagger-line--1 flex min-w-0 items-start gap-3">
          <span className="hys-guide-panel__marker">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="hys-kicker text-xs">{title}</p>
            <p className="font-bold text-foreground">{summary}</p>
            <p className="sr-only">
              {steps
                .map(
                  (step, index) =>
                    `${index + 1}. ${step.title}：${step.description}`,
                )
                .join(" ")}
              {boundary ? ` ${boundary}` : ""}
            </p>
          </div>
        </div>
        <TourHelpButton
          variant="outline"
          size="sm"
          showText
          label="打开引导"
          className="hys-guide-panel__action"
        />
      </div>
    </section>
  );
}

interface FmsMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
  tourId?: string;
}

export function FmsMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  className,
  tourId,
}: FmsMetricCardProps) {
  return (
    <article
      className={cn("hys-status-tile hys-card", className)}
      data-tour-id={tourId}
    >
      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <div className="hys-status-tile__value">{value}</div>
        <div className="hys-status-tile__label">{label}</div>
        {detail && <div className="hys-status-tile__detail">{detail}</div>}
      </div>
    </article>
  );
}

interface FmsEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function FmsEmptyState({
  icon: Icon = CheckCircle2,
  title,
  description,
  children,
  className,
}: FmsEmptyStateProps) {
  return (
    <div
      className={cn(
        "t-stagger hys-empty-state hys-card mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <Icon
        className="t-stagger-line t-stagger-line--1 mx-auto mb-4 h-10 w-10 text-primary"
        aria-hidden="true"
      />
      <h1 className="t-stagger-line t-stagger-line--2 hys-title text-2xl">
        {title}
      </h1>
      <div className="t-stagger-line t-stagger-line--3 hys-text mx-auto mt-4 max-w-md">
        {description}
      </div>
      {children && (
        <div className="t-stagger-line t-stagger-line--4 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {children}
        </div>
      )}
    </div>
  );
}
