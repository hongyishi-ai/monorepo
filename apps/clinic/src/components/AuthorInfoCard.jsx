// src/components/AuthorInfoCard.jsx

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
{/*import { Linkedin } from "lucide-react";*/}
import { Mail, X } from "lucide-react";
import { Sheet, SheetContent } from "./ui/sheet"; // 假设使用 Sheet 组件作为弹出层

const AuthorInfoCard = ({ isOpen, onClose }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-4">
        {/* 仅保留一个关闭按钮 */}
        <Card>
          <CardHeader className="flex flex-row items-center jusify-center gap-4">
            <Avatar className="w-32 h-32">
              {/* 引入 JPEG 头像 */}
              <AvatarImage src="/images/author.jpg" alt="作者" className="object-cover rounded-full" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold pb-1">张文钊</CardTitle>
                <CardDescription className="text-base">
                  医学学士 & 药学硕士
                </CardDescription>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="secondary">自学生物信息学</Badge>
                  <Badge variant="secondary">自学软件开发</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-2">近期工作重点</h3>
              <p className="text-muted-foreground">
                红医师基层用药辅助系统的开发和部署
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold mb-2">研究方向</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>脓毒症抗炎免疫药理学</li>
                <li>CD4+T细胞免疫</li>
                <li>胶质瘤巨噬细胞免疫</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold mb-2">主要论文</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <a
                    href="https://ccforum.biomedcentral.com/articles/10.1186/s13054-024-05099-4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Lymphopenia in sepsis: a narrative review. <i>Critical Care</i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.sciencedirect.com/science/article/abs/pii/S1567576924006052"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    EFHD2 regulates T cell receptor signaling and modulates T helper cell activation in early sepsis. <i>Int Immunopharmacol</i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.sciencedirect.com/science/article/pii/S0888754323001465"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Clinical characterization of EFHD2 (swiprosin-1) in Glioma-associated macrophages and its role in regulation of immunosuppression. <i>Genomics</i>
                  </a>
                </li>
                <li>
                  <a
                    href="https://rs.yiigle.com/cmaid/1356479"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    脓毒症免疫抑制相关效应T细胞亚群稳态失衡的研究进展. <i>中华危重病急救医学</i>
                  </a>
                </li>
              </ul>
            </section>
            
            <section className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/*<div className="flex space-x-4">
              
                <Button variant="outline" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button> 
              </div>*/}
              <Button variant="default">
                <Mail className="mr-2 h-4 w-4" />
                联系方式: nimrod1990@163.com
              </Button>
            </section>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
};

export default AuthorInfoCard;