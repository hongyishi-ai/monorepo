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

interface TestCardProps {
  test: FmsTest;
}

const TestCard = ({ test }: TestCardProps) => {
  const isClearanceTest = test.isClearanceTest;

  return (
    <>
      <Card className={isClearanceTest ? 'border-amber-200 bg-amber-50/30' : 'border-blue-200 bg-blue-50/30'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isClearanceTest ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
            {test.name}
          </CardTitle>
          <CardDescription>
            {test.description}
            {isClearanceTest && (
              <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded text-amber-800 text-sm">
                <strong>注意：</strong>这是一项排除性测试，用于检查是否存在需要专业医疗评估的问题。
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        {/* 桌面版：完整的演示区域和执行步骤 */}
        <CardContent className="hidden md:grid md:grid-cols-2 gap-4 md:gap-6">
          {/* 左侧：视频区域 */}
          <div className={`aspect-video rounded-md overflow-hidden ${
            isClearanceTest ? 'bg-amber-100 border border-amber-200' : 'bg-gray-200 border border-gray-300'
          }`}>
            {TEST_DEMO_MAPPING[test.id] ? (
              <div className="w-full h-full relative">
                <img 
                  src={`/demo/${TEST_DEMO_MAPPING[test.id]}`}
                  alt={`${test.name} 动作演示`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* 播放控制提示 */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  GIF演示
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  {isClearanceTest ? (
                    <>
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-amber-600">排除测试演示</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-gray-500">动作演示区域</p>
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
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
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
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
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
