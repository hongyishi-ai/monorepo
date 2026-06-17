export function AboutSection() {
  const rules = [
    ['01', '注册入口', '新增项目先写入统一项目注册表，首页、博客入口和部署路径共用一份数据。'],
    ['02', '共享品牌', '颜色、圆角、字体和路径约定从 @hongyishi/ui 输出，避免每个项目自建一套视觉语言。'],
    ['03', '内容可信', '项目必须声明来源、版本、复核日期、适用对象、免责声明和数据保存方式。'],
    ['04', '免费层优先', '默认走 Cloudflare Pages 静态站、Functions 代理和本机存储，不引入付费数据库。'],
    ['05', '功能迁移', '重构界面时默认迁移原功能、离线能力、说明文档和关键流程，不做静默删减。'],
    ['06', '安全性能', '静态资源缓存、API 密钥代理、安全响应头和 CSP 基线随 Cloudflare 构建生成。'],
  ];

  return (
    <section
      className="max-w-7xl mx-auto px-6 md:px-8 py-24 border-t border-neutral-200 dark:border-neutral-700 transition-colors duration-300"
      aria-labelledby="about-title"
    >
      <h2
        id="about-title"
        className="font-mono text-base md:text-lg text-neutral-500 dark:text-neutral-500 uppercase tracking-wide mb-8 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-full before:bg-constructivism-red transition-colors duration-300"
      >
        平台规则
      </h2>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <div>
          <p className="max-w-3xl text-2xl md:text-4xl font-bold leading-tight text-black dark:text-white transition-colors duration-300">
            每个红医师项目都应像同一套系统里的工具，而不是散落在不同域名上的页面。
          </p>

          <p className="mt-6 max-w-3xl text-lg md:text-xl leading-relaxed text-neutral-700 dark:text-neutral-300 transition-colors duration-300">
            统一入口负责品牌、导航、状态、部署和安全边界。各子项目保留原始内容与流程，再逐步迁移到共享 UI token、移动端触控尺度和一致的风险提示语言。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {['视觉一致', '功能保留', '安全可审'].map((label) => (
              <div
                key={label}
                className="border-3 border-black bg-white px-4 py-5 text-center font-mono text-sm font-bold text-black shadow-[5px_5px_0_rgba(0,0,0,0.25)] dark:border-white/30 dark:bg-neutral-950 dark:text-white dark:shadow-[5px_5px_0_rgba(255,255,255,0.08)]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="border-3 border-black bg-[#f4ecdc] p-5 dark:border-white/30 dark:bg-neutral-950">
          <p className="font-mono text-xs text-neutral-600 dark:text-neutral-500">EXTENSION CONTRACT</p>
          <ol className="mt-5 space-y-4">
            {rules.map(([index, title, body]) => (
              <li
                key={index}
                className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-t border-black/15 pt-4 dark:border-white/10"
              >
                <span className="font-mono text-sm font-bold text-constructivism-red">{index}</span>
                <span>
                  <strong className="block text-base text-black dark:text-white">{title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-neutral-700 dark:text-neutral-400">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
