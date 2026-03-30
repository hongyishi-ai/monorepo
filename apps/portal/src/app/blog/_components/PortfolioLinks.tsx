import Image from "next/image";

type ProjectCard = { 
  title: string; 
  desc: string; 
  href: string; 
  logo: string;
  color: 'red' | 'blue' | 'yellow' | 'gray';
};

const projects: ProjectCard[] = [
  {
    title: "训练伤防治",
    desc: "运动评估与训练伤预防。",
    href: "https://fms.hongyishi.cn",
    logo: "/assets/portfolio/fms/logo.png",
    color: "gray",
  },
  {
    title: "辅助诊断",
    desc: "临床辅助决策与知识工具。",
    href: "https://clinic.hongyishi.cn",
    logo: "/assets/portfolio/clinic/logo.png",
    color: "blue",
  },
  {
    title: "热射病防治",
    desc: "热相关疾病应急处置与宣教。",
    href: "https://reshebing.hongyishi.cn",
    logo: "/assets/portfolio/reshebing/logo.png",
    color: "red",
  },
  {
    title: "移动药房",
    desc: "用药查询、药事协作与流动场景。",
    href: "https://yf.hongyishi.cn",
    logo: "/assets/portfolio/yf/logo.png",
    color: "yellow",
  },
  {
    title: "播客",
    desc: "音频访谈与主题讨论。",
    href: "https://www.xiaoyuzhoufm.com/podcast/6818ac762ad01a51a25ce2c9",
    logo: "/assets/portfolio/podcast/logo.png",
    color: "gray",
  },
];

import styles from "@/app/_styles/constructivism.module.css";

const colorStyles = {
  red: `${styles["neoButton--red"]}`,
  blue: `${styles["neoButton--blue"]}`,
  yellow: `${styles["neoButton--yellow"]}`,
  gray: `${styles["neoButton--gray"]}`,
};

export function PortfolioLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {projects.map((project) => (
        <a
          key={project.href}
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className={`
            group relative p-6 
            bg-white dark:bg-black
            ${styles.neoButton} ${colorStyles[project.color]}
          `}
        >
          <div className="flex items-center gap-3 mb-3">
            <Image src={project.logo} alt={project.title} width={32} height={32} />
            <h3 className="font-mono text-base font-bold tracking-tight uppercase">
              {project.title}
            </h3>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-400 leading-relaxed">
            {project.desc}
          </p>
        </a>
      ))}
    </div>
  );
}

