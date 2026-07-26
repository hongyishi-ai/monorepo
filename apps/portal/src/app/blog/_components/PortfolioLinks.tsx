import Image from "next/image";
import styles from "@/app/_styles/constructivism.module.css";
import {
  auxiliaryEntries,
  getProjectContentStatusLabel,
  getProjectEntryKindLabel,
  isExternalProject,
  platformProjects,
} from "@/lib/projects";

const colorStyles = {
  red: `${styles["neoButton--red"]}`,
  blue: `${styles["neoButton--blue"]}`,
  yellow: `${styles["neoButton--yellow"]}`,
  gray: `${styles["neoButton--gray"]}`,
};

export function PortfolioLinks() {
  return (
    <section aria-labelledby="platform-status-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400">
            HONGYISHI.CN
          </p>
          <h2
            className="mt-2 text-2xl font-black text-neutral-950 dark:text-white"
            id="platform-status-title"
          >
            当前站内项目
          </h2>
        </div>
        <p className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
          统一 Next 入口 · 内容持续复核
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {platformProjects.map((project) => (
          <a
            className={`group relative bg-white p-5 dark:bg-black ${styles.neoButton} ${colorStyles[project.color]}`}
            href={project.href}
            key={project.href}
          >
            <div className="mb-4 flex items-center gap-3">
              <Image
                alt=""
                aria-hidden="true"
                height={32}
                src={project.logo}
                width={32}
              />
              <h3 className="font-mono text-base font-bold uppercase tracking-normal">
                {project.shortTitle}
              </h3>
            </div>
            <p className="text-sm font-medium leading-6 text-neutral-700 dark:text-neutral-300">
              {project.content.entryLabel ?? project.description}
            </p>
            <p className="mt-4 border-t border-neutral-200 pt-3 font-mono text-xs font-bold text-neutral-500 dark:border-white/15 dark:text-neutral-400">
              {getProjectContentStatusLabel(project.content.status)} ·{" "}
              {project.content.reviewedAt}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-neutral-200 pt-5 text-sm dark:border-white/15">
        {auxiliaryEntries.map((entry) => {
          const isExternal = isExternalProject(entry);

          return (
            <a
              className="font-bold text-neutral-700 underline decoration-constructivism-red decoration-2 underline-offset-4 transition-colors hover:text-constructivism-red dark:text-neutral-300"
              href={entry.href}
              key={entry.href}
              rel={isExternal ? "noopener noreferrer" : undefined}
              target={isExternal ? "_blank" : undefined}
            >
              {entry.shortTitle} · {getProjectEntryKindLabel(entry)}
            </a>
          );
        })}
      </div>
    </section>
  );
}
