'use client'

export function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-700 underline underline-offset-4 decoration-neutral-400 transition-colors duration-200 hover:text-neutral-900 hover:decoration-neutral-600 dark:text-slate-300 dark:decoration-slate-500 dark:hover:text-slate-100 dark:hover:decoration-slate-300"
      aria-label="返回顶部"
    >
      <span>返回顶部</span>
      <span aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5">
        ^
      </span>
    </button>
  )
}
