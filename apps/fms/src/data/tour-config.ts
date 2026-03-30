import type { TourStep, TourConfig } from '@/components/ui/product-tour';
import { BookOpen, Zap, Shield, Users } from 'lucide-react';
import { createElement as h } from 'react';

// 主页引导步骤
export const homePageTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 FMS 系统',
    description: '功能性动作筛查系统帮助您科学评估动作模式，获取个性化康复训练指导。让我们开始探索这个专业的评估工具。',
    placement: 'center',
    content: h('div', { className: 'flex items-center gap-3 p-3 bg-primary/10 rounded-lg' }, [
      h(Zap, { key: 'icon', className: 'w-5 h-5 text-primary flex-shrink-0' }),
      h('div', { key: 'content', className: 'text-sm' }, [
        h('div', { key: 'title', className: 'font-medium' }, '专业级评估工具'),
        h('div', { key: 'desc', className: 'text-muted-foreground' }, '基于国际标准的FMS协议')
      ])
    ])
  },
  {
    id: 'start-assessment',
    title: '开始您的第一次评估',
    description: '点击这里开始FMS评估。系统将引导您完成7项基础测试和3项排除测试，整个过程大约需要15分钟。',
    target: '[data-tour-id="start-assessment"]',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(34, 197, 94, 0.3)'
  },
  {
    id: 'learn-theory',
    title: '了解FMS理论基础',
    description: '在这里可以学习FMS的理论基础、生物力学原理和评估标准。建议在评估前先了解相关知识。',
    target: '[data-tour-id="learn-theory"]',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(59, 130, 246, 0.3)',
    content: h('div', { className: 'text-sm space-y-2' }, [
      h('div', { key: 'item1', className: 'flex items-center gap-2' }, [
        h(BookOpen, { key: 'icon', className: 'w-4 h-4 text-blue-600' }),
        h('span', { key: 'text' }, '7项基础测试详解')
      ]),
      h('div', { key: 'item2', className: 'flex items-center gap-2' }, [
        h(Shield, { key: 'icon', className: 'w-4 h-4 text-blue-600' }),
        h('span', { key: 'text' }, '3项排除测试说明')
      ]),
      h('div', { key: 'item3', className: 'flex items-center gap-2' }, [
        h(Users, { key: 'icon', className: 'w-4 h-4 text-blue-600' }),
        h('span', { key: 'text' }, '专业培训资料')
      ])
    ])
  },
  {
    id: 'quick-access',
    title: '快速访问功能',
    description: '这三个快速访问按钮可以让您快速查看历史记录、训练方案和评估报告。',
    target: '[data-tour-id="quick-access"]',
    placement: 'top',
    spotlightPadding: 16,
    highlightColor: 'rgba(139, 92, 246, 0.3)'
  },
  {
    id: 'system-features',
    title: '系统特色功能',
    description: '系统提供完整的FMS评估流程：7项标准测试、3项排除测试、15分钟快速完成、实时生成专业报告。',
    target: '[data-tour-id="system-features"]',
    placement: 'top',
    spotlightPadding: 16,
    highlightColor: 'rgba(236, 72, 153, 0.3)'
  }
];

// 完整的引导配置
export const tourConfigs: Record<string, TourConfig> = {
  home: {
    steps: homePageTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
    locale: {
      skip: '跳过引导',
      next: '下一步',
      back: '上一步',
      last: '完成引导'
    }
  }
};

// 默认引导配置 - 直接引用避免重复
export const defaultTourConfig: TourConfig = tourConfigs.home;