// src/components/DoctorsSpeakSheet.jsx
import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PillIcon, AlertTriangleIcon, FlipHorizontal2 } from 'lucide-react';
import articles from '../data/articleList'; // 导入生成的文章列表

const DoctorsSpeakSheet = ({ isOpen, onOpenChange }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="w-full h-[80vh] sm:h-[90vh] overflow-hidden">
        <SheetHeader>
          <SheetTitle>医生有话说</SheetTitle>
          <SheetDescription>
            专业医生分享用药知识和经验
          </SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="lecture" className="w-full h-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lecture" className="flex items-center">
              <PillIcon className="w-4 h-4 mr-2" />
              常用药品讲堂
            </TabsTrigger>
            <TabsTrigger value="misconceptions" className="flex items-center">
              <AlertTriangleIcon className="w-4 h-4 mr-2" />
              常见用药误区
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center">
              <FlipHorizontal2 className="w-4 h-4 mr-2" />
              同类药怎么选
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[calc(100%-2rem)] mt-2">
            <TabsContent value="lecture" className="p-4">
              <h3 className="text-lg font-semibold mb-4">这些基层常用药品你熟悉吗？</h3>
              {/* 渲染动态按钮 */}
              <div className="flex flex-wrap gap-2">
                {articles.map((filename) => {
                  const articleName = filename.replace('.html', '');
                  return (
                    <Button
                      key={filename}
                      asChild
                      variant="outline"
                      size="lg"
                      className="text-black-500 text-sm font-semibold"
                    >
                      <a href={`/article/${filename}`} target="_blank" rel="noopener noreferrer">
                        {articleName}
                      </a>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="misconceptions" className="p-4">
              <h3 className="text-lg font-semibold mb-4">常见用药误区</h3>
              {/* 在这里添加常见用药误区的内容 */}
            </TabsContent>
            <TabsContent value="comparison" className="p-4">
              <h3 className="text-lg font-semibold mb-4">同类药怎么选</h3>
              {/* 在这里添加同类药比较的内容 */}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default DoctorsSpeakSheet;
