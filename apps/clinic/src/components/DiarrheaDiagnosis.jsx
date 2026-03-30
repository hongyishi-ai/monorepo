import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const DiarrheaDiagnosis = () => {
  // 定义初始状态
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  
  // 贝叶斯先验概率
  const priors = {
    food: 0.7,    // 食物因素
    infection: 0.5, // 感染因素
    emotion: 0.3,   // 情绪因素
  };

  // 诊断问题列表
  const questions = [
    {
      id: 'timing',
      text: '症状出现的时间？',
      options: [
        { value: 'after_meal', text: '进食后2-6小时内', impacts: { food: 2.0, infection: 1.0, emotion: 0.8 } },
        { value: 'morning', text: '清晨起床后', impacts: { food: 0.8, infection: 1.2, emotion: 1.5 } },
        { value: 'random', text: '随机时间', impacts: { food: 1.0, infection: 1.2, emotion: 1.0 } }
      ]
    },
    {
      id: 'meal_history',
      text: '最近24小时内是否有以下饮食情况？',
      options: [
        { value: 'street_food', text: '食用了街边小食/烧烤', impacts: { food: 2.5, infection: 1.2, emotion: 0.7 } },
        { value: 'normal_diet', text: '正常饮食', impacts: { food: 0.6, infection: 1.0, emotion: 1.2 } },
        { value: 'new_restaurant', text: '在新餐馆就餐', impacts: { food: 1.8, infection: 1.1, emotion: 0.9 } }
      ]
    },
    {
      id: 'surrounding',
      text: '周围人是否有类似症状？',
      options: [
        { value: 'yes', text: '有人出现类似症状', impacts: { food: 1.5, infection: 2.5, emotion: 0.5 } },
        { value: 'no', text: '没有人出现类似症状', impacts: { food: 0.9, infection: 0.6, emotion: 1.3 } }
      ]
    },
    {
      id: 'stress',
      text: '最近是否有压力事件？',
      options: [
        { value: 'high_stress', text: '有重大压力事件', impacts: { food: 0.7, infection: 0.8, emotion: 2.5 } },
        { value: 'normal', text: '正常生活压力', impacts: { food: 1.0, infection: 1.0, emotion: 1.0 } },
        { value: 'no_stress', text: '没有特别压力', impacts: { food: 1.2, infection: 1.2, emotion: 0.5 } }
      ]
    }
  ];

  // 计算后验概率
  const calculatePosterior = () => {
    let posterior = { ...priors };
    
    // 遍历所有回答
    Object.entries(answers).forEach(([questionId, answerValue]) => {
      const question = questions.find(q => q.id === questionId);
      const option = question.options.find(opt => opt.value === answerValue);
      
      // 更新每个因素的概率
      Object.keys(posterior).forEach(factor => {
        posterior[factor] *= option.impacts[factor];
      });
    });
    
    // 归一化概率
    const total = Object.values(posterior).reduce((sum, val) => sum + val, 0);
    Object.keys(posterior).forEach(key => {
      posterior[key] = (posterior[key] / total);
    });
    
    return posterior;
  };

  // 获取最可能的原因
  const getMostLikelyCause = (posterior) => {
    const sorted = Object.entries(posterior).sort((a, b) => b[1] - a[1]);
    return {
      cause: sorted[0][0],
      probability: sorted[0][1]
    };
  };

  // 处理选项变化
  const handleOptionSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // 获取结果描述
  const getResultDescription = (cause) => {
    const descriptions = {
      food: '最可能是饮食因素导致，建议：\n1. 暂时禁食\n2. 补充水分\n3. 避免刺激性食物',
      infection: '最可能是感染因素导致，建议：\n1. 及时就医\n2. 注意个人卫生\n3. 避免交叉感染',
      emotion: '最可能是情绪因素导致，建议：\n1. 保持心情平和\n2. 规律作息\n3. 适当运动放松'
    };
    return descriptions[cause];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">腹泻原因诊断系统</CardTitle>
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
              const { cause, probability } = getMostLikelyCause(posterior);
              return (
                <>
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <span>诊断结果（仅供参考）</span>
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="font-medium">各因素概率：</div>
                      {Object.entries(posterior).map(([factor, prob]) => (
                        <div key={factor} className="flex justify-between items-center">
                          <span>{factor === 'food' ? '饮食因素' : 
                                 factor === 'infection' ? '感染因素' : '情绪因素'}</span>
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
                    <div className="p-4 bg-gray-100 rounded-lg whitespace-pre-line">
                      {getResultDescription(cause)}
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

export default DiarrheaDiagnosis;