// FMS生物力学与评分解析数据
// 基于功能性动作筛查的生物力学与解剖学分析

export interface MuscleGroup {
  name: string;
  origin: string;
  insertion: string;
  function: string;
  category: 'primary' | 'synergist' | 'stabilizer';
}

export interface JointMovement {
  joint: string;
  movement: string;
  range: string;
}

export interface ScoreAnalysis {
  score: 0 | 1 | 2 | 3;
  description: string;
  functionalLimitations: string[];
  compensatoryPatterns: string[];
  recommendations: string[];
  riskFactors?: string[];
}

export interface BiomechanicalAnalysis {
  testId: string;
  testName: string;
  jointMovements: JointMovement[];
  muscleGroups: MuscleGroup[];
  scoreAnalyses: ScoreAnalysis[];
  clinicalSignificance: string;
}

export const FMS_BIOMECHANICS: BiomechanicalAnalysis[] = [
  {
    testId: 'deep-squat',
    testName: '过顶深蹲',
    jointMovements: [
      { joint: '髋关节', movement: '屈曲', range: '90°以上' },
      { joint: '膝关节', movement: '屈曲', range: '90°以上' },
      { joint: '踝关节', movement: '背屈', range: '~30°' },
      { joint: '肩关节', movement: '屈曲与外旋', range: '~180°' },
      { joint: '脊柱', movement: '保持自然生理曲度', range: '中立位' }
    ],
    muscleGroups: [
      {
        name: '股四头肌群',
        origin: '髂前下棘、股骨外侧面、股骨内侧面、股骨前面',
        insertion: '胫骨粗隆',
        function: '膝伸展和髋屈曲',
        category: 'primary'
      },
      {
        name: '臀大肌',
        origin: '骶骨后面和髂骨后部',
        insertion: '股骨粗隆',
        function: '髋关节伸展，提供回到起始位置的力量',
        category: 'primary'
      },
      {
        name: '腘绳肌群',
        origin: '坐骨结节',
        insertion: '腓骨头、胫骨内侧',
        function: '控制髋伸展和膝屈曲',
        category: 'synergist'
      },
      {
        name: '腹横肌',
        origin: '腹股沟韧带和胸腰筋膜',
        insertion: '腹白线中部',
        function: '提供脊柱稳定性',
        category: 'stabilizer'
      },
      {
        name: '臀中肌',
        origin: '髂骨外侧面',
        insertion: '股骨大转子',
        function: '防止骨盆侧倾',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '全身协调性优异',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['继续保持良好的动作模式', '可进行更高强度的功能性训练'],
        riskFactors: []
      },
      {
        score: 2,
        description: '需垫高后跟才能完成动作',
        functionalLimitations: [
          '踝关节背屈受限（小腿三头肌紧张）',
          '胸椎活动度不足',
          '髋关节内/外旋控制力欠佳',
          '核心肌群激活不充分'
        ],
        compensatoryPatterns: [
          '足弓塌陷，脚跟提前离地',
          '膝关节内扣(外翻)',
          '躯干过度前倾代替髋关节屈曲',
          '肩胛前倾以维持平衡'
        ],
        recommendations: [
          '小腿三头肌拉伸训练',
          '胸椎活动度改善练习',
          '髋关节稳定性训练',
          '核心激活训练'
        ]
      },
      {
        score: 1,
        description: '即使垫高后跟仍无法完成标准动作',
        functionalLimitations: [
          '髋关节严重活动度受限',
          '腘绳肌/臀肌群显著紧张',
          '核心稳定性差',
          '胸椎活动度严重受限',
          '股四头肌与腘绳肌力量比例失调'
        ],
        compensatoryPatterns: [
          '骨盆严重后倾',
          '腰椎过度屈曲(猫背)',
          '膝关节明显内扣或外展',
          '重心显著后移',
          '下蹲浅而不稳'
        ],
        recommendations: [
          '基础髋关节活动度训练',
          '腘绳肌/臀肌群基础放松',
          '深层核心基础激活训练',
          '胸椎活动度基本练习',
          '股四头肌基础力量训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '髋/膝/踝关节病变',
          '椎间盘问题',
          '髌股疼痛综合征',
          '关节囊或韧带损伤'
        ]
      }
    ],
    clinicalSignificance: '过顶深蹲测试评估全身协调性，特别是下肢灵活性、躯干稳定性和肩关节活动度的综合表现。'
  },
  {
    testId: 'hurdle-step',
    testName: '跨栏步',
    jointMovements: [
      { joint: '支撑腿髋关节', movement: '保持伸展和适度外展', range: '中立位' },
      { joint: '支撑腿膝关节', movement: '保持伸展', range: '0°' },
      { joint: '迈步腿髋关节', movement: '屈曲和轻度外展', range: '>90°' },
      { joint: '迈步腿膝关节', movement: '屈曲后伸展', range: '90°-0°' }
    ],
    muscleGroups: [
      {
        name: '髂腰肌',
        origin: '腰椎横突、髂窝',
        insertion: '股骨小转子',
        function: '主要髋屈肌',
        category: 'primary'
      },
      {
        name: '股直肌',
        origin: '髂前下棘',
        insertion: '胫骨粗隆',
        function: '执行髋屈曲和控制膝关节运动',
        category: 'primary'
      },
      {
        name: '臀中肌/臀小肌',
        origin: '髂骨外侧面',
        insertion: '股骨大转子',
        function: '防止支撑侧骨盆下沉',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '单腿支撑稳定性优异',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持现有平衡训练', '可增加动态平衡挑战']
      },
      {
        score: 2,
        description: '完成动作但质量不佳',
        functionalLimitations: [
          '支撑腿臀中肌/臀小肌功能弱',
          '摆动腿髋屈肌活动度受限',
          '核心稳定性控制中等',
          '神经肌肉协调控制能力不足'
        ],
        compensatoryPatterns: [
          '骨盆侧倾或过度旋转',
          '支撑腿膝关节内扣',
          '摆动腿通过外展"绕过"栏架',
          '躯干侧弯以辅助重心调整'
        ],
        recommendations: [
          '单腿站立平衡训练',
          '髋外展肌力量强化',
          '髋屈肌活动度训练',
          '核心稳定性练习'
        ]
      },
      {
        score: 1,
        description: '无法完成动作或失去平衡',
        functionalLimitations: [
          '单腿支撑能力显著不足',
          '髋关节屈肌/伸肌协调性差',
          '核心-骨盆稳定性严重不足',
          '腘绳肌或髂腰肌严重紧张'
        ],
        compensatoryPatterns: [
          '通过整体体重转移代替控制性动作',
          '明显的骨盆离开中线位置',
          '躯干明显旋转或前倾',
          '支撑腿显著内扣或髋外旋'
        ],
        recommendations: [
          '基础平衡感统训练',
          '髋关节基础活动度练习',
          '深层核心激活',
          '单腿支撑基础训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '髋关节撞击综合征',
          '腰椎不稳定',
          '髂胫束综合征',
          '膝关节半月板或韧带问题'
        ]
      }
    ],
    clinicalSignificance: '跨栏步测试评估单腿站立平衡和下肢协调能力，是识别下肢不对称性的重要指标。'
  },
  {
    testId: 'inline-lunge',
    testName: '直线弓步',
    jointMovements: [
      { joint: '前腿髋关节', movement: '屈曲', range: '~90°' },
      { joint: '前腿膝关节', movement: '屈曲', range: '~90°' },
      { joint: '后腿髋关节', movement: '伸展', range: '中立位' },
      { joint: '脊柱', movement: '保持垂直，不侧弯', range: '中立位' }
    ],
    muscleGroups: [
      {
        name: '股四头肌群',
        origin: '髂前下棘、股骨',
        insertion: '胫骨粗隆',
        function: '前腿控制下蹲幅度',
        category: 'primary'
      },
      {
        name: '大收肌',
        origin: '耻骨下支和坐骨结节',
        insertion: '股骨内侧',
        function: '维持窄基底姿势',
        category: 'synergist'
      },
      {
        name: '臀中肌/臀小肌',
        origin: '髂骨外侧面',
        insertion: '股骨大转子',
        function: '防止骨盆侧倾，维持前额面稳定性',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '窄基底支撑下的出色平衡能力',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持现有平衡和协调能力', '可增加动态挑战性训练']
      },
      {
        score: 2,
        description: '完成动作但控制不佳',
        functionalLimitations: [
          '前腿踝关节背屈受限',
          '后腿髋屈肌紧张',
          '髋内/外旋控制力中等',
          '胸椎旋转活动度不足'
        ],
        compensatoryPatterns: [
          '骨盆旋转或前倾增加',
          '前脚过度外翻',
          '前膝内扣或外翻',
          '长杆无法保持垂直或接触身体'
        ],
        recommendations: [
          '髋屈肌拉伸训练',
          '踝关节活动度改善',
          '核心稳定性强化',
          '平衡协调训练'
        ]
      },
      {
        score: 1,
        description: '无法完成动作或显著失去平衡',
        functionalLimitations: [
          '后腿髋屈肌严重紧张',
          '前腿踝关节显著受限',
          '髋内收肌群功能障碍',
          '核心-骨盆稳定性差'
        ],
        compensatoryPatterns: [
          '无法保持窄基底姿势(脚尖外旋)',
          '骨盆高度严重不稳定',
          '躯干显著前倾或侧倾',
          '通过上肢强行保持平衡'
        ],
        recommendations: [
          '基础髋关节活动度训练',
          '核心稳定性基础训练',
          '平衡感统合训练',
          '窄基底支撑练习'
        ]
      },
      {
        score: 0,
        description: '出现疼痛',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '股骨髁间综合征',
          '髂胫束摩擦综合征',
          '髋关节盂唇损伤',
          '骶髂关节功能障碍'
        ]
      }
    ],
    clinicalSignificance: '直线弓步测试评估窄基底支撑下的稳定性和控制力，是多平面稳定性的重要指标。'
  },
  {
    testId: 'shoulder-mobility',
    testName: '肩部灵活性',
    jointMovements: [
      { joint: '上伸手臂肩关节', movement: '屈曲、内旋和内收', range: '180°+内旋' },
      { joint: '下伸手臂肩关节', movement: '伸展、外旋和外展', range: '60°+外旋' },
      { joint: '胸椎', movement: '适度伸展配合肩带活动', range: '10-15°' }
    ],
    muscleGroups: [
      {
        name: '三角肌前束',
        origin: '锁骨外侧1/3',
        insertion: '肱骨三角肌粗隆',
        function: '执行肩屈曲',
        category: 'primary'
      },
      {
        name: '背阔肌',
        origin: '下6胸椎棘突和腰骶筋膜',
        insertion: '肱骨小结节嵴',
        function: '执行肩伸展和内收',
        category: 'primary'
      },
      {
        name: '肩胛下肌',
        origin: '肩胛下窝',
        insertion: '肱骨小结节',
        function: '执行肩内旋和稳定肩关节',
        category: 'synergist'
      },
      {
        name: '前锯肌',
        origin: '上9对肋骨',
        insertion: '肩胛内侧缘',
        function: '稳定肩胛骨，防止翼状肩胛',
        category: 'stabilizer'
      },
      {
        name: '斜方肌',
        origin: '枕骨和胸椎棘突',
        insertion: '锁骨和肩胛骨',
        function: '支持肩胛上提和稳定肩胛骨位置',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '肩胛胸廓关节活动度佳',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持现有肩部活动度', '继续肩胛稳定训练']
      },
      {
        score: 2,
        description: '双手间距离增加',
        functionalLimitations: [
          '肩内旋受限（肩袖肌群紧张）',
          '肩外旋受限（胸肌紧张）',
          '肩胛运动控制能力中等',
          '背阔肌或肱三头肌紧张'
        ],
        compensatoryPatterns: [
          '肩胛上提或过度内收',
          '胸椎代偿性扩展',
          '颈部前倾或侧屈',
          '肩关节前倾以增加活动范围'
        ],
        recommendations: [
          '肩袖肌群放松训练',
          '胸肌拉伸',
          '肩胛稳定性训练',
          '胸椎活动度改善'
        ]
      },
      {
        score: 1,
        description: '双手间距离显著增加',
        functionalLimitations: [
          '显著的肩关节囊紧张',
          '胸小肌/胸大肌严重紧张',
          '肩胛下肌/肩袖肌群显著紧张',
          '胸椎活动度严重受限'
        ],
        compensatoryPatterns: [
          '肩胛明显翼状异常',
          '颈部过度代偿性运动',
          '躯干严重侧弯',
          '利用肘关节屈曲"缩短"距离'
        ],
        recommendations: [
          '胸肌基础松解',
          '肩关节囊基础拉伸',
          '肩胛稳定性基础重建',
          '胸椎活动度基本训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛或肩碰撞测试阳性',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '肩峰下撞击综合征',
          '肩袖损伤',
          '盂唇损伤',
          '胸锁关节或肩锁关节功能障碍'
        ]
      }
    ],
    clinicalSignificance: '肩部灵活性测试评估肩带环之间的协调性和肌肉平衡，是上肢功能的关键指标。'
  },
  {
    testId: 'active-straight-leg-raise',
    testName: '主动直腿抬高',
    jointMovements: [
      { joint: '抬腿侧髋关节', movement: '屈曲', range: '70-90°' },
      { joint: '膝关节', movement: '伸展', range: '0°' },
      { joint: '骨盆', movement: '保持水平', range: '中立位' },
      { joint: '腰椎', movement: '保持自然生理弯曲', range: '中立位' }
    ],
    muscleGroups: [
      {
        name: '髂腰肌',
        origin: '腰椎横突、髂窝',
        insertion: '股骨小转子',
        function: '主要髋屈肌，产生抬腿主力',
        category: 'primary'
      },
      {
        name: '股直肌',
        origin: '髂前下棘',
        insertion: '胫骨粗隆',
        function: '辅助髋屈曲，同时维持膝伸展',
        category: 'primary'
      },
      {
        name: '腹横肌',
        origin: '腹股沟韧带和胸腰筋膜',
        insertion: '腹白线深层',
        function: '提供深层骨盆-腰椎稳定',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '优异的腘绳肌/臀肌柔韧性',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持现有柔韧性', '继续核心稳定训练']
      },
      {
        score: 2,
        description: '髋关节屈曲活动度中等',
        functionalLimitations: [
          '抬腿侧腘绳肌/臀肌中度紧张',
          '支撑侧髋屈肌活动度受限',
          '骨盆前后倾控制能力中等',
          '髂腰肌力量不足'
        ],
        compensatoryPatterns: [
          '骨盆轻度后倾',
          '抬腿侧骨盆轻微上抬',
          '腰椎轻度伸展',
          '抬腿时膝关节轻微屈曲'
        ],
        recommendations: [
          '腘绳肌柔韧性训练',
          '髂腰肌力量强化',
          '骨盆稳定性训练',
          '神经动力学训练'
        ]
      },
      {
        score: 1,
        description: '髋关节屈曲活动度显著受限',
        functionalLimitations: [
          '抬腿侧腘绳肌/臀肌严重紧张',
          '坐骨神经张力异常',
          '骨盆-腰椎稳定性显著不足',
          '髋关节后侧囊严重受限'
        ],
        compensatoryPatterns: [
          '骨盆明显后倾或旋转',
          '抬腿侧骨盆显著上抬',
          '腰椎过度伸展或侧弯',
          '膝关节显著屈曲辅助抬腿'
        ],
        recommendations: [
          '腘绳肌/臀肌基础松解',
          '神经松动基础技术',
          '骨盆稳定性基础重建',
          '髋关节基础活动度训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '坐骨神经痛',
          '椎间盘问题',
          '骶髂关节功能障碍',
          '腰椎应力性骨折',
          '髋关节疾病'
        ]
      }
    ],
    clinicalSignificance: '主动直腿抬高测试评估髋关节活动度和骨盆-核心稳定性的重要指标。'
  },
  {
    testId: 'trunk-stability-push-up',
    testName: '躯干稳定俯卧撑',
    jointMovements: [
      { joint: '肩关节', movement: '从屈曲到伸展', range: '~90°-0°' },
      { joint: '肘关节', movement: '从屈曲到完全伸展', range: '90°-0°' },
      { joint: '腕关节', movement: '保持伸展，承重', range: '伸展位' },
      { joint: '脊柱', movement: '全程保持中立位', range: '无塌腰' },
      { joint: '髋关节', movement: '保持伸展', range: '不下沉' }
    ],
    muscleGroups: [
      {
        name: '胸大肌',
        origin: '锁骨、胸骨和肋软骨',
        insertion: '肱骨大结节嵴',
        function: '执行肩水平内收，产生主要推力',
        category: 'primary'
      },
      {
        name: '肱三头肌',
        origin: '肩胛盂下结节、肱骨后面上部、肱骨后面下部',
        insertion: '尺骨鹰嘴突',
        function: '执行肘关节伸展，产生主要推力',
        category: 'primary'
      },
      {
        name: '前锯肌',
        origin: '上9对肋骨',
        insertion: '肩胛内侧缘',
        function: '稳定肩胛骨，防止翼状肩胛',
        category: 'synergist'
      },
      {
        name: '腹直肌',
        origin: '耻骨联合',
        insertion: '肋软骨和剑突',
        function: '防止腰椎过度前凸',
        category: 'stabilizer'
      },
      {
        name: '腹横肌',
        origin: '腹股沟韧带和胸腰筋膜',
        insertion: '腹白线前层',
        function: '提供"筒状"核心稳定',
        category: 'stabilizer'
      },
      {
        name: '臀大肌',
        origin: '骶骨和髂骨后部',
        insertion: '股骨粗隆',
        function: '维持髋关节伸展位置',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '强大的核心-肩带连接稳定性',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持现有训练强度', '可增加不稳定表面训练'],
        riskFactors: []
      },
      {
        score: 2,
        description: '需降低难度才能完成动作',
        functionalLimitations: [
          '肩胛胸廓稳定性中等',
          '前锯肌/斜方肌下束协调性不佳',
          '核心与肩带连接控制能力中等',
          '胸椎伸展活动度受限',
          '腹直肌/腹横肌激活不足'
        ],
        compensatoryPatterns: [
          '肩胛上提或内收过早',
          '腰椎过度伸展(塌腰)',
          '肩膀前倾',
          '头颈前伸',
          '躯干无法作为整体移动'
        ],
        recommendations: [
          '肩胛稳定性训练',
          '核心力量训练',
          '胸椎活动度练习',
          '俯卧撑进阶训练'
        ]
      },
      {
        score: 1,
        description: '即使降低难度仍无法完成动作',
        functionalLimitations: [
          '肩胛胸廓稳定性严重不足',
          '躯干-肩带连接控制能力差',
          '腹直肌/腹横肌力量不足',
          '上肢推力生成能力差',
          '胸椎活动度严重受限'
        ],
        compensatoryPatterns: [
          '明显的腰椎过度伸展(严重塌腰)',
          '肩胛翼状畸形',
          '头颈过度伸展',
          '髋关节下沉或先于躯干上移',
          '无法以"整体板"方式移动身体'
        ],
        recommendations: [
          '基础核心激活训练',
          '肩胛稳定性基础练习',
          '上肢力量基础训练',
          '姿势矫正训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛或伸展测试阳性',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '椎间盘突出',
          '神经根压迫',
          '肩袖肌腱病',
          '颈椎问题',
          '腰椎椎间关节功能障碍'
        ]
      }
    ],
    clinicalSignificance: '躯干稳定俯卧撑测试评估上肢闭链运动中的躯干稳定控制能力，反映核心-肩带连接的功能整合水平。'
  },
  {
    testId: 'rotary-stability',
    testName: '旋转稳定性',
    jointMovements: [
      { joint: '上肢肩关节', movement: '屈曲和伸展', range: '90°-0°' },
      { joint: '上肢肘关节', movement: '伸展和屈曲', range: '0°-90°' },
      { joint: '下肢髋关节', movement: '伸展和屈曲', range: '90°-0°' },
      { joint: '下肢膝关节', movement: '伸展和屈曲', range: '0°-90°' },
      { joint: '脊柱', movement: '维持中立位', range: '抵抗旋转力矩' }
    ],
    muscleGroups: [
      {
        name: '三角肌前束',
        origin: '锁骨外侧1/3',
        insertion: '肱骨三角肌粗隆',
        function: '执行肩关节屈曲',
        category: 'primary'
      },
      {
        name: '背阔肌',
        origin: '下胸椎棘突和腰骶筋膜',
        insertion: '肱骨小结节嵴',
        function: '执行肩伸展',
        category: 'primary'
      },
      {
        name: '臀大肌',
        origin: '骶骨和髂骨后部',
        insertion: '股骨粗隆',
        function: '执行髋关节伸展',
        category: 'primary'
      },
      {
        name: '腹横肌',
        origin: '腹股沟韧带和胸腰筋膜',
        insertion: '腹白线后层',
        function: '深层腹肌，维持脊柱中立',
        category: 'stabilizer'
      },
      {
        name: '腹内斜肌/腹外斜肌',
        origin: '腹股沟韧带和髂嵴/下8对肋骨外侧',
        insertion: '下肋缘/腹白线和耻骨',
        function: '控制躯干旋转，提供反旋转稳定',
        category: 'stabilizer'
      },
      {
        name: '多裂肌',
        origin: '各椎体横突',
        insertion: '上位椎棘突',
        function: '提供节段稳定性',
        category: 'stabilizer'
      },
      {
        name: '腰方肌',
        origin: '髂嵴后部',
        insertion: '第12肋骨和腰椎横突',
        function: '维持侧向稳定',
        category: 'stabilizer'
      }
    ],
    scoreAnalyses: [
      {
        score: 3,
        description: '卓越的多平面躯干稳定性',
        functionalLimitations: [],
        compensatoryPatterns: [],
        recommendations: ['维持高水平训练', '可增加运动专项训练'],
        riskFactors: []
      },
      {
        score: 2,
        description: '无法完成同侧模式，只能完成对角线模式',
        functionalLimitations: [
          '多平面躯干稳定性中等',
          '腹内/外斜肌协调性不佳',
          '同侧肌链整合能力受限',
          '脊柱旋转控制能力中等',
          '单侧上/下肢分离控制力不足'
        ],
        compensatoryPatterns: [
          '骨盆轻度旋转',
          '脊柱侧弯代替稳定控制',
          '肩胛骨过度提起或下沉',
          '髋关节代偿性外旋',
          '支撑侧肘/膝关节外展'
        ],
        recommendations: [
          '多平面稳定性训练',
          '对角线模式训练',
          '核心旋转控制练习',
          '同侧肌链整合训练'
        ]
      },
      {
        score: 1,
        description: '无法完成对角线模式',
        functionalLimitations: [
          '多平面稳定性显著不足',
          '深层腹肌(腹横肌)激活不足',
          '脊柱分节控制能力差',
          '对角线肌链整合能力显著受限',
          '四足姿势支撑稳定性差'
        ],
        compensatoryPatterns: [
          '明显的骨盆旋转或侧倾',
          '躯干显著下沉',
          '腰椎过度伸展或侧弯',
          '无法保持四点支撑姿势',
          '支撑侧身体结构明显偏移'
        ],
        recommendations: [
          '基础四足支撑训练',
          '深层核心激活',
          '简化版本练习',
          '姿势控制基础训练'
        ]
      },
      {
        score: 0,
        description: '出现疼痛或伸展排除测试阳性',
        functionalLimitations: ['存在潜在病理状态'],
        compensatoryPatterns: [],
        recommendations: ['立即停止测试，寻求专业医学评估'],
        riskFactors: [
          '椎间盘问题',
          '椎旁肌劳损',
          '骶髂关节功能障碍',
          '旋转不稳定性',
          '肩部或髋部病理'
        ]
      }
    ],
    clinicalSignificance: '旋转稳定性测试评估多平面核心稳定性和肢体协调性，反映脊柱在复杂动作模式中的控制能力。'
  }
];

// 排除性测试的病理分析
export interface ClearanceTestAnalysis {
  testId: string;
  testName: string;
  pathologyIndicators: {
    description: string;
    potentialInjuries: string[];
    biomechanicalMechanism: string[];
    clinicalRecommendations: string[];
  };
}

export const CLEARANCE_TEST_PATHOLOGY: ClearanceTestAnalysis[] = [
  {
    testId: 'shoulder-impingement',
    testName: '肩部碰撞测试',
    pathologyIndicators: {
      description: '当受试者将一手放置于对侧肩部并尽可能抬高肘部时出现疼痛',
      potentialInjuries: [
        '肩峰下撞击综合征：肱骨大结节与肩峰结构异常挤压',
        '肩袖肌腱病变：特别是冈上肌腱炎或部分撕裂（占肩袖损伤40-60%）',
        '盂唇损伤：尤其是上盂唇前后（SLAP）损伤',
        '肱二头肌长头腱炎：因解剖位置通过关节内，易受摩擦损伤'
      ],
      biomechanicalMechanism: [
        '肩峰下间隙正常宽度应≥7mm，低于此值增加撞击风险',
        'Type III钩状肩峰增加撞击风险2-5倍',
        '肩胛前倾增加（>15°）引起功能性撞击',
        '肩胛上旋不足(<30°)导致肩峰无法适当抬离肱骨',
        '前锯肌/下斜方肌活化不足(EMG活动降低25-40%)，上斜方肌过度活跃',
        '圆肩姿势（肩胛前倾增加8-15°）缩小肩峰下空间约20%'
      ],
      clinicalRecommendations: [
        '立即停止过顶动作训练',
        '寻求运动医学专科医生评估',
        '可能需要肩关节MRI或超声检查',
        '在获得医学许可前避免肩部高强度活动',
        '优先进行肩胛稳定性和胸椎活动度评估'
      ]
    }
  },
  {
    testId: 'spinal-extension',
    testName: '脊柱伸展测试',
    pathologyIndicators: {
      description: '俯卧位双肘伸直撑起上身，脊柱充分伸展时出现疼痛',
      potentialInjuries: [
        '椎间盘后部病变：包括椎间盘膨出(4-6mm)或突出(>6mm)',
        '椎间小关节综合征：关节面异常接触或关节囊炎症',
        '脊柱管/椎间孔狭窄：导致神经根受压，伸展位加重症状',
        '棘突间撞击综合征：伸展时相邻棘突间距离减少至<2mm'
      ],
      biomechanicalMechanism: [
        '伸展导致椎间盘后部压力增加30-40%',
        '椎间小关节负重面积在伸展时增加约30%，关节面压力显著上升',
        '椎间孔面积在伸展时减少18-23%',
        '侧隐窝面积在脊柱伸展时减小约15%，可能压迫穿行神经',
        '黄韧带内折，减少椎管可用空间',
        '棘间/棘上韧带拉力增加2-3倍',
        '腰椎过度伸展（>30°）导致椎体后缘接触'
      ],
      clinicalRecommendations: [
        '立即停止脊柱伸展动作',
        '避免反弓类训练动作',
        '寻求脊柱专科医生评估',
        '可能需要腰椎MRI检查排除椎间盘病变',
        '在医学评估前避免腰椎负重训练'
      ]
    }
  },
  {
    testId: 'spinal-flexion',
    testName: '脊柱屈曲测试',
    pathologyIndicators: {
      description: '从四点支撑姿势使臀部向后接触脚跟，胸部下沉至大腿时出现疼痛',
      potentialInjuries: [
        '腰椎屈曲功能障碍：包括节段性活动受限或过度活动',
        '骶髂关节功能障碍：韧带损伤或关节面不匹配',
        '椎间盘前部损伤：屈曲位置增加前部压力和后部张力',
        '坐骨神经张力异常：神经通路受限或粘连'
      ],
      biomechanicalMechanism: [
        '腰椎屈曲使椎间盘后部张力增加约40-50%',
        '椎间盘前部受压增加约25-35%',
        '全脊柱屈曲时L5-S1节段可承受正常体重4-6倍的剪切力',
        '屈曲时髂骨相对于骶骨后旋约8°',
        '脊柱和髋关节同时屈曲增加神经组织整体张力约40%',
        '坐骨神经屈曲位置拉长约20%（从坐骨结节到腘窝）',
        '硬脊膜和神经根套在脊柱屈曲时上移'
      ],
      clinicalRecommendations: [
        '避免深度脊柱屈曲动作',
        '寻求神经科或骨科专科评估',
        '可能需要神经传导检查或MRI',
        '在医学评估前避免瑜伽类深度屈曲训练',
        '重点评估坐骨神经张力和骶髂关节功能'
      ]
    }
  }
]; 