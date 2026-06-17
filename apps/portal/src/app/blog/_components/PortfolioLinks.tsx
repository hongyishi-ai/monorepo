import Image from "next/image";
import styles from "@/app/_styles/constructivism.module.css";
import { getProjectEntryKindLabel, isExternalProject, platformEntryLinks } from "@/lib/projects";

const colorStyles = {
  red: `${styles["neoButton--red"]}`,
  blue: `${styles["neoButton--blue"]}`,
  yellow: `${styles["neoButton--yellow"]}`,
  gray: `${styles["neoButton--gray"]}`,
};

export function PortfolioLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {platformEntryLinks.map((project) => {
        const isExternal = isExternalProject(project);
        return (
        <a
          key={project.href}
          href={project.href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={`
            group relative p-6 
            bg-white dark:bg-black
            ${styles.neoButton} ${colorStyles[project.color]}
          `}
        >
          <div className="flex items-center gap-3 mb-3">
            <Image src={project.logo} alt={project.shortTitle} width={32} height={32} />
            <h3 className="font-mono text-base font-bold tracking-tight uppercase">
              {project.shortTitle}
            </h3>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed">
            {project.description}
          </p>
          <p className="mt-4 font-mono text-xs font-bold uppercase text-neutral-500 dark:text-neutral-500">
            {getProjectEntryKindLabel(project)}
          </p>
        </a>
      )})}
    </div>
  );
}
