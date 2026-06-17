import { getProjectById, getProjectEntryKind, isExternalProject, platformProjects } from '@/lib/projects';
import { getTaskUrgencyLabel, taskEntries } from '@/lib/task-entries';
import styles from '@/app/_styles/constructivism.module.css';

export function PortfolioHero() {
  const integratedProjects = platformProjects.filter((project) => project.status === 'integrated');
  const externalProjects = platformProjects.filter((project) => project.status === 'external');

  return (
    <header className={`${styles.posterSurface} relative min-h-[84vh] px-6 md:px-8 pt-20 pb-14 border-b-4 border-constructivism-red dark:border-constructivism-red overflow-hidden transition-colors duration-300`}>
      <div
        className="absolute inset-y-0 left-0 w-2 bg-constructivism-red"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 right-0 top-[46%] h-px bg-constructivism-red/70"
        aria-hidden="true"
      />
      <div className={`${styles.ecgLine} absolute left-0 right-0 top-[46%]`} aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
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
            HONGYISHI.CN / FIELD MEDICAL SOFTWARE PLATFORM
          </p>

          <h1
            className="max-w-5xl text-7xl md:text-9xl lg:text-[10rem] font-black leading-[0.86] text-constructivism-red transition-colors duration-300"
          >
            红医师
          </h1>

          <div className="mt-2 inline-block bg-[#12313c] px-3 py-1 text-5xl md:text-7xl lg:text-8xl font-black leading-none text-[#f4ecdc] dark:bg-[#f4ecdc] dark:text-[#12313c]">
            统一入口
          </div>

          <p className="mt-8 max-w-2xl text-lg md:text-xl leading-8 text-neutral-800 dark:text-neutral-300">
            以赤诚，护生命。训练伤防治、热射病防治、战场救护、辅助诊断、移动药房与内容系统归入同一品牌入口，先接好可用工具，再统一体验和部署边界。
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

        <aside className="border-3 border-black bg-[#f4ecdc] p-5 shadow-[8px_8px_0_rgba(0,0,0,0.25)] dark:border-white/30 dark:bg-neutral-950 dark:shadow-[8px_8px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <p className="font-mono text-xs text-neutral-500">PLATFORM STATUS</p>
            <span className="bg-constructivism-red px-2 py-1 font-mono text-xs font-bold text-white">
              LIVE
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-3 py-5">
            <div className="border border-neutral-200 p-3 dark:border-neutral-800">
              <dt className="font-mono text-xs text-neutral-500">已整合</dt>
              <dd className="mt-2 text-4xl font-bold text-black dark:text-white">
                {integratedProjects.length}
              </dd>
            </div>
            <div className="border border-neutral-200 p-3 dark:border-neutral-800">
              <dt className="font-mono text-xs text-neutral-500">外部运行</dt>
              <dd className="mt-2 text-4xl font-bold text-black dark:text-white">
                {externalProjects.length}
              </dd>
            </div>
          </dl>

          <div className="space-y-3">
            {platformProjects.map((project, index) => (
              <a
                key={project.id}
                href={project.href}
                target={isExternalProject(project) ? '_blank' : undefined}
                rel={isExternalProject(project) ? 'noopener noreferrer' : undefined}
                className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border border-neutral-200 p-3 transition-colors hover:border-constructivism-red dark:border-neutral-800 dark:hover:border-constructivism-red"
              >
                <span className="font-mono text-sm text-neutral-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 font-medium text-black dark:text-white">
                  {project.shortTitle}
                </span>
                <span className="font-mono text-xs text-neutral-500 group-hover:text-constructivism-red">
                  {getProjectEntryKind(project) === 'internal' ? 'IN' : 'OUT'}
                </span>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </header>
  );
}
