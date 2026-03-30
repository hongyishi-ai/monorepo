export interface FmsTest {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  scoringCriteria: {
    score: number;
    criteria: string;
  }[];
  videoPlaceholder: string; // 将用于视频演示
  isClearanceTest?: boolean; // 标识是否为排除性测试
  requiresBilateralAssessment?: boolean; // 标识是否需要左右侧分别评估
  asymmetryRiskLevel?: 'high' | 'medium' | 'low'; // 不对称性风险等级
}

// 需要左右侧分别评估的测试ID
export const BILATERAL_ASSESSMENT_TESTS = [
  'hurdle-step',
  'inline-lunge', 
  'shoulder-mobility',
  'active-straight-leg-raise',
  'rotary-stability'
];

export const FMS_TESTS: FmsTest[] = [
  // 正确的FMS测试顺序：排除测试在对应基础测试之前进行
  
  // 1. 过顶深蹲 (无对应排除测试)
  {
    id: 'deep-squat',
    name: '过顶深蹲 (Deep Squat)',
    description: '评估双侧、对称、功能性的下肢、躯干和上肢的灵活性与控制能力。',
    instructions: [
      '双脚与肩同宽，脚尖朝前。',
      '双手握住木杆，置于头顶，肘部伸直。',
      '保持手臂伸直，尽可能深地往下蹲。',
      '脚跟不能离地，躯干与小腿保持平行。',
    ],
    scoringCriteria: [
      { score: 3, criteria: '躯干与小腿平行，大腿低于水平位置，膝关节与脚尖在一条直线上，木杆与脚尖在一条垂线上。' },
      { score: 2, criteria: '如果在脚跟下垫高后能完成上述标准。' },
      { score: 1, criteria: '躯干与小腿不平行，或大腿没有低于水平面，或膝关节内扣，或木杆前倾。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/deep-squat.mp4',
    requiresBilateralAssessment: false,
  },
  
  // 2. 跨栏步 (无对应排除测试)
  {
    id: 'hurdle-step',
    name: '跨栏步 (Hurdle Step)',
    description: '评估身体在单腿站立时的稳定性和双腿的分离活动能力。检测左右侧不对称性是重要评估目标。',
    instructions: [
      '将横杆置于肩上。',
      '一只脚站立，另一只脚抬起跨过一定高度的栏架。',
      '保持躯干稳定，骨盆水平。',
      '脚跟轻触地面后返回。',
      '注意：需要分别测试左腿和右腿作为支撑腿的表现',
    ],
    scoringCriteria: [
      { score: 3, criteria: '髋、膝、踝在矢状面保持对齐，腰部无多余活动，横杆保持水平。' },
      { score: 2, criteria: '出现腰椎不稳定活动，髋、膝、踝没有对齐，或横杆没有保持水平。' },
      { score: 1, criteria: '失去平衡，或支撑腿与栏架发生接触。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/hurdle-step.mp4',
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'high',
  },
  
  // 3. 直线箭步蹲 (无对应排除测试)
  {
    id: 'inline-lunge',
    name: '直线弓步 (Inline Lunge)',
    description: '评估下肢的柔韧性、稳定性和平衡能力，以及躯干的控制能力。左右侧差异提示核心控制和下肢功能不对称。',
    instructions: [
      '将横杆沿脊柱放置，一手在上，一手在下。',
      '双脚在一条直线上，呈弓步姿势。',
      '后膝触地，前膝保持在脚跟正上方。',
      '保持躯干竖直。',
      '注意：需要分别测试左腿和右腿在前的表现',
    ],
    scoringCriteria: [
      { score: 3, criteria: '完成动作且无多余晃动，横杆与地面垂直，并保持与头部、上背部、下腰部的接触。' },
      { score: 2, criteria: '动作中有晃动，横杆倾斜或离开身体接触点。' },
      { score: 1, criteria: '失去平衡。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/inline-lunge.mp4',
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'high',
  },
  
  // 4. 肩部撞击排除测试 → 5. 肩关节活动度
  {
    id: 'shoulder-impingement-clearance',
    name: '肩部撞击测试 (Shoulder Impingement Clearance)',
    description: '排除肩部撞击综合征，确保在肩部灵活性测试前没有病理性肩部问题。',
    instructions: [
      '站立位，一侧手臂抬起至90度。',
      '将手掌放在对侧肩膀上。',
      '尽力将肘部向上抬高。',
      '观察是否出现疼痛或不适。',
    ],
    scoringCriteria: [
      { score: 1, criteria: '测试过程中无疼痛或不适，可继续进行后续测试。' },
      { score: 0, criteria: '测试过程中出现疼痛，需停止测试并寻求专业医疗评估。' },
    ],
    videoPlaceholder: '/videos/shoulder-impingement-clearance.mp4',
    isClearanceTest: true,
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'low',
  },
  {
    id: 'shoulder-mobility',
    name: '肩部灵活性 (Shoulder Mobility)',
    description: '评估肩关节的复合运动范围，包括外展、外旋、屈曲和内收、内旋、伸展。左右侧差异可能提示肩部功能障碍或代偿模式。',
    instructions: [
      '测量手长（从腕横纹到中指尖）。',
      '站立位，一手从上方，一手从下方，同时去触摸背后的中点。',
      '测量两手最近点之间的距离。',
      '注意：需要分别测试两种手位组合（左上右下，右上左下）',
    ],
    scoringCriteria: [
      { score: 3, criteria: '两手距离小于或等于一个手长。' },
      { score: 2, criteria: '两手距离小于或等于一个半手长。' },
      { score: 1, criteria: '两手距离大于一个半手长。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/shoulder-mobility.mp4',
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'medium',
  },
  
  // 6. 主动直腿上抬 (无对应排除测试)
  {
    id: 'active-straight-leg-raise',
    name: '主动直腿抬高 (Active Straight-Leg Raise)',
    description: '评估大腿后侧和腘绳肌的柔韧性，以及骨盆在单侧下肢运动时的稳定性。左右侧灵活性差异是常见的功能障碍表现。',
    instructions: [
      '仰卧，双臂置于体侧，掌心向上。',
      '一腿保持伸直并紧贴地面，另一腿伸直向上抬高。',
      '测量足跟与辅助杆之间的位置关系。',
      '注意：需要分别测试左腿和右腿的抬高能力',
    ],
    scoringCriteria: [
      { score: 3, criteria: '足跟超过辅助杆（对侧大腿中点）。' },
      { score: 2, criteria: '足跟在辅助杆（对侧大腿中点与对侧膝关节之间。' },
      { score: 1, criteria: '足跟未超过对侧膝关节。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/active-straight-leg-raise.mp4',
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'medium',
  },
  
  // 7. 脊柱伸展排除测试 → 8. 躯干稳定俯卧撑
  {
    id: 'spinal-extension-clearance',
    name: '脊柱伸展测试 (Spinal Extension Clearance)',
    description: '排除脊柱伸展方向的病理性问题，确保在躯干稳定俯卧撑测试前脊柱功能正常。',
    instructions: [
      '俯卧位，双手撑地于胸部两侧。',
      '将上身推起，使脊柱呈伸展状态（眼镜蛇式）。',
      '保持腹部贴地，只伸展身体上段。',
      '观察是否出现疼痛或不适。',
    ],
    scoringCriteria: [
      { score: 1, criteria: '测试过程中无疼痛或不适，可继续进行后续测试。' },
      { score: 0, criteria: '测试过程中出现疼痛，需停止测试并寻求专业医疗评估。' },
    ],
    videoPlaceholder: '/videos/spinal-extension-clearance.mp4',
    isClearanceTest: true,
    requiresBilateralAssessment: false,
  },
  {
    id: 'trunk-stability-push-up',
    name: '躯干稳定俯卧撑 (Trunk Stability Push-up)',
    description: '评估在矢状面内的核心稳定性，防止在上下肢协同运动时躯干出现代偿性运动。',
    instructions: [
      '俯卧，男性拇指与额头平齐，女性拇指与下巴平齐。',
      '作为一个整体将身体推起，保持身体呈一条直线。',
    ],
    scoringCriteria: [
      { score: 3, criteria: '男性拇指与额头平齐时能完成，女性拇指与下巴平齐时能完成。' },
      { score: 2, criteria: '男性拇指与下巴平齐时能完成，女性拇指与锁骨平齐时能完成。' },
      { score: 1, criteria: '无法按要求完成。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/trunk-stability-push-up.mp4',
    requiresBilateralAssessment: false,
  },
  
  // 9. 脊柱屈曲排除测试 → 10. 旋转稳定性
  {
    id: 'spinal-flexion-clearance',
    name: '脊柱屈曲测试 (Spinal Flexion Clearance)',
    description: '排除脊柱屈曲方向的病理性问题，确保在旋转稳定性测试前脊柱功能正常。',
    instructions: [
      '俯卧位，双手撑地。',
      '缓慢将身体向后推，呈婴儿式姿势。',
      '感受脊柱的屈曲运动。',
      '观察是否出现疼痛或不适。',
    ],
    scoringCriteria: [
      { score: 1, criteria: '测试过程中无疼痛或不适，可继续进行后续测试。' },
      { score: 0, criteria: '测试过程中出现疼痛，需停止测试并寻求专业医疗评估。' },
    ],
    videoPlaceholder: '/videos/spinal-flexion-clearance.mp4',
    isClearanceTest: true,
    requiresBilateralAssessment: false,
  },
  {
    id: 'rotary-stability',
    name: '旋转稳定性 (Rotary Stability)',
    description: '评估在上下肢协同运动时，身体在横向平面内的核心稳定性和神经肌肉控制能力。左右侧不对称可能提示核心控制缺陷。',
    instructions: [
      '手掌和膝盖撑地，髋、膝、肩均呈90度。',
      '同时伸直同侧的手臂和腿，使其与地面平行。',
      '然后屈曲手肘和膝盖，使其相互接触，过程中躯干保持稳定。',
      '注意：需要分别测试左侧和右侧的同侧支撑能力',
    ],
    scoringCriteria: [
      { score: 3, criteria: '能完成一次标准的同侧支撑伸展，并使手肘和膝盖接触。' },
      { score: 2, criteria: '能完成一次标准的对侧支撑伸展，并使手肘和膝盖接触。' },
      { score: 1, criteria: '无法完成对侧支撑伸展。' },
      { score: 0, criteria: '测试过程中出现疼痛。' },
    ],
    videoPlaceholder: '/videos/rotary-stability.mp4',
    requiresBilateralAssessment: true,
    asymmetryRiskLevel: 'high',
  },
];

// 分离基础测试和排除性测试以便于管理
export const BASIC_TESTS = FMS_TESTS.filter(test => !test.isClearanceTest);
export const CLEARANCE_TESTS = FMS_TESTS.filter(test => test.isClearanceTest);

// 需要左右侧评估的测试
export const BILATERAL_TESTS = FMS_TESTS.filter(test => test.requiresBilateralAssessment);

// 总测试数量
export const TOTAL_TESTS_COUNT = FMS_TESTS.length;

// 排除测试与基础测试的映射关系 - 统一定义，避免冗余
export const CLEARANCE_TEST_MAPPINGS = {
  'shoulder-impingement-clearance': 'shoulder-mobility',
  'spinal-flexion-clearance': 'rotary-stability',
  'spinal-extension-clearance': 'trunk-stability-push-up'
} as const;

// 不对称性评估相关工具函数
export const calculateAsymmetryScore = (leftScore: number, rightScore: number): {
  finalScore: number;
  hasAsymmetry: boolean;
  asymmetryLevel: 'severe' | 'moderate' | 'mild' | 'none';
  riskLevel: 'high' | 'medium' | 'low';
} => {
  const finalScore = Math.min(leftScore, rightScore); // 取最低分原则
  const scoreDifference = Math.abs(leftScore - rightScore);
  const hasAsymmetry = scoreDifference > 0;
  
  let asymmetryLevel: 'severe' | 'moderate' | 'mild' | 'none' = 'none';
  let riskLevel: 'high' | 'medium' | 'low' = 'low';
  
  if (scoreDifference >= 2) {
    asymmetryLevel = 'severe';
    riskLevel = 'high';
  } else if (scoreDifference === 1) {
    asymmetryLevel = finalScore <= 1 ? 'moderate' : 'mild';
    riskLevel = finalScore <= 1 ? 'high' : 'medium';
  }
  
  return {
    finalScore,
    hasAsymmetry,
    asymmetryLevel,
    riskLevel
  };
};

// 专业的不对称性风险评估
export const getAsymmetryRiskAssessment = (asymmetryLevel: string, testName: string) => {
  const assessments = {
    severe: {
      title: '严重不对称风险',
      description: `${testName}存在显著的左右侧功能差异，这是运动损伤的高风险因素。`,
      recommendations: [
        '立即停止高强度或不对称运动训练',
        '寻求专业物理治疗师评估',
        '优先进行针对性的功能纠正训练',
        '在获得专业许可前避免竞技性运动'
      ],
      priority: 1
    },
    moderate: {
      title: '中度不对称风险', 
      description: `${testName}显示中等程度的不对称性，需要关注和改善。`,
      recommendations: [
        '增加针对弱侧的专项训练',
        '避免过度依赖优势侧进行运动',
        '定期进行对称性评估',
        '考虑寻求专业指导'
      ],
      priority: 2
    },
    mild: {
      title: '轻度不对称提示',
      description: `${testName}存在轻微的左右侧差异，建议保持关注。`,
      recommendations: [
        '在日常训练中加强对称性训练',
        '注意运动技术的标准化',
        '定期自我评估和监控',
        '预防性维护训练'
      ],
      priority: 3
    }
  };
  
  return assessments[asymmetryLevel as keyof typeof assessments] || null;
}; 