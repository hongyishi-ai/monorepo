import registry from './projects.json';

export type HongyishiProjectStatus = 'integrated' | 'external' | 'planned';
export type HongyishiProjectColor = 'red' | 'blue' | 'yellow' | 'gray';
export type HongyishiProjectContentStatus = 'current' | 'review-required' | 'reference-only';

export type HongyishiProjectContent = {
  sourceName: string;
  version: string;
  reviewedAt: string;
  status: HongyishiProjectContentStatus;
  audience: string;
  disclaimer: string;
  entryLabel?: string;
  dataPolicy?: string;
  officialUpdateUrl?: string;
};

type HongyishiProjectBase = {
  id: string;
  title: string;
  shortTitle: string;
  type: string;
  description: string;
  href: string;
  legacyHref?: string;
  logo: string;
  color: HongyishiProjectColor;
  featured?: boolean;
  status: HongyishiProjectStatus;
  content?: HongyishiProjectContent;
};

export type HongyishiPlatformProject = HongyishiProjectBase & {
  coverImage: string;
  content: HongyishiProjectContent;
};

export type HongyishiAuxiliaryEntry = HongyishiProjectBase;

export type HongyishiEntry = HongyishiPlatformProject | HongyishiAuxiliaryEntry;

export const projectStatusLabels = {
  integrated: '已整合',
  external: '外部运行',
  planned: '计划整合',
} as const satisfies Record<HongyishiProjectStatus, string>;

export const projectEntryKindLabels = {
  internal: '站内入口',
  external: '外部链接',
} as const;

export const projectContentStatusLabels = {
  current: '已复核',
  'review-required': '待复核',
  'reference-only': '参考资料',
} as const satisfies Record<HongyishiProjectContentStatus, string>;

export const platformProjects = registry.platformProjects as HongyishiPlatformProject[];
export const auxiliaryEntries = registry.auxiliaryEntries as HongyishiAuxiliaryEntry[];
export const platformEntryLinks: HongyishiEntry[] = [...platformProjects, ...auxiliaryEntries];

export function isExternalProject(project: Pick<HongyishiEntry, 'href' | 'status'>) {
  return project.status === 'external' || /^https?:\/\//.test(project.href);
}

export function getProjectStatusLabel(status: HongyishiProjectStatus) {
  return projectStatusLabels[status];
}

export function getProjectContentStatusLabel(status: HongyishiProjectContentStatus) {
  return projectContentStatusLabels[status];
}

export function getProjectEntryKind(project: Pick<HongyishiEntry, 'href' | 'status'>) {
  return isExternalProject(project) ? 'external' : 'internal';
}

export function getProjectEntryKindLabel(project: Pick<HongyishiEntry, 'href' | 'status'>) {
  return projectEntryKindLabels[getProjectEntryKind(project)];
}

export function getProjectById(id: string) {
  return platformEntryLinks.find((project) => project.id === id);
}
