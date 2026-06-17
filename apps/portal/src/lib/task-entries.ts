import registry from './task-entries.json';

export type HongyishiTaskUrgency = 'immediate' | 'guided' | 'lookup' | 'local';

export type HongyishiTaskEntry = {
  id: string;
  projectId: string;
  label: string;
  intent: string;
  href: string;
  urgency: HongyishiTaskUrgency;
  sourceNote: string;
};

export const taskUrgencyLabels = {
  immediate: '立即',
  guided: '评估',
  lookup: '查询',
  local: '本机',
} as const satisfies Record<HongyishiTaskUrgency, string>;

export const taskEntries = registry as HongyishiTaskEntry[];

export function getTaskUrgencyLabel(urgency: HongyishiTaskUrgency) {
  return taskUrgencyLabels[urgency];
}
