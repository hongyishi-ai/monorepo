import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CardWithIcon, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Clock, Star } from 'lucide-react';
import { useStorage } from '@/hooks/use-storage';
import { FmsGuidePanel, FmsPageHeader } from '@/components/shared/FmsPage';

import { format } from 'date-fns';
import type { AssessmentRecord } from '@/lib/storage';

const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName.replace(/^\/+/, '')}`;

const HomePage = () => {
  const { getLatestAssessment, getStatistics } = useStorage();
  const [latestAssessment, setLatestAssessment] = useState<AssessmentRecord | null>(null);
  const [statistics, setStatistics] = useState<{
    totalAssessments: number;
    starredAssessments: number;
    avgScore: number;
    latestAssessment?: Date;
  }>({
    totalAssessments: 0,
    starredAssessments: 0,
    avgScore: 0,
    latestAssessment: undefined
  });
  const [isLoading, setIsLoading] = useState(true);



  // 确保页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 加载最新评估数据和统计信息
  useEffect(() => {
    const loadData = async () => {
      try {
        const [latest, stats] = await Promise.all([
          getLatestAssessment(),
          getStatistics()
        ]);
        setLatestAssessment(latest || null);
        setStatistics(stats);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getLatestAssessment, getStatistics]);

  return (
    <div className="hys-section">
      <div className="hys-container">
        <FmsPageHeader
          eyebrow="功能性动作筛查"
          title="训练伤防治"
          description={
            <>
              科学评估动作模式，
              <br className="hidden sm:inline" />
              获取个性化改善建议，从评估到训练方案。
            </>
          }
        />

        <FmsGuidePanel
          summary="首次使用建议按评估、报告、训练的顺序完成。"
          steps={[
            { title: '先开始评估', description: '完成 7 项基础测试和 3 项排除测试，记录疼痛、不对称和动作质量。' },
            { title: '再查看报告', description: '确认总分、风险提示、详细评分和需要优先处理的问题。' },
            { title: '最后进入训练', description: '系统会根据评估结果生成分阶段纠正训练，并保留本机历史记录。' },
          ]}
          boundary="评估结果用于训练参考，不替代临床诊断、康复处方或现场专业指导。"
          tourId="home-guide"
        />

        {/* 主要操作区域 - 简洁的两栏布局 */}
        <div className="hys-grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto mb-16 md:mb-24 gap-4 md:gap-6" role="region" aria-label="主要功能入口">
          <Link to="/assessment" className="group" data-tour-id="start-assessment">
            <CardWithIcon 
              // icon={Target} 
              // iconColor="text-primary" 
              // iconSize="xl" 
              // iconPosition="bottom-right" 
              // iconOpacity={0.06}
              backgroundImage={assetUrl('start_test.webp')}
              gradientOverlay="linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 60%, rgba(0,0,0,0) 100%)"
              className="hys-card p-8 md:p-12 text-center h-full hover:scale-[1.02] transition-transform"
            >
              <CardContent className="p-0 relative z-10">
                <div className="mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-normal mb-3 md:mb-4 tracking-wide text-white">开始评估</h2>
                  <p className="hys-text leading-relaxed text-gray-400">
                    七项核心动作测试，
                    <br className="hidden sm:inline" />
                    全面了解身体功能状态。
                  </p>
                </div>
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="mr-2">开始测试</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </CardWithIcon>
          </Link>

          <Link to="/education" className="group" data-tour-id="learn-theory">
            <CardWithIcon 
              // icon={BookOpen} 
              // iconColor="text-blue-600" 
              // iconSize="xl" 
              // iconPosition="bottom-right" 
              // iconOpacity={0.06}
              backgroundImage={assetUrl('learning.webp')}
              gradientOverlay="linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 60%, rgba(0,0,0,0) 100%)"
              className="hys-card p-8 md:p-12 text-center h-full hover:scale-[1.02] transition-transform"
            >
              <CardContent className="p-0 relative z-10">
                <div className="mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-normal mb-3 md:mb-4 tracking-wide text-white">学习理论</h2>
                  <p className="hys-text leading-relaxed text-gray-400">
                    了解FMS评估原理，
                    <br className="hidden sm:inline" />
                    掌握正确的动作要求。
                  </p>
                </div>
                <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="mr-2">开始学习</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </CardWithIcon>
          </Link>
        </div>

        {/* 快速访问链接 */}
        <div className="hys-grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto mb-16 md:mb-24 gap-4 md:gap-6" data-tour-id="quick-access" role="region" aria-label="快速访问">
          <Link to="/history" className="group">
            <CardWithIcon 
              // icon={History} 
              // iconColor="text-blue-600" 
              // iconSize="lg" 
              // iconPosition="top-right" 
              // iconOpacity={0.08}
              backgroundImage={assetUrl('history.webp')}
              gradientOverlay="linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 60%, rgba(0,0,0,0) 100%)"
              className="hys-card p-6 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0 flex items-center gap-4 relative z-10">
                <div>
                  <h3 className="font-medium mb-1 text-white">历史记录</h3>
                  <p className="hys-text text-sm text-gray-400">
                    {!isLoading && statistics.totalAssessments > 0 
                      ? `${statistics.totalAssessments} 条评估记录` 
                      : '查看本地评估记录'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform ml-auto" />
              </CardContent>
            </CardWithIcon>
          </Link>

          <Link to="/training" className="group">
            <CardWithIcon 
              // icon={BarChart3} 
              // iconColor="text-green-600" 
              // iconSize="lg" 
              // iconPosition="top-right" 
              // iconOpacity={0.08}
              backgroundImage={assetUrl('training_plan.webp')}
              gradientOverlay="linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 60%, rgba(0,0,0,0) 100%)"
              className="hys-card p-6 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0 flex items-center gap-4 relative z-10">
                <div>
                  <h3 className="font-medium mb-1 text-white">训练方案</h3>
                  <p className="hys-text text-sm text-gray-400">个性化康复训练指导</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform ml-auto" />
              </CardContent>
            </CardWithIcon>
          </Link>

          <Link to="/report" className="group">
            <CardWithIcon 
              // icon={BarChart3} 
              // iconColor="text-purple-600" 
              // iconSize="lg" 
              // iconPosition="top-right" 
              // iconOpacity={0.08}
              backgroundImage={assetUrl('report.webp')}
              gradientOverlay="linear-gradient(135deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.60) 60%, rgba(0,0,0,0) 100%)"
              className="hys-card p-6 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-0 flex items-center gap-4 relative z-10">
                <div>
                  <h3 className="font-medium mb-1 text-white">查看报告</h3>
                  <p className="hys-text text-sm text-gray-400">详细评估结果分析</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform ml-auto" />
              </CardContent>
            </CardWithIcon>
          </Link>
        </div>

        {/* 最新评估记录展示 */}
        {!isLoading && latestAssessment && (
          <div className="max-w-4xl mx-auto mb-16 md:mb-24" role="region" aria-label="最近评估">
            <h2 className="text-center hys-title text-xl mb-8">最近评估</h2>
            <CardWithIcon 
              // icon={Clock} 
              // iconColor="text-blue-600" 
              // iconSize="lg" 
              // iconPosition="top-right" 
              // iconOpacity={0.08}
              className="hys-card p-6"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium mb-2">{latestAssessment.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(latestAssessment.createdAt, 'yyyy年MM月dd日')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        总分: {latestAssessment.assessmentData.totalScore}/21
                      </div>
                      {latestAssessment.isStarred && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span>已收藏</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/history`}>
                      <Button variant="outline" size="sm">
                        查看详情
                      </Button>
                    </Link>
                    <Link to="/assessment">
                      <Button size="sm">
                        新评估
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </CardWithIcon>
          </div>
        )}

        {/* 系统特色展示 */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-12 mb-12 md:mb-20" data-tour-id="system-features" role="list" aria-label="系统特色">
              <div className="text-center" role="listitem">
                <div className="text-3xl md:text-4xl font-light mb-2 text-primary">7</div>
                <div className="hys-text">项标准测试</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-3xl md:text-4xl font-light mb-2 text-primary">3</div>
                <div className="hys-text">项排除测试</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-3xl md:text-4xl font-light mb-2 text-primary">15</div>
                <div className="hys-text">分钟完成</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-3xl md:text-4xl font-light mb-2 text-primary">实时</div>
                <div className="hys-text">生成报告</div>
              </div>
            </div>
            
            <div className="border-t border-border pt-8 md:pt-12">
              <p className="hys-text max-w-2xl mx-auto leading-relaxed mb-6">
                基于国际标准的专业运动功能筛查工具，
                被广泛应用于运动训练与康复治疗领域。
              </p>
              

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
