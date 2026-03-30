import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ThermometerSnowflake, Thermometer, Stethoscope, PillIcon } from 'lucide-react';

const ColdDiagnosis = () => {
  // 定义初始状态
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  
  // 贝叶斯先验概率
  const priors = {
    windCold: 0.3,    // 风寒感冒
    windHeat: 0.3,    // 风热感冒
    common: 0.25,     // 普通感冒
    flu: 0.15         // 流感
  };

  // 诊断问题列表
  const questions = [
    {
      id: 'fever',
      text: '体温情况？',
      options: [
        { value: 'no_fever', text: '没有发烧（37.3℃以下）', 
          impacts: { windCold: 1.8, windHeat: 0.5, common: 1.5, flu: 0.3 } },
        { value: 'low_fever', text: '低烧（37.3-38℃）', 
          impacts: { windCold: 1.2, windHeat: 1.5, common: 1.8, flu: 1.2 } },
        { value: 'high_fever', text: '高烧（38℃以上）', 
          impacts: { windCold: 0.3, windHeat: 1.8, common: 0.5, flu: 2.5 } }
      ]
    },
    {
      id: 'onset',
      text: '发病速度？',
      options: [
        { value: 'gradual', text: '逐渐发病', 
          impacts: { windCold: 1.5, windHeat: 1.5, common: 2.0, flu: 0.4 } },
        { value: 'rapid', text: '急剧发病', 
          impacts: { windCold: 0.8, windHeat: 1.2, common: 0.5, flu: 2.5 } }
      ]
    },
    {
      id: 'symptoms',
      text: '主要不适症状？',
      options: [
        { value: 'fear_cold', text: '怕冷、无汗', 
          impacts: { windCold: 2.5, windHeat: 0.3, common: 1.0, flu: 0.8 } },
        { value: 'fear_heat', text: '怕热、有汗', 
          impacts: { windCold: 0.3, windHeat: 2.5, common: 0.8, flu: 1.2 } },
        { value: 'mild', text: '轻微不适', 
          impacts: { windCold: 0.8, windHeat: 0.8, common: 2.5, flu: 0.5 } },
        { value: 'severe', text: '全身严重不适', 
          impacts: { windCold: 0.5, windHeat: 0.5, common: 0.3, flu: 2.5 } }
      ]
    },
    {
      id: 'throat',
      text: '咽喉症状？',
      options: [
        { value: 'slight_pain', text: '轻微咽痛', 
          impacts: { windCold: 1.2, windHeat: 1.0, common: 2.0, flu: 1.0 } },
        { value: 'severe_pain', text: '明显咽痛', 
          impacts: { windCold: 0.5, windHeat: 2.5, common: 0.8, flu: 1.2 } },
        { value: 'itchy', text: '咽痒、干燥', 
          impacts: { windCold: 1.8, windHeat: 0.8, common: 1.5, flu: 0.8 } }
      ]
    },
    {
      id: 'nasal',
      text: '鼻部症状？',
      options: [
        { value: 'clear_mucus', text: '清水样涕', 
          impacts: { windCold: 2.5, windHeat: 0.5, common: 1.5, flu: 1.0 } },
        { value: 'yellow_mucus', text: '黄浊鼻涕', 
          impacts: { windCold: 0.5, windHeat: 2.5, common: 1.0, flu: 1.2 } },
        { value: 'stuffy', text: '鼻塞为主', 
          impacts: { windCold: 1.0, windHeat: 1.0, common: 2.0, flu: 1.0 } }
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
      windCold: {
        description: '风寒感冒的典型特征是畏寒重、发热轻，常见症状有打喷嚏、流清涕、怕冷等。',
        suggestions: [
          '注意保暖，避免受凉',
          '可服用姜茶、红糖姜水',
          '推荐使用疏风散寒类药物',
          '多休息，保持室内通风'
        ]
      },
      windHeat: {
        description: '风热感冒的典型特征是发热重、畏寒轻，常见症状有咽喉肿痛、口干、黄浊鼻涕等。',
        suggestions: [
          '适当清淡饮食',
          '多饮温水',
          '推荐使用疏风清热类药物',
          '避免辛辣刺激性食物'
        ]
      },
      common: {
        description: '普通感冒症状相对较轻，一般为季节交替时的适应性反应。',
        suggestions: [
          '保持充足休息',
          '多补充维生素C',
          '保持室内通风',
          '可服用一般感冒药'
        ]
      },
      flu: {
        description: '流行性感冒症状较重，起病急，全身症状明显，具有传染性。',
        suggestions: [
          '及时就医诊治',
          '隔离休息',
          '多喝温水',
          '遵医嘱服药治疗'
        ]
      }
    };
    return recommendations[type];
  };

  const getColdIcon = (type) => {
    switch(type) {
      case 'windCold':
        return <ThermometerSnowflake className="h-6 w-6 text-blue-500" />;
      case 'windHeat':
        return <Thermometer className="h-6 w-6 text-red-500" />;
      case 'common':
        return <Stethoscope className="h-6 w-6 text-green-500" />;
      case 'flu':
        return <PillIcon className="h-6 w-6 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">感冒类型诊断系统</CardTitle>
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
                      variant={answers[question.id] === option.value ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => handleOptionSelect(question.id, option.value)}
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
                      {getColdIcon(type)}
                      <div>
                        <div className="font-medium">
                          最可能的类型：
                          {type === 'windCold' ? '风寒感冒' :
                           type === 'windHeat' ? '风热感冒' :
                           type === 'common' ? '普通感冒' : '流行性感冒'}
                        </div>
                        <div className="text-sm text-gray-500">
                          匹配度：{(probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="font-medium">各类型概率：</div>
                      {Object.entries(posterior).map(([coldType, prob]) => (
                        <div key={coldType} className="flex justify-between items-center">
                          <span>
                            {coldType === 'windCold' ? '风寒感冒' :
                             coldType === 'windHeat' ? '风热感冒' :
                             coldType === 'common' ? '普通感冒' : '流行性感冒'}
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
                      <div className="font-medium">症状描述：</div>
                      <p className="text-gray-600">{result.description}</p>
                      <div className="font-medium">建议：</div>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
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

export default ColdDiagnosis;