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
    highlightColor: 'rgba(217, 48, 37, 0.28)'
  },
  {
    id: 'learn-theory',
    title: '了解FMS理论基础',
    description: '在这里可以学习FMS的理论基础、生物力学原理和评估标准。建议在评估前先了解相关知识。',
    target: '[data-tour-id="learn-theory"]',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(18, 49, 60, 0.28)',
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
    highlightColor: 'rgba(217, 48, 37, 0.24)'
  },
  {
    id: 'system-features',
    title: '系统特色功能',
    description: '系统提供完整的FMS评估流程：7项标准测试、3项排除测试、15分钟快速完成、实时生成专业报告。',
    target: '[data-tour-id="system-features"]',
    placement: 'top',
    spotlightPadding: 16,
    highlightColor: 'rgba(18, 49, 60, 0.24)'
  }
];

export const assessmentTourSteps: TourStep[] = [
  {
    id: 'assessment-guide',
    title: '先看评估引导',
    description: '这里说明了本页的操作顺序：看测试、查演示、录入分数、用详情复核进度。',
    target: '[data-tour-id="assessment-guide"]',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(217, 48, 37, 0.28)'
  },
  {
    id: 'assessment-test-card',
    title: '当前动作卡',
    description: '桌面端直接展示动作演示和步骤。手机端使用底部“演示”按钮打开完整说明。',
    target: '[data-tour-id="assessment-test-card"]',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(18, 49, 60, 0.28)'
  },
  {
    id: 'assessment-demo-guide',
    title: '演示指引',
    description: '打开 GIF、执行步骤和评分标准。它现在固定在底部选项卡上方，不会被遮挡。',
    target: '[data-tour-id="assessment-demo-guide"]',
    placement: 'top',
    spotlightPadding: 10,
    highlightColor: 'rgba(217, 48, 37, 0.28)'
  },
  {
    id: 'assessment-status-detail',
    title: '测试详情',
    description: '这里汇总完成进度、排除测试、不对称项和疼痛项，适合中途检查是否漏项。',
    target: '[data-tour-id="assessment-status-detail"]',
    placement: 'top',
    spotlightPadding: 10,
    highlightColor: 'rgba(18, 49, 60, 0.28)'
  },
  {
    id: 'assessment-scoring',
    title: '录入评分',
    description: '按动作质量或疼痛情况选择分数。出现疼痛时选 0 分，系统会保留风险提示。',
    target: '[data-tour-id="assessment-scoring"]',
    placement: 'top',
    spotlightPadding: 12,
    highlightColor: 'rgba(217, 48, 37, 0.28)'
  },
  {
    id: 'assessment-navigation',
    title: '继续或返回',
    description: '完成当前动作后进入下一项。最后一项提交后会自动保存记录并生成报告。',
    target: '[data-tour-id="assessment-navigation"]',
    placement: 'top',
    spotlightPadding: 12,
    highlightColor: 'rgba(18, 49, 60, 0.28)'
  }
];

export const reportTourSteps: TourStep[] = [
  {
    id: 'report-guide',
    title: '报告使用顺序',
    description: '先看总分和风险，再看详细结果，最后进入训练方案或回到历史记录。',
    target: '[data-tour-id="report-guide"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'report-summary',
    title: '总览和风险信号',
    description: '这里给出总分、状态和需要优先关注的疼痛或不对称问题。',
    target: '[data-tour-id="report-summary"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'report-training-action',
    title: '进入训练方案',
    description: '报告不是终点。用这个入口把评估结果带入个性化纠正训练。',
    target: '[data-tour-id="report-training-action"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'report-detail',
    title: '详细结果',
    description: '逐项核对基础测试、排除测试和双侧差异，确认训练建议来自哪些问题。',
    target: '[data-tour-id="report-detail"]',
    placement: 'top',
    spotlightPadding: 12
  }
];

export const trainingTourSteps: TourStep[] = [
  {
    id: 'training-guide',
    title: '训练方案引导',
    description: '先读执行边界，再按阶段展开训练，不要跳过疼痛提示。',
    target: '[data-tour-id="training-guide"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'training-overview',
    title: '训练概览',
    description: '这里汇总阶段数量、纠正项目、预计周期和总体风险等级。',
    target: '[data-tour-id="training-overview"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'training-phases',
    title: '分阶段执行',
    description: '从第一阶段开始展开，按优先级处理疼痛、功能障碍和不对称。',
    target: '[data-tour-id="training-phases"]',
    placement: 'top',
    spotlightPadding: 12
  },
  {
    id: 'training-guidance',
    title: '执行指导',
    description: '这里说明训练频率、阶段过渡标准和重新评估时机。',
    target: '[data-tour-id="training-guidance"]',
    placement: 'top',
    spotlightPadding: 12
  }
];

export const historyTourSteps: TourStep[] = [
  {
    id: 'history-guide',
    title: '历史记录引导',
    description: '这里说明本机保存、导入导出、收藏和恢复报告的使用方式。',
    target: '[data-tour-id="history-guide"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'history-stats',
    title: '本机统计',
    description: '快速查看记录数量、收藏、平均分和最近评估时间。',
    target: '[data-tour-id="history-stats"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'history-actions',
    title: '导入导出',
    description: '评估记录存储在本机。换设备前请导出备份，需要恢复时再导入。',
    target: '[data-tour-id="history-actions"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'history-records',
    title: '恢复报告',
    description: '选择“查看详情”可以从历史记录恢复报告，并继续进入训练方案。',
    target: '[data-tour-id="history-records"]',
    placement: 'top',
    spotlightPadding: 12
  }
];

export const educationTourSteps: TourStep[] = [
  {
    id: 'education-guide',
    title: '知识库引导',
    description: '先理解基础概念，再看评分标准，最后回到评估流程中实践。',
    target: '[data-tour-id="education-guide"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'education-basics',
    title: '基础理论',
    description: '这里解释 FMS 的作用、适用边界和动作筛查思路。',
    target: '[data-tour-id="education-basics"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'education-scoring',
    title: '评分标准',
    description: '评估前先理解每个分值的含义，可以降低自评误差。',
    target: '[data-tour-id="education-scoring"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'education-application',
    title: '实践应用',
    description: '这些内容用于把评估结果转化为训练调整，而不是单纯看分数。',
    target: '[data-tour-id="education-application"]',
    placement: 'top',
    spotlightPadding: 12
  }
];

export const aboutTourSteps: TourStep[] = [
  {
    id: 'about-guide',
    title: '项目边界',
    description: '这里说明项目目标、公益属性和非诊断边界。',
    target: '[data-tour-id="about-guide"]',
    placement: 'bottom',
    spotlightPadding: 12
  },
  {
    id: 'about-story',
    title: '项目说明',
    description: '了解为什么先筛查、再纠正、再强化。',
    target: '[data-tour-id="about-story"]',
    placement: 'top',
    spotlightPadding: 12
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
  },
  assessment: {
    steps: assessmentTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
  report: {
    steps: reportTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
  training: {
    steps: trainingTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
  history: {
    steps: historyTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
  education: {
    steps: educationTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
  about: {
    steps: aboutTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
  },
};

// 默认引导配置 - 直接引用避免重复
export const defaultTourConfig: TourConfig = tourConfigs.home;
