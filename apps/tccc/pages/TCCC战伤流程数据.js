// TCCC战伤救护流程数据
// 基于CoTCCC 2017版官方算法流程图
const tcccFlowSteps = [
    {
        id: "step-0",
        title: "战术战斗伤员救护",
        subtitle: "Tactical Combat Casualty Care",
        secondaryTitle: "战场急救决策辅助",
        secondarySubtitle: "Interactive Decision Guide",
        detail: "根据 CoTCCC 指南 (31 JAN 2017) | In Accordance with CoTCCC Guidelines",
        actionText: "开始评估",
        actionTextEng: "Begin Assessment",
        nextStep: "step-1",
        icon: "fa-medkit",
        highlight: true,
        type: "intro"
    },
    {
        id: "step-1",
        title: "交火中救治",
        subtitle: "Care Under Fire",
        actionLabel: "发现伤员",
        actionLabelEng: "Casualty Sustained",
        infoBoxes: [
            {
                title: "立即行动: <span class='highlight-redEE1C25'>还击并隐蔽</span>",
                subtitle: "Immediate Action: <span class='highlight-redEE1C25'>Return Fire and Take Cover</span>",
                detail: "<i class='fas fa-exclamation-circle mr-2'></i>尽量避免伤员遭受额外伤害 (Try to keep casualty from sustaining additional wounds)."
            }
        ],
        actionText: "下一步",
        actionTextEng: "Next Step",
        nextStep: "step-2",
        icon: "fa-bullseye",
        type: "info"
    },
    {
        id: "step-2",
        title: "伤员是否有意识?",
        subtitle: "Is the casualty conscious?",
        options: [
            {
                text: "是",
                textEng: "YES",
                key: "conscious",
                value: true,
                nextStep: "step-3a"
            },
            {
                text: "否",
                textEng: "NO",
                key: "conscious",
                value: false,
                nextStep: "step-3b"
            }
        ],
        icon: "fa-user-md",
        type: "decision"
    },
    {
        id: "step-3a",
        title: "<span class='text-green-500'>伤员有意识</span>",
        subtitle: "Casualty is Conscious",
        infoBoxes: [
            {
                title: "行动: <span class='highlight-redEE1C25'>指挥伤员移动至掩体并自救</span>",
                subtitle: "Action: <span class='highlight-redEE1C25'>Direct casualty to move to cover and apply self-aid</span>"
            }
        ],
        actionText: "伤员移至掩体",
        actionTextEng: "Casualty moved to cover",
        nextStep: "step-4",
        icon: "fa-directions",
        type: "info"
    },
    {
        id: "step-3b",
        title: "<span class='text-red-500'>伤员无意识</span>",
        subtitle: "Casualty is NOT Conscious",
        infoBoxes: [
            {
                title: "行动: <span class='highlight-redEE1C25'>如战术可行, 移动伤员至掩体</span>",
                subtitle: "Action: <span class='highlight-redEE1C25'>Move casualty to cover if tactically feasible</span>"
            },
            {
                title: "解救说明 (Extrication Note):",
                detail: "应将伤员从燃烧的车辆或建筑物中解救出来，并转移到相对安全的地方。采取一切必要措施停止燃烧过程。(Casualties should be extricated from burning vehicles or buildings and moved to relative safety. Do what is necessary to stop burning process.)"
            }
        ],
        actionText: "伤员移至掩体",
        actionTextEng: "Casualty moved to cover",
        nextStep: "step-4",
        icon: "fa-truck-medical",
        type: "info"
    },
    {
        id: "step-4",
        title: "止血!",
        subtitle: "STOP LIFE THREATENING BLEEDING",
        infoBoxes: [
            {
                title: "危及生命的出血判断 (Life-Threatening Bleeding Indicators):",
                isList: true,
                items: [
                    "血液喷射或涌出 (Spurting or Flowing Blood)",
                    "血液快速浸透军服或在地面形成血泊 (Blood soaking rapidly through uniform or pooling on the ground)",
                    "完全截肢 (Complete Amputation)"
                ]
            }
        ],
        actionDetail: "核心目标：<span class='highlight-redEE1C25'>立即控制大出血</span>",
        actionDetailEng: "Primary Goal: Control massive hemorrhage immediately",
        actionText: "评估是否需止血带",
        actionTextEng: "Assess for Tourniquet",
        nextStep: "step-5",
        icon: "fa-tint",
        iconColor: "#FF0000",
        highlight: true,
        type: "info"
    },
    {
        id: "step-5",
        title: "是否需要肢体止血带?",
        subtitle: "Is a limb tourniquet indicated?",
        options: [
            {
                text: "是",
                textEng: "YES",
                key: "tourniquet",
                value: true,
                nextStep: "step-6a"
            },
            {
                text: "否",
                textEng: "NO",
                key: "tourniquet",
                value: false,
                nextStep: "step-6b"
            }
        ],
        icon: "fa-band-aid",
        type: "decision"
    },
    {
        id: "step-6a",
        title: "<span class='text-green-500'>使用止血带</span>",
        subtitle: "Apply Tourniquet",
        infoBoxes: [
            {
                title: "行动: <span class='highlight-redEE1C25'>使用 CoTCCC 推荐的肢体止血带</span>",
                subtitle: "Action: <span class='highlight-redEE1C25'>Use CoTCCC recommended limb tourniquet</span>",
                detail: "<i class='fas fa-map-marker-alt mr-2'></i>应用于出血点近心端 (Applied proximal to bleeding site)"
            },
            {
                title: "重要提示 (Critical Note):",
                detail: "如果出血部位不易辨认，将止血带置于肢体<span class='font-bold highlight-redEE1C25'>\"高而紧\"</span>的位置。(Place tourniquet \"High & Tight\" if bleeding site is not easily identifiable.)"
            }
        ],
        actionText: "转至战术区域救治",
        actionTextEng: "Move to Tactical Field Care",
        nextStep: "step-7",
        icon: "fa-hand-holding-medical",
        type: "info"
    },
    {
        id: "step-6b",
        title: "<span class='text-yellow-500'>暂不使用止血带</span>",
        subtitle: "Tourniquet Not Indicated",
        infoBoxes: [
            {
                title: "行动: <span class='highlight-redEE1C25'>继续战斗 / 任务</span>",
                subtitle: "Action: <span class='highlight-redEE1C25'>Continue with Fight / Mission</span>",
                detail: "<i class='fas fa-info-circle mr-2'></i>(若情况允许，仍需后续在安全区域评估其他非危及生命的出血) (If situation permits, assess for other non-life-threatening bleeding in Tactical Field Care)"
            }
        ],
        actionText: "转至战术区域救治",
        actionTextEng: "Move to Tactical Field Care",
        nextStep: "step-7",
        icon: "fa-shield-alt",
        type: "info"
    },
    {
        id: "step-7",
        title: "阶段转换",
        subtitle: "Phase Transition",
        infoBoxes: [
            {
                title: "核心行动: <span class='highlight-redEE1C25'>移动伤员至伤员后送点(CCP)或安全区域</span>",
                subtitle: "Key Action: <span class='highlight-redEE1C25'>Move casualty to CCP or secure area and initiate Tactical Field Care</span>"
            },
            {
                title: "伤员搬运提示 (Casualty Movement):",
                isList: true,
                items: [
                    "最快的方法是由两名救援者沿病人身体长轴拖动。(The fastest method is dragging along the long axis of patient's body by two rescuers.)",
                    "仅当伤员脱离敌人威胁后，根据受伤机制指示，才考虑脊柱固定。(Spinal precautions or stabilization should only be considered after a casualty is removed from the enemy threat and indicated by mechanism of injury.)"
                ]
            },
            {
                title: "<span class='highlight-redEE1C25'>气道管理</span>",
                detail: "<i class='fas fa-lungs mr-2'></i>气道管理通常在此阶段进行。(Airway management is generally best deferred until the Tactical Field Care phase)."
            }
        ],
        actionDetail: "战术区域救治",
        actionDetailEng: "TACTICAL FIELD CARE",
        actionText: "继续战术区域救治",
        actionTextEng: "Continue to Tactical Field Care",
        nextStep: "step-8",
        icon: "fa-hospital-symbol",
        type: "info"
    },
    {
        id: "step-8",
        title: "战术区域救治",
        subtitle: "TACTICAL FIELD CARE",
        infoBoxes: [
            {
                title: "人员能力说明:",
                isList: true,
                items: [
                    "<span class='text-green-400'>绿色标记</span>: 所有作战人员和战斗生命救护员能力等级",
                    "<span class='text-yellow-400'>黄色标记</span>: 战斗医护人员能力等级",
                    "<span class='text-red-400'>红色标记</span>: 战斗医疗队或特种作战医护人员能力等级"
                ]
            }
        ],
        actionDetail: "该部分内容待扩展...",
        actionDetailEng: "This section to be continued...",
        actionText: "重新开始",
        actionTextEng: "Restart Guide",
        nextStep: "step-0",
        icon: "fa-ambulance",
        hasRestart: true,
        type: "info"
    }
];

// 要在页面中使用，可以通过以下方式加载：
// TCCCFlow.loadFlow(tcccFlowSteps); 