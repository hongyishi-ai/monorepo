import React, { useState } from 'react';
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
import { CheckCircle, AlertCircle } from 'lucide-react';

const DiagnosisFlow = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [diagnosticPath, setDiagnosticPath] = useState([]);

    // 军人常见疾病症状库与诊断指南
    const symptomPatterns = {
        respiratory: {
            name: '呼吸系统',
            symptoms: [
                { id: 'fever', name: '发热', severity: ['<37.3°C', '37.3-38.5°C', '>38.5°C'] },
                { id: 'cough', name: '咳嗽', severity: ['偶尔', '频繁', '剧烈'] },
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
                { name: '上呼吸道感染', probability: 'high', urgency: 'low' },
                { name: '支气管炎', probability: 'medium', urgency: 'medium' },
                { name: '军训性肺炎', probability: 'medium', urgency: 'high' },
                { name: '慢性支气管炎急性发作', probability: 'low', urgency: 'high' }
            ]
        },
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
                { name: '急性扭伤', probability: 'high', urgency: 'medium' },
                { name: '训练性肌肉损伤', probability: 'high', urgency: 'low' },
                { name: '应激性骨折', probability: 'medium', urgency: 'high' },
                { name: '韧带撕裂', probability: 'low', urgency: 'high' }
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
                { name: '训练性心律失常', probability: 'high', urgency: 'medium' },
                { name: '高血压危象', probability: 'medium', urgency: 'high' },
                { name: '急性心肌缺血', probability: 'low', urgency: 'high' },
                { name: '心肌炎', probability: 'low', urgency: 'high' }
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
                { name: '急性胃肠炎', probability: 'high', urgency: 'medium' },
                { name: '应激性溃疡', probability: 'medium', urgency: 'medium' },
                { name: '食物中毒', probability: 'medium', urgency: 'high' },
                { name: '急性阑尾炎', probability: 'low', urgency: 'high' }
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
                                    )}

                                    {index === 1 && selectedCategory && (
                                        <div className="space-y-6">
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
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {index === 2 && selectedCategory && (
                                        <div className="space-y-4">
                                            {symptomPatterns[selectedCategory].possibleDiagnoses.map((diagnosis, idx) => (
                                                <div key={idx}>
                                                    <div className="font-medium">{diagnosis.name}</div>
                                                    {renderUrgencyAlert(diagnosis)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {index === 3 && selectedCategory && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium mb-4">检查项目清单：</h4>
                                                <ul className="space-y-2">
                                                    {symptomPatterns[selectedCategory].examinations.map((exam, idx) => (
                                                        <li key={idx} className="flex items-center justify-between">
                                                            <span>{exam.name}</span>
                                                            {renderExaminationPriority(exam.priority)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
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

                            {selectedCategory && currentStep >= 2 && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="font-medium mb-2">专业建议</h4>
                                    <div className="space-y-2 text-sm">
                                        {/* 紧急程度建议 */}
                                        {symptomPatterns[selectedCategory].possibleDiagnoses.some(d => d.urgency === 'high') && (
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
                                                {symptomPatterns[selectedCategory].possibleDiagnoses
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
                                                {symptomPatterns[selectedCategory].examinations
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
                                                    {selectedCategory === 'respiratory' && (
                                                        <>
                                                            <li>注意保暖，避免剧烈运动</li>
                                                            <li>保持室内通风，做好个人防护</li>
                                                            <li>规律作息，增强体质</li>
                                                        </>
                                                    )}
                                                    {selectedCategory === 'musculoskeletal' && (
                                                        <>
                                                            <li>注意运动强度循序渐进</li>
                                                            <li>训练前充分热身，避免过度疲劳</li>
                                                            <li>保持正确运动姿势</li>
                                                        </>
                                                    )}
                                                    {selectedCategory === 'cardiovascular' && (
                                                        <>
                                                            <li>控制运动强度，注意心率监测</li>
                                                            <li>保持规律作息，避免过度疲劳</li>
                                                            <li>定期进行心血管功能检查</li>
                                                        </>
                                                    )}
                                                    {selectedCategory === 'gastrointestinal' && (
                                                        <>
                                                            <li>注意饮食卫生，避免生冷食物</li>
                                                            <li>规律饮食，保持作息规律</li>
                                                            <li>适度运动，促进消化功能</li>
                                                        </>
                                                    )}
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

export default DiagnosisFlow;