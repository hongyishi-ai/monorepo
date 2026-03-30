import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { EDUCATION_CONTENT } from "@/data/education-content";
import { BookOpen, Brain, Activity } from "lucide-react";

const EducationPage = () => {
  // 将教育内容按类别分组
  const basicContent = EDUCATION_CONTENT.filter(item => 
    item.question.includes('什么是') || 
    item.question.includes('基础') ||
    item.question.includes('原理')
  );
  
  const scoringContent = EDUCATION_CONTENT.filter(item => 
    item.question.includes('评分') || 
    item.question.includes('标准') ||
    item.question.includes('分数')
  );
  
  const applicationContent = EDUCATION_CONTENT.filter(item => 
    !basicContent.includes(item) && !scoringContent.includes(item)
  );

  const ContentSection = ({ 
    title, 
    description, 
    icon: Icon, 
    items, 
    accentColor 
  }: {
    title: string,
    description: string,
    icon: any,
    items: typeof EDUCATION_CONTENT,
    accentColor: string
  }) => (
    <div className="mb-20">
              <div className="text-center mb-12 md:mb-16">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${accentColor} flex items-center justify-center`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="brooklyn-title text-xl md:text-2xl mb-4">{title}</h2>
          <p className="brooklyn-subtitle max-w-3xl mx-auto">{description}</p>
        </div>
      
      <Card className="brooklyn-card">
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem value={item.id} key={item.id} className="border-b border-border last:border-0">
                <AccordionTrigger className="px-6 md:px-8 py-6 text-left hover:no-underline hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="brooklyn-text w-8 text-sm md:text-base">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-base md:text-lg font-normal">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 md:px-8 pb-8">
                  <div className="pl-8 md:pl-12">
                    <div className="brooklyn-text whitespace-pre-line leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="brooklyn-section">
      <div className="brooklyn-container max-w-6xl">
        {/* 页面标题 */}
        <div className="text-center mb-16 md:mb-20 minimal-fade-in">
          <h1 className="brooklyn-title">FMS 知识库</h1>
          <p className="brooklyn-subtitle max-w-3xl mx-auto mt-6">
            深入了解功能性动作筛查的理论基础、评分标准和实际应用，
            <br className="hidden sm:inline" />
            为您的评估和训练提供科学依据。
          </p>
        </div>

        {/* 基础理论部分 */}
        <div>
          <ContentSection
            title="基础理论"
            description="了解FMS的核心概念、科学原理和理论基础"
            icon={Brain}
            items={basicContent}
            accentColor="bg-primary/10 text-primary"
          />

          {/* 评分标准部分 */}
          <ContentSection
            title="评分标准"
            description="掌握准确的评分方法和判断标准"
            icon={BookOpen}
            items={scoringContent}
            accentColor="bg-blue-100 text-blue-600"
          />
        </div>

        {/* 应用指导部分 */}
                  <div>
          <ContentSection
            title="应用指导"
            description="学习如何正确执行测试和解读结果"
            icon={Activity}
            items={applicationContent}
            accentColor="bg-green-100 text-green-600"
          />
        </div>

        {/* 学习建议 */}
        <Card className="brooklyn-card bg-accent/20 border-accent/30">
          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-6 md:space-y-8">
              <h3 className="text-xl md:text-2xl font-normal">学习建议</h3>
              <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">1</span>
                  </div>
                  <h4 className="font-medium mb-2 text-lg">先学理论</h4>
                  <p className="brooklyn-text">
                    建议先学习基础理论，理解FMS的科学原理
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">2</span>
                  </div>
                  <h4 className="font-medium mb-2 text-lg">掌握评分</h4>
                  <p className="brooklyn-text">
                    熟练掌握各项测试的评分标准和判断方法
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">3</span>
                  </div>
                  <h4 className="font-medium mb-2 text-lg">实践应用</h4>
                  <p className="brooklyn-text">
                    将所学知识应用到实际测试和训练中
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EducationPage; 