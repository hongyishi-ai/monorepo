import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle
} from '@/components/ui/alert';
import { 
    CheckCircle, 
    AlertCircle, 
} from 'lucide-react';

const DiagnosisFlow1 = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [diagnosticPath, setDiagnosticPath] = useState([]);
    const [patientHistory, setPatientHistory] = useState({
        age: null,
        gender: null,
        previousConditions: [],
        recentActivities: [],
        environmentalFactors: []
    });
    const [bayesianScores, setBayesianScores] = useState({});
    const [diagnoses, setDiagnoses] = useState([]);

    // 扩展症状库，添加更多军人门诊常见疾病
    const symptomPatterns = {
        respiratory: {
            name: '呼吸系统',
            symptoms: [
                { 
                    id: 'fever', 
                    name: '发热', 
                    severity: ['<37.3°C', '37.3-38.5°C', '>38.5°C'],
                    duration: ['<24小时', '1-3天', '>3天'],
                    pattern: ['持续性', '间歇性', '潮热'],
                    timeOfDay: ['早晨', '下午', '夜间']
                },
                { 
                    id: 'cough', 
                    name: '咳嗽', 
                    severity: ['偶尔', '频繁', '剧烈'],
                    quality: ['干咳', '湿咳', '痉挛性咳嗽'],
                    trigger: ['自发', '运动后', '受凉后'],
                    relief: ['自行缓解', '服药后缓解', '持续不缓解']
                },
                { id: 'dyspnea', name: '呼吸困难', severity: ['活动时', '休息时', '持续性'] },
                { id: 'sputum', name: '咳痰', severity: ['白痰', '黄痰', '脓痰或血痰'] }
            ],
            examinations: [
                { name: '体温监测', priority: 'high' },
                { name: '血常规', priority: 'high' },
                { name: '胸部X线检查', priority: 'high' },
                { name: 'CT检查', priority: 'medium' },
                { name: '痰培养', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '上呼吸道感染', probability: 'high', urgency: 'low', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '支气管炎', probability: 'medium', urgency: 'medium', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '军训性肺炎', probability: 'medium', urgency: 'high', baseProbability: 0.25, typicalSymptoms: [] },
                { name: '慢性支气管炎急性发作', probability: 'low', urgency: 'high', baseProbability: 0.15, typicalSymptoms: [] }
            ]
        },
        // ... 其他症状系统保持原样
        musculoskeletal: {
            name: '肌肉骨骼系统',
            symptoms: [
                { id: 'pain', name: '疼痛', severity: ['轻微', '中度', '严重'] },
                { id: 'swelling', name: '肿胀', severity: ['局部', '弥漫', '严重'] },
                { id: 'movement', name: '活动受限', severity: ['轻度', '中度', '重度'] },
                { id: 'strength', name: '肌力', severity: ['Ⅳ级', 'Ⅲ级', '≤Ⅱ级'] }
            ],
            examinations: [
                { name: 'X线检查', priority: 'high' },
                { name: '关节功能评估', priority: 'high' },
                { name: 'MRI检查', priority: 'medium' },
                { name: '肌电图', priority: 'low' }
            ],
            possibleDiagnoses: [
                { name: '急性扭伤', probability: 'high', urgency: 'medium', baseProbability: 0.4, typicalSymptoms: [] },
                { name: '训练性肌肉损伤', probability: 'high', urgency: 'low', baseProbability: 0.35, typicalSymptoms: [] },
                { name: '应激性骨折', probability: 'medium', urgency: 'high', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '韧带撕裂', probability: 'low', urgency: 'high', baseProbability: 0.05, typicalSymptoms: [] }
            ]
        },
        cardiovascular: {
            name: '心血管系统',
            symptoms: [
                { id: 'chest_pain', name: '胸痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'palpitation', name: '心悸', severity: ['偶发', '阵发', '持续'] },
                { id: 'syncope', name: '晕厥', severity: ['先兆', '完全', '反复'] },
                { id: 'dyspnea', name: '呼吸困难', severity: ['活动时', '休息时', '持续性'] }
            ],
            examinations: [
                { name: '心电图', priority: 'high' },
                { name: '血压监测', priority: 'high' },
                { name: '心肌酶谱', priority: 'high' },
                { name: '超声心动图', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '训练性心律失常', probability: 'high', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '高血压危象', probability: 'medium', urgency: 'high', baseProbability: 0.25, typicalSymptoms: [] },
                { name: '急性心肌缺血', probability: 'low', urgency: 'high', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '心肌炎', probability: 'low', urgency: 'high', baseProbability: 0.25, typicalSymptoms: [] }
            ]
        },
        gastrointestinal: {
            name: '消化系统',
            symptoms: [
                { id: 'abdominal_pain', name: '腹痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'vomiting', name: '呕吐', severity: ['偶尔', '频繁', '持续'] },
                { id: 'diarrhea', name: '腹泻', severity: ['轻度', '中度', '重度'] },
                { id: 'appetite', name: '食欲', severity: ['轻度减退', '中度减退', '重度减退'] }
            ],
            examinations: [
                { name: '血常规', priority: 'high' },
                { name: '便常规+隐血', priority: 'high' },
                { name: '腹部B超', priority: 'medium' },
                { name: '胃镜检查', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '急性胃肠炎', probability: 'high', urgency: 'medium', baseProbability: 0.35, typicalSymptoms: [] },
                { name: '应激性溃疡', probability: 'medium', urgency: 'medium', baseProbability: 0.25, typicalSymptoms: [] },
                { name: '食物中毒', probability: 'medium', urgency: 'high', baseProbability: 0.25, typicalSymptoms: [] },
                { name: '急性阑尾炎', probability: 'low', urgency: 'high', baseProbability: 0.15, typicalSymptoms: [] }
            ]
        },
        dermatological: {
            name: '皮肤科',
            symptoms: [
                { id: 'rash', name: '皮疹', severity: ['轻微', '中度', '严重'] },
                { id: 'itching', name: '瘙痒', severity: ['轻微', '中度', '严重'] },
                { id: 'blister', name: '水疱', severity: ['小', '中等', '大'] },
                { id: 'redness', name: '红肿', severity: ['轻微', '中度', '严重'] }
            ],
            examinations: [
                { name: '皮肤镜检查', priority: 'medium' },
                { name: '皮肤过敏测试', priority: 'medium' },
                { name: '真菌检查', priority: 'medium' },
                { name: '血常规', priority: 'low' }
            ],
            possibleDiagnoses: [
                { name: '接触性皮炎', probability: 'high', urgency: 'low', baseProbability: 0.4, typicalSymptoms: [] },
                { name: '湿疹', probability: 'medium', urgency: 'low', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '荨麻疹', probability: 'medium', urgency: 'medium', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '真菌感染', probability: 'low', urgency: 'low', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        neurological: {
            name: '神经系统',
            symptoms: [
                { id: 'headache', name: '头痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'dizziness', name: '头晕', severity: ['偶发', '频繁', '持续'] },
                { id: 'numbness', name: '麻木', severity: ['局部', '广泛', '全身'] },
                { id: 'weakness', name: '乏力', severity: ['轻度', '中度', '重度'] }
            ],
            examinations: [
                { name: '神经系统检查', priority: 'high' },
                { name: '头部CT', priority: 'medium' },
                { name: '脑电图', priority: 'medium' },
                { name: '血糖检测', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '紧张型头痛', probability: 'high', urgency: 'low', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '偏头痛', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '中枢神经系统感染', probability: 'low', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] },
                { name: '低血糖', probability: 'medium', urgency: 'medium', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        ophthalmological: {
            name: '眼科',
            symptoms: [
                { id: 'blurred_vision', name: '视力模糊', severity: ['轻微', '中度', '严重'] },
                { id: 'eye_pain', name: '眼痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'red_eye', name: '红眼', severity: ['轻度', '中度', '重度'] },
                { id: 'photophobia', name: '畏光', severity: ['轻度', '中度', '重度'] }
            ],
            examinations: [
                { name: '视力检查', priority: 'high' },
                { name: '眼底检查', priority: 'medium' },
                { name: '眼压测量', priority: 'medium' },
                { name: '裂隙灯检查', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '结膜炎', probability: 'high', urgency: 'low', baseProbability: 0.4, typicalSymptoms: [] },
                { name: '角膜炎', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '青光眼', probability: 'low', urgency: 'high', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '视网膜脱离', probability: 'low', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        ent: {
            name: '耳鼻喉科',
            symptoms: [
                { id: 'sore_throat', name: '咽喉痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'ear_pain', name: '耳痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'nasal_congestion', name: '鼻塞', severity: ['轻微', '中度', '严重'] },
                { id: 'tinnitus', name: '耳鸣', severity: ['偶发', '频繁', '持续'] }
            ],
            examinations: [
                { name: '耳镜检查', priority: 'high' },
                { name: '鼻内镜检查', priority: 'medium' },
                { name: '咽喉镜检查', priority: 'medium' },
                { name: '听力测试', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '急性咽炎', probability: 'high', urgency: 'low', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '中耳炎', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '鼻窦炎', probability: 'medium', urgency: 'low', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '扁桃体炎', probability: 'low', urgency: 'medium', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        urinary: {
            name: '泌尿系统',
            symptoms: [
                { id: 'dysuria', name: '排尿困难', severity: ['轻微', '中度', '严重'] },
                { id: 'frequency', name: '尿频', severity: ['偶尔', '频繁', '持续'] },
                { id: 'hematuria', name: '血尿', severity: ['少量', '中等', '大量'] },
                { id: 'flank_pain', name: '腰痛', severity: ['轻微', '中度', '剧烈'] }
            ],
            examinations: [
                { name: '尿常规', priority: 'high' },
                { name: '肾脏B超', priority: 'medium' },
                { name: '膀胱镜检查', priority: 'medium' },
                { name: '尿培养', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '尿路感染', probability: 'high', urgency: 'medium', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '肾结石', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '前列腺炎', probability: 'medium', urgency: 'low', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '膀胱炎', probability: 'low', urgency: 'low', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        mental: {
            name: '精神心理',
            symptoms: [
                { id: 'anxiety', name: '焦虑', severity: ['轻度', '中度', '重度'] },
                { id: 'depression', name: '抑郁', severity: ['轻度', '中度', '重度'] },
                { id: 'insomnia', name: '失眠', severity: ['偶发', '频繁', '持续'] },
                { id: 'irritability', name: '易怒', severity: ['轻微', '中度', '严重'] }
            ],
            examinations: [
                { name: '心理评估量表', priority: 'high' },
                { name: '睡眠监测', priority: 'medium' },
                { name: '血清学检查', priority: 'low' }
            ],
            possibleDiagnoses: [
                { name: '焦虑症', probability: 'high', urgency: 'medium', baseProbability: 0.4, typicalSymptoms: [] },
                { name: '抑郁症', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '适应障碍', probability: 'medium', urgency: 'low', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '睡眠障碍', probability: 'low', urgency: 'low', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        infectious: {
            name: '感染性疾病',
            symptoms: [
                { id: 'fever', name: '发热', severity: ['低热', '中等', '高热'] },
                { id: 'chills', name: '寒战', severity: ['偶尔', '频繁', '持续'] },
                { id: 'sweating', name: '出汗', severity: ['少量', '中等', '大量'] },
                { id: 'fatigue', name: '乏力', severity: ['轻度', '中度', '重度'] }
            ],
            examinations: [
                { name: '血常规', priority: 'high' },
                { name: 'C反应蛋白', priority: 'high' },
                { name: '血培养', priority: 'medium' },
                { name: '胸部X线', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '细菌感染', probability: 'high', urgency: 'medium', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '病毒感染', probability: 'medium', urgency: 'medium', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '败血症', probability: 'low', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] },
                { name: '寄生虫感染', probability: 'low', urgency: 'low', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        heat_related: {
            name: '热相关疾病',
            symptoms: [
                { id: 'heat_cramps', name: '热痉挛', severity: ['轻度', '中度', '重度'] },
                { id: 'heat_exhaustion', name: '中暑', severity: ['轻度', '中度', '重度'] },
                { id: 'dehydration', name: '脱水', severity: ['轻度', '中度', '重度'] },
                { id: 'dizziness', name: '头晕', severity: ['轻微', '中度', '严重'] }
            ],
            examinations: [
                { name: '体温监测', priority: 'high' },
                { name: '电解质检查', priority: 'high' },
                { name: '血压监测', priority: 'medium' },
                { name: '心电图', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '热痉挛', probability: 'high', urgency: 'medium', baseProbability: 0.4, typicalSymptoms: [] },
                { name: '热衰竭', probability: 'medium', urgency: 'high', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '热射病', probability: 'low', urgency: 'high', baseProbability: 0.2, typicalSymptoms: [] },
                { name: '脱水', probability: 'medium', urgency: 'medium', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        cold_related: {
            name: '寒冷相关疾病',
            symptoms: [
                { id: 'frostbite', name: '冻伤', severity: ['I度', 'II度', 'III度'] },
                { id: 'hypothermia', name: '体温过低', severity: ['轻度', '中度', '重度'] },
                { id: 'shivering', name: '发抖', severity: ['轻微', '中度', '剧烈'] },
                { id: 'numbness', name: '麻木', severity: ['局部', '广泛', '全身'] }
            ],
            examinations: [
                { name: '体温监测', priority: 'high' },
                { name: '皮肤检查', priority: 'high' },
                { name: '血常规', priority: 'medium' },
                { name: '电解质检查', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '轻度冻伤', probability: 'high', urgency: 'medium', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '中度冻伤', probability: 'medium', urgency: 'high', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '重度冻伤', probability: 'low', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] },
                { name: '低体温症', probability: 'medium', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        },
        trauma: {
            name: '外伤',
            symptoms: [
                { id: 'wound', name: '伤口', severity: ['浅表', '中度', '深度'] },
                { id: 'bleeding', name: '出血', severity: ['少量', '中量', '大量'] },
                { id: 'pain', name: '疼痛', severity: ['轻微', '中度', '剧烈'] },
                { id: 'swelling', name: '肿胀', severity: ['轻微', '中度', '严重'] }
            ],
            examinations: [
                { name: '外伤评估', priority: 'high' },
                { name: 'X线检查', priority: 'medium' },
                { name: 'CT扫描', priority: 'medium' },
                { name: '血常规', priority: 'medium' }
            ],
            possibleDiagnoses: [
                { name: '软组织挫伤', probability: 'high', urgency: 'medium', baseProbability: 0.5, typicalSymptoms: [] },
                { name: '骨折', probability: 'medium', urgency: 'high', baseProbability: 0.3, typicalSymptoms: [] },
                { name: '开放性伤口', probability: 'low', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] },
                { name: '关节脱位', probability: 'medium', urgency: 'high', baseProbability: 0.1, typicalSymptoms: [] }
            ]
        }
    };

    // 诊断步骤定义
    const diagnosticSteps = [
        {
            title: '主诉与病史采集',
            description: '基于模式识别快速定位主要症状系统',
            action: '请选择主要症状所属系统：',
        },
        {
            title: '症状详细评估',
            description: '运用差异诊断思维评估具体症状体征',
            action: '请评估症状的具体表现：',
        },
        {
            title: '初步诊断分析',
            description: '基于贝叶斯推理分析可能的诊断',
            action: '诊断可能性分析：',
        },
        {
            title: '检查计划制定',
            description: '系统思维指导下的检查方案',
            action: '建议的检查项目：',
        }
    ];

    const handleSystemSelection = (category) => {
        setSelectedCategory(category);
        setDiagnosticPath([{
            step: '症状系统',
            value: symptomPatterns[category].name
        }]);
        setCurrentStep(1);
    };

    const handleSymptomSelection = (symptom, severityIndex) => {
        const updatedSymptoms = [...selectedSymptoms];
        const existingIndex = updatedSymptoms.findIndex(s => s.id === symptom.id);

        if (existingIndex >= 0) {
            updatedSymptoms[existingIndex] = {
                ...symptom,
                selectedSeverity: symptom.severity[severityIndex]
            };
        } else {
            updatedSymptoms.push({
                ...symptom,
                selectedSeverity: symptom.severity[severityIndex]
            });
        }

        setSelectedSymptoms(updatedSymptoms);

        if (updatedSymptoms.length >= 2) {
            setCurrentStep(2);
            setDiagnosticPath(prev => [...prev, {
                step: '症状评估',
                value: updatedSymptoms.map(s => `${s.name}(${s.selectedSeverity})`).join(', ')
            }]);
        }
    };

    // 基于贝叶斯推理的诊断概率计算
    const calculateBayesianScore = (symptoms, category) => {
        let scores = {};
        const diseases = symptomPatterns[category].possibleDiagnoses;

        diseases.forEach(disease => {
            let score = disease.baseProbability || 0.1;

            symptoms.forEach(symptom => {
                // 根据症状严重程度调整概率
                const severityWeight = {
                    '<37.3°C': 1.0,
                    '37.3-38.5°C': 1.2,
                    '>38.5°C': 1.5,
                    '低热': 1.0,
                    '中等': 1.2,
                    '高热': 1.5,
                    '轻微': 1.0,
                    '中度': 1.2,
                    '严重': 1.5,
                    '剧烈': 1.5,
                    '偶尔': 1.0,
                    '频繁': 1.2,
                    '持续': 1.5,
                    'I度': 1.0,
                    'II度': 1.5,
                    'III度': 2.0,
                    '浅表': 1.0,
                    '深度': 1.5,
                    // 添加更多映射关系根据需要
                }[symptom.selectedSeverity] || 1;

                score *= severityWeight;
            });

            // 将计算结果添加到疾病对象
            disease.calculatedProbability = score;
            scores[disease.name] = score;
        });

        setBayesianScores(scores);
        return scores;
    };

    // 紧急程度评估
    const evaluateUrgency = (symptoms, disease) => {
        const urgencyFactors = {
            highRiskSymptoms: ['dyspnea', 'chest_pain', 'syncope', 'hematuria', 'flank_pain', 'fever', 'frostbite', 'hypothermia', 'heat_exhaustion', 'heat_stroke'],
            moderateRiskSymptoms: ['fever', 'cough', 'pain', 'dizziness', 'rash', 'headache'],
            comorbidityFactors: ['cardiovascular_disease', 'respiratory_disease', 'diabetes']
        };

        let urgencyScore = 0;

        // 评估症状严重程度
        symptoms.forEach(symptom => {
            if (urgencyFactors.highRiskSymptoms.includes(symptom.id)) {
                urgencyScore += 3;
            } else if (urgencyFactors.moderateRiskSymptoms.includes(symptom.id)) {
                urgencyScore += 2;
            }

            const severityMapping = {
                '轻微': 1,
                '轻度': 1,
                '中度': 2,
                '中等': 2,
                '严重': 3,
                '重度': 3,
                '剧烈': 3,
                '<37.3°C': 1,
                '37.3-38.5°C': 2,
                '>38.5°C': 3,
                '低热': 1,
                '高热': 3,
                '偶尔': 1,
                '频繁': 2,
                '持续': 3,
                'I度': 1,
                'II度': 2,
                'III度': 3,
                '浅表': 1,
                '深度': 3,
                // 添加更多映射关系根据需要
            };
            urgencyScore += severityMapping[symptom.selectedSeverity] || 0;
        });

        // 根据既往病史调整紧急程度
        patientHistory.previousConditions.forEach(condition => {
            if (urgencyFactors.comorbidityFactors.includes(condition)) {
                urgencyScore += 2;
            }
        });

        return urgencyScore >= 6 ? 'high' :
               urgencyScore >= 3 ? 'medium' : 'low';
    };

    // 系统思维的检查建议生成
    const generateExaminationPlan = (symptoms, diagnosis, urgency) => {
        const baseExaminations = symptomPatterns[selectedCategory].examinations;
        const additionalExams = [];

        // 基于症状特点补充检查项目
        symptoms.forEach(symptom => {
            if (symptom.selectedSeverity === '剧烈' || symptom.selectedSeverity === '>38.5°C' || symptom.selectedSeverity === '高热' || symptom.selectedSeverity === 'III度') {
                additionalExams.push({
                    name: `${symptom.name}相关专项检查`,
                    priority: 'high',
                    reason: `由于${symptom.name}表现严重`
                });
            }
        });

        // 基于紧急程度调整检查优先级
        return [...baseExaminations, ...additionalExams].map(exam => ({
            ...exam,
            priority: urgency === 'high' ? 'high' : exam.priority
        }));
    };

    // 显示紧急程度提示
    const renderUrgencyAlert = (diagnosis) => {
        const urgencyStyles = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-green-100 text-green-800 border-green-200'
        };

        return (
            <Alert className={`mt-2 ${urgencyStyles[diagnosis.urgency]}`}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="ml-2">
                    {diagnosis.urgency === 'high' && '需要立即处理'}
                    {diagnosis.urgency === 'medium' && '需要及时处理'}
                    {diagnosis.urgency === 'low' && '可择期处理'}
                </AlertTitle>
                <AlertDescription className="ml-6">
                    诊断可能性: {diagnosis.probability === 'high' ? '较大' : diagnosis.probability === 'medium' ? '中等' : '较小'}
                </AlertDescription>
            </Alert>
        );
    };

    // 显示检查优先级
    const renderExaminationPriority = (priority) => {
        const priorityStyles = {
            high: 'text-red-600',
            medium: 'text-yellow-600',
            low: 'text-green-600'
        };

        return (
            <span className={`text-sm ${priorityStyles[priority]}`}>
                {priority === 'high' ? '(必查)' : priority === 'medium' ? '(建议)' : '(可选)'}
            </span>
        );
    };

    // 计算贝叶斯分数和评估紧急程度
    useEffect(() => {
        if (currentStep >= 2 && selectedCategory) {
            const scores = calculateBayesianScore(selectedSymptoms, selectedCategory);

            // 获取疾病列表并更新其计算概率
            const diseases = symptomPatterns[selectedCategory].possibleDiagnoses.map(disease => {
                const score = scores[disease.name] || 0;
                return {
                    ...disease,
                    calculatedProbability: score
                };
            });

            // 过滤掉概率为 0 的疾病
            const filteredDiseases = diseases.filter(disease => disease.calculatedProbability > 0);

            // 如果没有疾病匹配，给出提示
            if (filteredDiseases.length === 0) {
                setDiagnoses([]);
                setDiagnosticPath(prev => [...prev, {
                    step: '初步诊断',
                    value: '未能匹配到可能的诊断，请重新评估症状。'
                }]);
                return;
            }

            // 评估每个诊断的紧急程度
            const updatedDiagnoses = filteredDiseases.map(disease => {
                const urgency = evaluateUrgency(selectedSymptoms, disease);
                return {
                    ...disease,
                    urgency: urgency
                };
            });

            // 按照计算概率排序诊断结果
            updatedDiagnoses.sort((a, b) => b.calculatedProbability - a.calculatedProbability);

            setDiagnoses(updatedDiagnoses);

            // 假设概率最高的诊断为主要诊断
            const primaryDiagnosis = updatedDiagnoses[0];

            const examinationPlan = generateExaminationPlan(selectedSymptoms, primaryDiagnosis, primaryDiagnosis.urgency);

            setDiagnosticPath(prev => [...prev, {
                step: '初步诊断',
                value: primaryDiagnosis.name
            }, {
                step: '紧急程度',
                value: primaryDiagnosis.urgency === 'high' ? '高' : primaryDiagnosis.urgency === 'medium' ? '中' : '低'
            }, {
                step: '检查计划',
                value: examinationPlan.map(exam => exam.name).join(', ')
            }]);
        }
    }, [currentStep, selectedCategory, selectedSymptoms]);

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    军人门诊诊断决策辅助系统
                </CardTitle>
                <CardDescription>
                    基于多维医学诊断思维的标准化诊疗决策流程
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {diagnosticSteps.map((step, index) => (
                        <AccordionItem key={index} value={`step-${index}`}>
                            <AccordionTrigger
                                className={`${currentStep >= index ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                            >
                                {step.title}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 space-y-4">
                                    <p className="text-sm text-gray-600">{step.description}</p>

                                    {index === 0 && (
                                        <div className="space-y-4">
                                            {/* 症状系统选择 */}
                                            <div>
                                                <h4 className="font-medium mb-2">请选择主要症状所属系统：</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(symptomPatterns).map(([key, value]) => (
                                                        <Button
                                                            key={key}
                                                            variant={selectedCategory === key ? "default" : "outline"}
                                                            className="w-full"
                                                            onClick={() => handleSystemSelection(key)}
                                                        >
                                                            {value.name}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* 患者病史采集 */}
                                            <div className="space-y-2">
                                                <h4 className="font-medium">患者病史采集：</h4>
                                                {/* 这里可以添加表单或其他输入组件以采集患者病史 */}
                                            </div>
                                        </div>
                                    )}

                                    {index === 1 && selectedCategory && (
                                        <div className="space-y-6">
                                            {/* 症状详细评估 */}
                                            {symptomPatterns[selectedCategory].symptoms.map((symptom) => (
                                                <div key={symptom.id} className="space-y-2">
                                                    <h4 className="font-medium">{symptom.name}</h4>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {symptom.severity.map((level, idx) => (
                                                            <Button
                                                                key={idx}
                                                                variant="outline"
                                                                size="sm"
                                                                className={
                                                                    selectedSymptoms.some(s =>
                                                                        s.id === symptom.id && s.selectedSeverity === level
                                                                    ) ? 'bg-blue-100' : ''
                                                                }
                                                                onClick={() => handleSymptomSelection(symptom, idx)}
                                                            >
                                                                {level}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    {/* 根据需要添加更多症状细节选项，如持续时间、模式等 */}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {index === 2 && selectedCategory && (
                                        <div className="space-y-4">
                                            {/* 初步诊断分析 */}
                                            {diagnoses.length > 0 ? (
                                                <>
                                                    {diagnoses.map((diagnosis, idx) => (
                                                        <div key={idx}>
                                                            <div className="font-medium">{diagnosis.name}</div>
                                                            {renderUrgencyAlert(diagnosis)}
                                                        </div>
                                                    ))}
                                                    
                                                    {/* 显示贝叶斯评分 */}
                                                    <div className="mt-4">
                                                        <h4 className="font-medium">贝叶斯评分：</h4>
                                                        <ul className="list-disc list-inside">
                                                            {diagnoses.map((diagnosis, idx) => (
                                                                <li key={idx}>{diagnosis.name}: {diagnosis.calculatedProbability.toFixed(2)}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-red-600">
                                                    未能匹配到可能的诊断，请重新评估症状或选择其他症状。
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {index === 3 && selectedCategory && (
                                        <div className="space-y-4">
                                            {/* 检查计划制定 */}
                                            {diagnoses.length > 0 ? (
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="font-medium mb-4">检查项目清单：</h4>
                                                    <ul className="space-y-2">
                                                        {generateExaminationPlan(selectedSymptoms, diagnoses[0], diagnoses[0].urgency).map((exam, idx) => (
                                                            <li key={idx} className="flex items-center justify-between">
                                                                <span>{exam.name}</span>
                                                                {renderExaminationPriority(exam.priority)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="text-red-600">
                                                    无法生成检查计划，因为未能确定可能的诊断。
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {diagnosticPath.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium mb-2">诊断路径记录</h3>
                        <div className="space-y-4">
                            <ul className="list-none space-y-2">
                                {diagnosticPath.map((path, index) => (
                                    <li key={index} className="flex items-center text-sm">
                                        <span className="w-20 font-medium">{path.step}:</span>
                                        <span className="text-blue-600">{path.value}</span>
                                    </li>
                                ))}
                            </ul>

                            {selectedCategory && currentStep >= 2 && diagnoses.length > 0 && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="font-medium mb-2">专业建议</h4>
                                    <div className="space-y-2 text-sm">
                                        {/* 紧急程度建议 */}
                                        {diagnoses.some(d => d.urgency === 'high') && (
                                            <Alert className="bg-red-50 text-red-800 border-red-200">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle className="ml-2">需要注意</AlertTitle>
                                                <AlertDescription className="ml-6">
                                                    存在需要紧急处理的可能诊断，建议及时完成相关检查
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* 鉴别诊断建议 */}
                                        <div className="bg-white p-3 rounded-lg border">
                                            <h5 className="font-medium mb-2">重点鉴别：</h5>
                                            <ul className="list-disc list-inside space-y-1">
                                                {diagnoses
                                                    .filter(d => d.probability !== 'low')
                                                    .map((diagnosis, idx) => (
                                                        <li key={idx}>{diagnosis.name}</li>
                                                    ))}
                                            </ul>
                                        </div>

                                        {/* 检查建议 */}
                                        <div className="bg-white p-3 rounded-lg border">
                                            <h5 className="font-medium mb-2">优先检查建议：</h5>
                                            <ul className="list-disc list-inside space-y-1">
                                                {generateExaminationPlan(selectedSymptoms, diagnoses[0], diagnoses[0].urgency)
                                                    .filter(exam => exam.priority === 'high')
                                                    .map((exam, idx) => (
                                                        <li key={idx} className="text-red-600">
                                                            {exam.name}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>

                                        {/* 注意事项 */}
                                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                            <h5 className="font-medium mb-2 text-yellow-800">注意事项：</h5>
                                            <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                <li>请严格遵循检查顺序，避免漏检</li>
                                                <li>密切观察症状变化，如有加重及时报告</li>
                                                <li>保留完整检查记录，便于后续诊疗参考</li>
                                            </ul>
                                        </div>

                                        {/* 预防保健建议 */}
                                        {currentStep >= 3 && (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                <h5 className="font-medium mb-2 text-green-800">预防保健建议：</h5>
                                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                                    {/* 根据 selectedCategory 显示相应的预防保健建议 */}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );

};

export default DiagnosisFlow1;
