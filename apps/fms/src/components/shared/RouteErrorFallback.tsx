import { Link, useRouteError } from 'react-router-dom';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '页面加载失败';
}

export function RouteErrorPanel({ message = '页面加载失败' }: { message?: string }) {
  return (
    <main className="hys-section flex min-h-screen items-center justify-center px-6 py-12">
      <section
        role="alert"
        className="w-full max-w-xl border-2 border-black bg-paper p-6 shadow-[6px_6px_0_0_#A51F18]"
      >
        <p className="mb-2 font-mono text-xs font-bold uppercase text-muted-foreground">
          HONG YISHI FMS
        </p>
        <h1 className="mb-3 text-2xl font-black text-foreground">模块暂时无法加载</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <Link
          to="/"
          className="inline-flex border-2 border-black bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_0_#111]"
        >
          返回首页
        </Link>
      </section>
    </main>
  );
}

export default function RouteErrorFallback() {
  const error = useRouteError();

  return <RouteErrorPanel message={getErrorMessage(error)} />;
}
