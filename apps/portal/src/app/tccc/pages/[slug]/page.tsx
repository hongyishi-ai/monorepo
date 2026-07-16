import { notFound } from "next/navigation";
import { TcccModulePage } from "../../_components/TcccModulePage";
import { tcccModuleBySlug, tcccModules } from "../../_data/tcccFlowRegistry";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return tcccModules
    .filter((module) => module.slug !== "tfc-airway")
    .map((module) => ({ slug: module.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const module = tcccModuleBySlug.get(slug);

  if (!module) return {};

  return {
    title: `${module.title}决策训练 | 红医师`,
    description: `${module.summary} 依据 JTS / CoTCCC 2026-05-01 指南复核。`,
  };
}

export default async function TcccDynamicModulePage({ params }: PageProps) {
  const { slug } = await params;
  const module = tcccModuleBySlug.get(slug);

  if (!module || module.slug === "tfc-airway") notFound();

  return <TcccModulePage module={module} />;
}
