import { Card, CardContent } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface RadarChartData {
  subject: string;
  基础测试: number;
  最大分值: number;
  fullMark: number;
}

interface ScoreRadarChartProps {
  radarData: RadarChartData[];
}

/**
 * 分数雷达图组件
 * 
 * 遵循React哲学：
 * - 单一职责：专门负责分数可视化
 * - 纯函数：基于props渲染图表，无副作用
 * - 组合：可与其他可视化组件组合使用
 * - 响应式：自适应容器大小
 */
export const ScoreRadarChart = ({
  radarData
}: ScoreRadarChartProps) => {
  
  // 检查是否有有效数据 - 遵循"条件渲染"原则
  const hasData = radarData && radarData.length > 0;
  
  if (!hasData) {
    return (
      <Card className="brooklyn-card">
        <CardContent className="px-4 md:px-6 py-8 md:py-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="brooklyn-text">暂无可视化数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="brooklyn-card mb-16 md:mb-20">
      <CardContent className="px-4 md:px-6 py-8 md:py-12" role="region" aria-label="动作模式分析雷达图">
        <div className="text-center mb-12">
          <h2 className="brooklyn-title text-2xl mb-4">动作模式分析图表</h2>
          <p className="brooklyn-subtitle">
            各项基础测试得分的雷达图分析，直观显示运动功能强弱项分布
          </p>
        </div>

        {/* 雷达图容器 */}
        <div className="h-96 w-full mb-8" role="img" aria-label="各基础测试分数与满分对比的雷达图">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid className="opacity-20" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                className="text-xs"
              />
              <PolarRadiusAxis 
                domain={[0, 3]} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                angle={90}
                tickCount={4}
                tickFormatter={(value: number) => value.toString()}
              />
              <Radar
                name="基础测试"
                dataKey="基础测试"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Radar
                name="最大分值"
                dataKey="最大分值"
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 图例说明 */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full opacity-50"></div>
            <span className="text-sm brooklyn-text">当前得分</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gray-300 border-dashed border-gray-400"></div>
            <span className="text-sm brooklyn-text">满分参考</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 