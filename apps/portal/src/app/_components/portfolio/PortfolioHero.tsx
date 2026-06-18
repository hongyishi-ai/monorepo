import { getProjectById } from '@/lib/projects';
import { getTaskUrgencyLabel, taskEntries } from '@/lib/task-entries';
import styles from '@/app/_styles/constructivism.module.css';

export function PortfolioHero() {
  return (
    <header className={`${styles.posterSurface} relative px-6 md:px-8 pt-20 pb-14 border-b-4 border-constructivism-red dark:border-constructivism-red overflow-hidden transition-colors duration-300`}>
      <div
        className="absolute inset-y-0 left-0 w-2 bg-constructivism-red"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 right-0 top-[46%] h-px bg-constructivism-red/70"
        aria-hidden="true"
      />
      <div className={`${styles.ecgLine} absolute left-0 right-0 top-[46%]`} aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div>
          <a
            href="/"
            className="inline-flex items-center gap-3 font-mono text-xl md:text-2xl font-bold text-constructivism-red dark:text-constructivism-red mb-8 hover:translate-x-1 transition-all duration-300"
            aria-label="红医师主页"
          >
            <span className="h-4 w-4 bg-constructivism-red" aria-hidden="true" />
            红医师
          </a>

          <p className="font-mono text-xs md:text-sm text-neutral-700 dark:text-neutral-400 mb-4">
            HONGYISHI.CN / 一线医疗工具
          </p>

          <h1
            className="max-w-5xl text-7xl md:text-9xl lg:text-[10rem] font-black leading-[0.86] text-constructivism-red transition-colors duration-300"
          >
            红医师
          </h1>

          <p className="mt-8 max-w-2xl text-lg md:text-xl leading-8 text-neutral-800 dark:text-neutral-300">
            以赤诚，护生命。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {taskEntries.map((entry) => {
              const project = getProjectById(entry.projectId);

              return (
                <a
                  key={entry.id}
                  href={entry.href}
                  className="group border-3 border-black bg-[#f4ecdc] p-4 text-left transition-transform duration-300 hover:-translate-y-1 hover:border-constructivism-red dark:border-white/30 dark:bg-neutral-950"
                >
                  <span className="inline-flex min-h-7 items-center bg-black px-2 font-mono text-xs font-bold text-white group-hover:bg-constructivism-red">
                    {getTaskUrgencyLabel(entry.urgency)}
                  </span>
                  <span className="mt-3 block text-xl font-bold text-black dark:text-white">
                    {entry.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-neutral-700 dark:text-neutral-300">
                    {entry.intent}
                  </span>
                  <span className="mt-4 block font-mono text-[0.68rem] leading-5 text-neutral-500 dark:text-neutral-500">
                    {project?.shortTitle ?? entry.projectId} · {entry.sourceNote}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
