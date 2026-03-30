import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Stethoscope, Pill, Activity, Grip, HeartPulse } from 'lucide-react';

const DigestiveDiagnosis = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  
  // 基础疾病先验概率 (基于流行病学数据估计)
  const priors = {
    gastritis: 0.25,      // 胃炎
    gastricUlcer: 0.15,   // 胃溃疡
    ibs: 0.20,           // 肠易激综合征
    gastroenteritis: 0.15, // 肠胃炎
    gerd: 0.15,          // 胃食管反流病
    colitis: 0.10,       // 结肠炎
  };

  // 详细的诊断问题列表
  const questions = [
    {
      id: 'nausea',
      text: '恶心症状？',
      options: [
        { value: 'none', text: '无恶心', 
          impacts: { gastritis: 0.6, gastricUlcer: 0.7, ibs: 0.9, gastroenteritis: 0.3, gerd: 0.8, colitis: 0.9 } },
        { value: 'mild', text: '轻度恶心，不影响日常生活', 
          impacts: { gastritis: 1.2, gastricUlcer: 1.1, ibs: 1.2, gastroenteritis: 1.5, gerd: 1.3, colitis: 1.1 } },
        { value: 'moderate', text: '中度恶心，影响进食', 
          impacts: { gastritis: 1.8, gastricUlcer: 1.5, ibs: 1.3, gastroenteritis: 2.0, gerd: 1.6, colitis: 1.2 } },
        { value: 'severe', text: '重度恶心，严重影响日常生活', 
          impacts: { gastritis: 2.0, gastricUlcer: 1.8, ibs: 1.4, gastroenteritis: 2.5, gerd: 1.8, colitis: 1.4 } }
      ]
    },
    {
      id: 'vomiting',
      text: '呕吐情况？',
      options: [
        { value: 'none', text: '无呕吐', 
          impacts: { gastritis: 0.7, gastricUlcer: 0.8, ibs: 1.0, gastroenteritis: 0.3, gerd: 0.9, colitis: 1.0 } },
        { value: 'occasional', text: '偶尔呕吐，1-2次/周', 
          impacts: { gastritis: 1.5, gastricUlcer: 1.3, ibs: 1.2, gastroenteritis: 1.8, gerd: 1.5, colitis: 1.2 } },
        { value: 'frequent', text: '频繁呕吐，3-5次/周', 
          impacts: { gastritis: 2.0, gastricUlcer: 1.7, ibs: 1.3, gastroenteritis: 2.3, gerd: 1.8, colitis: 1.4 } },
        { value: 'severe', text: '严重呕吐，几乎每天', 
          impacts: { gastritis: 2.2, gastricUlcer: 2.0, ibs: 1.4, gastroenteritis: 2.5, gerd: 2.0, colitis: 1.5 } }
      ]
    },
    {
      id: 'diarrhea',
      text: '腹泻情况？',
      options: [
        { value: 'none', text: '无腹泻', 
          impacts: { gastritis: 1.0, gastricUlcer: 1.0, ibs: 0.5, gastroenteritis: 0.3, gerd: 1.0, colitis: 0.4 } },
        { value: 'mild', text: '轻度腹泻，1-2次/天', 
          impacts: { gastritis: 0.9, gastricUlcer: 0.8, ibs: 1.5, gastroenteritis: 1.8, gerd: 0.9, colitis: 1.6 } },
        { value: 'moderate', text: '中度腹泻，3-5次/天', 
          impacts: { gastritis: 0.8, gastricUlcer: 0.7, ibs: 2.0, gastroenteritis: 2.3, gerd: 0.8, colitis: 2.0 } },
        { value: 'severe', text: '重度腹泻，>5次/天', 
          impacts: { gastritis: 0.7, gastricUlcer: 0.6, ibs: 2.2, gastroenteritis: 2.5, gerd: 0.7, colitis: 2.5 } }
      ]
    },
    {
      id: 'constipation',
      text: '便秘情况？',
      options: [
        { value: 'none', text: '无便秘', 
          impacts: { gastritis: 1.0, gastricUlcer: 1.0, ibs: 0.7, gastroenteritis: 1.0, gerd: 1.0, colitis: 0.8 } },
        { value: 'mild', text: '轻度便秘，2-3天/次', 
          impacts: { gastritis: 0.9, gastricUlcer: 0.9, ibs: 1.5, gastroenteritis: 0.7, gerd: 0.9, colitis: 1.2 } },
        { value: 'moderate', text: '中度便秘，4-5天/次', 
          impacts: { gastritis: 0.8, gastricUlcer: 0.8, ibs: 1.8, gastroenteritis: 0.5, gerd: 0.8, colitis: 1.5 } },
        { value: 'severe', text: '重度便秘，>5天/次', 
          impacts: { gastritis: 0.7, gastricUlcer: 0.7, ibs: 2.0, gastroenteritis: 0.3, gerd: 0.7, colitis: 1.8 } }
      ]
    },
    {
      id: 'acidReflux',
      text: '反酸情况？',
      options: [
        { value: 'none', text: '无反酸', 
          impacts: { gastritis: 0.7, gastricUlcer: 0.6, ibs: 1.0, gastroenteritis: 1.0, gerd: 0.3, colitis: 1.0 } },
        { value: 'mild', text: '轻度反酸，偶尔发生', 
          impacts: { gastritis: 1.3, gastricUlcer: 1.2, ibs: 1.0, gastroenteritis: 1.0, gerd: 1.5, colitis: 0.9 } },
        { value: 'moderate', text: '中度反酸，每周多次', 
          impacts: { gastritis: 1.8, gastricUlcer: 1.6, ibs: 1.0, gastroenteritis: 0.9, gerd: 2.0, colitis: 0.8 } },
        { value: 'severe', text: '重度反酸，几乎每天', 
          impacts: { gastritis: 2.0, gastricUlcer: 1.8, ibs: 1.0, gastroenteritis: 0.8, gerd: 2.5, colitis: 0.7 } }
      ]
    },
    {
      id: 'abdominalPain',
      text: '腹痛特征？',
      options: [
        { value: 'none', text: '无腹痛', 
          impacts: { gastritis: 0.5, gastricUlcer: 0.4, ibs: 0.4, gastroenteritis: 0.3, gerd: 0.8, colitis: 0.4 } },
        { value: 'upper', text: '上腹部疼痛', 
          impacts: { gastritis: 2.0, gastricUlcer: 2.2, ibs: 1.0, gastroenteritis: 1.2, gerd: 1.8, colitis: 0.8 } },
        { value: 'lower', text: '下腹部疼痛', 
          impacts: { gastritis: 0.8, gastricUlcer: 0.7, ibs: 2.0, gastroenteritis: 1.5, gerd: 0.7, colitis: 2.0 } },
        { value: 'diffuse', text: '弥漫性腹痛', 
          impacts: { gastritis: 1.2, gastricUlcer: 1.0, ibs: 1.5, gastroenteritis: 2.0, gerd: 1.0, colitis: 1.8 } }
      ]
    },
    {
      id: 'appetite',
      text: '食欲情况？',
      options: [
        { value: 'normal', text: '食欲正常', 
          impacts: { gastritis: 0.8, gastricUlcer: 0.7, ibs: 1.0, gastroenteritis: 0.5, gerd: 0.9, colitis: 0.8 } },
        { value: 'mild', text: '轻度食欲减退', 
          impacts: { gastritis: 1.3, gastricUlcer: 1.4, ibs: 1.2, gastroenteritis: 1.5, gerd: 1.2, colitis: 1.3 } },
        { value: 'moderate', text: '中度食欲减退', 
          impacts: { gastritis: 1.8, gastricUlcer: 1.9, ibs: 1.4, gastroenteritis: 2.0, gerd: 1.5, colitis: 1.6 } },
        { value: 'severe', text: '重度食欲减退', 
          impacts: { gastritis: 2.2, gastricUlcer: 2.3, ibs: 1.6, gastroenteritis: 2.5, gerd: 1.8, colitis: 2.0 } }
      ]
    },
    {
      id: 'bloodStool',
      text: '便血情况？',
      options: [
        { value: 'none', text: '无便血', 
          impacts: { gastritis: 1.0, gastricUlcer: 0.9, ibs: 1.0, gastroenteritis: 1.0, gerd: 1.0, colitis: 0.7 } },
        { value: 'occult', text: '潜血（大便检查发现）', 
          impacts: { gastritis: 1.5, gastricUlcer: 1.8, ibs: 1.0, gastroenteritis: 1.2, gerd: 1.0, colitis: 1.8 } },
        { value: 'visible', text: '可见少量鲜血', 
          impacts: { gastritis: 1.8, gastricUlcer: 2.2, ibs: 1.0, gastroenteritis: 1.5, gerd: 1.0, colitis: 2.2 } },
        { value: 'severe', text: '大量便血', 
          impacts: { gastritis: 2.0, gastricUlcer: 2.5, ibs: 1.0, gastroenteritis: 1.8, gerd: 1.0, colitis: 2.5 } }
      ]
    }
  ];

  // 计算后验概率
  const calculatePosterior = () => {
    let posterior = { ...priors };
    
    Object.entries(answers).forEach(([questionId, answerValue]) => {
      const question = questions.find(q => q.id === questionId);
      const option = question.options.find(opt => opt.value === answerValue);
      
      Object.keys(posterior).forEach(factor => {
        posterior[factor] *= option.impacts[factor];
      });
    });
    
    // 归一化
    const total = Object.values(posterior).reduce((sum, val) => sum + val, 0);
    Object.keys(posterior).forEach(key => {
      posterior[key] = (posterior[key] / total);
    });
    
    return posterior;
  };

  // 获取诊断结果
  const getDiagnosisResult = (posterior) => {
    const sorted = Object.entries(posterior).sort((a, b) => b[1] - a[1]);
    return {
      type: sorted[0][0],
      probability: sorted[0][1]
    };
  };

  const handleOptionSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // 获取建议和描述
  const getRecommendations = (type) => {
    const recommendations = {
      gastritis: {
        description: '胃炎是胃粘膜的炎症性改变。可由多种因素引起，如幽门螺杆菌感染、长期服用某些药物、过度饮酒等。',
        suggestions: [
          '规律饮食，避免暴饮暴食',
          '避免刺激性食物和饮料',
          '戒烟限酒',
          '建议进行胃镜检查',
          '遵医嘱服用抑酸药物和胃粘膜保护剂'
        ],
        urgency: '建议在1周内就医检查'
      },
      gastricUlcer: {
        description: '胃溃疡是胃壁形成的溃疡性损害，常见症状包括上腹痛、反酸、嗳气等。可能由幽门螺杆菌感染或长期服用消炎药引起。',
        suggestions: [
          '及时就医进行胃镜检查',
          '避免服用刺激性药物',
          '规律饮食，少食多餐',
          '戒烟戒酒',
          '必要时进行胃镜检查',
          '遵医嘱服用胃黏膜保护剂',
        ],
        urgency: '建议在一周内就医检查',
      },
      ibs: {
        description:
          '肠易激综合征是一种功能性肠道疾病，症状包括腹痛、腹泻或便秘，与情绪和压力密切相关。',
        suggestions: [
          '调整饮食结构，增加膳食纤维摄入',
          '规律作息，适当运动',
          '放松心情，减轻压力',
          '避免摄入过多咖啡因和酒精',
          '必要时遵医嘱服用解痉药物',
        ],
        urgency: '可在方便时就医咨询',
      },
      gastroenteritis: {
        description:
          '肠胃炎通常由感染引起，症状包括腹泻、呕吐、腹痛，需要注意补充水分。',
        suggestions: [
          '多喝水，防止脱水',
          '避免进食油腻、生冷食物',
          '注意个人卫生，防止传染他人',
          '症状严重时及时就医',
          '遵医嘱服用抗生素或抗病毒药物',
        ],
        urgency: '如果症状持续或加重，需立即就医',
      },
      gerd: {
        description:
          '胃食管反流病是由于胃内容物反流导致的症状，如反酸、烧心等。',
        suggestions: [
          '避免过饱进食，睡前不进食',
          '抬高床头，减少夜间反流',
          '避免辛辣、油腻食物',
          '戒烟戒酒',
          '遵医嘱服用抑酸药物',
        ],
        urgency: '建议在一周内就医检查',
      },
      colitis: {
        description:
          '结肠炎是结肠黏膜的炎症，症状包括腹泻、腹痛、便血等。',
        suggestions: [
          '及时就医进行结肠镜检查',
          '遵医嘱服用抗炎药物',
          '饮食清淡，避免刺激性食物',
          '注意休息，避免过度劳累',
          '定期复查，监测病情',
        ],
        urgency: '建议尽快就医，排除严重疾病',
      },
    };
    return recommendations[type];
  };

  const getDiseaseIcon = (type) => {
    switch (type) {
      case 'gastritis':
        return <Stethoscope className="h-6 w-6 text-blue-500" />;
      case 'gastricUlcer':
        return <Pill className="h-6 w-6 text-red-500" />;
      case 'ibs':
        return <Activity className="h-6 w-6 text-green-500" />;
      case 'gastroenteritis':
        return <Grip className="h-6 w-6 text-purple-500" />;
      case 'gerd':
        return <HeartPulse className="h-6 w-6 text-orange-500" />;
      case 'colitis':
        return <Stethoscope className="h-6 w-6 text-indigo-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          消化系统症状诊断系统
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showResult ? (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <h3 className="font-medium">{question.text}</h3>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        answers[question.id] === option.value
                          ? 'default'
                          : 'outline'
                      }
                      className="w-full justify-start text-left"
                      onClick={() =>
                        handleOptionSelect(question.id, option.value)
                      }
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={() => setShowResult(true)}
              disabled={Object.keys(answers).length < questions.length}
            >
              分析结果
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const posterior = calculatePosterior();
              const { type, probability } = getDiagnosisResult(posterior);
              const result = getRecommendations(type);
              return (
                <>
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>诊断结果（仅供参考）</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                      {getDiseaseIcon(type)}
                      <div>
                        <div className="font-medium">
                          最可能的疾病：
                          {type === 'gastritis'
                            ? '胃炎'
                            : type === 'gastricUlcer'
                            ? '胃溃疡'
                            : type === 'ibs'
                            ? '肠易激综合征'
                            : type === 'gastroenteritis'
                            ? '肠胃炎'
                            : type === 'gerd'
                            ? '胃食管反流病'
                            : '结肠炎'}
                        </div>
                        <div className="text-sm text-gray-500">
                          匹配度：{(probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="font-medium">各疾病概率：</div>
                      {Object.entries(posterior).map(([diseaseType, prob]) => (
                        <div
                          key={diseaseType}
                          className="flex justify-between items-center"
                        >
                          <span>
                            {diseaseType === 'gastritis'
                              ? '胃炎'
                              : diseaseType === 'gastricUlcer'
                              ? '胃溃疡'
                              : diseaseType === 'ibs'
                              ? '肠易激综合征'
                              : diseaseType === 'gastroenteritis'
                              ? '肠胃炎'
                              : diseaseType === 'gerd'
                              ? '胃食管反流病'
                              : '结肠炎'}
                          </span>
                          <div className="flex-1 mx-4">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                          </div>
                          <span>{(prob * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="font-medium">疾病描述：</div>
                      <p className="text-gray-600">{result.description}</p>
                      <div className="font-medium">建议：</div>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                      <div className="font-medium">紧急程度：</div>
                      <p className="text-gray-600">{result.urgency}</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setAnswers({});
                        setShowResult(false);
                      }}
                    >
                      重新诊断
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DigestiveDiagnosis;