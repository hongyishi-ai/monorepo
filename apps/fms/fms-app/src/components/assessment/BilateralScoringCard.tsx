import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AsymmetryAlert } from '@/components/ui/asymmetry-alert';
import { PainAlert } from '@/components/ui/pain-alert';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FmsTest } from '@/data/fms-tests';
import { calculateAsymmetryScore, getAsymmetryRiskAssessment } from '@/data/fms-tests';

interface BilateralScoringCardProps {
  test: FmsTest;
  onScoreSubmit: (scores: { left: number; right: number; final: number; asymmetryData: any }) => void;
  initialScores?: { left?: number; right?: number };
}

const BilateralScoringCard: React.FC<BilateralScoringCardProps> = ({
  test,
  onScoreSubmit,
  initialScores = {}
}) => {
  const [leftScore, setLeftScore] = useState<number | null>(initialScores.left ?? null);
  const [rightScore, setRightScore] = useState<number | null>(initialScores.right ?? null);
  const [showAsymmetryAlert, setShowAsymmetryAlert] = useState(false);
  const [showPainAlert, setShowPainAlert] = useState(false);
  const [alertKey, setAlertKey] = useState(0); // 用于重新触发Alert

  // 计算不对称性数据
  const asymmetryData = leftScore !== null && rightScore !== null 
    ? calculateAsymmetryScore(leftScore, rightScore)
    : null;

  // 获取风险评估
  const riskAssessment = asymmetryData && asymmetryData.hasAsymmetry
    ? getAsymmetryRiskAssessment(asymmetryData.asymmetryLevel, test.name)
    : null;

  // 检查疼痛状态
  const hasPain = leftScore === 0 || rightScore === 0;
  const painSide = leftScore === 0 && rightScore === 0 ? 'bilateral' : 
                   leftScore === 0 ? 'left' : 
                   rightScore === 0 ? 'right' : null;

  // 监听疼痛变化，触发PainAlert
  useEffect(() => {
    if (hasPain && leftScore !== null && rightScore !== null) {
      // 延迟显示疼痛Alert
      const timer = setTimeout(() => {
        setShowPainAlert(true);
        setAlertKey(prev => prev + 1);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowPainAlert(false);
    }
  }, [hasPain, leftScore, rightScore]);

  // 监听不对称性变化，触发Alert提醒 - 修复：疼痛时不显示
  useEffect(() => {
    if (asymmetryData && asymmetryData.hasAsymmetry && !hasPain) {
      // 延迟一点显示Alert，让用户看到评分结果
      const timer = setTimeout(() => {
        setShowAsymmetryAlert(true);
        setAlertKey(prev => prev + 1); // 更新key以重新触发动画
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowAsymmetryAlert(false);
    }
  }, [asymmetryData?.hasAsymmetry, asymmetryData?.asymmetryLevel, hasPain]);

  // 处理Alert关闭
  const handleAsymmetryAlertDismiss = () => {
    setShowAsymmetryAlert(false);
  };

  const handlePainAlertDismiss = () => {
    setShowPainAlert(false);
  };

  // 手动提交函数
  const handleSubmit = () => {
    if (leftScore !== null && rightScore !== null && asymmetryData) {
      // 整合asymmetryData和riskAssessment数据
      const completeAsymmetryData = {
        ...asymmetryData,
        ...(riskAssessment && {
          title: riskAssessment.title,
          description: riskAssessment.description,
          recommendations: riskAssessment.recommendations,
          priority: riskAssessment.priority
        })
      };
      
      onScoreSubmit({
        left: leftScore,
        right: rightScore,
        final: asymmetryData.finalScore,
        asymmetryData: completeAsymmetryData
      });
    }
  };

  const renderScoreButton = (score: number, side: 'left' | 'right') => {
    const currentScore = side === 'left' ? leftScore : rightScore;
    const isSelected = currentScore === score;

    return (
      <Button
        key={`${side}-${score}`}
        onClick={() => side === 'left' ? setLeftScore(score) : setRightScore(score)}
        variant={isSelected ? 'default' : 'outline'}
        className={cn(
          "h-auto p-3 text-left brooklyn-button transition-all duration-200 flex flex-col items-center gap-1",
          score === 0 && "border-red-200 hover:border-red-300",
          isSelected && score === 0 && "bg-red-500 hover:bg-red-600 text-white",
          isSelected && score !== 0 && "bg-primary text-primary-foreground"
        )}
        aria-label={`${side === 'left' ? '左侧' : '右侧'}评分${score}分`}
      >
        <div className={cn(
          "text-lg font-bold",
          isSelected && score === 0 ? "text-white" : 
          score === 0 ? "text-red-600" : 
          isSelected ? "text-primary-foreground" : "text-foreground"
        )}>
          {score}
        </div>
        <div className={cn(
          "text-xs text-center leading-tight",
          isSelected ? "text-current" : "text-muted-foreground"
        )}>
          {test.isClearanceTest ? (
            score === 0 ? "疼痛" : "通过"
          ) : (
            score === 0 ? "疼痛" : 
            score === 1 ? "无法" : 
            score === 2 ? "代偿" : 
            "完美"
          )}
        </div>
      </Button>
    );
  };

  const getSideInstructions = (testId: string) => {
    const instructions = {
      'hurdle-step': {
        left: '以左腿为支撑腿，右腿跨栏',
        right: '以右腿为支撑腿，左腿跨栏'
      },
      'inline-lunge': {
        left: '左腿在前，右腿在后',
        right: '右腿在前，左腿在后'
      },
      'shoulder-mobility': {
        left: '左手在上，右手在下',
        right: '右手在上，左手在下'
      },
      'active-straight-leg-raise': {
        left: '抬高左腿，右腿保持贴地',
        right: '抬高右腿，左腿保持贴地'
      },
      'rotary-stability': {
        left: '左侧同侧支撑（左手左腿）',
        right: '右侧同侧支撑（右手右腿）'
      },
      'shoulder-impingement-clearance': {
        left: '测试左侧肩部',
        right: '测试右侧肩部'
      }
    };
    return instructions[testId as keyof typeof instructions] || { left: '左侧测试', right: '右侧测试' };
  };

  const sideInstructions = getSideInstructions(test.id);

  return (
    <>
      {/* 疼痛Alert提醒 - 浮动式设计 */}
      {hasPain && painSide && (
        <PainAlert
          key={`pain-${alertKey}`}
          isVisible={showPainAlert}
          testName={test.name.split(' (')[0]}
          painSide={painSide}
          onDismiss={handlePainAlertDismiss}
          autoHideDuration={10000} // 疼痛Alert显示时间更长
        />
      )}

      {/* 不对称性风险Alert提醒 - 修复：当存在疼痛时不显示，避免DOM冲突 */}
      {asymmetryData && 
       asymmetryData.hasAsymmetry && 
       asymmetryData.asymmetryLevel !== 'none' &&
       !hasPain && // 简化：直接使用hasPain变量
       (
        <AsymmetryAlert
          key={`asymmetry-${alertKey}`}
          isVisible={showAsymmetryAlert}
          asymmetryLevel={asymmetryData.asymmetryLevel as 'severe' | 'moderate' | 'mild'}
          riskLevel={asymmetryData.riskLevel}
          testName={test.name.split(' (')[0]}
          leftScore={leftScore!}
          rightScore={rightScore!}
          finalScore={asymmetryData.finalScore}
          recommendations={riskAssessment?.recommendations || []}
          onDismiss={handleAsymmetryAlertDismiss}
          autoHideDuration={
            asymmetryData.riskLevel === 'high' ? 8000 :
            asymmetryData.riskLevel === 'medium' ? 6000 :
            4000
          }
        />
      )}
      
      <ContainerWithIcon
        icon={ArrowLeftRight}
        iconColor="text-primary"
        iconSize="xl"
        iconPosition="top-right"
        iconOpacity={0.08}
        as={Card}
        className="brooklyn-card"
      >
        <CardContent className="p-4 md:p-8">
          {/* 标题区域 - 简化 */}
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl font-normal">左右侧分别评分</h2>
            <p className="brooklyn-text text-sm mt-2">分别对左右两侧进行评分，系统将自动取较低分数</p>
          </div>

          {/* 双侧评分区域 - 重新设计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-6 md:mb-8">
            {/* 左侧评分 */}
            <div className="space-y-4">
              {/* 左侧标题 - 简化设计 */}
              <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-medium text-blue-600">左侧</span>
                </div>
                <div className="text-sm brooklyn-text text-blue-700">
                  {sideInstructions.left}
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                {test.scoringCriteria.map(({ score }) => renderScoreButton(score, 'left'))}
              </div>
            </div>

            {/* 右侧评分 */}
            <div className="space-y-4">
              {/* 右侧标题 - 简化设计 */}
              <div className="flex items-center gap-3 pb-3 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-green-600">右侧</span>
                  <ChevronRight className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm brooklyn-text text-green-700">
                  {sideInstructions.right}
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                {test.scoringCriteria.map(({ score }) => renderScoreButton(score, 'right'))}
              </div>
            </div>
          </div>

          {/* 确认提交按钮 */}
          {leftScore !== null && rightScore !== null && asymmetryData && (
            <div className="text-center">
              <Button 
                onClick={handleSubmit}
                size="lg"
                className="brooklyn-button px-8 py-3"
              >
                确认评分并继续下一项测试
              </Button>
            </div>
          )}
        </CardContent>
      </ContainerWithIcon>
    </>
  );
};

export default BilateralScoringCard; 