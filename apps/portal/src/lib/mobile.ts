import { getProjectById, platformProjects } from './projects';
import { taskEntries, type HongyishiTaskUrgency } from './task-entries';

export type MobileTabIcon = 'bolt' | 'grid' | 'record' | 'book';
export type MobileTabId = 'action' | 'tools' | 'records' | 'library';

export type MobileTab = {
  id: MobileTabId;
  label: string;
  href: string;
  icon: MobileTabIcon;
};

export type MobileQuickAction = {
  id: string;
  label: string;
  intent: string;
  href: string;
  urgency: HongyishiTaskUrgency;
  projectTitle: string;
  posterImage: string;
  sourceNote: string;
};

const fallbackPosterImage = '/assets/brand-posters/hongyishi-brand.jpg';

export const mobileTabs: MobileTab[] = [
  { id: 'action', label: '处置', href: '/?tab=action', icon: 'bolt' },
  { id: 'tools', label: '工具', href: '/?tab=tools', icon: 'grid' },
  { id: 'records', label: '记录', href: '/?tab=records', icon: 'record' },
  { id: 'library', label: '资料', href: '/?tab=library', icon: 'book' },
];

export const mobileQuickActions: MobileQuickAction[] = taskEntries.map((entry) => {
  const project = platformProjects.find((item) => item.id === entry.projectId);
  const entryProject = getProjectById(entry.projectId);

  return {
    ...entry,
    urgency: entry.urgency,
    projectTitle: entryProject?.shortTitle ?? '红医师',
    posterImage: project?.coverImage ?? fallbackPosterImage,
  };
});

export const mobilePosterProjects = platformProjects;
