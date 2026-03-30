import Container from "@/app/_components/container";
import { PortfolioLinks } from "@/app/blog/_components/PortfolioLinks";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-black">
      <Container>
        <div className="py-14">
          <PortfolioLinks />

          <div className="mt-10 flex items-center justify-center text-sm text-neutral-700 dark:text-white/70">
            联系：
            <a
              href="mailto:nimrod1990@163.com"
              className="ml-1 underline underline-offset-4 hover:text-neutral-800 dark:hover:text-slate-200"
            >
              nimrod1990@163.com
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
