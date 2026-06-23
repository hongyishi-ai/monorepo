import Link from 'next/link';

export const metadata = {
  title: '离线可用 | 红医师',
  description: '红医师离线状态提示与本地工具入口。',
};

const offlineLinks = [
  { href: '/', label: '回到主站', note: '查看已缓存的一线工具入口' },
  { href: '/heat-stroke/', label: '热射病防治', note: '热指数、现场处置与预防资料' },
  { href: '/fms/', label: '训练伤防治', note: '本机记录与 FMS 评估入口' },
  { href: '/tccc/', label: '战场救护', note: 'TCCC 流程与训练资料' },
];

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#f4ecdc] px-6 py-10 text-black dark:bg-black dark:text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <Link
          href="/"
          className="mb-10 inline-flex w-fit items-center gap-3 font-mono text-lg font-black text-constructivism-red"
        >
          <span className="h-3 w-3 bg-constructivism-red" aria-hidden="true" />
          红医师
        </Link>

        <p className="font-mono text-xs uppercase text-neutral-600 dark:text-neutral-400">
          OFFLINE / LOCAL FIRST
        </p>
        <h1 className="mt-4 text-5xl font-black leading-none text-constructivism-red md:text-7xl">
          当前离线
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-800 dark:text-neutral-300">
          网络暂时不可用。已经缓存的页面和本机记录仍可继续查看；需要天气、外部资料或同步内容时，请恢复网络后再刷新。
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {offlineLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-3 border-black bg-[#fff8ed] p-4 transition-transform hover:-translate-y-1 hover:border-constructivism-red dark:border-white/30 dark:bg-neutral-950"
            >
              <span className="block text-xl font-black">{item.label}</span>
              <span className="mt-2 block text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {item.note}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
