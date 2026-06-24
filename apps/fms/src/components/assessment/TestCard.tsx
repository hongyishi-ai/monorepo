import type { FmsTest } from '@/data/fms-tests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { DemoFloatingButton } from '@/components/ui/demo-floating-button';

// 测试ID到GIF文件名的映射 - 与demo-floating-button保持一致
const TEST_DEMO_MAPPING: Record<string, string> = {
  'deep-squat': 'DS.gif',
  'hurdle-step': 'HS.gif',
  'inline-lunge': 'ILL.gif',
  'shoulder-mobility': 'SM.gif',
  'trunk-stability-push-up': 'TSPU.gif',
  'active-straight-leg-raise': 'ASLP.gif',
  'rotary-stability': 'RS.gif',
  'shoulder-impingement-clearance': 'SIC.gif',
  'spinal-flexion-clearance': 'SFC.gif',
  'spinal-extension-clearance': 'SEC.gif'
};

const demoAssetUrl = (fileName: string) => `${import.meta.env.BASE_URL}demo/${fileName}`;

interface TestCardProps {
  test: FmsTest;
}

const TestCard = ({ test }: TestCardProps) => {
  const isClearanceTest = test.isClearanceTest;

  return (
    <>
      <Card className="hys-card" data-tour-id="assessment-test-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isClearanceTest ? (
              <AlertTriangle className="w-5 h-5 text-primary" />
            ) : (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
            {test.name}
          </CardTitle>
          <CardDescription>
            {test.description}
            {isClearanceTest && (
              <div className="hys-inline-alert mt-3 p-3 text-sm">
                <strong>注意：</strong>这是一项排除性测试，用于检查是否存在需要专业医疗评估的问题。
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        {/* 桌面版：完整的演示区域和执行步骤 */}
        <CardContent className="hidden md:grid md:grid-cols-2 gap-4 md:gap-6">
          {/* 左侧：视频区域 */}
          <div className="aspect-video overflow-hidden border-2 border-border bg-muted">
            {TEST_DEMO_MAPPING[test.id] ? (
              <div className="w-full h-full relative">
                <img 
                  src={demoAssetUrl(TEST_DEMO_MAPPING[test.id])}
                  alt={`${test.name} 动作演示`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* 播放控制提示 */}
                <div className="absolute bottom-2 right-2 border border-white/50 bg-black/70 px-2 py-1 text-xs font-bold text-white">
                  GIF 演示
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  {isClearanceTest ? (
                    <>
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-primary">排除测试演示</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-muted-foreground">动作演示区域</p>
                    </>
                  )}
                </div>
                              </div>
              )}
          </div>

          {/* 右侧：说明 */}
          <div>
            <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
              执行步骤：
              {isClearanceTest && (
                  <span className="border-2 border-primary bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                  安全第一
                </span>
              )}
            </h2>
            <ul className="list-decimal list-inside space-y-1 mb-4">
              {test.instructions.map((step, index) => (
                <li key={index} className="text-sm leading-relaxed">{step}</li>
              ))}
            </ul>

            {isClearanceTest && (
              <div className="hys-inline-alert mt-4 p-3">
                <h4 className="font-medium text-amber-800 mb-1">重要提示：</h4>
                <p className="text-sm text-amber-700">
                  如果此测试未通过（出现疼痛），请立即停止后续相关测试，并咨询专业医疗人员。
                </p>
              </div>
            )}
          </div>
        </CardContent>


      </Card>
      
      {/* 移动端悬浮演示按钮 */}
      <DemoFloatingButton test={test} />
    </>
  );
};

export default TestCard; 
