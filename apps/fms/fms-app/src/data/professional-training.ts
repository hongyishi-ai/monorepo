// 专业训练建议 - 基于FMS生物力学分析的针对性训练方案

export interface TargetedExercise {
  id: string;
  name: string;
  category: 'mobility' | 'stability' | 'strength' | 'neuromuscular' | 'corrective' | 'neural' | 'integration';
  targetMuscles: string[];
  targetLimitations: string[];
  description: string;
  biomechanicalRationale: string;
  instructions: string[];
  progression: string[];
  precautions: string[];
  dosage: {
    sets?: number;
    reps?: number;
    hold?: string;
    frequency: string;
  };
}

export interface TrainingRecommendation {
  testId: string;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  exercises: TargetedExercise[];
  expectedTimeframe: string;
  reassessmentInterval: string;
  specialNotes?: string; // 特殊说明，用于疼痛状态或其他重要提示
}

export interface CompensationCorrectionProtocol {
  compensationPattern: string;
  correctionStrategy: string;
  exercises: string[]; // References to TargetedExercise IDs
  progressionPhases: {
    phase: string;
    description: string;
    duration: string;
    focus: string[];
  }[];
}

// 针对过顶深蹲的专业训练方案
export const DEEP_SQUAT_TRAINING: TargetedExercise[] = [
  {
    id: 'ankle-dorsiflexion-mobility',
    name: '踝关节背屈活动度训练',
    category: 'mobility',
    targetMuscles: ['小腿三头肌', '腓肠肌', '比目鱼肌'],
    targetLimitations: ['踝关节背屈受限', '小腿三头肌紧张'],
    description: '改善踝关节背屈活动度，消除深蹲时足跟离地的代偿',
    biomechanicalRationale: '踝关节背屈不足(<20°)导致膝关节过度前移和躯干前倾代偿，增加后链肌群代偿负荷',
    instructions: [
      '面墙站立，距离约1臂长',
      '一脚向前成弓箭步姿势，前脚紧贴墙面',
      '保持前脚跟接地，缓慢向前压膝盖至墙面',
      '感受小腿后侧拉伸感，保持姿势',
      '缓慢放松，重复动作'
    ],
    progression: [
      '增加与墙面距离',
      '增加保持时间',
      '加入动态摆动'
    ],
    precautions: [
      '避免足弓塌陷',
      '保持膝关节与脚尖同向',
      '不应出现疼痛'
    ],
    dosage: {
      hold: '30-60秒',
      sets: 3,
      frequency: '每日2次'
    }
  },
  {
    id: 'hip-flexor-release',
    name: '髋屈肌松解训练',
    category: 'mobility',
    targetMuscles: ['髂腰肌', '股直肌', '阔筋膜张肌'],
    targetLimitations: ['髋关节内/外旋控制力欠佳', '核心激活不充分'],
    description: '松解紧张的髋屈肌群，改善骨盆中立位控制',
    biomechanicalRationale: '髂腰肌紧张导致骨盆前倾，影响深蹲时髋关节屈曲活动度和腰椎稳定性',
    instructions: [
      '采用半跪姿势，后腿膝关节接地',
      '前腿髋关节和膝关节成90度',
      '保持躯干直立，缓慢向前推髋',
      '感受后腿前侧髋屈肌拉伸',
      '结合骨盆后倾动作增强效果'
    ],
    progression: [
      '增加后腿膝关节抬离地面',
      '加入上肢对侧伸展',
      '动态版本训练'
    ],
    precautions: [
      '避免腰椎过度伸展',
      '保持核心收紧',
      '不强迫过度拉伸'
    ],
    dosage: {
      hold: '30-45秒',
      sets: 3,
      frequency: '每日1-2次'
    }
  },
  {
    id: 'core-activation-transverse-abdominis',
    name: '腹横肌激活训练',
    category: 'stability',
    targetMuscles: ['腹横肌', '多裂肌', '骨盆底肌'],
    targetLimitations: ['核心激活不充分', '核心稳定性差'],
    description: '激活深层核心稳定肌群，建立内在脊柱稳定性',
    biomechanicalRationale: '腹横肌提供"内在束带"效应，与多裂肌协同维持脊柱中立位，是所有动作的基础',
    instructions: [
      '仰卧位，膝关节屈曲90度',
      '将手指轻放在髂前上棘内侧',
      '缓慢轻柔地向内收腹（想象系腰带的感觉）',
      '感受腹横肌轻微收缩，避免屏气',
      '保持自然呼吸，维持收缩'
    ],
    progression: [
      '加入四点支撑位置训练',
      '结合上下肢运动',
      '增加不稳定表面训练'
    ],
    precautions: [
      '避免腹直肌代偿',
      '不要屏住呼吸',
      '动作应轻柔，不过度用力'
    ],
    dosage: {
      hold: '10秒',
      reps: 10,
      sets: 3,
      frequency: '每日2-3次'
    }
  },
  {
    id: 'thoracic-spine-extension-mobility',
    name: '胸椎伸展活动度训练',
    category: 'mobility',
    targetMuscles: ['胸大肌', '胸小肌', '前锯肌'],
    targetLimitations: ['胸椎活动度不足', '肩胛前倾以维持平衡'],
    description: '改善胸椎伸展活动度，减少肩部代偿',
    biomechanicalRationale: '胸椎活动度受限导致过顶动作时肩胛前倾和腰椎过度伸展代偿',
    instructions: [
      '四足跪姿，双手支撑地面',
      '将一手放于脑后，肘部指向侧方',
      '保持骨盆稳定，缓慢旋转上胸椎',
      '肘部向天花板方向抬起',
      '感受胸椎旋转和伸展'
    ],
    progression: [
      '增加旋转幅度',
      '加入动态动作',
      '站立位训练'
    ],
    precautions: [
      '避免腰椎代偿旋转',
      '保持骨盆稳定',
      '动作应缓慢控制'
    ],
    dosage: {
      reps: 10,
      sets: 2,
      frequency: '每日1-2次'
    }
  },
  // 针对0分疼痛状态的专门康复方案
  {
    id: 'pain-relief-gentle-squatting',
    name: '疼痛缓解式温和蹲坐',
    category: 'corrective',
    targetMuscles: ['全身协调', '疼痛管理'],
    targetLimitations: ['急性疼痛', '动作恐惧', '功能丧失'],
    description: '在无痛范围内进行极其温和的蹲坐动作，促进血液循环和关节营养',
    biomechanicalRationale: '温和的关节活动可促进滑液分泌，减少炎症介质积聚，打断疼痛-肌肉痉挛循环',
    instructions: [
      '坐在椅子边缘，双脚平放地面',
      '双手轻扶椅子边缘或扶手',
      '缓慢站起至舒适高度（可能只有几厘米）',
      '在无痛范围内保持2-3秒',
      '非常缓慢地坐下',
      '全程监控疼痛程度，出现疼痛立即停止'
    ],
    progression: [
      '逐渐增加站起高度',
      '减少手部支撑',
      '增加保持时间'
    ],
    precautions: [
      '严格遵循无痛原则',
      '动作极其缓慢',
      '随时准备停止',
      '避免任何加重疼痛的动作'
    ],
    dosage: {
      reps: 3,
      sets: 2,
      frequency: '每日2-3次，根据疼痛程度调整'
    }
  },
  {
    id: 'isometric-glute-activation',
    name: '等长臀肌激活',
    category: 'corrective',
    targetMuscles: ['臀大肌', '臀中肌', '骨盆底肌'],
    targetLimitations: ['臀肌失活', '代偿模式', '疼痛引起的运动恐惧'],
    description: '通过温和的等长收缩重新激活臀肌，为功能恢复奠定基础',
    biomechanicalRationale: '疼痛状态下臀肌常出现抑制现象，等长激活可在不加重疼痛的前提下重建神经肌肉连接',
    instructions: [
      '仰卧位，膝关节轻度弯曲',
      '双脚平放，与髋同宽',
      '轻柔地收缩臀部肌肉（想象夹紧臀部）',
      '避免过度用力，以不引起疼痛为准',
      '保持自然呼吸，感受肌肉轻微收缩'
    ],
    progression: [
      '增加收缩强度（在无痛范围内）',
      '延长保持时间',
      '加入轻微的骨盆后倾'
    ],
    precautions: [
      '避免憋气',
      '不强迫收缩',
      '疼痛时立即停止',
      '保持动作轻柔'
    ],
    dosage: {
      hold: '5-10秒',
      reps: 8,
      sets: 2,
      frequency: '每日3次'
    }
  },
  {
    id: 'basic-postural-education',
    name: '基础姿态教育',
    category: 'neural',
    targetMuscles: ['姿态感知', '身体意识'],
    targetLimitations: ['姿态异常', '身体感知能力下降', '疼痛相关恐惧'],
    description: '重建基础的身体姿态意识，为功能恢复创造条件',
    biomechanicalRationale: '疼痛状态下常伴随姿态改变和身体感知能力下降，重建身体意识是康复的重要基础',
    instructions: [
      '坐在镜子前，观察自身姿态',
      '注意头部、肩膀、脊柱的位置',
      '轻柔调整至舒适的中立位置',
      '感受不同姿态下身体的感觉',
      '记住最舒适的姿态感受'
    ],
    progression: [
      '增加观察时间',
      '尝试不同姿态',
      '加入动态姿态调整'
    ],
    precautions: [
      '避免强迫调整',
      '以舒适为主',
      '不追求"完美"姿态',
      '关注身体感受'
    ],
    dosage: {
      hold: '2-3分钟',
      frequency: '每日2-3次'
    }
  }
];

// 针对跨栏步的专业训练方案
export const HURDLE_STEP_TRAINING: TargetedExercise[] = [
  {
    id: 'single-leg-balance-training',
    name: '单腿平衡训练',
    category: 'stability',
    targetMuscles: ['臀中肌', '臀小肌', '胫骨前肌', '腓骨肌'],
    targetLimitations: ['单腿支撑稳定性差', '本体感觉缺失'],
    description: '改善单腿支撑时的平衡控制能力，强化髋部稳定肌群',
    biomechanicalRationale: '单腿支撑时需要髋外展肌群提供侧向稳定，踝关节周围肌群提供精细平衡调节',
    instructions: [
      '单腿站立，保持骨盆水平',
      '非支撑腿微微屈膝抬起',
      '保持躯干正直，避免倾斜',
      '专注于支撑腿的稳定性',
      '逐渐延长保持时间'
    ],
    progression: [
      '闭眼训练',
      '不稳定表面训练',
      '加入功能性动作'
    ],
    precautions: [
      '开始时可扶墙练习',
      '避免支撑腿过度紧张',
      '出现疲劳时及时休息'
    ],
    dosage: {
      hold: '30-60秒',
      sets: 3,
      frequency: '每日2次'
    }
  },
  {
    id: 'hip-abduction-strengthening',
    name: '髋外展肌强化训练',
    category: 'strength',
    targetMuscles: ['臀中肌', '臀小肌', '阔筋膜张肌'],
    targetLimitations: ['髋关节稳定性差', '膝关节内扣'],
    description: '强化髋外展肌群，改善下肢力线控制',
    biomechanicalRationale: '髋外展肌无力导致股骨内旋、膝关节外翻，影响单腿支撑稳定性',
    instructions: [
      '侧卧位，下肢伸直',
      '上侧腿向上抬起，保持髋关节中立',
      '避免躯干旋转或髋关节屈曲',
      '缓慢控制下降过程',
      '感受髋部外侧肌肉收缩'
    ],
    progression: [
      '增加弹力带阻力',
      '站立位侧抬腿',
      '单腿蹲配合髋外展'
    ],
    precautions: [
      '避免过快动作',
      '保持骨盆稳定',
      '不使用代偿动作'
    ],
    dosage: {
      reps: 15,
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'dynamic-leg-swing',
    name: '动态摆腿训练',
    category: 'neuromuscular',
    targetMuscles: ['髂腰肌', '股四头肌', '腘绳肌'],
    targetLimitations: ['髋关节活动度受限', '动态控制能力差'],
    description: '改善髋关节动态活动度和神经肌肉控制',
    biomechanicalRationale: '动态摆腿训练可提高髋关节在矢状面的活动范围，增强动态稳定性',
    instructions: [
      '单手扶墙单腿站立',
      '非支撑腿前后摆动',
      '保持躯干稳定',
      '逐渐增加摆动幅度',
      '控制摆动节奏'
    ],
    progression: [
      '增加摆动幅度',
      '加快摆动速度',
      '双手离墙训练'
    ],
    precautions: [
      '动作要控制',
      '避免躯干晃动',
      '循序渐进'
    ],
    dosage: {
      reps: 10,
      sets: 3,
      frequency: '训练前热身'
    }
  }
];

// 针对直线弓步的专业训练方案
export const INLINE_LUNGE_TRAINING: TargetedExercise[] = [
  {
    id: 'core-stability-plank',
    name: '核心稳定训练（平板支撑）',
    category: 'stability',
    targetMuscles: ['腹横肌', '多裂肌', '膈肌', '骨盆底肌'],
    targetLimitations: ['核心稳定性差', '躯干控制能力弱'],
    description: '强化深层核心肌群，提高躯干稳定性',
    biomechanicalRationale: '核心稳定性是所有功能动作的基础，提供脊柱和骨盆的稳定支撑',
    instructions: [
      '俯卧支撑，前臂着地',
      '保持身体呈一条直线',
      '收紧核心，避免塌腰',
      '保持自然呼吸',
      '维持标准姿势'
    ],
    progression: [
      '增加保持时间',
      '单臂或单腿变化',
      '不稳定表面训练'
    ],
    precautions: [
      '避免憋气',
      '不要塌腰或撅臀',
      '感到疲劳时及时休息'
    ],
    dosage: {
      hold: '30-60秒',
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'lunge-pattern-training',
    name: '弓步模式训练',
    category: 'neuromuscular',
    targetMuscles: ['股四头肌', '臀大肌', '腘绳肌'],
    targetLimitations: ['动作模式错误', '下肢协调性差'],
    description: '重新建立正确的弓步动作模式',
    biomechanicalRationale: '通过反复练习建立正确的神经肌肉控制模式，改善动作质量',
    instructions: [
      '站立位，一腿向前迈步',
      '下降时保持躯干直立',
      '前膝不超过脚尖',
      '后膝轻触地面',
      '用力回到起始位置'
    ],
    progression: [
      '增加步幅',
      '加入旋转动作',
      '负重训练'
    ],
    precautions: [
      '动作要缓慢控制',
      '避免膝关节疼痛',
      '保持平衡'
    ],
    dosage: {
      reps: 12,
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'ankle-stability-training',
    name: '踝关节稳定性训练',
    category: 'stability',
    targetMuscles: ['胫骨前肌', '腓骨肌', '小腿三头肌'],
    targetLimitations: ['踝关节稳定性差', '本体感觉缺失'],
    description: '增强踝关节稳定性和本体感觉',
    biomechanicalRationale: '踝关节是下肢动力链的起点，其稳定性直接影响上方关节的功能',
    instructions: [
      '单腿站立在不稳定垫上',
      '保持踝关节稳定',
      '避免过度晃动',
      '专注于踝关节控制',
      '逐渐增加难度'
    ],
    progression: [
      '闭眼训练',
      '加入干扰动作',
      '功能性训练'
    ],
    precautions: [
      '初期可扶墙',
      '避免踝关节扭伤',
      '循序渐进'
    ],
    dosage: {
      hold: '30秒',
      sets: 3,
      frequency: '每日1次'
    }
  }
];

// 针对肩部灵活性的专业训练方案
export const SHOULDER_MOBILITY_TRAINING: TargetedExercise[] = [
  {
    id: 'shoulder-flexion-stretch',
    name: '肩关节屈曲拉伸',
    category: 'mobility',
    targetMuscles: ['胸大肌', '背阔肌', '大圆肌'],
    targetLimitations: ['肩关节屈曲受限', '胸椎活动度不足'],
    description: '改善肩关节屈曲活动度，缓解前胸肌群紧张',
    biomechanicalRationale: '前胸肌群紧张限制肩关节屈曲和外展，影响过顶动作质量',
    instructions: [
      '面对门框站立',
      '一臂伸直贴住门框',
      '身体向前倾，感受前胸拉伸',
      '保持拉伸姿势',
      '缓慢放松'
    ],
    progression: [
      '调整手臂高度',
      '增加拉伸时间',
      '动态版本训练'
    ],
    precautions: [
      '避免过度拉伸',
      '不应有疼痛',
      '保持呼吸顺畅'
    ],
    dosage: {
      hold: '30-45秒',
      sets: 3,
      frequency: '每日2次'
    }
  },
  {
    id: 'scapular-mobility-training',
    name: '肩胛骨活动度训练',
    category: 'mobility',
    targetMuscles: ['菱形肌', '中下斜方肌', '前锯肌'],
    targetLimitations: ['肩胛骨活动受限', '肩胛稳定性差'],
    description: '改善肩胛骨在胸廓上的滑动，恢复正常的肩胛胸廓节律',
    biomechanicalRationale: '肩胛骨正常活动是肩关节功能的基础，影响整个上肢运动链',
    instructions: [
      '四足跪姿，手臂伸直',
      '肩胛骨向脊柱靠拢（内收）',
      '然后向外展开（外展）',
      '保持手臂位置不变',
      '专注于肩胛骨运动'
    ],
    progression: [
      '增加运动幅度',
      '加入上下运动',
      '负重训练'
    ],
    precautions: [
      '动作要缓慢',
      '避免手腕疼痛',
      '保持核心稳定'
    ],
    dosage: {
      reps: 15,
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'internal-rotation-stretch',
    name: '肩关节内旋拉伸',
    category: 'mobility',
    targetMuscles: ['肩胛下肌', '胸大肌', '胸小肌'],
    targetLimitations: ['肩关节内旋受限', '后方关节囊紧张'],
    description: '改善肩关节内旋活动度，平衡前后肌群张力',
    biomechanicalRationale: '后方关节囊紧张导致肩关节内旋受限，影响功能性动作表现',
    instructions: [
      '一手从背后向上伸，另一手从上方下伸',
      '尽量让两手相触',
      '感受上方手臂的拉伸',
      '保持姿势',
      '交换手臂位置'
    ],
    progression: [
      '使用毛巾辅助',
      '增加拉伸强度',
      '动态训练'
    ],
    precautions: [
      '不强迫动作',
      '避免肩部撞击',
      '循序渐进'
    ],
    dosage: {
      hold: '30秒',
      sets: 3,
      frequency: '每日2次'
    }
  },
  // 针对肩部疼痛的专门康复方案
  {
    id: 'shoulder-pain-relief-pendulum',
    name: '钟摆式肩关节松动',
    category: 'corrective',
    targetMuscles: ['肩袖肌群', '三角肌', '关节囊'],
    targetLimitations: ['急性肩部疼痛', '肩峰下撞击', '关节僵硬'],
    description: '通过重力辅助的温和摆动缓解肩部疼痛和僵硬',
    biomechanicalRationale: '重力牵引可减轻关节内压力，温和摆动促进滑液循环，缓解炎症和粘连',
    instructions: [
      '健侧手扶桌子或椅背',
      '患侧手臂自然下垂，放松肩膀',
      '身体轻微前倾，让手臂悬空',
      '利用身体晃动带动手臂轻柔摆动',
      '前后、左右、画圈各方向缓慢摆动',
      '全程保持肩部放松，避免主动用力'
    ],
    progression: [
      '增加摆动幅度（在无痛范围内）',
      '延长练习时间',
      '减少身体支撑'
    ],
    precautions: [
      '绝对禁止主动用力',
      '出现疼痛立即停止',
      '动作极其轻柔',
      '避免过度摆动'
    ],
    dosage: {
      hold: '5-10分钟',
      frequency: '每日3-4次'
    }
  },
  {
    id: 'gentle-shoulder-isometrics',
    name: '温和肩部等长收缩',
    category: 'corrective',
    targetMuscles: ['肩袖肌群', '三角肌', '肩胛稳定肌'],
    targetLimitations: ['肩袖无力', '肩胛失稳', '疼痛性肌肉抑制'],
    description: '通过无痛的等长收缩重新激活肩部肌群',
    biomechanicalRationale: '等长收缩可在不增加关节应力的前提下激活肌肉，重建神经肌肉控制',
    instructions: [
      '手臂置于身体侧面，肘部轻度弯曲',
      '轻柔地向外用力（好像要推开一面墙）',
      '仅使用20-30%的力量，以不引起疼痛为准',
      '保持收缩，同时正常呼吸',
      '分别练习外展、外旋、内旋方向'
    ],
    progression: [
      '逐渐增加收缩强度（在无痛范围内）',
      '延长保持时间',
      '增加练习角度'
    ],
    precautions: [
      '严格控制用力程度',
      '疼痛时立即停止',
      '避免憋气',
      '不追求强烈收缩'
    ],
    dosage: {
      hold: '5-10秒',
      reps: 5,
      sets: 3,
      frequency: '每日2-3次'
    }
  },
  {
    id: 'shoulder-blade-gentle-retraction',
    name: '肩胛骨温和回缩',
    category: 'corrective',
    targetMuscles: ['中下斜方肌', '菱形肌', '后三角肌'],
    targetLimitations: ['圆肩姿势', '前胸肌紧张', '肩胛前伸'],
    description: '通过温和的肩胛骨回缩改善肩部姿态，为康复创造条件',
    biomechanicalRationale: '改善肩胛骨位置可减少肩峰下撞击，缓解疼痛症状',
    instructions: [
      '坐或站立，手臂自然下垂',
      '想象肩胛骨向脊柱靠拢',
      '轻柔地收缩肩胛骨间的肌肉',
      '避免过度用力或耸肩',
      '保持颈部放松'
    ],
    progression: [
      '增加保持时间',
      '加入轻微的肩胛下压',
      '结合深呼吸练习'
    ],
    precautions: [
      '避免强迫动作',
      '不要耸肩',
      '保持自然呼吸',
      '以舒适为主'
    ],
    dosage: {
      hold: '5-8秒',
      reps: 8,
      sets: 3,
      frequency: '每日2-3次'
    }
  }
];

// 针对主动直腿抬高的专业训练方案
export const ACTIVE_STRAIGHT_LEG_RAISE_TRAINING: TargetedExercise[] = [
  {
    id: 'hamstring-flexibility-training',
    name: '腘绳肌柔韧性训练',
    category: 'mobility',
    targetMuscles: ['股二头肌', '半腱肌', '半膜肌'],
    targetLimitations: ['腘绳肌紧张', '髋关节屈曲受限'],
    description: '改善腘绳肌柔韧性，增加髋关节屈曲活动度',
    biomechanicalRationale: '腘绳肌紧张限制髋关节屈曲，导致骨盆后倾和腰椎屈曲代偿',
    instructions: [
      '仰卧位，一腿伸直抬起',
      '使用毛巾或弹力带辅助',
      '缓慢增加抬腿高度',
      '感受大腿后侧拉伸',
      '保持对侧腿伸直贴地'
    ],
    progression: [
      '去除辅助工具',
      '增加抬腿高度',
      '加入踝关节背屈'
    ],
    precautions: [
      '避免躯干代偿',
      '动作要缓慢',
      '不强迫过度拉伸'
    ],
    dosage: {
      hold: '30-60秒',
      sets: 3,
      frequency: '每日2次'
    }
  },
  {
    id: 'neural-mobilization',
    name: '神经松解训练',
    category: 'mobility',
    targetMuscles: ['坐骨神经', '腘绳肌'],
    targetLimitations: ['神经张力增高', '神经滑动受限'],
    description: '改善神经系统活动度，减少神经张力限制',
    biomechanicalRationale: '神经张力增高可能限制直腿抬高动作，通过神经松解改善活动度',
    instructions: [
      '仰卧位，髋膝屈曲90度',
      '缓慢伸直膝关节',
      '感受大腿后侧牵拉',
      '达到最大范围后屈曲膝关节',
      '重复伸屈动作'
    ],
    progression: [
      '增加踝关节运动',
      '加入颈部屈曲',
      '双侧同时训练'
    ],
    precautions: [
      '出现疼痛立即停止',
      '动作要轻柔',
      '避免过度牵拉'
    ],
    dosage: {
      reps: 10,
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'pelvic-stability-training',
    name: '骨盆稳定性训练',
    category: 'stability',
    targetMuscles: ['腹横肌', '多裂肌', '臀大肌'],
    targetLimitations: ['骨盆稳定性差', '腰椎代偿'],
    description: '增强骨盆稳定性，减少腰椎代偿',
    biomechanicalRationale: '骨盆稳定性不足导致单侧下肢运动时腰椎代偿性活动',
    instructions: [
      '仰卧位，双膝屈曲',
      '激活核心肌群',
      '一腿缓慢伸直抬起',
      '保持骨盆稳定',
      '缓慢放下'
    ],
    progression: [
      '增加抬腿高度',
      '双腿交替训练',
      '加入阻力'
    ],
    precautions: [
      '避免腰椎过度活动',
      '保持核心收紧',
      '动作要控制'
    ],
    dosage: {
      reps: 10,
      sets: 3,
      frequency: '每日1次'
    }
  }
];

// 针对躯干稳定俯卧撑的专业训练方案
export const TRUNK_STABILITY_PUSHUP_TRAINING: TargetedExercise[] = [
  {
    id: 'progressive-plank-training',
    name: '渐进式平板支撑训练',
    category: 'stability',
    targetMuscles: ['腹横肌', '多裂肌', '竖脊肌', '臀大肌'],
    targetLimitations: ['核心耐力不足', '躯干稳定性差'],
    description: '渐进式增强核心稳定性和耐力',
    biomechanicalRationale: '提供稳定的基础支撑，为更高难度的核心训练做准备',
    instructions: [
      '从膝关节支撑开始',
      '保持头、肩、髋、膝一条直线',
      '逐渐过渡到标准平板支撑',
      '保持自然呼吸',
      '维持标准姿势'
    ],
    progression: [
      '延长保持时间',
      '单臂或单腿变化',
      '动态平板支撑'
    ],
    precautions: [
      '避免塌腰',
      '不要憋气',
      '循序渐进'
    ],
    dosage: {
      hold: '20-60秒',
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'dead-bug-exercise',
    name: '死虫训练',
    category: 'stability',
    targetMuscles: ['腹横肌', '膈肌', '多裂肌'],
    targetLimitations: ['核心协调性差', '对侧运动控制弱'],
    description: '改善核心稳定性和四肢协调控制',
    biomechanicalRationale: '训练在上下肢运动时维持脊柱中立位的能力',
    instructions: [
      '仰卧位，髋膝各屈曲90度',
      '激活核心，维持腰椎中立',
      '对侧手臂和腿同时伸展',
      '保持骨盆稳定',
      '缓慢回到起始位置'
    ],
    progression: [
      '增加运动幅度',
      '加快运动速度',
      '加入阻力'
    ],
    precautions: [
      '避免腰椎过度活动',
      '保持呼吸顺畅',
      '动作要控制'
    ],
    dosage: {
      reps: 10,
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'modified-pushup-progression',
    name: '改良俯卧撑进阶训练',
    category: 'strength',
    targetMuscles: ['胸大肌', '三角肌前束', '肱三头肌', '核心肌群'],
    targetLimitations: ['上肢力量不足', '核心在负荷下稳定性差'],
    description: '渐进式发展俯卧撑力量和稳定性',
    biomechanicalRationale: '在上肢推力动作中维持核心稳定性，整合力量和稳定性',
    instructions: [
      '从墙面俯卧撑开始',
      '逐渐降低支撑角度',
      '保持身体一条直线',
      '控制下降和推起速度',
      '专注于核心稳定'
    ],
    progression: [
      '降低支撑角度',
      '增加动作幅度',
      '标准俯卧撑'
    ],
    precautions: [
      '避免塌腰',
      '保持头部中立',
      '循序渐进'
    ],
    dosage: {
      reps: 8,
      sets: 3,
      frequency: '隔日1次'
    }
  },
  // 针对躯干伸展疼痛的专门康复方案
  {
    id: 'spine-flexion-relief',
    name: '脊柱屈曲缓解训练',
    category: 'corrective',
    targetMuscles: ['椎间盘前部', '后纵韧带', '多裂肌'],
    targetLimitations: ['椎间盘后部病变', '神经根压迫', '伸展疼痛'],
    description: '通过脊柱屈曲位置缓解伸展引起的疼痛症状',
    biomechanicalRationale: '脊柱屈曲可减少椎间盘后部压力，扩大椎间孔空间，缓解神经根压迫',
    instructions: [
      '坐在椅子上，双脚平放地面',
      '缓慢将下巴向胸部靠近',
      '让脊柱逐节屈曲（从上向下弯曲）',
      '双手可轻抱膝盖辅助',
      '在舒适范围内保持姿势',
      '缓慢逐节回到直立位置'
    ],
    progression: [
      '增加屈曲程度（在无痛范围内）',
      '延长保持时间',
      '加入轻微的左右摆动'
    ],
    precautions: [
      '绝对避免任何伸展动作',
      '出现疼痛立即停止',
      '动作极其缓慢',
      '避免急性症状期练习'
    ],
    dosage: {
      hold: '30-60秒',
      sets: 3,
      frequency: '每日2-3次'
    }
  },
  {
    id: 'prone-lying-modification',
    name: '俯卧位改良训练',
    category: 'corrective',
    targetMuscles: ['腹部肌群', '呼吸肌', '骨盆底肌'],
    targetLimitations: ['俯卧位疼痛', '伸展不耐受', '功能恐惧'],
    description: '通过改良的俯卧位置逐步适应，为后续训练做准备',
    biomechanicalRationale: '逐步适应俯卧位可帮助重建对该姿势的耐受性，为功能恢复奠定基础',
    instructions: [
      '开始时仰卧，膝关节屈曲',
      '在无痛范围内逐渐转向侧卧',
      '如果耐受，尝试短暂俯卧（胸部垫枕头）',
      '保持时间以舒适为准，可能只有几秒钟',
      '感到任何不适立即回到舒适体位'
    ],
    progression: [
      '逐渐延长俯卧时间',
      '减少胸部垫高',
      '尝试前臂支撑（如果无痛）'
    ],
    precautions: [
      '绝对不可强迫',
      '从最短时间开始',
      '随时准备停止',
      '避免颈部过度伸展'
    ],
    dosage: {
      hold: '5-30秒',
      frequency: '每日1-2次，根据耐受度调整'
    }
  },
  {
    id: 'neural-desensitization',
    name: '神经脱敏训练',
    category: 'neural',
    targetMuscles: ['神经系统', '疼痛感受器'],
    targetLimitations: ['神经敏感化', '疼痛过敏', '运动恐惧'],
    description: '通过温和的神经系统刺激降低疼痛敏感性',
    biomechanicalRationale: '适度的感觉输入可激活疼痛门控机制，降低疼痛信号传递',
    instructions: [
      '轻柔地抚摸疼痛区域周围的皮肤',
      '使用不同质地的物品（如丝巾、毛巾）接触皮肤',
      '从远离疼痛部位开始，逐渐接近',
      '每次接触都应该是舒适的',
      '结合深呼吸和放松练习'
    ],
    progression: [
      '增加接触时间',
      '尝试不同的接触方式',
      '扩大接触范围'
    ],
    precautions: [
      '以患者舒适为准',
      '避免引起疼痛',
      '从轻柔开始',
      '尊重患者的反应'
    ],
    dosage: {
      hold: '5-10分钟',
      frequency: '每日2-3次'
    }
  }
];

// 针对旋转稳定性的专业训练方案
export const ROTARY_STABILITY_TRAINING: TargetedExercise[] = [
  {
    id: 'quadruped-opposite-reach',
    name: '四足对侧伸展训练',
    category: 'stability',
    targetMuscles: ['多裂肌', '腹横肌', '臀大肌', '背阔肌'],
    targetLimitations: ['对侧运动协调性差', '旋转稳定性不足'],
    description: '改善四肢协调性和核心旋转稳定性',
    biomechanicalRationale: '训练在对侧运动模式下维持脊柱稳定的能力',
    instructions: [
      '四足跪姿，手腕在肩关节下方',
      '对侧手臂和腿同时伸展',
      '保持骨盆和脊柱稳定',
      '避免旋转和侧倾',
      '保持平衡'
    ],
    progression: [
      '延长保持时间',
      '加入运动',
      '不稳定表面训练'
    ],
    precautions: [
      '避免脊柱旋转',
      '保持均匀呼吸',
      '动作要控制'
    ],
    dosage: {
      hold: '10-30秒',
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'side-plank-progression',
    name: '侧平板进阶训练',
    category: 'stability',
    targetMuscles: ['腹斜肌', '腰方肌', '臀中肌'],
    targetLimitations: ['侧向稳定性差', '髋部侧向力量不足'],
    description: '增强侧向核心稳定性和髋部控制',
    biomechanicalRationale: '侧向稳定性是旋转稳定的重要组成部分',
    instructions: [
      '侧卧，前臂支撑',
      '身体成一条直线',
      '保持髋部抬起',
      '避免前后倾斜',
      '维持稳定姿势'
    ],
    progression: [
      '延长保持时间',
      '上腿抬起',
      '动态变化'
    ],
    precautions: [
      '避免塌髋',
      '保持呼吸',
      '循序渐进'
    ],
    dosage: {
      hold: '20-45秒',
      sets: 3,
      frequency: '每日1次'
    }
  },
  {
    id: 'pallof-press-training',
    name: '抗旋转训练',
    category: 'stability',
    targetMuscles: ['腹斜肌', '腹横肌', '多裂肌'],
    targetLimitations: ['抗旋转力量不足', '核心稳定性差'],
    description: '增强抗旋转能力和核心稳定性',
    biomechanicalRationale: '训练在外力作用下抵抗旋转的能力',
    instructions: [
      '站立位，弹力带置于胸前',
      '双手握住弹力带',
      '向前推出，抵抗旋转力',
      '保持躯干稳定',
      '缓慢回收'
    ],
    progression: [
      '增加阻力',
      '延长保持时间',
      '改变站立姿势'
    ],
    precautions: [
      '避免躯干旋转',
      '保持呼吸顺畅',
      '控制动作'
    ],
    dosage: {
      reps: 10,
      sets: 3,
      frequency: '每日1次'
    }
  }
];

// 代偿模式纠正协议
export const COMPENSATION_CORRECTIONS: CompensationCorrectionProtocol[] = [
  {
    compensationPattern: '膝关节内扣(外翻)',
    correctionStrategy: '强化髋外展肌群，改善下肢力线控制',
    exercises: ['glute-medius-strengthening', 'hip-abduction-series', 'single-leg-squat-progression'],
    progressionPhases: [
      {
        phase: '第一阶段：基础激活',
        description: '激活休眠的臀中肌，建立基础力量',
        duration: '2-3周',
        focus: ['臀中肌激活', '髋外展基础力量', '动作意识建立']
      },
      {
        phase: '第二阶段：功能整合',
        description: '在功能性动作中整合髋外展肌控制',
        duration: '3-4周',
        focus: ['动态平衡', '单腿支撑', '深蹲模式修正']
      },
      {
        phase: '第三阶段：强化巩固',
        description: '提高力量水平，巩固正确动作模式',
        duration: '4-6周',
        focus: ['力量提升', '复杂动作整合', '持久性改善']
      }
    ]
  },
  {
    compensationPattern: '躯干过度前倾代替髋关节屈曲',
    correctionStrategy: '改善髋关节屈曲活动度，强化后链肌群',
    exercises: ['hip-flexion-mobility', 'posterior-chain-strengthening', 'squat-pattern-retraining'],
    progressionPhases: [
      {
        phase: '第一阶段：活动度改善',
        description: '优先改善髋关节和踝关节活动度',
        duration: '2-3周',
        focus: ['髋关节屈曲活动度', '踝关节背屈', '胸椎活动度']
      },
      {
        phase: '第二阶段：模式重塑',
        description: '重新学习正确的下蹲模式',
        duration: '3-4周',
        focus: ['髋主导动作模式', '躯干稳定性', '协调性训练']
      },
      {
        phase: '第三阶段：负荷适应',
        description: '在负荷下维持正确动作模式',
        duration: '4-6周',
        focus: ['渐进负荷', '复合动作', '运动表现提升']
      }
    ]
  }
];

// 针对不同评分级别的训练强度和复杂度
export const SCORE_BASED_TRAINING_INTENSITY = {
  PAIN_STATE: { // 0分 - 疼痛状态
    intensity: 'minimal',
    focus: 'pain-relief',
    progression: 'very-slow',
    contraindications: ['aggressive_stretching', 'high_load_exercises']
  },
  DYSFUNCTION: { // 1分 - 功能障碍
    intensity: 'low-moderate',
    focus: 'basic-mobility-stability',
    progression: 'slow',
    contraindications: ['advanced_movements']
  },
  COMPENSATION: { // 2分 - 代偿模式
    intensity: 'moderate',
    focus: 'pattern-correction',
    progression: 'moderate',
    contraindications: ['ignoring_compensations']
  },
  OPTIMAL: { // 3分 - 最佳表现
    intensity: 'maintenance',
    focus: 'performance-enhancement',
    progression: 'as-needed',
    contraindications: []
  }
} as const;

// 基础训练原则和分级
export const BASIC_TRAINING_PRINCIPLES = {
  PAIN_RELIEF: 'pain-relief',
  MOBILITY: 'mobility', 
  STABILITY: 'stability',
  STRENGTH: 'strength',
  INTEGRATION: 'integration'
} as const;

// 全面的训练方案生成函数
export function generatePersonalizedTraining(
  scores: Record<string, number>
): TrainingRecommendation[] {
  const baseExercises = {
    'deep-squat': DEEP_SQUAT_TRAINING,
    'hurdle-step': HURDLE_STEP_TRAINING,
    'inline-lunge': INLINE_LUNGE_TRAINING,
    'shoulder-mobility': SHOULDER_MOBILITY_TRAINING,
    'active-straight-leg-raise': ACTIVE_STRAIGHT_LEG_RAISE_TRAINING,
    'trunk-stability-push-up': TRUNK_STABILITY_PUSHUP_TRAINING,
    'rotary-stability': ROTARY_STABILITY_TRAINING
  };

  const recommendations: TrainingRecommendation[] = [];

  Object.entries(scores).forEach(([testId, score]) => {
    const exercises = baseExercises[testId as keyof typeof baseExercises] || [];
    
    if (exercises.length === 0) return;

    // 基于评分选择练习数量和类型 - 0分需要最全面的康复方案
    let selectedExercises = exercises;
    
    if (score === 0) {
      // 疼痛状态：需要最全面的康复训练方案
      // 包含疼痛管理、基础活动度、稳定性重建
      selectedExercises = exercises; // 保留所有练习，但调整强度
      
      // 添加疼痛管理和基础康复练习
      selectedExercises = [
        ...getPainManagementExercises(testId),
        ...exercises.filter(ex => ['mobility', 'stability', 'corrective'].includes(ex.category))
      ];
    } else if (score === 1) {
      // 功能障碍：全面的功能重建方案
      selectedExercises = exercises.filter(ex => 
        ['mobility', 'stability', 'corrective', 'neuromuscular'].includes(ex.category)
      );
    } else if (score === 2) {
      // 代偿模式：针对性纠正训练
      selectedExercises = exercises.filter(ex => 
        ['mobility', 'stability', 'strength', 'corrective'].includes(ex.category)
      );
    } else {
      // 最佳表现：维持性和预防性练习
      selectedExercises = exercises.filter(ex => 
        ['strength', 'integration'].includes(ex.category)
      ).slice(0, 2);
    }

    if (selectedExercises.length > 0) {
      const recommendation: TrainingRecommendation = {
        testId,
        score,
        priority: score === 0 ? 'critical' : score === 1 ? 'high' : score === 2 ? 'medium' : 'low',
        exercises: selectedExercises,
        expectedTimeframe: getExpectedTimeframe(score),
        reassessmentInterval: getReassessmentInterval(score)
      };

      // 为0分添加特殊说明（基于专业医学文献）
      if (score === 0) {
        const painManagementNotes: Record<string, string> = {
          'deep-squat': `过顶深蹲疼痛临床解析：可能提示髋/膝/踝关节病变、椎间盘问题、髌股疼痛综合征或关节囊韧带损伤。需排除器质性病变后进行功能训练。`,
          
          'hurdle-step': `跨栏步疼痛临床解析：可能提示髋关节撞击综合征、腰椎不稳定、髂胫束综合征或膝关节半月板韧带问题。建议专业评估髋关节和腰椎功能。`,
          
          'inline-lunge': `直线弓步疼痛临床解析：可能提示股骨髁间综合征、髂胫束摩擦综合征、髋关节盂唇损伤或骶髂关节功能障碍。`,
          
          'shoulder-mobility': `肩部灵活性疼痛临床解析：
• 肩峰下撞击综合征：肩峰下间隙狭窄(<7mm)，肩袖肌腱受压
• 肩袖肌腱病变：特别是冈上肌腱炎或部分撕裂(占肩袖损伤40-60%)
• 盂唇损伤：上盂唇前后(SLAP)损伤风险
• 肩锁关节或胸锁关节功能障碍
建议立即停止过顶活动，寻求骨科或运动医学专科评估。`,
          
          'active-straight-leg-raise': `🔍 主动直腿抬高疼痛临床解析：可能提示坐骨神经痛、椎间盘问题、骶髂关节功能障碍、腰椎应力性骨折或髋关节疾病。`,
          
          'trunk-stability-pushup': `🔍 躯干稳定俯卧撑疼痛临床解析：
• 椎间盘后部病变：椎间盘膨出(4-6mm)或突出(>6mm)
• 椎间小关节综合征：关节面异常接触或关节囊炎症
• 脊柱管/椎间孔狭窄：神经根受压，伸展位加重症状  
• 棘突间撞击综合征：伸展时相邻棘突间距<2mm
伸展位疼痛提示后方结构受压，需要专业影像学检查排除严重病理。`,
          
          'rotary-stability': `🔍 旋转稳定性疼痛临床解析：
• 腰椎屈曲功能障碍：节段性活动受限或过度活动
• 骶髂关节功能障碍：韧带损伤或关节面不匹配
• 椎间盘前部损伤：屈曲位增加前部压力和后部张力
• 坐骨神经张力异常：神经通路受限或粘连
屈曲位疼痛需要评估椎间盘前部和神经张力状态。`
        };
        
        recommendation.specialNotes = painManagementNotes[testId] || '疼痛状态提示可能存在潜在的运动系统功能障碍或组织损伤，需要专业医学评估。';
      }

      recommendations.push(recommendation);
    }
  });

  // 为0分状态添加整体康复建议
  const criticalCount = recommendations.filter(r => r.priority === 'critical').length;
  if (criticalCount > 0) {
    recommendations.unshift({
      testId: 'overall-pain-management',
      score: 0,
      priority: 'critical',
      exercises: getOverallPainManagementProtocol(),
      expectedTimeframe: '2-4周（疼痛缓解期）',
      reassessmentInterval: '每周评估',
      specialNotes: '多项测试疼痛提示需要立即专业医学评估。以下为初步疼痛管理和康复指导。'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// 获取疼痛管理专项练习
function getPainManagementExercises(testId: string): TargetedExercise[] {
  const commonPainManagement: TargetedExercise[] = [
    {
      id: `${testId}-pain-relief-breathing`,
      name: '疼痛缓解呼吸法',
      category: 'corrective',
      targetMuscles: ['膈肌', '腹横肌', '骨盆底肌'],
      targetLimitations: ['疼痛引起的肌肉紧张', '自律神经失调'],
      description: '通过深层呼吸激活副交感神经系统，促进疼痛缓解和肌肉放松',
      biomechanicalRationale: '深呼吸可激活迷走神经，降低交感神经活动，减少疼痛感知和肌肉紧张',
      instructions: [
        '舒适体位躺下或坐下',
        '一手放胸部，一手放腹部', 
        '缓慢鼻吸气4秒，腹部上升',
        '屏气2秒',
        '缓慢口呼气6秒，腹部下降',
        '重复10-15次'
      ],
      progression: ['延长呼气时间', '增加练习次数', '结合渐进肌肉放松'],
      precautions: ['避免过度通气', '出现头晕立即停止', '保持舒适节奏'],
      dosage: {
        reps: 10,
        sets: 3,
        frequency: '每日3-4次'
      }
    },
    {
      id: `${testId}-gentle-mobilization`,
      name: '温和关节活动',
      category: 'mobility',
      targetMuscles: ['根据具体测试部位调整'],
      targetLimitations: ['关节僵硬', '血液循环不良', '炎症反应'],
      description: '在无痛范围内进行温和的关节活动，促进血液循环和营养交换',
      biomechanicalRationale: '温和活动可促进滑液分泌，改善关节营养，减少炎症介质积聚',
      instructions: [
        '找到舒适起始位置',
        '缓慢进行小幅度关节活动',
        '停留在无痛范围内',
        '感受温和的拉伸或活动感',
        '避免任何疼痛或不适'
      ],
      progression: ['逐渐增加活动范围', '增加活动频次', '加入多方向运动'],
      precautions: ['严格控制在无痛范围', '出现疼痛立即停止', '动作缓慢温和'],
      dosage: {
        reps: 5,
        sets: 2,
        frequency: '每日2-3次'
      }
    }
  ];

  return commonPainManagement;
}

// 获取整体疼痛管理协议
function getOverallPainManagementProtocol(): TargetedExercise[] {
  return [
    {
      id: 'comprehensive-pain-assessment',
      name: '疼痛综合评估建议',
      category: 'neural',
      targetMuscles: ['全身评估'],
      targetLimitations: ['多系统功能障碍', '潜在病理状态'],
      description: '建议立即寻求专业医学评估，排除严重病理状态',
      biomechanicalRationale: '多项FMS测试疼痛可能提示系统性问题，需要专业诊断排除器质性病变',
      instructions: [
        '记录疼痛特征（位置、性质、程度、诱发因素）',
        '寻求专业医生评估',
        '必要时进行影像学检查',
        '制定个性化治疗方案',
        '在专业指导下开始康复训练'
      ],
      progression: ['疼痛缓解后逐步增加活动', '功能评估指导下进阶', '长期康复计划制定'],
      precautions: ['避免加重疼痛的活动', '密切监控症状变化', '严格遵循医学建议'],
      dosage: {
        frequency: '立即执行'
      }
    },
    {
      id: 'initial-pain-management',
      name: '初期疼痛管理',
      category: 'corrective', 
      targetMuscles: ['全身放松'],
      targetLimitations: ['急性疼痛', '炎症反应', '肌肉痉挛'],
      description: '采用物理治疗手段初步管理疼痛，为后续康复创造条件',
      biomechanicalRationale: '合理的疼痛管理可打断疼痛-肌肉痉挛-疼痛的恶性循环',
      instructions: [
        '冰敷急性炎症部位（15-20分钟）',
        '温和热敷慢性紧张区域',
        '保持适当的休息和活动平衡',
        '避免完全不动，防止废用性萎缩',
        '记录疼痛日记，监控变化'
      ],
      progression: ['疼痛缓解后增加活动', '逐步恢复功能训练', '制定长期康复计划'],
      precautions: ['避免过度休息', '密切监控疼痛变化', '及时调整治疗策略'],
      dosage: {
        frequency: '根据需要，每日2-4次'
      }
    },
    {
      id: 'basic-movement-restoration',
      name: '基础动作恢复',
      category: 'corrective',
      targetMuscles: ['全身协调'],
      targetLimitations: ['基础功能丧失', '动作恐惧', '功能性残疾'],
      description: '在疼痛缓解后逐步恢复基础日常活动能力',
      biomechanicalRationale: '早期适度活动有助于组织修复和功能恢复，预防长期功能障碍',
      instructions: [
        '从最基础的日常活动开始',
        '逐步增加活动强度和范围',
        '建立正确的动作模式',
        '避免代偿性动作习惯',
        '保持训练的连续性和渐进性'
      ],
      progression: ['基础ADL → 功能性活动 → 运动表现', '个体化进阶方案', '长期随访管理'],
      precautions: ['遵循无痛原则', '避免过度训练', '密切专业监督'],
      dosage: {
        frequency: '每日，根据耐受程度调整'
      }
    }
  ];
}

// 辅助函数
function getExpectedTimeframe(score: number): string {
  switch (score) {
    case 0: return '4-6周（疼痛缓解）';
    case 1: return '6-8周（功能改善）';
    case 2: return '4-6周（模式纠正）';
    case 3: return '2-4周（维持优化）';
    default: return '4-6周';
  }
}

function getReassessmentInterval(score: number): string {
  switch (score) {
    case 0: return '1-2周（密切监控）';
    case 1: return '2-3周';
    case 2: return '3-4周';
    case 3: return '4-6周';
    default: return '2-4周';
  }
} 